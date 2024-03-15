require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const app = express();
const {
    domainCleaner,
    extractShortCode,
    logMessage,
    logError,
} = require("./helper");
const { getStreamData } = require("./apis");
const { LOG_TYPE, ERROR_MESSAGE, ERROR_TYPE, ACTION } = require("./constants");

// Set the server to listen on port 6060
const PORT = process.env.PORT || 6060;

const token = process.env.TELEGRAM_TOKEN;
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Listen for any kind of message. There are different kinds of messages.
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.username;
    const userMessage = msg.text;
    const isURL =
        msg.entities &&
        msg.entities.length > 0 &&
        msg.entities[0].type === "url";
    const messagesToDelete = [];
    let shortCode = "";

    // Show typing status
    const sendChatAction = async () => {
        try {
            await bot.sendChatAction(chatId, "typing");
        } catch (error) {
            let errorObj = {
                action: ACTION.SEND_CHAT_ACTION,
                errorCode: error?.response?.body?.error_code,
                errorDescription: error?.response?.body?.description,
                userName,
                chatId,
                shortCode,
            };
            if (error?.response?.body?.error_code === 429) {
                logError({ ...errorObj, type: ERROR_TYPE.RATE_LIMIT });
            } else {
                logError({ ...errorObj, type: ERROR_TYPE.FAILED });
            }
        }
    };

    const deleteMessages = async () => {
        messagesToDelete.forEach(async (messageId) => {
            try {
                await bot.deleteMessage(chatId, messageId);
            } catch (error) {
                let errorObj = {
                    action: ACTION.DELETE_MESSAGE,
                    errorCode: error?.response?.body?.error_code,
                    errorDescription: error?.response?.body?.description,
                    userName,
                    chatId,
                    shortCode,
                };
                if (error?.response?.body?.error_code === 429) {
                    logError({ ...errorObj, type: ERROR_TYPE.RATE_LIMIT });
                } else {
                    logError({ ...errorObj, type: ERROR_TYPE.FAILED });
                }
            }
        });
    };

    const sendMessage = async (message) => {
        try {
            let res = await bot.sendMessage(chatId, message);
            return res;
        } catch (error) {
            let errorObj = {
                action: ACTION.SEND_MESSAGE,
                errorCode: error?.response?.body?.error_code,
                errorDescription: error?.response?.body?.description,
                userName,
                chatId,
                shortCode,
            };
            if (error?.response?.body?.error_code === 429) {
                logError({ ...errorObj, type: ERROR_TYPE.RATE_LIMIT });
            } else {
                logError({ ...errorObj, type: ERROR_TYPE.FAILED });
            }
        }
    };

    const sendMediaGroup = async (mediaUrlList) => {
        try {
            await bot.sendMediaGroup(chatId, mediaUrlList);
            logMessage({
                type: LOG_TYPE.GROUP,
                userName,
                chatId,
                shortCode,
            });
        } catch (error) {
            let errorObj = {
                action: ACTION.SEND_MEDIA_GROUP,
                errorCode: error?.response?.body?.error_code,
                errorDescription: error?.response?.body?.description,
                userName,
                chatId,
                shortCode,
            };
            if (error?.response?.body?.error_code === 429) {
                logError({ ...errorObj, type: ERROR_TYPE.RATE_LIMIT });
            } else {
                logError({ ...errorObj, type: ERROR_TYPE.FAILED });
            }
        }
    };

    const sendVideo = async (mediaUrl) => {
        try {
            await bot.sendVideo(chatId, mediaUrl);
            logMessage({
                type: LOG_TYPE.VIDEO,
                userName,
                chatId,
                shortCode,
            });
        } catch (error) {
            let errorObj = {
                action: ACTION.SEND_VIDEO,
                errorCode: error?.response?.body?.error_code,
                errorDescription: error?.response?.body?.description,
                userName,
                chatId,
                shortCode,
            };

            if (error?.response?.body?.error_code === 429) {
                logError({ ...errorObj, type: ERROR_TYPE.RATE_LIMIT });
            } else if (error?.response?.body?.error_code === 400) {
                await sendMessage(
                    "Unable to send video 😢 \nPossibly, it might have exceeded the Bot's upload limit. \n\nPlease download the video from below link: \n" +
                        mediaUrl
                );
                logMessage({
                    type: LOG_TYPE.VIDEO_URL,
                    userName,
                    chatId,
                    shortCode,
                });
            } else {
                logError({ ...errorObj, type: ERROR_TYPE.FAILED });
            }
        }
    };

    const sendPhoto = async (mediaUrl) => {
        try {
            await bot.sendPhoto(chatId, mediaUrl);
            logMessage({
                type: LOG_TYPE.PHOTO,
                userName,
                chatId,
                shortCode,
            });
        } catch (error) {
            let errorObj = {
                action: ACTION.SEND_PHOTO,
                errorCode: error?.response?.body?.error_code,
                errorDescription: error?.response?.body?.description,
                userName,
                chatId,
                shortCode,
            };

            if (error?.response?.body?.error_code === 429) {
                logError({ ...errorObj, type: ERROR_TYPE.RATE_LIMIT });
            } else if (error?.response?.body?.error_code === 400) {
                await sendMessage(
                    "Unable to send Photo 😢 \nPossibly, it might have exceeded the Bot's upload limit. \n\nPlease download the photo from below link: \n" +
                        mediaUrl
                );
                logMessage({
                    type: LOG_TYPE.PHOTO_URL,
                    userName,
                    chatId,
                    shortCode,
                });
            } else {
                logError({ ...errorObj, type: ERROR_TYPE.FAILED });
            }
        }
    };

    await sendChatAction();

    // Process user message
    if (userMessage === "/start") {
        let first_name = msg.from.first_name || "";
        let welcomeMessage = `Hi ${first_name}, 👋\nWelcome to Insta Saver Bot! \n\nTo get started, send me the link of Instagram post, Reels, IGTV, etc. to download the video. \n\nHappy downloading!`;

        // send a message to the chat acknowledging receipt of their message
        await sendMessage(welcomeMessage);
    } else if (isURL) {
        const downloadingMessage = await sendMessage("Gathering content 🔍");
        if (downloadingMessage) {
            messagesToDelete.push(downloadingMessage.message_id);
        }

        let url = userMessage;
        let urlResponse = domainCleaner(url);

        if (!urlResponse.success) {
            await sendMessage(urlResponse.data);
            await deleteMessages();
            return;
        } else {
            url = urlResponse.data;
        }

        shortCode = extractShortCode(url);
        console.log(`➡️  Downloading post for: ${shortCode} 📥`);

        let streamResponse = await getStreamData(shortCode);

        if (!streamResponse.success) {
            await sendMessage(streamResponse.message);
            await deleteMessages();
            return;
        }

        await sendChatAction();

        // Send the 'Uploading post...' message and store the message ID
        const uploadingMessage = await sendMessage("Initiating upload 🚀");
        if (uploadingMessage) {
            messagesToDelete.push(uploadingMessage.message_id);
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

            await sendMediaGroup(mediaGroupUrls);
        } else if (media.mediaType === "XDTGraphVideo") {
            await sendVideo(media.mediaUrl);
        } else if (media.mediaType === "XDTGraphImage") {
            await sendPhoto(media.mediaUrl);
        }

        if (media.caption) {
            // Send 'typing' action
            await sendChatAction();

            // Send the caption
            await sendMessage(media.caption);
        }

        await deleteMessages();
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
