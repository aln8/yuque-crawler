import { Crawler } from "./crawler";
import {poolProcess, download} from './downloader'

let p = null

async function test() {
  if (!p) {
    p = new Promise((res) => {
      setTimeout(() => {
        console.log("I run once")
        res(1)
      }, 1000)
    })
  }
  return await p
}

async function sleep(ms: number): Promise<void> {
  return new Promise(res => setTimeout(res, ms))
}

async function main() {
  // const a = [
  //   download("https://www.yuque.com/u1102553/dk8a35/5a538f0b3afb57d7d1a78f37b9852e91/markdown?attachment=true&latexcode=false&anchor=false&linebreak=true"),
  //   download("https://www.yuque.com/u1102553/dk8a35/5a538f0b3afb57d7d1a78f37b9852e91/markdown?attachment=true&latexcode=false&anchor=false&linebreak=true"),
  //   download("https://www.yuque.com/u1102553/dk8a35/5a538f0b3afb57d7d1a78f37b9852e91/markdown?attachment=true&latexcode=false&anchor=false&linebreak=true"),
  //   download("https://www.yuque.com/u1102553/dk8a35/5a538f0b3afb57d7d1a78f37b9852e91/markdown?attachment=true&latexcode=false&anchor=false&linebreak=true"),
  //   download("https://www.yuque.com/u1102553/dk8a35/5a538f0b3afb57d7d1a78f37b9852e91/markdown?attachment=true&latexcode=false&anchor=false&linebreak=true"),
  //   download("https://www.yuque.com/u1102553/dk8a35/5a538f0b3afb57d7d1a78f37b9852e91/markdown?attachment=true&latexcode=false&anchor=false&linebreak=true")
  // ]
  // await Promise.all(a)
  // const a = await test()
  // console.log(a)
  // const b = await test()
  // console.log(b)

  // const p: Promise<number>[] = []
  // for(let i = 0; i < 50; i++) {
  //   p.push(poolProcess(() => (async (num) => {
  //     await sleep(1000)
  //     console.log(num)
  //     return num
  //   })(i)))
  // }
  // await Promise.all(p)

  // poolProcess()


  const c = new Crawler();
  await c.init();
  await c.run();


  console.log("finished");
  process.exit(0);
}

(async () => {
  await main();
})();
