/**
 * 小红书无水印下载 Worker（单个文件，可直接粘贴到 Cloudflare 控制台）。
 *
 * 只访问小红书页面域名和视频/图片 CDN，不是开放代理。
 * 不读取、不保存任何密钥。
 *
 *   GET /            健康检查
 *   GET /resolve?input=<分享文案或链接>
 *   GET /file?url=<CDN 地址>&name=<文件名>&dl=1
 */

const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

const PAGE_SUFFIXES = ["xhslink.cn", "xhslink.com", "xiaohongshu.com", "rednote.com"];
const FILE_SUFFIXES = ["xhscdn.com", "rednotecdn.com"];
const ORIGIN_HOSTS = [
  "https://sns-video-bd.xhscdn.com/",
  "https://sns-video-hw.xhscdn.com/",
  "https://sns-video-qc.xhscdn.com/",
  "https://sns-video-al.xhscdn.com/",
  "https://sns-video-hs.xhscdn.com/",
];
const XHS_REFERER = "https://www.xiaohongshu.com/";
const MAX_HTML = 3_000_000;
const MAX_INPUT = 4000;

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function hostAllowed(hostname, suffixes) {
  const host = String(hostname || "").trim().toLowerCase().replace(/\.$/, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    return false;
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":")) return false;
  return suffixes.some((suffix) => host === suffix || host.endsWith("." + suffix));
}

function assertHttpUrl(raw, suffixes) {
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new HttpError(400, "链接格式不正确");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new HttpError(400, "只接受 http 或 https 链接");
  }
  if (parsed.username || parsed.password) {
    throw new HttpError(400, "拒绝带账号密码的链接");
  }
  if (!hostAllowed(parsed.hostname, suffixes)) {
    throw new HttpError(400, `拒绝访问该域名：${parsed.hostname || raw}`);
  }
  return parsed;
}

export function extractUrl(text) {
  const raw = String(text || "").trim();
  if (!raw) throw new HttpError(400, "请粘贴分享文案或链接");
  if (raw.length > MAX_INPUT) throw new HttpError(400, "分享文案太长");
  const matches = raw.match(/https?:\/\/[A-Za-z0-9\-._~:/?#\[\]@!$&'()*+,;=%]+/gi) || [];
  const found = matches.map((item) => item.replace(/[.,;:)\]}>，。！？、；：）】」』]+$/g, ""));
  if (!found.length) throw new HttpError(400, "文案里没有找到链接");
  for (const url of found) {
    let host = "";
    try {
      host = new URL(url).hostname;
    } catch {
      continue;
    }
    if (hostAllowed(host, PAGE_SUFFIXES)) return url;
  }
  throw new HttpError(400, "没有找到小红书或 xhslink 链接");
}

function sliceObjectLiteral(text, start) {
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (char === "\\") esc = true;
      else if (char === '"') inStr = false;
      continue;
    }
    if (char === '"') {
      inStr = true;
      continue;
    }
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  throw new HttpError(422, "页面里的笔记数据不完整");
}

function replaceJsAtoms(text) {
  let out = "";
  let inStr = false;
  let esc = false;
  const atoms = ["undefined", "NaN", "-Infinity", "Infinity"];
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inStr) {
      out += char;
      if (esc) esc = false;
      else if (char === "\\") esc = true;
      else if (char === '"') inStr = false;
      continue;
    }
    if (char === '"') {
      inStr = true;
      out += char;
      continue;
    }
    const prev = i ? text[i - 1] : "";
    if (!/[A-Za-z0-9_$]/.test(prev)) {
      let replaced = false;
      for (const atom of atoms) {
        if (!text.startsWith(atom, i)) continue;
        const next = text[i + atom.length] || "";
        if (/[A-Za-z0-9_$]/.test(next)) continue;
        out += "null";
        i += atom.length - 1;
        replaced = true;
        break;
      }
      if (replaced) continue;
    }
    out += char;
  }
  return out;
}

