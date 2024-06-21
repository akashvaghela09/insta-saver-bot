const puppeteer = require("puppeteer");
const { log } = require("../utils");
const browserPath = process.env.PUPPETEER_EXECUTABLE_PATH;

class Browser {
    static browserInstance = null;

    static async Open() {
        if (!this.browserInstance) {
            try {
                const launchOptions = {
                    headless: true,
                    args: [
                        "--no-sandbox",
                        "--window-size=1920,1080",
                        "--ignore-certificate-errors",
                        "--ignore-certificate-errors-spki-list",
                        "--disable-dev-shm-usage",
                    ],
                    timeout: 0,
                };

                if (browserPath) {
                    launchOptions.executablePath = browserPath;
                }

                this.browserInstance = await puppeteer.launch(
                    browserPath ? launchOptions : {}
                );
                log("Browser launched successfully");
            } catch (error) {
                console.log("Error launching browser:", error);
                log("Error launching browser:", error);
            }
        }

        return this.browserInstance;
    }

    static async Close() {
        if (this.browserInstance) {
            await this.browserInstance.close();
            this.browserInstance = null;
            console.log("Browser closed successfully");
            log("Browser closed successfully");
        }
    }
}

module.exports = Browser;
