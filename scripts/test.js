const axios = require("axios");
const fs = require("fs");
let url = "https://www.instagram.com/api/graphql";

let fetchData = async () => {
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
        "Referer": "https://www.instagram.com/reel/Cz5svbdyjhu/?igshid=MTc4MmM1YmI2Ng%3D%3D",
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
        variables: '{"shortcode":"Cz5svbdyjhu","fetch_comment_count":40,"fetch_related_profile_media_count":3,"parent_comment_count":24,"child_comment_count":3,"fetch_like_count":10,"fetch_tagged_user_count":null,"fetch_preview_comment_count":2,"has_threaded_comments":true,"hoisted_comment_id":null,"hoisted_reply_id":null}',
        server_timestamps: true,
        doc_id: "10015901848480474",
    };

    try {
        const response = await axios.post(url, data, { headers });
        let responseData = response.data;
        
        // save the response to a json file
        fs.writeFileSync("data.json", JSON.stringify(responseData));


        console.log("Display URL: ", responseData.data.xdt_shortcode_media.display_url);
        console.log("Video URL: ", responseData.data.xdt_shortcode_media.video_url);
        console.log("Caption: ", responseData.data.xdt_shortcode_media.edge_media_to_caption.edges[0].node.text);
    } catch (error) {
        console.log(error);
    }
};

fetchData("Cz5svbdyjhu");
