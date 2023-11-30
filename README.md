<p align="center">
    <img width=200px height=200px src="./assets//icon.png" alt="Project logo">
</p>

<h1 align="center">Insta Saver Bot 🤖</h1>

### Description

The Insta Saver Bot is a versatile tool (Telegram bot) designed to simplify the process of downloading Instagram content. Leveraging reverse engineering of Instagram's API, this bot can fetch various types of content, including Reels, regular posts, and images. It not only retrieves the content but also preserves the original captions. Additionally, the bot supports carousal posts with multiple items, enhancing its functionality for a seamless user experience.

***Note:*** *This bot is not affiliated with Instagram in any way. It is an independent project developed for educational purposes only.*

********

### Bot URL
Try on Telegram: [Insta Saver Bot](https://t.me/instaa_saver_bot)

### Features

1. **Content Variety:** Download Reels, regular posts, and images from Instagram.
2. **Caption Preservation:** Capture and include original captions with downloaded content.
3. **Carousal Support:** Seamlessly handle and download multiple items in carousal posts.

### Future Scope

1. **Extended Post Limit:** Currently supporting the download of the latest 50 posts, the bot's capabilities will be expanded to include a broader range of recent content in future updates.

### Changelog

#### v0.1.1
- Opens URL with Puppeteer to scrape post and caption data.
- Reliability issues and difficulties in scraping.
- Waiting for the entire page to load and extracting the video src string.
- Network timeout issues.

#### v0.1.2
- Utilizes Instagram APIs for faster and more reliable data retrieval.
- Supports all post formats and efficiently scrapes username, caption, and metadata.
- Steps:
    1. Retrieves ownerId using the shortCode (available in every Instagram post).
    2. Fetches recent posts (max 50) from the user's timeline and matches shortCodes to return the required post content.
- Issues:
    1. Works well locally but encounters a 401 error when deployed due to rate limiting.
    2. Old post support not available (not implemented!).
    3. Requires multiple API calls and loops through every post from the timeline to match and return content (originally  in the future scope).

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
    - Update the Telegram token in the `.env` file.

### How to Run

1. **Execute Dev Script:**
    ```bash
    npm run dev
    ```

### Contributor
- [Akash Vaghela](https://linkedin.com/in/akashvaghela09/)

Feel free to contribute and enhance the functionality of the Insta Saver Bot!