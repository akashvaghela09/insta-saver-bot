const axios = require("axios");
const { findMediaByShortCode, log, cleanTimelineResponse } = require("./utils");
const { INSTAGRAM_API_URL } = require("./constants");

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
        console.error("Error fetching owner ID:", error);
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
        console.error("Error fetching timeline data:", error);
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
        return getStreamDataRecursively(
            shortCode,
            ownerId,
            pageInfo.end_cursor
        );
    }

    return { success: false };
};

module.exports = {
    fetchOwnerId,
    fetchTimelineData,
    getStreamDataRecursively,
};
