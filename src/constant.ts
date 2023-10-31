import path from 'path'

export const DIR_PREFIX = path.resolve("./data");
export const COOKIE_FILE = path.resolve(DIR_PREFIX, "cookies.json");
export const BOOK_FILE = path.resolve(DIR_PREFIX, "books.json");
export const DOWNLOAD_TMP_DIR = path.resolve(DIR_PREFIX, "yuqucrawlertmp")
export const DOWNLOAD_CONCURRENCY = 3
