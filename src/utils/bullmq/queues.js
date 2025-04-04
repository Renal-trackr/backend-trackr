import { Queue } from "bullmq";
import redis from "../redis.js";

export const sendMailQueue = new Queue("sendMailQueue", { connection: redis });
