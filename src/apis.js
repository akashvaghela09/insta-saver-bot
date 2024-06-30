const axios = require("axios");
const {
    findMediaByShortCode,
    cleanTimelineResponse,
    waitFor,
    log,
} = require("./utils");
const { INSTAGRAM_API_URL, MEDIA_TYPE } = require("./constants");
const { exec } = require("child_process");
const { Browser } = require("./config");

const fetchOwnerId = async (shortCode) => {
    try {
        const response = await axios.get(
            `${INSTAGRAM_API_URL}/?doc_id=17867389474812335&variables={"include_logged_out":true,"include_reel":false,"shortcode":"${shortCode}"}`
        );
        const ownerId = response?.data?.data?.shortcode_media?.owner?.id;

        if (ownerId) {
            return { success: true, data: ownerId };
        }
    } catch (error) {
        log("Error fetching owner ID:", error);
    }

    return { success: false };
};

const fetchTimelineData = async (ownerId, after = null) => {
    try {
        let url = `${INSTAGRAM_API_URL}/?doc_id=17991233890457762&variables={"id":"${ownerId}","first":50,"after":${
            after ? `"${after}"` : null
        }}`;
        const response = await axios.get(url);
        return { success: true, data: response.data };
    } catch (error) {
        log("Error fetching timeline data:", error?.response?.data);
    }
    return {
        success: false,
        message: "Error fetching timeline data. Please try again later.",
    };
};

const getStreamDataRecursively = async (shortCode, ownerId, after = null) => {
    const timelineResponse = await fetchTimelineData(ownerId, after);
    if (!timelineResponse.success) {
        return null;
    }

    const streamList =
        timelineResponse.data?.data?.user?.edge_owner_to_timeline_media
            ?.edges || [];
    const pageInfo =
        timelineResponse.data?.data?.user?.edge_owner_to_timeline_media
            ?.page_info;

    const mediaList = cleanTimelineResponse(streamList);
    const media = findMediaByShortCode(mediaList, shortCode);

    if (media) {
        return { data: media, success: true };
    }

    if (pageInfo?.has_next_page) {
        await waitFor(500);
        return getStreamDataRecursively(
            shortCode,
            ownerId,
            pageInfo.end_cursor
        );
    }

    return { success: false };
};

const getMediaUrl = async (instagramUrl) => {
    // Command to execute yt-dlp to fetch video URL
    const command = `./yt-dlp_linux -f b -g --cookies ./cookies.txt "${instagramUrl}"`;

    try {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return reject({ success: false, data: { mediaUrl: null } });
                }

                // If successful, stdout contains the direct video URL
                const mediaUrl = stdout.trim(); // Trim whitespace, if any
                resolve({
                    success: true,
                    data: {
                        mediaUrl,
                        mediaType: MEDIA_TYPE.VIDEO,
                    },
                });
            });
        });
    } catch (error) {
        log("failed in exec command: ", error);
        return { success: false, data: { mediaUrl: null } };
    }
};

const scrapWithFastDl = async (requestUrl) => {
    const browser = Browser.browserInstance;
    let page;
    const finalResponse = {
        data: {},
        success: false,
    };

    try {
        page = await browser.newPage();

        await page.goto("https://fastdl.app/en");
        console.log("browser Went to fastdl");

        // Wait for the input field to be ready and type the URL
        await page.waitForSelector("#search-form-input");
        await page.type("#search-form-input", requestUrl, { delay: 10 });
        console.log("Typed URL into input field");

        // Click the button with class search-form__button, type submit
        await page.evaluate(() => {
            const downloadButton = document.querySelector(
                '.search-form__button[type="submit"]'
            );
            if (downloadButton) {
                downloadButton.click();
            }
        });

        try {
            const captionElement = await page.waitForSelector(
                ".output-list__caption",
                { timeout: 5000 }
            );

            if (captionElement) {
                const captionText = await page.evaluate(
                    (element) => element.textContent,
                    captionElement
                );
                finalResponse.data.caption = captionText.trim();
            }
        } catch (error) {
            console.log("failed to scrap caption: ", error);
        }

        try {
            // Wait for the <ul> element to be present
            const ulElement = await page.waitForSelector(".output-list__list", {
                timeout: 5000,
            });

            if (ulElement) {
                // Evaluate in the context of the page to extract information from each <li> item
                const mediaList = await page.evaluate((ul) => {
                    const itemList = [];
                    // Select all <li> elements under the <ul>
                    const liElements =
                        ul.querySelectorAll(".output-list__item");

                    // Loop through each <li> element
                    liElements.forEach((li) => {
                        // Extract mediaUrl from <a> tag
                        const aTag = li.querySelector("a");
                        const mediaUrl = aTag ? aTag.href : "";

                        // Extract displayUrl from <img> tag
                        const imgTag = li.querySelector("img");
                        const displayUrl = imgTag ? imgTag.src : "";

                        // Extract mediaType from <span> tag
                        const spanTag = li.querySelector("span");
                        const classString = spanTag ? spanTag.className : "";

                        // Push the extracted data into itemList
                        itemList.push({ mediaUrl, displayUrl, classString });
                    });

                    return itemList;
                }, ulElement);

                // for (let i = 0; i < mediaList.length; i++) {
                //     console.log(mediaList[i]);
                // }

                let firstItem = {};
                if (mediaList.length > 1) {
                    finalResponse.data.mediaType = MEDIA_TYPE.MEDIA_GROUP;
                    firstItem = mediaList[0];

                    for (let i = 0; i < mediaList.length; i++) {
                        if (mediaList[i].classString.includes("video")) {
                            mediaList[i].mediaType = MEDIA_TYPE.VIDEO;
                        } else {
                            mediaList[i].mediaType = MEDIA_TYPE.IMAGE;
                        }
                    }
                } else if (mediaList.length === 1) {
                    firstItem = mediaList.shift();

                    if (firstItem.classString.includes("video")) {
                        finalResponse.data.mediaType = MEDIA_TYPE.VIDEO;
                    } else {
                        finalResponse.data.mediaType = MEDIA_TYPE.IMAGE;
                    }
                }
                finalResponse.data.mediaUrl = firstItem.mediaUrl;
                finalResponse.data.displayUrl = firstItem.displayUrl;
                finalResponse.data.mediaList = mediaList;
                finalResponse.success = true;
            } else {
                console.error("UL element not found");
            }
        } catch (error) {
            console.error("Error scraping items:", error);
        }
    } catch (error) {
        console.error("Error in scraping:", error);
    } finally {
        await page.close();
        console.log("Page closed after scraping");
    }

    return finalResponse;
};

module.exports = {
    fetchOwnerId,
    fetchTimelineData,
    getStreamDataRecursively,
    getMediaUrl,
    scrapWithFastDl,
};
