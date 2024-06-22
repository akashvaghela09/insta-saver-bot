const path = require("path");
const fs = require("fs");
const { ERROR_TYPE, LOG_TYPE, SUCCESS_MESSAGE } = require("../constants");

// Function to get current date-time in IST
const getISTTime = () => {
    const date = new Date();
    const utcOffset = date.getTime() + date.getTimezoneOffset() * 60000;
    const ISTOffset = 5.5 * 60 * 60 * 1000;
    const ISTTime = new Date(utcOffset + ISTOffset);

    // Format IST time as YYYY-MM-DD HH:mm:ss.SSS
    const year = ISTTime.getFullYear();
    const month = String(ISTTime.getMonth() + 1).padStart(2, "0");
    const day = String(ISTTime.getDate()).padStart(2, "0");
    const hours = String(ISTTime.getHours()).padStart(2, "0");
    const minutes = String(ISTTime.getMinutes()).padStart(2, "0");
    const seconds = String(ISTTime.getSeconds()).padStart(2, "0");
    const milliseconds = String(ISTTime.getMilliseconds()).padStart(3, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
};

// Helper function to format log messages
const formatLogMessage = (args) => {
    return args
        .map((arg) => {
            if (arg instanceof Error) {
                // Handle Error objects separately
                return `Error: ${arg.message}\n${arg.stack}`;
            } else if (typeof arg === "object") {
                // Stringify objects for better logging
                return JSON.stringify(arg, null, 2);
            } else {
                return arg.toString();
            }
        })
        .join(" ");
};

const log = (...args) => {
    const logDirectory = path.join(__dirname, "./../../logs"); // Define log directory
    const logFileName = path.join(
        logDirectory,
        `${getISTTime().split(" ")[0]}.log`
    ); // Log file name based on current date

    // Create log directory if it doesn't exist
    if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory);
    }

    const timestamp = getISTTime(); // Current date-time in IST format
    const formattedLogMessage = `[${timestamp}] ${formatLogMessage(args)}\n`; // Format log message

    // Append log message to the log file
    fs.appendFile(logFileName, formattedLogMessage, (err) => {
        if (err) {
            console.error("Error writing to log file:", err);
        }
    });

    // Optionally print to console as well
    console.log(formattedLogMessage);
};

const logMessage = ({ type, requestedBy, chatId, requestUrl }) => {
    const { userName, firstName } = requestedBy;
    const DIVIDER = "\n-------------------------------------\n";
    const LOG = `\n User: ${
        firstName ? firstName : userName
    }\n Chat Id: ${chatId}\n Request Url: ${requestUrl}`;
    switch (type) {
        case LOG_TYPE.GROUP:
            console.log(DIVIDER, SUCCESS_MESSAGE.GROUP, LOG, DIVIDER);
            break;
        case LOG_TYPE.VIDEO:
            console.log(DIVIDER, SUCCESS_MESSAGE.VIDEO, LOG, DIVIDER);
            break;
        case LOG_TYPE.VIDEO_URL:
            console.log(DIVIDER, SUCCESS_MESSAGE.VIDEO_URL, LOG, DIVIDER);
            break;
        case LOG_TYPE.PHOTO:
            console.log(DIVIDER, SUCCESS_MESSAGE.PHOTO, LOG, DIVIDER);
            break;
        case LOG_TYPE.PHOTO_URL:
            console.log(DIVIDER, SUCCESS_MESSAGE.VIDEO_URL, LOG, DIVIDER);
            break;
        default:
            break;
    }
};

const logError = ({
    type,
    action,
    errorCode,
    errorDescription,
    requestedBy,
    chatId,
    requestUrl,
}) => {
    const { userName, firstName } = requestedBy;
    const DIVIDER = "\n-------------------------------------\n";
    const LOG = `\n Code: ${errorCode ? errorCode : ""}\n Description: ${
        errorDescription ? errorDescription : ""
    }\n User: ${
        firstName ? firstName : userName
    }\n Chat Id: ${chatId}\n Request Url: ${requestUrl}`;

    switch (type) {
        case ERROR_TYPE.RATE_LIMIT:
            console.log(DIVIDER, action, ERROR_TYPE.RATE_LIMIT, LOG, DIVIDER);
            break;
        case ERROR_TYPE.FAILED:
            console.log(DIVIDER, action, ERROR_TYPE.FAILED, LOG, DIVIDER);
            break;
        default:
            break;
    }
};

module.exports = {
    getISTTime,
    log,
    logMessage,
    logError,
};
