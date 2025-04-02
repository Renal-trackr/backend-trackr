import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import patientRoutes from './routes/patient.routes.js';
import workflowRoutes from './routes/workflow.routes.js';
import actionHistoryRoutes from './routes/actionHistory.routes.js';
import seedService from './services/seed.service.js';
import actionTrackerMiddleware from './middlewares/actionTracker.middleware.js';
// Import the workers (this will start them)
import './workers/workflow.worker.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('Connected to MongoDB');
  
  // Initialize database with required data
  await seedService.initialize();
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});

// Register routes with action tracking middleware
app.use('/api/auth', authRoutes);
app.use('/api/doctors', actionTrackerMiddleware.trackAction, doctorRoutes);
app.use('/api/patients', actionTrackerMiddleware.trackAction, patientRoutes);
app.use('/api/workflows', actionTrackerMiddleware.trackAction, workflowRoutes);
app.use('/api/action-history', actionHistoryRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});