function stripTrailingCommas(text) {
  let out = "";
  let inStr = false;
  let esc = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inStr) {
      out += char;
      if (esc) esc = false;
      else if (char === "\\") esc = true;
      else if (char === '"') inStr = false;
      continue;
    }
    if (char === '"') {
      inStr = true;
      out += char;
      continue;
    }
    if (char === ",") {
      let j = i + 1;
      while (j < text.length && /\s/.test(text[j])) j += 1;
      if (text[j] === "}" || text[j] === "]") continue;
    }
    out += char;
  }
  return out;
}

export function parseInitialState(html) {
  const marker = "window.__INITIAL_STATE__";
  const idx = html.indexOf(marker);
  if (idx < 0) {
    throw new HttpError(422, "页面里没有笔记数据。链接可能已失效，或页面要求登录");
  }
  const brace = html.indexOf("{", idx);
  if (brace < 0) throw new HttpError(422, "页面里的笔记数据格式无法识别");
  const literal = sliceObjectLiteral(html, brace);
  const repaired = replaceJsAtoms(literal);
  try {
    return JSON.parse(repaired);
  } catch {
    try {
      return JSON.parse(stripTrailingCommas(repaired));
    } catch {
      throw new HttpError(422, "笔记数据无法解析");
    }
  }
}

function walk(node, visit) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visit);
    return;
  }
  visit(node);
  for (const value of Object.values(node)) walk(value, visit);
}

function originKey(note) {
  const key = note?.video?.consumer?.originVideoKey;
  return typeof key === "string" && key.trim() ? key.trim().replace(/^\/+/, "") : "";
}

