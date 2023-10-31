export type BookInfoUser = {
  login: string;
};

export type BookInfo = {
  id: string;
  name: string;
  slug: string;
  user: BookInfoUser;
};

export type BookCache = {
  id: string;
  name: string;
  slug: string;
  login: string;
  titleLoaded: boolean;
  loaded: boolean;
  titles: TitleCache[];
  docs: DocCache[];
};

// replace "/" to "_" since it will has issue with menu generation
function nameStr(name: string) {

  return name.replace("/", "_").replace(":", "_")
}

export class Book {
  id: string;
  name: string;
  slug: string;
  login: string;
  titleLoaded = false;
  loaded = false; // doc loaded
  titles: Title[] = [];
  docs: Doc[] = [];

  constructor({ id, name, slug, user }: BookInfo) {
    this.id = id;
    this.name = nameStr(name);
    this.slug = slug;
    this.login = user.login;
  }

  static fromCache({
    id,
    name,
    slug,
    login,
    titleLoaded,
    loaded,
    titles,
    docs,
  }: BookCache) {
    const book = new Book({ id, name, slug, user: { login } });
    book.titleLoaded = titleLoaded;
    book.loaded = loaded;
    book.titles = titles.map((t) => Title.fromCache(t));
    book.docs = docs.map((d) => Doc.fromCache(d));
    return book;
  }

  generateMenu(infos: TitleDocInfo[]) {
    const titlesMap = infos.reduce((acc, cur) => {
      if (cur.type === "TITLE") {
        acc[cur.uuid] = new Title(cur);
      } else if (cur.type === "DOC") {
        acc[cur.uuid] = new Doc(cur);
      }
      return acc;
    }, {} as Record<string, Title | Doc>);
    infos.forEach((info) => {
      switch (info.type) {
        case "TITLE": {
          const title = titlesMap[info.uuid] as Title;
          if (info.parent_uuid === "") {
            this.titles.push(title);
          } else {
            if (!titlesMap[info.parent_uuid]) {
              console.log(titlesMap);
              console.log(info);
            }
            titlesMap[info.parent_uuid].pushTitle(title);
          }
          break;
        }
        case "DOC": {
          const doc = titlesMap[info.uuid] as Doc;
          if (info.parent_uuid === "") {
            this.docs.push(doc);
          } else {
            if (!titlesMap[info.parent_uuid]) {
              console.log(titlesMap);
              console.log(info);
            }
            titlesMap[info.parent_uuid].pushDoc(doc);
          }
          break;
        }
        default: {
          console.error("invalid type: ", info.title, info.type);
          break;
        }
      }
    });
    this.titleLoaded = true;
  }

  url() {
    return `https://www.yuque.com/${this.login}/${this.slug}`;
  }
}

export type TitleDocInfo = {
  uuid: string;
  parent_uuid: string;
  title: string;
  type: "TITLE" | "DOC";
  url: string;
};

export type TitleCache = {
  uuid: string;
  parent: string;
  slug: string;
  name: string;
  titles: TitleCache[];
  docs: DocCache[];
  loaded: boolean;
};

export class Title {
  uuid: string;
  parent: string;
  name: string;
  titles: Title[] = [];
  docs: Doc[] = [];
  loaded = false;

  constructor({ uuid, parent_uuid: parent, title: name }: TitleDocInfo) {
    this.parent = parent;
    this.uuid = uuid;
    this.name = nameStr(name);
  }

  static fromCache({
    uuid,
    parent,
    name,
    slug,
    titles,
    docs,
    loaded,
  }: TitleCache) {
    const tt = new Title({
      uuid,
      parent_uuid: parent,
      type: "TITLE",
      title: name,
      url: slug,
    });
    tt.loaded = loaded;
    tt.titles = titles.map((t) => this.fromCache(t));
    tt.docs = docs.map((d) => Doc.fromCache(d));
    return tt;
  }

  pushTitle(t: Title) {
    this.titles.push(t);
  }

  pushDoc(d: Doc) {
    this.docs.push(d);
  }
}

export type DocCache = {
  uuid: string;
  parent: string;
  slug: string;
  name: string;
  loaded: boolean;
  titles: TitleCache[];
  docs: DocCache[];
};

export class Doc {
  uuid: string;
  parent: string;
  slug: string;
  name: string;
  loaded = false;
  docs: Doc[] = [];
  titles: Title[] = [];

  constructor({ uuid, parent_uuid: parent, title: name, url: slug }: TitleDocInfo) {
    this.parent = parent;
    this.uuid = uuid;
    this.name = nameStr(name);
    this.slug = slug;
  }

  static fromCache({
    uuid,
    parent,
    name,
    slug,
    loaded,
    titles,
    docs,
  }: DocCache) {
    const doc = new Doc({
      uuid,
      parent_uuid: parent,
      type: "DOC",
      title: name,
      url: slug,
    });
    doc.loaded = loaded;
    doc.docs = docs.map((d) => this.fromCache(d));
    doc.titles = titles.map((t) => Title.fromCache(t));
    return doc;
  }

  pushTitle(t: Title) {
    this.titles.push(t);
  }

  pushDoc(d: Doc) {
    this.docs.push(d);
  }

  hasChild() {
    return this.docs.length > 0 || this.titles.length > 0
  }
}
