# 小红书无水印下载

把小红书分享文案里的短链解开，下载笔记里的无水印原片。图片笔记则保存图片。

电脑上用命令行，手机上用站点里的 [小红书](../../xhs.html) 页面。页面在 GitHub Pages：

<https://reitensei353-boop.github.io/LTC-zone/xhs.html>

浏览器不能直接请求 `xiaohongshu.com` / `xhscdn.com`（会跨域，而且带上网页来源时 CDN 会 403）。手机页面要把解析和下载交给你自己部署的 Cloudflare Worker。

## 命令行

只需要 Python 3，不用 `pip install`。

```bash
cd tools/xhs-downloader
python3 xhs_dl.py "https://xhslink.cn/o/A8vpzl1B6NG 存好口令，直达【小红书】瞅瞅~"
python3 xhs_dl.py "https://xhslink.cn/o/A8vpzl1B6NG" -o ~/Downloads
python3 xhs_dl.py "分享文案或链接" --with-images
```

`-o` 是保存目录，默认当前目录。视频笔记默认只下原片；加上 `--with-images` 会把封面图也存下来。没有视频的笔记会直接存图片。

成功时会打印作者、标题和文件路径。文件名是「作者_标题」。原片大多是手机导出的 QuickTime，扩展名是 `.mov`。

## 网页

首页格子里的「小红书」打开 `xhs.html`。把分享文案粘进去，点「解析」。

页面顶部的 `DEFAULT_WORKER_URL` 可以写成你的 Worker 地址。留空也行：在页面「Worker 地址」里粘贴并保存，只会写进这台设备浏览器的 localStorage，不会上传。

没填地址时，页面会停在说明，不会假装能直接下载。

## 部署 Worker

Worker 免费额度够个人偶尔用。脚本里没有任何密钥，不要把 Cloudflare API Token 写进仓库；`wrangler login` 的登录状态只留在你自己的电脑上。

部署完成后，终端或控制台会给你一个类似下面的地址，把它填进网页：

```text
https://xhs-downloader.<你的子域名>.workers.dev
```

如果这个 Worker 名字在你的账号里已经被占用，改 `wrangler.toml` 里的 `name` 再部署一次。

### 方法一：Wrangler

需要 Node.js 18 或更新版本。

```bash
cd tools/xhs-downloader
npx wrangler login
npx wrangler deploy
```

`wrangler login` 会打开浏览器，登录免费的 Cloudflare 账号并授权。`wrangler deploy` 成功后，最后几行里的 `*.workers.dev` 就是要填进网页的地址。

### 方法二：控制台粘贴

1. 打开 <https://dash.cloudflare.com> ，注册或登录，选免费计划。
2. 左侧进入 **Workers & Pages** → **Create** → **Workers** → **Create Worker**（从 Hello World 开始也行）。
3. 编辑器里的代码全部删掉，把本目录 `worker.js` 的内容整份粘贴进去。这个文件没有别的依赖。
4. 点 **Deploy**。
5. 打开该 Worker 的 **Settings** → **Domains & Routes**，复制 `*.workers.dev` 地址。

### 填到手机上

1. 先把本仓库合并进 `main`，等 GitHub Pages 部署完成。
2. 用 iPhone 打开 <https://reitensei353-boop.github.io/LTC-zone/xhs.html> 。
3. 展开「Worker 地址」，粘贴上一步的 `https://….workers.dev`，点保存，再点「测试连接」。显示连接成功就可以解析了。

## 在 iPhone 上保存到相册

解析出视频后可以先预览。原片是手机直接导出的文件，索引在末尾，播放器要先读到末尾才出第一帧，三十多 MB 时预览会多等一会儿。存下来的文件和原片一致。

- 点「新标签页打开」。视频开始播放后，点播放器里的分享按钮，选「存储视频」。全屏之后再点分享也可以。
- 也可以长按视频，再用系统分享保存。
- 「下载视频」在 iPhone 上通常会进「文件」App，而不是「照片」。要从相册里看到，用上面的分享更直接。
- 图片笔记：长按图片，选「存储到照片」。

## 它在做什么

1. 从整段分享文案里取出 `xhslink.cn` / `xhslink.com` 短链，或已经是 `xiaohongshu.com`、`rednote.com` 的笔记地址。
2. 用手机浏览器的 User-Agent 跟着跳转打开笔记页（`/explore/<noteId>` 或 `/discovery/item/<noteId>`，后面带着 `xsec_token`）。
3. 读页面里的 `window.__INITIAL_STATE__`。这是一段 JavaScript 对象，字符串外面的 `undefined` 要先换成 `null` 才能当 JSON 解析。
4. 无水印原片在 `video.consumer.originVideoKey`。文件地址是 `https://sns-video-bd.xhscdn.com/<originVideoKey>`。打不开时再试 `sns-video-hw`、`sns-video-qc`，以及 `sns-video-al`、`sns-video-hs`。
5. 原片地址都失败时，才用转码流 `video.media.stream.h264[0].masterUrl` 和 `backupUrls`。
6. 文件名用作者昵称（`nickName` 或 `nickname`）加上标题；标题为空就用正文，并去掉 `#话题` 里的 `[话题]`。
7. 图片来自 `imageList` 的 `urlDefault`，没有这个字段时用 `url`。

Worker 提供两个接口：

- `GET /resolve?input=<分享文案>` → JSON：`title`、`author`、`videoUrl`、`cover`，另外还有文件名、大小和图片列表。
- `GET /file?url=<CDN 地址>&name=<文件名>&dl=1` → 把视频流转给浏览器，并带上 `Content-Disposition`。预览时不要加 `dl=1`。它会转发 `Range`，这样手机上的播放器可以拖动进度。

`/file` 只允许 `xhscdn.com` 和 `rednotecdn.com`。`/resolve` 只跟随小红书、红笔记和 xhslink 的页面，避免被当成任意网站的代理。

## 自己检查

```bash
cd tools/xhs-downloader
python3 -m unittest test_parse.py
node test_worker.mjs --offline
node test_worker.mjs
```

不带 `--offline` 时，`test_worker.mjs` 会用上面的示例短链真正访问一次小红书，并核对原片文件头。命令行的真下载是：

```bash
python3 xhs_dl.py "https://xhslink.cn/o/A8vpzl1B6NG 存好口令，直达【小红书】瞅瞅~" -o /tmp/xhs-out
```

免费 Worker 适合偶尔下一条。视频很大、中转中断时，用上面的命令行直接下。
