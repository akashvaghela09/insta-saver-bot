const { REQUEST_STATUS, MESSSAGE } = require("./constants");
const ContentRequest = require("./models/ContentRequest");
const { log, waitFor } = require("./utils");

const { sendRequestedData } = require("./telegramActions");
const { Browser } = require("./config");
const { scrapWithFastDl } = require("./apis");

let queue = [];
let processing = false;
const QUEUE_LIMIT = 15; // Maximum number of items in the queue

const logPendingCount = async () => {
    // Count remaining pending requests
    const pendingCount = await ContentRequest.countDocuments({
        status: REQUEST_STATUS.PENDING,
        retryCount: { $lt: 5 },
    });
    log("Remaining items in queue:", pendingCount);
};

// Process the queue of content requests
const processQueue = async () => {
    log("processQueue run -----------------");
    if (processing || queue.length === 0) {
        log("queue stopped processing ----------------");
        log("processing ", processing);
        log("queue length ", queue.length);
        return;
    }

    processing = true;
    const job = queue.shift();
    log("job to process: ", job);

    try {
        if (!Browser.browserInstance) {
            console.log("seems like browser was closed");
            await Browser.Open();
        }

        let result = await scrapWithFastDl(job.requestUrl);

        log(MESSSAGE.DOWNLOADING.replace("requestUrl", job.requestUrl));

        if (!result.success) {
            console.log("failed the scrap request");
            let retryCount = job.retryCount + 1;
            let newStatus =
                retryCount < 5 ? REQUEST_STATUS.PENDING : REQUEST_STATUS.FAILED;

            await ContentRequest.findByIdAndUpdate(job.id, {
                $set: { updatedAt: new Date(), status: newStatus },
                $inc: { retryCount: job.retryCount + 1 },
            });
        } else {
            const newResponseData = new ContentResponse({
                owner: { ...result.data?.owner },
                requestedBy: { ...job?.requestedBy },
                requestUrl: job?.requestUrl,
                shortCode: job?.shortCode,
                updatedAt: new Date(),
                mediaUrl: result.data?.mediaUrl,
                mediaType: result.data?.mediaType,
                captionText: result.data?.captionText,
                displayUrl: result.data?.displayUrl,
                thumbnailUrl: result.data?.thumbnailUrl,
                videoUrl: result.data?.videoUrl,
                mediaList: result.data?.mediaList,
            });

            await newResponseData.save();

            await waitFor(500);

            // Send requested data to the user
            await sendRequestedData({ ...result.data, ...job });

            // Update request status on success and save response data
            await ContentRequest.findByIdAndUpdate(job.id, {
                status: REQUEST_STATUS.DONE,
                updatedAt: new Date(),
                retryCount: job.retryCount + 1,
            });

            logPendingCount();
        }
    } catch (error) {
        log("Error processing job:", error);
    } finally {
        processing = false;
        log("process next item");

        await waitFor(500);
        await processQueue(); // Process the next job in the queue
    }
};

// Add a new content request to the queue
const addToQueue = async (data) => {
    queue.push(data);

    log("!processing ", !processing);
    if (!processing) {
        processQueue();
    }
};

// Fetch pending requests from the database and add them to the queue
const fetchPendingRequests = async () => {
    try {
        const pendingRequests = await ContentRequest.find({
            status: REQUEST_STATUS.PENDING,
            retryCount: { $lt: 5 },
            requestedBy: {
                userName: "akashvaghela09",
                firstName: "Akash",
            },
        })
            .sort({ requestedAt: 1 })
            .limit(QUEUE_LIMIT);
        log("Fetched pending requests: ", pendingRequests.length);

        // Clear the current queue
        queue = [];

        // Add each pending request to the queue
        pendingRequests.forEach((request) => {
            queue.push({
                id: request._id.toString(),
                shortCode: request.shortCode,
                requestUrl: request.requestUrl,
                requestedBy: request.requestedBy,
                retryCount: request.retryCount,
                chatId: request.chatId,
            });
        });

        log("Queue updated with fresh pending requests.", queue.length);
        logPendingCount();

        await waitFor(500);
        await processQueue();
    } catch (error) {
        log("Error fetching pending requests:", error);
    }
};

// Initialize the queue with pending content requests from the database
const initQueue = async () => {
    try {
        await fetchPendingRequests();
        log("Queue initialized with pending requests");

        // Set up a watcher for new content requests in MongoDB
        const changeStream = ContentRequest.watch();
        changeStream.on("change", async (change) => {
            if (change.operationType === "insert") {
                console.log(
                    "got new request ========================================="
                );
                const newRequest = change.fullDocument;

                // Only add request if queue is empty, otherwise wait for queue to complete 
                if (queue.length === 0) {
                    addToQueue({
                        id: newRequest._id.toString(),
                        shortCode: newRequest.shortCode,
                        requestUrl: newRequest.requestUrl,
                        requestedBy: newRequest.requestedBy,
                        retryCount: newRequest.retryCount,
                        chatId: newRequest.chatId,
                    });
                }
                log("New request added to the queue:", newRequest._id);
            }
        });

        // Periodically synchronize the queue with the database
        setInterval(fetchPendingRequests, 30000); // Adjust the interval as needed

        log("process queue after fetching pending request");
        await processQueue();
    } catch (error) {
        log("Error initializing queue: ", error);
    }
};

// Export functions for adding to the queue and initializing it
module.exports = { initQueue };
