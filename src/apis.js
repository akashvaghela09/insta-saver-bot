const axios = require('axios');
const { edgeListCleaner } = require('./helper');

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

const getTimelineData = async (ownerId) => {

    let response = {
        success: false,
        data: null
    }

    try {
        let streamResponse = await axios.get(`https://www.instagram.com/graphql/query/?doc_id=17991233890457762&variables={"id":"${ownerId}","first":50}`);
        response.success = true;
        response.data = streamResponse;
    } catch (error) {
        console.log(error);
        response.success = false;
        response.message = 'Something went wrong while fetching timeline. Please try again later.';
    }

    return response;
};

const getStreamData = async (shortCode) => {

    const returnResponse = {
        success: false,
        data: {}
    };

    const url = "https://www.instagram.com/api/graphql";

    const headers = {
        "Host": "www.instagram.com",
        "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/x-www-form-urlencoded",
        "X-FB-Friendly-Name": "PolarisPostActionLoadPostQueryQuery",
        "X-CSRFToken": "fqJs5shoZJWCvyE9gTsM7l4EimeRV5V3",
        "X-IG-App-ID": "936619743392459",
        "X-FB-LSD": "AVpms6PPJtI",
        "X-ASBD-ID": "129477",
        "Origin": "https://www.instagram.com",
        "DNT": "1",
        "Connection": "keep-alive",
        "Referer": `https://www.instagram.com/reel/${shortCode}`,
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Sec-GPC": "1",
        "TE": "trailers",
        "Cookie": "mid=ZUOa-AAEAAHzhxibXoWlMBI1YybO; ig_did=ED31654E-87E1-4ED2-8029-8F366D045CE7; ig_nrcb=1; datr=9ppDZSaYso-Nc64Wte484DoV; rur=\"FRC\\05412913748258\\0541732870355:01f70fd04d8d9729a13a484d8bd2ff883ebbc5671876616d272c893cdd4e857281be1862\"; shbid=\"6261\\05412913748258\\0541732867548:01f7669854f1407cdcce5e21ebf1aa9ec3707d844329abf7b4ed75802647fbda7f803d49\"; shbts=\"1701331548\\05412913748258\\0541732867548:01f7ddf6207f5a0bd33195eb22df72688db83756b6d18201b20c2fd74aca55dadeab4f7b\"; csrftoken=fqJs5shoZJWCvyE9gTsM7l4EimeRV5V3",
    };

    const data = {
        av: "0",
        __d: "www",
        __user: "0",
        __a: "1",
        __req: "3",
        __hs: "19691.HYP:instagram_web_pkg.2.1..0.0",
        dpr: "1",
        __ccg: "UNKNOWN",
        __rev: "1010118318",
        __s: "onn8rp:vdyukq:0sv0ue",
        __hsi: "7307175819475094593",
        __dyn: "7xeUjG1mxu1syUbFuC0DU98nwgU29zEdEc8co2qwJw5ux609vCwjE1xoswIwuo2awlU-cw5Mx62G3i1ywOwv89k2C1Fwc60AEC7U2czXwae4UaEW2G1NwwwNwKwHw8Xxm16wUwtEvw4JwJwSyES1Twoob82ZwrUdUbGwmk1xwmo6O1FwlE6OFA6bxy4Ujw",
        __csr: "jEaMABf79mBiXAjimmbQ-SCn-i8BDyCajF6yt4hFe9gKm6VKqm-5BhoK59aEJGdQGQiiaAAByKQXXhvpFAm8yAUkAAybGm9Gqbxm4pEWu4oZyEnzE9o014PA0d380AE2Ca0zE0lJw1F2eNrwa23BwBw3Ao1PURiw3h3w7lw6Bg07Ce",
        __comet_req: "7",
        lsd: "AVpms6PPJtI",
        jazoest: "2964",
        __spin_r: "1010118318",
        __spin_b: "trunk",
        __spin_t: "1701334449",
        fb_api_caller_class: "RelayModern",
        fb_api_req_friendly_name: "PolarisPostActionLoadPostQueryQuery",
        variables: `{"shortcode": "${shortCode}","fetch_comment_count":40,"fetch_related_profile_media_count":3,"parent_comment_count":24,"child_comment_count":3,"fetch_like_count":10,"fetch_tagged_user_count":null,"fetch_preview_comment_count":2,"has_threaded_comments":true,"hoisted_comment_id":null,"hoisted_reply_id":null}`,
        server_timestamps: true,
        doc_id: "10015901848480474",
    };

    try {
        const response = await axios.post(url, data, { headers });
        let responseData = response.data.data.xdt_shortcode_media;

        if (!responseData) {
            returnResponse.success = false;
            returnResponse.message = 'Content not found. make sure the account is public and post is not age restricted.';
            return returnResponse;
        }

        let mediaType = responseData?.__typename;
        let displayUrl = responseData?.display_url;
        let videoUrl = responseData?.video_url;
        let captionText = responseData?.edge_media_to_caption?.edges[0]?.node?.text || "";

        returnResponse.success = true;
        returnResponse.data.mediaUrl = videoUrl || displayUrl;
        returnResponse.data.displayUrl = displayUrl;
        returnResponse.data.mediaType = mediaType;
        returnResponse.data.caption = captionText;

        if (mediaType === 'XDTGraphSidecar') {
            let edgeList = responseData.edge_sidecar_to_children.edges;
            let cleanList = edgeListCleaner(edgeList);

            returnResponse.data.mediaList = cleanList;
        }
    } catch (error) {
        console.log(error);

        returnResponse.success = false;
        returnResponse.message = 'Something went wrong while fetching stream data. Please try again later.';
    }

    return returnResponse;
};

module.exports = {
    getOwnerId,
    getTimelineData,
    getStreamData
};