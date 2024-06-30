


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

#### v0.1.3
- Resolves all previous issues like rate limiting, timeout error etc.
- Only requires short code to fetch post content.
- Faster response compared to previous versions, as only necessary calls to Instagram servers are made.
- Steps:
    - Extract shortCode from post URL.
    - POST request for desired content with all required headers and cookies.
    - Extract post content and caption from json response.

#### v0.1.4
- FIX: Server crash when No caption is available.
- FIX: Carousal media download issue.
- UPDATE: Send Corousal media as a group. 
- ADD: Ignore user files/media from message

### v0.1.5
- ADD: Logs for message success and errors
- ADD: Custom methods to handle telegram actions such as sendMessage, deleteMessage for better error handling
- FIX: Server crash on telegram rate limit error.

### v0.1.6
- ADD: YT-DL based content scrapping 
- ADD: FastDL based content scrapping 
- ADD: Write logs and errors to files
- ADD: Docker setup for deployment
- ADD: MongoDB based localise request queue
- UPDATE: Timeline based recursive scrapping