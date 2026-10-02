import express, { Request, Response } from 'express';

const app = express();

app.use(express.json());

app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'API is running'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
