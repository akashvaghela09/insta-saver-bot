require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const app = express();
const { domainCleaner, extractShortCode, timelineResponseCleaner, findMedia } = require('./helper');
const axios = require("axios");

// Set the server to listen on port 6060
const PORT = process.env.PORT || 6060;

const token = process.env.TELEGRAM_TOKEN;
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Listen for any kind of message. There are different kinds of
// messages.
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
        let ownerIdResponse = await axios.get(`https://www.instagram.com/graphql/query/?doc_id=17867389474812335&variables={"include_logged_out":true,"include_reel":false,"shortcode": "${shortCode}"}`);

        let ownerId = ownerIdResponse.data.data.shortcode_media.owner.id;

        let streamResponse = await axios.get(`https://www.instagram.com/graphql/query/?doc_id=17991233890457762&variables={"id":"${ownerId}","first":50}`);
        let timelineMedia = streamResponse.data.data.user.edge_owner_to_timeline_media;
        let streamList = timelineMedia.edges;
        // let totalMedia = streamResponse.data.data.user.edge_owner_to_timeline_media.count;
        // let hasNextPage = timelineMedia.page_info.has_next_page;
        // let endCursor = timelineMedia.page_info.end_cursor;

        let results = timelineResponseCleaner(streamList);
        let media = findMedia(results, shortCode);

        if (media) {
            // Send 'typing' action
            bot.sendChatAction(chatId, 'typing');

            // Send the 'Downloading post...' message and store the message ID
            const downloadingMessage = await bot.sendMessage(chatId, 'Downloading post ...');

            if (media.mediaType === 'GraphSidecar') {
                // Send the carousel
                for (let i = 0; i < media.mediaList.length; i++) {
                    let mediaItem = media.mediaList[i];
                    if (mediaItem.mediaType === 'GraphImage') {
                        // Send the image
                        await bot.sendPhoto(chatId, mediaItem.mediaUrl);
                    } else if (mediaItem.mediaType === 'GraphVideo') {
                        // Send the video
                        await bot.sendVideo(chatId, mediaItem.mediaUrl);
                    }
                }
            } else if (media.mediaType === 'GraphVideo') {
                // Send the video
                await bot.sendVideo(chatId, media.mediaUrl);
            } else if (media.mediaType === 'GraphImage') {
                // Send the image
                await bot.sendPhoto(chatId, media.mediaUrl);
            }
            
            // Delete the 'Downloading video...' message
            await bot.deleteMessage(chatId, downloadingMessage.message_id);

            // Send 'typing' action
            bot.sendChatAction(chatId, 'typing');

            // Send the caption
            await bot.sendMessage(chatId, media.caption);
        } else {
            bot.sendMessage(chatId, 'Bot can only download from the latest 50 posts. \nWe will add support for more posts soon. \n\nThanks for your understanding.');
        }
    }
});

// Define a route for the GET request on the root endpoint '/'
app.get('/', (req, res) => {
    // Send the response 'Hello' when the endpoint is accessed
    res.send('Hello from InstaSaver Bot!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
