const LOG_TYPE = {
    GROUP: "GROUP",
    VIDEO: "VIDEO",
    VIDEO_URL: "VIDEO_URL",
    PHOTO: "PHOTO",
    PHOTO_URL: "PHOTO_URL",
};

const ERROR_TYPE = {
    RATE_LIMIT: "Encountered Rate Limit 😢.",
    FAILED: "Failed 😢.",
};

const ACTION = {
    SEND_CHAT_ACTION: "sendChatAction",
    SEND_MESSAGE: "sendMessage",
    DELETE_MESSAGE: "deleteMessage",
    SEND_VIDEO: "sendVideo",
    SEND_PHOTO: "sendPhoto",
    SEND_MEDIA_GROUP: "sendMediaGroup",
};

const SUCCESS_MESSAGE = {
    GROUP: "Media group sent successfully ✅",
    VIDEO: "Video sent successfully ✅",
    VIDEO_URL: "Video url sent successfully ✅",
    PHOTO: "Photo sent successfully ✅",
    PHOTO_URL: "Photo url sent successfully ✅",
};

const MESSSAGE = {
    HELLO: "Hello from InstaSaver Bot!",
    WELCOME:
        "Hi firstName, 👋\nWelcome to Insta Saver Bot! \n\nTo get started, send me the link of Instagram post, Reels, IGTV, etc. to download the video. \n\nHappy downloading!",
    GATHERING_CONTENT: "Gathering content 🔍",
    INITIATING_UPLOAD: "Initiating upload 🚀",
    DOWNLOADING: "➡️  Downloading post for: requestUrl 📥",
    VIDEO_UPLOAD_LIMIT:
        "Unable to send video 😢 \nPossibly, it might have exceeded the Bot's upload limit. \n\nPlease download the video from below link: \nmediaUrl",
    PHOTO_UPLOAD_LIMIT:
        "Unable to send photo 😢 \nPossibly, it might have exceeded the Bot's upload limit. \n\nPlease download the photo from below link: \nmediaUrl",
};

const REQUEST_STATUS = {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    DONE: "DONE",
    FAILED: "FAILED",
};

const MEDIA_TYPE = {
    VIDEO: "GraphVideo",
    IMAGE: "GraphImage",
    MEDIA_GROUP: "GraphSidecar",
};

const INSTAGRAM_API_URL = "https://www.instagram.com/graphql/query";

module.exports = {
    LOG_TYPE,
    ERROR_TYPE,
    ACTION,
    SUCCESS_MESSAGE,
    MESSSAGE,
    REQUEST_STATUS,
    MEDIA_TYPE,
    INSTAGRAM_API_URL,
};
