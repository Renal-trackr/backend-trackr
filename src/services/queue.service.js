import { Queue } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
});

// Queue definitions
const workflowQueue = new Queue('workflow-tasks', { connection });
const alertQueue = new Queue('alerts', { connection });
const appointmentQueue = new Queue('appointments', { connection });

class QueueService {
  /**
   * Add a task to the workflow queue
   * @param {Object} data - Task data
   * @param {Object} options - Queue options
   * @returns {Promise<Object>} The created job
   */
  async addWorkflowTask(data, options = {}) {
    return workflowQueue.add('workflow-task', data, options);
  }

  /**
   * Add a task to the alert queue
   * @param {Object} data - Alert data
   * @param {Object} options - Queue options
   * @returns {Promise<Object>} The created job
   */
  async addAlert(data, options = {}) {
    return alertQueue.add('create-alert', data, options);
  }

  /**
   * Schedule an appointment
   * @param {Object} data - Appointment data
   * @param {Object} options - Queue options
   * @returns {Promise<Object>} The created job
   */
  async scheduleAppointment(data, options = {}) {
    return appointmentQueue.add('schedule-appointment', data, options);
  }

  /**
   * Get the workflow queue
   * @returns {Queue} The workflow queue
   */
  getWorkflowQueue() {
    return workflowQueue;
  }

  /**
   * Get the alert queue
   * @returns {Queue} The alert queue
   */
  getAlertQueue() {
    return alertQueue;
  }

  /**
   * Get the appointment queue
   * @returns {Queue} The appointment queue
   */
  getAppointmentQueue() {
    return appointmentQueue;
  }
}

export default new QueueService();
