const { SUCCESS_MESSAGE, LOG_TYPE, ERROR_TYPE } = require("./constants");

const waitFor = async (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

const domainCleaner = (url) => {
    // Regular expression to check if the URL starts with https://www.instagram.com/
    const instagramRegex = /^https:\/\/www\.instagram\.com\//i;

    try {
        // Check if the URL is a valid Instagram URL
        if (!instagramRegex.test(url)) {
            throw new Error("Please send a valid Instagram URL");
        }

        // Return success true and the clean URL
        return { success: true, data: url };
    } catch (error) {
        // Return success false and the error message
        return { success: false, data: error.message };
    }
};

const extractShortCode = (url) => {
    // Define a regular expression pattern to match the streamId in the URL
    const regex = /\/(?:reel|p)\/([a-zA-Z0-9_-]+)/;

    // Use the regular expression to match and extract the streamId
    const match = url.match(regex);

    // Return the extracted streamId or null if not found
    return match ? match[1] : null;
};

const edgeListCleaner = (streamList) => {
    let results = [];

    for (let i = 0; i < streamList.length; i++) {
        let media = streamList[i].node;
        let mediaType = media.__typename;
        let ownerId = media?.owner?.id;
        let shortCode = media.shortcode;
        let userName = media?.owner?.username;
        let mediaUrl = "";
        let mediaList = [];
        let caption = media.edge_media_to_caption?.edges[0]?.node?.text;

        switch (mediaType) {
            case "XDTGraphImage":
                mediaUrl = media.display_url;
                break;
            case "XDTGraphVideo":
                mediaUrl = media.video_url;
                break;
            case "XDTGraphSidecar":
                let list = edgeListCleaner(
                    media.edge_sidecar_to_children.edges
                );
                mediaList = [...list];
                break;
            default:
                mediaUrl = media.display_url;
                break;
        }

        let resultItem = {};

        if (mediaUrl) {
            resultItem.mediaUrl = mediaUrl;
        }

        if (mediaList.length > 0) {
            resultItem.mediaList = mediaList;
        }

        if (caption) {
            resultItem.caption = caption;
        }

        if (ownerId) {
            resultItem.ownerId = ownerId;
        }

        if (shortCode) {
            resultItem.shortCode = shortCode;
        }

        if (userName) {
            resultItem.userName = userName;
        }

        if (mediaType) {
            resultItem.mediaType = mediaType;
        }

        results.push(resultItem);
    }

    return results;
};

const findMedia = (mediaList, shortCode) => {
    let media = mediaList.find((media) => media.shortCode === shortCode);

    if (media) {
        return media;
    } else {
        return null;
    }
};

const logMessage = ({ type, userName, chatId, shortCode }) => {
    const DIVIDER = "\n-------------------------------------\n";
    const LOG = `\n User: ${userName}\n Chat Id: ${chatId}\n Short Code: ${shortCode}`;

    switch (type) {
        case LOG_TYPE.GROUP:
            console.log(DIVIDER, SUCCESS_MESSAGE.GROUP, LOG, DIVIDER);
            break;
        case LOG_TYPE.VIDEO:
            console.log(DIVIDER, SUCCESS_MESSAGE.VIDEO, LOG, DIVIDER);
            break;
        case LOG_TYPE.VIDEO_URL:
            console.log(DIVIDER, SUCCESS_MESSAGE.VIDEO_URL, LOG, DIVIDER);
            break;
        case LOG_TYPE.PHOTO:
            console.log(DIVIDER, SUCCESS_MESSAGE.PHOTO, LOG, DIVIDER);
            break;
        case LOG_TYPE.PHOTO_URL:
            console.log(DIVIDER, SUCCESS_MESSAGE.VIDEO_URL, LOG, DIVIDER);
            break;
        default:
            break;
    }
};

const logError = ({
    type,
    action,
    errorCode,
    errorDescription,
    userName,
    chatId,
    shortCode,
}) => {
    const DIVIDER = "\n-------------------------------------\n";
    const LOG = `\n Code: ${errorCode ? errorCode : ""}\n Description: ${
        errorDescription ? errorDescription : ""
    }\n User: ${userName}\n Chat Id: ${chatId}\n Short Code: ${shortCode}`;

    switch (type) {
        case ERROR_TYPE.RATE_LIMIT:
            console.log(DIVIDER, action, ERROR_TYPE.RATE_LIMIT, LOG, DIVIDER);
            break;
        case ERROR_TYPE.FAILED:
            console.log(DIVIDER, action, ERROR_TYPE.FAILED, LOG, DIVIDER);
            break;
        default:
            break;
    }
};

module.exports = {
    waitFor,
    domainCleaner,
    extractShortCode,
    edgeListCleaner,
    findMedia,
    logMessage,
    logError,
};
