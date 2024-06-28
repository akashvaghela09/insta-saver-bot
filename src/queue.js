const { REQUEST_STATUS, MESSSAGE } = require("./constants");
const ContentRequest = require("./models/ContentRequest");
const ContentResponse = require("./models/ContentResponse");
const { log, waitFor } = require("./utils");

const { sendRequestedData } = require("./telegramActions");
const { Browser } = require("./config");
const { scrapWithFastDl } = require("./apis");

let queue = [];
let processing = false;
let currentJob = null; // Variable to store the current job being processed
const QUEUE_LIMIT = 5; // Maximum number of items in the queue

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
    currentJob = queue.shift(); // Assign the job to currentJob
    log("job to process: ", currentJob);

    try {
        if (!Browser.browserInstance) {
            console.log("seems like browser was closed");
            await Browser.Open();
        }

        let result = await scrapWithFastDl(currentJob.requestUrl);

        log(MESSSAGE.DOWNLOADING.replace("requestUrl", currentJob.requestUrl));

        if (!result.success) {
            console.log("failed the scrap request");
            let retryCount = currentJob.retryCount + 1;
            let newStatus =
                retryCount < 5 ? REQUEST_STATUS.PENDING : REQUEST_STATUS.FAILED;

            await ContentRequest.findByIdAndUpdate(currentJob.id, {
                $set: { updatedAt: new Date(), status: newStatus },
                $inc: { retryCount: currentJob.retryCount + 1 },
            });
        } else {
            const newResponseData = new ContentResponse({
                owner: { ...result.data?.owner },
                requestedBy: { ...currentJob?.requestedBy },
                requestUrl: currentJob?.requestUrl,
                shortCode: currentJob?.shortCode,
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
            await sendRequestedData({ ...result.data, ...currentJob });

            // Update request status on success and save response data
            await ContentRequest.findByIdAndUpdate(currentJob.id, {
                status: REQUEST_STATUS.DONE,
                updatedAt: new Date(),
                retryCount: currentJob.retryCount + 1,
            });

            logPendingCount();
        }
    } catch (error) {
        log("Error processing job:", error);
    } finally {
        processing = false;
        currentJob = null; // Clear the current job after processing
        log("process next item");

        await waitFor(500);
        await processQueue(); // Process the next job in the queue
    }
};

// Add a new content request to the queue
const addToQueue = async (data) => {
    const { shortCode, chatId } = data;

    // Check if the request is already in the queue
    const isInQueue = queue.some(
        (item) => item.shortCode === shortCode && item.chatId === chatId
    );

    // Check if the request is currently being processed
    const isProcessing =
        currentJob &&
        currentJob.shortCode === shortCode &&
        currentJob.chatId === chatId;

    if (isInQueue || isProcessing) {
        log(
            `Request with shortCode ${shortCode} and chatId ${chatId} is already in the queue or being processed.`
        );
        return;
    }

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
        setInterval(fetchPendingRequests, 60000); // Adjust the interval as needed

        log("process queue after fetching pending request");
        await processQueue();
    } catch (error) {
        log("Error initializing queue: ", error);
    }
};

// Export functions for adding to the queue and initializing it
module.exports = { initQueue };
