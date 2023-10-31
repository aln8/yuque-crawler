import { Book, BookInfo } from "./info";

type Stack = {
  id: string;
  name: string;
  books: BookInfo[];
};

type BookStackResp = {
  data: Stack[];
};

export class BookParser {
  #text: string;

  constructor(text: string) {
    this.#text = text;
  }

  parse() {
    const stacks = JSON.parse(this.#text) as BookStackResp;
    const books: Book[] = [];
    stacks.data.forEach((item) => {
      item.books.forEach((book) => {
        books.push(new Book(book));
      });
    });
    return books;
  }
}
