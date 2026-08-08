require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const { errorHandler } = require('./middleware/errorHandler');

// ── Routes ────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const taskRoutes = require('./routes/taskRoutes');
const aiRoutes = require('./routes/aiRoutes');
const forecastRoutes = require('./routes/forecastRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditRoutes = require('./routes/auditRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// ── CORS ──────────────────────────────────────────────────────
// Parse allowed origins — strip trailing slashes so comparison always works
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim().replace(/\/+$/, '')); // remove trailing slash

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (Postman, mobile apps, server-to-server)
        if (!origin) return callback(null, true);
        // Normalise incoming origin — strip trailing slash
        const normOrigin = origin.replace(/\/+$/, '');
        if (
            allowedOrigins.includes('*') ||
            allowedOrigins.includes(normOrigin) ||
            // Allow any *.vercel.app subdomain during development/preview deployments
            normOrigin.endsWith('.vercel.app')
        ) {
            return callback(null, true);
        }
        console.warn(`CORS blocked: ${origin}`);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// Explicitly handle preflight OPTIONS for all routes
app.options('/{*path}', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── MongoDB lazy connect (serverless-safe) ────────────────────
let isConnected = false;

const connectDB = async () => {
    if (isConnected || mongoose.connection.readyState === 1) {
        isConnected = true;
        return;
    }
    await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('✅ MongoDB connected:', mongoose.connection.name);
};

// Ensure DB is connected before every request
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        res.status(503).json({ success: false, message: 'Database unavailable. Please try again.' });
    }
});

// ── Root route ────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Fashion Predictive Operations Command Center API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            dashboard: '/api/dashboard',
            workflows: '/api/workflows',
            tasks: '/api/tasks',
            ai: '/api/ai',
            forecasts: '/api/forecasts',
            anomalies: '/api/anomalies',
            users: '/api/users',
            notifications: '/api/notifications',
            audit: '/api/audit',
            reports: '/api/reports',
        },
    });
});

// ── Health check ──────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Fashion Predictive Operations Command Center API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', forecastRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/reports', reportRoutes);

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
});

// ── Global error handler ──────────────────────────────────────
app.use(errorHandler);

// ── Local dev: start server only when run directly ────────────
// Vercel imports this as a module — require.main !== module there
if (require.main === module) {
    const PORT = process.env.PORT || 4000;
    connectDB()
        .then(() => {
            app.listen(PORT, () => {
                console.log(`🚀 Server running on http://localhost:${PORT}`);
                console.log(`🔗 Health: http://localhost:${PORT}/health`);
            });
        })
        .catch(err => {
            console.error('❌ MongoDB connection failed:', err.message);
            process.exit(1);
        });
}

// Vercel uses this export
module.exports = app;
