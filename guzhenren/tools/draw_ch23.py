from PIL import Image, ImageDraw
import json, base64, os

def L(p): return Image.open(p).convert('RGBA')
def remap(im, m):
    im = im.copy(); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a and (r, g, b) in m: px[x, y] = m[(r, g, b)] + (a,)
    return im
def keyout(cell):
    cell = cell.copy(); px = cell.load(); bg = px[0, 0]
    for y in range(cell.height):
        for x in range(cell.width):
            if px[x, y][:3] == bg[:3]: px[x, y] = (0, 0, 0, 0)
    return cell
def tint(im, fn):
    im = im.copy(); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a: px[x, y] = fn(r, g, b) + (a,)
    return im
def grid_to_img(rows, pal):
    h, w = len(rows), len(rows[0])
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    px = im.load()
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            px[x, y] = pal[ch]
    return im

# ---- 1. Legacy Bai Ningbing pixels. The frames actually pasted for 白凝冰
# (walk, battle, portrait) are replaced below by tools/draw_bnb.py.
# PB is kept only as the base of the 白家蛊师 portrait (face_bnb_boy). ----
PAL_BNB = {
    '.': (0, 0, 0, 0),
    'K': (14, 18, 32, 255),      # cool dark outline
    'W': (246, 249, 255, 255),   # snow-white hair / outer robe
    'w': (210, 224, 244, 255),   # ice-tinted hair / robe shadow
    'I': (138, 210, 248, 255),   # ice-blue sash / eyes / trim
    'i': (72, 146, 212, 255),    # deeper ice blue
    'S': (248, 240, 238, 255),   # fair skin
    's': (216, 200, 202, 255),   # skin shadow
    'E': (48, 128, 206, 255),    # icy blue eyes
}
BNB_GIRL_ROWS = [
    "....KKKKKKKK....",
    "...KWWWWWWWWK...",
    "..KWWwWWWWwWWK..",
    "..KWWwSSSSwWWK..",
    "..KWWSSSSSSWWK..",
    "..KWSEESSSEESK..",
    "..KWWsSSSSsWWK..",
    "..KWWKiSSiKWWK..",
    "..KWWKWWWWKWWK..",
    ".KWWKWWIIWWKWWK.",
    ".KWWKWWWWWWKWWK.",
    ".KWwKWWiiWWKwWK.",
    ".KwWKWWwwWWKWwK.",
    ".KwWKWWwwWWKWwK.",
    "..KKKiK..KiKKK..",
    "....KKK..KKK....",
]
bnb_girl_16 = grid_to_img(BNB_GIRL_ROWS, PAL_BNB)

# ---- Bai Ningbing (White-haired girl in white) 32x32 battle boss sprite ----
BNB32 = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
bd = ImageDraw.Draw(BNB32)
OUT = (14, 18, 32, 255)
WH = (246, 249, 255, 255)
WHS = (205, 220, 242, 255)
WH2 = (166, 188, 220, 255)
ICE = (128, 216, 252, 255)
ICE_D = (58, 134, 208, 255)
SK = (248, 240, 238, 255)
SKS = (214, 198, 202, 255)

