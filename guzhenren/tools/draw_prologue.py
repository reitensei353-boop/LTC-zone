from PIL import Image, ImageDraw
import json, base64, os

def L(p): return Image.open(p).convert('RGBA')
def grid_to_img(rows, pal):
    h, w = len(rows), len(rows[0])
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    px = im.load()
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            px[x, y] = pal[ch]
    return im

# ---- 1. Older/Darker Fang Yuan 16x16 4-dir walk sheet (64x64) ----
# Based on same reference: very long straight black hair, pale face, narrow eyes,
# darker charcoal-black demon cloak, deep crimson-tinted scarf/inner sash
C_OLD = {
    '.': (0, 0, 0, 0),
    'K': (8, 6, 12, 255),       # deep black outline
    'H': (16, 16, 24, 255),     # jet-black hair
    'h': (40, 40, 56, 255),     # cool hair sheen
    'S': (232, 224, 218, 255),  # weathered pale skin
    's': (184, 172, 168, 255),  # gaunt cheek shadow
    'E': (180, 32, 46, 255),    # faint blood-glint dark eye
    'W': (168, 42, 54, 255),    # blood-stained dark crimson scarf
    'w': (108, 24, 34, 255),    # scarf shadow
    'G': (72, 74, 88, 255),     # weathered dark-grey cloak
    'g': (98, 102, 118, 255),   # cloak highlight
    'd': (44, 46, 58, 255),     # cloak shadow
    'C': (24, 24, 34, 255),     # pitch-dark inner robe
    'c': (14, 14, 22, 255),     # boots
}
remap_tbl = {
    (12, 12, 18): (8, 6, 12),
    (20, 20, 28): (16, 16, 24),
    (46, 48, 64): (40, 40, 56),
    (244, 238, 232): (232, 224, 218),
    (204, 194, 186): (184, 172, 168),
    (16, 16, 24): (180, 32, 46),
    (248, 250, 253): (168, 42, 54),
    (190, 198, 212): (108, 24, 34),
    (164, 171, 184): (72, 74, 88),
    (194, 200, 212): (98, 102, 118),
    (112, 120, 134): (44, 46, 58),
    (44, 47, 58): (24, 24, 34),
    (26, 28, 36): (14, 14, 22),
}
sheet_old = L('/workspace/guzhenren-assets/fangyuan_walk.png')
px = sheet_old.load()
for y in range(64):
    for x in range(64):
        r, g, b, a = px[x, y]
        if a and (r, g, b) in remap_tbl:
            px[x, y] = remap_tbl[(r, g, b)] + (a,)

