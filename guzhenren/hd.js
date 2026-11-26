/* Hard-edge wuxia pixel art. People are about 1:5.5, drawn 1:1 into a
   352×288 bitmap and shown at an integer CSS scale. No fog, no blur. */
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
    hero: { do: "long", hair: "#14141c", hairM: "#3a4054", hairHi: "#9aa3b8", skin: "#f3e4da", skinSh: "#d8b8a8", robe: "#8e98aa", robeHi: "#d5dbe6", robeSh: "#4e5868", inner: "#232833", scarf: "#f7f9fc", scarfSh: "#b7c2d2", eye: "#1a1c28", tassel: true, glow: "#fff1a8" },
    hero_old: { do: "long", hair: "#100e14", hairM: "#3a3040", hairHi: "#6a6070", skin: "#e4d4cc", skinSh: "#c4a898", robe: "#3e4656", robeHi: "#7a8496", robeSh: "#242830", inner: "#14161c", scarf: "#a33a48", scarfSh: "#6a2430", eye: "#c44858", tassel: true, glow: "#ffb0b8" },
    bnb: { do: "long", hair: "#e7eef6", hairM: "#b7c6d6", hairHi: "#ffffff", skin: "#f7eee8", skinSh: "#e0ccc6", robe: "#f4f7f8", robeHi: "#ffffff", robeSh: "#c5d4d8", inner: "#243044", trim: "#6eb8b0", trimSh: "#2f7d76", eye: "#2aa8c0", glow: "#bff6ff" },
    fangzheng: { do: "short", hair: "#3a2a1c", hairM: "#5a4030", hairHi: "#a07858", skin: "#f3d2b0", skinSh: "#d4a67e", robe: "#3a6ec8", robeHi: "#8eb6ef", robeSh: "#214888", inner: "#1a2c58", scarf: "#e4eeff", scarfSh: "#8aa4d8", eye: "#2a1c14", tassel: true, glow: "#d0e4ff" },
    elder: { do: "knot", beard: true, hair: "#eceff6", hairM: "#c4cad6", hairHi: "#ffffff", skin: "#efc8a6", skinSh: "#c89068", robe: "#6a4888", robeHi: "#b090d0", robeSh: "#3e2858", inner: "#241430", eye: "#3a2818", glow: "#e0c8ff" },
    chief: { do: "guan", beard: true, hair: "#e8ebf2", hairM: "#b0b6c4", hairHi: "#ffffff", skin: "#efc8a6", skinSh: "#c89068", robe: "#9a2434", robeHi: "#e07080", robeSh: "#5c1420", inner: "#2c1014", trim: "#e6c45e", trimSh: "#a88830", eye: "#3a2818", glow: "#ffe08a" },
    uncle: { do: "short", hair: "#3a2c20", hairM: "#5c4634", hairHi: "#8a6a4c", skin: "#e8bc90", skinSh: "#c08858", robe: "#b06a30", robeHi: "#e8a868", robeSh: "#6e3c14", inner: "#3a220c", eye: "#2a1c10", glow: "#ffd0a0" },
    aunt: { do: "bun", hair: "#4a3038", hairM: "#7a5060", hairHi: "#e0b0b8", skin: "#f4c8b0", skinSh: "#d09880", robe: "#d06890", robeHi: "#f0a8c0", robeSh: "#8a3858", inner: "#4a2030", eye: "#3a2428", glow: "#ffd0e0" },
    merchant: { do: "cap", hair: "#3a3024", hairM: "#6a5840", hairHi: "#c0a070", skin: "#ecc29a", skinSh: "#c48a60", robe: "#e0b050", robeHi: "#f4d890", robeSh: "#a07028", inner: "#5a3c10", eye: "#2a1c10", glow: "#ffe9a0" },
    mobei: { do: "knot", hair: "#2a2628", hairM: "#4a4448", hairHi: "#8a8088", skin: "#f0c8a4", skinSh: "#c89068", robe: "#5a7084", robeHi: "#9eb0c0", robeSh: "#344454", inner: "#1e2832", eye: "#241c14", glow: "#d0dce8" },
    chicheng: { do: "short", hair: "#6a2828", hairM: "#8a4040", hairHi: "#d08080", skin: "#f0c8a4", skinSh: "#c89068", robe: "#c04848", robeHi: "#f09090", robeSh: "#7a2828", inner: "#3a1414", eye: "#2a1410", glow: "#ffb0a0" },
    guard: { do: "long", hair: "#e4eaf2", hairM: "#b7c4d4", hairHi: "#ffffff", skin: "#f4d2b4", skinSh: "#d0a484", robe: "#e8eef4", robeHi: "#ffffff", robeSh: "#b0c0d0", inner: "#24344c", trim: "#5aa4e0", trimSh: "#2a6aa8", eye: "#243044", glow: "#d8f0ff" },
    xiong: { do: "short", fur: true, broad: true, hair: "#4a2c16", hairM: "#7a4c28", hairHi: "#c08858", skin: "#e0b088", skinSh: "#b07848", robe: "#8a5428", robeHi: "#d09058", robeSh: "#5a3010", inner: "#3a200c", eye: "#2a140c", glow: "#ffd0a0" },
    enforcer: { do: "guan", hair: "#ece6d8", hairM: "#c8b888", hairHi: "#fff6d8", skin: "#efc8a4", skinSh: "#c89068", robe: "#e0c878", robeHi: "#f8ecc0", robeSh: "#a08040", inner: "#4a3814", trim: "#f0e090", trimSh: "#b09040", eye: "#3a2a14", glow: "#fff0b0" },
    rv: { do: "knot", hair: "#e8eef6", hairM: "#b8c6d8", hairHi: "#ffffff", skin: "#f6d8bc", skinSh: "#d8a888", robe: "#f4f7fb", robeHi: "#ffffff", robeSh: "#c5d2e4", inner: "#2a4068", trim: "#e2c25a", trimSh: "#a88830", eye: "#243048", glow: "#fff0c0" },
    rvboss: { do: "long", halo: true, hair: "#f7f8fc", hairM: "#d0d6e2", hairHi: "#ffffff", skin: "#f6d4b4", skinSh: "#d0a484", robe: "#f7f3e6", robeHi: "#ffffff", robeSh: "#d8d0b8", inner: "#3a4868", trim: "#e6c45e", trimSh: "#b08828", eye: "#2a3848", glow: "#ffe9a0" }
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

  var PW = 36, PH = 84;
  function paintPerson(spec, dir, frame) {
    var c = el(PW, PH);
    var g = c.getContext("2d");
    var y = frame % 2 ? -1 : 0;
    var leg = frame % 2 ? 1 : -1;
    if (dir === "up") paintBack(g, spec, y, leg);
    else paintFront(g, spec, y, leg, dir === "side");
    outlineCanvas(c);
    oval(c.getContext("2d"), 18, 81, 7, 2, "#241c28");
    if (dir === "left") {
      var f = el(PW, PH);
      var fg = f.getContext("2d");
      fg.translate(PW, 0);
      fg.scale(-1, 1);
      fg.drawImage(c, 0, 0);
      return f;
    }
    return c;
  }

  function tinyEye(g, x, y, iris) {
    R(g, x, y, 2, 2, "#1a1422");
    R(g, x, y, 2, 1, iris);
    R(g, x + 1, y, 1, 1, "#ffffff");
  }
  function sashColor(P) { return P.trim || "#6a5038"; }
  function sashShade(P) { return P.trimSh || "#3e2c1c"; }
  function paintRobe(g, P, y, leg) {
    var broad = P.broad ? 2 : 0;
    R(g, 12 + leg, 74 + y, 4, 6, "#2c241c");
    R(g, 20 - leg, 74 + y, 4, 6, "#1a1614");
    R(g, 11 - broad, 50 + y, 14 + broad * 2, 26, P.robe);
    R(g, 20, 52 + y, 5 + broad, 22, P.robeSh);
    R(g, 12, 52 + y, 3, 18, P.robeHi);
    R(g, 17, 54 + y, 2, 18, P.inner);
    R(g, 13 - broad, 28 + y, 10 + broad * 2, 24, P.robe);
    R(g, 19, 30 + y, 4 + broad, 20, P.robeSh);
    R(g, 14, 30 + y, 2, 14, P.robeHi);
    R(g, 17, 28 + y, 2, 14, P.trim || P.inner);
    R(g, 17, 28 + y, 5, 2, P.trim || P.inner);
    R(g, 4, 30 + y, 9, 16, P.robe);
    R(g, 5, 32 + y, 3, 10, P.robeHi);
    R(g, 6, 42 + y, 6, 3, P.inner);
    R(g, 23, 30 + y, 9, 16, P.robeSh);
    R(g, 24, 42 + y, 6, 3, P.inner);
    R(g, 7, 44 + y, 3, 2, P.skin);
    R(g, 26, 44 + y, 3, 2, P.skin);
    R(g, 10, 48 + y, 16, 4, sashColor(P));
    R(g, 11, 50 + y, 14, 1, sashShade(P));
    R(g, 14, 52 + y, 2, 8, sashColor(P));
    R(g, 20, 52 + y, 2, 7, sashShade(P));
    if (P.fur) {
      R(g, 11, 26 + y, 14, 5, "#c09058");
      R(g, 13, 27 + y, 4, 2, "#f4d8b0");
      R(g, 20, 28 + y, 3, 2, "#8a5a30");
    }
  }
  function paintHairFront(g, P, y) {
    var hs = P.do || "short";
    if (hs === "long") {
      R(g, 8, 18 + y, 3, 40, P.hair);
      R(g, 25, 18 + y, 3, 38, P.hair);
      R(g, 9, 22 + y, 1, 22, P.hairHi);
      R(g, 12, 6 + y, 12, 8, P.hair);
      R(g, 14, 4 + y, 8, 3, P.hairHi);
      R(g, 11, 12 + y, 3, 8, P.hair);
      R(g, 22, 12 + y, 3, 8, P.hair);
      R(g, 13, 12 + y, 10, 3, P.hair);
    } else if (hs === "knot") {
      R(g, 15, 1 + y, 6, 6, P.hair);
      R(g, 16, 0 + y, 3, 2, P.hairHi);
      R(g, 12, 6 + y, 12, 7, P.hair);
      R(g, 14, 5 + y, 5, 2, P.hairHi);
    } else if (hs === "bun") {
      R(g, 12, 6 + y, 12, 7, P.hair);
      R(g, 14, 4 + y, 5, 3, P.hairHi);
      R(g, 24, 10 + y, 6, 6, P.hair);
      R(g, 26, 11 + y, 2, 2, P.hairHi);
      R(g, 25, 12 + y, 2, 2, "#e6c45e");
    } else if (hs === "guan") {
      R(g, 13, 8 + y, 10, 5, P.hairM);
      R(g, 8, 4 + y, 20, 4, "#1c1a22");
      R(g, 12, 1 + y, 12, 4, "#2a2630");
      R(g, 15, 2 + y, 6, 2, P.trim || "#e6c45e");
    } else if (hs === "cap") {
      R(g, 12, 6 + y, 12, 6, P.hair);
      R(g, 11, 4 + y, 14, 4, "#5a3c18");
      R(g, 12, 3 + y, 8, 2, "#e0b050");
    } else {
      R(g, 12, 6 + y, 12, 7, P.hair);
      R(g, 14, 5 + y, 6, 2, P.hairHi);
      R(g, 11, 10 + y, 3, 5, P.hair);
      R(g, 22, 10 + y, 3, 5, P.hairM);
    }
  }
  function paintHead(g, P, y, side) {
    R(g, 13, 12 + y, 10, 11, P.skin);
    R(g, 13, 20 + y, 10, 3, P.skinSh);
    if (!side) {
      tinyEye(g, 15, 16 + y, P.eye);
      tinyEye(g, 20, 16 + y, P.eye);
      R(g, 17, 19 + y, 2, 2, P.skinSh);
      R(g, 16, 22 + y, 4, 1, "#c48a80");
    } else {
      tinyEye(g, 20, 16 + y, P.eye);
      R(g, 23, 18 + y, 2, 2, P.skinSh);
      R(g, 20, 22 + y, 3, 1, "#c48a80");
    }
    if (P.beard) {
      R(g, 15, 22 + y, 7, 2, P.hairM);
      R(g, 16, 24 + y, 4, 4, P.hair);
      R(g, 17, 27 + y, 2, 3, P.hairM);
    }
  }
  function paintFront(g, P, y, leg, side) {
    paintRobe(g, P, y, leg);
    paintHairFront(g, P, y);
    paintHead(g, P, y, side);
    if (!P.beard && P.do !== "guan" && P.do !== "cap") R(g, 14, 12 + y, 8, 2, P.hair);
    if (P.tassel) {
      R(g, 12, 24 + y, 12, 4, P.scarf);
      R(g, 13, 25 + y, 5, 1, "#ffffff");
      R(g, 13, 28 + y, 2, 10, P.scarf);
      R(g, 15, 28 + y, 1, 8, P.scarfSh);
      R(g, 21, 28 + y, 2, 9, P.scarf);
    }
    var glow = P.glow || "#ffe08a";
    R(g, 30, 40 + y, 3, 3, glow);
    R(g, 31, 41 + y, 1, 1, "#ffffff");
    R(g, 33, 38 + y, 1, 1, glow);
    if (P.halo) {
      R(g, 12, 0 + y, 12, 2, P.trim || "#e6c45e");
      R(g, 11, 1 + y, 2, 2, P.trim || "#e6c45e");
      R(g, 23, 1 + y, 2, 2, P.trim || "#e6c45e");
    }
  }
  function paintBack(g, P, y, leg) {
    paintRobe(g, P, y, leg);
    var hs = P.do || "short";
    if (hs === "long") {
      R(g, 12, 8 + y, 12, 36, P.hair);
      R(g, 14, 10 + y, 2, 24, P.hairHi);
      R(g, 22, 14 + y, 2, 18, P.hairM);
      R(g, 10, 20 + y, 3, 28, P.hair);
      R(g, 23, 20 + y, 3, 26, P.hair);
    } else if (hs === "knot") {
      R(g, 15, 1 + y, 6, 6, P.hair);
      R(g, 13, 8 + y, 10, 10, P.hair);
      R(g, 15, 10 + y, 3, 6, P.hairHi);
    } else if (hs === "guan") {
      R(g, 8, 4 + y, 20, 4, "#1c1a22");
      R(g, 12, 1 + y, 12, 4, "#2a2630");
      R(g, 13, 8 + y, 10, 8, P.hairM);
    } else if (hs === "bun") {
      R(g, 13, 6 + y, 10, 12, P.hair);
      R(g, 24, 10 + y, 5, 5, P.hairM);
    } else if (hs === "cap") {
      R(g, 11, 4 + y, 14, 4, "#5a3c18");
      R(g, 13, 8 + y, 10, 8, P.hair);
    } else {
      R(g, 12, 6 + y, 12, 12, P.hair);
      R(g, 14, 8 + y, 3, 6, P.hairHi);
    }
    if (P.tassel) {
      R(g, 12, 24 + y, 12, 4, P.scarf);
      R(g, 13, 25 + y, 6, 1, "#ffffff");
      R(g, 14, 28 + y, 2, 8, P.scarf);
      R(g, 20, 28 + y, 2, 7, P.scarfSh);
    }
    var glow = P.glow || "#ffe08a";
    R(g, 30, 42 + y, 2, 2, glow);
  }

  function paintBeast(kind, frame) {
    var wolf = kind === "wolf" || kind === "bigwolf" || kind === "icewolf" || kind === "boss";
    var W = wolf ? 80 : kind === "bear" ? 72 : kind === "bat" ? 64 : 70;
    var H = wolf ? (kind === "boss" ? 52 : 46) : kind === "bear" ? 52 : kind === "bat" ? 40 : 42;
    var c = el(W, H);
    var g = c.getContext("2d");
    var bob = frame % 2 ? -1 : 0;
    var lift = frame % 2 ? 3 : 0;
    if (wolf) paintWolf(g, bob, lift, kind);
    else if (kind === "bear") paintBear(g, bob, lift);
    else if (kind === "bat") paintBat(g, bob, frame);
    else paintBoar(g, bob, lift);
    outlineCanvas(c);
    return c;
  }
  function paintWolf(g, bob, lift, kind) {
    var body = "#7f97c4", belly = "#e4eef8", dark = "#2a3a58", hi = "#f4f8ff", eye = "#ffe08a";
    if (kind === "bigwolf") { body = "#c5d4ea"; belly = "#f7faff"; dark = "#243454"; hi = "#ffffff"; }
    if (kind === "icewolf") { body = "#d7eeff"; belly = "#ffffff"; dark = "#3a6a90"; hi = "#ffffff"; eye = "#7ec8e8"; }
    if (kind === "boss") { body = "#5a4878"; belly = "#8a74a8"; dark = "#1a1028"; hi = "#c8b0e0"; eye = "#ffd56a"; }
    R(g, 4, 18 + bob, 16, 5, dark);
    R(g, 2, 14 + bob, 8, 6, body);
    R(g, 6, 16 + bob, 3, 2, hi);
    oval(g, 38, 24 + bob, 20, 10, body);
    oval(g, 40, 28 + bob, 14, 6, belly);
    R(g, 22, 15 + bob, 26, 4, dark);
    R(g, 28, 16 + bob, 10, 2, hi);
    oval(g, 26, 28 + bob, 8, 8, body);
    oval(g, 52, 26 + bob, 8, 7, body);
    oval(g, 64, 18 + bob, 8, 7, body);
    R(g, 68, 18 + bob, 10, 5, body);
    R(g, 76, 19 + bob, 3, 3, dark);
    R(g, 62, 16 + bob, 2, 2, "#1a1422");
    R(g, 62, 16 + bob, 1, 1, eye);
    R(g, 58, 8 + bob, 4, 8, dark);
    R(g, 64, 9 + bob, 3, 7, body);
    R(g, 59, 10 + bob, 2, 3, belly);
    function leg(x, up) {
      R(g, x, 30 + bob, 4, 7, body);
      R(g, x, 36 + bob - up, 3, 7, dark);
      R(g, x - 1, 42 + bob - up, 6, 2, "#241c18");
    }
    leg(22, 0); leg(32, lift); leg(46, 0); leg(56, lift);
    if (kind === "boss") {
      R(g, 56, 2 + bob, 3, 8, "#ffd56a");
      R(g, 62, 0 + bob, 3, 10, "#ffe9a0");
      R(g, 68, 3 + bob, 3, 6, "#ffd56a");
    }
    var spark = kind === "boss" ? "#ffd56a" : "#8cf4ff";
    R(g, 18, 12 + bob, 2, 2, spark);
    R(g, 30, 8 + bob, 1, 1, spark);
    R(g, 14, 22 + bob, 2, 2, spark);
  }
  function paintBear(g, bob, lift) {
    var body = "#a56b3c", belly = "#f0d2a8", dark = "#4a2c16", hi = "#e8c090";
    oval(g, 36, 26 + bob, 18, 12, body);
    oval(g, 36, 30 + bob, 12, 7, belly);
    R(g, 22, 16 + bob, 22, 5, dark);
    R(g, 28, 18 + bob, 8, 2, hi);
    oval(g, 54, 22 + bob, 10, 9, body);
    R(g, 60, 22 + bob, 8, 6, "#c48a58");
    R(g, 66, 24 + bob, 3, 3, dark);
    R(g, 52, 18 + bob, 2, 2, "#1a1422");
    R(g, 52, 18 + bob, 1, 1, "#ffd56a");
    R(g, 48, 12 + bob, 5, 5, dark);
    R(g, 56, 12 + bob, 5, 5, body);
    R(g, 49, 13 + bob, 2, 2, belly);
    function leg(x, up) {
      R(g, x, 32 + bob, 6, 8, body);
      R(g, x, 38 + bob - up, 5, 8, dark);
      R(g, x, 45 + bob - up, 6, 3, "#2a1c12");
      R(g, x, 46 + bob - up, 2, 2, "#e8d0b0");
    }
    leg(18, 0); leg(28, lift); leg(42, 0); leg(52, lift);
  }
  function paintBoar(g, bob, lift) {
    var body = "#7a4a38", belly = "#e0b898", dark = "#3a2018", hi = "#c08060";
    oval(g, 34, 22 + bob, 20, 9, body);
    oval(g, 34, 26 + bob, 14, 5, belly);
    R(g, 18, 14 + bob, 24, 3, dark);
    R(g, 20, 12 + bob, 3, 4, dark);
    R(g, 26, 11 + bob, 3, 5, hi);
    R(g, 32, 12 + bob, 3, 4, dark);
    oval(g, 52, 18 + bob, 8, 7, body);
    R(g, 58, 18 + bob, 8, 5, "#c08060");
    R(g, 64, 20 + bob, 4, 2, "#f0e0c8");
    R(g, 64, 22 + bob, 3, 2, "#f0e0c8");
    R(g, 50, 16 + bob, 2, 2, "#1a1422");
    R(g, 50, 16 + bob, 1, 1, "#ffd56a");
    R(g, 48, 12 + bob, 3, 4, dark);
    function leg(x, up) {
      R(g, x, 26 + bob, 4, 6, body);
      R(g, x, 31 + bob - up, 4, 6, dark);
      R(g, x, 36 + bob - up, 5, 2, "#241810");
    }
    leg(16, 0); leg(26, lift); leg(40, 0); leg(50, lift);
  }
  function paintBat(g, bob, frame) {
    var wing = frame % 2 ? 4 : 0;
    R(g, 4, 14 + bob - wing, 22, 8, "#a03048");
    R(g, 8, 16 + bob - wing, 14, 4, "#e07080");
    R(g, 38, 14 + bob - wing, 22, 8, "#6a1830");
    R(g, 42, 16 + bob - wing, 14, 4, "#c05068");
    R(g, 6, 12 + bob, 2, 10, "#4a1420");
    R(g, 56, 12 + bob, 2, 10, "#4a1420");
    oval(g, 32, 20 + bob, 8, 7, "#c43a52");
    oval(g, 32, 23 + bob, 5, 4, "#f0a0aa");
    R(g, 36, 16 + bob, 6, 5, "#a03048");
    R(g, 40, 17 + bob, 3, 2, "#2a1018");
    R(g, 34, 16 + bob, 2, 2, "#1a1422");
    R(g, 34, 16 + bob, 1, 1, "#ffe08a");
    R(g, 30, 10 + bob, 3, 6, "#4a1420");
    R(g, 35, 9 + bob, 3, 6, "#6a1830");
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
    if (ch === "p" || ch === "E" || ch === "<" || ch === "O") {
      R(g, 0, 0, 32, 32, "#6e5234");
      var stones = [[1, 1, 14, 13], [17, 2, 13, 12], [2, 16, 13, 14], [17, 16, 13, 14]];
      for (var si = 0; si < stones.length; si++) {
        var st = stones[si];
        var jx = (seed + si) % 2;
        R(g, st[0] + jx, st[1], st[2], st[3], si % 2 ? "#b7b3a4" : "#ddd6c6");
        R(g, st[0] + jx, st[1], st[2], 1, "#f6f1e6");
        R(g, st[0] + jx, st[1] + st[3] - 1, st[2], 1, "#6a6458");
      }
    }
    if (ch === "w") {
      R(g, 0, 0, 32, 32, "#e7f1f8");
      R(g, 2, 3, 12, 7, "#f7fbff");
      R(g, 16, 12, 13, 8, "#c5d6e6");
      R(g, 6, 20, 8, 5, "#f7fbff");
      if (variant % 2 === 0) {
        R(g, 8, 14, 3, 2, "#a9bdd0");
        R(g, 12, 14, 3, 2, "#a9bdd0");
        R(g, 18, 22, 3, 2, "#a9bdd0");
        R(g, 22, 22, 3, 2, "#a9bdd0");
      }
    }
    if (ch === "q" || ch === "H" || ch === "f") {
      R(g, (seed * 3) % 18, (seed * 2) % 14, 5, 3, "#2a5a28");
      R(g, 20, 8, 2, 2, seed % 2 ? "#e07090" : "#ffe28a");
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
    if (here === "Y") stamp(ctx, treeSprite((tx * 3 + ty) & 3), x - 6, y - 20);
    if (here === "plum") stamp(ctx, plumSprite((tx + ty) & 1), x - 10, y - 28);
    if (here === "b") stamp(ctx, bambooSprite(), x, y - 14);
    if (here === "f") stamp(ctx, flowerSprite((tx + ty) & 3), x, y - 2);
  }

  function stamp(ctx, img, x, y) {
    ctx.drawImage(img, x, y, img.width / S, img.height / S);
  }
  var treeImgs = [];
  function treeSprite(i) {
    if (treeImgs[i]) return treeImgs[i];
    var c = el(48, 72);
    var g = c.getContext("2d");
    var greens = ["#2f6e34", "#3e8a3a", "#347848", "#2a6230"];
    var leaf = greens[i];
    R(g, 20, 40, 4, 8, "#5a3828");
    R(g, 22, 36, 6, 28, "#6a4428");
    R(g, 24, 40, 2, 16, "#c09058");
    R(g, 16, 34, 8, 4, "#5a3828");
    oval(g, 24, 24, 18, 16, "#1e4e24");
    oval(g, 20, 20, 14, 12, leaf);
    oval(g, 16, 16, 7, 5, "#8ed060");
    oval(g, 30, 22, 6, 5, "#2a6230");
    if (i === 0 || i === 2) {
      R(g, 10, 18, 3, 3, "#e07090");
      R(g, 28, 12, 3, 3, "#f4b0c8");
      R(g, 20, 24, 3, 3, "#ffffff");
    }
    outlineCanvas(c);
    treeImgs[i] = c;
    return c;
  }
  var plumImgs = [];
  function plumSprite(i) {
    if (plumImgs[i]) return plumImgs[i];
    var c = el(64, 80);
    var g = c.getContext("2d");
    R(g, 28, 48, 6, 26, "#4a2c20");
    R(g, 30, 52, 2, 16, "#8a5a38");
    R(g, 18, 40, 16, 4, "#4a2c20");
    R(g, 36, 36, 14, 4, "#4a2c20");
    oval(g, 24, 28, 16, 14, "#e07090");
    oval(g, 40, 24, 14, 12, "#f4b0c8");
    oval(g, 30, 18, 8, 6, "#ffffff");
    R(g, 16, 20, 4, 4, "#ffffff");
    R(g, 36, 14, 3, 3, "#e07090");
    R(g, 46, 22, 3, 3, "#f7fbff");
    R(g, 22, 30, 4, 3, "#f7fbff");
    if (i) R(g, 12, 34, 3, 3, "#e07090");
    outlineCanvas(c);
    plumImgs[i] = c;
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

  function tileRoof(g, x, y, w, h, roof, roofHi, roofSh, snow) {
    R(g, x, y, w, h, roof);
    var row, col;
    for (row = 0; row < h; row += 4) {
      R(g, x, y + row, w, 1, roofHi);
      if (row + 3 < h) R(g, x, y + row + 3, w, 1, roofSh);
    }
    for (col = 6; col < w; col += 8) R(g, x + col, y, 1, h, roofSh);
    R(g, x, y, w, 2, roofHi);
    if (snow) {
      R(g, x + 6, y, w - 14, 5, "#f4f8fc");
      R(g, x + 16, y + 4, 14, 3, "#ffffff");
      R(g, x + w - 22, y + 2, 8, 3, "#e7eef6");
    }
  }
  function makeHouse(key) {
    if (houses[key]) return houses[key];
    var c = el(168, 120);
    var g = c.getContext("2d");
    var wall = "#e7d3a4", wallSh = "#c4a56e", roof = "#4e5966", roofHi = "#9aa6b4", roofSh = "#2c3440", wood = "#8a5a32", snow = false, thatch = false;
    if (key === "house_red") { roof = "#a33a3a"; roofHi = "#e08080"; roofSh = "#6a2020"; wall = "#f4efe4"; }
    if (key === "house_thatch" || key === "house_thatch2") { thatch = true; roof = "#c6a05a"; roofHi = "#f0d498"; roofSh = "#7a5830"; wall = "#e8d2a4"; wood = "#6a4428"; }
    if (key === "house_plaster") { wall = "#f7f4ee"; wallSh = "#d9d3c6"; }
    if (key === "pavilion") { snow = true; wall = "#c4a06a"; }
    oval(g, 84, 112, 50, 4, "#2a241c");
    R(g, 36, 58, 96, 48, "#c4844a");
    R(g, 48, 66, 28, 16, "#8a5a32");
    R(g, 52, 70, 16, 8, "#e8c898");
    R(g, 92, 72, 10, 8, "#ffd08a");
    R(g, 28, 52, 112, 40, wall);
    R(g, 120, 56, 16, 34, wallSh);
    R(g, 32, 56, 8, 40, wood);
    R(g, 128, 56, 8, 40, wood);
    R(g, 74, 70, 18, 28, "#5a3a22");
    R(g, 76, 72, 6, 12, "#f0d090");
    R(g, 40, 62, 16, 14, "#1c2838");
    R(g, 42, 64, 8, 8, "#ffd56a");
    R(g, 108, 62, 14, 12, "#1c2838");
    R(g, 110, 64, 6, 6, "#ffb060");
    if (thatch) {
      R(g, 16, 40, 136, 22, roof);
      for (var tr = 0; tr < 22; tr += 3) R(g, 16, 40 + tr, 136, 1, tr % 6 ? roofSh : roofHi);
    } else {
      tileRoof(g, 18, 36, 132, 22, roof, roofHi, roofSh, snow);
    }
    R(g, 58, 14, 52, 28, roof);
    R(g, 58, 14, 52, 3, roofHi);
    R(g, 70, 8, 28, 8, roofSh);
    R(g, 74, 6, 20, 4, roofHi);
    if (snow) {
      R(g, 64, 10, 30, 6, "#f7fbff");
      R(g, 24, 34, 40, 5, "#ffffff");
    }
    R(g, 146, 48, 6, 10, "#e05840");
    R(g, 147, 50, 3, 4, "#ffd56a");
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
    R(ctx, 0, 0, w, (h * 0.45) | 0, "#2c3c58");
    var cropH = 36;
    var scale = Math.min(w / spr.width, h / cropH);
    var dw = spr.width * scale, dh = cropH * scale;
    ctx.drawImage(spr, 0, 0, spr.width, cropH, ((w - dw) / 2) | 0, ((h - dh) / 2) | 0, dw | 0, dh | 0);
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
    ctx.fillRect(x | 0, y | 0, 1, 1);
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
    var fyFoot = { x: 42 + lx, y: 110 };
    var eFoot = { x: 124 - es, y: 106 };
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
    if (name === "plum") return plumSprite(1);
    if (name === "pavilion") return makeHouse("pavilion");
    var wide = name === "pond" || name === "fence" ? 64 : name === "boat" || name === "reed" ? 40 : name === "rock" ? 40 : 32;
    var tall = name === "pond" ? 48 : name === "fence" ? 28 : name === "boat" ? 24 : name === "reed" ? 40 : name === "rock" ? 32 : 32;
    var c = el(wide, tall);
    var g = c.getContext("2d");
    if (name === "well") {
      oval(g, 16, 28, 12, 4, "#3a3028");
      block(g, 6, 10, 20, 16, "#9aa4ae");
      R(g, 8, 12, 16, 8, "#3a6a90");
      R(g, 10, 13, 4, 2, "#d5f0ff");
      block(g, 4, 8, 24, 4, "#6a5038");
      R(g, 14, 4, 4, 8, "#8a6840");
    } else if (name === "pond") {
      oval(g, 32, 26, 26, 14, "#1e6a78");
      oval(g, 32, 26, 18, 9, "#2f8ea0");
      oval(g, 28, 24, 8, 4, "#7fd4e0");
      R(g, 18, 22, 10, 2, "#e8fbff");
      R(g, 36, 28, 6, 1, "#ffffff");
      oval(g, 14, 30, 5, 3, "#8a939c");
      oval(g, 48, 32, 4, 3, "#6a7580");
      R(g, 8, 16, 3, 14, "#6a8a48");
      R(g, 12, 12, 4, 12, "#c2b48a");
      R(g, 50, 14, 3, 16, "#d8c898");
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
    } else if (name === "rocklamp") {
      R(g, 12, 14, 8, 14, "#9aa4ae");
      R(g, 10, 12, 12, 4, "#6a5438");
      R(g, 8, 6, 16, 8, "#5a5048");
      R(g, 11, 8, 8, 4, "#ffd56a");
      R(g, 13, 9, 3, 2, "#fff6d0");
      R(g, 6, 4, 20, 3, "#d8dee6");
    } else if (name === "fence") {
      R(g, 4, 8, 56, 4, "#8a5a32");
      R(g, 4, 16, 56, 3, "#6a4428");
      R(g, 8, 4, 4, 22, "#5a3820");
      R(g, 28, 4, 4, 22, "#5a3820");
      R(g, 48, 4, 4, 22, "#5a3820");
    } else if (name === "boat") {
      R(g, 4, 10, 32, 8, "#8a5a32");
      R(g, 8, 8, 24, 4, "#c4844a");
      R(g, 18, 4, 3, 10, "#5a3820");
      R(g, 2, 14, 36, 3, "#6a4428");
    } else if (name === "rock") {
      oval(g, 20, 20, 14, 8, "#8a939c");
      oval(g, 16, 16, 8, 5, "#d8dee6");
      R(g, 10, 18, 8, 4, "#f7fbff");
      R(g, 24, 22, 6, 3, "#4e8a3e");
    } else if (name === "reed") {
      R(g, 8, 10, 2, 26, "#c2b48a");
      R(g, 14, 6, 2, 30, "#e6d7b0");
      R(g, 20, 12, 2, 24, "#a89870");
      R(g, 26, 8, 2, 28, "#efe4c4");
      R(g, 6, 8, 6, 3, "#d8c898");
      R(g, 18, 6, 6, 3, "#f4ead0");
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
    { k: "veg", x: 6, y: 19 }, { k: "rocklamp", x: 4, y: 15 },
    { k: "fence", x: 7, y: 19 }, { k: "rock", x: 16, y: 6 }, { k: "rock", x: 11, y: 7 }
  ];
  var DECOR_EAST = [
    { k: "pavilion", x: 26, y: 5 },
    { k: "rocklamp", x: 20, y: 5 }, { k: "rocklamp", x: 23, y: 8 },
    { k: "plum", x: 19, y: 4 }, { k: "plum", x: 29, y: 7 }, { k: "plum", x: 24, y: 3 },
    { k: "pond", x: 18, y: 9 }, { k: "boat", x: 19, y: 9 }, { k: "reed", x: 17, y: 8 },
    { k: "fence", x: 21, y: 8 }, { k: "rock", x: 28, y: 6 }
  ];
  var DECOR_PRO = [
    { k: "rocklamp", x: 8, y: 20 }, { k: "plum", x: 14, y: 18 }
  ];

  function sheet() {
    var list = ["hero", "hero_old", "bnb", "fangzheng", "elder", "chief", "uncle", "aunt", "merchant", "mobei", "chicheng", "guard", "xiong", "enforcer", "rv", "rvboss", "wolf", "bigwolf", "boss", "icewolf", "bear", "boar", "bat"];
    var c = el(6 * 100, 4 * 100);
    var g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    R(g, 0, 0, c.width, c.height, "#e7eef2");
    list.forEach(function (k, i) {
      var img = sprite(k, "down", 0);
      var x = (i % 6) * 100 + 8;
      var y = Math.floor(i / 6) * 100 + 6;
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
