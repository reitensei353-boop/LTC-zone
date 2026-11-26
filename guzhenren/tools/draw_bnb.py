"""Redraw Bai Ningbing to match the silver-hair, teal-trim reference.

Patches the existing atlas in place. Map walk frames stay 16x16 (two steps),
the battle figure stays 32x32, and the dialogue bust stays 48x48.
白家蛊师 still uses the separate bnb_boy slots; those are not touched.
"""
from PIL import Image, ImageDraw
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# Cool outline, silver hair, pale skin, ice eyes, white robe, #7fb8b0 trim, dark cuff.
PAL = {
    ".": (0, 0, 0, 0),
    "K": (16, 20, 32, 255),
    "H": (232, 236, 242, 255),
    "h": (186, 196, 210, 255),
    "S": (244, 234, 228, 255),
    "s": (214, 196, 194, 255),
    "E": (64, 168, 186, 255),
    "e": (24, 88, 108, 255),
    "W": (246, 248, 250, 255),
    "w": (206, 214, 220, 255),
    "T": (127, 184, 176, 255),
    "t": (72, 132, 126, 255),
    "C": (36, 40, 52, 255),
}


def grid_to_img(rows):
    h, w = len(rows), len(rows[0])
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    px = im.load()
    for y, row in enumerate(rows):
        if len(row) != w:
            raise ValueError("row %d width %d != %d: %r" % (y, len(row), w, row))
        for x, ch in enumerate(row):
            px[x, y] = PAL[ch]
    return im


# Front view, same 16px height as Fang Yuan. Silver hair falls past the shoulders,
# a strand crosses the brow, teal cross-collar and belt, dark lining in the cuffs.
# Frame 1 bobs up one pixel and steps, the way the other walk sheets do.
# Side locks use shadowed silver (h) so they stay separate from the white robe.
WALK_0 = [
    "....KKKKKKKK....",
    "...KHHHHHHHHK...",
    "..KHhHHHHhHHHK..",
    "..KHHHKSSKHHHK..",
    "..KHHSSSSSSHHK..",
    "..KHSeEESSEeHK..",
    "..KHSsSSSSsSHK..",
    "..KHHKsTTsKHHK..",
    "..KhKWWWWWWKhK..",
    ".KhWWwWtTwWWWhK.",
    ".KHWWCTtTTtCWHK.",
    ".KhWWKTtTTTKWhK.",
    ".KhWWKWWWWWWKhK.",
    "..KwKWWWWWWKwK..",
    "...KwwK..KwwK...",
    "...KKKK..KKKK...",
]
WALK_1 = [
    "................",
    "....KKKKKKKK....",
    "...KHhHHHHhHHK..",
    "..KHHHKSSKHHHK..",
    "..KHHSSSSSSHHK..",
    "..KHSeEESSEeHK..",
    "..KHSsSSSSsSHK..",
    "..KHHKsTTsKHHK..",
    "..KhKWWWWWWKhK..",
    ".KhWWwWtTwWWWhK.",
    ".KHWWCTtTTtCWhK.",
    ".KhWWKTtTTTKWhK.",
    "..KwKWWWWWWhKw..",
    "...KwwK..KwwK...",
    "...KKKK..KKKK...",
    "................",
]


def walk_frames():
    return grid_to_img(WALK_0), grid_to_img(WALK_1)


