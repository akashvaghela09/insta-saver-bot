require("dotenv").config();
const express = require("express");
const app = express();
const { Bot, Browser, connectDB } = require("./config");
const { initQueue } = require("./queue");
const { log, domainCleaner, extractShortCode } = require("./utils");
const ContentRequest = require("./models/ContentRequest");

// Set the server to listen on port 6060
const PORT = process.env.PORT || 6060;

// Listen for any kind of message. There are different kinds of messages.
Bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;
    const userName = msg?.from?.username || "";
    const firstName = msg?.from?.first_name || "";
    let isURL =
        msg.entities &&
        msg.entities.length > 0 &&
        msg.entities[0].type === "url";
    // Process user message
    if (userMessage === "/start") {
        // Construct welcome message with user's first name
        let welcomeMessage = MESSSAGE.WELCOME.replace("firstName", firstName);

        // Send a welcome message to the chat
        await sendMessage({
            chatId,
            requestedBy: { userName, firstName },
            message: welcomeMessage,
        });
    } else if (isURL) {
        let requestUrl = userMessage;
        let urlResponse = domainCleaner(requestUrl);
        log("urlResponse: ", urlResponse);

        let shortCode = extractShortCode(requestUrl);
        log("shortCode: ", shortCode);

        if (!urlResponse.success || !shortCode) {
            // If domain cleaner fails, exit early
            log("return from here as shortCode not found");
            return;
        } else {
            requestUrl = urlResponse.data;
        }

        const newRequest = new ContentRequest({
            chatId,
            requestUrl,
            requestedBy: { userName, firstName },
        });

        try {
            // Save the request to the database
            await newRequest.save();
        } catch (error) {
            log("Error saving content request:", error);
        }
    }
});

// Define a route for the GET request on the root endpoint '/'
app.get("/", async (req, res) => {
    // Send the response 'Hello' when the endpoint is accessed
    res.send(Browser.authStatus);
});

// Check for Master Backend configuration [OPTIONAL]
// Check if the module is being run directly
if (require.main === module) {
    app.listen(PORT, async () => {
        log(`Insta saver running at http://localhost:${PORT}`);

        try {
            // Connect to MongoDB
            await connectDB();

            // Open the browser for web scraping
            await Browser.Open();

            // Initialize the job queue
            await initQueue();
        } catch (error) {
            log("Error during startup:", error);
        }
    });
} else {
    // Export the app instance for importing
    module.exports = app;
}

// Handle shutdown gracefully
process.on("SIGINT", async () => {
    await Browser.Close();
    process.exit(0);
});
