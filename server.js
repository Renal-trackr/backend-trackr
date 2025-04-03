import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDb from './src/config/database.js';
import authRoutes from './src/routes/auth.routes.js';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import doctorRoutes from './src/routes/doctor.routes.js';
import patientRoutes from './src/routes/patient.routes.js';
import workflowRoutes from './src/routes/workflow.routes.js';
import actionHistoryRoutes from './src/routes/actionHistory.routes.js';
import actionTrackerMiddleware from './src/middlewares/actionTracker.middleware.js';
import {ExpressAdapter} from "@bull-board/express";
import {queues} from "./src/queues/workflow.queue.js";


dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


connectDb();

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
    queues: Object.values(queues).map(q => new BullMQAdapter(q)),
    serverAdapter: serverAdapter,
});


app.use('/api/auth', authRoutes);
app.use('/api/doctors', actionTrackerMiddleware.trackAction, doctorRoutes);
app.use('/api/patients', actionTrackerMiddleware.trackAction, patientRoutes);
app.use('/api/workflows', actionTrackerMiddleware.trackAction, workflowRoutes);
app.use('/api/action-history', actionHistoryRoutes);

app.use('/admin/queues', serverAdapter.getRouter());

app.listen(PORT, () => {
        console.log(`Server is running on url http://localhost:${PORT}`);
    }
);
