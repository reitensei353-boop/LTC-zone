from PIL import Image, ImageDraw

C = {
    '.': (0, 0, 0, 0),
    'K': (12, 12, 18, 255),      # outline / deep black
    'H': (20, 20, 28, 255),      # jet-black hair
    'h': (46, 48, 64, 255),      # hair sheen
    'S': (244, 238, 232, 255),   # pale almost-white skin
    's': (204, 194, 186, 255),   # cool skin shadow
    'E': (16, 16, 24, 255),      # cold dark eye
    'W': (248, 250, 253, 255),   # pure white scarf
    'w': (190, 198, 212, 255),   # scarf shadow / fold
    'G': (164, 171, 184, 255),   # pale-grey cloak
    'g': (194, 200, 212, 255),   # cloak highlight
    'd': (112, 120, 134, 255),   # cloak shadow
    'C': (44, 47, 58, 255),      # dark charcoal inner garment
    'c': (26, 28, 36, 255),      # deeper charcoal / boots
}

def grid_to_img(rows):
    h = len(rows)
    w = len(rows[0])
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    px = im.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            px[x, y] = C[ch]
    return im

# ---- 16x16 WALK FRAMES (4 cols: down, up, left, right; 4 rows: walk cycle) ----
# Col 0: DOWN
DOWN_0 = [
    "....KKKKKKKK....",
    "...KHHHHHHHHK...",
    "..KHHHhKKhHHHK..",
    "..KHHHKSSKHHHK..",
    "..KHHSSSSSSHHK..",
    "..KHSEESSEESHK..",
    "..KHSsSSSSsSHK..",
    "..KHHKsSSsKHHK..",
    "..KHKWWWWWWKHK..",
    ".KGKWWwCCwWWKGK.",
    ".KGGWCCCCCCdGGK.",
    ".KGGWCCddCCdGGK.",
    ".KGdKCCCCCCKdGK.",
    "..KdKCCCCCCKdK..",
    "...KccK..KccK...",
    "...KKKK..KKKK...",
]
DOWN_1 = [
    "................",
    "....KKKKKKKK....",
    "...KHHHHHHHHK...",
    "..KHHHhKKhHHHK..",
    "..KHHHKSSKHHHK..",
    "..KHHSSSSSSHHK..",
    "..KHSEESSEESHK..",
    "..KHSsSSSSsSHK..",
    "..KHHKsSSsKHHK..",
    "..KHKWWWWWWKHK..",
    ".KGKWWwCCwWWKGK.",
    ".KGGWCCCCCCdGGK.",
    ".KGGWCCddCCdGGK.",
    ".KGdKCCCCCCKdK..",
    "..KccK...KccK...",
    "..KKKK...KKKK...",
]
DOWN_3 = [
    "................",
    "....KKKKKKKK....",
    "...KHHHHHHHHK...",
    "..KHHHhKKhHHHK..",
    "..KHHHKSSKHHHK..",
    "..KHHSSSSSSHHK..",
    "..KHSEESSEESHK..",
    "..KHSsSSSSsSHK..",
    "..KHHKsSSsKHHK..",
    "..KHKWWWWWWKHK..",
    ".KGKWWwCCwWWKGK.",
    ".KGGWCCCCCCdGGK.",
    ".KGGWCCddCCdGGK.",
    "..KdKCCCCCCKdGK.",
    "...KccK...KccK..",
    "...KKKK...KKKK..",
]

