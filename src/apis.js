const axios = require("axios");
const { edgeListCleaner, log } = require("./utils");
const { Browser } = require("./config");

const getOwnerId = async (shortCode) => {
    let response = {
        success: false,
        data: null,
    };

    try {
        let ownerIdResponse = await axios.get(
            `https://www.instagram.com/graphql/query/?doc_id=17867389474812335&variables={"include_logged_out":true,"include_reel":false,"shortcode": "${shortCode}"}`
        );
        let ownerId = ownerIdResponse.data.data.shortcode_media.owner.id;
        response.success = true;
        response.data = ownerId;
    } catch (error) {
        console.log(error);
        response.success = false;
        response.message =
            "Something went wrong while fetching ownerID. Please try again later.";
    }

    return response;
};

const getTimelineData = async (ownerId) => {
    let response = {
        success: false,
        data: null,
    };

    try {
        let streamResponse = await axios.get(
            `https://www.instagram.com/graphql/query/?doc_id=17991233890457762&variables={"id":"${ownerId}","first":50}`
        );
        response.success = true;
        response.data = streamResponse;
    } catch (error) {
        console.log(error);
        response.success = false;
        response.message =
            "Something went wrong while fetching timeline. Please try again later.";
    }

    return response;
};

const getStreamData = async (url) => {
    log("getStreamData for ", url);
    const returnResponse = {
        success: false,
        data: {},
    };

    const browser = Browser.browserInstance; // Accessing the browser instance from configuration
    let page;

    try {
        page = await browser.newPage(); // Opening a new page using the browser instance

        let responseData;
        const responsePromise = new Promise((resolve, reject) => {
            // Listening for network responses on the page
            page.on("response", async (response) => {
                const responseUrl = response.url();
                if (responseUrl === "https://www.instagram.com/graphql/query") {
                    try {
                        // Parsing the JSON response from the GraphQL API
                        const responseBody = await response.text();
                        const parsedBody = JSON.parse(responseBody);
                        responseData = parsedBody?.data?.xdt_shortcode_media;

                        if (!responseData) {
                            log("responseBody : ", responseBody);
                            resolve(responseBody);
                        }

                        resolve(responseData);
                    } catch (error) {
                        log(
                            `Error parsing JSON response from ${responseUrl}: ${error.message}`
                        );
                        reject(error);
                    }
                }
            });
        });

        // Navigating to the provided Instagram URL and waiting for network requests to complete
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        await responsePromise; // Waiting for the specific GraphQL query response

        if (!responseData) {
            returnResponse.message =
                "Content not found. Make sure the account is public and the post is not age-restricted.";
            return returnResponse;
        }

        // Extracting relevant data from the GraphQL response
        let mediaType = responseData?.__typename;
        let displayUrl = responseData?.display_url;
        let thumbnailUrl = responseData?.thumbnail_src;
        let videoUrl = responseData?.video_url;
        let captionText =
            responseData?.edge_media_to_caption?.edges[0]?.node?.text || "";
        let owner = {
            userName: responseData?.owner?.username,
            avatarUrl: responseData?.owner?.profile_pic_url,
            fullName: responseData?.owner?.full_name,
        };

        returnResponse.success = true;
        returnResponse.data.mediaUrl = videoUrl || displayUrl;
        returnResponse.data.displayUrl = displayUrl;
        returnResponse.data.thumbnailUrl = thumbnailUrl;
        returnResponse.data.mediaType = mediaType;
        returnResponse.data.caption = captionText;
        returnResponse.data.owner = owner;

        // If media type is a carousel (MEDIA_TYPE.MEDIA_GROUP), clean and process the list
        if (mediaType === MEDIA_TYPE.MEDIA_GROUP) {
            let edgeList = responseData.edge_sidecar_to_children.edges;
            let cleanList = edgeListCleaner(edgeList);

            returnResponse.data.mediaList = cleanList;
        }
    } catch (error) {
        log("Error occurred while fetching data:", error);
        returnResponse.success = false;
        returnResponse.message =
            "Something went wrong while fetching stream data. Please try again later.";
    } finally {
        if (page) {
            await page.close(); // Closing the page after processing
        }
    }

    return returnResponse;
};

module.exports = {
    getOwnerId,
    getTimelineData,
    getStreamData,
};
