import express from 'express';
import settingsRoutes from '../routes/settings.js';
import { connectMongo } from '../lib/mongo.js';
const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

connectMongo();

app.use(express.json());
app.use(cookieParser());

app.use('/api/settings', settingsRoutes);

export default app;