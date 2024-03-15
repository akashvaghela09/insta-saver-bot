require("dotenv").config();
const express = require("express");
const app = express();
const { bot } = require("./config");
const { domainCleaner, extractShortCode } = require("./helper");
const { getStreamData } = require("./apis");
const { MESSSAGE } = require("./constants");
const {
    sendMessage,
    sendChatAction,
    deleteMessages,
    sendVideo,
    sendPhoto,
    sendMediaGroup,
} = require("./telegramActions");

// Set the server to listen on port 6060
const PORT = process.env.SERVER1_PORT || 6061;

class ChatContext {
    constructor(chatId, userName, firstName, userMessage) {
        this.chatId = chatId;
        this.userName = userName;
        this.firstName = firstName;
        this.userMessage = userMessage;
        this.messagesToDelete = [];
    }
    setProperty(key, value) {
        this[key] = value;
    }
    addMessageId(item) {
        this.messagesToDelete.push(item);
    }
}

// Listen for any kind of message. There are different kinds of messages.
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.username;
    const firstName = msg.from.first_name || "";
    const userMessage = msg.text;
    const isURL =
        msg.entities &&
        msg.entities.length > 0 &&
        msg.entities[0].type === "url";
    const messagesToDelete = [];
    let shortCode = "";

    const context = new ChatContext(chatId, userName, firstName, userMessage);

    // Show typing status
    await sendChatAction(context);

    // Process user message
    if (userMessage === "/start") {
        let welcomeMessage = MESSSAGE.WELCOME.replace("firstName", firstName);

        // send a message to the chat acknowledging receipt of their message
        await sendMessage({ ...context, message: welcomeMessage });
    } else if (isURL) {
        const downloadingMessage = await sendMessage({
            ...context,
            message: MESSSAGE.GATHERING_CONTENT,
        });

        if (downloadingMessage) {
            context.addMessageId(downloadingMessage.message_id);
        }

        let url = userMessage;
        let urlResponse = domainCleaner(url);

        shortCode = extractShortCode(url);
        context.setProperty("shortCode", shortCode);
        console.log(MESSSAGE.DOWNLOADING.replace("shortCode", shortCode));

        if (!urlResponse.success) {
            await sendMessage({ ...context, message: urlResponse.data });
            await deleteMessages(context);
            return;
        } else {
            url = urlResponse.data;
        }

        let streamResponse = await getStreamData(shortCode);

        if (!streamResponse.success) {
            await sendMessage({ ...context, message: streamResponse.message });
            await deleteMessages(context);
            return;
        }

        await sendChatAction(context);

        // Send the 'Uploading post...' message and store the message ID
        const uploadingMessage = await sendMessage({...context, message: MESSSAGE.INITIATING_UPLOAD});
        if (uploadingMessage) {
            context.addMessageId(uploadingMessage.message_id);
        }

        let media = streamResponse.data;
        // console.log("Media Response ==================== \n\n", media);

        if (media.mediaType === "XDTGraphSidecar") {
            // Prepare media url array
            const mediaGroupUrls = [];
            for (let i = 0; i < media.mediaList.length; i++) {
                let mediaItem = media.mediaList[i];
                if (mediaItem.mediaType === "XDTGraphImage") {
                    // Add image to mediaGroupUrls
                    mediaGroupUrls.push({
                        type: "photo",
                        media: mediaItem.mediaUrl,
                    });
                } else if (mediaItem.mediaType === "XDTGraphVideo") {
                    // Add video to mediaGroupUrls
                    mediaGroupUrls.push({
                        type: "video",
                        media: mediaItem.mediaUrl,
                    });
                }
            }

            await sendMediaGroup({ ...context, mediaGroupUrls });
        } else if (media.mediaType === "XDTGraphVideo") {
            await sendVideo({ ...context, mediaUrl: media.mediaUrl });
        } else if (media.mediaType === "XDTGraphImage") {
            await sendPhoto({ ...context, mediaUrl: media.mediaUrl });
        }

        if (media.caption) {
            // Send 'typing' action
            await sendChatAction(context);

            // Send the caption
            await sendMessage({ ...context, message: media.caption });
        }

        await deleteMessages(context);
        return;
    }
});

// Define a route for the GET request on the root endpoint '/'
app.get("/", (req, res) => {
    // Send the response 'Hello' when the endpoint is accessed
    res.send("Hello from InstaSaver Bot!");
});

// Check for Master Backend configuration [OPTIONAL]
// Check if the module is being run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
} else {
    // Export the app instance for importing
    module.exports = app;
}