def battle_32():
    """32x32 battle figure: androgynous, hair blown to the side, teal trim."""
    im = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    K = PAL["K"]
    H, h = PAL["H"], PAL["h"]
    S, s = PAL["S"], PAL["s"]
    E, e = PAL["E"], PAL["e"]
    W, w = PAL["W"], PAL["w"]
    T, t = PAL["T"], PAL["t"]
    C = PAL["C"]

    # Hair mass blown to the left, several separate strands, down to the hem.
    d.polygon([(4, 10), (14, 6), (16, 14), (8, 18), (2, 16), (1, 28), (5, 30), (9, 20)], fill=h, outline=K)
    d.line([(2, 14), (6, 26)], fill=H)
    d.line([(4, 12), (8, 24)], fill=H)
    d.line([(3, 20), (7, 30)], fill=h)
    d.line([(6, 16), (9, 28)], fill=H)
    d.polygon([(12, 4), (22, 2), (26, 6), (22, 10), (14, 8)], fill=H, outline=K)

    # Straight robe, wide sleeves, narrow hem. Reads as a man in a cross-collar robe.
    d.polygon([(11, 15), (23, 15), (25, 30), (10, 30)], fill=W, outline=K)
    d.polygon([(7, 16), (13, 15), (12, 26), (6, 24)], fill=w, outline=K)
    d.polygon([(21, 15), (27, 17), (28, 25), (22, 23)], fill=w, outline=K)
    d.rectangle([6, 21, 9, 24], fill=C, outline=K)
    d.point((7, 22), fill=W)
    # Teal cross-collar.
    d.line([(14, 16), (17, 22)], fill=T)
    d.line([(21, 16), (18, 22)], fill=T)
    d.line([(15, 17), (17, 21)], fill=t)
    # Wide belt and two hanging ties.
    d.rectangle([12, 22, 22, 25], fill=T, outline=K)
    d.line([(12, 24), (21, 24)], fill=t)
    d.line([(15, 25), (14, 30)], fill=T)
    d.line([(18, 25), (19, 29)], fill=t)
    d.point((14, 30), fill=K)
    d.rectangle([13, 28, 15, 31], fill=w, outline=K)
    d.rectangle([18, 28, 20, 31], fill=w, outline=K)

    # Pale narrow face.
    d.polygon([(14, 7), (22, 7), (23, 13), (20, 16), (15, 16), (13, 12)], fill=S, outline=K)
    d.line([(14, 13), (16, 15)], fill=s)
    d.line([(21, 13), (19, 15)], fill=s)
    d.rectangle([15, 10, 17, 11], fill=e)
    d.point((15, 10), fill=E)
    d.rectangle([19, 10, 21, 11], fill=e)
    d.point((21, 10), fill=E)
    d.line([(15, 9), (17, 9)], fill=K)
    d.line([(19, 9), (21, 9)], fill=K)
    d.line([(17, 14), (19, 14)], fill=s)
    # A strand across the brow, and a long lock beside the cheek.
    d.line([(16, 6), (15, 13)], fill=h)
    d.polygon([(12, 9), (15, 8), (14, 22), (12, 20)], fill=H, outline=K)
    d.line([(13, 10), (13, 20)], fill=h)
    # Crown.
    d.polygon([(13, 9), (15, 3), (20, 2), (24, 5), (22, 9), (18, 7)], fill=H, outline=K)
    d.line([(16, 3), (21, 3)], fill=(255, 255, 255, 255))
    return im


def portrait_48():
    """48x48 bust in the same blocky portrait style as Fang Yuan."""
    im = Image.new("RGBA", (48, 48), (18, 24, 36, 255))
    d = ImageDraw.Draw(im)
    for y in range(48):
        v = int(16 + (y / 48) * 18)
        d.line([(0, y), (47, y)], fill=(v, v + 6, v + 16, 255))
    d.ellipse([14, 2, 40, 30], fill=(28, 40, 58, 255))

    K = (12, 16, 28, 255)
    H = (226, 232, 240, 255)
    HI = (248, 250, 252, 255)
    HS = (168, 180, 196, 255)
    SK = (244, 234, 228, 255)
    SKS = (206, 188, 186, 255)
    EYE = (78, 176, 194, 255)
    EYED = (20, 78, 98, 255)
    ROBE = (242, 246, 248, 255)
    ROBE_SH = (198, 208, 214, 255)
    TEAL = (127, 184, 176, 255)
    TEAL_D = (70, 128, 122, 255)
    CUFF = (32, 36, 48, 255)

    # Hair fills behind the head first, so the dark backdrop never shows as a hole.
    d.polygon([(8, 6), (40, 4), (44, 18), (40, 46), (8, 46), (2, 24), (4, 12)], fill=HS, outline=K)
    d.polygon([(10, 4), (36, 2), (42, 12), (30, 16), (14, 12), (8, 8)], fill=H, outline=K)
    # Strands blown left, the way the reference hair leaves the face.
    for a, b in (
        ((2, 14), (10, 40)), ((4, 12), (12, 44)), ((6, 16), (14, 46)),
        ((3, 22), (8, 42)), ((8, 18), (16, 46)), ((5, 28), (9, 46)),
    ):
        d.line([a, b], fill=HI)
    d.line([(4, 20), (10, 44)], fill=HS)
    d.line([(7, 18), (13, 40)], fill=H)

    # Robe over the lower half. Teal collar and belt sit on top of it.
    d.polygon([(8, 30), (42, 30), (46, 47), (2, 47)], fill=ROBE, outline=K)
    d.polygon([(4, 34), (14, 31), (12, 47), (3, 47)], fill=ROBE_SH)
    d.polygon([(34, 31), (43, 34), (45, 47), (36, 47)], fill=ROBE_SH)
    d.rectangle([4, 38, 11, 43], fill=CUFF, outline=K)
    d.line([(6, 39), (6, 42)], fill=ROBE)
    d.rectangle([22, 27, 29, 33], fill=SKS, outline=K)
    d.line([(20, 31), (25, 40)], fill=TEAL)
    d.line([(32, 31), (27, 40)], fill=TEAL)
    d.line([(21, 32), (25, 39)], fill=TEAL_D)
    d.line([(31, 32), (27, 39)], fill=TEAL_D)
    d.rectangle([14, 40, 36, 44], fill=TEAL, outline=K)
    d.line([(14, 42), (36, 42)], fill=TEAL_D)
    d.line([(20, 44), (18, 47)], fill=TEAL)
    d.line([(26, 44), (28, 47)], fill=TEAL_D)

    # Face, slightly right of center, a few strands crossing it.
    d.polygon([(18, 10), (33, 9), (35, 18), (31, 24), (25, 26), (19, 23), (16, 16)], fill=SK, outline=K)
    d.line([(18, 20), (22, 24)], fill=SKS)
    d.line([(33, 18), (29, 23)], fill=SKS)
    d.line([(20, 14), (24, 15)], fill=HS)
    d.line([(20, 16), (24, 16)], fill=K)
    d.rectangle([21, 16, 23, 18], fill=EYED)
    d.point((21, 16), fill=EYE)
    d.line([(28, 15), (32, 14)], fill=HS)
    d.line([(28, 16), (32, 16)], fill=K)
    d.rectangle([29, 16, 31, 18], fill=EYED)
    d.point((31, 16), fill=EYE)
    d.line([(25, 22), (29, 22)], fill=(160, 132, 132, 255))
    # Strands in front of the face.
    d.line([(22, 8), (19, 20)], fill=HS)
    d.line([(30, 9), (33, 22)], fill=H)
    d.point((20, 16), fill=HI)

    # Crown and the long lock beside the cheek.
    d.polygon([(16, 14), (18, 6), (25, 3), (33, 4), (37, 9), (34, 14), (30, 10), (26, 12), (23, 9), (19, 12)], fill=H, outline=K)
    d.line([(20, 5), (27, 4)], fill=HI)
    d.line([(29, 6), (34, 8)], fill=HI)
    d.polygon([(15, 12), (19, 12), (18, 34), (15, 32)], fill=H, outline=K)
    d.line([(17, 14), (17, 32)], fill=HS)
    return im