# ---- 2. Older/Darker Fang Yuan 48x48 Portrait ----
PO = Image.new('RGBA', (48, 48), (18, 10, 14, 255))
pd = ImageDraw.Draw(PO)
for y in range(48):
    pd.line([(0, y), (47, y)], fill=(20 + y // 3, 10, 16 + y // 4, 255))
pd.ellipse([8, 2, 39, 32], fill=(42, 18, 24, 255))

K = (8, 6, 12, 255)
H = (16, 16, 24, 255)
Hs = (44, 44, 60, 255)
SK = (232, 224, 218, 255)
SKS = (182, 170, 166, 255)
GL = (72, 74, 88, 255)
GLH = (102, 106, 124, 255)
GLD = (44, 46, 58, 255)
CH = (24, 24, 34, 255)
SC = (168, 42, 54, 255)
SCS = (108, 24, 34, 255)

# Back long hair
pd.polygon([(11, 10), (36, 10), (41, 47), (6, 47)], fill=H, outline=K)
for x in (9, 13, 34, 38): pd.line([(x, 18), (x, 46)], fill=Hs)
# Dark weathered cloak & charcoal inner robe
pd.polygon([(7, 32), (40, 32), (47, 47), (0, 47)], fill=GL, outline=K)
pd.polygon([(14, 32), (33, 32), (35, 47), (12, 47)], fill=CH, outline=K)
pd.line([(9, 34), (5, 47)], fill=GLH, width=2)
pd.line([(38, 34), (42, 47)], fill=GLD, width=2)
# Blood-crimson tattered scarf with fringed ends
pd.polygon([(14, 28), (33, 28), (36, 36), (11, 36)], fill=SC, outline=K)
pd.polygon([(13, 35), (19, 35), (18, 45), (12, 45)], fill=SC, outline=K)
pd.line([(13, 44), (13, 46)], fill=SCS)
pd.line([(16, 44), (16, 46)], fill=SCS)
pd.line([(16, 31), (31, 31)], fill=SCS)
# Pale gaunt face
pd.polygon([(16, 9), (31, 9), (32, 20), (28, 25), (24, 27), (23, 27), (19, 25), (15, 20)], fill=SK, outline=K)
pd.line([(17, 21), (19, 23)], fill=SKS)
pd.line([(30, 21), (28, 23)], fill=SKS)
# Half-lidded ruthless dark eyes with faint crimson glint
pd.line([(17, 15), (21, 16)], fill=H)
pd.line([(17, 17), (21, 17)], fill=K)
pd.rectangle([18, 18, 20, 19], fill=K)
pd.point((19, 18), fill=(210, 48, 62, 255))
pd.line([(26, 16), (30, 15)], fill=H)
pd.line([(26, 17), (30, 17)], fill=K)
pd.rectangle([27, 18, 29, 19], fill=K)
pd.point((28, 18), fill=(210, 48, 62, 255))
# Flat cold mouth
pd.line([(22, 23), (25, 23)], fill=SKS)
# Center-parted jet black hair & side locks
pd.polygon([(14, 14), (15, 7), (20, 4), (27, 4), (32, 7), (33, 14), (29, 10), (25, 9), (24, 14), (22, 9), (18, 10)], fill=H, outline=K)
pd.polygon([(12, 11), (16, 11), (15, 42), (11, 41)], fill=H, outline=K)
pd.polygon([(31, 11), (35, 11), (36, 41), (32, 42)], fill=H, outline=K)
pd.line([(14, 16), (14, 38)], fill=Hs)
pd.line([(33, 16), (33, 38)], fill=Hs)

# ---- 3. Righteous Path Vanguard (16x16 + 32x32) ----
PAL_RV = {
    '.': (0, 0, 0, 0), 'K': (18, 24, 42, 255), 'H': (36, 42, 64, 255), 'S': (244, 214, 188, 255),
    'W': (236, 242, 252, 255), 'B': (74, 148, 224, 255), 'Y': (248, 206, 86, 255), 'C': (120, 238, 252, 255),
}
RV_ROWS = [
    "....KKKKKKKK....",
    "...KHHHHHHHHK...",
    "..KHHKYKKYKHHK..",
    "..KHHKSSSSKHHK..",
    "..KHHSSSSSSHHK..",
    "..KHKSKSSKSKHK..",
    "...KKSSSSSSKK...",
    "..KWWKYYYYKWWK..",
    ".KWWWBWWWWBWWWK.",
    ".KWWWBWWWWBWWWK.",
    ".KWWWKBBBBKWWWK.",
    "..KWKWWWWWWKWKC.",
    "..KKWWWWWWWWKKC.",
    "...KBBK..KBBK.C.",
    "...KKKK..KKKK.Y.",
    "................",
]
rv_16 = grid_to_img(RV_ROWS, PAL_RV)

RV32 = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
rd = ImageDraw.Draw(RV32)
RK = (18, 24, 42, 255); RW = (236, 242, 252, 255); RWS = (182, 204, 232, 255)
RB = (64, 136, 216, 255); RY = (248, 204, 82, 255); RSK = (244, 214, 188, 255)
rd.polygon([(10, 15), (21, 15), (26, 30), (5, 30)], fill=RW, outline=RK)
rd.polygon([(12, 16), (19, 16), (21, 30), (10, 30)], fill=RB)
rd.rectangle([11, 21, 20, 23], fill=RY, outline=RK)
rd.polygon([(12, 6), (19, 6), (20, 13), (16, 15), (15, 15), (11, 13)], fill=RSK, outline=RK)
rd.polygon([(10, 8), (11, 4), (16, 2), (20, 4), (21, 8)], fill=(38, 44, 68, 255), outline=RK)
rd.rectangle([14, 2, 17, 5], fill=RY, outline=RK)
rd.rectangle([13, 10, 14, 11], fill=RK); rd.rectangle([17, 10, 18, 11], fill=RK)
# Glowing azure sword
rd.line([(24, 22), (29, 6)], fill=(120, 238, 252, 255), width=2)
rd.line([(22, 20), (26, 22)], fill=RY, width=2)

# ---- 4. Righteous Alliance Leader Boss (32x32 + 48x48) ----
RB32 = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
rbd = ImageDraw.Draw(RB32)
# Golden immortal halo behind
rbd.ellipse([6, 1, 25, 20], outline=RY)
rbd.polygon([(8, 15), (23, 15), (28, 30), (3, 30)], fill=RY, outline=RK)
rbd.polygon([(11, 16), (20, 16), (23, 30), (8, 30)], fill=RW, outline=RK)
rbd.rectangle([11, 21, 20, 23], fill=RB, outline=RK)
rbd.polygon([(12, 6), (19, 6), (20, 13), (16, 15), (15, 15), (11, 13)], fill=RSK, outline=RK)
rbd.polygon([(10, 11), (11, 4), (16, 2), (20, 4), (21, 11)], fill=(235, 238, 245, 255), outline=RK)
rbd.rectangle([14, 1, 17, 5], fill=RY, outline=RK)
rbd.rectangle([13, 9, 14, 10], fill=RK); rbd.rectangle([17, 9, 18, 10], fill=RK)
# White beard
rbd.polygon([(13, 13), (18, 13), (16, 19)], fill=RW, outline=RK)
# Floating golden swords
rbd.line([(2, 18), (5, 7)], fill=RY, width=2)
rbd.line([(29, 18), (26, 7)], fill=RY, width=2)

PRB = Image.new('RGBA', (48, 48), (22, 28, 48, 255))
prd = ImageDraw.Draw(PRB)
for y in range(48): prd.line([(0, y), (47, y)], fill=(22, 28 + y // 3, 50 + y // 2, 255))
prd.ellipse([10, 2, 37, 29], outline=RY)
prd.polygon([(8, 31), (39, 31), (46, 47), (1, 47)], fill=RY, outline=RK)
prd.polygon([(14, 31), (33, 31), (24, 46)], fill=RW, outline=RK)
prd.rectangle([21, 26, 26, 31], fill=(210, 176, 148, 255))
prd.polygon([(16, 10), (31, 10), (32, 22), (24, 28), (15, 22)], fill=RSK, outline=RK)
prd.polygon([(13, 14), (15, 5), (24, 3), (32, 5), (34, 14)], fill=RW, outline=RK)
prd.rectangle([21, 2, 26, 7], fill=RY, outline=RK)
prd.rectangle([18, 16, 20, 18], fill=RK); prd.rectangle([27, 16, 29, 18], fill=RK)
prd.polygon([(20, 23), (27, 23), (24, 33)], fill=RW, outline=RK)

# ---- Pack into atlas.png (352 x 376) ----
A_old = L('/workspace/guzhenren-assets/atlas.png')
A = Image.new('RGBA', (352, 376), (0, 0, 0, 0))
A.paste(A_old, (0, 0))
rects = json.load(open('/workspace/guzhenren-assets/rects.json'))

A.paste(sheet_old, (128, 280)); rects['hero_old'] = [128, 280, 64, 64]
A.paste(rv_16, (144, 32)); A.paste(rv_16, (144, 48)); rects['rv_guard'] = [144, 32, 16, 16]
A.paste(RV32, (192, 280)); rects['rv_guard32'] = [192, 280, 32, 32]
A.paste(RB32, (224, 280)); rects['rv_boss'] = [224, 280, 32, 32]
A.paste(PO, (256, 280)); rects['face_hero_old'] = [256, 280, 48, 48]
A.paste(PRB, (304, 280)); rects['face_rv_boss'] = [304, 280, 48, 48]

A.save('/workspace/guzhenren-assets/atlas.png', optimize=True)
json.dump(rects, open('/workspace/guzhenren-assets/rects.json', 'w'))
open('/workspace/guzhenren-assets/atlas.b64', 'w').write(base64.b64encode(open('/workspace/guzhenren-assets/atlas.png', 'rb').read()).decode())
print("atlas.png:", os.path.getsize('/workspace/guzhenren-assets/atlas.png'), "b64:", os.path.getsize('/workspace/guzhenren-assets/atlas.b64'))

prev = Image.new('RGBA', (520, 180), (24, 22, 30, 255))
p = ImageDraw.Draw(prev)
for y in range(0, 180, 16):
    for x in range(0, 520, 16):
        p.rectangle([x, y, x+15, y+15], fill=(32, 28, 40) if ((x//16+y//16)%2==0) else (24, 22, 30))
prev.paste(PO.resize((120, 120), Image.NEAREST), (14, 32))
p.text((14, 12), "Old Fang Yuan 48x48", fill=(240, 230, 230))
prev.paste(PRB.resize((120, 120), Image.NEAREST), (150, 32))
p.text((150, 12), "Righteous Boss 48x48", fill=(240, 230, 230))
prev.paste(sheet_old.crop((0,0,16,16)).resize((48,48), Image.NEAREST), (290, 40))
prev.paste(rv_16.resize((48,48), Image.NEAREST), (350, 40))
prev.paste(RV32.resize((64,64), Image.NEAREST), (290, 100))
prev.paste(RB32.resize((64,64), Image.NEAREST), (370, 100))
prev.save('/workspace/guzhenren-assets/prologue_preview.png')
