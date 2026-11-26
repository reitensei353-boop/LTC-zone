"""Four-direction walk cycles from the full-body paintings.

The painting is not cut apart. The legs and sleeves are warped in place:
one foot reaches, the other tucks, the cuffs swing the other way, the body
bobs. Left is the right cycle mirrored. Up is that stride as a dark back
silhouette with the queue drawn down the spine. One shared scale per sheet,
so a long step is not shrunk back to standing.
"""
import math
import os
import sys
import numpy as np
from PIL import Image, ImageDraw

ASSETS = os.path.join(os.path.dirname(__file__), "..", "assets")


def load_trim(name):
    im = Image.open(os.path.join(ASSETS, name + ".webp")).convert("RGBA")
    a = np.asarray(im).astype(np.uint8)
    ys, xs = np.where(a[:, :, 3] > 24)
    crop = a[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1].copy()
    r, g, b = [crop[:, :, i].astype(np.int16) for i in range(3)]
    crop[(g > r + 18) & (g > b + 12), 3] = 0
    return crop


def sample(src, sx, sy):
    h, w = src.shape[:2]
    x0 = np.floor(sx).astype(np.int32)
    y0 = np.floor(sy).astype(np.int32)
    wx = (sx - x0)[..., None].astype(np.float32)
    wy = (sy - y0)[..., None].astype(np.float32)

    def take(x, y):
        ok = (x >= 0) & (x < w) & (y >= 0) & (y < h)
        pix = src[np.clip(y, 0, h - 1), np.clip(x, 0, w - 1)].astype(np.float32)
        pix[~ok] = 0
        return pix

    x1 = x0 + 1
    y1 = y0 + 1
    top = take(x0, y0) * (1 - wx) + take(x1, y0) * wx
    bot = take(x0, y1) * (1 - wx) + take(x1, y1) * wx
    return np.clip(top * (1 - wy) + bot * wy, 0, 255).astype(np.uint8)


def warp(src, frame, facing):
    h, w = src.shape[:2]
    pad_x = int(w * 0.28)
    pad_y = int(h * 0.14)
    H, W = h + pad_y * 2, w + pad_x * 2
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    sx = xx - pad_x
    sy = yy - (pad_y * 0.35)

    stride = math.cos(frame * math.pi / 2)  # 1, 0, -1, 0
    wave = math.sin(frame * math.pi / 2)  # 0, 1, 0, -1
    passing = abs(wave)
    # Passing pose stands a little taller.
    sy = sy + h * 0.016 * passing

    hip = h * 0.60
    mid = w * 0.50
    if facing == "right":
        # Narrower body, so the step reads as a side view of the same painting.
        sx = mid + (sx - mid) / 0.74

    below = sy > hip
    t = np.clip((sy - hip) / (h * 0.40), 0, 1)
    t = t * t * (3 - 2 * t)
    # -1 on the left leg, +1 on the right, 0 on the seam so the robe does not tear.
    side = np.clip((sx - mid) / (w * 0.20), -1, 1)

    if facing == "down":
        # Left foot down on frame 0, right foot down on frame 2.
        drop = -side * stride * (h * 0.085) * t
        spread = side * abs(stride) * (w * 0.055) * t
        # The foot that is swinging through kicks up.
        lift = np.clip(side * wave, 0, 1) * (h * 0.055) * (t ** 1.3)
        drop = drop - lift
        dx, dy = spread, drop
    else:
        # Feet travel forward and back. Screen-right is the way he faces.
        dx = side * stride * (w * 0.16) * t
        dy = -np.clip(side * wave, 0, 1) * (h * 0.05) * t

    arm0, arm1 = h * 0.34, h * 0.62
    arm_t = np.clip((sy - arm0) / (arm1 - arm0), 0, 1)
    outer = np.clip((np.abs(sx - mid) - w * 0.30) / (w * 0.16), 0, 1)
    arm = (sy > arm0) & (sy < arm1)
    # Arms oppose the legs: left cuff drops when the left foot is back.
    arm_dy = np.sign(sx - mid) * stride * (h * 0.045) * arm_t * outer

    sy = np.where(below, sy - dy, sy)
    sx = np.where(below, sx - dx, sx)
    sy = np.where(arm, sy - arm_dy, sy)
    return sample(src, sx, sy)


