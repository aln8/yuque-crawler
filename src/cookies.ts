import type { Browser, Page, Protocol } from "puppeteer";
import puppeteer from "./puppeteer";
import fs from 'fs';
import { COOKIE_FILE } from "./constant";

class Cookie {
  #client: Promise<Browser> = null; // singleton promise
  #page: Page = null; // singleton

  constructor() {
    this.#client = puppeteer.launch({ headless: "new" });
  }

  async getCookie() {
    await this.initClient()
    return await this.initCookies()
  }

  async initClient() {
    if (!this.#page) {
      const client = await this.#client
      this.#page = await client.newPage()
    }
  }

  async initCookies() {
    let cookies = await this.parseCookie();
    if (cookies.length <= 0) {
      cookies = await this.login();

      // cache cookies to local
      fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));
      console.log("Save cookie to cookies.json");
    }
    return cookies;
  }

  async parseCookie() {
    if (fs.existsSync(COOKIE_FILE)) {
      const cookiesString = await fs.promises.readFile(COOKIE_FILE);
      return JSON.parse(cookiesString.toString()) as Protocol.Network.Cookie[];
    }

    return [];
  }

  async login() {
    if (!process.env.USER) {
      console.log("no cookie so use env var: USER required");
      process.exit(1);
    }

    if (!process.env.PASSWORD) {
      console.log("no cookie so use env var: PASSWORD required");
      process.exit(1);
    }

    await this.#page.goto("https://www.yuque.com/login");
    // Switch to password login
    await this.#page.click(".switch-btn");

    // Fill in phone number and password
    await this.#page.type("input[data-testid=prefix-phone-input]", process.env.USER);
    await this.#page.type(
      "input[data-testid=loginPasswordInput]",
      process.env.PASSWORD
    );

    // Check agreement checkbox
    await this.#page.click("input[data-testid=protocolCheckBox]");


    await this.scrollCaptcha()
    // Click login button
    await this.#page.click("button[data-testid=btnLogin]");
    await this.#page.waitForNavigation();
    return await this.#page.cookies();
  }

  async scrollCaptcha() {
    const start = await this.#page.$('span[id="nc_2_n1z"]');
    const startinfo = await start.boundingBox();
    console.log(startinfo.x)
    const end =  await this.#page.waitForSelector('.nc-lang-cnt');
    const endinfo = await end.boundingBox();
    
    await this.#page.mouse.move(startinfo.x,endinfo.y);
    await this.#page.mouse.down();
    for(var i=0;i<endinfo.width;i++) {
        await this.#page.mouse.move(startinfo.x+i,endinfo.y);
    }
    await this.#page.mouse.up();
  }
}

export default new Cookie().getCookie()