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

module.exports = {
    waitFor,
    domainCleaner
};
