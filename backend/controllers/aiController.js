/**
 * AI Controller — uses @google/genai (the current Google Gen AI SDK)
 * with gemini-flash-latest model.
 */
const { GoogleGenAI } = require('@google/genai');
const { v4: uuidv4 } = require('uuid');
const AIRun = require('../models/AIRun');
const ForecastSeries = require('../models/ForecastSeries');
const AnomalyEvent = require('../models/AnomalyEvent');
const Task = require('../models/Task');
const KPISnapshot = require('../models/KPISnapshot');
const { createAuditLog } = require('../middleware/auditLogger');

/* ── Gemini client ─────────────────────────────────────────── */
let _ai = null;

const getAI = () => {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key || key === 'PASTE_YOUR_GEMINI_API_KEY_HERE') {
    throw new Error(
      'GEMINI_API_KEY is not set. Get your key at https://aistudio.google.com/apikey ' +
      'and add it to backend/.env, then restart the server.'
    );
  }
  if (!_ai) _ai = new GoogleGenAI({ apiKey: key });
  return _ai;
};

/* ── Helpers ───────────────────────────────────────────────── */
const callGemini = async (prompt) => {
  const ai = getAI();
  // gemini-flash-latest — uses the latest available Flash model quota
  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest',
    contents: prompt,
  });
  return response.text;
};

const parseGeminiJSON = (text) => {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  return JSON.parse(cleaned);
};

const aiErrorResponse = (res, error, label) => {
  console.error(`[AI ${label.toUpperCase()} ERROR]`, error.message);

  const isQuota = error.message?.includes('429') || error.message?.includes('quota');
  const isKey = error.message?.includes('API_KEY') || error.message?.includes('GEMINI_API_KEY') || error.message?.includes('API key');

  let message;
  if (isKey) message = 'Gemini API key is missing or invalid. Check GEMINI_API_KEY in backend/.env and restart the server.';
  else if (isQuota) message = 'Gemini quota exceeded. Wait a moment and try again, or check your Google AI Studio billing.';
  else message = `${label} failed: ${error.message}`;

  return res.status(isKey ? 503 : isQuota ? 429 : 500).json({
    success: false,
    message,
    error: error.message
  });
};

const failRun = async (runId, message) => {
  try {
    const run = await AIRun.findOne({ runId });
    if (run) { run.status = 'failed'; run.completedAt = new Date(); run.error = { message }; await run.save(); }
  } catch { /* never crash on audit */ }
};

/* ── POST /api/ai/forecast ─────────────────────────────────── */
const generateForecast = async (req, res) => {
  const runId = uuidv4();
  const startedAt = new Date();

  try {
    const { type = 'demand', targetMetric = 'sellThrough', forecastHorizon = 14, filters } = req.body;
    const { organisationId, userId, role } = req.user;

    await AIRun.create({
      runId, type: 'forecast', modelName: 'gemini-flash-latest', modelVersion: 'latest',
      status: 'running', triggeredBy: 'manual', requestedBy: userId,
      startedAt, input: { type, targetMetric, forecastHorizon, filters }, organisationId
    });

    // Fetch historical KPI data
    const historicalData = await KPISnapshot.find({
      organisationId,
      date: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
    }).sort({ date: 1 }).limit(90);

    if (historicalData.length < 5) {
      await failRun(runId, 'Insufficient KPI data.');
      return res.status(400).json({
        success: false,
        message: 'Insufficient historical data. Run `node seed.js` in the backend to populate sample data.'
      });
    }

    const dataPoints = historicalData.slice(-30).map(h => ({
      date: h.date.toISOString().split('T')[0],
      sellThrough: +(h.sellThrough?.value || 0).toFixed(1),
      stockCover: +(h.stockCover?.value || 0).toFixed(1),
      margin: +(h.margin?.value || 0).toFixed(1),
      returnRate: +(h.returnRate?.value || 0).toFixed(1)
    }));

    const prompt = `You are a fashion retail AI. Predict ${targetMetric} for the next ${forecastHorizon} days based on this historical data.
Output ONLY valid JSON, no markdown fences:
{"forecast":[{"date":"YYYY-MM-DD","value":number,"confidence":number}],"confidence":number,"explanation":"2-3 sentences citing observable data patterns","contributingFactors":[{"factor":"string","impact":number,"description":"string"}]}
Historical data (last ${dataPoints.length} days): ${JSON.stringify(dataPoints)}
Metric: ${targetMetric}, Horizon: ${forecastHorizon} days.`;

    const rawText = await callGemini(prompt);
    const aiResponse = parseGeminiJSON(rawText);

    if (!Array.isArray(aiResponse.forecast) || aiResponse.forecast.length === 0) {
      throw new Error('Gemini returned an unexpected format. No forecast array.');
    }

    const forecastSeries = await ForecastSeries.create({
      forecastId: uuidv4(), type, targetMetric,
      forecastHorizon: parseInt(forecastHorizon),
      dataPoints: aiResponse.forecast.map(f => ({
        timestamp: new Date(f.date),
        value: f.value, confidence: f.confidence,
        lowerBound: +(f.value * 0.9).toFixed(2),
        upperBound: +(f.value * 1.1).toFixed(2)
      })),
      generatedAt: new Date(),
      validUntil: new Date(Date.now() + forecastHorizon * 24 * 60 * 60 * 1000),
      modelVersion: 'latest', modelType: 'gemini-flash-latest',
      inputDataSnapshot: {
        startDate: historicalData[0].date,
        endDate: historicalData[historicalData.length - 1].date,
        recordCount: historicalData.length, features: [targetMetric]
      },
      confidence: aiResponse.confidence,
      explanation: aiResponse.explanation,
      contributingFactors: aiResponse.contributingFactors || [],
      filters, status: 'active', organisationId
    });

    await AIRun.findOneAndUpdate({ runId }, {
      status: 'completed', completedAt: new Date(),
      durationMs: Date.now() - startedAt.getTime(),
      output: aiResponse, confidence: aiResponse.confidence,
      explanation: aiResponse.explanation,
      linkedOutputId: forecastSeries.forecastId, reviewStatus: 'auto_approved'
    });

    await createAuditLog({
      action: 'ai_execution', entityType: 'ForecastSeries',
      entityId: forecastSeries.forecastId,
      performedBy: userId, performedByRole: role,
      outcome: 'success', organisationId
    });

    return res.json({
      success: true,
      message: 'Forecast generated successfully.',
      data: { runId, forecast: forecastSeries, confidence: aiResponse.confidence, explanation: aiResponse.explanation }
    });

  } catch (error) {
    await failRun(runId, error.message);
    return aiErrorResponse(res, error, 'Forecast generation');
  }
};

