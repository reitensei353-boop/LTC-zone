from PIL import Image, ImageDraw
import json, math, base64, os

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

A = Image.new('RGBA', (352, 280), (0, 0, 0, 0))
rects = {}

# New custom Fang Yuan walk sheet (64x64) at [0, 0, 64, 64]
hero = L('fangyuan_walk.png')
A.paste(hero, (0, 0))
rects['hero'] = [0, 0, 64, 64]

# NPCs (same slots as before)
npcs = [('fangzheng', 25), ('elder', 9), ('chief', 10), ('uncle', 13), ('aunt', 5), ('merchant', 14), ('mobei', 2), ('chicheng', 6)]
for k, (n, i) in enumerate(npcs):
    sh = L(f'sp/characters_{i}.png')
    if n == 'fangzheng':
        sh = remap(sh, {(30, 146, 57): (60, 110, 220), (20, 83, 91): (30, 50, 140)})
    A.paste(sh.crop((0, 0, 16, 16)), (64 + k * 16, 0))
    A.paste(sh.crop((0, 32, 16, 48)), (64 + k * 16, 16))
    rects[n] = [64 + k * 16, 0, 16, 16]

# NPC faces at y=96 (38x38 each)
for k, (n, i) in enumerate([('hero', 3)] + npcs):
    if n == 'hero':
        # Leave [0, 96] unused or put 38x38 resized fallback, while real 48x48 portrait goes at [192, 134, 48, 48]
        continue
    f = L(f'sp/face_{i}.png')
    if n == 'fangzheng':
        f = remap(f, {(30, 146, 57): (60, 110, 220), (20, 83, 91): (30, 50, 140)})
    A.paste(f, (k * 38, 96))
    rects['face_' + n] = [k * 38, 96, 38, 38]

# New custom 48x48 Fang Yuan bust portrait at [192, 134, 48, 48]
port = L('fangyuan_portrait.png')
A.paste(port, (192, 134))
rects['face_hero'] = [192, 134, 48, 48]

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

sets = [('wolf', 128, 0, elec), ('bigwolf', 128, 128, pale), ('boss', 0, 128, bossc)]
for row, (n, bx, by, fn) in enumerate(sets):
    for c, fr in enumerate(wolf_frames(bx, by)):
        fr = tint(fr, fn)
        bb = fr.getbbox()
        if n == 'wolf':
            px = fr.load()
            for x in range(bb[0] + 8, bb[2] - 4, 5):
                for y in range(bb[1], bb[3]):
                    if px[x, y][3]:
                        px[x, y - 1] = (115, 239, 247, 255)
                        break
        if n == 'boss':
            px = fr.load()
            hx = bb[0] + 3
            hy = None
            for y in range(32):
                if any(px[x, y][3] for x in range(bb[0], bb[0] + 8)):
                    hy = y
                    break
            crown = [(0,2),(1,1),(2,0),(2,1),(2,2),(3,2),(4,1),(4,2),(5,0),(5,1),(5,2),(6,2),(7,1),(1,3),(2,3),(3,3),(4,3),(5,3),(6,3)]
            for dx, dy in crown:
                x, y = hx + dx - 1, hy - 4 + dy
                if 0 <= x < 32 and 0 <= y < 32:
                    px[x, y] = (255, 205, 60, 255)
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
                        op[x, y] = col
                        break
    A.paste(out, (x0, y0))

outline((0, 134, 128, 166), (16, 20, 48, 255))
outline((0, 166, 128, 198), (30, 40, 80, 255))
outline((0, 198, 128, 230), (10, 6, 20, 255))

# Boar
pig = L('na/pig.png')
boar = tint(pig, lambda r, g, b: (10, 8, 8) if (r + g + b) < 60 else (int(r * 0.55), int(g * 0.38), int(b * 0.28)))
A.paste(boar, (128, 134))
rects['boar'] = [128, 134, 16, 16]

# Houses
T = L('sp/background-elements_tileset.png')
for k, n in enumerate(['house_thatch', 'house_plaster', 'house_thatch2', 'house_red']):
    A.paste(T.crop((k * 64, 0, k * 64 + 64, 47)), (k * 64, 230))
    rects[n] = [k * 64, 230, 64, 47]

A.save('atlas.png', optimize=True)
json.dump(rects, open('rects.json', 'w'))
open('atlas.b64', 'w').write(base64.b64encode(open('atlas.png', 'rb').read()).decode())
A.resize((704, 560), Image.NEAREST).save('/tmp/atlas_big.png')
print("atlas.png bytes:", os.path.getsize('atlas.png'), "b64 chars:", os.path.getsize('atlas.b64'))

# ---- RESTYLE TITLE BANNER ----
def g(n, f=0):
    x, y, w, h = rects[n]
    return A.crop((x + f * w if n in ('wolf', 'bigwolf', 'boss') else x, y, x + w + (f * w if n in ('wolf', 'bigwolf', 'boss') else 0), y + h))

W, H = 200, 100
im = Image.new('RGBA', (W, H))
d = ImageDraw.Draw(im)
bands = [(13, 11, 26), (26, 28, 44), (41, 54, 111), (59, 93, 201), (93, 39, 93)]
for i, c in enumerate(bands):
    d.rectangle([0, i * 12, W, i * 12 + 12], fill=c)
for x in range(0, W, 4):
    hh = 18 + int(abs(math.sin(x * 0.04)) * 18 + abs(math.sin(x * 0.11)) * 6)
    d.rectangle([x, 62 - hh, x + 3, 62], fill=(26, 28, 44))
d.ellipse([160, 6, 174, 20], fill=(223, 246, 255))
d.ellipse([164, 4, 178, 18], fill=(13, 11, 26))
d.rectangle([0, 62, W, H], fill=(54, 105, 42))
for i in range(30):
    d.point(((i * 37) % W, 64 + (i * 13) % 34), fill=(79, 143, 58))
im.alpha_composite(g('house_red'), (4, 20))
im.alpha_composite(g('house_thatch'), (132, 22))
# New monochrome Fang Yuan standing center-stage (3x)
hero_idle = hero.crop((0, 0, 16, 16)).resize((48, 48), Image.NEAREST)
im.alpha_composite(hero_idle, (76, 46))
wolf = g('wolf').resize((32, 32), Image.NEAREST)
bw = g('bigwolf').resize((32, 32), Image.NEAREST)
im.alpha_composite(wolf.transpose(Image.FLIP_LEFT_RIGHT), (18, 64))
im.alpha_composite(bw, (150, 66))
im = im.resize((W * 4, H * 4), Image.NEAREST)
im.save('title_banner.png', optimize=True)
print("title_banner.png bytes:", os.path.getsize('title_banner.png'))