function authorOf(note) {
  const user = note?.user;
  if (!user || typeof user !== "object") return "";
  for (const field of ["nickName", "nickname", "nick_name"]) {
    const value = user[field];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function upgradeUrl(url) {
  const value = String(url || "").trim();
  if (value.startsWith("//")) return "https:" + value;
  if (value.startsWith("http://")) return "https://" + value.slice("http://".length);
  return value;
}

function imageUrls(note) {
  const images = Array.isArray(note?.imageList) ? note.imageList : [];
  const found = [];
  for (const image of images) {
    if (!image || typeof image !== "object") continue;
    const ordered = [];
    for (const field of ["urlDefault", "url"]) {
      if (typeof image[field] === "string" && image[field].trim()) ordered.push(image[field].trim());
    }
    if (Array.isArray(image.infoList)) {
      for (const info of image.infoList) {
        if (info && typeof info.url === "string" && info.url.trim()) ordered.push(info.url.trim());
      }
    }
    for (const candidate of ordered) {
      const upgraded = upgradeUrl(candidate);
      if (upgraded.startsWith("https://") && !found.includes(upgraded)) {
        found.push(upgraded);
        break;
      }
    }
  }
  return found;
}

function streamUrls(note) {
  const stream = note?.video?.media?.stream;
  if (!stream || typeof stream !== "object") return [];
  const found = [];
  for (const codec of ["h264", "h265", "h266", "av1"]) {
    let items = stream[codec] || [];
    if (items && !Array.isArray(items)) items = [items];
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const urls = [item.masterUrl];
      if (Array.isArray(item.backupUrls)) urls.push(...item.backupUrls);
      for (const url of urls) {
        if (typeof url !== "string" || !url.trim()) continue;
        const upgraded = upgradeUrl(url.trim());
        if (!found.includes(upgraded)) found.push(upgraded);
      }
    }
  }
  return found;
}

function noteScore(note) {
  let score = 0;
  if (originKey(note)) score += 100;
  if (note?.video?.media && typeof note.video.media === "object") score += 40;
  if (authorOf(note)) score += 20;
  if (typeof note?.noteId === "string" && note.noteId) score += 10;
  if (note?.desc || note?.title) score += 5;
  if (Array.isArray(note?.imageList)) score += Math.min(note.imageList.length, 5);
  return score;
}

export function noteFromState(state) {
  const found = [];
  walk(state, (node) => {
    const hasVideo = node.video && typeof node.video === "object";
    const hasImages = Array.isArray(node.imageList) && node.imageList.length > 0;
    if (!hasVideo && !hasImages) return;
    const hasText = ["noteId", "title", "desc"].some((key) => typeof node[key] === "string");
    if (!hasText) return;
    found.push(node);
  });
  if (!found.length) throw new HttpError(404, "笔记里没有视频或图片");
  found.sort((a, b) => noteScore(b) - noteScore(a));
  return found[0];
}

export function cleanCaption(text) {
  return String(text || "")
    .replace(/\[话题\]/g, "")
    .replace(/#/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeFilename(name, limit = 80) {
  const cleaned = String(name || "")
    .replace(/[\\/:*?"<>|\r\n\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[. ]+|[. ]+$/g, "");
  const cut = cleaned.length > limit ? cleaned.slice(0, limit).replace(/[. ]+$/g, "") : cleaned;
  return cut || "xhs";
}

export function buildFilename(author, title, ext) {
  const who = sanitizeFilename(cleanCaption(author) || "小红书", 30);
  const caption = cleanCaption(title).replace(/ /g, "_");
  const stem = sanitizeFilename(caption ? `${who}_${caption}` : who);
  return `${stem}.${String(ext || "mp4").replace(/^\./, "")}`;
}

export function displayTitle(note) {
  const title = cleanCaption(typeof note?.title === "string" ? note.title : "");
  if (title) return title;
  const desc = cleanCaption(typeof note?.desc === "string" ? note.desc : "");
  if (desc) return desc;
  return typeof note?.noteId === "string" && note.noteId ? note.noteId : "小红书笔记";
}

function originUrls(key) {
  const quoted = key.split("/").map((part) => encodeURIComponent(part)).join("/");
  return ORIGIN_HOSTS.map((host) => host + quoted);
}

export function describeNote(note) {
  const images = imageUrls(note);
  const key = originKey(note);
  return {
    author: authorOf(note),
    title: displayTitle(note),
    desc: typeof note?.desc === "string" ? note.desc : "",
    noteId: typeof note?.noteId === "string" ? note.noteId : "",
    images,
    cover: images[0] || null,
    originKey: key,
    originUrls: key ? originUrls(key) : [],
    streamUrls: streamUrls(note),
  };
}

function baseHeaders(extra) {
  return {
    "User-Agent": MOBILE_UA,
    Accept: "*/*",
    "Accept-Language": "zh-CN,zh;q=0.9",
    ...extra,
  };
}

function storeCookies(jar, host, headers) {
  const lines =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : headers.get("set-cookie")
        ? [headers.get("set-cookie")]
        : [];
  if (!lines.length) return;
  const bucket = jar.get(host) || new Map();
  for (const line of lines) {
    const pair = String(line).split(";")[0];
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    const name = pair.slice(0, eq).trim();
    if (name) bucket.set(name, pair.slice(eq + 1).trim());
  }
  jar.set(host, bucket);
}

async function cancel(response) {
  try {
    if (response?.body) await response.body.cancel();
  } catch {
    /* 跳转响应的正文可以丢掉 */
  }
}

async function fetchPage(startUrl) {
  assertHttpUrl(startUrl, PAGE_SUFFIXES);
  const jar = new Map();
  let current = startUrl;
  for (let hop = 0; hop < 8; hop++) {
    const parsed = assertHttpUrl(current, PAGE_SUFFIXES);
    const headers = baseHeaders({
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    });
    const bucket = jar.get(parsed.hostname);
    if (bucket && bucket.size) {
      headers.Cookie = [...bucket.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
    }
    let response;
    try {
      response = await fetch(current, { headers, redirect: "manual" });
    } catch {
      throw new HttpError(502, "打开笔记页失败");
    }
    storeCookies(jar, parsed.hostname, response.headers);
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      await cancel(response);
      if (!location) throw new HttpError(502, "短链跳转失败：没有 Location");
      current = new URL(location, current).toString();
      continue;
    }
    if (response.status !== 200) {
      await cancel(response);
      throw new HttpError(502, `打开笔记页失败（HTTP ${response.status}）`);
    }
    const length = Number(response.headers.get("content-length") || 0);
    if (length > MAX_HTML) {
      await cancel(response);
      throw new HttpError(502, "笔记页面过大");
    }
    const html = await response.text();
    if (html.length > MAX_HTML) throw new HttpError(502, "笔记页面过大");
    return { url: current, html };
  }
  throw new HttpError(502, "短链跳转次数过多");
}

function mediaKind(bytes) {
  const ascii = (start, end) => String.fromCharCode(...bytes.slice(start, end));
  if (bytes.length >= 12 && ascii(4, 8) === "ftyp") {
    if (ascii(8, 12) === "qt  ") return { ext: "mov", mime: "video/quicktime" };
    return { ext: "mp4", mime: "video/mp4" };
  }
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return { ext: "webm", mime: "video/webm" };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return { ext: "jpg", mime: "image/jpeg" };
  if (bytes[0] === 0x89 && ascii(1, 4) === "PNG") return { ext: "png", mime: "image/png" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { ext: "webp", mime: "image/webp" };
  if (ascii(0, 4) === "GIF8") return { ext: "gif", mime: "image/gif" };
  return { ext: "", mime: "" };
}

function contentSize(headers) {
  const range = headers.get("content-range") || "";
  const total = range.includes("/") ? range.split("/").pop() : "";
  if (total && /^\d+$/.test(total)) return Number(total);
  const length = headers.get("content-length") || "";
  if (/^\d+$/.test(length) && !range) return Number(length);
  return 0;
}

async function readSome(response, max) {
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (total < max) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  try {
    await reader.cancel();
  } catch {
    /* 只需要文件头 */
  }
  const out = new Uint8Array(Math.min(total, max));
  let offset = 0;
  for (const chunk of chunks) {
    const take = Math.min(chunk.length, out.length - offset);
    out.set(chunk.subarray(0, take), offset);
    offset += take;
    if (offset >= out.length) break;
  }
  return out;
}

async function probe(url, depth = 0) {
  if (depth > 3) return null;
  try {
    assertHttpUrl(url, FILE_SUFFIXES);
  } catch {
    return null;
  }
  const attempts = [{ Referer: XHS_REFERER }, {}];
  for (const extra of attempts) {
    const headers = baseHeaders(extra);
    headers.Range = "bytes=0-31";
    let response;
    try {
      response = await fetch(url, { headers, redirect: "manual" });
    } catch {
      continue;
    }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      await cancel(response);
      if (!location) continue;
      return probe(new URL(location, url).toString(), depth + 1);
    }
    if (response.status !== 200 && response.status !== 206) {
      await cancel(response);
      continue;
    }
    const bytes = await readSome(response, 32);
    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (contentType.includes("text/html") || contentType.includes("application/json")) continue;
    const kind = mediaKind(bytes);
    const size = contentSize(response.headers);
    if (!kind.ext && !(size > 50_000)) continue;
    return {
      url,
      size: size || null,
      ext: kind.ext || "mp4",
      mime: kind.mime || "video/mp4",
      useReferer: Boolean(extra.Referer),
    };
  }
  return null;
}

async function firstWorking(urls) {
  const seen = new Set();
  for (const url of urls) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const hit = await probe(url);
    if (hit) return hit;
  }
  return null;
}

async function fetchMedia(url, rangeHeader, depth = 0) {
  assertHttpUrl(url, FILE_SUFFIXES);
  if (depth > 4) throw new HttpError(502, "下载地址跳转过多");
  const attempts = [{ Referer: XHS_REFERER }, {}];
  let lastStatus = 0;
  for (const extra of attempts) {
    const headers = baseHeaders(extra);
    if (rangeHeader) headers.Range = rangeHeader;
    let response;
    try {
      response = await fetch(url, { headers, redirect: "manual" });
    } catch {
      throw new HttpError(502, "下载请求失败");
    }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      await cancel(response);
      if (!location) throw new HttpError(502, "下载地址跳转失败");
      return fetchMedia(new URL(location, url).toString(), rangeHeader, depth + 1);
    }
    if (response.status === 403 || response.status === 401) {
      lastStatus = response.status;
      await cancel(response);
      continue;
    }
    return response;
  }
  throw new HttpError(502, `CDN 拒绝下载（HTTP ${lastStatus || 403}）`);
}

function mimeFromName(name) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "video/mp4";
}

function contentDisposition(filename, download) {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\;]/g, "_") || "download";
  const star = encodeURIComponent(filename).replace(/['()*]/g, (ch) => {
    return `%${ch.charCodeAt(0).toString(16).toUpperCase()}`;
  });
  return `${download ? "attachment" : "inline"}; filename="${ascii}"; filename*=UTF-8''${star}`;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
    },
  });
}

