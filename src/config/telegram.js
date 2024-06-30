const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TELEGRAM_TOKEN;

const Bot = new TelegramBot(token, { polling: true });

module.exports = { Bot };
