#!/usr/bin/env python3
"""从小红书分享文案下载无水印视频（标准库，无需 pip）。

用法:
  python3 xhs_dl.py "https://xhslink.cn/o/xxxx 存好口令……"
  python3 xhs_dl.py "https://www.xiaohongshu.com/explore/<noteId>?xsec_token=..." -o ~/Downloads
"""

from __future__ import annotations

import argparse
import ipaddress
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

MOBILE_UA = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 "
    "Mobile/15E148 Safari/604.1"
)

PAGE_SUFFIXES = ("xhslink.cn", "xhslink.com", "xiaohongshu.com", "rednote.com")
FILE_SUFFIXES = ("xhscdn.com", "rednotecdn.com")

ORIGIN_HOSTS = (
    "https://sns-video-bd.xhscdn.com/",
    "https://sns-video-hw.xhscdn.com/",
    "https://sns-video-qc.xhscdn.com/",
    "https://sns-video-al.xhscdn.com/",
    "https://sns-video-hs.xhscdn.com/",
)

XHS_REFERER = "https://www.xiaohongshu.com/"
MAX_HTML = 3_000_000
# 停在中文和全角标点之前，这样整段分享文案里贴在链接后面的字不会被算进 URL。
URL_RE = re.compile(r"https?://[A-Za-z0-9\-._~:/?#\[\]@!$&'()*+,;=%]+", re.IGNORECASE)
TRAILING_PUNCT = ".,;:)]}>，。！？、；：）】」』"


class UserError(Exception):
    """预期内的失败，直接展示给使用者。"""


def host_allowed(hostname: str, suffixes: tuple[str, ...]) -> bool:
    host = (hostname or "").strip().lower().rstrip(".")
    if not host or host == "localhost" or host.endswith(".localhost") or host.endswith(".local"):
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return any(host == suffix or host.endswith("." + suffix) for suffix in suffixes)


def check_url(url: str, suffixes: tuple[str, ...]) -> urllib.parse.ParseResult:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise UserError("只接受 http 或 https 链接")
    if parsed.username or parsed.password:
        raise UserError("拒绝带账号密码的链接")
    if not host_allowed(parsed.hostname or "", suffixes):
        raise UserError(f"拒绝访问该域名：{parsed.hostname or url}")
    return parsed


def extract_url(text: str) -> str:
    raw = (text or "").strip()
    if not raw:
        raise UserError("请粘贴分享文案或链接")
    found = [item.rstrip(TRAILING_PUNCT) for item in URL_RE.findall(raw)]
    if not found and raw.startswith("http"):
        found = [raw.rstrip(TRAILING_PUNCT)]
    if not found:
        raise UserError("文案里没有找到链接")
    for url in found:
        host = urllib.parse.urlparse(url).hostname or ""
        if host_allowed(host, PAGE_SUFFIXES):
            return url
    raise UserError("没有找到小红书或 xhslink 链接")


def replace_js_atoms(text: str) -> str:
    """把字符串外的 undefined / NaN / Infinity 换成 null，便于 JSON 解析。"""
    out: list[str] = []
    in_str = False
    esc = False
    i = 0
    atoms = ("undefined", "NaN", "-Infinity", "Infinity")
    while i < len(text):
        char = text[i]
        if in_str:
            out.append(char)
            if esc:
                esc = False
            elif char == "\\":
                esc = True
            elif char == '"':
                in_str = False
            i += 1
            continue
        if char == '"':
            in_str = True
            out.append(char)
            i += 1
            continue
        prev = text[i - 1] if i else ""
        if not (prev.isalnum() or prev in "_$"):
            for atom in atoms:
                if text.startswith(atom, i):
                    nxt = text[i + len(atom)] if i + len(atom) < len(text) else ""
                    if not (nxt.isalnum() or nxt in "_$"):
                        out.append("null")
                        i += len(atom)
                        break
            else:
                out.append(char)
                i += 1
            continue
        out.append(char)
        i += 1
    return "".join(out)


def strip_trailing_commas(text: str) -> str:
    out: list[str] = []
    in_str = False
    esc = False
    i = 0
    while i < len(text):
        char = text[i]
        if in_str:
            out.append(char)
            if esc:
                esc = False
            elif char == "\\":
                esc = True
            elif char == '"':
                in_str = False
            i += 1
            continue
        if char == '"':
            in_str = True
            out.append(char)
            i += 1
            continue
        if char == ",":
            j = i + 1
            while j < len(text) and text[j].isspace():
                j += 1
            if j < len(text) and text[j] in "}]":
                i += 1
                continue
        out.append(char)
        i += 1
    return "".join(out)


