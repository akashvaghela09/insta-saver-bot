const axios = require('axios');

const getOwnerId = async (shortCode) => {

    let response = {
        success: false,
        data: null
    }

    try {
        let ownerIdResponse = await axios.get(`https://www.instagram.com/graphql/query/?doc_id=17867389474812335&variables={"include_logged_out":true,"include_reel":false,"shortcode": "${shortCode}"}`);
        let ownerId = ownerIdResponse.data.data.shortcode_media.owner.id;
        response.success = true;
        response.data = ownerId;
    } catch (error) {
        console.log(error);
        response.success = false;
        response.message = 'Something went wrong while fetching ownerID. Please try again later.';
    }

    return response;
};

const getStreamData = async () => { };

module.exports = {
    getOwnerId,
    getStreamData
};