# Col 1: UP (back view: pale-grey shoulders/cloak clearly framing long jet-black hair flowing down past waist + white scarf at nape)
UP_0 = [
    "....KKKKKKKK....",
    "...KHHHHHHHHK...",
    "..KHHHhKKhHHHK..",
    "..KHHHHHHHHHHK..",
    "..KHHHHHHHHHHK..",
    "..KHHhHHHHhHHK..",
    "..KHHHHHHHHHHK..",
    "..KHHHHHHHHHHK..",
    "..KWWKHHHHKWWK..",
    ".KGGWKHHHHKWGGK.",
    ".KGGGKHHHHKGGGK.",
    ".KGGdKHHHHKdGGK.",
    ".KGddKHHhhKddGK.",
    "..KddKHHHHKddK..",
    "...KcKHHHHKcK...",
    "...KKKHHHHKKK...",
]
UP_1 = [
    "................",
    "....KKKKKKKK....",
    "...KHHHHHHHHK...",
    "..KHHHhKKhHHHK..",
    "..KHHHHHHHHHHK..",
    "..KHHhHHHHhHHK..",
    "..KHHHHHHHHHHK..",
    "..KHHHHHHHHHHK..",
    "..KWWKHHHHKWWK..",
    ".KGGWKHHHHKWGGK.",
    ".KGGGKHHHHKGGGK.",
    ".KGGdKHHHHKdGGK.",
    ".KGddKHHhhKddGK.",
    "..KccKHHHHKddK..",
    "..KKKKHHHHKcK...",
    "......HHHHKKK...",
]
UP_3 = [
    "................",
    "....KKKKKKKK....",
    "...KHHHHHHHHK...",
    "..KHHHhKKhHHHK..",
    "..KHHHHHHHHHHK..",
    "..KHHhHHHHhHHK..",
    "..KHHHHHHHHHHK..",
    "..KHHHHHHHHHHK..",
    "..KWWKHHHHKWWK..",
    ".KGGWKHHHHKWGGK.",
    ".KGGGKHHHHKGGGK.",
    ".KGGdKHHHHKdGGK.",
    ".KGddKHHhhKddGK.",
    "..KddKHHHHKccK..",
    "...KcKHHHHKKKK..",
    "...KKKHHHH......",
]

# Col 2: LEFT (pale profile, half-lidded eye, hair cascading down back + thin front side-lock, crisp white scarf separated from pale-grey cloak)
LEFT_0 = [
    "....KKKKKKKK....",
    "...KHHhHHHHHK...",
    "..KHHHHHHHHHHK..",
    "..KHSSSSKHHHHK..",
    "..KSSSSSKHHHHK..",
    "..KSEESSKHHHHK..",
    "..KsSSSSKHHHHK..",
    "...KssSKHHHHHK..",
    "...KWWWWKHHHHK..",
    "..KWWwwKKHHHHK..",
    "..KGGgGGKHHHHK..",
    "..KGGGGdKHHhHK..",
    "..KGdGGdKHHHHK..",
    "...KdCCdKHHHK...",
    "...KccK..KccK...",
    "...KKKK..KKKK...",
]
LEFT_1 = [
    "................",
    "....KKKKKKKK....",
    "...KHHhHHHHHK...",
    "..KHHHHHHHHHHK..",
    "..KHSSSSKHHHHK..",
    "..KSSSSSKHHHHK..",
    "..KSEESSKHHHHK..",
    "..KsSSSSKHHHHK..",
    "...KssSKHHHHHK..",
    "...KWWWWKHHHHK..",
    "..KWWwwKKHHHHK..",
    "..KGGgGGKHHHHK..",
    "..KGGGGdKHHhHK..",
    "..KccGGdKHHHHK..",
    "..KKKK...KccK...",
    ".........KKKK...",
]
LEFT_3 = [
    "................",
    "....KKKKKKKK....",
    "...KHHhHHHHHK...",
    "..KHHHHHHHHHHK..",
    "..KHSSSSKHHHHK..",
    "..KSSSSSKHHHHK..",
    "..KSEESSKHHHHK..",
    "..KsSSSSKHHHHK..",
    "...KssSKHHHHHK..",
    "...KWWWWKHHHHK..",
    "..KWWwwKKHHHHK..",
    "..KGGgGGKHHHHK..",
    "..KGGGGdKHHhHK..",
    "...KdCCccHHHHK..",
    "....KccK.KKKK...",
    "....KKKK........",
]

def flip_rows(rows):
    return [r[::-1] for r in rows]

RIGHT_0 = flip_rows(LEFT_0)
RIGHT_1 = flip_rows(LEFT_1)
RIGHT_3 = flip_rows(LEFT_3)

sheet = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
cols = [
    [DOWN_0, DOWN_1, DOWN_0, DOWN_3],
    [UP_0, UP_1, UP_0, UP_3],
    [LEFT_0, LEFT_1, LEFT_0, LEFT_3],
    [RIGHT_0, RIGHT_1, RIGHT_0, RIGHT_3],
]
for c_idx, frames in enumerate(cols):
    for r_idx, frows in enumerate(frames):
        sheet.paste(grid_to_img(frows), (c_idx * 16, r_idx * 16))
