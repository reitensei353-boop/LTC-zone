import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildFilename,
  describeNote,
  extractUrl,
  handleRequest,
  noteFromState,
  parseInitialState,
} from "./worker.js";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const live = !process.argv.includes("--offline");
const SHARE = "https://xhslink.cn/o/A8vpzl1B6NG 存好口令，直达【小红书】瞅瞅~";

function read(name) {
  return readFileSync(join(fixtures, name), "utf8");
}

function assertNote(html, checks) {
  const note = noteFromState(parseInitialState(html));
  const meta = describeNote(note);
  checks(note, meta);
}

assert.equal(extractUrl(SHARE), "https://xhslink.cn/o/A8vpzl1B6NG");
assert.equal(extractUrl("https://xhslink.cn/o/Abcd，存好口令"), "https://xhslink.cn/o/Abcd");

await assert.rejects(() => Promise.resolve().then(() => extractUrl("https://xhslink.cn.evil.example/o/abc")));
await assert.rejects(() => Promise.resolve().then(() => extractUrl("https://evil.example/redirect?u=https://xhslink.cn/o/abc")));

assertNote(read("classic.html"), (note, meta) => {
  assert.equal(note.user.avatar, null);
  assert.match(note.desc, /undefined/);
  assert.equal(meta.author, "测试作者");
  assert.equal(meta.originKey, "pre_post/1040g2t0testkey");
  assert.deepEqual(meta.images, ["https://sns-img.xhscdn.com/test.jpg"]);
  assert.equal(meta.streamUrls[0], "https://sns-video-hw.xhscdn.com/stream/test.mp4");
  assert.equal(meta.streamUrls[1], "https://sns-video-bd.xhscdn.com/stream/backup.mp4");
  assert.equal(meta.originUrls[0], "https://sns-video-bd.xhscdn.com/pre_post/1040g2t0testkey");
  assert.equal(buildFilename(meta.author, meta.title, "mp4"), "测试作者_测试标题.mp4");
});

assertNote(read("rednote.html"), (note, meta) => {
  assert.equal(note.noteId, "abc123");
  assert.equal(meta.author, "萌小萌");
  assert.equal(meta.title, "白色裤子 喇叭裤");
  assert.equal(meta.originKey, "pre_post/1040g2t0sample");
  assert.ok(buildFilename(meta.author, meta.title, "mov").startsWith("萌小萌_白色裤子_喇叭裤"));
});

assertNote(read("image_note.html"), (_note, meta) => {
  assert.equal(meta.originKey, "");
  assert.equal(meta.title, "风景");
  assert.deepEqual(meta.images, ["https://sns-img.xhscdn.com/1.jpg", "https://sns-img.xhscdn.com/2.webp"]);
});

async function call(path, headers) {
  const response = await handleRequest(new Request("https://worker.test" + path, { headers }));
  const type = response.headers.get("content-type") || "";
  if (type.includes("json")) {
    return { response, data: await response.json() };
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  return { response, bytes };
}

const health = await call("/");
assert.equal(health.response.status, 200);
assert.equal(health.data.service, "xhs-downloader");

const options = await handleRequest(new Request("https://worker.test/resolve", { method: "OPTIONS" }));
assert.equal(options.status, 204);
assert.equal(options.headers.get("access-control-allow-origin"), "*");

const blockedPage = await call("/resolve?input=" + encodeURIComponent("https://example.com/a"));
assert.equal(blockedPage.response.status, 400);
assert.match(blockedPage.data.error, /没有找到小红书/);

const blockedFile = await call("/file?url=" + encodeURIComponent("https://example.com/a.mp4"));
assert.equal(blockedFile.response.status, 400);

const blockedIp = await call("/file?url=" + encodeURIComponent("http://127.0.0.1/secret"));
assert.equal(blockedIp.response.status, 400);

if (live) {
  console.log("live: resolve sample share link");
  const resolved = await call("/resolve?input=" + encodeURIComponent(SHARE));
  assert.equal(resolved.response.status, 200, JSON.stringify(resolved.data));
  assert.equal(resolved.data.ok, true);
  assert.equal(resolved.data.author, "萌小萌");
  assert.match(resolved.data.title, /白色裤子/);
  assert.equal(resolved.data.via, "origin");
  assert.match(resolved.data.videoUrl, /^https:\/\/sns-video-[a-z]+\.xhscdn\.com\/pre_post\//);
  assert.ok(resolved.data.size > 2_000_000, `size ${resolved.data.size}`);
  assert.equal(resolved.data.ext, "mov");
  assert.match(resolved.data.cover || "", /^https:\/\//);
  assert.equal(resolved.data.videoUrl !== null, true);

  console.log("live: proxy first bytes", resolved.data.videoUrl);
  const fileUrl =
    "/file?url=" +
    encodeURIComponent(resolved.data.videoUrl) +
    "&name=" +
    encodeURIComponent(resolved.data.filename);
  const head = await call(fileUrl, { Range: "bytes=0-31" });
  assert.equal(head.response.status, 206, `status ${head.response.status}`);
  assert.match(head.response.headers.get("content-type") || "", /video\/quicktime|video\/mp4/);
  assert.match(head.response.headers.get("content-range") || "", /\/\d+$/);
  assert.ok(Buffer.from(head.bytes).includes(Buffer.from("ftyp")));
  assert.equal(head.response.headers.get("access-control-allow-origin"), "*");

  const tailStart = Math.max(0, resolved.data.size - 12000);
  const tail = await call(fileUrl, { Range: `bytes=${tailStart}-` });
  assert.equal(tail.response.status, 206);
  assert.match(tail.response.headers.get("content-range") || "", new RegExp(`/${resolved.data.size}$`));
  assert.ok(Buffer.from(tail.bytes).includes(Buffer.from("moov")), "player needs the moov atom at the end of the original file");

  const attachment = await handleRequest(
    new Request("https://worker.test" + fileUrl + "&dl=1", { headers: { Range: "bytes=0-15" } })
  );
  assert.match(attachment.headers.get("content-disposition") || "", /^attachment;/);
  assert.match(attachment.headers.get("content-disposition") || "", /filename\*=UTF-8''/);
  await attachment.arrayBuffer();
  console.log("live ok", resolved.data.filename, resolved.data.size, resolved.data.videoUrl);
}

console.log("worker tests passed");