def patch_atlas(path=None):
    path = path or os.path.join(ROOT, "atlas.png")
    atlas = Image.open(path).convert("RGBA")
    w0, w1 = walk_frames()
    battle = battle_32()
    face = portrait_48()

    def clear_paste(im, xy):
        x, y = xy
        blank = Image.new("RGBA", im.size, (0, 0, 0, 0))
        atlas.paste(blank, xy)
        atlas.paste(im, xy, im)

    # Map walk: two frames stacked, same slot the game reads for kind "bnb".
    clear_paste(w0, (112, 32))
    clear_paste(w1, (112, 48))
    # Battle figure.
    clear_paste(battle, (96, 280))
    # Dialogue bust.
    clear_paste(face, (242, 134))
    atlas.save(path)
    return w0, w1, battle, face


def write_preview(w0, w1, battle, face, path):
    prev = Image.new("RGBA", (520, 220), (26, 32, 46, 255))
    d = ImageDraw.Draw(prev)
    for y in range(0, 220, 16):
        for x in range(0, 520, 16):
            c = (34, 42, 58, 255) if ((x // 16 + y // 16) % 2 == 0) else (28, 36, 50, 255)
            d.rectangle([x, y, x + 15, y + 15], fill=c)
    prev.paste(w0.resize((64, 64), Image.NEAREST), (16, 36), w0.resize((64, 64), Image.NEAREST))
    prev.paste(w1.resize((64, 64), Image.NEAREST), (88, 36), w1.resize((64, 64), Image.NEAREST))
    b = battle.resize((128, 128), Image.NEAREST)
    prev.paste(b, (170, 36), b)
    f = face.resize((144, 144), Image.NEAREST)
    prev.paste(f, (320, 28), f)
    d.text((16, 12), "walk 0 / 1", fill=(230, 236, 244, 255))
    d.text((170, 12), "battle 32", fill=(230, 236, 244, 255))
    d.text((320, 12), "portrait 48", fill=(230, 236, 244, 255))
    prev.save(path)


if __name__ == "__main__":
    frames = patch_atlas()
    out = "/tmp/bnb_preview.png"
    write_preview(*frames, out)
    print("patched", os.path.join(ROOT, "atlas.png"))
    print("preview", out)