def slice_object_literal(text: str, start: int) -> str:
    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(text)):
        char = text[i]
        if in_str:
            if esc:
                esc = False
            elif char == "\\":
                esc = True
            elif char == '"':
                in_str = False
            continue
        if char == '"':
            in_str = True
            continue
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]
    raise UserError("页面里的笔记数据不完整")


def parse_initial_state(html: str) -> dict:
    marker = "window.__INITIAL_STATE__"
    idx = html.find(marker)
    if idx < 0:
        raise UserError("页面里没有笔记数据。链接可能已失效，或页面要求登录")
    brace = html.find("{", idx)
    if brace < 0:
        raise UserError("页面里的笔记数据格式无法识别")
    literal = slice_object_literal(html, brace)
    repaired = replace_js_atoms(literal)
    try:
        data = json.loads(repaired)
    except json.JSONDecodeError:
        try:
            data = json.loads(strip_trailing_commas(repaired))
        except json.JSONDecodeError as exc:
            raise UserError(f"笔记数据无法解析：{exc.msg}") from exc
    if not isinstance(data, dict):
        raise UserError("笔记数据格式无法识别")
    return data


def _walk(node, visit) -> None:
    if isinstance(node, dict):
        visit(node)
        for value in node.values():
            _walk(value, visit)
    elif isinstance(node, list):
        for value in node:
            _walk(value, visit)


def origin_key(note: dict) -> str:
    video = note.get("video")
    if not isinstance(video, dict):
        return ""
    consumer = video.get("consumer")
    if not isinstance(consumer, dict):
        return ""
    key = consumer.get("originVideoKey")
    if isinstance(key, str) and key.strip():
        return key.strip().lstrip("/")
    return ""


def author_of(note: dict) -> str:
    user = note.get("user")
    if not isinstance(user, dict):
        return ""
    for field in ("nickName", "nickname", "nick_name"):
        value = user.get(field)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def upgrade_url(url: str) -> str:
    url = (url or "").strip()
    if url.startswith("//"):
        return "https:" + url
    if url.startswith("http://"):
        return "https://" + url[len("http://") :]
    return url


def image_urls(note: dict) -> list[str]:
    images = note.get("imageList")
    if not isinstance(images, list):
        return []
    found: list[str] = []
    for image in images:
        if not isinstance(image, dict):
            continue
        ordered: list[str] = []
        for field in ("urlDefault", "url"):
            value = image.get(field)
            if isinstance(value, str) and value.strip():
                ordered.append(value.strip())
        info_list = image.get("infoList")
        if isinstance(info_list, list):
            for info in info_list:
                if isinstance(info, dict) and isinstance(info.get("url"), str):
                    ordered.append(info["url"].strip())
        for candidate in ordered:
            upgraded = upgrade_url(candidate)
            if upgraded.startswith("https://") and upgraded not in found:
                found.append(upgraded)
                break
    return found


def stream_urls(note: dict) -> list[str]:
    video = note.get("video")
    if not isinstance(video, dict):
        return []
    media = video.get("media")
    if not isinstance(media, dict):
        return []
    stream = media.get("stream")
    if not isinstance(stream, dict):
        return []
    found: list[str] = []
    for codec in ("h264", "h265", "h266", "av1"):
        items = stream.get(codec) or []
        if isinstance(items, dict):
            items = [items]
        if not isinstance(items, list):
            continue
        for item in items:
            if not isinstance(item, dict):
                continue
            urls = [item.get("masterUrl")]
            backups = item.get("backupUrls")
            if isinstance(backups, list):
                urls.extend(backups)
            for url in urls:
                if not isinstance(url, str) or not url.strip():
                    continue
                upgraded = upgrade_url(url.strip())
                if upgraded not in found:
                    found.append(upgraded)
    return found


def _note_score(note: dict) -> int:
    score = 0
    if origin_key(note):
        score += 100
    video = note.get("video")
    if isinstance(video, dict) and isinstance(video.get("media"), dict):
        score += 40
    if author_of(note):
        score += 20
    if isinstance(note.get("noteId"), str) and note.get("noteId"):
        score += 10
    if note.get("desc") or note.get("title"):
        score += 5
    images = note.get("imageList")
    if isinstance(images, list):
        score += min(len(images), 5)
    return score


