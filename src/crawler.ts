import type { Browser, Protocol } from "puppeteer";
import puppeteer from "./puppeteer";
import fs from "fs";
import path from "path";
import { BookParser } from "./parser";
import { Book, BookCache, Doc, Title, TitleDocInfo } from "./info";
import { DIR_PREFIX, BOOK_FILE, DOWNLOAD_TMP_DIR } from './constant'
import Cookies from './cookies'
import {download, poolProcess} from './downloader'

declare global {
  var appData: any;
}

export class Crawler {
  #client: Browser;
  #cookies: Protocol.Network.Cookie[];
  #books: Book[];

  async init() {
    this.#client = await puppeteer.launch({ headless: "new" });
    if (!fs.existsSync(DIR_PREFIX)) {
      fs.mkdirSync(DIR_PREFIX);
    }
    this.#cookies = await Cookies;
    this.#books = await this.initBooks();
  }

  async initBooks() {
    if (fs.existsSync(BOOK_FILE)) {
      const bookString = await fs.promises.readFile(BOOK_FILE);
      const parsed = JSON.parse(bookString.toString()) as BookCache[];
      return parsed.map((book) => Book.fromCache(book));
    }
    const page = await this.newPage();
    const resp = await page.goto("https://www.yuque.com/api/mine/book_stacks", {
      waitUntil: "networkidle0",
    });
    const books = new BookParser(await resp.text()).parse();
    this.cacheBook(books);
    return books;
  }

  cacheBook(books: Book[]) {
    fs.writeFileSync(BOOK_FILE, JSON.stringify(books, null, 2));
    console.log("Save books to books.json");
  }

  async newPage() {
    const page = await this.#client.newPage();
    await page.setCookie(...this.#cookies);
    return page;
  }

  async createMenuInfo() {
    const books = this.#books.filter((book) => !book.titleLoaded);
    if (books.length > 0) {
      await Promise.all(
        books.map((book) => {
          return this.bookMenu(book);
        })
      );
      // re-cache books since it may get new docs
      this.cacheBook(this.#books);
    }
  }

  async bookMenu(book: Book) {
    const page = await this.newPage();
    await page.goto(book.url());
    await page.waitForFunction(() => window.appData != undefined);
    const appData: typeof globalThis = await page.evaluate(
      () => window.appData
    );
    const bookData = appData?.book?.toc as TitleDocInfo[];
    if (bookData) {
      book.generateMenu(bookData);
    } else {
      console.error("invalid book: ", book.name);
    }
  }

  createDocDirectory() {
    this.#books.forEach((b) => this.createBookDir(b, DIR_PREFIX));
  }

  // recursive create dir
  createBookDir(b: Book | Title | Doc, prefix: string) {
    if (b instanceof Doc && !b.hasChild()) {
      return;
    }
    const p = path.resolve(prefix, b.name);
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p);
    }
    b.docs.forEach((d) => this.createBookDir(d, p));
    b.titles.forEach((t) => this.createBookDir(t, p));
  }

  async downloadMarkdown() {
    await Promise.all(
      this.#books.map((b) =>
        this.downloadBookMarkdown(b, b.login, b.slug, DIR_PREFIX)
      )
    );
  }

  async downloadBookMarkdown(
    b: Book | Title | Doc,
    login: string,
    book_slug: string,
    dir: string
  ) {
    // skip if it's already downloaded
    if (b.loaded) {
      return
    }
    if (b instanceof Doc && !b.hasChild()) {
      const url = this.downloadUrl(login, book_slug, b.slug);
      await this.download(url, dir, b.name);
      b.loaded = true
      this.cacheBook(this.#books)
      return;
    }

    const curDir = path.resolve(dir, b.name);
    if (b instanceof Doc) {
      const url = this.downloadUrl(login, book_slug, b.slug);
      await this.download(url, path.resolve(dir, b.name), b.name);
    }
    // recursive download subtree
    await Promise.all([
      ...b.docs.map((item) =>
        this.downloadBookMarkdown(item, login, book_slug, curDir)
      ),
      ...b.titles.map((item) =>
        this.downloadBookMarkdown(item, login, book_slug, curDir)
      ),
    ]);
    b.loaded = true
    this.cacheBook(this.#books)
  }

  async download(url: string, dir: string, name: string) {
    await poolProcess(() => download(url))
    const oName = path.resolve(DOWNLOAD_TMP_DIR, `${name}.md`)
    const nName = path.resolve(dir, `${name}.md`)
    await fs.promises.rename(oName, nName)
  }

  downloadUrl(login: string, book_slug: string, doc_id: string) {
    return `https://www.yuque.com/${login}/${book_slug}/${doc_id}/markdown?attachment=true&latexcode=false&anchor=false&linebreak=true`;
  }

  async run() {
    await this.createMenuInfo();
    this.createDocDirectory();
    await this.downloadMarkdown();
  }
}