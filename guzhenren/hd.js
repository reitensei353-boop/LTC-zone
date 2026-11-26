/* 类像素（HD-2D）绘制层。
   地图和人物按 3 倍细节画，再缩到原来的格子里，手机上每个点都很小。
   轮廓和有限配色还在，另外加了渐变、高光、地面阴影和雾。 */
(function () {
  "use strict";
  var S = 3;
  var tiles = {};
  var actors = {};
  var houses = {};

  function el(w, h) {
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }
  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  var PEOPLE = {
    hero: { hair: "#12131a", hairHi: "#4a5166", skin: "#f4ece6", skinSh: "#d8c4ba", robe: "#8e97a8", robeHi: "#c5ccd8", robeSh: "#5c6576", inner: "#232733", scarf: "#fbfcfe", scarfSh: "#b7c2d2", eye: "#14161e", tassel: true },
    hero_old: { hair: "#100e14", hairHi: "#322c38", skin: "#e7ddd6", skinSh: "#cbb8b0", robe: "#4e5564", robeHi: "#8b93a3", robeSh: "#2a2e38", inner: "#141218", scarf: "#9a3040", scarfSh: "#641e2a", eye: "#9a2834", tassel: true },
    bnb: { hair: "#c5d0de", hairHi: "#f7fbff", skin: "#f8efea", skinSh: "#e2d0cc", robe: "#f4f7f8", robeHi: "#ffffff", robeSh: "#c5d4d8", inner: "#243040", trim: "#5fafa4", trimSh: "#2f7c74", eye: "#1f8ea6", longHair: true },
    fangzheng: { hair: "#2c241c", hairHi: "#5a4636", skin: "#f6d7b8", skinSh: "#d7a882", robe: "#3d6ec4", robeHi: "#7aa4e4", robeSh: "#243e78", inner: "#1c2848", eye: "#2a241c" },
    elder: { hair: "#d9dde4", hairHi: "#ffffff", skin: "#f0c8a4", skinSh: "#c8926a", robe: "#6a4a86", robeHi: "#a888c4", robeSh: "#3e2a52", inner: "#241830", eye: "#3a2a22" },
    chief: { hair: "#eceff4", hairHi: "#ffffff", skin: "#f0c8a4", skinSh: "#c8926a", robe: "#8e2434", robeHi: "#d06070", robeSh: "#4e1420", inner: "#2a1014", eye: "#3a2a22" },
    uncle: { hair: "#3a2c22", hairHi: "#6a5040", skin: "#e8b98a", skinSh: "#c08858", robe: "#a56a32", robeHi: "#e0a060", robeSh: "#6a4018", inner: "#3a2410", eye: "#2a1c14" },
    aunt: { hair: "#4a3038", hairHi: "#8a6068", skin: "#f3c8b0", skinSh: "#d09880", robe: "#d07090", robeHi: "#f0a8c0", robeSh: "#8a4060", inner: "#4a2030", eye: "#3a2428" },
    merchant: { hair: "#3a3028", hairHi: "#6a5848", skin: "#e8c09a", skinSh: "#c08860", robe: "#e0b050", robeHi: "#f0d488", robeSh: "#a07028", inner: "#5a4010", eye: "#2a1c14" },
    mobei: { hair: "#2a2628", hairHi: "#504848", skin: "#f0c8a4", skinSh: "#c89068", robe: "#5e7080", robeHi: "#98a8b4", robeSh: "#364450", inner: "#222a32", eye: "#241c18" },
    chicheng: { hair: "#3a1818", hairHi: "#6a3030", skin: "#f0c8a4", skinSh: "#c89068", robe: "#b04040", robeHi: "#e07878", robeSh: "#6e2020", inner: "#3a1414", eye: "#241410" },
    guard: { hair: "#dfe6ee", hairHi: "#ffffff", skin: "#f3d2b4", skinSh: "#d0a484", robe: "#e8eef4", robeHi: "#ffffff", robeSh: "#b7c4d2", inner: "#2a3a52", trim: "#5aa0dc", eye: "#243044" },
    xiong: { hair: "#4a2c18", hairHi: "#8a5a32", skin: "#e8b888", skinSh: "#c08050", robe: "#8a5a2c", robeHi: "#c48848", robeSh: "#5a3414", inner: "#3a2010", eye: "#2a140c" },
    enforcer: { hair: "#e4e6ea", hairHi: "#ffffff", skin: "#efc8a6", skinSh: "#c89070", robe: "#d8c07a", robeHi: "#f0e2a8", robeSh: "#8a7038", inner: "#4a3818", eye: "#3a2a18" },
    rv: { hair: "#e8eef6", hairHi: "#ffffff", skin: "#f6d8bc", skinSh: "#d8a888", robe: "#f4f7fb", robeHi: "#ffffff", robeSh: "#c5d2e2", inner: "#2a4068", trim: "#e2c25a", eye: "#243048" },
    rvboss: { hair: "#f2f4f8", hairHi: "#ffffff", skin: "#f4d4b4", skinSh: "#d0a484", robe: "#f7f4ea", robeHi: "#ffffff", robeSh: "#d8d0bc", inner: "#3a4868", trim: "#e6c45e", eye: "#2a3848", halo: true }
  };

  function paintHuman(W, H, spec, dir, frame) {
    var c = el(W, H);
    var g = c.getContext("2d");
    var bob = frame % 2 ? -Math.max(1, H * 0.035) : 0;
    var step = frame % 2 ? W * 0.06 : -W * 0.02;
    g.translate(0, bob);
    var cx = W / 2;
    var robeTop = H * 0.42;
    var grd = g.createLinearGradient(cx, robeTop, cx, H * 0.96);
    grd.addColorStop(0, spec.robeHi);
    grd.addColorStop(0.45, spec.robe);
    grd.addColorStop(1, spec.robeSh);
    g.fillStyle = grd;
    g.strokeStyle = "rgba(18,20,28,0.55)";
    g.lineWidth = Math.max(1.25, W * 0.035);
    g.beginPath();
    g.moveTo(cx - W * 0.22, robeTop);
    g.lineTo(cx + W * 0.22, robeTop);
    g.quadraticCurveTo(cx + W * 0.4, H * 0.72, cx + W * 0.26, H * 0.94);
    g.lineTo(cx - W * 0.26, H * 0.94);
    g.quadraticCurveTo(cx - W * 0.4, H * 0.72, cx - W * 0.22, robeTop);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = spec.inner;
    g.beginPath();
    g.moveTo(cx, robeTop + H * 0.02);
    g.lineTo(cx + W * 0.1, H * 0.78);
    g.lineTo(cx - W * 0.1, H * 0.78);
    g.fill();
    if (spec.trim) {
      g.strokeStyle = spec.trim;
      g.lineWidth = Math.max(1, W * 0.035);
      g.beginPath();
      g.moveTo(cx - W * 0.08, robeTop + 1);
      g.lineTo(cx, H * 0.62);
      g.lineTo(cx + W * 0.08, robeTop + 1);
      g.stroke();
      g.fillStyle = spec.trim;
      g.fillRect(cx - W * 0.18, H * 0.6, W * 0.36, Math.max(3, H * 0.07));
      g.strokeStyle = spec.trimSh || spec.trim;
      g.beginPath();
      g.moveTo(cx - W * 0.04, H * 0.66);
      g.lineTo(cx - W * 0.08, H * 0.86);
      g.moveTo(cx + W * 0.04, H * 0.66);
      g.lineTo(cx + W * 0.1, H * 0.84);
      g.stroke();
    }
    g.fillStyle = spec.robeSh;
    g.fillRect(cx - W * 0.16 + step, H * 0.9, W * 0.1, H * 0.08);
    g.fillRect(cx + W * 0.06 - step, H * 0.9, W * 0.1, H * 0.08);
    g.fillStyle = spec.inner;
    g.fillRect(cx - W * 0.14 + step, H * 0.95, W * 0.08, H * 0.045);
    g.fillRect(cx + W * 0.06 - step, H * 0.95, W * 0.08, H * 0.045);
    // sleeves
    var sg = g.createLinearGradient(0, robeTop, W, H * 0.7);
    sg.addColorStop(0, spec.robeHi);
    sg.addColorStop(1, spec.robeSh);
    g.fillStyle = sg;
    g.beginPath();
    g.ellipse(cx - W * 0.28, H * 0.56, W * 0.16, H * 0.1, -0.4, 0, 6.3);
    g.fill();
    g.beginPath();
    g.ellipse(cx + W * 0.28, H * 0.56, W * 0.16, H * 0.1, 0.4, 0, 6.3);
    g.fill();
    if (spec.trim) {
      g.fillStyle = spec.inner;
      g.fillRect(cx - W * 0.4, H * 0.58, W * 0.08, H * 0.05);
    }
    // head
    var hy = H * 0.16;
    var hr = W * 0.2;
    if (dir === "up") {
      var hg = g.createLinearGradient(cx, hy - hr, cx, hy + H * 0.42);
      hg.addColorStop(0, spec.hairHi);
      hg.addColorStop(0.4, spec.hair);
      hg.addColorStop(1, spec.hair);
      g.fillStyle = hg;
      g.beginPath();
      g.ellipse(cx, hy + hr * 0.2, hr * 1.05, hr * 1.15, 0, 0, 6.3);
      g.fill();
      g.fillRect(cx - hr * 0.85, hy, hr * 1.7, H * 0.42);
      g.strokeStyle = spec.hairHi;
      g.globalAlpha = 0.45;
      g.lineWidth = Math.max(1, W * 0.03);
      g.beginPath();
      g.moveTo(cx - hr * 0.35, hy);
      g.quadraticCurveTo(cx - hr * 0.5, hy + H * 0.2, cx - hr * 0.2, hy + H * 0.36);
      g.stroke();
      g.globalAlpha = 1;
    } else {
      var faceL = dir === "left";
      var faceR = dir === "right";
      var shift = faceL ? -W * 0.04 : faceR ? W * 0.04 : 0;
      g.fillStyle = spec.skin;
      g.beginPath();
      g.ellipse(cx + shift, hy + hr * 0.15, hr * 0.78, hr * 0.92, 0, 0, 6.3);
      g.fill();
      g.fillStyle = spec.skinSh;
      g.globalAlpha = 0.55;
      g.beginPath();
      g.ellipse(cx + shift, hy + hr * 0.55, hr * 0.55, hr * 0.28, 0, 0, 3.2);
      g.fill();
      g.globalAlpha = 1;
      g.fillStyle = spec.eye;
      var eyeY = hy + hr * 0.05;
      if (!faceL) g.fillRect(cx + shift + hr * 0.18, eyeY, Math.max(2, W * 0.055), Math.max(2, H * 0.028));
      if (!faceR) g.fillRect(cx + shift - hr * 0.42, eyeY, Math.max(2, W * 0.055), Math.max(2, H * 0.028));
      if (spec.eyeHi) {
        g.fillStyle = spec.eyeHi;
      }
      g.fillStyle = spec.skinSh;
      g.fillRect(cx + shift - W * 0.03, hy + hr * 0.45, Math.max(2, W * 0.06), Math.max(1, H * 0.012));
      var hg2 = g.createLinearGradient(cx, hy - hr, cx, hy + hr);
      hg2.addColorStop(0, spec.hairHi);
      hg2.addColorStop(1, spec.hair);
      g.fillStyle = hg2;
      g.beginPath();
      g.ellipse(cx, hy - hr * 0.15, hr * 1.05, hr * 0.85, 0, Math.PI, 0);
      g.fill();
      g.fillRect(cx - hr, hy - hr * 0.2, hr * 0.28, H * 0.34);
      g.fillRect(cx + hr * 0.72, hy - hr * 0.2, hr * 0.28, H * 0.34);
      if (spec.longHair) {
        g.fillStyle = spec.hair;
        g.globalAlpha = 0.9;
        g.beginPath();
        g.moveTo(cx - hr * 1.3, hy);
        g.quadraticCurveTo(cx - W * 0.55, H * 0.45, cx - W * 0.42, H * 0.78);
        g.lineTo(cx - W * 0.28, H * 0.72);
        g.quadraticCurveTo(cx - W * 0.4, H * 0.4, cx - hr * 0.4, hy + hr * 0.2);
        g.fill();
        g.beginPath();
        g.moveTo(cx + hr * 0.5, hy + hr * 0.1);
        g.quadraticCurveTo(cx + W * 0.2, H * 0.35, cx + W * 0.08, hy + hr * 0.7);
        g.strokeStyle = spec.hairHi;
        g.lineWidth = Math.max(1, W * 0.02);
        g.stroke();
        g.globalAlpha = 1;
      }
    }
    if (spec.tassel) {
      g.fillStyle = spec.scarf;
      g.strokeStyle = "rgba(18,20,28,0.35)";
      g.lineWidth = Math.max(1, W * 0.02);
      g.beginPath();
      g.ellipse(cx, robeTop - H * 0.015, W * 0.24, H * 0.055, 0, 0, 6.3);
      g.fill();
      g.stroke();
      g.fillStyle = spec.scarf;
      g.fillRect(cx - W * 0.07, robeTop, W * 0.14, H * 0.2);
      g.strokeStyle = spec.scarfSh;
      g.lineWidth = 1;
      var tx = cx - W * 0.04;
      g.beginPath();
      g.moveTo(tx, robeTop + H * 0.14);
      g.lineTo(tx - W * 0.02, robeTop + H * 0.26);
      g.moveTo(tx + W * 0.05, robeTop + H * 0.14);
      g.lineTo(tx + W * 0.07, robeTop + H * 0.25);
      g.stroke();
    }
    if (spec.halo && dir !== "up") {
      g.strokeStyle = spec.trim || "#e6c45e";
      g.globalAlpha = 0.8;
      g.lineWidth = Math.max(1, W * 0.03);
      g.beginPath();
      g.ellipse(cx, H * 0.12, W * 0.28, H * 0.08, 0, 0, 6.3);
      g.stroke();
      g.globalAlpha = 1;
    }
    return c;
  }

  function paintBeast(W, H, kind, frame) {
    var c = el(W, H);
    var g = c.getContext("2d");
    var bob = frame % 2 ? -2 : 0;
    g.translate(0, bob);
    var body = "#8aa4c8", belly = "#d5e4f4", dark = "#243044", eye = "#f4f7fb";
    if (kind === "bigwolf") { body = "#c5d4ea"; belly = "#eef3fb"; dark = "#1c2844"; }
    if (kind === "boss") { body = "#3a2c58"; belly = "#6a5888"; dark = "#140e22"; eye = "#ffd86a"; }
    if (kind === "icewolf") { body = "#d5ecff"; belly = "#f7fbff"; dark = "#2a4a6a"; }
    if (kind === "bear") { body = "#8a5a34"; belly = "#d8b088"; dark = "#3a2414"; }
    if (kind === "boar") { body = "#6a4030"; belly = "#c49878"; dark = "#2a1610"; }
    if (kind === "bat") { body = "#a4283c"; belly = "#e07080"; dark = "#3a1018"; }
    var grd = g.createLinearGradient(0, H * 0.2, 0, H);
    grd.addColorStop(0, belly);
    grd.addColorStop(0.35, body);
    grd.addColorStop(1, dark);
    g.fillStyle = grd;
    g.beginPath();
    g.ellipse(W * 0.52, H * 0.58, W * 0.36, H * 0.26, 0, 0, 6.3);
    g.fill();
    g.beginPath();
    g.ellipse(W * 0.72, H * 0.4, W * 0.2, H * 0.2, 0, 0, 6.3);
    g.fill();
    g.fillStyle = dark;
    g.beginPath();
    g.moveTo(W * 0.62, H * 0.28);
    g.lineTo(W * 0.7, H * 0.12);
    g.lineTo(W * 0.78, H * 0.3);
    g.fill();
    g.beginPath();
    g.moveTo(W * 0.78, H * 0.3);
    g.lineTo(W * 0.9, H * 0.14);
    g.lineTo(W * 0.9, H * 0.36);
    g.fill();
    g.fillStyle = eye;
    g.beginPath();
    g.arc(W * 0.8, H * 0.38, Math.max(1.5, W * 0.035), 0, 6.3);
    g.fill();
    g.fillStyle = dark;
    var leg = frame % 2 ? 0.04 : -0.02;
    [0.32, 0.46, 0.6, 0.72].forEach(function (lx, i) {
      g.fillRect(W * (lx + (i % 2 ? leg : -leg)), H * 0.72, W * 0.06, H * 0.2);
    });
    if (kind === "wolf" || kind === "bigwolf" || kind === "boss") {
      g.strokeStyle = kind === "boss" ? "#ffd86a" : "#7ee7f2";
      g.globalAlpha = 0.85;
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(W * 0.3, H * 0.4);
      g.lineTo(W * 0.42, H * 0.28);
      g.lineTo(W * 0.5, H * 0.42);
      g.stroke();
      g.globalAlpha = 1;
    }
    if (kind === "boss") {
      g.fillStyle = "#ffd86a";
      g.globalAlpha = 0.9;
      g.beginPath();
      g.moveTo(W * 0.68, H * 0.22);
      g.lineTo(W * 0.74, H * 0.05);
      g.lineTo(W * 0.8, H * 0.2);
      g.lineTo(W * 0.88, H * 0.06);
      g.lineTo(W * 0.86, H * 0.24);
      g.fill();
      g.globalAlpha = 1;
    }
    return c;
  }

  function actorCanvas(kind, dir, frame) {
    var key = kind + ":" + dir + ":" + (frame % 2);
    if (actors[key]) return actors[key];
    var spec = PEOPLE[kind] || PEOPLE.mobei;
    if (kind === "bnb") spec = Object.assign({ longHair: true }, PEOPLE.bnb);
    var beast = { wolf: 1, bigwolf: 1, boss: 1, icewolf: 1, bear: 1, boar: 1, bat: 1 }[kind];
    var c = beast ? paintBeast(72, 56, kind, frame) : paintHuman(48, 48, spec, dir, frame);
    actors[key] = c;
    return c;
  }

  function makeTile(ch, variant) {
    var key = ch + ":" + (variant || 0);
    if (tiles[key]) return tiles[key];
    var c = el(48, 48);
    var g = c.getContext("2d");
    var base = "#5f9a48", hi = "#8ec86a", sh = "#2f6a34", fleck = "#dfe8c8";
    if (ch === "p" || ch === "E" || ch === "<" || ch === "O") { base = "#c4a36e"; hi = "#e6d0a4"; sh = "#8a6840"; fleck = "#f4ead4"; }
    else if (ch === "w") { base = "#d5e6f2"; hi = "#f7fbff"; sh = "#8eb0c8"; fleck = "#ffffff"; }
    else if (ch === "s") { base = "#6a7384"; hi = "#9aa6b8"; sh = "#3e4656"; fleck = "#c5d0de"; }
    else if (ch === "c" || ch === "C" || ch === "X") { base = "#3a3050"; hi = "#6a5880"; sh = "#1c1428"; fleck = "#d8c8a0"; }
    else if (ch === "M") { base = "#8a929c"; hi = "#c5ccd4"; sh = "#4a525c"; fleck = "#eef2f4"; }
    else if (ch === "#") { base = "#6a5030"; hi = "#c09058"; sh = "#3a2814"; fleck = "#e8d0a8"; }
    var grd = g.createLinearGradient(0, 0, 48, 48);
    grd.addColorStop(0, hi);
    grd.addColorStop(0.55, base);
    grd.addColorStop(1, sh);
    g.fillStyle = grd;
    g.fillRect(0, 0, 48, 48);
    g.globalAlpha = 0.35;
    g.fillStyle = sh;
    g.beginPath();
    g.ellipse(34, 36, 14, 7, 0.4, 0, 6.3);
    g.fill();
    g.globalAlpha = 1;
    if (ch === "q" || ch === "H" || ch === "f" || ch === "Y" || ch === "b") {
      g.strokeStyle = hi;
      g.lineWidth = 1;
      for (var i = 0; i < 14; i++) {
        var x = (i * 19 + ch.charCodeAt(0) * 3 + (variant || 0) * 7) % 44 + 2;
        var y = (i * 11 + 5 + (variant || 0) * 5) % 40 + 4;
        g.beginPath();
        g.moveTo(x, y + 6);
        g.quadraticCurveTo(x + 1, y + 2, x + (i % 2 ? 3 : -3), y);
        g.stroke();
      }
    }
    if (ch === "f") {
      ["#f2c9dc", "#fff4b0", "#ffffff"].forEach(function (col, i) {
        g.fillStyle = col;
        g.beginPath();
        g.arc(10 + i * 14, 16 + (i % 2) * 16, 2.2, 0, 6.3);
        g.fill();
      });
    }
    if (ch === "b") {
      g.strokeStyle = "#1e6a32";
      g.lineWidth = 2;
      for (var k = 0; k < 3; k++) {
        g.beginPath();
        g.moveTo(10 + k * 14, 44);
        g.lineTo(12 + k * 14, 6);
        g.stroke();
        g.strokeStyle = "#9be07a";
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(6 + k * 14, 16);
        g.lineTo(18 + k * 14, 14);
        g.moveTo(7 + k * 14, 26);
        g.lineTo(18 + k * 14, 24);
        g.stroke();
        g.strokeStyle = "#1e6a32";
        g.lineWidth = 2;
      }
    }
    if (ch === "Y") {
      g.fillStyle = "#3e6a28";
      g.beginPath();
      g.arc(24, 18, 14, 0, 6.3);
      g.fill();
      g.fillStyle = "#7dba52";
      g.beginPath();
      g.arc(18, 14, 8, 0, 6.3);
      g.fill();
      g.fillStyle = "#5a3a22";
      g.fillRect(22, 26, 4, 16);
    }
    if (ch === "M" || ch === "C" || ch === "X") {
      g.strokeStyle = "rgba(255,255,255,0.28)";
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(8, 12);
      g.lineTo(20, 18);
      g.lineTo(16, 34);
      g.stroke();
      g.fillStyle = "rgba(255,255,255,0.18)";
      g.beginPath();
      g.ellipse(16, 12, 8, 3, -0.4, 0, 6.3);
      g.fill();
    }
    if (ch === "p" || ch === "E" || ch === "<" || ch === "O" || ch === "s") {
      g.fillStyle = fleck;
      for (var n = 0; n < 7; n++) g.fillRect((n * 13 + 4) % 44, (n * 9 + 6) % 40, 2, 2);
    }
    if (ch === "w") {
      g.fillStyle = "rgba(255,255,255,0.7)";
      for (var s = 0; s < 8; s++) g.fillRect((s * 11 + 3) % 46, (s * 7 + 2) % 44, 1, 1);
    }
    if (ch === "#") {
      g.fillStyle = hi;
      for (var p = 0; p < 4; p++) {
        g.fillRect(4 + p * 12, 4, 6, 40);
        g.fillStyle = sh;
        g.fillRect(4 + p * 12, 4, 2, 40);
        g.fillStyle = hi;
      }
    }
    if (ch === "X") {
      g.strokeStyle = "#e8d8a8";
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(20, 8);
      g.lineTo(28, 24);
      g.lineTo(18, 40);
      g.stroke();
    }
    tiles[key] = c;
    return c;
  }

  function makeHouse(key) {
    if (houses[key]) return houses[key];
    var c = el(192, 132);
    var g = c.getContext("2d");
    var wall = "#efe6d4", wallSh = "#d8c8a8", roof = "#c45a3a", roofHi = "#e88868", roofSh = "#7a3024";
    if (key === "house_thatch" || key === "house_thatch2") { roof = "#c4a05a"; roofHi = "#e6cc88"; roofSh = "#7a5a28"; }
    if (key === "house_plaster") { wall = "#f4f1ea"; wallSh = "#d5d0c6"; roof = "#8a4a3a"; }
    g.fillStyle = "rgba(40,30,20,0.18)";
    g.beginPath();
    g.ellipse(96, 124, 70, 8, 0, 0, 6.3);
    g.fill();
    var wg = g.createLinearGradient(40, 50, 160, 120);
    wg.addColorStop(0, "#ffffff");
    wg.addColorStop(0.4, wall);
    wg.addColorStop(1, wallSh);
    g.fillStyle = wg;
    g.fillRect(48, 58, 104, 62);
    g.fillStyle = "#6a5038";
    g.fillRect(86, 86, 22, 34);
    g.fillStyle = "#f4e2b0";
    g.fillRect(60, 74, 16, 14);
    g.fillRect(124, 74, 16, 14);
    g.fillStyle = "rgba(255,255,255,0.35)";
    g.fillRect(48, 58, 6, 62);
    var rg = g.createLinearGradient(20, 20, 180, 70);
    rg.addColorStop(0, roofHi);
    rg.addColorStop(0.5, roof);
    rg.addColorStop(1, roofSh);
    g.fillStyle = rg;
    g.beginPath();
    g.moveTo(28, 64);
    g.lineTo(96, 18);
    g.lineTo(172, 64);
    g.lineTo(150, 64);
    g.lineTo(96, 34);
    g.lineTo(46, 64);
    g.fill();
    g.strokeStyle = "rgba(255,255,255,0.35)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(46, 40);
    g.lineTo(96, 22);
    g.stroke();
    houses[key] = c;
    return c;
  }

  function paintFace(ctx, face, w, h) {
    var spec = face === "hero_old" ? PEOPLE.hero_old : face === "bnb_girl" ? Object.assign({ longHair: true }, PEOPLE.bnb) : face === "hero" ? PEOPLE.hero : null;
    ctx.clearRect(0, 0, w, h);
    var bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#243044");
    bg.addColorStop(1, "#121722");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    if (!spec) return false;
    var glow = ctx.createRadialGradient(w * 0.55, h * 0.4, 4, w * 0.5, h * 0.45, w * 0.55);
    glow.addColorStop(0, spec.trim ? "rgba(127,184,176,0.35)" : "rgba(200,210,230,0.2)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    var spr = paintHuman(w, h, spec, "down", 0);
    ctx.drawImage(spr, 0, h * 0.02, w, h * 0.98);
    return true;
  }

  function prepare(canvas, ctx) {
    var bw = 176 * S, bh = 144 * S;
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  }

  function blitTile(ctx, ch, x, y) {
    var img = makeTile(ch || "M", (Math.abs(Math.round(x)) * 3 + Math.abs(Math.round(y))) % 4);
    ctx.drawImage(img, x, y, 16, 16);
  }

  function drawHouse(ctx, key, x, y) {
    ctx.drawImage(makeHouse(key), x, y, 64, 44);
  }

  function kindOf(spriteOrKind) {
    if (PEOPLE[spriteOrKind]) return spriteOrKind;
    if (spriteOrKind === "bnb_girl" || spriteOrKind === "bnb") return "bnb";
    if (spriteOrKind === "fangzheng") return "fangzheng";
    if (spriteOrKind === "baiguard" || spriteOrKind === "rv") return "rv";
    if (spriteOrKind === "rvelite" || spriteOrKind === "rvboss") return "rvboss";
    if (spriteOrKind === "xionglin") return "xiong";
    if (spriteOrKind === "enforcer") return "enforcer";
    return spriteOrKind;
  }

  function drawActor(ctx, kind, dir, frame, x, y, w, h) {
    var img = actorCanvas(kindOf(kind), dir || "down", frame || 0);
    ctx.drawImage(img, x, y, w, h);
  }

  function atmosphere(ctx, mapId) {
    var g = ctx.createLinearGradient(0, 0, 0, 144);
    g.addColorStop(0, "rgba(255,255,255,0.05)");
    g.addColorStop(0.55, "rgba(255,255,255,0)");
    g.addColorStop(1, mapId === "pro" ? "rgba(40,0,16,0.28)" : "rgba(16,22,34,0.22)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 176, 144);
    var v = ctx.createRadialGradient(88, 70, 30, 88, 72, 120);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(8,10,18,0.28)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, 176, 144);
  }

  function sky(ctx, scene) {
    var g = ctx.createLinearGradient(0, 0, 0, 100);
    var cols = {
      village: ["#8ec8f0", "#d7eefc", "#e7f6e4"],
      forest: ["#6a4a78", "#c46a62", "#e7c07a"],
      night: ["#14182c", "#2a3a68", "#4a5a78"]
    }[scene] || ["#8ec8f0", "#d7eefc", "#e7f6e4"];
    g.addColorStop(0, cols[0]);
    g.addColorStop(0.55, cols[1]);
    g.addColorStop(1, cols[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 176, 78);
    if (scene === "night") {
      var moon = ctx.createRadialGradient(142, 18, 2, 142, 18, 16);
      moon.addColorStop(0, "rgba(255,255,240,0.95)");
      moon.addColorStop(1, "rgba(255,255,240,0)");
      ctx.fillStyle = moon;
      ctx.beginPath();
      ctx.arc(142, 18, 16, 0, 6.3);
      ctx.fill();
    }
    var ground = ctx.createLinearGradient(0, 70, 0, 144);
    ground.addColorStop(0, scene === "night" ? "#3a4458" : scene === "forest" ? "#3d6a32" : "#cbb48a");
    ground.addColorStop(1, scene === "night" ? "#232a38" : scene === "forest" ? "#23441e" : "#a88a5c");
    ctx.fillStyle = ground;
    ctx.fillRect(0, 72, 176, 72);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(0, 72, 176, 10);
  }

  function shadow(ctx, x, y, rx) {
    ctx.fillStyle = "rgba(20,16,24,0.28)";
    ctx.beginPath();
    ctx.ellipse(x, y, rx, rx * 0.28, 0, 0, 6.3);
    ctx.fill();
  }

  function drawBattle(ctx, o) {
    var b = o.battle;
    var hero = o.hero;
    var fx = o.fx;
    var tick = o.tick;
    var scene = o.scene;
    sky(ctx, scene);
    var mist = ctx.createLinearGradient(0, 60, 0, 110);
    mist.addColorStop(0, "rgba(255,255,255,0)");
    mist.addColorStop(1, "rgba(255,255,255,0.18)");
    ctx.fillStyle = mist;
    ctx.fillRect(0, 60, 176, 50);
    var human = { mobei: 1, chicheng: 1, rv: 1, rvelite: 1, rvboss: 1, baiguard: 1, xionglin: 1, bnb: 1, enforcer: 1 }[b.kind];
    var fyH = 44;
    var eH = fyH;
    if (human && (b.kind === "bnb" || b.kind === "rvboss" || b.kind === "xionglin" || b.kind === "enforcer")) eH = fyH * 1.18;
    else if (human) eH = fyH * 0.98;
    else if (b.kind === "boss") eH = fyH * 1.12;
    else if (b.kind === "bigwolf" || b.kind === "bear") eH = fyH * 0.82;
    else if (b.kind === "wolf" || b.kind === "icewolf") eH = fyH * 0.62;
    else eH = fyH * 0.5;
    var eW = human ? eH * 0.72 : eH * 1.15;
    var fyW = fyH * 0.72;
    var lx = fx.lunge > 0 ? Math.sin((fx.lunge / 12) * Math.PI) * 8 : 0;
    var exShift = fx.elunge > 0 ? Math.sin((fx.elunge / 12) * Math.PI) * 6 : 0;
    var fyFoot = { x: 34 + lx, y: 100 };
    var eFoot = { x: 132 - exShift, y: 94 };
    if (b.kind === "bnb" || b.kind === "boss" || b.kind === "rvboss") {
      var aura = ctx.createRadialGradient(eFoot.x, eFoot.y - eH * 0.45, 4, eFoot.x, eFoot.y - eH * 0.4, eH * 0.7);
      aura.addColorStop(0, b.kind === "bnb" ? "rgba(160,220,230,0.35)" : b.kind === "boss" ? "rgba(255,210,90,0.28)" : "rgba(255,220,140,0.3)");
      aura.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(eFoot.x, eFoot.y - eH * 0.4, eH * 0.7, 0, 6.3);
      ctx.fill();
    }
    shadow(ctx, fyFoot.x, fyFoot.y, fyW * 0.55);
    shadow(ctx, eFoot.x, eFoot.y, eW * 0.48);
    var fyKind = hero.map === "pro" ? "hero_old" : "hero";
    var fyImg = actorCanvas(fyKind, "up", fx.lunge > 0 ? 1 : 0);
    if (!(fx.flash > 0 && fx.flash % 4 < 2)) ctx.drawImage(fyImg, fyFoot.x - fyW / 2, fyFoot.y - fyH, fyW, fyH);
    var eKind = kindOf(b.kind);
    var eImg = actorCanvas(eKind, "down", Math.floor(tick / 10) % 2);
    ctx.save();
    if (fx.shake > 0) ctx.translate((fx.shake % 4 < 2 ? 0.6 : -0.6), 0);
    ctx.drawImage(eImg, eFoot.x - eW / 2, eFoot.y - eH, eW, eH);
    ctx.restore();
    var pct = Math.max(0, Math.min(1, b.hp / b.maxHp));
    ctx.fillStyle = "rgba(16,18,28,0.72)";
    roundRect(ctx, 96, 104, 66, 8, 2);
    ctx.fill();
    ctx.fillStyle = pct > 0.5 ? "#3ecf78" : pct > 0.25 ? "#ffd36a" : "#e04a5f";
    roundRect(ctx, 97, 105, Math.max(0, 64 * pct), 6, 1.5);
    ctx.fill();
  }

  window.HD = {
    S: S,
    prepare: prepare,
    blitTile: blitTile,
    drawHouse: drawHouse,
    drawActor: drawActor,
    atmosphere: atmosphere,
    drawBattle: drawBattle,
    paintFace: paintFace
  };
})();
