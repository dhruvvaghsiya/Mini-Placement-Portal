import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// ─── Route imports ────────────────────────────────────────────────────────────
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import companyRoutes from './routes/company.routes';
import driveRoutes from './routes/drive.routes';
import tpoRoutes from './routes/tpo.routes';
import applicationRoutes from './routes/application.routes';

const app: Application = express();

// ─── Middleware ───────────────────────────────────────────────────────────────

const rawClientUrl = process.env.CLIENT_URL;

const normalizeOrigin = (url?: string): string => {
    if (!url) return '';
    const trimmed = url.trim().replace(/\/$/, '');
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return `https://${trimmed}`;
    }
    return trimmed;
};

const allowedOrigins = [
    'http://localhost:3000',
    'https://localhost:3000',
    normalizeOrigin(rawClientUrl),
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
            if (!origin) return callback(null, true);

            const cleanOrigin = origin.replace(/\/$/, '');
            const isAllowed =
                allowedOrigins.includes(cleanOrigin) ||
                cleanOrigin.endsWith('.vercel.app') ||
                cleanOrigin.includes('localhost');

            if (isAllowed) {
                return callback(null, true);
            }
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
        exposedHeaders: ['Set-Cookie'],
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get(['/health', '/api/health'], (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'API is running',
    });
});

// Auth
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

// Student
app.use('/api/students', studentRoutes);
app.use('/students', studentRoutes);

// Companies
app.use('/api/companies', companyRoutes);
app.use('/companies', companyRoutes);

// Drives
app.use('/api/drives', driveRoutes);
app.use('/drives', driveRoutes);

// Applications
app.use('/api/applications', applicationRoutes);

// TPO management
app.use('/api/tpo', tpoRoutes);
app.use('/tpo', tpoRoutes);

// 404 handler — must be after all routes
app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT) || 5000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`   Health check → http://localhost:${PORT}/api/health`);
        console.log(`   Auth         → http://localhost:${PORT}/api/auth`);
        console.log(`   Students     → http://localhost:${PORT}/api/students`);
        console.log(`   Companies    → http://localhost:${PORT}/api/companies`);
        console.log(`   Drives       → http://localhost:${PORT}/api/drives`);
        console.log(`   TPO          → http://localhost:${PORT}/api/tpo`);
    });
}

export default app;
