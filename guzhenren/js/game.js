/* 鹿鼎记 · 扬州一段. Landscape, tap-to-move, 烟雨江湖-style chrome. */
(function () {
  "use strict";
  const TILE = 40;
  const MAPW = 1280;
  const MAPH = 720;
  const COLS = 32;
  const ROWS = 18;
  const VIEW = { x: 8, y: 42, w: 708, h: 286 };
  const SPRITE_H = 48;
  const DIRS = ["down", "left", "right", "up"];
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const FAST = params.get("fast") === "1" || params.get("shot");
  const KEY = "ldj-yyjh-v2";

  const HOURS = ["巳", "午", "未", "申", "酉"];
  const DOCK = [
    ["role", "角色", personIcon],
    ["bag", "包袱", bagIcon],
    ["skill", "武功", swordIcon],
    ["form", "布阵", flagIcon],
    ["art", "技艺", potIcon],
    ["note", "记事", bookIcon],
    ["map", "地图", mapIcon],
  ];

  const ITEMS = {
    dagger: { name: "匕首", slot: "weapon", base: "攻击 +8", extra: "无", special: "专挑软处。韦小宝惯用的短刃。", eq: true },
    lime: { name: "石灰", slot: "", base: "无", extra: "无", special: "撒进眼里，英雄也睁不开。", eq: false },
    pill: { name: "金创药", slot: "", base: "气血 +28", extra: "无", special: "苦，止血。", eq: false, heal: 28 },
    cloth: { name: "蓝布短褂", slot: "cloth", base: "防御 +2", extra: "无", special: "扬州街上的旧衣。", eq: true },
    dao: { name: "单刀", slot: "weapon", base: "攻击 +16", extra: "五虎断门", special: "茅十八的刀。", eq: false, who: "mao" },
  };

  const SK = {
    wei: [
      { id: "brawl", name: "市井扭打", qi: 0, mult: 1, line: "矮身一钻，照着腰眼便撞。" },
      { id: "dagger", name: "匕首", qi: 30, mult: 1.6, line: "刀光一闪，专挑软处。" },
      { id: "taunt", name: "油嘴", qi: 20, mult: 0.45, weak: true, line: "骂得又损又快，对手怒得走形。" },
      { id: "lime", name: "撒石灰", qi: 25, mult: 0.55, blind: true, line: "白粉飞扬，直扑双眼。" },
    ],
    mao: [
      { id: "dao", name: "断门刀", qi: 0, mult: 1.15, line: "五虎断门刀斜劈下来。" },
      { id: "hack", name: "猛劈", qi: 30, mult: 1.75, line: "刀势又沉又快，劈在肩上。" },
      { id: "sweep", name: "横扫", qi: 45, mult: 0.85, aoe: true, line: "一刀扫过，官差连着退。" },
    ],
    guan: [
      { id: "cut", name: "挥刀", qi: 0, mult: 1, line: "官差单刀横劈。" },
      { id: "stab", name: "突刺", qi: 30, mult: 1.45, line: "刀尖直取胸口。" },
    ],
  };

  const img = {};
  let masks = null;
  let state;
  let raf = 0;

  function fresh() {
    return {
      map: "yangzhou",
      x: 10, y: 8,
      path: [],
      flip: false,
      facing: "down",
      frame: 1,
      moving: false,
      moveFrom: null,
      moveStart: 0,
      trail: [],
      party: ["wei"],
      focus: "wei",
      flags: {},
      stats: { lv: 1, li: 9, shen: 14, gen: 8, ji: 16, points: 2, exp: 12, next: 40, yueli: 6 },
      hp: { wei: 92, mao: 148 },
      hpMax: { wei: 92, mao: 148 },
      sta: 92, staMax: 100,
      wen: 46, gold: 0,
      own: { dagger: 1, lime: 1, pill: 2, cloth: 1 },
      hour: 3,
      night: false,
      panel: null,
      tip: null,
      talk: null,
      battle: null,
      menu: false,
      fast: !!FAST,
    };
  }

  function walkAt(map, x, y) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
    const row = masks[map][y];
    return row && row[x] === "1";
  }
  function nearestWalk(map, x, y) {
    let best = null;
    let bd = 99;
    for (let yy = 0; yy < ROWS; yy++) {
      for (let xx = 0; xx < COLS; xx++) {
        if (!walkAt(map, xx, yy)) continue;
        const d = Math.abs(xx - x) + Math.abs(yy - y);
        if (d < bd) { bd = d; best = [xx, yy]; }
      }
    }
    return best || [x, y];
  }
  function astar(map, x0, y0, x1, y1) {
    if (!walkAt(map, x1, y1)) return null;
    const key = (x, y) => x + "," + y;
    const h = (x, y) => Math.abs(x - x1) + Math.abs(y - y1);
    const open = [{ f: h(x0, y0), g: 0, x: x0, y: y0 }];
    const best = new Map([[key(x0, y0), 0]]);
    const prev = new Map();
    while (open.length) {
      open.sort((a, b) => a.f - b.f);
      const n = open.shift();
      if (n.x === x1 && n.y === y1) {
        const path = [[n.x, n.y]];
        let k = key(n.x, n.y);
        while (prev.has(k)) {
          k = prev.get(k);
          const [px, py] = k.split(",").map(Number);
          path.push([px, py]);
        }
        path.reverse();
        path.shift();
        return path;
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = n.x + dx;
        const ny = n.y + dy;
        if (!walkAt(map, nx, ny)) continue;
        const ng = n.g + 1;
        const kk = key(nx, ny);
        if (best.has(kk) && best.get(kk) <= ng) continue;
        best.set(kk, ng);
        prev.set(kk, key(n.x, n.y));
        open.push({ f: ng + h(nx, ny), g: ng, x: nx, y: ny });
      }
    }
    return null;
  }

  function npcs() {
    if (state.map === "yangzhou") {
      return [
        { id: "tea", name: "茶博士", x: 11, y: 7, who: "tea" },
        { id: "gate", name: "丽春院", x: 8, y: 8, who: "gate", bang: !state.flags.lichun },
      ];
    }
    const list = [];
    if (!state.flags.won) {
      list.push({ id: "mao", name: "茅十八", x: 12, y: 12, who: "mao", bang: !state.flags.met });
      const g1 = mover("guan");
      const g2 = mover("guan2");
      list.push({ id: "guan", name: "官差", x: g1.x, y: g1.y, who: "guan", facing: g1.facing, frame: g1.frame, moving: true, bang: !state.flags.met });
      list.push({ id: "guan2", name: "官差", x: g2.x, y: g2.y, who: "guan", facing: g2.facing, frame: g2.frame, moving: true, bang: false });
    } else if (state.party.includes("mao")) {
      list.push({ id: "mao", name: "茅十八", x: state.x, y: state.y, who: "mao", hidden: true });
    }
    return list;
  }

  function money(wen) {
    const liang = Math.floor(wen / 1000);
    const rest = wen % 1000;
    return liang + "两" + rest + "文";
  }
  function questBlock() {
    const q = $("quest");
    if (!state.flags.lichun) {
      q.innerHTML = "<b>主线</b><p>鸣玉坊里有人喊打</p><em>前往丽春院 0/1</em>";
    } else if (!state.flags.won) {
      q.innerHTML = "<b>主线</b><p>官差围住了茅十八</p><em>助他脱困 0/1</em>";
    } else {
      q.innerHTML = "<b>主线</b><p>扬州这一段先了结</p><em>未完待续 1/1</em>";
    }
  }
  function hud() {
    $("sta").textContent = "体力 " + state.sta + "/" + state.staMax;
    $("wen").textContent = money(state.wen);
    $("gold").textContent = state.gold + "两";
    const place = state.map === "yangzhou" ? "扬州" : "丽春院";
    $("locname").textContent = place + " (" + state.x + "," + state.y + ")";
    $("hours").innerHTML = "";
    HOURS.forEach((h, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = h;
      if (i === state.hour) b.className = "on";
      b.addEventListener("click", () => {
        state.hour = i;
        state.night = i >= 4;
        hud();
      });
      $("hours").appendChild(b);
    });
    const box = $("near");
    box.innerHTML = "";
    npcs().filter((n) => !n.hidden).forEach((n) => {
      const b = document.createElement("button");
      b.type = "button";
      const near = Math.abs(n.x - state.x) + Math.abs(n.y - state.y) <= 3;
      b.innerHTML = "<b></b><small></small>";
      b.querySelector("b").textContent = n.name;
      b.querySelector("small").textContent = near ? "可交谈" : "还远";
      b.addEventListener("click", () => goInteract(n));
      box.appendChild(b);
    });
    questBlock();
    const mapOpen = state.panel || state.battle || state.talk;
    const hideMap = !!state.battle || !!state.walkDemo;
    $("top").hidden = hideMap;
    $("side").hidden = hideMap;
    $("dock").hidden = hideMap || !!state.panel;
    $("quest").hidden = hideMap || !!state.panel;
  }

  function goInteract(n) {
    const dist = Math.abs(n.x - state.x) + Math.abs(n.y - state.y);
    if (dist <= 1) interact(n);
    else {
      const path = astar(state.map, state.x, state.y, n.x, n.y);
      if (path && path.length) {
        state.path = path;
        state.pending = n.id;
      }
    }
  }
  function interact(n) {
    if (state.talk || state.battle || state.panel) return;
    if (n.id === "tea") {
      openTalk([
        { who: "tea", name: "茶博士", text: "榜文贴满了扬州。捉拿茅十八，杀了赏银二千两，通风报信也有一千两。" },
        { who: "wei", name: "韦小宝", text: "二千两我拿不动。一千两的赏，英雄好汉可不干通风报信。" },
      ], [
        { t: "再听一嘴坊里的事", go: "moretea" },
        { t: "去丽春院看看热闹", go: "togate" },
      ]);
      return;
    }
    if (n.id === "gate") {
      enterLichun();
      return;
    }
    if (n.who === "mao" || n.who === "guan") {
      if (state.flags.won) {
        openTalk([{ who: "mao", name: "茅十八", text: "往北的路还长。今日这一架，先记在这儿。" }]);
        return;
      }
      openMao();
    }
  }
  function enterLichun() {
    fade(() => {
      state.map = "lichun";
      state.flags.lichun = 1;
      const p = nearestWalk("lichun", 16, 13);
      state.x = p[0]; state.y = p[1];
      state.path = [];
      state.pending = null;
      hud();
    });
  }
  function openMao() {
    openTalk([
      { who: "guan", name: "官差", text: "茅十八！奉命捉拿你。越狱杀官的账，跟我们走。跟旁人并不相干。" },
      { who: "mao", name: "茅十八", text: "孩子，一边去。这些鹰爪孙冲着我来。" },
    ], [
      { t: "有难同当，我跟你打", go: "loyal" },
      { t: "赏银二千两，我心动了", go: "greed" },
      { t: "官差太凶，先溜吧", go: "flee" },
    ]);
  }

  function openTalk(lines, choices, after) {
    state.talk = { lines, i: 0, choices: choices || null, after: after || null, showChoice: false };
    state.panel = null;
    renderTalk();
    hud();
  }
  function renderTalk() {
    const t = state.talk;
    if (!t) { $("dlg").hidden = true; $("choices").hidden = true; return; }
    $("dlg").hidden = false;
    const line = t.lines[t.i];
    $("dlg-name").textContent = line.name;
    $("dlg-text").textContent = line.text;
    const bust = $("dlg-bust");
    const src = line.who === "mao" ? "assets/bust_mao.webp" : line.who === "guan" ? "assets/bust_guan.webp" : line.who === "tea" ? "" : "assets/bust_wei.webp";
    if (src) { bust.src = src; bust.hidden = false; }
    else { bust.removeAttribute("src"); bust.hidden = true; }
    const last = t.i >= t.lines.length - 1;
    $("dlg-hint").hidden = last && t.choices;
    $("choices").hidden = !(last && t.choices);
    $("choices").innerHTML = "";
    if (last && t.choices) {
      t.choices.forEach((c, idx) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "choice";
        b.textContent = c.t;
        b.addEventListener("click", () => pickChoice(c));
        $("choices").appendChild(b);
      });
    }
  }
  function advanceTalk() {
    const t = state.talk;
    if (!t) return;
    if (t.i < t.lines.length - 1) {
      t.i++;
      renderTalk();
      return;
    }
    if (t.choices) return;
    const after = t.after;
    state.talk = null;
    renderTalk();
    hud();
    if (after) after();
  }
  function pickChoice(c) {
    state.talk = null;
    renderTalk();
    if (c.go === "moretea") {
      openTalk([{ who: "tea", name: "茶博士", text: "还有人说，天地会的朋友个个是英雄好汉。为人不识陈近南，就称英雄也枉然。" }]);
      return;
    }
    if (c.go === "togate") {
      const n = npcs().find((x) => x.id === "gate");
      if (n) goInteract(n);
      hud();
      return;
    }
    if (c.go === "loyal") {
      openTalk([
        { who: "wei", name: "韦小宝", text: "有福同享，有难同当。我跟你一块儿。" },
        { who: "mao", name: "茅十八", text: "好。我姓茅，茅草之茅，不是毛虫之虫，排行第十八。" },
      ], null, joinAndFight);
      return;
    }
    if (c.go === "greed") {
      openTalk([
        { who: "wei", name: "韦小宝", text: "白花花的银子，谁不爱？可出卖朋友，还讲什么江湖义气？" },
        { who: "mao", name: "茅十八", text: "这话中听。小娃娃，一起打。" },
      ], null, joinAndFight);
      return;
    }
    if (c.go === "flee") {
      openTalk([
        { who: "mao", name: "茅十八", text: "你既开口了，就别做缩头乌龟。" },
        { who: "wei", name: "韦小宝", text: "辣块妈妈。相干。有难同当。" },
      ], null, joinAndFight);
    }
  }
  function joinAndFight() {
    state.flags.met = 1;
    if (!state.party.includes("mao")) state.party.push("mao");
    state.stats.exp += 8;
    startBattle();
  }

  function fade(fn) {
    document.body.classList.add("fading");
    setTimeout(() => { fn(); document.body.classList.remove("fading"); }, FAST ? 20 : 240);
  }

  function clickMap(ev) {
    if (state.talk || state.battle || state.panel || state.menu) return;
    const r = $("view").getBoundingClientRect();
    const scale = r.width / 844;
    const px = (ev.clientX - r.left) / scale;
    const py = (ev.clientY - r.top) / scale;
    if (px < VIEW.x || py < VIEW.y || px > VIEW.x + VIEW.w || py > VIEW.y + VIEW.h) return;
    const [cx, cy] = cam();
    const mx = px - VIEW.x + cx;
    const my = py - VIEW.y + cy;
    let tx = Math.floor(mx / TILE);
    let ty = Math.floor(my / TILE);
    if (!walkAt(state.map, tx, ty)) {
      const n = nearestWalk(state.map, tx, ty);
      if (Math.abs(n[0] - tx) + Math.abs(n[1] - ty) > 2) return;
      tx = n[0]; ty = n[1];
    }
    const hit = npcs().find((n) => !n.hidden && n.x === tx && n.y === ty);
    const path = astar(state.map, state.x, state.y, tx, ty);
    if (!path) return;
    state.path = path;
    state.pending = hit ? hit.id : null;
    if (state.sta > 10 && path.length > 6) state.sta -= 1;
  }

  function cam() {
    const pd = playerDraw(performance.now());
    const px = (pd.x + 0.5) * TILE;
    const py = (pd.y + 0.35) * TILE;
    let cx = px - VIEW.w / 2;
    let cy = py - VIEW.h / 2;
    cx = Math.max(0, Math.min(MAPW - VIEW.w, cx));
    cy = Math.max(0, Math.min(MAPH - VIEW.h, cy));
    return [cx, cy];
  }

  function stepMove() {
    if (!state.path.length || state.talk || state.battle) return;
    const [nx, ny] = state.path.shift();
    const dx = nx - state.x;
    const dy = ny - state.y;
    state.flip = dx < 0;
    if (Math.abs(dx) > Math.abs(dy)) state.facing = dx > 0 ? "right" : "left";
    else if (dy > 0) state.facing = "down";
    else if (dy < 0) state.facing = "up";
    state.trail.push([state.x, state.y]);
    if (state.trail.length > 6) state.trail.shift();
    state.moveFrom = { x: state.x, y: state.y };
    state.moveStart = performance.now();
    state.x = nx; state.y = ny;
    state.moving = true;
    if (!state.path.length) {
      const id = state.pending;
      state.pending = null;
      hud();
      if (id) {
        const n = npcs().find((p) => p.id === id);
        if (n) interact(n);
      }
    }
  }
  function playerDraw(now) {
    const dur = state.fast ? 40 : 140;
    let x = state.x;
    let y = state.y;
    let moving = state.path.length > 0;
    if (state.moveFrom) {
      const u = Math.min(1, (now - state.moveStart) / dur);
      x = state.moveFrom.x + (state.x - state.moveFrom.x) * u;
      y = state.moveFrom.y + (state.y - state.moveFrom.y) * u;
      if (u < 1) moving = true;
      else if (!state.path.length) state.moving = false;
    }
    return { x, y, frame: moving ? Math.floor(now / 110) % 4 : 1, moving };
  }
  function mover(id) {
    if (!state.movers) {
      state.movers = {
        guan: { x: 22, y: 13, facing: "right", frame: 0, i: 0, leg: [[23, 13], [24, 13], [25, 13], [26, 13], [25, 13], [24, 13], [23, 13], [22, 13]] },
        guan2: { x: 26, y: 16, facing: "left", frame: 2, i: 0, leg: [[25, 16], [24, 16], [23, 16], [22, 16], [23, 16], [24, 16], [25, 16], [26, 16]] },
      };
    }
    return state.movers[id];
  }
  function stepMovers(now) {
    if (state.map !== "lichun" || state.battle || state.flags.won || state.talk) return;
    ["guan", "guan2"].forEach((id) => {
      const m = mover(id);
      if (!m.nextAt) m.nextAt = now + 200;
      if (now < m.nextAt) return;
      m.nextAt = now + 200;
      const step = m.leg[m.i % m.leg.length];
      m.i++;
      const nx = step[0];
      const ny = step[1];
      const dx = nx - m.x;
      const dy = ny - m.y;
      if (dx || dy) m.facing = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
      m.from = { x: m.x, y: m.y };
      m.t0 = now;
      m.x = nx;
      m.y = ny;
      m.frame = (m.frame + 1) % 4;
    });
  }
  function moverDraw(id, now) {
    const m = mover(id);
    const dur = 200;
    let x = m.x;
    let y = m.y;
    if (m.from && m.t0) {
      const u = Math.min(1, ((now || performance.now()) - m.t0) / dur);
      x = m.from.x + (m.x - m.from.x) * u;
      y = m.from.y + (m.y - m.from.y) * u;
    }
    return { x, y, facing: m.facing, frame: Math.floor((now || 0) / 110) % 4 };
  }

  function walkCell(who) {
    const sheet = img["walk_" + who];
    if (!sheet) return null;
    return { sheet, w: sheet.width / 4, h: sheet.height / 4 };
  }
  function drawSheet(ctx, who, dir, frame, footx, footy) {
    const cell = walkCell(who);
    if (!cell) return;
    const row = Math.max(0, DIRS.indexOf(dir));
    const col = ((frame % 4) + 4) % 4;
    const dh = SPRITE_H;
    const dw = dh * (cell.w / cell.h);
    ctx.drawImage(cell.sheet, col * cell.w, row * cell.h, cell.w, cell.h, footx - dw / 2, footy - dh + 4, dw, dh);
  }
  function drawBody(ctx, who, footx, footy) {
    const im = img[who];
    if (!im) return;
    const h = SPRITE_H;
    const w = h * (im.width / im.height);
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(footx, footy, w * 0.32, 3.2, 0, 0, 7);
    ctx.fill();
    ctx.drawImage(im, footx - w / 2, footy - h, w, h);
  }
  function drawWalkDemo() {
    const ctx = $("view").getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#2c3238";
    ctx.fillRect(0, 0, 844, 390);
    ctx.fillStyle = "#f0e2c8";
    ctx.font = "14px KaiTi, STKaiti, serif";
    const names = [["wei", "韦小宝"], ["mao", "茅十八"], ["guan", "官差"]];
    const labs = ["下", "左", "右", "上"];
    names.forEach((pair, ni) => {
      const cell = walkCell(pair[0]);
      if (!cell) return;
      const y0 = 4 + ni * 128;
      ctx.fillText(pair[1], 8, y0 + 16);
      const dw = 44;
      const dh = Math.round(dw * (cell.h / cell.w));
      const step = dw + 2;
      labs.forEach((lab, di) => {
        const x0 = 72 + di * (step * 4 + 6);
        ctx.fillText(lab, x0, y0 + 12);
        for (let f = 0; f < 4; f++) {
          ctx.drawImage(cell.sheet, f * cell.w, di * cell.h, cell.w, cell.h, x0 + f * step, y0 + 16, dw, dh);
        }
      });
    });
  }
  function drawWorld(t) {
    if (state.walkDemo) { drawWalkDemo(); return; }
    if (state.battle) return;
    const ctx = $("view").getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, 844, 390);
    ctx.fillStyle = "#1a140f";
    ctx.fillRect(0, 0, 844, 390);
    const mapImg = state.map === "yangzhou" ? img.map_yangzhou : img.map_lichun;
    if (!mapImg) return;
    const [cx, cy] = cam();
    ctx.save();
    ctx.beginPath();
    ctx.rect(VIEW.x, VIEW.y, VIEW.w, VIEW.h);
    ctx.clip();
    ctx.drawImage(mapImg, VIEW.x - cx, VIEW.y - cy);
    if (state.night) {
      ctx.fillStyle = "rgba(8,10,20,0.45)";
      ctx.fillRect(VIEW.x, VIEW.y, VIEW.w, VIEW.h);
      ctx.globalCompositeOperation = "screen";
      const g = ctx.createRadialGradient(VIEW.x + 200, VIEW.y + 80, 10, VIEW.x + 200, VIEW.y + 80, 90);
      g.addColorStop(0, "rgba(255,140,60,0.35)");
      g.addColorStop(1, "rgba(255,140,60,0)");
      ctx.fillStyle = g;
      ctx.fillRect(VIEW.x, VIEW.y, VIEW.w, VIEW.h);
      ctx.globalCompositeOperation = "source-over";
    }
    const actors = [];
    const pd = playerDraw(t || performance.now());
    actors.push({ who: "wei", x: pd.x, y: pd.y, facing: state.facing, frame: pd.frame, moving: pd.moving });
    if (state.party.includes("mao") && !state.battle) {
      const tr = state.trail.length ? state.trail[state.trail.length - 1] : [state.x, state.y];
      const prev = state.trail.length > 1 ? state.trail[state.trail.length - 2] : [state.x, state.y];
      const fdx = tr[0] - prev[0];
      const fdy = tr[1] - prev[1];
      let face = state.facing;
      if (fdx || fdy) face = Math.abs(fdx) >= Math.abs(fdy) ? (fdx > 0 ? "right" : "left") : (fdy > 0 ? "down" : "up");
      actors.push({ who: "mao", x: tr[0], y: tr[1], facing: face, frame: pd.frame, moving: pd.moving });
    }
    npcs().forEach((n) => {
      if (n.hidden) return;
      if (n.who === "mao" && state.party.includes("mao")) return;
      if (n.id === "guan" || n.id === "guan2") {
        const mv = moverDraw(n.id, t || performance.now());
        actors.push({ who: "guan", x: mv.x, y: mv.y, facing: mv.facing, frame: mv.frame, moving: true, npc: n });
      } else if (n.who === "mao" || n.who === "guan") {
        actors.push({ who: n.who, x: n.x, y: n.y, facing: n.facing || "down", frame: n.frame || 1, moving: true, npc: n });
      } else actors.push({ who: null, x: n.x, y: n.y, npc: n });
    });
    actors.sort((a, b) => a.y - b.y);
    actors.forEach((a) => {
      const footx = (a.x + 0.5) * TILE - cx + VIEW.x;
      const footy = (a.y + 1) * TILE - 8 - cy + VIEW.y;
      if (a.who && img["walk_" + a.who]) drawSheet(ctx, a.who, a.facing || "down", a.moving ? a.frame : 1, footx, footy);
      else if (a.who) drawBody(ctx, a.who, footx, footy);
      if (a.npc) drawMark(ctx, footx, footy - SPRITE_H - 6, a.npc);
    });
    ctx.restore();
  }
  function drawMark(ctx, x, y, n) {
    const bust = n.who === "mao" ? img.bust_mao : n.who === "guan" ? img.bust_guan : null;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, 7);
    ctx.fillStyle = "#5c4030";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#f3ead7";
    ctx.stroke();
    if (bust) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, 7);
      ctx.clip();
      ctx.drawImage(bust, x - 9, y - 11, 18, 22);
      ctx.restore();
    } else {
      ctx.fillStyle = "#f3ead7";
      ctx.font = "12px KaiTi, serif";
      ctx.textAlign = "center";
      ctx.fillText(n.who === "gate" ? "院" : "茶", x, y + 4);
    }
    if (n.bang) {
      ctx.fillStyle = "#f0d060";
      ctx.font = "bold 14px KaiTi, serif";
      ctx.textAlign = "left";
      ctx.fillText("!", x + 10, y - 6);
    }
    ctx.restore();
  }

  function openPanel(name) {
    if (state.battle) return;
    state.panel = name;
    state.menu = false;
    $("menu-pop").hidden = true;
    $("tip").hidden = true;
    const titles = { role: "属性", bag: "包袱", skill: "武功", form: "布阵", art: "技艺", note: "记事", map: "地图" };
    $("roller-title").textContent = titles[name] || "属性";
    $("panel").hidden = false;
    renderPaper();
    renderPartyCol();
    hud();
  }
  function closePanel() {
    state.panel = null;
    $("panel").hidden = true;
    $("tip").hidden = true;
    hud();
  }
  function renderPartyCol() {
    const box = $("party-col");
    box.innerHTML = "";
    ["wei", "mao"].forEach((id) => {
      const on = state.party.includes(id);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pcard" + (on ? "" : " off");
      const imgEl = document.createElement("img");
      imgEl.src = id === "wei" ? "assets/bust_wei.webp" : "assets/bust_mao.webp";
      imgEl.alt = "";
      const name = document.createElement("b");
      name.textContent = id === "wei" ? "韦小宝" : "茅十八";
      b.appendChild(imgEl);
      b.appendChild(name);
      if (on && state.focus === id) {
        const z = document.createElement("i");
        z.className = "zhan";
        z.textContent = "战";
        b.appendChild(z);
      }
      b.addEventListener("click", () => {
        if (!on) return;
        state.focus = id;
        renderPaper();
        renderPartyCol();
      });
      box.appendChild(b);
    });
  }
  function renderPaper() {
    const p = $("paper");
    const name = state.panel;
    if (name === "role") p.innerHTML = roleHTML();
    else if (name === "bag") p.innerHTML = bagHTML();
    else if (name === "skill") p.innerHTML = skillHTML();
    else if (name === "form") p.innerHTML = formHTML();
    else if (name === "art") p.innerHTML = artHTML();
    else if (name === "note") p.innerHTML = noteHTML();
    else if (name === "map") p.innerHTML = mapHTML();
    p.querySelectorAll("[data-stat]").forEach((b) => b.addEventListener("click", () => addStat(b.dataset.stat)));
    p.querySelectorAll("[data-item]").forEach((b) => b.addEventListener("click", () => showTip(b.dataset.item)));
    p.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => {
      const m = b.dataset.go;
      if (m === "lichun" && !state.flags.lichun) return;
      fade(() => {
        state.map = m === "lichun" ? "lichun" : "yangzhou";
        const sp = m === "lichun" ? nearestWalk("lichun", 16, 13) : nearestWalk("yangzhou", 10, 8);
        state.x = sp[0]; state.y = sp[1]; state.path = [];
        closePanel();
      });
    }));
    const train = p.querySelector("#train");
    if (train) train.addEventListener("click", () => {
      const who = state.focus === "mao" ? "mao" : "wei";
      const cost = 4;
      if (state.stats.yueli < cost) return;
      state.stats.yueli -= cost;
      state.stats.exp += 6;
      levelUp();
      renderPaper();
    });
  }
  function levelUp() {
    const s = state.stats;
    while (s.exp >= s.next && s.lv < 9) {
      s.exp -= s.next;
      s.lv++;
      s.next = Math.round(s.next * 1.4);
      s.points++;
      state.hpMax.wei += 6;
      state.hp.wei = state.hpMax.wei;
    }
  }
  function addStat(k) {
    if (state.stats.points <= 0) return;
    state.stats.points--;
    state.stats[k]++;
    if (k === "li") { state.hpMax.wei += 3; state.hp.wei = state.hpMax.wei; }
    renderPaper();
  }
  function roleHTML() {
    const id = state.focus === "mao" && state.party.includes("mao") ? "mao" : "wei";
    const s = state.stats;
    const eq = id === "mao"
      ? [["weapon", "单刀"], ["cloth", "灰布短打"], ["belt", "布带"], ["shoe", "裹脚"], ["hidden", "空"], ["trinket", "头巾"]]
      : [["weapon", ownedEq("dagger") ? "匕首" : "空"], ["cloth", "蓝布短褂"], ["belt", "布带"], ["shoe", "布鞋"], ["hidden", "空"], ["trinket", "空"]];
    const left = eq.slice(0, 3).map((e) => slotBtn(e[0], e[1])).join("");
    const right = eq.slice(3).map((e) => slotBtn(e[0], e[1])).join("");
    const face = id === "mao" ? "assets/mao.webp" : "assets/wei.webp";
    const nm = id === "mao" ? "茅十八" : "韦小宝";
    const rows = [
      ["等级", s.lv],
      ["臂力", s.li, "li"],
      ["身法", s.shen, "shen"],
      ["根骨", s.gen, "gen"],
      ["机灵", s.ji, "ji"],
      ["气血", state.hp[id] + "/" + state.hpMax[id]],
      ["内力", id === "mao" ? "40/40" : "18/18"],
      ["阅历", s.yueli],
    ];
    const attr = rows.map((r) => {
      const plus = r[2] && s.points > 0 ? `<button type="button" class="plus-sm" data-stat="${r[2]}">+</button>` : "";
      return `<div class="row"><span>◆ ${r[0]}</span><span>${r[1]} ${plus}</span></div>`;
    }).join("");
    const pct = Math.round((s.exp / s.next) * 100);
    return `<div class="role">
      <div class="slots">${left}</div>
      <div class="fig"><img src="${face}" alt=""><div>${nm}</div></div>
      <div class="slots">${right}</div>
      <div class="attrs">
        <h3>${nm}</h3>
        <div class="ok">状态 全盛</div>
        ${attr}
        <div class="row"><span>◆ 经验</span><span>${s.exp}/${s.next}</span></div>
        <div class="expbar"><i style="width:${pct}%"></i></div>
        <div class="row"><span>可分配</span><span>${s.points}</span></div>
      </div>
    </div>`;
  }
  function slotBtn(slot, label) {
    const item = slot === "weapon" && label === "匕首" ? "dagger" : slot === "cloth" && label === "蓝布短褂" ? "cloth" : slot === "weapon" && label === "单刀" ? "dao" : "";
    return `<button type="button" class="slot" data-item="${item}"><em>${slotName(slot)}</em>${label}</button>`;
  }
  function slotName(s) {
    return { weapon: "武器", cloth: "衣服", belt: "腰带", shoe: "鞋子", hidden: "暗器", trinket: "饰物" }[s] || s;
  }
  function ownedEq(id) { return state.own[id]; }
  function bagHTML() {
    const ids = Object.keys(state.own).filter((id) => state.own[id] > 0);
    return `<div class="bag">${ids.map((id) => {
      const it = ITEMS[id];
      return `<button type="button" data-item="${id}"><b>${it.name} ×${state.own[id]}</b><span>${it.eq ? "已装备" : "点击查看"}</span></button>`;
    }).join("")}</div>`;
  }
  function skillHTML() {
    const who = state.focus === "mao" && state.party.includes("mao") ? "mao" : "wei";
    const list = SK[who];
    return `<div class="list"><h3 style="font-family:var(--kai);letter-spacing:0.2em;text-align:center">${who === "mao" ? "茅十八" : "韦小宝"} · 武功</h3>
      ${list.map((s, i) => `<div class="row"><div><b>${s.name}</b><div>主动 · 第${["一", "一", "二", "一"][i] || "一"}重 · 聚气 ${s.qi}</div><div>${s.line}</div></div></div>`).join("")}
      <button type="button" class="mini" id="train">温习（阅历 4）</button></div>`;
  }
  function formHTML() {
    return `<div class="list"><p>出战顺序。点右侧头像上的「战」，就是当前看着的人。</p>
      ${state.party.map((id, i) => `<div class="row"><span>${i + 1}</span><span>${id === "wei" ? "韦小宝" : "茅十八"}</span></div>`).join("")}
      ${state.party.includes("mao") ? "<p>茅十八已入队。扬州这一战，两人并肩。</p>" : "<p>还是一个人。丽春院里也许能遇上同路的。</p>"}
    </div>`;
  }
  function artHTML() {
    return `<div class="list">
      <div class="row"><span>◆ 听书</span><span>3</span></div>
      <div class="row"><span>◆ 市井口才</span><span>4</span></div>
      <div class="row"><span>◆ 赌术</span><span>1</span></div>
      <p>技艺慢慢长。这一段先用嘴和匕首。</p>
    </div>`;
  }
  function noteHTML() {
    return `<div class="list">
      <div class="row"><div><b>鸣玉坊</b><div>${state.flags.lichun ? "已进丽春院。" : "坊南坊北不太平，先去丽春院。"}</div></div></div>
      <div class="row"><div><b>茅十八</b><div>${state.flags.won ? "官差退了。他要往北。" : state.flags.met ? "正在跟官差动手。" : "榜上的人，赏银二千两。"}</div></div></div>
      <div class="row"><div><b>未完</b><div>鳌拜、皇宫，都不在这一段里。</div></div></div>
    </div>`;
  }
  function mapHTML() {
    return `<div class="list">
      <div class="row"><span>扬州</span><button type="button" class="mini" data-go="yangzhou">前往</button></div>
      <div class="row"><span>丽春院</span><button type="button" class="mini" data-go="lichun">${state.flags.lichun ? "前往" : "未到"}</button></div>
      <p>格子上走。坐标写在右栏。</p>
    </div>`;
  }
  function showTip(id) {
    if (!id || !ITEMS[id]) {
      if (!id) return;
    }
    const it = ITEMS[id];
    if (!it) return;
    const tip = $("tip");
    tip.hidden = false;
    tip.innerHTML = `<h3></h3><p class="k">基础属性</p><p class="v"></p><p class="k">附加属性</p><p class="v"></p><p class="k">特殊效果</p><p class="v"></p><div class="btns"><button type="button" id="tip-eq">装备</button><button type="button" id="tip-drop">丢弃</button></div>`;
    tip.querySelector("h3").textContent = it.name;
    tip.querySelectorAll(".v")[0].textContent = it.base;
    tip.querySelectorAll(".v")[1].textContent = it.extra;
    tip.querySelectorAll(".v")[2].textContent = it.special;
    $("tip-eq").addEventListener("click", () => {
      if (it.heal) {
        state.hp.wei = Math.min(state.hpMax.wei, state.hp.wei + it.heal);
        state.own[id]--;
        if (state.own[id] <= 0) delete state.own[id];
      } else if (it.slot) {
        it.eq = true;
      }
      tip.hidden = true;
      renderPaper();
      save();
    });
    $("tip-drop").addEventListener("click", () => {
      if (id === "dagger") return;
      state.own[id] = (state.own[id] || 1) - 1;
      if (state.own[id] <= 0) delete state.own[id];
      tip.hidden = true;
      renderPaper();
    });
  }

  function startBattle() {
    const mk = (id, side, who, name, hp, atk, def, spd, slot) => ({
      id, side, who, name, hp, hpMax: hp, atk, def, spd, slot, qi: side === "ally" ? 46 : 20, weak: false, blind: 0,
    });
    state.battle = {
      round: 1,
      lock: false,
      active: "wei",
      i: 1,
      units: [
        mk("wei", "ally", "wei", "韦小宝", state.hp.wei, 14 + state.stats.li * 0.3, 4, 12, 0),
        mk("mao", "ally", "mao", "茅十八", state.hp.mao, 26, 8, 10, 1),
        mk("g1", "enemy", "guan", "官差", 76, 15, 5, 9, 0),
        mk("g2", "enemy", "guan", "官差", 70, 14, 5, 8, 1),
        mk("g3", "enemy", "guan", "官差头", 88, 17, 6, 8, 2),
      ],
    };
    state.talk = null;
    renderTalk();
    $("battle").hidden = false;
    $("battle-bg").src = "assets/bg_alley.webp";
    hud();
    renderBattle();
    if (params.get("shot") === "battle") {
      setTimeout(() => playerSkill("wei", "dagger"), 80);
    }
  }
  function renderBattle() {
    const b = state.battle;
    if (!b) return;
    $("b-round").textContent = "回合 " + b.round + "/99";
    const box = $("b-units");
    box.innerHTML = "";
    const posA = [[150, 292], [270, 300]];
    const posE = [[540, 300], [660, 292], [770, 304]];
    b.units.forEach((u) => {
      if (u.hp <= 0) return;
      const pos = u.side === "ally" ? posA[u.slot] : posE[u.slot];
      const el = document.createElement("div");
      el.className = "unit" + (u.side === "enemy" ? " flip" : "");
      el.id = "u-" + u.id;
      el.style.left = (pos[0] - 40) + "px";
      el.style.top = (pos[1] - 200) + "px";
      const buff = (u.weak ? "<i class='bf bf-ruo'>弱</i>" : "") + (u.blind ? "<i class='bf bf-mang'>盲</i>" : "") + (u.who === "mao" ? "<i class='bf bf-hu'>护</i>" : "");
      el.innerHTML = `<div class="uname"></div><div class="buffs">${buff}</div><div class="hp"><i></i></div><div class="qibar">${qiSeg(u.qi)}</div><img alt="">`;
      el.querySelector(".uname").textContent = u.name;
      el.querySelector(".hp i").style.width = Math.max(0, u.hp / u.hpMax * 100) + "%";
      const im = el.querySelector("img");
      im.src = u.who === "wei" ? "assets/wei.webp" : u.who === "mao" ? "assets/mao.webp" : "assets/guan.webp";
      box.appendChild(el);
    });
    const bar = $("b-skills");
    bar.innerHTML = "";
    b.units.filter((u) => u.side === "ally" && u.hp > 0).forEach((u) => {
      const wrap = document.createElement("div");
      wrap.className = "skillset";
      const vn = document.createElement("div");
      vn.className = "vname";
      vn.textContent = u.name;
      const col = document.createElement("div");
      col.className = "slots-row";
      const row = document.createElement("div");
      row.className = "srow";
      SK[u.who].forEach((sk) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "sbtn";
        btn.disabled = b.lock || b.active !== u.id || u.qi < sk.qi;
        btn.innerHTML = "<span></span>" + (sk.qi ? "<small></small>" : "");
        btn.querySelector("span").textContent = sk.name.slice(0, 2);
        if (sk.qi) btn.querySelector("small").textContent = sk.qi;
        btn.addEventListener("click", () => playerSkill(u.id, sk.id));
        row.appendChild(btn);
      });
      const under = document.createElement("div");
      under.className = "qiunder";
      under.innerHTML = qiSeg(u.qi);
      col.appendChild(row);
      col.appendChild(under);
      wrap.appendChild(vn);
      wrap.appendChild(col);
      bar.appendChild(wrap);
    });
  }
  function qiSeg(qi) {
    const n = Math.round(qi / 10);
    let s = "";
    for (let i = 0; i < 10; i++) s += `<i class="${i < n ? "on" : ""}"></i>`;
    return s;
  }
  function playerSkill(id, sid) {
    const b = state.battle;
    if (!b || b.lock) return;
    const u = b.units.find((x) => x.id === id);
    const sk = SK[u.who].find((s) => s.id === sid);
    if (!u || !sk || u.qi < sk.qi || b.active !== id) return;
    b.lock = true;
    u.qi -= sk.qi;
    resolveSkill(u, sk, () => {
      b.lock = false;
      if (endCheck()) return;
      advanceTurn();
    });
  }
  function enemyAct(u) {
    const b = state.battle;
    if (!b || u.hp <= 0) { advanceTurn(); return; }
    const list = SK.guan;
    const sk = u.qi >= 30 && Math.random() < 0.45 ? list[1] : list[0];
    if (sk.qi) u.qi -= sk.qi;
    b.lock = true;
    resolveSkill(u, sk, () => {
      b.lock = false;
      if (endCheck()) return;
      advanceTurn();
    });
  }
  function unitLeft(u) {
    const pos = (u.side === "ally" ? [[150, 292], [270, 300]] : [[540, 300], [660, 292], [770, 304]])[u.slot];
    return pos[0] - 40;
  }
  function resolveSkill(user, sk, done) {
    callout(sk.name);
    const foes = state.battle.units.filter((u) => u.hp > 0 && u.side !== user.side);
    if (!foes.length) { done(); return; }
    const targets = sk.aoe ? foes : [foes[0]];
    const el = $("u-" + user.id);
    const big = sk.qi > 0 || sk.aoe;
    if (el) {
      const dest = unitLeft(targets[0]) + (user.side === "ally" ? -86 : 78);
      const delta = dest - unitLeft(user);
      el.style.zIndex = "4";
      el.style.transition = "transform 0.11s ease-in";
      el.style.transform = "translate3d(" + delta + "px,0,0)";
      slashTravel(user, targets[0], big);
    }
    const hit = () => {
      const missed = user.blind && Math.random() < 0.4 && params.get("shot") !== "battle";
      const root = $("battle");
      if (missed) {
        floatNum("失误", targets[0], { miss: true });
      } else {
        let killed = false;
        targets.forEach((tg, i) => {
          const weak = user.weak ? 0.8 : 1;
          let d = Math.max(1, Math.round((user.atk * sk.mult - tg.def * 0.3) * weak * (0.92 + Math.random() * 0.16)));
          const crit = params.get("shot") === "battle" ? i === 0 : sk.qi > 0 && Math.random() < 0.3;
          if (crit) d = Math.round(d * 1.7);
          tg.hp = Math.max(0, tg.hp - d);
          if (tg.hp <= 0) killed = true;
          if (sk.weak) tg.weak = true;
          if (sk.blind) tg.blind = 2;
          floatNum(String(d), tg, { crit, stack: i });
          const tel = $("u-" + tg.id);
          if (tel) {
            tel.classList.remove("flash");
            void tel.offsetWidth;
            tel.classList.add("flash");
            if (tg.hp <= 0) tel.classList.add("dead");
            if (params.get("shot") === "battle") tel.classList.add("lit");
          }
          slashAt(tg, big);
        });
        if (user.who === "mao" && user.hp < user.hpMax && !user.healed) {
          user.healed = true;
          const heal = 12;
          user.hp = Math.min(user.hpMax, user.hp + heal);
          floatNum("+" + heal, user, { heal: true, stack: 1 });
        }
        if (params.get("shot") === "battle") {
          const mao = state.battle.units.find((u) => u.id === "mao");
          if (mao) floatNum("+16", mao, { heal: true, stack: 0 });
        }
        root._killed = killed;
      }
      syncBars();
      root.classList.remove("shake", "shake-sm", "hitflash");
      void root.offsetWidth;
      root.classList.add(big ? "shake" : "shake-sm", "hitflash");
      if (params.get("shot") === "battle") return;
      if (el) {
        el.style.transition = "transform 0.16s ease-out";
        el.style.transform = "translate3d(0,0,0)";
      }
      const wait = state.fast ? 40 : (root._killed ? 640 : 420);
      setTimeout(done, wait);
    };
    setTimeout(hit, state.fast ? 30 : 120);
  }
  function syncBars() {
    if (!state.battle) return;
    state.battle.units.forEach((u) => {
      const el = $("u-" + u.id);
      if (!el) return;
      const bar = el.querySelector(".hp i");
      if (bar) bar.style.width = Math.max(0, (u.hp / u.hpMax) * 100) + "%";
      const q = el.querySelector(".qibar");
      if (q) q.innerHTML = qiSeg(u.qi);
    });
  }
  function callout(name) {
    const el = $("b-call");
    el.textContent = name;
    el.classList.remove("on");
    void el.offsetWidth;
    el.classList.add("on");
  }
  function floatNum(text, unit, opt) {
    opt = opt || {};
    const posA = [[150, 292], [270, 300]];
    const posE = [[540, 300], [660, 292], [770, 304]];
    const pos = unit.side === "ally" ? posA[unit.slot] : posE[unit.slot];
    const n = document.createElement("div");
    n.className = opt.heal ? "heal" : opt.miss ? "dmg miss" : opt.crit ? "dmg crit" : "dmg normal";
    n.textContent = text;
    n.style.left = (pos[0] - 10 + (opt.stack || 0) * 22) + "px";
    n.style.top = (pos[1] - 132 - (opt.stack || 0) * 18) + "px";
    $("battle").appendChild(n);
    if (opt.crit) {
      const tag = document.createElement("div");
      tag.className = "crit-tag";
      tag.textContent = "暴击";
      tag.style.left = (pos[0] - 36) + "px";
      tag.style.top = (pos[1] - 172) + "px";
      $("battle").appendChild(tag);
      setTimeout(() => tag.remove(), params.get("shot") === "battle" ? 20000 : 1300);
    }
    setTimeout(() => n.remove(), params.get("shot") === "battle" ? 20000 : 1300);
  }
  function unitPoint(unit) {
    const pos = (unit.side === "ally" ? [[150, 292], [270, 300]] : [[540, 300], [660, 292], [770, 304]])[unit.slot];
    return { x: pos[0], y: pos[1] - 100 };
  }
  function slashTravel(user, target, big) {
    const a = unitPoint(user);
    const b = unitPoint(target);
    for (let i = 0; i < 2; i++) {
      const t = 0.45 + i * 0.2;
      sparks.push({
        kind: "slash",
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t - 10,
        len: big ? 70 : 46,
        rot: -0.8 + i * 0.5,
        life: 0.9,
        wide: false,
      });
    }
  }
  function slashAt(unit, big) {
    const p = unitPoint(unit);
    const x = p.x;
    const y = p.y;
    const n = big ? 6 : 3;
    for (let i = 0; i < n; i++) {
      sparks.push({
        kind: "ink",
        x: x + (Math.random() - 0.45) * (big ? 220 : 50),
        y: y + (Math.random() - 0.5) * (big ? 150 : 40),
        vx: 0,
        vy: 0,
        r: big ? 28 + Math.random() * 70 : 8 + Math.random() * 14,
        life: 1,
      });
    }
    const strokes = big ? 2 : 1;
    for (let i = 0; i < strokes; i++) {
      sparks.push({
        kind: "slash",
        x: x - 10,
        y: y + i * 8,
        len: big ? 210 : 78,
        rot: -0.95 + i * 0.85,
        life: 1,
        wide: big,
      });
    }
    if (sparks.length > 16) sparks.splice(0, sparks.length - 16);
  }
  function advanceTurn() {
    const b = state.battle;
    if (!b) return;
    let guard = 0;
    while (guard++ < 8) {
      const u = b.units[b.i % b.units.length];
      b.i++;
      if (b.i % b.units.length === 0) b.round = Math.min(99, b.round + 1);
      if (u.hp <= 0) continue;
      u.qi = Math.min(100, u.qi + 36);
      if (u.blind) u.blind--;
      b.active = u.id;
      renderBattle();
      if (u.side === "enemy") setTimeout(() => enemyAct(u), state.fast ? 40 : 520);
      return;
    }
  }
  function endCheck() {
    const b = state.battle;
    if (!b.units.some((u) => u.side === "enemy" && u.hp > 0)) { winBattle(); return true; }
    if (!b.units.some((u) => u.side === "ally" && u.hp > 0)) { loseBattle(); return true; }
    return false;
  }
  function winBattle() {
    const b = state.battle;
    b.units.forEach((u) => { if (state.hp[u.id] != null) state.hp[u.id] = Math.max(1, u.hp); });
    state.battle = null;
    $("battle").hidden = true;
    state.flags.won = 1;
    state.wen += 350;
    state.stats.exp += 24;
    state.stats.yueli += 6;
    levelUp();
    hud();
    openTalk([
      { who: "mao", name: "茅十八", text: "韦兄弟，这一架打得漂亮。官差退了。" },
      { who: "wei", name: "韦小宝", text: "老鬼头，刀是你的，嘴是我的。石灰下次我还撒。" },
    ], null, showEnd);
    save();
  }
  function loseBattle() {
    state.battle = null;
    $("battle").hidden = true;
    state.hp.wei = state.hpMax.wei;
    state.hp.mao = state.hpMax.mao;
    openTalk([{ who: "mao", name: "茅十八", text: "还没死？起来。再打过。" }], null, startBattle);
  }
  function showEnd() {
    $("end").hidden = false;
    $("end-text").textContent = "茅十八还要往北，去会会那个鳌拜。皇宫、小桂子、康熙，都在后头。扬州丽春院这一架，先停在这里。";
    hud();
  }

  const sparks = [];
  function drawFx() {
    const canvas = $("fx");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 844, 390);
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      if (params.get("shot") !== "battle") p.life -= p.kind === "slash" ? 0.045 : 0.03;
      if (p.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      if (p.kind === "slash") {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot || 0);
        ctx.lineCap = "round";
        const len = p.len;
        ctx.fillStyle = p.wide ? "rgba(14,10,8,0.9)" : "rgba(20,14,10,0.88)";
        ctx.beginPath();
        ctx.moveTo(-len, 10);
        ctx.quadraticCurveTo(0, -len * 0.42, len * 0.92, -4);
        ctx.quadraticCurveTo(len * 0.15, -len * 0.12, -len * 0.55, p.wide ? 28 : 16);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(255,248,236,0.8)";
        ctx.lineWidth = p.wide ? 3 : 1.5;
        ctx.beginPath();
        ctx.moveTo(-len * 0.7, 8);
        ctx.quadraticCurveTo(0, -len * 0.28, len * 0.65, 0);
        ctx.stroke();
      } else {
        p.x += p.vx || 0;
        p.y += p.vy || 0;
        const g = ctx.createRadialGradient(p.x, p.y, p.r * 0.15, p.x, p.y, p.r);
        g.addColorStop(0, "rgba(10,8,6,0.82)");
        g.addColorStop(0.55, "rgba(18,14,12,0.45)");
        g.addColorStop(1, "rgba(18,14,12,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.r, p.r * 0.72, (p.x % 7) * 0.2, 0, 7);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  let moveAcc = 0;
  function loop(t) {
    raf = requestAnimationFrame(loop);
    if (!state || !masks) return;
    if (!state.battle) {
      moveAcc += state.fast ? 40 : 16;
      const step = state.fast ? 40 : 140;
      if (moveAcc > step) { moveAcc = 0; stepMove(); stepMovers(t || performance.now()); if (!state.path.length) hud(); }
      else stepMovers(t || performance.now());
      drawWorld(t || 0);
    } else if (sparks.length) drawFx();
  }

  function save() {
    try {
      const slim = {
        map: state.map, x: state.x, y: state.y, party: state.party, flags: state.flags,
        stats: state.stats, hp: state.hp, hpMax: state.hpMax, sta: state.sta, wen: state.wen,
        gold: state.gold, own: state.own, hour: state.hour, night: state.night, focus: state.focus,
      };
      localStorage.setItem(KEY, JSON.stringify(slim));
    } catch (e) { /* ignore */ }
  }
  function loadSave() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      Object.assign(state, s);
      state.path = [];
      state.trail = [];
      state.talk = null;
      state.battle = null;
      state.panel = null;
      return true;
    } catch (e) { return false; }
  }

  function bind() {
    $("view").addEventListener("pointerdown", clickMap);
    $("dlg").addEventListener("pointerdown", (e) => {
      if (e.target.closest("#choices")) return;
      advanceTalk();
    });
    $("panel-x").addEventListener("click", closePanel);
    $("sta-plus").addEventListener("click", () => { state.sta = Math.min(state.staMax, state.sta + 10); hud(); });
    $("gold-plus").addEventListener("click", () => { state.gold += 0; toast("金两不是这么来的"); });
    $("notice").addEventListener("click", () => toast("公告：扬州城捉拿茅十八，赏银二千两。"));
    $("end-back").addEventListener("click", () => { $("end").hidden = true; hud(); });
    document.querySelectorAll("#side .grid2 button").forEach((b) => {
      b.addEventListener("click", () => {
        const k = b.dataset.menu;
        if (k === "menu") {
          $("menu-pop").hidden = !$("menu-pop").hidden;
          if (!$("menu-pop").hidden) {
            $("menu-pop").innerHTML = "<button type='button' data-a='save'>存档</button><button type='button' data-a='load'>读档</button><button type='button' data-a='night'>昼夜</button>";
            $("menu-pop").querySelectorAll("button").forEach((x) => x.addEventListener("click", () => {
              const a = x.dataset.a;
              if (a === "save") { save(); toast("已记下"); }
              if (a === "load" && loadSave()) { toast("读回来了"); closePanel(); hud(); }
              if (a === "night") { state.night = !state.night; state.hour = state.night ? 4 : 2; hud(); }
              $("menu-pop").hidden = true;
            }));
          }
        } else if (k === "act") toast("坊里今日无集市");
        else if (k === "shop") toast("扬州的铺子，不兴这一套");
        else toast("茶馆便是社区");
      });
    });
    const dock = $("dock");
    DOCK.forEach(([id, label, icon]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = `<i class="ico">${icon()}</i><span></span>`;
      b.querySelector("span").textContent = label;
      b.addEventListener("click", () => openPanel(id));
      dock.appendChild(b);
    });
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    document.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") advanceTalk();
      if (e.key >= "1" && e.key <= "3" && state.talk && state.talk.choices && state.talk.i >= state.talk.lines.length - 1) {
        pickChoice(state.talk.choices[Number(e.key) - 1]);
      }
    });
  }
  function toast(msg) {
    const n = document.createElement("div");
    n.textContent = msg;
    n.style.cssText = "position:absolute;z-index:19;left:50%;top:46%;transform:translate(-50%,-50%);background:#f3ead7;border:1px solid #3c2a1e;padding:6px 12px;font-family:KaiTi,serif;letter-spacing:0.12em";
    $("app").appendChild(n);
    setTimeout(() => n.remove(), 1200);
  }
  function fit() {
    const portrait = window.innerHeight > window.innerWidth + 30;
    document.body.classList.toggle("portrait", portrait);
    if (portrait) return;
    const s = Math.min(window.innerWidth / 844, window.innerHeight / 390);
    $("app").style.transform = "scale(" + s + ")";
  }

  function personIcon() { return svg("<circle cx='12' cy='8' r='3.2' fill='#f3ead7'/><path d='M6 18c1-3 3-4.5 6-4.5S17 15 18 18' stroke='#f3ead7' fill='none' stroke-width='1.6'/>"); }
  function bagIcon() { return svg("<path d='M8 9h8v8H8z' fill='none' stroke='#f3ead7' stroke-width='1.4'/><path d='M10 9V7h4v2' fill='none' stroke='#f3ead7'/>"); }
  function swordIcon() { return svg("<path d='M6 16 L16 6 M14 6h3v3' stroke='#f3ead7' fill='none' stroke-width='1.6'/>"); }
  function flagIcon() { return svg("<path d='M8 5v12M8 6h7l-1.5 2L15 10H8' fill='#f3ead7'/>"); }
  function potIcon() { return svg("<path d='M8 10h8v5a4 4 0 0 1-8 0z' fill='none' stroke='#f3ead7'/><path d='M16 12h2' stroke='#f3ead7'/>"); }
  function bookIcon() { return svg("<path d='M7 6h10v10H7z' fill='none' stroke='#f3ead7'/><path d='M12 6v10' stroke='#f3ead7'/>"); }
  function mapIcon() { return svg("<path d='M6 7l4-1 4 2 4-1v10l-4 1-4-2-4 1z' fill='none' stroke='#f3ead7'/>"); }
  function svg(inner) { return `<svg viewBox="0 0 24 24">${inner}</svg>`; }

  function applyShot(shot) {
    state.flags.intro = 1;
    if (shot === "street") { hud(); return; }
    if (shot === "walk") { state.walkDemo = true; hud(); return; }
    if (shot === "lichun" || shot === "talk" || shot === "char" || shot === "battle" || shot === "end") {
      state.map = "lichun";
      state.flags.lichun = 1;
      const p = nearestWalk("lichun", 16, 13);
      state.x = p[0]; state.y = p[1];
    }
    if (shot === "talk") {
      openMao();
      state.talk.i = state.talk.lines.length - 1;
      renderTalk();
    }
    if (shot === "char") { state.party.push("mao"); openPanel("role"); }
    if (shot === "battle") { state.party.push("mao"); state.flags.met = 1; startBattle(); }
    if (shot === "end") {
      state.party.push("mao");
      state.flags.won = 1;
      state.flags.met = 1;
      showEnd();
    }
    hud();
  }

  function boot() {
    state = fresh();
    bind();
    fit();
    const shot = params.get("shot");
    Promise.all([
      load("map_yangzhou"), load("map_lichun"), load("bg_alley"),
      load("wei"), load("mao"), load("guan"),
      load("bust_wei"), load("bust_mao"), load("bust_guan"),
      load("walk_wei"), load("walk_mao"), load("walk_guan"),
      fetch("assets/masks.json").then((r) => r.json()),
    ]).then((all) => {
      masks = all[all.length - 1];
      if (shot) applyShot(shot);
      else {
        hud();
        openTalk([
          { who: "wei", name: "韦小宝", text: "扬州瘦西湖畔，鸣玉坊。丽春院是我娘当差的地方，我天天在这儿钻。" },
          { who: "wei", name: "韦小宝", text: "今儿坊里不太平。先去茶馆听听，再去丽春院看热闹。" },
        ]);
      }
      requestAnimationFrame(loop);
    }).catch((e) => {
      console.error(e);
      toast("画面没载上");
    });
  }
  function load(name) {
    return new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => { img[name] = im; res(im); };
      im.onerror = rej;
      im.src = "assets/" + name + ".webp";
    });
  }

  window.GY = {
    get state() { return state; },
    clickMap, interact, advanceTalk, pickChoice, openPanel, startBattle, playerSkill, npcs, astar,
  };
  boot();
})();
