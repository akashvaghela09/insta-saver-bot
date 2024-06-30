const { Bot } = require("./telegram.js");
const Browser = require("./browser.js");
const connectDB = require("./database.js");

module.exports = {
    Bot,
    Browser,
    connectDB,
};
