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

const timelineResponseCleaner = (streamList) => {
    let results = [];

    for (let i = 0; i < streamList.length; i++) {
        let media = streamList[i].node;
        let mediaType = media.__typename;
        let mediaUrl = '';
        let caption = media.edge_media_to_caption.edges[0].node.text;
        let ownerId = media.owner.id;
        let shortCode = media.shortcode;
        let userName = media.owner.username;

        switch (mediaType) {
            case 'GraphImage':
                mediaUrl = media.display_url;
                break;
            case 'GraphVideo':
                mediaUrl = media.video_url;
                break;
            case 'GraphSidecar':
                mediaUrl = media.edge_sidecar_to_children.edges[0].node.video_url;
                break;
            default:
                mediaUrl = media.display_url;
                break;
        }

        results.push({
            mediaUrl,
            caption,
            ownerId,
            shortCode,
            userName
        });
    }

    return results;
}

module.exports = {
    waitFor,
    domainCleaner,
    extractShortCode,
    timelineResponseCleaner
};