# Flowing white hair behind
bd.polygon([(8, 5), (23, 5), (27, 29), (4, 29)], fill=WHS, outline=OUT)
bd.line([(7, 14), (6, 27)], fill=WH)
bd.line([(24, 14), (25, 27)], fill=WH)
# Flowing white sleeves & wide dress
bd.polygon([(9, 16), (22, 16), (28, 30), (3, 30)], fill=WH, outline=OUT)
bd.polygon([(3, 30), (9, 17), (12, 17), (9, 30)], fill=WHS)
bd.polygon([(22, 17), (28, 30), (22, 30), (20, 17)], fill=WHS)
# Ice-blue waist sash & ribbons
bd.rectangle([12, 21, 19, 23], fill=ICE_D, outline=OUT)
bd.line([(13, 24), (11, 30)], fill=ICE)
bd.line([(18, 24), (20, 30)], fill=ICE)
# White collar V
bd.polygon([(12, 15), (19, 15), (16, 21)], fill=WHS, outline=OUT)
bd.polygon([(13, 15), (18, 15), (16, 19)], fill=SK)
# Head & hair bangs
bd.polygon([(11, 6), (20, 6), (21, 12), (17, 15), (14, 15), (10, 12)], fill=SK, outline=OUT)
# Ice blue eyes
bd.rectangle([12, 10, 14, 11], fill=ICE_D)
bd.point((12, 10), fill=ICE)
bd.rectangle([17, 10, 19, 11], fill=ICE_D)
bd.point((19, 10), fill=ICE)
# Hair crown & side bangs
bd.polygon([(9, 10), (10, 4), (15, 2), (17, 2), (21, 4), (22, 10), (19, 7), (16, 8), (12, 7)], fill=WH, outline=OUT)
bd.line([(10, 8), (9, 22)], fill=WH, width=2)
bd.line([(21, 8), (22, 22)], fill=WH, width=2)
bd.line([(9, 8), (9, 21)], fill=OUT)
bd.line([(22, 8), (22, 21)], fill=OUT)
# Ice crystal aura / frost blade on right hand
bd.line([(24, 18), (29, 11)], fill=ICE, width=2)
bd.point((30, 10), fill=WH)

# ---- 2. Bai Ningbing (White-haired girl) 48x48 Portrait ----
PB = Image.new('RGBA', (48, 48), (16, 24, 42, 255))
pd = ImageDraw.Draw(PB)
for y in range(48):
    c = int(18 + (y / 48) * 16)
    pd.line([(0, y), (47, y)], fill=(c, c + 12, c + 28, 255))
pd.ellipse([8, 2, 39, 32], fill=(32, 52, 82, 255))

# Flowing snow-white back hair
pd.polygon([(10, 10), (37, 10), (43, 47), (4, 47)], fill=WHS, outline=OUT)
for x in (8, 11, 36, 39):
    pd.line([(x, 18), (x, 46)], fill=WH)

# White robes & ice-blue trim
pd.polygon([(9, 31), (38, 31), (46, 47), (1, 47)], fill=WH, outline=OUT)
pd.polygon([(14, 31), (33, 31), (24, 45)], fill=WHS, outline=OUT)
pd.polygon([(17, 31), (30, 31), (24, 41)], fill=SK)
pd.line([(15, 32), (24, 45)], fill=ICE, width=2)
pd.line([(32, 32), (24, 45)], fill=ICE, width=2)
# Ice-blue neck ribbon
pd.rectangle([20, 29, 27, 31], fill=ICE_D, outline=OUT)
# Neck
pd.rectangle([21, 26, 26, 31], fill=SKS)
# Face
pd.polygon([(16, 9), (31, 9), (32, 20), (28, 25), (24, 27), (23, 27), (19, 25), (15, 20)], fill=SK, outline=OUT)
pd.line([(19, 24), (24, 26), (28, 24)], fill=SKS)
# Cold proud ice-blue eyes
pd.line([(17, 15), (21, 16)], fill=WH2)
pd.line([(17, 17), (21, 17)], fill=OUT)
pd.rectangle([18, 18, 20, 19], fill=ICE_D)
pd.point((18, 18), fill=ICE)
pd.line([(26, 16), (30, 15)], fill=WH2)
pd.line([(26, 17), (30, 17)], fill=OUT)
pd.rectangle([27, 18, 29, 19], fill=ICE_D)
pd.point((29, 18), fill=ICE)
# Slight aloof smirk/mouth
pd.line([(22, 23), (25, 23)], fill=(180, 140, 145, 255))
# White crown & bangs & long side locks
pd.polygon([(14, 14), (14, 7), (19, 4), (28, 4), (33, 7), (33, 14), (30, 11), (26, 9), (24, 13), (22, 9), (17, 11)], fill=WH, outline=OUT)
pd.line([(17, 6), (22, 6)], fill=WHS)
pd.line([(26, 6), (30, 6)], fill=WHS)
pd.polygon([(12, 11), (16, 11), (15, 42), (11, 41)], fill=WH, outline=OUT)
pd.polygon([(31, 11), (35, 11), (36, 41), (32, 42)], fill=WH, outline=OUT)
pd.line([(14, 16), (14, 38)], fill=WHS)
pd.line([(33, 16), (33, 38)], fill=WHS)

