import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// ─── Route imports ────────────────────────────────────────────────────────────
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import tpoRoutes from './routes/tpo.routes';

const app: Application = express();

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'API is running',
    });
});

// Auth
app.use('/api/auth', authRoutes);

// Student
app.use('/api/students', studentRoutes);

// TPO
app.use('/api/tpo', tpoRoutes);

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

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`   Health check → http://localhost:${PORT}/api/health`);
    console.log(`   Auth         → http://localhost:${PORT}/api/auth`);
    console.log(`   Students     → http://localhost:${PORT}/api/students`);
});

export default app;