/* ── POST /api/ai/detect-anomalies ─────────────────────────── */
const detectAnomalies = async (req, res) => {
  const runId = uuidv4();
  const startedAt = new Date();

  try {
    const { metric = 'all', timeRange = 30, filters } = req.body;
    const { organisationId, userId, role } = req.user;

    await AIRun.create({
      runId, type: 'anomaly_detection', modelName: 'gemini-flash-latest', modelVersion: 'latest',
      status: 'running', triggeredBy: 'manual', requestedBy: userId,
      startedAt, input: { metric, timeRange, filters }, organisationId
    });

    const recentData = await KPISnapshot.find({
      organisationId,
      date: { $gte: new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000) }
    }).sort({ date: 1 });

    if (recentData.length < 5) {
      await failRun(runId, 'Insufficient data.');
      return res.status(400).json({
        success: false,
        message: 'Insufficient KPI data. Run `node seed.js` to populate sample data.'
      });
    }

    const dataPoints = recentData.slice(-30).map(h => ({
      date: h.date.toISOString().split('T')[0],
      sellThrough: +(h.sellThrough?.value || 0).toFixed(1),
      returnRate: +(h.returnRate?.value || 0).toFixed(1),
      margin: +(h.margin?.value || 0).toFixed(1),
      stockCover: +(h.stockCover?.value || 0).toFixed(1)
    }));

    const prompt = `You are a fashion retail anomaly detection AI. Analyse this ${timeRange}-day KPI data and identify any real anomalies.
Output ONLY valid JSON, no markdown:
{"anomalies":[{"type":"demand_spike|demand_drop|quality_issue|delay|stockout|return_spike|margin_drop|other","severity":"low|medium|high|critical","confidence":number,"affectedMetric":"string","expectedValue":number,"actualValue":number,"deviation":number,"explanation":"string","contributingVariables":[{"variable":"string","impact":number,"description":"string"}]}]}
Data: ${JSON.stringify(dataPoints)}`;

    const rawText = await callGemini(prompt);
    const aiResponse = parseGeminiJSON(rawText);

    const anomalyEvents = [];
    for (const anomaly of (aiResponse.anomalies || [])) {
      const event = await AnomalyEvent.create({
        anomalyId: uuidv4(),
        type: anomaly.type || 'other',
        severity: anomaly.severity || 'medium',
        confidence: anomaly.confidence ?? 0.7,
        detectedAt: new Date(),
        affectedMetric: anomaly.affectedMetric || metric,
        expectedValue: anomaly.expectedValue,
        actualValue: anomaly.actualValue,
        deviation: anomaly.deviation,
        contributingVariables: anomaly.contributingVariables || [],
        explanation: anomaly.explanation || '',
        filters, status: 'new', modelVersion: 'latest',
        inputDataSnapshot: {
          startDate: recentData[0].date,
          endDate: recentData[recentData.length - 1].date,
          recordCount: recentData.length
        },
        organisationId
      });
      anomalyEvents.push(event);
    }

    await AIRun.findOneAndUpdate({ runId }, {
      status: 'completed', completedAt: new Date(),
      durationMs: Date.now() - startedAt.getTime(),
      output: aiResponse, reviewStatus: 'auto_approved'
    });

    await createAuditLog({
      action: 'ai_execution', entityType: 'AnomalyEvent',
      performedBy: userId, performedByRole: role,
      metadata: { runId, count: anomalyEvents.length },
      outcome: 'success', organisationId
    });

    return res.json({
      success: true,
      message: `Detection complete — ${anomalyEvents.length} anomaly(s) found.`,
      data: { runId, anomalies: anomalyEvents }
    });

  } catch (error) {
    await failRun(runId, error.message);
    return aiErrorResponse(res, error, 'Anomaly detection');
  }
};

