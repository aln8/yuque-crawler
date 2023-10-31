import type { Browser, Page, Protocol } from "puppeteer";
import puppeteer from "./puppeteer";
import Cookies from "./cookies";
import { DOWNLOAD_TMP_DIR, DOWNLOAD_CONCURRENCY } from "./constant";
import fs from "fs";

type Resolve = (value: unknown) => void;

type Task<T> = {
  lock: Promise<unknown>;
  unlock: Resolve;
  task: () => Promise<T>;
};

class PromisePool {
  concurrent = 0;
  #activeCount = 0;
  #tasks: Task<any>[] = [];

  constructor(concurrent: number) {
    this.concurrent = concurrent;
    (async () => {
      await this.start();
    })();
  }

  create_task<T>(task: () => Promise<T>) {
    let unlock: Resolve;
    const lock = new Promise((resolve) => {
      unlock = resolve;
    });
    const innerTask = { task, lock, unlock };
    this.#tasks.push(innerTask);
    return innerTask;
  }

  async start() {
    while (true) {
      if (this.#activeCount < this.concurrent) {
        let exec = this.#tasks.splice(0, this.concurrent - this.#activeCount);
        for (let item of exec) {
          item.unlock(undefined);
        }
      }
      await new Promise((res) => setTimeout(res, 100));
    }
  }

  async process<U>(task: () => Promise<U>) {

    const innerTask = this.create_task(task);

    const wrapTask = async () => {
      await innerTask.lock;
      this.#activeCount++;
      const result = await task();
      this.#activeCount--;
      return result;
    };

    return await wrapTask();
  }
}

const pool = new PromisePool(DOWNLOAD_CONCURRENCY);
export const poolProcess = pool.process.bind(pool) as (task: () => Promise<any>) => Promise<any>

class Downloader {
  #creating = false
  #cookies: Protocol.Network.Cookie[] = null;

  async init() {
    if (!this.#cookies && !this.#creating) {
      this.#creating = true
      if (!fs.existsSync(DOWNLOAD_TMP_DIR)) {
        await fs.promises.mkdir(DOWNLOAD_TMP_DIR);
      }
      this.#cookies = await Cookies;
    }
  }

  async newPage() {
    const c = await puppeteer.launch({ headless: "new" });
    const page = await c.newPage();
    page.setCookie(...this.#cookies);
    const client = await page.createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: DOWNLOAD_TMP_DIR,
    });
    return page;
  }

  async download(url: string) {
    await this.init();
    const page = await this.newPage();
    await page.goto("https://www.yuque.com/api/mine/book_stacks");
    await page.evaluate((link) => {
      location.href = link;
    }, url);
    await page.waitForNetworkIdle();
  }
}

const ins = new Downloader();
export const download = ins.download.bind(ins);