function emptyResult(extra) {
  return {
    ok: false,
    title: "",
    author: "",
    videoUrl: null,
    cover: null,
    ...extra,
  };
}

function routeOf(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/" || path.endsWith("/health")) return "health";
  if (path.endsWith("/resolve")) return "resolve";
  if (path.endsWith("/file")) return "file";
  return "";
}

async function resolveInput(input) {
  const pageUrl = extractUrl(input);
  const page = await fetchPage(pageUrl);
  const state = parseInitialState(page.html);
  const note = noteFromState(state);
  const meta = describeNote(note);
  let video = null;
  let via = null;
  if (meta.originUrls.length) {
    video = await firstWorking(meta.originUrls);
    if (video) via = "origin";
  }
  if (!video && meta.streamUrls.length) {
    video = await firstWorking(meta.streamUrls);
    if (video) via = "stream";
  }
  if (!video && meta.images.length === 0) {
    throw new HttpError(404, meta.originKey ? "找到了原片字段，但所有 CDN 地址都无法下载" : "笔记里没有可下载的视频或图片");
  }
  const ext = video ? video.ext : "jpg";
  return {
    ok: true,
    title: meta.title,
    author: meta.author,
    videoUrl: video ? video.url : null,
    cover: meta.cover,
    desc: meta.desc,
    noteId: meta.noteId,
    type: video ? "video" : "image",
    via,
    mime: video ? video.mime : null,
    ext: video ? video.ext : null,
    size: video ? video.size : null,
    images: meta.images,
    filename: buildFilename(meta.author, meta.title, ext),
    warning: !video && meta.originKey ? "原片 CDN 暂时无法访问" : via === "stream" ? "没有拿到无水印原片，当前是转码地址" : null,
  };
}

