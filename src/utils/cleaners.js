const extractShortCode = (url) => {
    // Define a regular expression pattern to match the streamId in the URL
    const regex = /\/(?:reel|p)\/([a-zA-Z0-9_-]+)/;

    // Use the regular expression to match and extract the streamId
    const match = url.match(regex);

    // Return the extracted streamId or null if not found
    return match ? match[1] : null;
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

const edgeListCleaner = (streamList) => {
    let results = [];

    for (let i = 0; i < streamList.length; i++) {
        let media = streamList[i].node;
        let mediaType = media.__typename;
        let ownerId = media?.owner?.id;
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

module.exports = {
    extractShortCode,
    domainCleaner,
    edgeListCleaner,
};
