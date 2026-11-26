/* Hard-edge chibi pixel art. Sprites are 48×64 (people) and drawn 1:1
   into a 352×288 bitmap, then shown at an integer CSS scale. No fog, no blur. */
(function () {
  "use strict";
  var S = 2;
  var OUT = "#1a1422";
  var tiles = {};
  var cache = {};
  var houses = {};

  function el(w, h) {
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }
  function R(g, x, y, w, h, col) {
    if (w <= 0 || h <= 0) return;
    g.fillStyle = col;
    g.fillRect(x | 0, y | 0, w | 0, h | 0);
  }
  function oval(g, cx, cy, rx, ry, col) {
    g.fillStyle = col;
    for (var y = -ry; y <= ry; y++) {
      var span = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
      if (span > 0) g.fillRect((cx - span) | 0, (cy + y) | 0, span * 2, 1);
    }
  }
  function block(g, x, y, w, h, fill) {
    R(g, x - 1, y - 1, w + 2, h + 2, OUT);
    R(g, x, y, w, h, fill);
  }

  var PEOPLE = {
    hero: { hair: "#14141c", hairM: "#2c3040", hairHi: "#8a93a8", skin: "#f6ebe4", skinSh: "#e2cfc4", robe: "#9aa3b4", robeHi: "#d5dbe6", robeSh: "#5e6778", inner: "#2a2e3a", scarf: "#f7f9fc", scarfSh: "#c5cedc", eye: "#1a1c28", tassel: true, long: true, glow: "#fff1a8" },
    hero_old: { hair: "#100e14", hairM: "#2a2430", hairHi: "#5a5060", skin: "#e8ddd6", skinSh: "#cbb8ae", robe: "#4a5160", robeHi: "#8b93a4", robeSh: "#2c313c", inner: "#16141c", scarf: "#a33a48", scarfSh: "#6a2430", eye: "#c44858", tassel: true, long: true },
    bnb: { hair: "#d5e0ec", hairM: "#aebdd0", hairHi: "#ffffff", skin: "#f8efea", skinSh: "#e4d0cc", robe: "#f4f7f8", robeHi: "#ffffff", robeSh: "#c9d8dc", inner: "#243044", trim: "#6eb8b0", trimSh: "#2f7d76", eye: "#2aa8c0", long: true, glow: "#9aecf6" },
    fangzheng: { hair: "#3a2a1c", hairM: "#5a4030", hairHi: "#8a6850", skin: "#f6d2ae", skinSh: "#d9a67e", robe: "#3a6ec8", robeHi: "#7eaeef", robeSh: "#214888", inner: "#1a2c58", scarf: "#dce8ff", scarfSh: "#8aa4d8", eye: "#241c14", tassel: true },
    elder: { hair: "#e4e7ee", hairM: "#b8becc", hairHi: "#ffffff", skin: "#f0c8a4", skinSh: "#c89068", robe: "#6a4888", robeHi: "#b090d0", robeSh: "#3e2858", inner: "#241430", eye: "#3a2818" },
    chief: { hair: "#e8ebf2", hairM: "#b0b6c4", hairHi: "#ffffff", skin: "#f0c8a4", skinSh: "#c89068", robe: "#9a2434", robeHi: "#e07080", robeSh: "#5c1420", inner: "#2c1014", eye: "#3a2818" },
    uncle: { hair: "#3a2c20", hairM: "#5c4634", hairHi: "#8a6a4c", skin: "#e8bc90", skinSh: "#c08858", robe: "#b06a30", robeHi: "#e8a868", robeSh: "#6e3c14", inner: "#3a220c", eye: "#2a1c10" },
    aunt: { hair: "#4a3038", hairM: "#7a5060", hairHi: "#c09098", skin: "#f4c8b0", skinSh: "#d09880", robe: "#d06890", robeHi: "#f0a8c0", robeSh: "#8a3858", inner: "#4a2030", eye: "#3a2428" },
    merchant: { hair: "#3a3024", hairM: "#6a5840", hairHi: "#c0a070", skin: "#ecc29a", skinSh: "#c48a60", robe: "#e0b050", robeHi: "#f4d890", robeSh: "#a07028", inner: "#5a3c10", eye: "#2a1c10" },
    mobei: { hair: "#2a2628", hairM: "#4a4448", hairHi: "#8a8088", skin: "#f0c8a4", skinSh: "#c89068", robe: "#5a7084", robeHi: "#9eb0c0", robeSh: "#344454", inner: "#1e2832", eye: "#241c14" },
    chicheng: { hair: "#4a2020", hairM: "#7a3838", hairHi: "#c07070", skin: "#f0c8a4", skinSh: "#c89068", robe: "#c04848", robeHi: "#f09090", robeSh: "#7a2828", inner: "#3a1414", eye: "#2a1410" },
    guard: { hair: "#e4eaf2", hairM: "#b7c4d4", hairHi: "#ffffff", skin: "#f4d2b4", skinSh: "#d0a484", robe: "#eef3f8", robeHi: "#ffffff", robeSh: "#b7c6d6", inner: "#24344c", trim: "#5aa4e0", trimSh: "#2a6aa8", eye: "#243044" },
    xiong: { hair: "#4a2c16", hairM: "#7a4c28", hairHi: "#c08858", skin: "#e8b888", skinSh: "#c08050", robe: "#8a5428", robeHi: "#d09058", robeSh: "#5a3010", inner: "#3a200c", eye: "#2a140c" },
    enforcer: { hair: "#ece6d8", hairM: "#c8b888", hairHi: "#fff6d8", skin: "#efc8a4", skinSh: "#c89068", robe: "#e0c878", robeHi: "#f8ecc0", robeSh: "#a08040", inner: "#4a3814", trim: "#f0e090", trimSh: "#b09040", eye: "#3a2a14" },
    rv: { hair: "#e8eef6", hairM: "#b8c6d8", hairHi: "#ffffff", skin: "#f6d8bc", skinSh: "#d8a888", robe: "#f4f7fb", robeHi: "#ffffff", robeSh: "#c5d2e4", inner: "#2a4068", trim: "#e2c25a", trimSh: "#a88830", eye: "#243048" },
    rvboss: { hair: "#f4f6fa", hairM: "#d0d6e2", hairHi: "#ffffff", skin: "#f6d4b4", skinSh: "#d0a484", robe: "#f7f3e6", robeHi: "#ffffff", robeSh: "#d8d0b8", inner: "#3a4868", trim: "#e6c45e", trimSh: "#b08828", eye: "#2a3848", halo: true }
  };

  function outlineCanvas(c) {
    var g = c.getContext("2d");
    var w = c.width, h = c.height;
    var img = g.getImageData(0, 0, w, h);
    var src = new Uint8ClampedArray(img.data);
    var d = img.data;
    function A(x, y) {
      if (x < 0 || y < 0 || x >= w || y >= h) return 0;
      return src[(y * w + x) * 4 + 3];
    }
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (A(x, y) > 40) continue;
        if (A(x - 1, y) > 40 || A(x + 1, y) > 40 || A(x, y - 1) > 40 || A(x, y + 1) > 40) {
          var i = (y * w + x) * 4;
          d[i] = 26; d[i + 1] = 20; d[i + 2] = 34; d[i + 3] = 255;
        }
      }
    }
    g.putImageData(img, 0, 0);
  }

  function paintPerson(spec, dir, frame) {
    var W = 48, H = 64;
    var c = el(W, H);
    var g = c.getContext("2d");
    var bob = frame % 2 ? -1 : 0;
    var leg = frame % 2 ? 2 : -1;
    var y = bob;
    if (dir === "up") paintBack(g, spec, y, leg);
    else paintFront(g, spec, y, leg, dir === "side");
    outlineCanvas(c);
    oval(c.getContext("2d"), 24, 62, 10, 2, "#2a2438");
    if (dir === "left") {
      var f = el(W, H);
      var fg = f.getContext("2d");
      fg.translate(W, 0);
      fg.scale(-1, 1);
      fg.drawImage(c, 0, 0);
      return f;
    }
    return c;
  }

  function bigEye(g, x, y, iris) {
    R(g, x, y, 9, 8, "#f7fbff");
    R(g, x + 1, y + 1, 7, 6, iris);
    R(g, x + 3, y + 2, 2, 4, OUT);
    R(g, x + 6, y + 1, 2, 2, "#ffffff");
  }
  function guWorm(g, x, y, col) {
    R(g, x + 1, y + 3, 8, 3, col);
    R(g, x + 2, y + 2, 4, 2, "#ffffff");
    R(g, x, y + 4, 2, 2, col);
    R(g, x + 8, y + 2, 2, 2, col);
    R(g, x + 4, y, 1, 1, "#ffffff");
    R(g, x + 9, y + 6, 1, 1, col);
    R(g, x - 1, y + 1, 1, 1, col);
  }
  function paintFront(g, P, y, leg, side) {
    var glow = P.glow || (P.trim ? "#9aecf6" : "#ffe08a");
    R(g, 17 + leg, 52 + y, 6, 8, P.robeSh);
    R(g, 26 - leg, 52 + y, 6, 8, P.robe);
    R(g, 16, 36 + y, 18, 18, P.robe);
    R(g, 26, 38 + y, 7, 14, P.robeSh);
    R(g, 17, 38 + y, 4, 8, P.robeHi);
    R(g, 22, 36 + y, 2, 12, P.trim || P.inner);
    R(g, 22, 36 + y, 7, 2, P.trim || P.inner);
    R(g, 6, 38 + y, 11, 7, P.robeHi);
    R(g, 32, 38 + y, 11, 7, P.robeSh);
    R(g, 8, 40 + y, 4, 3, P.skin);
    if (P.trim) {
      R(g, 15, 46 + y, 20, 3, P.trim);
      R(g, 17, 47 + y, 16, 1, P.trimSh);
      R(g, 19, 49 + y, 2, 5, P.trim);
      R(g, 28, 49 + y, 2, 4, P.trimSh);
    }
    if (P.tassel) {
      R(g, 15, 32 + y, 18, 5, P.scarf);
      R(g, 17, 33 + y, 6, 2, "#ffffff");
      R(g, 17, 37 + y, 2, 9, P.scarf);
      R(g, 20, 37 + y, 2, 7, P.scarfSh);
      R(g, 29, 37 + y, 2, 8, P.scarf);
    }
    if (P.long) {
      R(g, 6, 18 + y, 6, 26, P.hair);
      R(g, 36, 18 + y, 6, 24, P.hair);
      R(g, 8, 20 + y, 2, 14, P.hairHi);
      R(g, 38, 22 + y, 2, 12, P.hairM);
    }
    oval(g, 24, 20 + y, 15, 14, P.hair);
    oval(g, 24, 24 + y, 11, 10, P.skin);
    R(g, 14, 28 + y, 20, 5, P.skinSh);
    R(g, 11, 10 + y, 26, 8, P.hair);
    R(g, 14, 12 + y, 8, 3, P.hairHi);
    R(g, 28, 13 + y, 6, 2, P.hairM);
    R(g, 16, 16 + y, 6, 3, P.hair);
    if (!side) {
      bigEye(g, 14, 20 + y, P.eye);
      bigEye(g, 25, 20 + y, P.eye);
      R(g, 22, 31 + y, 4, 1, "#c49088");
    } else {
      bigEye(g, 22, 20 + y, P.eye);
      R(g, 21, 31 + y, 3, 1, "#c49088");
    }
    guWorm(g, 36, 28 + y, glow);
    if (P.halo) {
      R(g, 16, 2 + y, 16, 2, P.trim || "#e6c45e");
      R(g, 14, 3 + y, 2, 2, P.trim || "#e6c45e");
      R(g, 32, 3 + y, 2, 2, P.trim || "#e6c45e");
    }
  }

  function paintBack(g, P, y, leg) {
    var glow = P.glow || "#ffe08a";
    R(g, 17 + leg, 52 + y, 6, 8, P.robeSh);
    R(g, 26 - leg, 52 + y, 6, 8, P.robe);
    R(g, 15, 36 + y, 18, 18, P.robe);
    R(g, 17, 38 + y, 5, 12, P.robeHi);
    R(g, 27, 40 + y, 5, 12, P.robeSh);
    R(g, 6, 38 + y, 10, 7, P.robe);
    R(g, 32, 38 + y, 10, 7, P.robeSh);
    if (P.trim) {
      R(g, 16, 46 + y, 16, 3, P.trim);
      R(g, 22, 49 + y, 2, 4, P.trim);
    }
    if (P.tassel) {
      R(g, 14, 32 + y, 20, 5, P.scarf);
      R(g, 16, 33 + y, 8, 2, "#ffffff");
      R(g, 17, 37 + y, 2, 8, P.scarf);
      R(g, 29, 37 + y, 2, 7, P.scarfSh);
    }
    R(g, 8, 16 + y, 6, 22, P.hair);
    R(g, 34, 16 + y, 6, 20, P.hair);
    oval(g, 24, 16 + y, 14, 12, P.hair);
    R(g, 12, 8 + y, 10, 4, P.hairHi);
    R(g, 16, 18 + y, 3, 16, P.hairHi);
    R(g, 30, 20 + y, 3, 12, P.hairM);
    guWorm(g, 36, 30 + y, glow);
  }

  function paintBeast(kind, frame) {
    var wolf = kind === "wolf" || kind === "bigwolf" || kind === "icewolf" || kind === "boss";
    var W = wolf ? 64 : kind === "bear" ? 56 : kind === "bat" ? 40 : 48;
    var H = wolf ? (kind === "boss" ? 48 : 40) : kind === "bear" ? 48 : kind === "bat" ? 32 : 36;
    var c = el(W, H);
    var g = c.getContext("2d");
    var body = "#7f97c4", belly = "#d5e2f6", dark = "#2a3a58", hi = "#eef4ff";
    if (kind === "bigwolf") { body = "#c5d4ea"; belly = "#f4f7fd"; dark = "#243454"; }
    if (kind === "icewolf") { body = "#d7eeff"; belly = "#ffffff"; dark = "#3a6a90"; hi = "#ffffff"; }
    if (kind === "boss") { body = "#4a3868"; belly = "#8a74a8"; dark = "#1a1028"; hi = "#ffd56a"; }
    if (kind === "bear") { body = "#a56b3c"; belly = "#e6c49a"; dark = "#4a2c16"; hi = "#f0d8b8"; }
    if (kind === "boar") { body = "#7a4a38"; belly = "#d8b098"; dark = "#3a2018"; hi = "#f0d0b8"; }
    if (kind === "bat") { body = "#c43a52"; belly = "#f0a0aa"; dark = "#4a1420"; hi = "#ffd0d4"; }
    var bob = frame % 2 ? -1 : 0;
    oval(g, (W / 2) | 0, H - 3, (W / 5) | 0, 3, "#2a2438");
    block(g, 8, 16 + bob, W - 22, H - 26, body);
    R(g, 12, 20 + bob, W - 32, 8, hi);
    R(g, W - 28, 22 + bob, 10, H - 36, dark);
    block(g, W - 26, 8 + bob, 18, 16, body);
    R(g, W - 22, 10 + bob, 6, 4, hi);
    R(g, W - 12, 12 + bob, 3, 3, OUT);
    R(g, W - 11, 12 + bob, 1, 1, "#ffffff");
    block(g, W - 20, 4 + bob, 4, 8, dark);
    block(g, W - 12, 5 + bob, 4, 7, dark);
    var lift = frame % 2 ? 2 : 0;
    block(g, 12, H - 12 + bob, 4, 8, dark);
    block(g, 20, H - 12 - lift + bob, 4, 8, dark);
    block(g, 30, H - 12 + bob, 4, 8, dark);
    block(g, 38, H - 12 - lift + bob, 4, 8, dark);
    if (kind === "boss") {
      R(g, W - 22, 1 + bob, 3, 5, "#ffd56a");
      R(g, W - 16, 0 + bob, 3, 6, "#ffe9a0");
      R(g, W - 10, 2 + bob, 3, 4, "#ffd56a");
    }
    if (wolf) {
      var spark = kind === "boss" ? "#ffd56a" : "#7ef0ff";
      R(g, 10, 12 + bob, 2, 2, spark);
      R(g, 16, 8 + ((frame + 1) % 2), 2, 2, spark);
      R(g, 6, 20 + bob, 2, 2, spark);
    }
    if (kind === "bat") {
      block(g, 2, 8 + bob, 12, 6, body);
      block(g, W - 14, 8 + bob, 12, 6, dark);
    }
    outlineCanvas(c);
    return c;
  }

  function kindOf(name) {
    if (name === "bnb_girl") return "bnb";
    if (name === "baiguard") return "guard";
    if (name === "xionglin") return "xiong";
    if (name === "rvelite" || name === "rvboss") return "rvboss";
    if (name === "fangzheng") return "fangzheng";
    return name;
  }

  function sprite(kind, dir, frame) {
    var k = kindOf(kind);
    var d = dir === "right" ? "side" : dir === "left" ? "left" : dir === "up" ? "up" : "down";
    var key = k + ":" + d + ":" + (frame % 2);
    if (cache[key]) return cache[key];
    var beast = { wolf: 1, bigwolf: 1, boss: 1, icewolf: 1, bear: 1, boar: 1, bat: 1 }[k];
    var img = beast ? paintBeast(k, frame % 2) : paintPerson(PEOPLE[k] || PEOPLE.mobei, d === "side" ? "side" : d, frame % 2);
    cache[key] = img;
    return img;
  }

  function drawActor(ctx, kind, dir, frame, footX, footY) {
    var img = sprite(kind, dir, frame || 0);
    var dw = img.width / S;
    var dh = img.height / S;
    ctx.drawImage(img, footX - dw / 2, footY - dh, dw, dh);
  }

  function makeTile(ch, variant) {
    var key = ch + ":" + variant;
    if (tiles[key]) return tiles[key];
    var c = el(32, 32);
    var g = c.getContext("2d");
    var base = "#4e8a3e", hi = "#7dbe58", sh = "#2f642c", dot = "#d7efb0";
    if (ch === "p" || ch === "E" || ch === "<" || ch === "O") { base = "#c6a56e"; hi = "#ead4a6"; sh = "#8d6840"; dot = "#f6ead0"; }
    else if (ch === "w") { base = "#d7e7f4"; hi = "#f7fbff"; sh = "#8eb4cc"; dot = "#ffffff"; }
    else if (ch === "s") { base = "#667284"; hi = "#9aa6b8"; sh = "#3c4656"; dot = "#d5deea"; }
    else if (ch === "c" || ch === "C" || ch === "X") { base = "#3a3054"; hi = "#6a5888"; sh = "#1c142c"; dot = "#e6d8b0"; }
    else if (ch === "M") { base = "#8b939e"; hi = "#d0d6dc"; sh = "#4c545e"; dot = "#f2f5f7"; }
    else if (ch === "#") { base = "#7a5a34"; hi = "#d0a868"; sh = "#3e2a14"; dot = "#f0d8b0"; }
    R(g, 0, 0, 32, 32, base);
    var seed = (variant * 13 + ch.charCodeAt(0)) % 9;
    R(g, (seed * 3) % 20, (seed * 5) % 18, 8, 6, hi);
    R(g, (seed * 7 + 10) % 22, (seed * 3 + 12) % 20, 7, 5, sh);
    if (ch === "q" || ch === "H" || ch === "f" || ch === "Y" || ch === "b") {
      for (var i = 0; i < 8; i++) {
        var x = (i * 7 + seed * 3) % 28 + 2;
        var yy = (i * 5 + seed) % 24 + 4;
        R(g, x, yy, 1, 3, hi);
        R(g, x, yy, 2, 1, dot);
      }
    }
    if (ch === "f") {
      R(g, 6, 8, 3, 3, "#f4b0c8");
      R(g, 20, 18, 3, 3, "#ffe28a");
      R(g, 12, 22, 3, 3, "#ffffff");
    }
    if (ch === "Y") {
      R(g, 14, 16, 4, 14, "#6a4428");
      block(g, 6, 4, 20, 16, "#3e7a32");
      R(g, 8, 6, 8, 6, "#8ed25a");
    }
    if (ch === "b") {
      R(g, 6, 4, 3, 26, "#2f8a48");
      R(g, 15, 2, 3, 28, "#1f6a34");
      R(g, 24, 6, 3, 24, "#4aaa60");
      R(g, 4, 10, 8, 2, "#b6ee78");
      R(g, 14, 16, 8, 2, "#b6ee78");
      R(g, 22, 12, 8, 2, "#d8ffb0");
    }
    if (ch === "M" || ch === "C" || ch === "X") {
      R(g, 4, 6, 10, 3, hi);
      R(g, 8, 12, 2, 12, sh);
      R(g, 18, 8, 8, 2, "#ffffff");
    }
    if (ch === "X") {
      R(g, 14, 6, 2, 8, "#f0e2b0");
      R(g, 16, 12, 6, 2, "#f0e2b0");
      R(g, 18, 14, 2, 10, "#f0e2b0");
    }
    if (ch === "p" || ch === "E" || ch === "<" || ch === "O" || ch === "s") {
      for (var n = 0; n < 5; n++) R(g, (n * 6 + seed) % 28 + 2, (n * 5 + 4) % 26 + 2, 2, 2, dot);
    }
    if (ch === "#") {
      R(g, 0, 0, 32, 32, "#6a8a48");
      for (var p = 0; p < 4; p++) {
        block(g, 3 + p * 8, 2, 5, 28, hi);
        R(g, 4 + p * 8, 2, 2, 28, sh);
      }
    }
    if (ch === "w") {
      for (var s = 0; s < 6; s++) R(g, (s * 5 + 2) % 30, (s * 7 + 3) % 28, 1, 1, "#ffffff");
    }
    tiles[key] = c;
    return c;
  }

  var mapGet = function () { return "M"; };
  var mapName = "main";
  function setScene(id, fn) { mapName = id || "main"; if (fn) mapGet = fn; }
  function isGrass(c) { return c === "q" || c === "H" || c === "f" || c === "Y" || c === "b"; }
  function isPath(c) { return c === "p" || c === "E" || c === "<" || c === "O"; }
  function blitTile(ctx, ch, x, y, tx, ty) {
    var here = ch || "M";
    var v = (Math.abs(tx | 0) * 3 + Math.abs(ty | 0)) % 4;
    if ((here === "Y" || here === "b") && mapName === "east" && tx >= 17) here = here === "Y" ? "plum" : here;
    var img = makeTile(here === "plum" ? "Y" : here, v);
    ctx.drawImage(img, x, y, img.width / S, img.height / S);
    var n = mapGet(tx, ty - 1), s = mapGet(tx, ty + 1), w = mapGet(tx - 1, ty), e = mapGet(tx + 1, ty);
    if (isGrass(here) && (isPath(n) || isPath(s) || isPath(w) || isPath(e))) {
      var dirt = "#c4a36e";
      if (isPath(n)) R(ctx, x, y, 16, 3, dirt);
      if (isPath(s)) R(ctx, x, y + 13, 16, 3, dirt);
      if (isPath(w)) R(ctx, x, y, 3, 16, dirt);
      if (isPath(e)) R(ctx, x + 13, y, 3, 16, dirt);
      R(ctx, x + ((tx * 5) % 10), y + 4, 1, 2, "#7dbe58");
    }
    if (here === "w" && (isPath(n) || isPath(s) || isGrass(n) || isGrass(s))) {
      if (isPath(n) || isGrass(n)) R(ctx, x, y, 16, 2, "#f7fbff");
      if (isPath(s) || isGrass(s)) R(ctx, x, y + 14, 16, 2, "#f7fbff");
    }
    if (isPath(here) && (mapGet(tx, ty) === "w" || w === "w" || e === "w")) {
      R(ctx, x + 4, y + 6, 2, 1, "#6a5340");
      R(ctx, x + 7, y + 6, 2, 1, "#6a5340");
      R(ctx, x + 9, y + 11, 2, 1, "#6a5340");
      R(ctx, x + 12, y + 11, 2, 1, "#6a5340");
    }
    if (here === "Y" && mapName === "east" && tx >= 17) {
      R(ctx, x + 3, y + 2, 2, 2, "#e07090");
      R(ctx, x + 8, y + 1, 2, 2, "#f4b0c4");
      R(ctx, x + 6, y + 5, 2, 2, "#ffffff");
    }
    if (here === "Y") stamp(ctx, treeSprite((tx * 3 + ty) & 3), x - 2, y - 12);
    if (here === "b") stamp(ctx, bambooSprite(), x, y - 14);
    if (here === "f") stamp(ctx, flowerSprite((tx + ty) & 3), x, y - 2);
  }

  function stamp(ctx, img, x, y) {
    ctx.drawImage(img, x, y, img.width / S, img.height / S);
  }
  var treeImgs = [];
  function treeSprite(i) {
    if (treeImgs[i]) return treeImgs[i];
    var c = el(40, 56);
    var g = c.getContext("2d");
    var greens = ["#2f6e34", "#3e8a3a", "#347848", "#2a6230"];
    var leaf = greens[i];
    R(g, 17, 34, 6, 18, "#6a4428");
    R(g, 18, 36, 2, 12, "#c09058");
    oval(g, 20, 22, 16, 13, "#1e4e24");
    oval(g, 18, 18, 13, 11, leaf);
    oval(g, 13, 14, 6, 4, "#8ed060");
    if (i === 0 || i === 2) {
      R(g, 8, 16, 3, 3, "#e07090");
      R(g, 24, 10, 3, 3, "#f4b0c8");
      R(g, 18, 20, 3, 3, "#ffffff");
    }
    outlineCanvas(c);
    treeImgs[i] = c;
    return c;
  }
  var bambooImg = null;
  function bambooSprite() {
    if (bambooImg) return bambooImg;
    var c = el(32, 60);
    var g = c.getContext("2d");
    function stalk(x) {
      R(g, x, 8, 4, 48, "#3e8a40");
      R(g, x + 1, 10, 1, 40, "#8ed060");
      R(g, x, 18, 4, 2, "#1e4e24");
      R(g, x, 30, 4, 2, "#1e4e24");
      R(g, x, 42, 4, 2, "#1e4e24");
    }
    stalk(6); stalk(14); stalk(22);
    R(g, 2, 14, 8, 3, "#2f6e34");
    R(g, 20, 22, 8, 3, "#3e8a3a");
    R(g, 4, 34, 8, 3, "#8ed060");
    outlineCanvas(c);
    bambooImg = c;
    return c;
  }
  var flowerImgs = [];
  function flowerSprite(i) {
    if (flowerImgs[i]) return flowerImgs[i];
    var c = el(32, 24);
    var g = c.getContext("2d");
    var cols = ["#e07090", "#ffe28a", "#ffffff", "#f4b0c8"];
    R(g, 6, 10, 4, 8, "#2f6e34");
    R(g, 14, 8, 4, 10, "#3e8a3a");
    R(g, 22, 12, 4, 6, "#1e4e24");
    R(g, 5, 6, 5, 5, cols[i]);
    R(g, 14, 4, 5, 5, cols[(i + 1) & 3]);
    R(g, 22, 8, 4, 4, cols[(i + 2) & 3]);
    outlineCanvas(c);
    flowerImgs[i] = c;
    return c;
  }

  function makeHouse(key) {
    if (houses[key]) return houses[key];
    var c = el(128, 88);
    var g = c.getContext("2d");
    var wall = "#e7d3a4", wallSh = "#c4a56e", roof = "#6a7c8c", roofHi = "#c5d0da", roofSh = "#3e4c5c", wood = "#8a5a32";
    if (key === "house_red") { roof = "#c44848"; roofHi = "#f0a0a0"; roofSh = "#7a2828"; wall = "#f4efe4"; }
    if (key === "house_thatch" || key === "house_thatch2") { roof = "#c6a05a"; roofHi = "#f0d498"; roofSh = "#7a5830"; wall = "#e8d2a4"; wood = "#6a4428"; }
    if (key === "house_plaster") { wall = "#f7f4ee"; wallSh = "#d9d3c6"; roof = "#7a8c9c"; roofHi = "#d5dee6"; roofSh = "#4a5a6a"; }
    oval(g, 64, 82, 40, 4, "#3a3028");
    block(g, 28, 40, 76, 40, wall);
    R(g, 30, 42, 10, 36, wood);
    R(g, 92, 42, 10, 36, wood);
    R(g, 86, 44, 12, 34, wallSh);
    block(g, 56, 56, 18, 24, "#5a3a22");
    R(g, 58, 58, 6, 10, "#f0d090");
    block(g, 36, 48, 14, 12, "#cfe8f4");
    block(g, 82, 48, 14, 12, "#cfe8f4");
    R(g, 38, 50, 5, 4, "#fff6d0");
    block(g, 14, 34, 104, 14, roof);
    for (var rx = 16; rx < 114; rx += 6) R(g, rx, 36, 2, 10, roofSh);
    R(g, 14, 34, 104, 3, roofHi);
    block(g, 46, 14, 40, 24, roof);
    R(g, 46, 14, 40, 3, roofHi);
    R(g, 78, 18, 4, 16, roofSh);
    R(g, 108, 30, 6, 8, "#f0d060");
    R(g, 109, 28, 4, 3, "#6a4428");
    houses[key] = c;
    return c;
  }

  function drawHouse(ctx, key, x, y) {
    var img = makeHouse(key);
    ctx.drawImage(img, x, y, img.width / S, img.height / S);
  }

  function paintStele() {
    var c = el(32, 48);
    var g = c.getContext("2d");
    oval(g, 16, 45, 10, 3, "#2a2438");
    block(g, 8, 8, 16, 34, "#d8d2c4");
    R(g, 10, 10, 5, 8, "#f4f0e4");
    R(g, 18, 20, 4, 14, "#b3aa98");
    R(g, 12, 16, 8, 2, "#6a604c");
    R(g, 12, 22, 8, 2, "#6a604c");
    R(g, 12, 28, 6, 2, "#6a604c");
    block(g, 6, 40, 20, 5, "#8a8170");
    return c;
  }
  var steleImg = null;
  function drawProp(ctx, name, x, y) {
    if (!steleImg) steleImg = paintStele();
    ctx.drawImage(steleImg, x, y, steleImg.width / S, steleImg.height / S);
  }

  function paintFace(ctx, face, w, h) {
    var spec = face === "hero_old" ? PEOPLE.hero_old : face === "bnb_girl" ? PEOPLE.bnb : face === "hero" ? PEOPLE.hero : PEOPLE[face] || null;
    if (!spec && face !== "hero" && face !== "hero_old" && face !== "bnb_girl") {
      spec = PEOPLE[kindOfFace(face)] || null;
    }
    if (!spec) return false;
    var spr = paintPerson(spec, "down", 0);
    ctx.imageSmoothingEnabled = false;
    R(ctx, 0, 0, w, h, "#1c2436");
    R(ctx, 0, 0, w, (h * 0.4) | 0, "#2c3c58");
    var scale = 2;
    var dw = spr.width * scale, dh = spr.height * scale;
    if (dw > w || dh > h) scale = 1;
    dw = spr.width * scale;
    dh = spr.height * scale;
    ctx.drawImage(spr, ((w - dw) / 2) | 0, ((h - dh) / 2) | 0, dw, dh);
    return true;
  }
  function kindOfFace(face) {
    return face;
  }

  function prepare(canvas, ctx) {
    if (canvas.width !== 176 * S || canvas.height !== 144 * S) {
      canvas.width = 176 * S;
      canvas.height = 144 * S;
    }
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  function spark(ctx, x, y, col) {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, 0.5, 0.5);
    ctx.fillRect(x + 0.5, y - 0.5, 0.5, 0.5);
  }

  function drawBattle(ctx, o) {
    var b = o.battle;
    var hero = o.hero;
    var fx = o.fx;
    var tick = o.tick;
    var scene = o.scene;
    var sky0 = "#7ec0ea", sky1 = "#c5e4f8", g0 = "#cbb489", g1 = "#8d6a42";
    if (scene === "forest") { sky0 = "#6a4a78"; sky1 = "#e09070"; g0 = "#4e8a3c"; g1 = "#245024"; }
    if (scene === "night") { sky0 = "#14182c"; sky1 = "#3a4a78"; g0 = "#4a5568"; g1 = "#2a3140"; }
    R(ctx, 0, 0, 176, 36, sky0);
    R(ctx, 0, 36, 176, 28, sky1);
    R(ctx, 10, 24, 36, 18, scene === "night" ? "#2a3458" : "#6a9460");
    R(ctx, 28, 18, 28, 24, scene === "night" ? "#1c2440" : "#4e7848");
    R(ctx, 120, 22, 48, 20, scene === "night" ? "#2a3458" : "#5a8454");
    R(ctx, 0, 64, 176, 80, g0);
    R(ctx, 0, 100, 176, 44, g1);
    R(ctx, 8, 96, 6, 4, "#3e6a32");
    R(ctx, 70, 102, 8, 4, "#6a9a48");
    R(ctx, 150, 98, 6, 4, "#3e6a32");
    if (scene === "night") {
      R(ctx, 138, 10, 10, 10, "#fff6d0");
      R(ctx, 140, 8, 6, 2, "#fff6d0");
      R(ctx, 148, 12, 3, 6, "#14182c");
    } else if (scene === "village") {
      R(ctx, 0, 48, 176, 8, "#b7d89a");
    }
    var human = { mobei: 1, chicheng: 1, rv: 1, rvelite: 1, rvboss: 1, baiguard: 1, xionglin: 1, bnb: 1, enforcer: 1 }[b.kind];
    var lx = fx.lunge > 0 ? Math.round(Math.sin((fx.lunge / 12) * Math.PI) * 6) : 0;
    var es = fx.elunge > 0 ? Math.round(Math.sin((fx.elunge / 12) * Math.PI) * 4) : 0;
    var fyFoot = { x: 36 + lx, y: 108 };
    var eFoot = { x: 128 - es, y: 100 };
    if (!(fx.flash > 0 && fx.flash % 4 < 2)) {
      drawActor(ctx, hero.map === "pro" ? "hero_old" : "hero", "up", fx.lunge > 0 ? 1 : 0, fyFoot.x, fyFoot.y);
    }
    drawActor(ctx, b.kind, "down", Math.floor(tick / 8) % 2, eFoot.x, eFoot.y);
    var col = b.kind === "bnb" ? "#9aecf6" : (b.kind === "boss" || b.kind === "wolf" || b.kind === "bigwolf") ? "#8cf4ff" : (b.kind === "rvboss" ? "#ffe08a" : null);
    if (col) {
      for (var i = 0; i < 5; i++) {
        spark(ctx, eFoot.x - 8 + ((tick + i * 5) % 16), eFoot.y - 16 - ((tick * 2 + i * 3) % 14), col);
      }
    }
    if (fx.blade > 0) {
      var p = 1 - fx.blade / 16;
      R(ctx, 40 + p * 50, 70 - p * 20, 8, 2, "#f4fbff");
      R(ctx, 44 + p * 50, 68 - p * 20, 3, 2, "#9ad8ff");
    }
    var pct = Math.max(0, Math.min(1, b.hp / b.maxHp));
    R(ctx, 92, 112, 70, 8, "#1a1422");
    R(ctx, 93, 113, 68, 6, "#3a4460");
    R(ctx, 93, 113, Math.max(0, Math.round(68 * pct)), 6, pct > 0.5 ? "#3ecf78" : pct > 0.25 ? "#ffd36a" : "#e04a5f");
    R(ctx, 93, 113, Math.max(0, Math.round(68 * pct)), 1, "#ffffff");
  }

  function prop(name) {
    var c = el(name === "plum" ? 48 : 32, name === "plum" ? 48 : 32);
    var g = c.getContext("2d");
    if (name === "well") {
      oval(g, 16, 28, 12, 4, "#3a3028");
      block(g, 6, 10, 20, 16, "#9aa4ae");
      R(g, 8, 12, 16, 8, "#3a6a90");
      R(g, 10, 13, 4, 2, "#d5f0ff");
      block(g, 4, 8, 24, 4, "#6a5038");
      R(g, 14, 4, 4, 8, "#8a6840");
    } else if (name === "pond") {
      oval(g, 16, 18, 14, 10, "#3a78a8");
      R(g, 8, 12, 6, 2, "#d5f4ff");
      R(g, 18, 16, 4, 2, "#ffffff");
      R(g, 6, 20, 20, 3, "#2f6438");
    } else if (name === "lantern") {
      block(g, 14, 6, 4, 16, "#6a4428");
      block(g, 10, 4, 12, 8, "#e05840");
      R(g, 12, 6, 4, 3, "#ffd56a");
      R(g, 8, 20, 16, 3, "#5a4030");
    } else if (name === "jar") {
      block(g, 10, 10, 12, 16, "#d8d0c0");
      R(g, 12, 12, 4, 6, "#f4f0e6");
      block(g, 8, 8, 16, 4, "#6a8a9a");
    } else if (name === "flag") {
      block(g, 20, 4, 3, 26, "#6a4428");
      block(g, 4, 6, 16, 10, "#c44848");
      R(g, 6, 8, 8, 2, "#f0d090");
    } else if (name === "veg") {
      R(g, 4, 18, 24, 8, "#6a4a28");
      R(g, 6, 12, 4, 8, "#3e8a40");
      R(g, 12, 10, 4, 10, "#5aaa48");
      R(g, 18, 13, 4, 7, "#2f6a30");
      R(g, 8, 8, 3, 3, "#e05840");
    } else if (name === "hen") {
      oval(g, 16, 28, 8, 3, "#2a2438");
      block(g, 8, 14, 14, 12, "#f0e0c0");
      block(g, 18, 10, 8, 8, "#e05840");
      R(g, 24, 12, 4, 2, "#f0a030");
      R(g, 12, 24, 2, 4, "#6a4428");
      R(g, 18, 24, 2, 4, "#6a4428");
    } else if (name === "cat") {
      oval(g, 16, 28, 8, 3, "#2a2438");
      block(g, 8, 14, 16, 12, "#f4f4f4");
      block(g, 20, 8, 8, 8, "#f4f4f4");
      R(g, 22, 6, 3, 4, "#f4f4f4");
      R(g, 26, 6, 3, 4, "#f4f4f4");
      R(g, 23, 10, 2, 2, "#1a1422");
      R(g, 6, 16, 6, 3, "#f4f4f4");
    } else if (name === "dog") {
      oval(g, 16, 28, 9, 3, "#2a2438");
      block(g, 6, 14, 18, 12, "#c4844a");
      block(g, 20, 10, 8, 8, "#e0a060");
      R(g, 24, 12, 3, 2, "#1a1422");
      R(g, 4, 16, 5, 3, "#a06830");
    } else if (name === "plum") {
      R(g, 22, 28, 6, 18, "#5a3828");
      R(g, 23, 30, 2, 12, "#a07048");
      oval(g, 24, 18, 16, 12, "#e07090");
      oval(g, 18, 14, 8, 6, "#f4b0c8");
      oval(g, 28, 16, 6, 5, "#ffffff");
      R(g, 12, 12, 4, 4, "#ffffff");
      R(g, 30, 10, 3, 3, "#e07090");
      R(g, 20, 20, 3, 3, "#ffffff");
    } else if (name === "rocklamp") {
      block(g, 12, 10, 8, 16, "#9aa4ae");
      block(g, 8, 6, 16, 8, "#6a5438");
      R(g, 12, 8, 6, 4, "#ffd56a");
    }
    return c;
  }
  var props = {};
  function drawDecor(ctx, mapId, camX, camY, tick) {
    var list = mapId === "east" ? DECOR_EAST : mapId === "pro" ? DECOR_PRO : DECOR_MAIN;
    list.forEach(function (d) {
      var img = props[d.k] || (props[d.k] = prop(d.k));
      var x = d.x * 16 - camX + (16 - img.width / S) / 2;
      var y = d.y * 16 - camY + 16 - img.height / S;
      if (d.k === "pond") { y -= 4; x -= 6; }
      ctx.drawImage(img, x, y, img.width / S, img.height / S);
      if (d.k === "pond" && (tick % 20) < 10) R(ctx, x + 6, y + 6, 1, 1, "#ffffff");
    });
  }
  var DECOR_MAIN = [
    { k: "lantern", x: 8, y: 14 }, { k: "lantern", x: 14, y: 15 }, { k: "lantern", x: 22, y: 14 },
    { k: "hen", x: 6, y: 16 }, { k: "hen", x: 12, y: 17 }, { k: "hen", x: 27, y: 22 },
    { k: "cat", x: 16, y: 16 }, { k: "dog", x: 9, y: 18 },
    { k: "well", x: 8, y: 18 }, { k: "pond", x: 5, y: 20 },
    { k: "jar", x: 15, y: 18 }, { k: "flag", x: 18, y: 15 },
    { k: "veg", x: 6, y: 19 }, { k: "rocklamp", x: 4, y: 15 }
  ];
  var DECOR_EAST = [
    { k: "rocklamp", x: 20, y: 5 }, { k: "rocklamp", x: 26, y: 8 }, { k: "rocklamp", x: 23, y: 7 },
    { k: "plum", x: 24, y: 3 }, { k: "plum", x: 29, y: 6 }, { k: "plum", x: 21, y: 6 }, { k: "plum", x: 27, y: 4 },
    { k: "jar", x: 18, y: 11 }
  ];
  var DECOR_PRO = [
    { k: "rocklamp", x: 8, y: 20 }, { k: "plum", x: 14, y: 18 }
  ];

  function sheet() {
    var list = ["hero", "hero_old", "bnb", "fangzheng", "elder", "chief", "uncle", "aunt", "merchant", "mobei", "chicheng", "guard", "xiong", "enforcer", "rv", "rvboss", "wolf", "bigwolf", "boss", "icewolf", "bear", "boar", "bat"];
    var c = el(8 * 72, 3 * 80);
    var g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    R(g, 0, 0, c.width, c.height, "#f4efe4");
    list.forEach(function (k, i) {
      var img = sprite(k, "down", 0);
      var x = (i % 8) * 72 + 12;
      var y = Math.floor(i / 8) * 80 + 8;
      g.drawImage(img, x, y);
    });
    return c;
  }

  window.HD = {
    S: S,
    prepare: prepare,
    blitTile: blitTile,
    drawHouse: drawHouse,
    drawDecor: drawDecor,
    setScene: setScene,
    drawActor: drawActor,
    drawProp: drawProp,
    drawBattle: drawBattle,
    paintFace: paintFace,
    sheet: sheet,
    sprite: sprite
  };
})();
