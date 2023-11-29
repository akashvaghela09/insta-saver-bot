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
}

const extractShortCode = (url) => {
    // Define a regular expression pattern to match the streamId in the URL
    const regex = /\/(?:reel|p)\/([a-zA-Z0-9_-]+)/;

    // Use the regular expression to match and extract the streamId
    const match = url.match(regex);

    // Return the extracted streamId or null if not found
    return match ? match[1] : null;
}

module.exports = {
    waitFor,
    domainCleaner,
    extractShortCode
};