sheet.save('/workspace/guzhenren-assets/fangyuan_walk.png')

# ---- 48x48 PORTRAIT BUST ----
P = Image.new('RGBA', (48, 48), (18, 20, 30, 255))
d = ImageDraw.Draw(P)

for y in range(48):
    v = int(16 + (y / 48) * 14)
    d.line([(0, y), (47, y)], fill=(v, v + 2, v + 10, 255))
d.ellipse([9, 2, 38, 32], fill=(28, 32, 46, 255))
d.ellipse([13, 5, 34, 27], fill=(34, 39, 55, 255))

OUT = (10, 10, 16, 255)
HAIR = (18, 18, 26, 255)
HAIR_HI = (44, 46, 62, 255)
SKIN = (244, 238, 232, 255)
SKIN_SH = (212, 202, 194, 255)
EYE_DARK = (14, 14, 22, 255)
EYE_MID = (68, 72, 88, 255)
SCLERA = (224, 224, 230, 255)
SCARF = (246, 248, 252, 255)
SCARF_SH = (194, 202, 215, 255)
SCARF_D = (148, 156, 170, 255)
CLOAK = (176, 182, 194, 255)
CLOAK_HI = (204, 210, 220, 255)
CLOAK_SH = (122, 130, 144, 255)
CHARCOAL = (44, 47, 58, 255)
CHARCOAL_D = (24, 26, 34, 255)

# Back hair falling past shoulders/waist behind cloak
d.polygon([(11, 11), (36, 11), (41, 47), (6, 47)], fill=HAIR, outline=OUT)
for x in (9, 12, 35, 38):
    d.line([(x, 22), (x, 46)], fill=HAIR_HI)

# Loose wide pale-grey cloak over dark charcoal inner garment
d.polygon([(9, 31), (38, 31), (46, 47), (1, 47)], fill=CLOAK, outline=OUT)
d.polygon([(3, 47), (9, 32), (16, 33), (12, 47)], fill=CLOAK_HI)
d.polygon([(31, 33), (38, 32), (44, 47), (35, 47)], fill=CLOAK_SH)
d.line([(6, 47), (11, 35)], fill=CLOAK_SH)
d.line([(41, 47), (36, 35)], fill=OUT)

# Dark charcoal inner garment V-opening
d.polygon([(15, 32), (32, 32), (33, 47), (14, 47)], fill=CHARCOAL, outline=OUT)
d.line([(17, 33), (27, 47)], fill=CHARCOAL_D, width=2)
d.line([(30, 33), (23, 43)], fill=CHARCOAL_D)
d.polygon([(12, 31), (17, 31), (15, 47), (10, 47)], fill=CLOAK_HI, outline=OUT)
d.polygon([(30, 31), (35, 31), (37, 47), (32, 47)], fill=CLOAK, outline=OUT)

# Thick white scarf wrapped around neck + fringed hanging tail on chest
d.polygon([(16, 31), (22, 31), (21, 43), (15, 43)], fill=SCARF, outline=OUT)
d.line([(16, 33), (16, 42)], fill=SCARF_SH)
d.line([(20, 34), (20, 42)], fill=SCARF_SH)
for fx in (15, 17, 19, 21):
    d.line([(fx, 43), (fx, 46)], fill=SCARF_SH)
    d.point((fx, 47), fill=SCARF_D)
d.polygon([(13, 25), (34, 25), (35, 32), (12, 32)], fill=SCARF, outline=OUT)
d.line([(14, 30), (33, 30)], fill=SCARF_SH)
d.line([(15, 31), (32, 31)], fill=SCARF_D)
d.line([(16, 27), (29, 28)], fill=SCARF_SH)

# Pale face
d.polygon([(16, 9), (31, 9), (32, 20), (28, 25), (24, 27), (23, 27), (19, 25), (15, 20)], fill=SKIN, outline=OUT)
d.line([(19, 24), (23, 26), (24, 26), (28, 24)], fill=SKIN_SH)
d.line([(16, 15), (16, 20)], fill=SKIN_SH)
d.line([(31, 15), (31, 20)], fill=SKIN_SH)

