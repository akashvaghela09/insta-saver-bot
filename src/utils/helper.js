const waitFor = async (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

const findMediaByShortCode = (mediaList, shortCode) => {
    return mediaList.find((media) => media.shortCode === shortCode) || null;
};

module.exports = {
    waitFor,
    findMediaByShortCode,
};
