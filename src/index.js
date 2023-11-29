require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const app = express();
const puppeteer = require('puppeteer');
const randomUseragent = require('random-useragent');

// Set the server to listen on port 6060
const PORT = process.env.PORT || 6060;

const token = process.env.TELEGRAM_TOKEN;
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

const waitFor = async (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userMessage = msg.text;

    // let url = "https://www.instagram.com/reel/C0HASg_MuUn/?igshid=MTc4MmM1YmI2Ng==";

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set a random user agent
    const userAgent = randomUseragent.getRandom();
    await page.setUserAgent(userAgent);

    // Navigate to the URL with the query parameter
    await page.goto(`${userMessage}`);

    // wait for 5 second and screenshot the page
    await waitFor(5000);

    // Let's use `page.content()` to get the entire page's HTML
    // const pageHTML = await page.content();// wait for 5 seconds to ensure the page is fully loaded

    // get all video tags
    const videoTags = await page.$$('video');
    console.log('Number of video tags:', videoTags.length);


    if (videoTags.length > 0) {
        // get the first video tag
        const videoTag = videoTags[0];
        // get the src attribute
        const src = await videoTag.evaluate(tag => tag.getAttribute('src'));
        console.log('Video source:', src);

        // send a message to the chat acknowledging receipt of their message
        bot.sendMessage(chatId, src);
    } else {
        console.log('No video tag found');

        // send a message to the chat acknowledging receipt of their message
        bot.sendMessage(chatId, 'No video tag found');
    }


    // Close the browser
    await browser.close();
});

// Define a route for the GET request on the root endpoint '/'
app.get('/', (req, res) => {
    // Send the response 'Hello' when the endpoint is accessed
    res.send('Hello');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
