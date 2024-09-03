const mongoose = require("mongoose");
const { log } = require("../utils");

const uri = process.env.MONGO_URI;

const connectDB = async () => {
    try {
        await mongoose.connect(uri);
        log("MongoDB connected successfully");
    } catch (error) {
        log("Error connecting to MongoDB:", error);
        process.exit(1)
    }
};

module.exports = connectDB;
