/**
 * Seed script — creates the initial admin user and default system config.
 * Run once: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const User = require('./models/User');
const SystemConfig = require('./models/SystemConfig');
const KPISnapshot = require('./models/KPISnapshot');
const WorkflowQueue = require('./models/WorkflowQueue');
const Task = require('./models/Task');
const AnomalyEvent = require('./models/AnomalyEvent');
const Notification = require('./models/Notification');

const ORG_ID = 'default-org';

async function seedUsers() {
  const users = [
    { userId: uuidv4(), email: 'admin@fashionbrand.com',   password: 'Admin@123',   firstName: 'Priya',  lastName: 'Sharma',  role: 'Operations Admin' },
    { userId: uuidv4(), email: 'manager@fashionbrand.com', password: 'Manager@123', firstName: 'Raj',    lastName: 'Mehta',   role: 'Manager' },
    { userId: uuidv4(), email: 'analyst@fashionbrand.com', password: 'Analyst@123', firstName: 'Nina',   lastName: 'Kapoor',  role: 'Analyst' },
    { userId: uuidv4(), email: 'staff@fashionbrand.com',   password: 'Staff@123',   firstName: 'Arun',   lastName: 'Iyer',    role: 'Field Staff' },
  ];

  for (const u of users) {
    const exists = await User.findOne({ email: u.email });
    if (!exists) {
      await User.create({ ...u, organisationId: ORG_ID, status: 'active' });
      console.log(`  ✅ Created user: ${u.email} (${u.role})`);
    } else {
      console.log(`  ⏩ User already exists: ${u.email}`);
    }
  }
}

async function seedSystemConfig() {
  const configs = [
    { category: 'threshold', key: 'sellThroughAlert',    value: 65,    dataType: 'number',  description: 'Sell-through % below which an alert is raised' },
    { category: 'threshold', key: 'stockCoverAlert',     value: 14,    dataType: 'number',  description: 'Stock cover days below which an alert is raised' },
    { category: 'threshold', key: 'returnRateAlert',     value: 8,     dataType: 'number',  description: 'Return rate % above which an alert is raised' },
    { category: 'threshold', key: 'marginDropAlert',     value: 35,    dataType: 'number',  description: 'Gross margin % below which an alert is raised' },
    { category: 'sla',       key: 'defaultSLAHours',     value: 48,    dataType: 'number',  description: 'Default SLA hours for workflow items' },
    { category: 'sla',       key: 'criticalSLAHours',    value: 8,     dataType: 'number',  description: 'SLA hours for critical priority items' },
    { category: 'ai',        key: 'forecastEnabled',     value: true,  dataType: 'boolean', description: 'Enable AI-powered demand forecasting' },
    { category: 'ai',        key: 'anomalyDetection',    value: true,  dataType: 'boolean', description: 'Enable AI anomaly detection' },
    { category: 'ai',        key: 'minConfidenceScore',  value: 0.6,   dataType: 'number',  description: 'Minimum AI confidence score to show results' },
    { category: 'ai',        key: 'requireApprovalAbove',value: 0.8,   dataType: 'number',  description: 'Require human approval for AI actions above this confidence' },
    { category: 'notification', key: 'emailEnabled',     value: true,  dataType: 'boolean', description: 'Enable email notifications' },
    { category: 'notification', key: 'inAppEnabled',     value: true,  dataType: 'boolean', description: 'Enable in-app notifications' },
    { category: 'workflow',  key: 'autoSLACheck',        value: true,  dataType: 'boolean', description: 'Automatically check and update SLA status' },
    { category: 'retention', key: 'auditLogRetentionDays', value: 365, dataType: 'number',  description: 'Days to retain audit log entries' },
  ];

  for (const cfg of configs) {
    const exists = await SystemConfig.findOne({ category: cfg.category, key: cfg.key, organisationId: ORG_ID });
    if (!exists) {
      await SystemConfig.create({ configId: uuidv4(), ...cfg, isEditable: true, organisationId: ORG_ID });
      console.log(`  ✅ Config: ${cfg.category}.${cfg.key}`);
    } else {
      console.log(`  ⏩ Config already exists: ${cfg.category}.${cfg.key}`);
    }
  }
}

async function seedKPISnapshots() {
  const count = await KPISnapshot.countDocuments({ organisationId: ORG_ID });
  if (count > 0) { console.log(`  ⏩ KPI snapshots already seeded (${count} records)`); return; }

  const snapshots = [];
  for (let i = 89; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const base = (v, variance) => parseFloat((v + (Math.random() - 0.5) * variance).toFixed(2));
    snapshots.push({
      snapshotId: uuidv4(),
      date,
      period: 'daily',
      sellThrough:          { value: base(68, 10), change: base(0.5, 3) },
      stockCover:           { value: base(24, 5),  change: base(-0.2, 2) },
      sizeAvailability:     { value: base(82, 8),  change: base(0.3, 2) },
      leadTime:             { value: base(38, 6),  change: base(-0.5, 2) },
      margin:               { value: base(42, 6),  change: base(0.1, 2) },
      markdownRate:         { value: base(12, 4),  change: base(-0.2, 1) },
      returnRate:           { value: base(6, 3),   change: base(-0.1, 1) },
      collectionPerformance:{ value: base(74, 8),  change: base(0.8, 3) },
      totalSales:           { value: base(320000, 50000), change: base(2, 10) },
      totalOrders:          { value: base(142, 30),       change: base(1, 5) },
      organisationId: ORG_ID,
    });
  }
  await KPISnapshot.insertMany(snapshots);
  console.log(`  ✅ Seeded ${snapshots.length} KPI daily snapshots`);
}

async function seedWorkflows() {
  const count = await WorkflowQueue.countDocuments({ organisationId: ORG_ID });
  if (count > 0) { console.log(`  ⏩ Workflows already seeded (${count} records)`); return; }

  const adminUser = await User.findOne({ email: 'admin@fashionbrand.com' });
  const managerUser = await User.findOne({ email: 'manager@fashionbrand.com' });

  const now = new Date();
  const dd = (d) => { const dt = new Date(now); dt.setDate(dt.getDate() + d); return dt; };

  const workflows = [
    { title: 'SS25 Collection Trend Planning',       type: 'trend_planning', status: 'in_progress', priority: 'high',     slaStatus: 'at_risk',  dueDate: dd(2),  ownerId: adminUser?.userId || 'u-001' },
    { title: 'Denim Range Sourcing — Supplier RFQ',  type: 'sourcing',       status: 'pending',     priority: 'critical', slaStatus: 'breached', dueDate: dd(-1), ownerId: managerUser?.userId || 'u-002' },
    { title: 'Evening Wear Sampling — Round 2',      type: 'sampling',       status: 'review',      priority: 'high',     slaStatus: 'on_track', dueDate: dd(5),  ownerId: managerUser?.userId || 'u-002' },
    { title: 'End-of-Season Markdown Strategy',      type: 'markdown',       status: 'pending',     priority: 'medium',   slaStatus: 'on_track', dueDate: dd(7),  ownerId: adminUser?.userId || 'u-001' },
    { title: 'Festive Allocation — Metro Stores',    type: 'allocation',     status: 'completed',   priority: 'high',     slaStatus: 'on_track', dueDate: dd(-1), ownerId: managerUser?.userId || 'u-002' },
    { title: 'Winter Replenishment Order',           type: 'replenishment',  status: 'in_progress', priority: 'high',     slaStatus: 'at_risk',  dueDate: dd(3),  ownerId: adminUser?.userId || 'u-001' },
    { title: 'AW25 Design Brief Sign-off',           type: 'design',         status: 'pending',     priority: 'medium',   slaStatus: 'on_track', dueDate: dd(10), ownerId: managerUser?.userId || 'u-002' },
    { title: 'Q3 Production Capacity Planning',      type: 'production',     status: 'in_progress', priority: 'high',     slaStatus: 'on_track', dueDate: dd(14), ownerId: adminUser?.userId || 'u-001' },
    { title: 'Online Returns Processing — Week 32',  type: 'return',         status: 'pending',     priority: 'medium',   slaStatus: 'on_track', dueDate: dd(2),  ownerId: managerUser?.userId || 'u-002' },
    { title: 'Summer Sale Selling Strategy',         type: 'selling',        status: 'completed',   priority: 'high',     slaStatus: 'on_track', dueDate: dd(-3), ownerId: adminUser?.userId || 'u-001' },
  ];

  await WorkflowQueue.insertMany(workflows.map(w => ({
    queueId: uuidv4(), ...w, organisationId: ORG_ID,
    activityHistory: [{ action: 'created', performedBy: w.ownerId, timestamp: new Date() }],
  })));
  console.log(`  ✅ Seeded ${workflows.length} workflow queue items`);
}

async function seedTasks() {
  const count = await Task.countDocuments({ organisationId: ORG_ID });
  if (count > 0) { console.log(`  ⏩ Tasks already seeded (${count} records)`); return; }

  const now = new Date();
  const dd = (d) => { const dt = new Date(now); dt.setDate(dt.getDate() + d); return dt; };

  const tasks = [
    { title: 'Expedite Denim Supplier Delivery',         type: 'preventive', priority: 'critical', status: 'pending',     requiresApproval: true,  approvalStatus: 'pending',  aiGenerated: true,  expectedImpact: 'Prevent 3-day production delay. Revenue at risk: $85,000.' },
    { title: 'Review SS25 T-Shirt Sizing Specification', type: 'corrective', priority: 'high',     status: 'assigned',    requiresApproval: false, approvalStatus: 'approved', aiGenerated: true,  expectedImpact: 'Reduce return rate by ~60% on affected SKUs.' },
    { title: 'Approve Emergency Replenishment PO',       type: 'approval',   priority: 'critical', status: 'pending',     requiresApproval: true,  approvalStatus: 'pending',  aiGenerated: false, expectedImpact: 'Restore stock cover on Floral Dresses to 14-day target.' },
    { title: 'Investigate Margin Drop — Denim Jackets',  type: 'corrective', priority: 'high',     status: 'in_progress', requiresApproval: false, approvalStatus: 'approved', aiGenerated: false, expectedImpact: 'Identify root cause and protect margin on remaining units.' },
    { title: 'Update Markdown Pricing for AW24 Coats',   type: 'manual',     priority: 'medium',   status: 'assigned',    requiresApproval: true,  approvalStatus: 'pending',  aiGenerated: true,  expectedImpact: 'Clear 600 units before season close, recovering $42K.' },
  ];

  const creatorUser = await User.findOne({ email: 'admin@fashionbrand.com' });
  const assigneeUser = await User.findOne({ email: 'manager@fashionbrand.com' });

  await Task.insertMany(tasks.map((t, i) => ({
    taskId: uuidv4(), ...t,
    createdBy: creatorUser?.userId || 'system',
    assignedTo: assigneeUser?.userId,
    dueDate: dd(i + 1),
    activityLog: [{ action: 'created', performedBy: 'ai-system', timestamp: new Date() }],
    organisationId: ORG_ID,
  })));
  console.log(`  ✅ Seeded ${tasks.length} tasks`);
}

async function seedAnomalies() {
  const count = await AnomalyEvent.countDocuments({ organisationId: ORG_ID });
  if (count > 0) { console.log(`  ⏩ Anomalies already seeded (${count} records)`); return; }

  const anomalies = [
    {
      anomalyId: uuidv4(), type: 'return_spike', severity: 'high', confidence: 0.88,
      affectedMetric: 'returnRate', expectedValue: 5.9, actualValue: 14.2, deviation: 8.3,
      explanation: 'Return rate on Casual T-Shirts (SS25) spiked 140% above baseline. Contributing factors: sizing inconsistency in batch B-403 and customer feedback on fabric quality.',
      status: 'new', modelVersion: '1.0',
      contributingVariables: [{ variable: 'Batch B-403 sizing', impact: 0.65, description: 'Measurement deviation of +2cm in chest width.' }, { variable: 'Fabric quality feedback', impact: 0.35, description: '23 customer reviews citing pilling within 2 weeks.' }],
      inputDataSnapshot: { startDate: new Date(Date.now() - 30*86400000), endDate: new Date(), recordCount: 1240 },
    },
    {
      anomalyId: uuidv4(), type: 'demand_spike', severity: 'medium', confidence: 0.76,
      affectedMetric: 'sellThrough', expectedValue: 68, actualValue: 89, deviation: 21,
      explanation: 'Unexpectedly high demand for Floral Midi Dresses following weekend influencer campaign. Stock cover now at 4 days vs 14-day target.',
      status: 'acknowledged', modelVersion: '1.0',
      contributingVariables: [{ variable: 'Social media campaign', impact: 0.72, description: 'Instagram reel with 2.4M views over 48 hours.' }, { variable: 'Seasonal uplift', impact: 0.28, description: 'Pre-festive demand acceleration.' }],
      inputDataSnapshot: { startDate: new Date(Date.now() - 7*86400000), endDate: new Date(), recordCount: 340 },
    },
    {
      anomalyId: uuidv4(), type: 'margin_drop', severity: 'critical', confidence: 0.92,
      affectedMetric: 'margin', expectedValue: 42, actualValue: 28, deviation: -14,
      explanation: 'Gross margin on Denim Jackets declined sharply. Input cost increase of 12% from Supplier INX-203 not reflected in retail pricing.',
      status: 'investigating', modelVersion: '1.0',
      contributingVariables: [{ variable: 'Supplier cost increase', impact: 0.70, description: 'INX-203 raised raw material price by 12% from Batch-Q3.' }, { variable: 'Unplanned markdown', impact: 0.30, description: 'Store teams applied additional 8% discount without approval.' }],
      inputDataSnapshot: { startDate: new Date(Date.now() - 14*86400000), endDate: new Date(), recordCount: 680 },
    },
  ];

  await AnomalyEvent.insertMany(anomalies.map(a => ({ ...a, detectedAt: new Date(), organisationId: ORG_ID })));
  console.log(`  ✅ Seeded ${anomalies.length} anomaly events`);
}

async function seedNotifications() {
  const count = await Notification.countDocuments({ organisationId: ORG_ID });
  if (count > 0) { console.log(`  ⏩ Notifications already seeded (${count} records)`); return; }

  const adminUser = await User.findOne({ email: 'admin@fashionbrand.com' });
  if (!adminUser) return;

  const notifications = [
    { title: 'Critical Anomaly Detected',        message: 'Return rate spike on SS25 T-Shirts requires immediate review.', type: 'alert',      severity: 'critical', urgent: true  },
    { title: 'Task Assigned to You',             message: 'Review SS25 T-Shirt Sizing Specification has been assigned to you.', type: 'assignment', severity: 'warning', urgent: false },
    { title: 'SLA Breach — Sourcing Workflow',   message: 'Denim Range Sourcing is past its SLA deadline.', type: 'alert',      severity: 'critical', urgent: true  },
    { title: 'AI Forecast Ready',                message: 'Demand forecast for the next 14 days generated with 87% confidence.', type: 'ai_result',  severity: 'info',    urgent: false },
    { title: 'Approval Required',                message: 'Emergency Replenishment PO requires your approval before processing.', type: 'approval',   severity: 'warning', urgent: false },
  ];

  await Notification.insertMany(notifications.map(n => ({
    notificationId: uuidv4(), ...n,
    status: 'unread',
    recipientId: adminUser.userId,
    organisationId: ORG_ID,
  })));
  console.log(`  ✅ Seeded ${notifications.length} notifications`);
}

async function main() {
  console.log('\n🌱 Fashion Ops — Database Seed Script\n');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('👤 Seeding users...');        await seedUsers();
    console.log('\n⚙️  Seeding system config...');await seedSystemConfig();
    console.log('\n📊 Seeding KPI snapshots...'); await seedKPISnapshots();
    console.log('\n🔄 Seeding workflows...');     await seedWorkflows();
    console.log('\n✅ Seeding tasks...');          await seedTasks();
    console.log('\n⚠️  Seeding anomalies...');     await seedAnomalies();
    console.log('\n🔔 Seeding notifications...');  await seedNotifications();

    console.log('\n🎉 Seed complete!\n');
    console.log('Demo login credentials:');
    console.log('  admin@fashionbrand.com   / Admin@123   (Operations Admin)');
    console.log('  manager@fashionbrand.com / Manager@123 (Manager)');
    console.log('  analyst@fashionbrand.com / Analyst@123 (Analyst)');
    console.log('  staff@fashionbrand.com   / Staff@123   (Field Staff)\n');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
    process.exit(0);
  }
}

main();
