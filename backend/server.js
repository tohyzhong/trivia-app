import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import settingsRoutes from './routes/settings.js';

import morgan from 'morgan';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));

let isConnected = false;

const connectMongo = async () => {
    if (isConnected) {
        console.log('MongoDB already connected');
        return;
    }

    try {
        await mongoose.connect(process.env.CONNECTION_STRING, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        isConnected = true;
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

connectMongo();

app.use(morgan(':method :url :status :response-time ms'));

// User Authentication for Login Page
app.use('/api/auth', authRoutes);

// User Profile for Profile Page
app.use('/api/profile', profileRoutes);

// Settings Page (Change Profile Picture, Change Email, Change Password, Delete Account)
app.use('/api/settings', settingsRoutes);

export default app; // comment out for local production testing

// app.listen(5000, () => {
//     console.log("Server is running on port 5000");
// });