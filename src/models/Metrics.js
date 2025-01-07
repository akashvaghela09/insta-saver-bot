const mongoose = require("mongoose");

const metricsSchema = new mongoose.Schema(
    {
        _id: { type: String, required: true },
        totalRequests: { type: Number, default: 0 },
        mediaProcessed: {
            GraphVideo: { type: Number, default: 0 },
            GraphImage: { type: Number, default: 0 },
            GraphSidecar: { type: Number, default: 0 },
        },
        lastUpdated: { type: Date, default: Date.now },
    },
    { versionKey: false, collection: "metrics" }
);

const Metrics = mongoose.model("Metrics", metricsSchema);

module.exports = Metrics;
