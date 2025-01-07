const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    chatId: { type: String, unique: true, required: true },
    userName: { type: String },
    firstName: { type: String },
    requestCount: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
