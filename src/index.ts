import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

import L from './utils/logger';
import postV1Router from './routes/postV1';
import { KAFKA_CONFIG } from './config';
import initKafkaPostConsumer from './asynchronous/consumer/postConsumer';

if (KAFKA_CONFIG.KAFKA_POST_CONSUMER_SWITCH) {
    (async () => {
        await initKafkaPostConsumer()
    })().catch((error) => {
        L.error(error);
    });
}

const app: Express = express();
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.listen(PORT, () => {
    L.info(`Server is running on port ${PORT}`);
});

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

app.use(limiter);
app.use('/api/v1/posts', postV1Router);
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(err.status || 500).send({
        name: err.name,
        message: err.message,
    });
});

export default app;