const mongoose = require("mongoose");
const { REQUEST_STATUS } = require("../constants");

const contentRequestSchema = new mongoose.Schema(
    {
        chatId: { type: String, required: true },
        requestUrl: { type: String, required: true },
        requestedBy: {
            userName: String,
            firstName: String,
        },
        shortCode: { type: String },
        status: { type: String, default: REQUEST_STATUS.PENDING },
        retryCount: { type: Number, default: 0 },
        requestedAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    { versionKey: false, collection: "contentRequest" }
);

const ContentRequest = mongoose.model("ContentRequest", contentRequestSchema);

module.exports = ContentRequest;