# ---- 3. Bai Ningbing (boy form in ch2) 16x16 & 38x38 ----
BNB_BOY_ROWS = [
    "....KKKKKKKK....",
    "...KWWWWWWWWK...",
    "..KWWwWWWWwWWK..",
    "..KWWwSSSSwWWK..",
    "..KWWSSSSSSWWK..",
    "..KWSEESSSEESK..",
    "..KWWsSSSSsWWK..",
    "..KWWKsSSsKWWK..",
    "..KWWKIIIIKWWK..",
    ".KWKWWWWWWWWKWK.",
    ".KWKWWIIIIWWKWK.",
    ".KWKWWWWWWWWKWK.",
    "..KKWWWWWWWWKK..",
    "...KKWWwwWWKK...",
    "...KiiK..KiiK...",
    "...KKKK..KKKK...",
]
bnb_boy_16 = grid_to_img(BNB_BOY_ROWS, PAL_BNB)

PB_BOY = PB.copy()
pbd = ImageDraw.Draw(PB_BOY)
# Shorten side hair locks and widen shoulders slightly for boy form
pbd.rectangle([0, 31, 47, 47], fill=(18, 28, 48, 255))
pbd.polygon([(8, 31), (39, 31), (46, 47), (1, 47)], fill=WH, outline=OUT)
pbd.polygon([(15, 31), (32, 31), (24, 44)], fill=WHS, outline=OUT)
pbd.rectangle([19, 31, 28, 47], fill=ICE_D, outline=OUT)
pbd.polygon([(12, 11), (16, 11), (15, 29), (12, 28)], fill=WH, outline=OUT)
pbd.polygon([(31, 11), (35, 11), (35, 28), (32, 29)], fill=WH, outline=OUT)
PB_BOY_38 = PB_BOY.resize((38, 38), Image.NEAREST)

# ---- 4. Gu Yue First Gen Ancestor (Zombie Blood Ancestor) 32x32 + 48x48 ----
ANC32 = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
ad = ImageDraw.Draw(ANC32)
AK = (14, 6, 12, 255)
BLD = (176, 28, 46, 255)
BLD_D = (104, 16, 30, 255)
BLD_B = (238, 66, 82, 255)
ZM = (142, 152, 148, 255)
ZMS = (96, 104, 102, 255)
# Crimson blood bat wings / blood aura behind
ad.polygon([(1, 10), (11, 15), (10, 24), (2, 20)], fill=BLD_D, outline=AK)
ad.polygon([(30, 10), (20, 15), (21, 24), (29, 20)], fill=BLD_D, outline=AK)
ad.line([(2, 12), (9, 17)], fill=BLD_B)
ad.line([(29, 12), (22, 17)], fill=BLD_B)
# Blood robe body
ad.polygon([(9, 15), (22, 15), (25, 30), (6, 30)], fill=BLD, outline=AK)
ad.polygon([(13, 16), (18, 16), (20, 30), (11, 30)], fill=BLD_D)
# Zombie face + wild crimson hair
ad.polygon([(11, 5), (20, 5), (21, 13), (17, 16), (14, 16), (10, 13)], fill=ZM, outline=AK)
ad.polygon([(9, 10), (10, 3), (16, 1), (21, 3), (22, 10), (18, 6), (13, 6)], fill=BLD_B, outline=AK)
# Glowing red eyes + fangs
ad.rectangle([12, 9, 14, 10], fill=(255, 220, 90, 255))
ad.rectangle([17, 9, 19, 10], fill=(255, 220, 90, 255))
ad.line([(13, 13), (18, 13)], fill=AK)
ad.point((14, 14), fill=(245, 245, 245, 255))
ad.point((17, 14), fill=(245, 245, 245, 255))
# Blood orb in hand
ad.ellipse([21, 18, 27, 24], fill=BLD_B, outline=AK)
ad.point((23, 20), fill=(255, 205, 117, 255))

