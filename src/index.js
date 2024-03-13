require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const app = express();
const { domainCleaner, extractShortCode } = require('./helper');
const { getStreamData } = require('./apis');

// Set the server to listen on port 6060
const PORT = process.env.PORT || 6060;

const token = process.env.TELEGRAM_TOKEN;
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Listen for any kind of message. There are different kinds of messages.
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;
    const messagesToDelete = []

    // Show typing status
    bot.sendChatAction(chatId, 'typing');

    const deleteMessages = async (arg) => {
        messagesToDelete.forEach(async (message) => {
            await bot.deleteMessage(chatId, message);
        })
    }

    // Process user message
    if (userMessage === '/start') {
        let first_name = msg.from.first_name || '';
        let welcomeMessage = `Hi ${first_name}, 👋\nWelcome to Insta Saver Bot! \n\nTo get started, send me the link of Instagram post, Reels, IGTV, etc. to download the video. \n\nHappy downloading!`

        // send a message to the chat acknowledging receipt of their message
        bot.sendMessage(chatId, welcomeMessage);
    } else {
        // Send the 'Downloading post...' message and store the message ID
        const downloadingMessage = await bot.sendMessage(chatId, 'Gathering content 🔍');
        messagesToDelete.push(downloadingMessage.message_id);

        let url = userMessage;
        let urlResponse = domainCleaner(url);

        if (!urlResponse.success) {
            bot.sendMessage(chatId, urlResponse.data);
            await deleteMessages();
            return;
        } else {
            url = urlResponse.data;
        }

        let shortCode = extractShortCode(url);
        console.log(`\n-------------------------------------\nDownloading post for: ${shortCode} 📥`);

        let streamResponse = await getStreamData(shortCode);

        if (!streamResponse.success) {
            bot.sendMessage(chatId, streamResponse.message);
            await deleteMessages();
            return;
        }

        // Send 'typing' action
        bot.sendChatAction(chatId, 'typing');

        // Send the 'Uploading post...' message and store the message ID
        const uploadingMessage = await bot.sendMessage(chatId, 'Initiating upload 🚀');
        messagesToDelete.push(uploadingMessage.message_id);

        let media = streamResponse.data;
        console.log("Media Response ==================== \n\n", media);

        if (media.mediaType === 'XDTGraphSidecar') {
            // Prepare media url array
            const mediaGroupUrls = [];
            for (let i = 0; i < media.mediaList.length; i++) {
                let mediaItem = media.mediaList[i];
                if (mediaItem.mediaType === 'XDTGraphImage') {
                    // Add image to mediaGroupUrls
                    mediaGroupUrls.push({ type: 'photo', media: mediaItem.mediaUrl });
                } else if (mediaItem.mediaType === 'XDTGraphVideo') {
                    // Add video to mediaGroupUrls
                    mediaGroupUrls.push({ type: 'video', media: mediaItem.mediaUrl });
                }
            }

            try {
                // Send the media group
                await bot.sendMediaGroup(chatId, mediaGroupUrls);
                console.log("Media group sent successfully ✅");
            } catch (error) {
                let { error_code, parameters } = error?.response?.body;
                console.log("Error while sending media group:", error?.response?.body);

                if (error_code === 429) {
                    await bot.sendMessage(chatId, `Oops! Telegram's slowing us down with rate limits 😢. \nGive it ${parameters.retry_after} seconds and try again!`);
                }
            }
        } else if (media.mediaType === 'XDTGraphVideo') {
            try {
                // Send the video
                await bot.sendVideo(chatId, media.mediaUrl);
            } catch (error) {
                console.log("Error while sending video =============== \n", error?.response?.body);
                // Send the image
                await bot.sendMessage(chatId, "Unable to send video 😢 \nPossibly, it might have exceeded the Bot's upload limit. \n\nPlease download the video from below link: \n" + media.mediaUrl);
            }
        } else if (media.mediaType === 'XDTGraphImage') {
            // Send the image
            await bot.sendPhoto(chatId, media.mediaUrl);
        }

        if (media.caption) {
            // Send 'typing' action
            bot.sendChatAction(chatId, 'typing');

            // Send the caption
            await bot.sendMessage(chatId, media.caption);
        }

        await deleteMessages();
        return;
    }
});

// Define a route for the GET request on the root endpoint '/'
app.get('/', (req, res) => {
    // Send the response 'Hello' when the endpoint is accessed
    res.send('Hello from InstaSaver Bot!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