function fileResponse(upstream, filename, download) {
  const headers = new Headers();
  for (const name of ["content-length", "content-range", "accept-ranges", "content-type"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  const type = (headers.get("content-type") || "").toLowerCase();
  if (!type || type.includes("octet-stream") || type.startsWith("text/")) {
    headers.set("content-type", mimeFromName(filename));
  }
  if (!headers.has("accept-ranges")) headers.set("accept-ranges", "bytes");
  headers.set("content-disposition", contentDisposition(filename, download));
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-expose-headers", "content-length, content-range, content-disposition, accept-ranges");
  headers.set("cache-control", "private, max-age=300");
  return new Response(upstream.body, { status: upstream.status, headers });
}

export async function handleRequest(request) {
  try {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, OPTIONS",
          "access-control-allow-headers": "Content-Type, Range",
          "access-control-max-age": "86400",
        },
      });
    }
    if (request.method !== "GET") {
      return json(emptyResult({ error: "只支持 GET" }), 405);
    }
    const route = routeOf(url.pathname);
    if (route === "health") return json({ ok: true, service: "xhs-downloader" });
    if (route === "resolve") {
      const input = url.searchParams.get("input") || url.searchParams.get("url") || "";
      const payload = await resolveInput(input);
      return json(payload);
    }
    if (route === "file") {
      const target = url.searchParams.get("url") || "";
      if (!target) return json(emptyResult({ error: "缺少文件地址" }), 400);
      const filename = sanitizeFilename(url.searchParams.get("name") || "video.mp4", 120);
      const upstream = await fetchMedia(target, request.headers.get("Range"));
      if (upstream.status >= 400 || !upstream.body) {
        const status = upstream.status;
        await cancel(upstream);
        return json(emptyResult({ error: `下载失败（HTTP ${status}）` }), 502);
      }
      return fileResponse(upstream, filename, url.searchParams.get("dl") === "1");
    }
    return json(emptyResult({ error: "未知路径" }), 404);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 502;
    const message = err instanceof Error && err.message ? err.message : "解析失败";
    return json(emptyResult({ error: message }), status);
  }
}

export default {
  async fetch(request) {
    return handleRequest(request);
  },
};
