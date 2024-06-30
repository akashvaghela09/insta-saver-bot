<p align="center">
    <img width=200px height=200px src="./assets//icon.png" alt="Project logo">
</p>

<h1 align="center">Insta Saver Bot 🤖</h1>

### Description

The Insta Saver Bot is a versatile tool (Telegram bot) designed to simplify the process of downloading Instagram content. bot can fetch various types of content, including Reels, regular posts, and images. It not only retrieves the content but also preserves the original captions. Additionally, the bot supports carousal posts with multiple items, enhancing its functionality for a seamless user experience. The bot uses [FastDl](https://fastdl.app) by default for scraping content.

***Note:*** *This bot is not affiliated with Instagram and FastDl in any way. It is an independent project developed for educational purposes only.*

********

### Bot URL
Try on Telegram: [Insta Saver Bot](https://t.me/instaa_saver_bot)

### Features

1. **Content Variety:** Download Reels, regular posts, and images from Instagram.
2. **Caption Preservation:** Capture and include original captions with downloaded content.
3. **Carousal Support:** Seamlessly handle and download multiple items in carousal posts.
4. The bot offers multiple options to scrape content
    - **Fastdl Scrapping:** Utilizes Puppeteer to scrape content from [FastDl](https://fastdl.app)
    - **Instagram Scrapping:** Utilizes Puppeteer to scrape content from [Instagram](https://instagram.com)
    - **Timeline-Based Scraping:** Uses Instagram's public-facing API for scraping content.
    - **YT-DLP CLI Tool:** Incorporates [yt-dlp](https://github.com/yt-dlp/yt-dlp) CLI tool for additional scraping methods.

### Changelog

[View the Changelog](CHANGELOG.md)

### How to Set Up Locally

1. **Clone Repository:**
    ```bash
    git clone https://github.com/akashvaghela09/insta-saver-bot.git
    ```

2. **Navigate to Repository:**
    ```bash
    cd insta-saver-bot
    ```

3. **Install Packages:**
    ```bash
    npm i
    ```

4. **Rename and Update Environment File:**
    - Duplicate the `example.env` file and rename it to `.env`.
    - Update the Telegram token and MongoDB URI in the `.env` file.

### How to Run

1. **Execute Dev Script:**
    ```bash
    npm run dev
    ```

### Contributor
- [Akash Vaghela](https://linkedin.com/in/akashvaghela09/)

Feel free to contribute and enhance the functionality of the Insta Saver Bot!