def note_from_state(state: dict) -> dict:
    found: list[dict] = []

    def visit(node: dict) -> None:
        has_video = isinstance(node.get("video"), dict)
        images = node.get("imageList")
        has_images = isinstance(images, list) and len(images) > 0
        if not has_video and not has_images:
            return
        if not any(isinstance(node.get(key), str) for key in ("noteId", "title", "desc")):
            return
        found.append(node)

    _walk(state, visit)
    if not found:
        raise UserError("笔记里没有视频或图片")
    found.sort(key=_note_score, reverse=True)
    return found[0]


def clean_caption(text: str) -> str:
    text = re.sub(r"\[话题\]", "", text or "")
    text = text.replace("#", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def sanitize_filename(name: str, limit: int = 80) -> str:
    name = re.sub(r'[\\/:*?"<>|\r\n\t]', " ", name)
    name = re.sub(r"\s+", " ", name).strip(" .")
    if len(name) > limit:
        name = name[:limit].rstrip(" .")
    return name or "xhs"


def build_filename(author: str, title: str, ext: str) -> str:
    author = sanitize_filename(clean_caption(author) or "小红书", 30)
    caption = clean_caption(title).replace(" ", "_")
    stem = sanitize_filename(f"{author}_{caption}" if caption else author)
    return f"{stem}.{ext.lstrip('.')}"


def display_title(note: dict) -> str:
    title = clean_caption(note.get("title") if isinstance(note.get("title"), str) else "")
    if title:
        return title
    desc = clean_caption(note.get("desc") if isinstance(note.get("desc"), str) else "")
    if desc:
        return desc
    note_id = note.get("noteId")
    return note_id if isinstance(note_id, str) and note_id else "小红书笔记"


def origin_urls(key: str) -> list[str]:
    quoted = urllib.parse.quote(key.lstrip("/"), safe="/")
    return [host + quoted for host in ORIGIN_HOSTS]


def media_kind(header: bytes) -> tuple[str, str]:
    if len(header) >= 12 and header[4:8] == b"ftyp":
        brand = header[8:12]
        if brand == b"qt  ":
            return "mov", "video/quicktime"
        return "mp4", "video/mp4"
    if header.startswith(b"\x1aE\xdf\xa3"):
        return "webm", "video/webm"
    if header.startswith(b"\xff\xd8\xff"):
        return "jpg", "image/jpeg"
    if header.startswith(b"\x89PNG"):
        return "png", "image/png"
    if header.startswith(b"RIFF") and header[8:12] == b"WEBP":
        return "webp", "image/webp"
    if header.startswith(b"GIF8"):
        return "gif", "image/gif"
    return "", ""


def _base_headers() -> dict[str, str]:
    return {
        "User-Agent": MOBILE_UA,
        "Accept": "*/*",
        "Accept-Language": "zh-CN,zh;q=0.9",
    }


def _cookie_header(jar: dict[str, dict[str, str]], host: str) -> str:
    pairs = jar.get(host) or {}
    return "; ".join(f"{name}={value}" for name, value in pairs.items())


def _store_cookies(jar: dict[str, dict[str, str]], host: str, headers) -> None:
    values = []
    if hasattr(headers, "get_all"):
        values = headers.get_all("Set-Cookie") or []
    elif headers.get("Set-Cookie"):
        values = [headers.get("Set-Cookie")]
    bucket = jar.setdefault(host, {})
    for line in values:
        pair = line.split(";", 1)[0]
        if "=" not in pair:
            continue
        name, value = pair.split("=", 1)
        name = name.strip()
        if name:
            bucket[name] = value.strip()


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


_OPENER = urllib.request.build_opener(_NoRedirect)


def _request(url: str, headers: dict[str, str], timeout: int):
    req = urllib.request.Request(url, headers=headers)
    try:
        resp = _OPENER.open(req, timeout=timeout)
        return resp.status, resp.headers, resp
    except urllib.error.HTTPError as exc:
        return exc.code, exc.headers, exc


def fetch_html(start_url: str) -> tuple[str, str]:
    check_url(start_url, PAGE_SUFFIXES)
    jar: dict[str, dict[str, str]] = {}
    current = start_url
    for _ in range(8):
        parsed = check_url(current, PAGE_SUFFIXES)
        headers = _base_headers()
        headers["Accept"] = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        cookie = _cookie_header(jar, parsed.hostname or "")
        if cookie:
            headers["Cookie"] = cookie
        status, resp_headers, body_obj = _request(current, headers, 30)
        _store_cookies(jar, parsed.hostname or "", resp_headers)
        if status in (301, 302, 303, 307, 308):
            location = resp_headers.get("Location")
            try:
                body_obj.close()
            except Exception:
                pass
            if not location:
                raise UserError("短链跳转失败：没有 Location")
            current = urllib.parse.urljoin(current, location)
            continue
        try:
            if status != 200:
                raise UserError(f"打开笔记页失败（HTTP {status}）")
            length = int(resp_headers.get("Content-Length") or 0)
            if length > MAX_HTML:
                raise UserError("笔记页面过大")
            data = body_obj.read(MAX_HTML + 1)
        finally:
            body_obj.close()
        if len(data) > MAX_HTML:
            raise UserError("笔记页面过大")
        charset = "utf-8"
        content_type = resp_headers.get("Content-Type") or ""
        match = re.search(r"charset=([\w.-]+)", content_type, re.I)
        if match:
            charset = match.group(1)
        return current, data.decode(charset, "replace")
    raise UserError("短链跳转次数过多")


def _content_size(headers, body_len: int) -> int | None:
    content_range = headers.get("Content-Range") or ""
    if "/" in content_range:
        total = content_range.rsplit("/", 1)[-1]
        if total.isdigit():
            return int(total)
    if headers.get("Content-Length") and headers.get("Content-Length").isdigit():
        # 带 Range 时 Content-Length 只是这一小段
        if not content_range:
            return int(headers.get("Content-Length"))
    return body_len or None


def probe(url: str, depth: int = 0) -> dict | None:
    """确认地址能返回视频/图片，并挑一个不被 CDN 拒绝的 Referer。"""
    if depth > 3:
        return None
    check_url(url, FILE_SUFFIXES)
    attempts = ({"Referer": XHS_REFERER}, {})
    for extra in attempts:
        headers = _base_headers()
        headers.update(extra)
        headers["Range"] = "bytes=0-31"
        try:
            status, resp_headers, body_obj = _request(url, headers, 20)
        except urllib.error.URLError:
            continue
        try:
            if status in (301, 302, 303, 307, 308):
                location = resp_headers.get("Location")
                if not location:
                    continue
                return probe(urllib.parse.urljoin(url, location), depth + 1)
            if status not in (200, 206):
                continue
            header = body_obj.read(32)
        finally:
            body_obj.close()
        content_type = (resp_headers.get("Content-Type") or "").lower()
        if "text/html" in content_type or "application/json" in content_type:
            continue
        ext, mime = media_kind(header)
        size = _content_size(resp_headers, len(header))
        if not ext and not (size and size > 50_000 and "text/" not in content_type):
            continue
        if not ext:
            ext, mime = "mp4", "video/mp4"
        return {
            "url": url,
            "size": size,
            "ext": ext,
            "mime": mime,
            "use_referer": "Referer" in extra,
        }
    return None


def first_working(urls: list[str]) -> dict | None:
    seen: set[str] = set()
    for url in urls:
        if not url or url in seen:
            continue
        seen.add(url)
        try:
            check_url(url, FILE_SUFFIXES)
        except UserError:
            continue
        hit = probe(url)
        if hit:
            return hit
    return None


def human_size(size: int | None) -> str:
    if not size:
        return "未知大小"
    if size < 1024:
        return f"{size} B"
    if size < 1024 * 1024:
        return f"{size / 1024:.1f} KB"
    return f"{size / 1024 / 1024:.1f} MB"


def download_file(hit: dict, dest: Path, depth: int = 0) -> int:
    if depth > 4:
        raise UserError("下载地址跳转过多")
    headers = _base_headers()
    if hit.get("use_referer"):
        headers["Referer"] = XHS_REFERER
    status, resp_headers, body_obj = _request(hit["url"], headers, 60)
    try:
        if status in (301, 302, 303, 307, 308):
            location = resp_headers.get("Location")
            body_obj.close()
            if not location:
                raise UserError("下载地址跳转失败")
            nxt = dict(hit)
            nxt["url"] = urllib.parse.urljoin(hit["url"], location)
            check_url(nxt["url"], FILE_SUFFIXES)
            return download_file(nxt, dest, depth + 1)
        if status != 200:
            raise UserError(f"下载失败（HTTP {status}）")
        total_text = resp_headers.get("Content-Length") or ""
        total = int(total_text) if total_text.isdigit() else hit.get("size")
        dest.parent.mkdir(parents=True, exist_ok=True)
        temp = dest.with_suffix(dest.suffix + ".part")
        read = 0
        next_pct = 10
        try:
            with temp.open("wb") as handle:
                while True:
                    chunk = body_obj.read(256 * 1024)
                    if not chunk:
                        break
                    handle.write(chunk)
                    read += len(chunk)
                    if total and read * 100 >= total * next_pct:
                        print(f"  {min(next_pct, 100)}%", flush=True)
                        next_pct += 10
            header = temp.read_bytes()[:16]
            if b"ftyp" not in header and not media_kind(header)[0]:
                raise UserError("下载到的内容不是视频或图片")
            temp.replace(dest)
        except Exception:
            temp.unlink(missing_ok=True)
            raise
        return read
    finally:
        try:
            body_obj.close()
        except Exception:
            pass


def unique_path(directory: Path, filename: str) -> Path:
    candidate = directory / filename
    if not candidate.exists():
        return candidate
    stem = Path(filename).stem
    suffix = Path(filename).suffix
    for index in range(2, 100):
        alt = directory / f"{stem}_{index}{suffix}"
        if not alt.exists():
            return alt
    raise UserError("同名文件太多，请换一个输出目录")


def resolve_note(text: str) -> dict:
    page_url = extract_url(text)
    final_url, html = fetch_html(page_url)
    state = parse_initial_state(html)
    note = note_from_state(state)
    author = author_of(note)
    title = display_title(note)
    images = image_urls(note)
    key = origin_key(note)
    video = None
    video_via = ""
    if key:
        video = first_working(origin_urls(key))
        video_via = "origin"
    if video is None:
        fallback = first_working(stream_urls(note))
        if fallback:
            video = fallback
            video_via = "stream"
    return {
        "page_url": final_url,
        "note_id": note.get("noteId") if isinstance(note.get("noteId"), str) else "",
        "author": author,
        "title": title,
        "desc": note.get("desc") if isinstance(note.get("desc"), str) else "",
        "images": images,
        "cover": images[0] if images else "",
        "origin_key": key,
        "video": video,
        "video_via": video_via,
    }


def run(text: str, output: Path, with_images: bool) -> list[Path]:
    print("正在解析链接…", flush=True)
    info = resolve_note(text)
    who = info["author"] or "未知作者"
    print(f"笔记：{who} · {info['title']}", flush=True)
    saved: list[Path] = []
    output.mkdir(parents=True, exist_ok=True)

    video = info["video"]
    if video:
        if info["video_via"] != "origin":
            print("没有拿到无水印原片，改用笔记里的转码地址。", flush=True)
        else:
            host = urllib.parse.urlparse(video["url"]).hostname or ""
            print(f"无水印原片：{host}（{human_size(video.get('size'))}）", flush=True)
        filename = build_filename(info["author"], info["title"], video["ext"])
        dest = unique_path(output, filename)
        print(f"正在下载 {dest.name} …", flush=True)
        size = download_file(video, dest)
        print(f"已保存：{dest}（{human_size(size)}）", flush=True)
        saved.append(dest)
    elif info["origin_key"]:
        raise UserError("找到了原片字段，但所有 CDN 地址都无法下载")

    need_images = with_images or not video
    if need_images and info["images"]:
        if video:
            print("同时保存图片…", flush=True)
        else:
            print("这是图片笔记，开始保存图片…", flush=True)
        stem = Path(build_filename(info["author"], info["title"], "jpg")).stem
        for index, url in enumerate(info["images"], 1):
            hit = probe(url)
            if not hit:
                print(f"图片 {index} 下载失败，已跳过。", flush=True)
                continue
            ext = hit["ext"] if hit["ext"] in {"jpg", "png", "webp", "gif"} else "jpg"
            dest = unique_path(output, f"{stem}_{index}.{ext}")
            size = download_file(hit, dest)
            print(f"已保存：{dest}（{human_size(size)}）", flush=True)
            saved.append(dest)

    if not saved:
        raise UserError("笔记里没有可下载的视频或图片")
    return saved


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="xhs_dl.py",
        description="从小红书分享文案或链接下载无水印视频。图片笔记会保存图片。",
    )
    parser.add_argument("text", help="整段分享文案，或笔记/短链 URL")
    parser.add_argument("-o", "--output", default=".", help="保存目录，默认当前目录")
    parser.add_argument("--with-images", action="store_true", help="视频笔记也一并保存图片")
    args = parser.parse_args(argv)
    try:
        run(args.text, Path(args.output).expanduser().resolve(), args.with_images)
    except UserError as exc:
        print(f"失败：{exc}", file=sys.stderr)
        return 1
    except urllib.error.URLError as exc:
        print(f"失败：网络错误：{exc.reason}", file=sys.stderr)
        return 2
    except KeyboardInterrupt:
        print("\n已取消", file=sys.stderr)
        return 130
    return 0


if __name__ == "__main__":
    sys.exit(main())
