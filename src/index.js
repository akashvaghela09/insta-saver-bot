require("dotenv").config();
const express = require("express");
const app = express();
const { Bot, connectDB, Browser } = require("./config");
const { initQueue } = require("./queue");
const { log, domainCleaner, extractShortCode } = require("./utils");
const ContentRequest = require("./models/ContentRequest");
const { MESSSAGE } = require("./constants");
const { sendMessage } = require("./telegramActions");
const { isValidInstaUrl } = require("./utils/helper");

// Set the server to listen on port 6060
const PORT = process.env.PORT || 6060;

// Listen for any kind of message. There are different kinds of messages.
Bot.onText(/^\/start/,async (msg, match)=>{
    const chatId = msg.chat.id;
    const userName = msg?.from?.username || "";
    const firstName = msg.from.first_name
    let welcomeMessage = MESSSAGE.WELCOME.replace("firstName", msg.from.first_name);

    // Send a welcome message to the chat
    await sendMessage({
        chatId,
        requestedBy: { userName, firstName },
        message: welcomeMessage,
    });
})
Bot.onText(/^https:\/\/www\.instagram\.com(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id
    const userMessage = msg.text;
    const userName = msg?.from?.username || "";
    const firstName = msg?.from?.first_name || "";
    let isURL =
        msg.entities &&
        msg.entities.length > 0 &&
        msg.entities[0].type === "url";
    // Process user message
    if (isURL) {
        let requestUrl = userMessage;
        let urlResponse = isValidInstaUrl(requestUrl);
        log("urlResponse: ", urlResponse);

        if (!urlResponse.success || !urlResponse.shortCode) {
            // If domain cleaner fails, exit early
            log("return from here as shortCode not found");
            return;
        }

        const newRequest = new ContentRequest({
            chatId,
            requestUrl,
            shortCode: urlResponse.shortCode,
            requestedBy: { userName, firstName },
            messageId: messageId
        });

        try {
            // Save the request to the database
            await newRequest.save();
        } catch (error) {
            log("Error saving content request:", error);
        }
    }
});

// Check for Master Backend configuration [OPTIONAL]
// Check if the module is being run directly
if (require.main === module) {
    app.listen(PORT, async () => {
        log(`Insta saver running at http://localhost:${PORT}`);

        try {
            // Connect to MongoDB
            await connectDB();

            // Open Browser
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

app.get("/", (req, res) => {
    res.json({ message: "Welcome to Insta Saver Bot" });
});

app.get("/test", (req, res) => {
    res.json({ message: "Bot is Online!!" });
});

// Handle shutdown gracefully
process.on("SIGINT", async () => {
    // Open Browser
    await Browser.Close();
    process.exit(0);
});
