const { bot } = require("./config");
const { ACTION, ERROR_TYPE, LOG_TYPE, MESSSAGE } = require("./constants");
const { logError, logMessage } = require("./helper");

const sendChatAction = async (context) => {
    const { chatId, userName, shortCode } = context;
    try {
        await bot.sendChatAction(chatId, "typing");
    } catch (error) {
        let errorObj = {
            action: ACTION.SEND_CHAT_ACTION,
            errorCode: error?.response?.body?.error_code,
            errorDescription: error?.response?.body?.description,
            userName,
            chatId,
            shortCode,
        };
        if (error?.response?.body?.error_code === 429) {
            logError({ ...errorObj, type: ERROR_TYPE.RATE_LIMIT });
        } else {
            logError({ ...errorObj, type: ERROR_TYPE.FAILED });
        }
    }
};

const deleteMessages = async (context) => {
    const { chatId, messagesToDelete, userName, shortCode } = context;
    messagesToDelete.forEach(async (messageId) => {
        try {
            await bot.deleteMessage(chatId, messageId);
        } catch (error) {
            let errorObj = {
                action: ACTION.DELETE_MESSAGE,
                errorCode: error?.response?.body?.error_code,
                errorDescription: error?.response?.body?.description,
                userName,
                chatId,
                shortCode,
            };
            if (error?.response?.body?.error_code === 429) {
                logError({ ...errorObj, type: ERROR_TYPE.RATE_LIMIT });
            } else {
                logError({ ...errorObj, type: ERROR_TYPE.FAILED });
            }
        }
    });
};

const sendMessage = async (context) => {
    const { chatId, userName, shortCode, message } = context;
    try {
        let res = await bot.sendMessage(chatId, message);
        return res;
    } catch (error) {
        let errorObj = {
            action: ACTION.SEND_MESSAGE,
            errorCode: error?.response?.body?.error_code,
            errorDescription: error?.response?.body?.description,
            userName,
            chatId,
            shortCode,
        };
        if (error?.response?.body?.error_code === 429) {
            logError({ ...errorObj, type: ERROR_TYPE.RATE_LIMIT });
        } else {
            logError({ ...errorObj, type: ERROR_TYPE.FAILED });
        }
    }
};

const sendMediaGroup = async (context) => {
    const { chatId, userName, shortCode, mediaGroupUrls } = context;
    try {
        await bot.sendMediaGroup(chatId, mediaGroupUrls);
        logMessage({
            type: LOG_TYPE.GROUP,
            userName,
            chatId,
            shortCode,
        });
    } catch (error) {
        let errorObj = {
            action: ACTION.SEND_MEDIA_GROUP,
            errorCode: error?.response?.body?.error_code,
            errorDescription: error?.response?.body?.description,
            userName,
            chatId,
            shortCode,
        };
        if (error?.response?.body?.error_code === 429) {
            logError({ ...errorObj, type: ERROR_TYPE.RATE_LIMIT });
        } else {
            logError({ ...errorObj, type: ERROR_TYPE.FAILED });
        }
    }
};

const sendVideo = async (context) => {
    const { chatId, userName, shortCode, mediaUrl } = context;
    try {
        await bot.sendVideo(chatId, mediaUrl);
        logMessage({
            type: LOG_TYPE.VIDEO,
            userName,
            chatId,
            shortCode,
        });
    } catch (error) {
        let errorObj = {
            action: ACTION.SEND_VIDEO,
            errorCode: error?.response?.body?.error_code,
            errorDescription: error?.response?.body?.description,
            userName,
            chatId,
            shortCode,
        };

        if (error?.response?.body?.error_code === 429) {
            logError({ ...errorObj, type: ERROR_TYPE.RATE_LIMIT });
        } else if (error?.response?.body?.error_code === 400) {
            await sendMessage({
                ...context,
                message: MESSSAGE.VIDEO_UPLOAD_LIMIT.replace(
                    "mediaUrl",
                    mediaUrl
                ),
            });
            logMessage({
                type: LOG_TYPE.VIDEO_URL,
                userName,
                chatId,
                shortCode,
            });
        } else {
            logError({ ...errorObj, type: ERROR_TYPE.FAILED });
        }
    }
};

const sendPhoto = async (context) => {
    const { chatId, userName, shortCode, mediaUrl } = context;
    try {
        await bot.sendPhoto(chatId, mediaUrl);
        logMessage({
            type: LOG_TYPE.PHOTO,
            userName,
            chatId,
            shortCode,
        });
    } catch (error) {
        let errorObj = {
            action: ACTION.SEND_PHOTO,
            errorCode: error?.response?.body?.error_code,
            errorDescription: error?.response?.body?.description,
            userName,
            chatId,
            shortCode,
        };

        if (error?.response?.body?.error_code === 429) {
            logError({ ...errorObj, type: ERROR_TYPE.RATE_LIMIT });
        } else if (error?.response?.body?.error_code === 400) {
            await sendMessage({
                ...context,
                message: MESSSAGE.VIDEO_UPLOAD_LIMIT.replace(
                    "mediaUrl",
                    mediaUrl
                ),
            });
            logMessage({
                type: LOG_TYPE.PHOTO_URL,
                userName,
                chatId,
                shortCode,
            });
        } else {
            logError({ ...errorObj, type: ERROR_TYPE.FAILED });
        }
    }
};

module.exports = {
    sendChatAction,
    deleteMessages,
    sendMessage,
    sendMediaGroup,
    sendVideo,
    sendPhoto,
};
