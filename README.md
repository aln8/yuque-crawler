# yuque-crawler

这是一个语雀通过puppeteer客户端下载自己文档的工具, 不需要语雀Token即可使用

feature:

1. 会缓存cookies在`./data/cookies.json`, 只在第一次登录需要USER/PASSWORD

2. 会根据目录, 生成文件夹目录并缓存在 `./data` 下面

3. 会缓存下载过的文档, 重复启动不会重复下载

4. 可以修改`src/constant.ts`里的`DOWNLOAD_CONCURRENCY`环境变量设置并发下载数量

# 使用方式

```
export USER=${your user name}
export PASSWORD=${your user password}
npm i
npm run start
```

# License

项目遵守MIT协议

下载请自觉遵守robots.txt协议使用


