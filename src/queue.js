const { getStreamData } = require("./apis");
const { Browser } = require("./config");
const { REQUEST_STATUS, MESSSAGE } = require("./constants");
const ContentRequest = require("./models/ContentRequest");
const ContentResponse = require("./models/ContentResponse");
const { log } = require("./utils");

const {
    sendRequestedData,
    sendMessage,
    deleteMessages,
} = require("./telegramActions");

let queue = [];
let processing = false;

// Process the queue of content requests
const processQueue = async () => {
    log("processQueue run -----------------");
    if (processing || queue.length === 0) {
        log("queue stopped processing ----------------");
        return;
    }

    processing = true;
    const job = queue.shift();
    log("job to process: ", job);

    // Check if the job's retry count exceeds the limit
    if (job.retryCount >= 5 || job.retryCount === -1) {
        log(
            `Skipping job ${job.id} because retry count ${job.retryCount} exceeds the limit.`
        );
        processing = false;
        processQueue(); // Process the next job in the queue
        return;
    }

    try {
        // Open the browser if not already opened
        if (!Browser.browserInstance) {
            await Browser.Open();
        }

        let messagesToDelete = [];

        log(MESSSAGE.DOWNLOADING.replace("requestUrl", job.requestUrl));

        if (job.retryCount === 0) {
            // Send message indicating content gathering
            const downloadingMessage = await sendMessage({
                ...job,
                message: MESSSAGE.GATHERING_CONTENT,
            });

            if (downloadingMessage) {
                messagesToDelete.push(downloadingMessage.message_id);
            }
        }

        // Retrieve content data from the specified URL
        const result = await getStreamData(job.requestUrl);
        log("result: ", result);

        // Delete temporary messages after content retrieval
        await deleteMessages({ ...job, messagesToDelete });

        if (!result.success) {
            // Update request status on failure
            const updatedRequest = await ContentRequest.findByIdAndUpdate(
                job.id,
                {
                    $set: { updatedAt: new Date() },
                    $inc: { retryCount: 1 },
                },
                { new: true }
            );

            if (!updatedRequest) {
                log(`Content request with ID ${job.id} not found.`);
                // Handle the case where the document with job.id is not found
                return;
            }

            job.retryCount = -1;
        } else {
            // Update request status on success and save response data
            await ContentRequest.findByIdAndUpdate(job.id, {
                status: REQUEST_STATUS.DONE,
                updatedAt: new Date(),
                retryCount: job.retryCount + 1,
            });

            const newResponseData = new ContentResponse({
                owner: { ...result.data?.owner },
                requestedBy: { ...job?.requestedBy },
                requestUrl: job?.requestUrl,
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

            // Send requested data to the user
            await sendRequestedData({ ...result.data, ...job });

            // Count remaining pending requests
            const pendingCount = await ContentRequest.countDocuments({
                status: REQUEST_STATUS.PENDING,
            });
            log("Remaining items in queue:", pendingCount);

            // Close browser if no pending jobs
            if (pendingCount === 0) {
                await Browser.Close();
            }
        }
    } catch (error) {
        log("Error processing job:", error);
    } finally {
        processing = false;
        log("process next item");
        processQueue(); // Process the next job in the queue
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
        });
        log("Fetched pending requests: ", pendingRequests.length);

        // Clear the current queue
        queue = [];

        // Add each pending request to the queue
        pendingRequests.forEach((request) => {
            queue.push({
                id: request._id.toString(),
                requestUrl: request.requestUrl,
                requestedBy: request.requestedBy,
                retryCount: request.retryCount,
                chatId: request.chatId,
            });
        });

        log("Queue updated with fresh pending requests.");
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
                const newRequest = change.fullDocument;
                addToQueue({
                    id: newRequest._id.toString(),
                    requestUrl: newRequest.requestUrl,
                    requestedBy: newRequest.requestedBy,
                    retryCount: newRequest.retryCount,
                    chatId: newRequest.chatId,
                });
                log("New request added to the queue:", newRequest);
            }
        });

        // Periodically synchronize the queue with the database
        // setInterval(fetchPendingRequests, 300000); // Adjust the interval as needed
        setInterval(fetchPendingRequests, 30000); // Adjust the interval as needed

        await processQueue();
    } catch (error) {
        log("Error initializing queue: ", error);
    }
};

// Export functions for adding to the queue and initializing it
module.exports = { addToQueue, initQueue };