/* ── POST /api/ai/generate-recommendations ──────────────────── */
const generateRecommendations = async (req, res) => {
  const runId = uuidv4();
  const startedAt = new Date();

  try {
    const {
      context = {},
      problemStatement = 'Identify key operational risks and recommend preventive actions for a fashion retail brand.'
    } = req.body;
    const { organisationId, userId, role } = req.user;

    await AIRun.create({
      runId, type: 'recommendation', modelName: 'gemini-flash-latest', modelVersion: 'latest',
      status: 'running', triggeredBy: 'manual', requestedBy: userId,
      startedAt, input: { context, problemStatement }, organisationId
    });

    const prompt = `You are a fashion operations advisor. Provide 3-5 actionable recommendations.
Output ONLY valid JSON, no markdown:
{"recommendations":[{"title":"string","description":"string","expectedImpact":"string","priority":"low|medium|high|critical","requiresApproval":boolean,"assumptions":["string"],"constraints":["string"]}],"confidence":number,"explanation":"string"}
Problem: ${problemStatement}
Context: ${JSON.stringify(context)}`;

    const rawText = await callGemini(prompt);
    const aiResponse = parseGeminiJSON(rawText);

    const tasks = [];
    for (const rec of (aiResponse.recommendations || [])) {
      const task = await Task.create({
        taskId: uuidv4(),
        title: rec.title,
        description: rec.description,
        type: 'preventive',
        status: 'pending',
        priority: rec.priority || 'medium',
        createdBy: 'ai-system',
        expectedImpact: rec.expectedImpact,
        aiRecommendationId: runId,
        aiGenerated: true,
        requiresApproval: rec.requiresApproval !== false,
        approvalStatus: rec.requiresApproval !== false ? 'pending' : 'approved',
        activityLog: [{ action: 'created_by_ai', performedBy: 'ai-system', timestamp: new Date() }],
        organisationId
      });
      tasks.push(task);
    }

    await AIRun.findOneAndUpdate({ runId }, {
      status: 'completed', completedAt: new Date(),
      durationMs: Date.now() - startedAt.getTime(),
      output: aiResponse, confidence: aiResponse.confidence,
      explanation: aiResponse.explanation, reviewStatus: 'pending_review'
    });

    await createAuditLog({
      action: 'ai_execution', entityType: 'Task',
      performedBy: userId, performedByRole: role,
      metadata: { runId, count: tasks.length },
      outcome: 'success', organisationId
    });

    return res.json({
      success: true,
      message: `${tasks.length} recommendation(s) generated.`,
      data: { runId, recommendations: tasks, confidence: aiResponse.confidence, explanation: aiResponse.explanation }
    });

  } catch (error) {
    await failRun(runId, error.message);
    return aiErrorResponse(res, error, 'Recommendation generation');
  }
};

/* ── GET /api/ai/runs ───────────────────────────────────────── */
const getAIRuns = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const filter = { organisationId: req.user.organisationId };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const total = await AIRun.countDocuments(filter);
    const runs = await AIRun.find(filter)
      .sort({ startedAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    return res.json({
      success: true,
      data: { runs, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch AI runs.', error: error.message });
  }
};

/* ── POST /api/ai/runs/:id/review ───────────────────────────── */
const reviewAIRun = async (req, res) => {
  try {
    const { decision, notes } = req.body;
    const run = await AIRun.findOne({ runId: req.params.id, organisationId: req.user.organisationId });
    if (!run) return res.status(404).json({ success: false, message: 'AI run not found.' });

    run.reviewStatus = decision;
    run.reviewedBy = req.user.userId;
    run.reviewedAt = new Date();
    run.reviewNotes = notes;
    if (decision === 'override') run.overrideReason = notes;
    await run.save();

    await createAuditLog({
      action: `ai_${decision}`, entityType: 'AIRun', entityId: run.runId,
      performedBy: req.user.userId, performedByRole: req.user.role,
      newValue: { decision, notes }, outcome: 'success',
      organisationId: req.user.organisationId
    });

    return res.json({ success: true, message: `AI run ${decision}.`, data: { run } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Review failed.', error: error.message });
  }
};

module.exports = { generateForecast, detectAnomalies, generateRecommendations, getAIRuns, reviewAIRun };
