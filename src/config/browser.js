const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { log } = require("../utils");

const userDataDir = path.join(__dirname, "puppeteer_data");
const cookiesFilePath = path.join(__dirname, "cookies.json");

class Browser {
    static browserInstance = null;

    static async Open() {
        if (!this.browserInstance) {
            try {
                const launchOptions = {
                    headless: true,
                    defaultViewport: { width: 1280, height: 800 },
                    args: [
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                    ],
                    // userDataDir,
                };

                this.browserInstance = await puppeteer.launch(launchOptions);
                log("Browser launched successfully");

                // Check authentication status on launch
                // await this.CheckAuth();
            } catch (error) {
                log("Error launching browser:", error);
            }
        }

        return this.browserInstance;
    }

    static async Close() {
        if (this.browserInstance) {
            await this.browserInstance.close();
            this.browserInstance = null;
            log("Browser closed successfully");
        }
    }

    static async Login(page) {
        try {
            log("Tring to log in ...");
            // Navigate to Instagram login page
            await page.goto("https://www.instagram.com/accounts/login/", {
                waitUntil: "networkidle2",
            });

            // Increase default navigation timeout
            await page.setDefaultNavigationTimeout(60000); // 60 seconds

            // Enter username and password and click login button
            await page.type('[name="username"]', process.env.INSTA_USERNAME);
            await page.type('[name="password"]', process.env.INSTA_PASSWORD);
            await page.click('[type="submit"]');

            // Wait for navigation to complete after login
            await page.waitForNavigation({ waitUntil: "networkidle2" });

            log("Logged in successfully");

            await this.CheckAuth();

            // Save cookies after successful login
            const cookies = await page.cookies();
            await fs.promises.writeFile(
                cookiesFilePath,
                JSON.stringify(cookies, null, 2)
            );
            log("Cookies saved");
        } catch (error) {
            log("Failed to login bot account:", error);
        }
    }

    static async CheckAuth() {
        log("Checking auth status");
        const page = await this.browserInstance.newPage();
        try {
            await this.restoreCookies(page); // Restore cookies

            // Navigate to a protected page to check if authenticated
            await page.goto("https://www.instagram.com/accounts/login/", {
                waitUntil: "networkidle2",
            });

            // Check if redirected to Instagram home page after login
            const redirected = page.url() === "https://www.instagram.com/";

            await page.setViewport({ width: 1280, height: 800 });

            if (redirected) {
                this.authStatus = true;
                log("Authentication status: Authenticated");
            } else {
                // Not authenticated
                this.authStatus = false;
                log("Authentication status: Not Authenticated");
                await this.Login(page); // Perform login if not authenticated
            }
        } catch (error) {
            log("Error checking authentication:", error);
        } finally {
            await page.close();
            log("Page closed after checking auth");
        }
    }

    static async restoreCookies(page) {
        if (fs.existsSync(cookiesFilePath)) {
            const cookies = JSON.parse(
                await fs.promises.readFile(cookiesFilePath, "utf8")
            );
            if (cookies.length !== 0) {
                await page.setCookie(...cookies);
                log("Cookies restored");
            }
        }
    }
}

module.exports = Browser;
