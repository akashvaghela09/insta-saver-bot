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

const sendVideo = async (chatId, videoUrl) => {
    try {
        const response = await axios.post(`https://api.telegram.org/bot${token}/sendVideo`, {
            chat_id: chatId,
            video: videoUrl,
        });

        console.log('Video sent successfully:', response.data);
    } catch (error) {
        console.error('Error sending video:', error.response ? error.response.data : error.message);
    }
}

// Listen for any kind of message. There are different kinds of messages.
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;

    // Show typing status
    bot.sendChatAction(chatId, 'typing');

    // Process user message
    if (userMessage === '/start') {
        let first_name = msg.from.first_name || '';
        let welcomeMessage = `Hi ${first_name}, \nWelcome to Insta Saver Bot! \n\nTo get started, send me the link of Instagram post, Reels, IGTV, etc. to download the video. \n\nHappy downloading!`

        // send a message to the chat acknowledging receipt of their message
        bot.sendMessage(chatId, welcomeMessage);
    } else {
        let url = userMessage;
        let urlResponse = domainCleaner(url);

        if (!urlResponse.success) {
            bot.sendMessage(chatId, urlResponse.data);
            return;
        } else {
            url = urlResponse.data;
        }

        let shortCode = extractShortCode(url);
        console.log("\n-------------------------------------\nDownloading post for: ", shortCode);

        let streamResponse = await getStreamData(shortCode);

        if (!streamResponse.success) {
            bot.sendMessage(chatId, streamResponse.message);
            return;
        }

        // Send 'typing' action
        bot.sendChatAction(chatId, 'typing');

        // Send the 'Downloading post...' message and store the message ID
        const downloadingMessage = await bot.sendMessage(chatId, 'Downloading ⏳');

        let media = streamResponse.data;
        console.log("Media Response ==================== \n\n", media);

        if (media.mediaType === 'XDTGraphSidecar') {
            // Send the carousel
            for (let i = 0; i < media.mediaList.length; i++) {
                let mediaItem = media.mediaList[i];
                if (mediaItem.mediaType === 'XDTGraphImage') {
                    // Send the image
                    await bot.sendPhoto(chatId, mediaItem.mediaUrl);
                } else if (mediaItem.mediaType === 'XDTGraphVideo') {
                    // Send the video
                    await sendVideo(chatId, mediaItem.mediaUrl);
                }
            }
        } else if (media.mediaType === 'XDTGraphVideo') {
            // Send the video
            await sendVideo(chatId, media.mediaUrl);
        } else if (media.mediaType === 'XDTGraphImage') {
            // Send the image
            await bot.sendPhoto(chatId, media.mediaUrl);
        }

        // Delete the 'Downloading video...' message
        await bot.deleteMessage(chatId, downloadingMessage.message_id);

        // Send 'typing' action
        bot.sendChatAction(chatId, 'typing');

        // Send the caption
        await bot.sendMessage(chatId, media.caption);

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