def to_back(frame):
    h, w = frame.shape[:2]
    al = frame[:, :, 3]
    out = np.zeros_like(frame)
    grad = np.linspace(0.75, 1.05, h, dtype=np.float32)[:, None]
    shade = 22 * grad
    out[:, :, 0] = shade * 0.80
    out[:, :, 1] = shade * 0.86
    out[:, :, 2] = shade
    out[:, :, 3] = al
    ys, xs = np.where(al > 40)
    if len(ys) == 0:
        return out
    top, bot = int(ys.min()), int(ys.max())
    head = ys < top + (bot - top) * 0.16
    cx = float(np.median(xs[head])) if head.any() else w / 2
    y0 = top + int((bot - top) * 0.015)
    y1 = top + int((bot - top) * 0.50)
    pil = Image.fromarray(out, "RGBA")
    draw = ImageDraw.Draw(pil)
    span = max(1, y1 - y0)
    for i, y in enumerate(range(y0, y1, 2)):
        t = (y - y0) / span
        wob = math.sin(i * 0.7) * w * 0.004
        rad = max(2.0, w * 0.022 * (1 - 0.22 * t))
        col = (186, 140, 78, 255) if (i // 3) % 2 == 0 else (222, 176, 102, 255)
        draw.ellipse((cx + wob - rad, y - rad * 0.55, cx + wob + rad, y + rad * 0.55), fill=col)
    rad = max(3.0, w * 0.028)
    draw.ellipse((cx - rad, y1 - rad * 0.8, cx + rad, y1 + rad * 0.8), fill=(132, 40, 34, 255))
    return np.asarray(pil).copy()


def mirror(img):
    return np.ascontiguousarray(img[:, ::-1])


def blit(canvas, layer, dx, dy):
    h, w = canvas.shape[:2]
    lh, lw = layer.shape[:2]
    x0, y0 = int(round(dx)), int(round(dy))
    sx0, sy0 = max(0, -x0), max(0, -y0)
    dx0, dy0 = max(0, x0), max(0, y0)
    tw, th = min(lw - sx0, w - dx0), min(lh - sy0, h - dy0)
    if tw <= 0 or th <= 0:
        return canvas
    over = layer[sy0 : sy0 + th, sx0 : sx0 + tw]
    dst = canvas[dy0 : dy0 + th, dx0 : dx0 + tw]
    a = over[:, :, 3:4].astype(np.float32) / 255.0
    dst[:, :, :3] = np.clip(
        over[:, :, :3].astype(np.float32) * a + dst[:, :, :3].astype(np.float32) * (1 - a), 0, 255
    ).astype(np.uint8)
    da = dst[:, :, 3].astype(np.float32) / 255.0
    dst[:, :, 3] = np.clip((a[:, :, 0] + da * (1 - a[:, :, 0])) * 255, 0, 255).astype(np.uint8)
    return canvas


def add_shadow(cell, foot):
    h, w = cell.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    rx, ry = w * 0.20, max(2.4, h * 0.022)
    m = ((xx - w / 2) / rx) ** 2 + ((yy - foot) / ry) ** 2
    shade = np.clip(1 - m, 0, 1) ** 1.4
    shadow = np.zeros_like(cell)
    shadow[:, :, 3] = (shade * 115).astype(np.uint8)
    a = cell[:, :, 3:4].astype(np.float32) / 255.0
    rgb = cell[:, :, :3].astype(np.float32) * a + shadow[:, :, :3].astype(np.float32) * (1 - a)
    out = cell.copy()
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    ba = shadow[:, :, 3].astype(np.float32) / 255.0
    out[:, :, 3] = np.clip((a[:, :, 0] + ba * (1 - a[:, :, 0])) * 255, 0, 255).astype(np.uint8)
    return out


def pack(frames, cell_w, cell_h):
    mh = max(im.shape[0] for im in frames)
    mw = max(im.shape[1] for im in frames)
    scale = min((cell_w - 2) / mw, (cell_h - 6) / mh)
    cells = []
    for im in frames:
        nw, nh = max(1, int(round(im.shape[1] * scale))), max(1, int(round(im.shape[0] * scale)))
        resized = np.asarray(Image.fromarray(im, "RGBA").resize((nw, nh), Image.Resampling.LANCZOS))
        cell = np.zeros((cell_h, cell_w, 4), np.uint8)
        cell = blit(cell, resized, (cell_w - nw) // 2, (cell_h - nh) // 2 + 1)
        cells.append(cell)
    foot = 0
    for cell in cells:
        ys = np.where(cell[:, :, 3] > 24)[0]
        if len(ys):
            foot = max(foot, int(ys.max()))
    return [add_shadow(cell, foot) for cell in cells]


def build(name):
    src = load_trim(name)
    down = [warp(src, f, "down") for f in range(4)]
    right = [warp(src, f, "right") for f in range(4)]
    cell_w, cell_h = 160, 300
    rows = [
        pack(down, cell_w, cell_h),
        [mirror(c) for c in pack(right, cell_w, cell_h)],
        pack(right, cell_w, cell_h),
        pack([to_back(f) for f in down], cell_w, cell_h),
    ]
    sheet = np.zeros((cell_h * 4, cell_w * 4, 4), np.uint8)
    for r, row in enumerate(rows):
        for c, cell in enumerate(row):
            sheet[r * cell_h : (r + 1) * cell_h, c * cell_w : (c + 1) * cell_w] = cell
    path = os.path.join(ASSETS, "walk_" + name + ".webp")
    Image.fromarray(sheet, "RGBA").save(path, "WEBP", quality=82, method=4)
    print(name, sheet.shape, os.path.getsize(path))
    return sheet


def preview(sheets, names):
    bands = []
    dirs = ["下", "左", "右", "上"]
    for sheet, label in zip(sheets, names):
        im = Image.fromarray(sheet, "RGBA")
        bg = Image.new("RGBA", im.size, (34, 38, 44, 255))
        flat = Image.alpha_composite(bg, im).convert("RGB")
        scale = 960 / flat.width
        flat = flat.resize((960, int(flat.height * scale)), Image.Resampling.NEAREST)
        draw = ImageDraw.Draw(flat)
        rh = flat.height / 4
        for i, d in enumerate(dirs):
            draw.text((8, int(i * rh) + 6), label + " · " + d, fill=(245, 226, 190))
        bands.append(flat)
    canvas = Image.new("RGB", (960, sum(b.height for b in bands) + 8 * len(bands)), (12, 12, 14))
    y = 0
    for b in bands:
        canvas.paste(b, (0, y))
        y += b.height + 8
    out = os.path.join("/tmp", "walk_preview.png")
    canvas.save(out, quality=90)
    print("preview", out, canvas.size)


def main():
    names = sys.argv[1:] or ["wei", "mao", "guan"]
    sheets = [build(n) for n in names]
    preview(sheets, names)


if __name__ == "__main__":
    main()
