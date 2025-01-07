const { Queue, Worker, QueueEvents } = require("bullmq");
const { REQUEST_STATUS, MESSSAGE } = require("./constants");
const ContentRequest = require("./models/ContentRequest");
const { log, waitFor } = require("./utils");
const { sendRequestedData } = require("./telegramActions");
const { Browser } = require("./config");
const { scrapWithFastDl } = require("./apis");
const Metrics = require("./models/Metrics");

// Initialize BullMQ queue
const requestQueue = new Queue("contentRequestQueue", {
    connection: {
        host: "localhost",
        port: 6379,
    },
});

// Process the queue using a Worker
const requestWorker = new Worker(
    "contentRequestQueue",
    async (job) => {
        const { id, requestUrl, retryCount } = job.data;

        log(`Processing job: ${id}`);

        // Mark the job as PROCESSING in the database
        await ContentRequest.findByIdAndUpdate(id, {
            status: REQUEST_STATUS.PROCESSING,
            updatedAt: new Date(),
        });

        try {
            if (!Browser.browserInstance) {
                console.log("Browser instance not found, reopening...");
                await Browser.Open();
            }

            const result = await scrapWithFastDl(requestUrl);

            if (!result.success) {
                const newRetryCount = retryCount + 1;
                const newStatus =
                    newRetryCount < 5
                        ? REQUEST_STATUS.PENDING
                        : REQUEST_STATUS.FAILED;

                await ContentRequest.findByIdAndUpdate(id, {
                    $set: { updatedAt: new Date(), status: newStatus },
                    $inc: { retryCount: 1 },
                });

                log(`Job ${id} failed. Retry count: ${newRetryCount}`);
                throw new Error("Scraping failed"); // Propagate error for retry
            } else {
                await waitFor(500);

                // Send requested data
                await sendRequestedData({ ...result.data, ...job.data });

                // Delete document after successful processing
                await ContentRequest.findByIdAndDelete(id);
                log(`Request document deleted: ${id}`);

                await Metrics.findOneAndUpdate(
                    {},
                    {
                        $inc: {
                            totalRequests: 1,
                            [`mediaProcessed.${result.data?.mediaType}`]: 1,
                        },
                        $set: { lastUpdated: new Date() },
                    },
                    { upsert: true, new: true }
                );
            }
        } catch (error) {
            log(`Error processing job ${id}:`, error);

            // On failure, ensure job status is updated for retry
            const newRetryCount = retryCount + 1;
            const newStatus =
                newRetryCount < 5
                    ? REQUEST_STATUS.PENDING
                    : REQUEST_STATUS.FAILED;

            await ContentRequest.findByIdAndUpdate(id, {
                $set: { updatedAt: new Date(), status: newStatus },
                $inc: { retryCount: 1 },
            });

            log(
                `Updated request ${id} for retry. Retry count: ${newRetryCount}`
            );
        }
    },
    {
        connection: {
            host: "localhost",
            port: 6379,
        },
        concurrency: 5, // Limit concurrency
    }
);

// Log job events using QueueEvents
const queueEvents = new QueueEvents("contentRequestQueue", {
    connection: {
        host: "localhost",
        port: 6379,
    },
});

queueEvents.on("completed", ({ jobId }) => {
    log(`Job ${jobId} completed successfully.`);
});

queueEvents.on("failed", ({ jobId, failedReason }) => {
    log(`Job ${jobId} failed: ${failedReason}`);
});

// Fetch pending requests from MongoDB and add them to the queue
const fetchPendingRequests = async () => {
    try {
        const pendingRequests = await ContentRequest.find({
            status: REQUEST_STATUS.PENDING,
            retryCount: { $lt: 5 },
        }).sort({ requestedAt: 1 });

        log(`Fetched ${pendingRequests.length} pending requests from DB.`);
        for (const request of pendingRequests) {
            await requestQueue.add("contentRequest", {
                id: request._id.toString(),
                messageId: request.messageId,
                shortCode: request.shortCode,
                requestUrl: request.requestUrl,
                requestedBy: request.requestedBy,
                retryCount: request.retryCount,
                chatId: request.chatId,
            });
        }
    } catch (error) {
        log("Error fetching pending requests:", error);
    }
};

// Initialize the queue and MongoDB change stream
const initQueue = async () => {
    try {
        await fetchPendingRequests();
        log("Queue initialized with pending requests.");

        // Watch MongoDB for new requests
        const changeStream = ContentRequest.watch();
        changeStream.on("change", async (change) => {
            if (change.operationType === "insert") {
                const newRequest = change.fullDocument;
                log("New request detected:", newRequest._id);

                await requestQueue.add("contentRequest", {
                    id: newRequest._id.toString(),
                    messageId: newRequest.messageId,
                    shortCode: newRequest.shortCode,
                    requestUrl: newRequest.requestUrl,
                    requestedBy: newRequest.requestedBy,
                    retryCount: newRequest.retryCount,
                    chatId: newRequest.chatId,
                });
            }
        });

        // Periodically synchronize pending requests
        setInterval(fetchPendingRequests, 60000); // Every 60 seconds
    } catch (error) {
        log("Error initializing queue:", error);
    }
};

module.exports = { initQueue };
