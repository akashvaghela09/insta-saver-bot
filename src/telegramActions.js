const { Bot } = require("./config");
const {
    ACTION,
    ERROR_TYPE,
    LOG_TYPE,
    MESSSAGE,
    MEDIA_TYPE,
} = require("./constants");
const { log, logMessage, logError } = require("./utils");

// Send typing action to indicate user activity
const sendChatAction = async (context) => {
    const { chatId, requestedBy, requestUrl } = context;
    try {
        await Bot.sendChatAction(chatId, "typing");
    } catch (error) {
        let errorObj = {
            action: ACTION.SEND_CHAT_ACTION,
            errorCode: error?.response?.body?.error_code,
            errorDescription: error?.response?.body?.description,
            requestedBy,
            chatId,
            requestUrl,
        };
        // Handle rate limit errors separately
        if (error?.response?.body?.error_code === 429) {
            logError({ ...errorObj, type: ERROR_TYPE.RATE_LIMIT });
        } else {
            logError({ ...errorObj, type: ERROR_TYPE.FAILED });
        }
    }
};

// Delete specified messages from chat
const deleteMessages = async (context) => {
    const { chatId, messagesToDelete, requestedBy, requestUrl } = context;
    messagesToDelete.forEach(async (messageId) => {
        try {
            await Bot.deleteMessage(chatId, messageId);
        } catch (error) {
            let errorObj = {
                action: ACTION.DELETE_MESSAGE,
                errorCode: error?.response?.body?.error_code,
                errorDescription: error?.response?.body?.description,
                requestedBy,
                chatId,
                requestUrl,
            };
            // Handle rate limit errors separately
            if (error?.response?.body?.error_code === 429) {
                logError({ ...errorObj, type: ERROR_TYPE.RATE_LIMIT });
            } else {
                logError({ ...errorObj, type: ERROR_TYPE.FAILED });
            }
        }
    });
};

// Send a message to a chat
const sendMessage = async (context) => {
    const { chatId, requestedBy, requestUrl, message } = context;
    try {
        let res = await Bot.sendMessage(chatId, message);
        return res;
    } catch (error) {
        let errorObj = {
            action: ACTION.SEND_MESSAGE,
            errorCode: error?.response?.body?.error_code,
            errorDescription: error?.response?.body?.description,
            requestedBy,
            chatId,
            requestUrl,
        };
        // Handle rate limit errors separately
        if (error?.response?.body?.error_code === 429) {
            logError({ ...errorObj, type: ERROR_TYPE.RATE_LIMIT });
            await Bot.sendMessage(chatId, MESSSAGE.COOL_DOWN);
        } else {
            logError({ ...errorObj, type: ERROR_TYPE.FAILED });
        }
    }
};

// Send a media group (array of media) to a chat
const sendMediaGroup = async (context) => {
    const { chatId, requestedBy, requestUrl, mediaGroupUrls } = context;
    try {
        await Bot.sendMediaGroup(chatId, mediaGroupUrls);
        // Log successful group message sending
        logMessage({
            type: LOG_TYPE.GROUP,
            requestedBy,
            chatId,
            requestUrl,
        });
    } catch (error) {
        let errorObj = {
            action: ACTION.SEND_MEDIA_GROUP,
            errorCode: error?.response?.body?.error_code,
            errorDescription: error?.response?.body?.description,
            requestedBy,
            chatId,
            requestUrl,
        };
        // Handle rate limit errors separately
        if (error?.response?.body?.error_code === 429) {
            logError({ ...errorObj, type: ERROR_TYPE.RATE_LIMIT });
            await Bot.sendMessage(chatId, MESSSAGE.COOL_DOWN);
        } else {
            logError({ ...errorObj, type: ERROR_TYPE.FAILED });
        }
    }
};

// Send a video to a chat
const sendVideo = async (context) => {
    const { chatId, requestedBy, requestUrl, mediaUrl } = context;
    try {
        await Bot.sendVideo(chatId, mediaUrl);
        // Log successful video sending
        logMessage({
            type: LOG_TYPE.VIDEO,
            requestedBy,
            chatId,
            requestUrl,
        });
    } catch (error) {
        let errorObj = {
            action: ACTION.SEND_VIDEO,
            errorCode: error?.response?.body?.error_code,
            errorDescription: error?.response?.body?.description,
            requestedBy,
            chatId,
            requestUrl,
        };
        // Handle different error scenarios
        if (error?.response?.body?.error_code === 429) {
            logError({ ...errorObj, type: ERROR_TYPE.RATE_LIMIT });
            await Bot.sendMessage(chatId, MESSSAGE.COOL_DOWN);
        } else if (error?.response?.body?.error_code === 400) {
            log("error?.response?.body ", error?.response?.body);
            // Handle specific error for video upload limits
            await sendMessage({
                ...context,
                message: MESSSAGE.VIDEO_UPLOAD_LIMIT.replace(
                    "mediaUrl",
                    mediaUrl
                ),
            });
            logMessage({
                type: LOG_TYPE.VIDEO_URL,
                requestedBy,
                chatId,
                requestUrl,
            });
        } else {
            logError({ ...errorObj, type: ERROR_TYPE.FAILED });
        }
    }
};