# Narrow, cold, half-lidded dark eyes
d.line([(17, 15), (21, 16)], fill=EYE_DARK)
d.line([(17, 17), (21, 17)], fill=EYE_DARK)
d.line([(17, 18), (21, 18)], fill=SCLERA)
d.rectangle([18, 18, 20, 19], fill=EYE_DARK)
d.point((18, 18), fill=EYE_MID)
d.line([(18, 19), (20, 19)], fill=SKIN_SH)

d.line([(26, 16), (30, 15)], fill=EYE_DARK)
d.line([(26, 17), (30, 17)], fill=EYE_DARK)
d.line([(26, 18), (30, 18)], fill=SCLERA)
d.rectangle([27, 18, 29, 19], fill=EYE_DARK)
d.point((29, 18), fill=EYE_MID)
d.line([(27, 19), (29, 19)], fill=SKIN_SH)

# Nose shadow + flat mouth
d.point((23, 20), fill=SKIN_SH)
d.point((23, 21), fill=SKIN_SH)
d.line([(21, 23), (25, 23)], fill=(150, 138, 132, 255))

# Crown hair with natural center-part V-opening (no forehead dot!)
d.polygon([(14, 14), (14, 7), (19, 4), (28, 4), (33, 7), (33, 14), (30, 11), (25, 9), (24, 12), (23, 12), (22, 9), (17, 11)], fill=HAIR, outline=OUT)
# Center-part hairline groove
d.line([(23, 5), (23, 9)], fill=OUT)
d.line([(24, 5), (24, 9)], fill=HAIR_HI)
# Crown sheen
d.line([(17, 6), (21, 6)], fill=HAIR_HI)
d.line([(26, 6), (30, 6)], fill=HAIR_HI)
d.line([(16, 8), (19, 8)], fill=HAIR_HI)
d.line([(28, 8), (31, 8)], fill=HAIR_HI)

# Side locks in front of shoulders + delicate loose framing strands
d.polygon([(13, 11), (16, 11), (16, 24), (14, 40), (12, 39), (12, 22)], fill=HAIR, outline=OUT)
d.line([(14, 15), (14, 34)], fill=HAIR_HI)
d.line([(16, 12), (16, 21)], fill=HAIR)
d.point((17, 13), fill=HAIR)
d.point((17, 19), fill=HAIR)

d.polygon([(31, 11), (34, 11), (35, 22), (35, 39), (33, 40), (31, 24)], fill=HAIR, outline=OUT)
d.line([(33, 15), (33, 34)], fill=HAIR_HI)
d.line([(31, 12), (31, 21)], fill=HAIR)
d.point((30, 13), fill=HAIR)
d.point((30, 19), fill=HAIR)

P.save('/workspace/guzhenren-assets/fangyuan_portrait.png')

# ---- PREVIEW PNG ----
prev = Image.new('RGBA', (560, 320), (34, 38, 50, 255))
pd = ImageDraw.Draw(prev)
for y in range(0, 320, 16):
    for x in range(0, 560, 16):
        c = (44, 48, 62, 255) if ((x // 16 + y // 16) % 2 == 0) else (38, 42, 54, 255)
        pd.rectangle([x, y, x + 15, y + 15], fill=c)

walk_big = sheet.resize((256, 256), Image.NEAREST)
prev.paste(walk_big, (20, 44), walk_big)
pd.text((20, 18), "Fang Yuan Walk Sheet (16x16 x4 cols: Down / Up / Left / Right)", fill=(235, 238, 245, 255))

port_big = P.resize((192, 192), Image.NEAREST)
prev.paste(port_big, (320, 44), port_big)
pd.rectangle([319, 43, 512, 236], outline=(240, 240, 245, 255))
pd.text((320, 18), "Portrait (48x48 -> 4x)", fill=(235, 238, 245, 255))

p1 = sheet.crop((0, 0, 64, 16))
prev.paste(p1.resize((128, 32), Image.NEAREST), (320, 254), p1.resize((128, 32), Image.NEAREST))
prev.paste(P, (470, 248), P)
pd.text((320, 290), "2x idle row + 1x portrait", fill=(200, 205, 215, 255))

prev.save('/workspace/guzhenren-assets/fangyuan_preview.png')
print("Updated preview.")
