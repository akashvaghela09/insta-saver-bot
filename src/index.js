require("dotenv").config();
const express = require("express");
const app = express();
const { Bot, Browser } = require("./config");
const { MESSSAGE } = require("./constants");
const { log, waitFor } = require("./utils");

// Set the server to listen on port 6060
const PORT = process.env.PORT || 6060;

// Listen for any kind of message. There are different kinds of messages.
Bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;

    Bot.sendMessage(chatId, "Your message is \n\n " + userMessage);
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
        console.log(`Server running at http://localhost:${PORT}`);

        await Browser.Open();
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