PA = Image.new('RGBA', (48, 48), (28, 10, 16, 255))
pad = ImageDraw.Draw(PA)
for y in range(48):
    pad.line([(0, y), (47, y)], fill=(30 + y // 2, 10, 18, 255))
pad.polygon([(11, 12), (36, 12), (40, 34), (7, 34)], fill=BLD_D, outline=AK)
pad.polygon([(7, 31), (40, 31), (46, 47), (1, 47)], fill=BLD, outline=AK)
pad.polygon([(15, 31), (32, 31), (24, 46)], fill=BLD_D, outline=AK)
pad.rectangle([20, 26, 27, 32], fill=ZMS, outline=AK)
pad.polygon([(16, 10), (31, 10), (32, 22), (24, 28), (15, 22)], fill=ZM, outline=AK)
pad.polygon([(12, 18), (11, 7), (17, 3), (24, 5), (30, 3), (36, 7), (35, 18), (31, 11), (24, 13), (16, 11)], fill=BLD_B, outline=AK)
pad.polygon([(11, 15), (15, 15), (14, 30), (9, 28)], fill=BLD_B, outline=AK)
pad.polygon([(32, 15), (36, 15), (38, 28), (33, 30)], fill=BLD_B, outline=AK)
pad.rectangle([18, 17, 21, 19], fill=(255, 210, 70, 255))
pad.rectangle([26, 17, 29, 19], fill=(255, 210, 70, 255))
pad.line([(20, 23), (27, 23)], fill=AK)
pad.point((21, 24), fill=(245, 245, 245, 255))
pad.point((26, 24), fill=(245, 245, 245, 255))

# ---- 5. Xiong Jiao (Bear Clan) 16x16 + 38x38, Bai Clan Guard 16x16 ----
PAL_XJ = {
    '.': (0, 0, 0, 0), 'K': (18, 12, 10, 255), 'H': (74, 42, 26, 255), 'S': (236, 182, 138, 255),
    's': (194, 136, 94, 255), 'E': (20, 14, 14, 255), 'B': (146, 86, 44, 255), 'b': (96, 54, 28, 255),
    'Y': (230, 176, 72, 255),
}
XJ_ROWS = [
    "....KKKKKKKK....",
    "...KHHHHHHHHK...",
    "..KHHHHHHHHHHK..",
    "..KHHKSSSSKHHK..",
    "..KHHSSSSSSHHK..",
    "..KHSEESSEESHK..",
    "..KHSsSSSSsSHK..",
    "..KHHKsSSsKHHK..",
    "..KBBKYYYYKBBK..",
    ".KBBBYBBBBYBBBK.",
    ".KBBBBBBBBBBBBK.",
    ".KBbKBbYYbBKbBK.",
    "..KbKBBBBBBKbK..",
    "...KKbBBBBbKK...",
    "...KbbK..KbbK...",
    "...KKKK..KKKK...",
]
xj_16 = grid_to_img(XJ_ROWS, PAL_XJ)

# Giant armored bear enemy (32x32)
BEAR32 = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
brd = ImageDraw.Draw(BEAR32)
BK = (16, 12, 10, 255)
BR = (118, 70, 42, 255)
BR_D = (74, 42, 24, 255)
BR_L = (162, 106, 68, 255)
brd.ellipse([6, 4, 12, 10], fill=BR, outline=BK)
brd.ellipse([19, 4, 25, 10], fill=BR, outline=BK)
brd.ellipse([4, 11, 27, 29], fill=BR_D, outline=BK)
brd.ellipse([6, 6, 25, 22], fill=BR, outline=BK)
brd.ellipse([10, 13, 21, 20], fill=BR_L, outline=BK)
brd.rectangle([11, 10, 13, 12], fill=(245, 70, 60, 255))
brd.rectangle([18, 10, 20, 12], fill=(245, 70, 60, 255))
brd.rectangle([14, 14, 17, 16], fill=BK)
brd.rectangle([7, 24, 12, 30], fill=BR_D, outline=BK)
brd.rectangle([19, 24, 24, 30], fill=BR_D, outline=BK)

# Blood Bat (16x16)
PAL_BAT = {
    '.': (0, 0, 0, 0), 'K': (18, 8, 14, 255), 'R': (194, 36, 56, 255), 'r': (122, 20, 36, 255),
    'Y': (255, 218, 88, 255),
}
BAT_ROWS = [
    "................",
    "................",
    "..KK........KK..",
    ".KrrK..KK..KrrK.",
    "KrrrrKKRRKKrrrrK",
    "KrrRrrrrrrrrRrrK",
    "KrRrrRYRRYRrrRrK",
    ".KrrKRRRRRRKrrK.",
    "..KK.KRRRRK.KK..",
    ".....KRrrRK.....",
    "......KrrK......",
    ".......KK.......",
    "................",
    "................",
    "................",
    "................",
]
bat_16 = grid_to_img(BAT_ROWS, PAL_BAT)

# ---- Rebuild full atlas (352 x 360) ----
A = Image.new('RGBA', (352, 360), (0, 0, 0, 0))
rects = {}

hero = L('fangyuan_walk.png')
A.paste(hero, (0, 0))
rects['hero'] = [0, 0, 64, 64]

npcs = [('fangzheng', 25), ('elder', 9), ('chief', 10), ('uncle', 13), ('aunt', 5), ('merchant', 14), ('mobei', 2), ('chicheng', 6)]
for k, (n, i) in enumerate(npcs):
    sh = L(f'sp/characters_{i}.png')
    if n == 'fangzheng':
        sh = remap(sh, {(30, 146, 57): (60, 110, 220), (20, 83, 91): (30, 50, 140)})
    A.paste(sh.crop((0, 0, 16, 16)), (64 + k * 16, 0))
    A.paste(sh.crop((0, 32, 16, 48)), (64 + k * 16, 16))
    rects[n] = [64 + k * 16, 0, 16, 16]

# Extra NPCs in row y=32..64
sh_bai = remap(L('sp/characters_18.png'), {(101, 121, 111): (220, 232, 246), (143, 171, 180): (245, 250, 255)})
A.paste(sh_bai.crop((0, 0, 16, 16)), (64, 32))
A.paste(sh_bai.crop((0, 32, 16, 48)), (64, 48))
rects['bai_guard'] = [64, 32, 16, 16]

A.paste(xj_16, (80, 32)); A.paste(xj_16, (80, 48)); rects['xiongjiao'] = [80, 32, 16, 16]
A.paste(bnb_boy_16, (96, 32)); A.paste(bnb_boy_16, (96, 48)); rects['bnb_boy'] = [96, 32, 16, 16]
# Bai Ningbing's own frames (map walk, not the guard) come from draw_bnb.py.
import sys as _sys
_sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from draw_bnb import walk_frames as _bnb_walk, battle_32 as _bnb_battle, portrait_48 as _bnb_face
_w0, _w1 = _bnb_walk()
A.paste(_w0, (112, 32)); A.paste(_w1, (112, 48)); rects['bnb_girl'] = [112, 32, 16, 16]
A.paste(bat_16, (128, 32)); A.paste(bat_16, (128, 48)); rects['bloodbat'] = [128, 32, 16, 16]

# Faces row y=96 (38x38)
for k, (n, i) in enumerate([('hero', 3)] + npcs):
    if n == 'hero': continue
    f = L(f'sp/face_{i}.png')
    if n == 'fangzheng': f = remap(f, {(30, 146, 57): (60, 110, 220), (20, 83, 91): (30, 50, 140)})
    A.paste(f, (k * 38, 96)); rects['face_' + n] = [k * 38, 96, 38, 38]

# Xiong Jiao face (uses character 12 face recolored/cropped)
fxj = L('sp/face_12.png')
A.paste(fxj, (0, 96)); rects['face_xiongjiao'] = [0, 96, 38, 38]
A.paste(PB_BOY_38, (208, 0)); rects['face_bnb_boy'] = [208, 0, 38, 38]

# 48x48 portraits at y=134..182
A.paste(L('fangyuan_portrait.png'), (192, 134)); rects['face_hero'] = [192, 134, 48, 48]
A.paste(_bnb_face(), (242, 134)); rects['face_bnb_girl'] = [242, 134, 48, 48]
A.paste(PA, (292, 134)); rects['face_ancestor'] = [292, 134, 48, 48]

# Wolves
W = L('wolfpack.png')
def wolf_frames(bx, by):
    return [keyout(W.crop((bx + c * 32, by, bx + c * 32 + 32, by + 32))) for c in range(4)]
def elec(r, g, b):
    l = (r + g + b) / 3
    if l > 200: return (240, 240, 240)
    if l < 20: return (10, 12, 30)
    t = l / 140
    return (int(40 + 60 * t), int(70 + 110 * t), int(150 + 105 * min(1, t)))
def pale(r, g, b):
    l = (r + g + b) / 3
    if l < 40: return (20, 24, 48)
    t = l / 255
    return (int(110 + 90 * t), int(150 + 90 * t), int(200 + 55 * t))
def bossc(r, g, b):
    l = (r + g + b) / 3
    if l > 150: return (255, 220, 90)
    t = l / 90
    return (int(30 + 50 * t), int(20 + 30 * t), int(70 + 80 * t))
def icew(r, g, b):
    l = (r + g + b) / 3
    if l < 40: return (26, 48, 86)
    t = l / 255
    return (int(150 + 100 * t), int(218 + 37 * t), 255)

sets = [('wolf', 128, 0, elec), ('bigwolf', 128, 128, pale), ('boss', 0, 128, bossc)]
for row, (n, bx, by, fn) in enumerate(sets):
    for c, fr in enumerate(wolf_frames(bx, by)):
        fr = tint(fr, fn)
        bb = fr.getbbox()
        if n == 'wolf':
            px = fr.load()
            for x in range(bb[0] + 8, bb[2] - 4, 5):
                for y in range(bb[1], bb[3]):
                    if px[x, y][3]: px[x, y - 1] = (115, 239, 247, 255); break
        if n == 'boss':
            px = fr.load()
            hx = bb[0] + 3
            hy = next(y for y in range(32) if any(px[x, y][3] for x in range(bb[0], bb[0] + 8)))
            for dx, dy in [(0,2),(1,1),(2,0),(2,1),(2,2),(3,2),(4,1),(4,2),(5,0),(5,1),(5,2),(6,2),(7,1),(1,3),(2,3),(3,3),(4,3),(5,3),(6,3)]:
                x, y = hx + dx - 1, hy - 4 + dy
                if 0 <= x < 32 and 0 <= y < 32: px[x, y] = (255, 205, 60, 255)
        A.paste(fr, (c * 32, 134 + row * 32))
    rects[n] = [0, 134 + row * 32, 32, 32]

def outline(box, col):
    x0, y0, x1, y1 = box
    reg = A.crop(box); px = reg.load(); w, h = reg.size
    out = reg.copy(); op = out.load()
    for y in range(h):
        for x in range(w):
            if px[x, y][3] == 0:
                for dx, dy in ((1,0), (-1,0), (0,1), (0,-1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] > 0:
                        op[x, y] = col; break
    A.paste(out, (x0, y0))

outline((0, 134, 128, 166), (16, 20, 48, 255))
outline((0, 166, 128, 198), (30, 40, 80, 255))
outline((0, 198, 128, 230), (10, 6, 20, 255))

# Boar
pig = L('na/pig.png')
boar = tint(pig, lambda r, g, b: (10, 8, 8) if (r + g + b) < 60 else (int(r * 0.55), int(g * 0.38), int(b * 0.28)))
A.paste(boar, (128, 134)); rects['boar'] = [128, 134, 16, 16]

# Houses at y=230..277
T = L('sp/background-elements_tileset.png')
for k, n in enumerate(['house_thatch', 'house_plaster', 'house_thatch2', 'house_red']):
    A.paste(T.crop((k * 64, 0, k * 64 + 64, 47)), (k * 64, 230))
    rects[n] = [k * 64, 230, 64, 47]

# Row y=280..312: 32x32 sprites for Bear, Icewolf (1st frame), Ancestor, BNB Girl (battle 32x32)
A.paste(BEAR32, (0, 280)); rects['bear_e'] = [0, 280, 32, 32]
iw0 = tint(wolf_frames(128, 128)[0], icew)
A.paste(iw0, (32, 280)); outline((32, 280, 64, 312), (24, 52, 92, 255)); rects['icewolf'] = [32, 280, 32, 32]
A.paste(ANC32, (64, 280)); rects['ancestor'] = [64, 280, 32, 32]
A.paste(_bnb_battle(), (96, 280)); rects['bnb_girl32'] = [96, 280, 32, 32]

A.save('atlas.png', optimize=True)
json.dump(rects, open('rects.json', 'w'))
open('atlas.b64', 'w').write(base64.b64encode(open('atlas.png', 'rb').read()).decode())
print("atlas.png:", os.path.getsize('atlas.png'), "b64:", os.path.getsize('atlas.b64'))

# Preview sheet for Ch2/3 characters & monsters
prev = Image.new('RGBA', (560, 280), (26, 32, 46, 255))
pd = ImageDraw.Draw(prev)
for y in range(0, 280, 16):
    for x in range(0, 560, 16):
        c = (34, 42, 60, 255) if ((x // 16 + y // 16) % 2 == 0) else (28, 36, 52, 255)
        pd.rectangle([x, y, x + 15, y + 15], fill=c)
p_bnb = PB.resize((144, 144), Image.NEAREST); prev.paste(p_bnb, (16, 30), p_bnb)
pd.text((16, 12), "Bai Ningbing (Girl) 48x48", fill=(235, 240, 255))
p_anc = PA.resize((144, 144), Image.NEAREST); prev.paste(p_anc, (180, 30), p_anc)
pd.text((180, 12), "Gu Yue 1st Gen 48x48", fill=(235, 240, 255))
b_bnb = BNB32.resize((96, 96), Image.NEAREST); prev.paste(b_bnb, (344, 30), b_bnb)
b_anc = ANC32.resize((96, 96), Image.NEAREST); prev.paste(b_anc, (448, 30), b_anc)
b_bear = BEAR32.resize((64, 64), Image.NEAREST); prev.paste(b_bear, (16, 194), b_bear)
b_iw = A.crop((32, 280, 64, 312)).resize((64, 64), Image.NEAREST); prev.paste(b_iw, (96, 194), b_iw)
for k, sp in enumerate([bnb_girl_16, bnb_boy_16, xj_16, bat_16]):
    s3 = sp.resize((48, 48), Image.NEAREST); prev.paste(s3, (180 + k * 60, 202), s3)
prev.save('/workspace/guzhenren-assets/ch23_preview.png')
