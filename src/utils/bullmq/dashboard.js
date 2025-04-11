// import { createBullBoard } from "@bull-board/api";
// import { ExpressAdapter } from "@bull-board/express";
// import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js";
// import { BULLMQ_DASHBOARD_PATH } from "../constants.js";
// import * as allQueues from "./queues.js";

// const serverAdapter = new ExpressAdapter();
// serverAdapter.setBasePath(BULLMQ_DASHBOARD_PATH);

// const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
//   queues: Object.values(allQueues).map((queue) => {
//     return new BullMQAdapter(queue);
//   }),
//   serverAdapter: serverAdapter,
// });

// export const bullMQDashboard = serverAdapter.getRouter();
