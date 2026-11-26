from PIL import Image
import json, colorsys
def L(p): return Image.open(p).convert('RGBA')
HERO_MAP={(44,49,38):(28,26,34),(72,84,61):(48,44,58),(111,128,91):(78,74,92),
          (101,121,111):(38,150,88),(143,171,180):(110,214,140),(150,70,45):(24,96,62),(46,57,57):(20,70,45)}
def remap(im,m):
    im=im.copy(); px=im.load()
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a=px[x,y]
            if a and (r,g,b) in m: px[x,y]=m[(r,g,b)]+(a,)
    return im
def keyout(cell):
    cell=cell.copy(); px=cell.load(); bg=px[0,0]
    for y in range(cell.height):
        for x in range(cell.width):
            if px[x,y][:3]==bg[:3]: px[x,y]=(0,0,0,0)
    return cell
def tint(im,fn):
    im=im.copy(); px=im.load()
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a=px[x,y]
            if a: px[x,y]=fn(r,g,b)+(a,)
    return im
A=Image.new('RGBA',(352,280),(0,0,0,0)); rects={}
hero=remap(L('sp/characters_3.png').crop((0,0,64,64)),HERO_MAP); A.paste(hero,(0,0)); rects['hero']=[0,0,64,64]
npcs=[('fangzheng',25),('elder',9),('chief',10),('uncle',13),('aunt',5),('merchant',14),('mobei',2),('chicheng',6)]
for k,(n,i) in enumerate(npcs):
    sh=L(f'sp/characters_{i}.png')
    if n=='fangzheng': sh=remap(sh,{(30,146,57):(60,110,220),(20,83,91):(30,50,140)})
    A.paste(sh.crop((0,0,16,16)),(64+k*16,0)); A.paste(sh.crop((0,32,16,48)),(64+k*16,16))
    rects[n]=[64+k*16,0,16,16]
faces=[('hero',3)]+npcs
for k,(n,i) in enumerate(faces):
    f=L(f'sp/face_{i}.png')
    if n=='hero': f=remap(f,HERO_MAP)
    if n=='fangzheng': f=remap(f,{(30,146,57):(60,110,220),(20,83,91):(30,50,140)})
    A.paste(f,(k*38,96)); rects['face_'+n]=[k*38,96,38,38]
W=L('wolfpack.png')
def wolf_frames(bx,by):
    return [keyout(W.crop((bx+c*32,by,bx+c*32+32,by+32))) for c in range(4)]
def elec(r,g,b):
    l=(r+g+b)/3
    if l>200: return (240,240,240)
    if l<20: return (10,12,30)
    t=l/140
    return (int(40+60*t),int(70+110*t),int(150+105*min(1,t)))
def pale(r,g,b):
    l=(r+g+b)/3
    if l<40: return (20,24,48)
    t=l/255
    return (int(110+90*t),int(150+90*t),int(200+55*t))
def bossc(r,g,b):
    l=(r+g+b)/3
    if l>150: return (255,220,90)
    t=l/90
    return (int(30+50*t),int(20+30*t),int(70+80*t))
sets=[('wolf',128,0,elec),('bigwolf',128,128,pale),('boss',0,128,bossc)]
for row,(n,bx,by,fn) in enumerate(sets):
    for c,fr in enumerate(wolf_frames(bx,by)):
        fr=tint(fr,fn)
        if n!='wolf' or True:
            pass
        bb=fr.getbbox()
        if n=='wolf':
            px=fr.load()
            # electric sparks along the back
            for x in range(bb[0]+8,bb[2]-4,5):
                for y in range(bb[1],bb[3]):
                    if px[x,y][3]: px[x,y-1]=(115,239,247,255); break
        if n=='boss':
            px=fr.load()
            hx=bb[0]+3; hy=None
            for y in range(32):
                if any(px[x,y][3] for x in range(bb[0],bb[0]+8)): hy=y; break
            crown=[(0,2),(1,1),(2,0),(2,1),(2,2),(3,2),(4,1),(4,2),(5,0),(5,1),(5,2),(6,2),(7,1),(1,3),(2,3),(3,3),(4,3),(5,3),(6,3)]
            for dx,dy in crown:
                x,y=hx+dx-1,hy-4+dy
                if 0<=x<32 and 0<=y<32: px[x,y]=(255,205,60,255)
        A.paste(fr,(c*32,134+row*32))
    rects[n]=[0,134+row*32,32,32]
pig=L('na/pig.png')
boar=tint(pig,lambda r,g,b:(10,8,8) if (r+g+b)<60 else (int(r*0.55),int(g*0.38),int(b*0.28)))
px=boar.load()
for fx in (0,16):
    bb=boar.crop((fx,0,fx+16,16)).getbbox()
A.paste(boar,(128,134)); rects['boar']=[128,134,16,16]
T=L('sp/background-elements_tileset.png')
for k,n in enumerate(['house_thatch','house_plaster','house_thatch2','house_red']):
    A.paste(T.crop((k*64,0,k*64+64,47)),(k*64,230)); rects[n]=[k*64,230,64,47]
A.save('atlas.png',optimize=True)
json.dump(rects,open('rects.json','w'))
import os; print(os.path.getsize('atlas.png')); print(rects)
A.resize((704,560),Image.NEAREST).save('/tmp/atlas_big.png')
