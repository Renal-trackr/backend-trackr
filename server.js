import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDb from './src/config/database.js';
import authRoutes from './src/routes/auth.routes.js';
import doctorRoutes from './src/routes/doctor.routes.js';
import patientRoutes from './src/routes/patient.routes.js';
import workflowRoutes from './src/routes/workflow.routes.js';
import actionHistoryRoutes from './src/routes/actionHistory.routes.js';
// import './workers/workflow.worker.js';
import actionTrackerMiddleware from './src/middlewares/actionTracker.middleware.js';

// import "./src/utils/bullmq/index.js";
// import { BULLMQ_DASHBOARD_PATH } from "./src/utils/constants.js";
// import { bullMQDashboard } from "./src/utils/bullmq/dashboard.js";


dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


connectDb();

app.use('/api/auth', authRoutes);
app.use('/api/doctors', actionTrackerMiddleware.trackAction, doctorRoutes);
app.use('/api/patients', actionTrackerMiddleware.trackAction, patientRoutes);
app.use('/api/workflows', actionTrackerMiddleware.trackAction, workflowRoutes);
app.use('/api/action-history', actionHistoryRoutes);

// BullMQ Dashboard

// app.use(BULLMQ_DASHBOARD_PATH, bullMQDashboard);

app.listen(PORT, () => {
    console.log(`Server is running on url http://localhost:${PORT}`);
}
);
