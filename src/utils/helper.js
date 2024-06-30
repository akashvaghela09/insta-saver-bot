const { log } = require("./logs");

const waitFor = async (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

const findMediaByShortCode = (mediaList, shortCode) => {
    return mediaList.find((media) => media.shortCode === shortCode) || null;
};

const isValidInstaUrl = (url) => {
    let response = {
        success: false,
        url,
    };

    try {
        const { host, pathname } = new URL(url);

        if (host !== "www.instagram.com") {
            return response;
        }

        let shortCode = pathname.trim().split("/")[2];

        if (shortCode?.length === 11) {
            return {
                url: url,
                shortCode,
                success: true,
            };
        }

        return response;
    } catch (error) {
        log("error in isValid : ", error);
        log("caused by : ", url);
        return response;
    }
};

module.exports = {
    waitFor,
    findMediaByShortCode,
    isValidInstaUrl,
};
