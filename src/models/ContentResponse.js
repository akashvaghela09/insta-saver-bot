const mongoose = require("mongoose");

const contentResponseSchema = new mongoose.Schema(
    {
        owner: {
            userName: String,
            avatarUrl: String,
            fullName: String,
        },
        requestedBy: {
            userName: String,
            firstName: String,
        },
        requestUrl: String,
        shortCode: String,
        updatedAt: { type: Date, default: Date.now },
        mediaUrl: String,
        mediaType: String,
        captionText: String,
        displayUrl: String,
        thumbnailUrl: String,
        videoUrl: String,
        mediaList: [
            {
                mediaUrl: String,
                mediaType: String,
            },
        ],
    },
    { versionKey: false, collection: "contentResponse" }
);

const ContentResponse = mongoose.model(
    "ContentResponse",
    contentResponseSchema
);

module.exports = ContentResponse;
