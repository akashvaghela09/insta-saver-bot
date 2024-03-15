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

module.exports = {
    LOG_TYPE,
    ERROR_TYPE,
    ACTION,
    SUCCESS_MESSAGE,
};