// Send a photo to a chat
const sendPhoto = async (context) => {
    const { chatId, requestedBy, requestUrl, mediaUrl } = context;
    try {
        await Bot.sendPhoto(chatId, mediaUrl);
        // Log successful photo sending
        logMessage({
            type: LOG_TYPE.PHOTO,
            requestedBy,
            chatId,
            requestUrl,
        });
    } catch (error) {
        let errorObj = {
            action: ACTION.SEND_PHOTO,
            errorCode: error?.response?.body?.error_code,
            errorDescription: error?.response?.body?.description,
            requestedBy,
            chatId,
            requestUrl,
        };
        // Handle different error scenarios
        if (error?.response?.body?.error_code === 429) {
            logError({ ...errorObj, type: ERROR_TYPE.RATE_LIMIT });
            await Bot.sendMessage(chatId, MESSSAGE.COOL_DOWN);
        } else if (error?.response?.body?.error_code === 400) {
            // Handle specific error for photo upload limits
            await sendMessage({
                ...context,
                message: MESSSAGE.VIDEO_UPLOAD_LIMIT.replace(
                    "mediaUrl",
                    mediaUrl
                ),
            });
            logMessage({
                type: LOG_TYPE.PHOTO_URL,
                requestedBy,
                chatId,
                requestUrl,
            });
        } else {
            logError({ ...errorObj, type: ERROR_TYPE.FAILED });
        }
    }
};

// Send requested data (media or messages) to a chat
const sendRequestedData = async (data) => {
    const {
        chatId,
        requestedBy,
        requestUrl,
        caption,
        mediaUrl,
        mediaType,
        mediaList,
    } = data;

    const messagesToDelete = [];

    const userContext = {
        chatId,
        requestedBy,
        requestUrl,
        message: caption,
    };

    // Send typing action if chatId is present
    if (chatId) {
        await sendChatAction(userContext);
    }

    // Send initiating upload message
    const uploadingMessage = await sendMessage({
        ...userContext,
        message: MESSSAGE.INITIATING_UPLOAD,
    });

    // Add message to delete after processing
    if (uploadingMessage) {
        messagesToDelete.push(uploadingMessage?.message_id);
    }

    const uploadContent = async (userContext) => {
        // Determine type of media to send based on mediaType
        if (mediaType === MEDIA_TYPE.MEDIA_GROUP) {
            // Prepare media group array to send
            const mediaGroupUrls = [];
            for (let i = 0; i < mediaList?.length; i++) {
                let mediaItem = mediaList[i];
                if (mediaItem.mediaType === MEDIA_TYPE.IMAGE) {
                    mediaGroupUrls.push({
                        type: "photo",
                        media: mediaItem.mediaUrl,
                    });
                } else if (mediaItem.mediaType === MEDIA_TYPE.VIDEO) {
                    mediaGroupUrls.push({
                        type: "video",
                        media: mediaItem.mediaUrl,
                    });
                }
            }

            // Send media group to chat
            await sendMediaGroup({ ...userContext, mediaGroupUrls });
        } else if (mediaType === MEDIA_TYPE.VIDEO) {
            // Send single video to chat
            await sendVideo({ ...userContext, mediaUrl });
        } else if (mediaType === MEDIA_TYPE.IMAGE) {
            // Send single photo to chat
            await sendPhoto({ ...userContext, mediaUrl });
        }

        // If caption exists, send typing action and then send caption
        if (caption) {
            await sendChatAction(userContext);
            await sendMessage({ ...userContext, message: caption });
        }
    };

    await uploadContent(userContext);

    // Delete messages after processing
    await deleteMessages({ ...userContext, messagesToDelete });

    // Dump media in local group
    await uploadContent({ ...userContext, chatId: "-1002207692130" });
};

// Export all functions for sending messages and media to a chat
module.exports = {
    sendChatAction,
    deleteMessages,
    sendMessage,
    sendMediaGroup,
    sendVideo,
    sendPhoto,
    sendRequestedData,
};
