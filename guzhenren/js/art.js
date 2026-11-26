/* Procedural ink-wash painting. No image assets. */
(function () {
  "use strict";

  const SONG = '"Songti SC","STSong","Noto Serif CJK SC","Source Han Serif SC",serif';
  const KAI = '"Kaiti SC","STKaiti","KaiTi","Noto Serif CJK SC","Songti SC",serif';

  function mulberry32(a) {
    a >>>= 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }

  let noiseCanvas = null;
  function noiseTile() {
    if (noiseCanvas) return noiseCanvas;
    const c = document.createElement("canvas");
    c.width = 180;
    c.height = 180;
    const g = c.getContext("2d");
    const im = g.createImageData(180, 180);
    for (let i = 0; i < im.data.length; i += 4) {
      const n = 170 + Math.random() * 80;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = n;
      im.data[i + 3] = Math.random() < 0.45 ? 36 : 0;
    }
    g.putImageData(im, 0, 0);
    noiseCanvas = c;
    return c;
  }

  function paper(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#f6efe2");
    g.addColorStop(0.45, "#f1e6d2");
    g.addColorStop(1, "#e6d8c0");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  function grain(ctx, w, h) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    const tile = noiseTile();
    const pat = ctx.createPattern(tile, "repeat");
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  function stains(ctx, w, h, seed) {
    const rnd = mulberry32(seed);
    for (let i = 0; i < 6; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const r = 50 + rnd() * 120;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(150,120,80,0.055)");
      g.addColorStop(1, "rgba(150,120,80,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  function vignette(ctx, w, h) {
    const g = ctx.createRadialGradient(w * 0.5, h * 0.42, w * 0.2, w * 0.5, h * 0.5, w * 0.95);
    g.addColorStop(0, "rgba(60,40,20,0)");
    g.addColorStop(1, "rgba(70,55,40,0.16)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function sky(ctx, w, h, night) {
    const g = ctx.createLinearGradient(0, 0, 0, h * 0.72);
    if (night) {
      g.addColorStop(0, "#7e9098");
      g.addColorStop(0.45, "#c5cdd0");
      g.addColorStop(1, "#e4dccb");
    } else {
      g.addColorStop(0, "#d5e0e2");
      g.addColorStop(0.5, "#e7e4d8");
      g.addColorStop(1, "#f0e6d4");
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function ridge(ctx, w, y, amp, color, alpha, seed, steps) {
    const rnd = mulberry32(seed);
    ctx.beginPath();
    ctx.moveTo(0, hSafe(y + amp));
    let x = 0;
    const s = steps || 7;
    ctx.moveTo(0, y);
    while (x < w) {
      const nx = Math.min(w, x + w / s);
      const peak = y - amp * (0.45 + rnd() * 0.7);
      ctx.quadraticCurveTo((x + nx) / 2, peak, nx, y - amp * (0.15 + rnd() * 0.35));
      x = nx;
    }
    ctx.lineTo(w, y + amp * 3);
    ctx.lineTo(0, y + amp * 3);
    ctx.closePath();
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = amp * 0.35;
    ctx.fill();
    ctx.restore();
  }
  function hSafe(v) { return v; }

  function mountains(ctx, w, h, seed, night) {
    const base = night ? 0.34 : 0.30;
    ridge(ctx, w, h * (base + 0.02), h * 0.07, "#c5d0d4", 0.55, seed + 1, 5);
    ridge(ctx, w, h * (base + 0.08), h * 0.09, "#8ea3ab", 0.42, seed + 2, 6);
    ridge(ctx, w, h * (base + 0.15), h * 0.08, "#5d727a", 0.38, seed + 3, 5);
    ridge(ctx, w, h * (base + 0.22), h * 0.055, "#3e4e55", 0.28, seed + 4, 4);
  }

  function mistBand(ctx, w, y, bh, alpha, drift) {
    const g = ctx.createLinearGradient(0, y, 0, y + bh);
    g.addColorStop(0, "rgba(244,242,236,0)");
    g.addColorStop(0.5, "rgba(236,240,238," + alpha + ")");
    g.addColorStop(1, "rgba(244,242,236,0)");
    ctx.fillStyle = g;
    ctx.fillRect(-40 + (drift || 0), y, w + 80, bh);
  }

  function moon(ctx, x, y, r) {
    const g = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, r * 0.2, x, y, r * 2.4);
    g.addColorStop(0, "rgba(255,250,240,0.95)");
    g.addColorStop(0.35, "rgba(240,236,220,0.55)");
    g.addColorStop(1, "rgba(240,236,220,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,252,245,0.92)";
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.96, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(180,190,190,0.18)";
    ctx.beginPath();
    ctx.ellipse(x + r * 0.25, y + r * 0.1, r * 0.28, r * 0.22, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function birds(ctx, x, y, seed) {
    const rnd = mulberry32(seed);
    ctx.strokeStyle = "rgba(30,28,26,0.4)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const bx = x + rnd() * 70;
      const by = y + rnd() * 24;
      ctx.beginPath();
      ctx.moveTo(bx - 7, by);
      ctx.quadraticCurveTo(bx - 2, by - 5, bx, by);
      ctx.quadraticCurveTo(bx + 2, by - 5, bx + 7, by);
      ctx.stroke();
    }
  }

  function willow(ctx, x, y, h, seed, sway) {
    const rnd = mulberry32(seed);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#2c2822";
    ctx.beginPath();
    ctx.moveTo(-h * 0.02, 2);
    ctx.bezierCurveTo(-h * 0.07, -h * 0.28, h * 0.05, -h * 0.48, h * 0.01, -h * 0.58);
    ctx.bezierCurveTo(h * 0.06, -h * 0.36, h * 0.03, -h * 0.16, h * 0.018, 2);
    ctx.fill();
    const ox = 0;
    const oy = -h * 0.56;
    const n = 18;
    for (let i = 0; i < n; i++) {
      const ang = i / (n - 1) - 0.5;
      const droop = h * (0.5 + rnd() * 0.42);
      const swing = ang * h * 0.26 + sway * (0.4 + rnd() * 0.3);
      const x0 = ox + ang * h * 0.05;
      const x3 = ox + swing;
      const y3 = oy + droop;
      ctx.strokeStyle = "rgba(36,48,36," + (0.28 + rnd() * 0.4) + ")";
      ctx.lineWidth = 0.6 + rnd() * 0.9;
      ctx.beginPath();
      ctx.moveTo(x0, oy);
      ctx.bezierCurveTo(x0 + ang * h * 0.04, oy + droop * 0.38, ox + swing * 0.55, oy + droop * 0.72, x3, y3);
      ctx.stroke();
      ctx.fillStyle = "rgba(52,70,48," + (0.08 + rnd() * 0.12) + ")";
      for (let k = 0; k < 3; k++) {
        const t = 0.55 + k * 0.14;
        const px = x0 + (x3 - x0) * t;
        const py = oy + (y3 - oy) * (0.4 + t * 0.55);
        ctx.beginPath();
        ctx.ellipse(px, py, 2.2 + rnd() * 4, 1.3, ang, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function pine(ctx, x, foot, h) {
    ctx.save();
    ctx.translate(x, foot);
    ctx.strokeStyle = "#2c2824";
    ctx.lineWidth = Math.max(1.5, h * 0.04);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -h * 0.55);
    ctx.stroke();
    const blobs = [
      [0, -h * 0.42, h * 0.16],
      [-h * 0.08, -h * 0.58, h * 0.13],
      [h * 0.07, -h * 0.62, h * 0.12],
      [0, -h * 0.78, h * 0.1],
    ];
    blobs.forEach(function (b, i) {
      const g = ctx.createRadialGradient(b[0], b[1], 2, b[0], b[1], b[2]);
      g.addColorStop(0, "rgba(36,48,42,0.85)");
      g.addColorStop(1, "rgba(36,48,42,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(b[0], b[1], b[2], b[2] * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function roof(ctx, x, y, w, rh) {
    ctx.beginPath();
    ctx.moveTo(x, y + rh * 0.72);
    ctx.quadraticCurveTo(x + w * 0.5, y - rh * 0.15, x + w, y + rh * 0.72);
    ctx.lineTo(x + w - w * 0.06, y + rh);
    ctx.quadraticCurveTo(x + w * 0.5, y + rh * 0.18, x + w * 0.06, y + rh);
    ctx.closePath();
    const g = ctx.createLinearGradient(x, y, x, y + rh);
    g.addColorStop(0, "#6a7478");
    g.addColorStop(1, "#3e484c");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(20,18,16,0.75)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = "rgba(230,226,216,0.25)";
    for (let i = 1; i <= 5; i++) {
      const t = i / 6;
      const yy = y + rh * (0.25 + t * 0.6);
      ctx.beginPath();
      ctx.moveTo(x + w * 0.08, yy);
      ctx.quadraticCurveTo(x + w * 0.5, yy - rh * 0.28, x + w * 0.92, yy);
      ctx.stroke();
    }
    ctx.strokeStyle = "#2a2622";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + rh * 0.78);
    ctx.quadraticCurveTo(x - 6, y + rh * 0.5, x + 4, y + rh * 0.95);
    ctx.moveTo(x + w - 2, y + rh * 0.78);
    ctx.quadraticCurveTo(x + w + 6, y + rh * 0.5, x + w - 4, y + rh * 0.95);
    ctx.stroke();
  }

  function wall(ctx, x, y, w, h) {
    ctx.fillStyle = "#f7f3ea";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(28,24,20,0.78)";
    ctx.lineWidth = 1.15;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    const wash = ctx.createLinearGradient(x, y, x + w, y);
    wash.addColorStop(0, "rgba(90,80,70,0.05)");
    wash.addColorStop(0.7, "rgba(90,80,70,0)");
    wash.addColorStop(1, "rgba(60,70,80,0.08)");
    ctx.fillStyle = wash;
    ctx.fillRect(x, y, w, h);
  }

  function lattice(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = "rgba(70,90,96,0.18)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(28,24,20,0.55)";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x, y, w, h);
    ctx.beginPath();
    for (let i = 1; i < 3; i++) {
      ctx.moveTo(x + (w * i) / 3, y);
      ctx.lineTo(x + (w * i) / 3, y + h);
      ctx.moveTo(x, y + (h * i) / 3);
      ctx.lineTo(x + w, y + (h * i) / 3);
    }
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h);
    ctx.moveTo(x + w, y);
    ctx.lineTo(x, y + h);
    ctx.stroke();
    ctx.restore();
  }

  function lantern(ctx, x, y, s, glow) {
    const g = ctx.createRadialGradient(x, y, 2, x, y, s * 3.2);
    g.addColorStop(0, "rgba(220,150,80," + (0.35 + glow) + ")");
    g.addColorStop(1, "rgba(220,150,80,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, s * 3.2, 0, Math.PI * 2);
    ctx.fill();
    const body = ctx.createLinearGradient(x, y - s, x, y + s);
    body.addColorStop(0, "#f0d2a4");
    body.addColorStop(0.5, "#c4543c");
    body.addColorStop(1, "#8a322c");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(x, y, s * 0.62, s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#3a2420";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y + s);
    ctx.lineTo(x, y + s + s * 0.45);
    ctx.stroke();
  }

  function vtext(ctx, text, x, y, size, color, font) {
    ctx.save();
    ctx.fillStyle = color || "#1c1814";
    ctx.font = (size || 18) + "px " + (font || KAI);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i < text.length; i++) ctx.fillText(text[i], x, y + i * size * 1.12);
    ctx.restore();
  }

  function seal(ctx, x, y, s, chars) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.08);
    ctx.fillStyle = "#8e3a32";
    ctx.beginPath();
    const r = 3;
    ctx.moveTo(-s / 2 + r, -s / 2);
    ctx.arcTo(s / 2, -s / 2, s / 2, s / 2, r);
    ctx.arcTo(s / 2, s / 2, -s / 2, s / 2, r);
    ctx.arcTo(-s / 2, s / 2, -s / 2, -s / 2, r);
    ctx.arcTo(-s / 2, -s / 2, s / 2, -s / 2, r);
    ctx.fill();
    ctx.fillStyle = "rgba(243,234,215,0.92)";
    ctx.font = Math.floor(s * 0.34) + "px " + KAI;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const a = chars[0] || "鹿";
    const b = chars[1] || "鼎";
    ctx.fillText(a, -s * 0.18, -s * 0.18);
    ctx.fillText(b, s * 0.18, s * 0.18);
    ctx.restore();
  }

  function water(ctx, w, y, h, seed) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, "rgba(120,140,146,0.35)");
    g.addColorStop(1, "rgba(70,90,98,0.28)");
    ctx.fillStyle = g;
    ctx.fillRect(0, y, w, h);
    const rnd = mulberry32(seed);
    ctx.strokeStyle = "rgba(40,55,60,0.25)";
    for (let i = 0; i < 9; i++) {
      const yy = y + 8 + i * (h / 10);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, yy);
      let x = 0;
      while (x < w) {
        x += 28 + rnd() * 40;
        ctx.quadraticCurveTo(x - 16, yy + (rnd() - 0.5) * 4, x, yy + (rnd() - 0.5) * 2);
      }
      ctx.stroke();
    }
  }

  function bridge(ctx, x, y, w, h) {
    ctx.fillStyle = "#d9d0c2";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + w * 0.5, y - h, x + w, y);
    ctx.lineTo(x + w, y + 16);
    ctx.quadraticCurveTo(x + w * 0.5, y - h + 22, x, y + 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(40,36,32,0.7)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = "rgba(90,80,70,0.35)";
    ctx.fillRect(x + 6, y - 2, w - 12, 6);
    for (let i = 0; i < 5; i++) {
      const px = x + 10 + i * ((w - 20) / 4);
      ctx.fillStyle = "#cfc6b6";
      ctx.fillRect(px, y - h * 0.55 - 10, 4, 12);
    }
  }

  function slabs(ctx, x, y, w, h) {
    ctx.fillStyle = "#e7e0d2";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(60,50,40,0.28)";
    ctx.lineWidth = 1;
    const cols = 6;
    const rows = 3;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ox = (r % 2) * (w / cols / 2);
        ctx.strokeRect(x + ox + (c * w) / cols, y + (r * h) / rows, w / cols - 3, h / rows - 2);
      }
    }
  }

  function building(ctx, x, foot, bw, bh, opt) {
    opt = opt || {};
    const roofH = bh * 0.42;
    const wallH = bh * 0.58;
    const wallY = foot - wallH;
    wall(ctx, x, wallY, bw, wallH);
    roof(ctx, x - bw * 0.06, foot - bh, bw * 1.12, roofH);
    if (opt.gate) {
      const dw = bw * 0.28;
      const dh = wallH * 0.72;
      ctx.fillStyle = "#6e3430";
      ctx.fillRect(x + bw * 0.36, foot - dh, dw, dh);
      ctx.strokeStyle = "#2a1816";
      ctx.strokeRect(x + bw * 0.36, foot - dh, dw, dh);
      ctx.fillStyle = "rgba(255,220,160,0.18)";
      ctx.fillRect(x + bw * 0.4, foot - dh + 6, dw * 0.35, dh - 10);
      lattice(ctx, x + bw * 0.12, wallY + wallH * 0.22, bw * 0.16, wallH * 0.28);
      lattice(ctx, x + bw * 0.72, wallY + wallH * 0.22, bw * 0.16, wallH * 0.28);
      if (opt.sign) {
        ctx.fillStyle = "#3a342c";
        ctx.fillRect(x + bw * 0.5 - 14, wallY - 8, 28, bh * 0.34);
        vtext(ctx, opt.sign, x + bw * 0.5, wallY - 2, Math.max(12, bw * 0.07), "#f3ead7", KAI);
      }
    } else {
      lattice(ctx, x + bw * 0.18, wallY + wallH * 0.25, bw * 0.22, wallH * 0.32);
      if (opt.shop) {
        ctx.fillStyle = "#5c4632";
        ctx.fillRect(x + bw * 0.55, wallY + 8, 22, 50);
        vtext(ctx, opt.shop, x + bw * 0.55 + 11, wallY + 12, 14, "#f3ead7", KAI);
      }
    }
    if (opt.lantern) {
      lantern(ctx, x + bw * 0.22, wallY + 6, 11, 0.15);
      lantern(ctx, x + bw * 0.78, wallY + 6, 11, 0.15);
    }
  }

  function cypressRow(ctx, w, foot) {
    pine(ctx, w * 0.08, foot, 120);
    pine(ctx, w * 0.18, foot, 150);
    pine(ctx, w * 0.84, foot, 160);
    pine(ctx, w * 0.93, foot, 110);
  }

  function palaceHall(ctx, w, h) {
    const foot = h * 0.78;
    const bw = w * 0.78;
    const x = w * 0.11;
    const bh = h * 0.42;
    ctx.fillStyle = "#f4efe6";
    ctx.fillRect(x, foot - bh * 0.5, bw, bh * 0.5);
    ctx.strokeStyle = "rgba(28,24,20,0.7)";
    ctx.strokeRect(x, foot - bh * 0.5, bw, bh * 0.5);
    ctx.fillStyle = "#8a4038";
    ctx.fillRect(x - 8, foot - bh * 0.52, 10, bh * 0.52);
    ctx.fillRect(x + bw - 2, foot - bh * 0.52, 10, bh * 0.52);
    roof(ctx, x - 18, foot - bh, bw + 36, bh * 0.48);
    const dw = bw * 0.22;
    const dh = bh * 0.36;
    ctx.fillStyle = "#5c2a28";
    ctx.fillRect(x + bw / 2 - dw / 2, foot - dh, dw, dh);
    ctx.fillStyle = "#c9a15a";
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 6; c++) {
        ctx.beginPath();
        ctx.arc(x + bw / 2 - dw / 2 + 8 + c * (dw / 6), foot - dh + 8 + r * (dh / 6), 1.3, 0, 7);
        ctx.fill();
      }
    }
    ctx.fillStyle = "#e7e0d4";
    ctx.beginPath();
    ctx.moveTo(x - 10, foot);
    ctx.lineTo(x + bw + 10, foot);
    ctx.lineTo(x + bw - 10, foot + 28);
    ctx.lineTo(x + 20, foot + 28);
    ctx.fill();
    ctx.strokeStyle = "rgba(40,36,32,0.45)";
    for (let i = 1; i <= 4; i++) ctx.strokeRect(x + 16, foot + i * 6, bw - 32, 1);
    cypressRow(ctx, w, foot + 8);
  }

  function interiorScreen(ctx, x, y, w, h) {
    ctx.fillStyle = "#f7f1e4";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#3a342c";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 8, y + 8, w - 16, h - 16);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 8, y + 8, w - 16, h - 16);
    ctx.clip();
    ridge(ctx, w, y + h * 0.55, h * 0.12, "#8ea3ab", 0.5, 9, 4);
    ridge(ctx, w, y + h * 0.68, h * 0.1, "#4d6168", 0.45, 4, 3);
    willow(ctx, x + w * 0.3, y + h * 0.85, h * 0.4, 3, 0);
    ctx.restore();
  }

  function candle(ctx, x, y) {
    const g = ctx.createRadialGradient(x, y - 8, 2, x, y - 8, 50);
    g.addColorStop(0, "rgba(255,200,120,0.45)");
    g.addColorStop(1, "rgba(255,200,120,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y - 8, 50, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#f3ead0";
    ctx.fillRect(x - 3, y - 18, 6, 22);
    ctx.fillStyle = "#e8b15a";
    ctx.beginPath();
    ctx.ellipse(x, y - 20, 2.2, 5, 0, 0, 7);
    ctx.fill();
  }

  const PEOPLE = {
    wei: { name: "韦小宝", age: "child", shape: "round", build: "thin", skin: "#f0d0b0", skin2: "#d9ae8e", hair: "#1a1614", hairStyle: "messy", robe: "#4a5966", robe2: "#2f3c48", trim: "#7a4038", outfit: "short", pants: "#6d6256", brow: "sly", eye: "lively", mouth: "smirk" },
    wei_eunuch: { name: "小桂子", sheet: "冒牌小桂子", sub: "韦小宝", age: "child", shape: "round", build: "thin", skin: "#f0d0b0", skin2: "#d9ae8e", hair: "#1a1614", hairStyle: "hat", robe: "#5c6a72", robe2: "#3d4a52", trim: "#2a2420", outfit: "robe", hat: "eunuch", brow: "sly", eye: "lively", mouth: "smirk" },
    guizi: { name: "小桂子", age: "child", shape: "round", build: "thin", skin: "#edd0b2", skin2: "#d7b094", hair: "#1a1614", hairStyle: "hat", robe: "#6a5a58", robe2: "#4a3c3c", trim: "#2a2420", outfit: "robe", hat: "eunuch", brow: "meek", eye: "timid", mouth: "small" },
    mother: { name: "韦春花", age: "adult", shape: "soft", build: "normal", skin: "#f3d3b6", skin2: "#e2b89a", hair: "#241816", hairStyle: "bun", robe: "#8a5a5e", robe2: "#6a4048", trim: "#f0e2c8", outfit: "robe", brow: "soft", eye: "tired", mouth: "soft", flower: true },
    mao: { name: "茅十八", age: "adult", shape: "square", build: "broad", skin: "#e6c2a2", skin2: "#c89678", hair: "#1a1614", hairStyle: "band", robe: "#3e4038", robe2: "#2a2c26", trim: "#6e3430", outfit: "short", pants: "#2a2824", brow: "heavy", eye: "fierce", mouth: "grin", beard: "full", bandage: true, weapon: "saber" },
    salt: { name: "盐枭", age: "adult", shape: "square", build: "broad", skin: "#e4c0a0", skin2: "#c89878", hair: "#221c18", hairStyle: "cloth", robe: "#3d4e48", robe2: "#2a3832", trim: "#d9d3c4", outfit: "short", pants: "#2c302c", brow: "heavy", eye: "fierce", mouth: "flat", beard: "stubble" },
    shi: { name: "史松", age: "adult", shape: "long", build: "broad", skin: "#e2c0a0", skin2: "#c49878", hair: "#1c1816", hairStyle: "queue", robe: "#2c3038", robe2: "#1c2026", trim: "#8a7038", outfit: "armor", brow: "sharp", eye: "cold", mouth: "line", weapon: "whip" },
    wu: { name: "吴大鹏", age: "old", shape: "long", build: "normal", skin: "#efd0b4", skin2: "#e0b090", hair: "#f2efe8", hairStyle: "old", robe: "#d9d3c6", robe2: "#b7b0a2", trim: "#6e3430", outfit: "robe", brow: "kind", eye: "calm", mouth: "smile", beard: "white" },
    hai: { name: "海大富", age: "old", shape: "gaunt", build: "thin", skin: "#e6d2b0", skin2: "#cbb48e", hair: "#3a342c", hairStyle: "hat", robe: "#4a4038", robe2: "#2e2824", trim: "#2a2420", outfit: "robe", hat: "eunuch", brow: "thin", eye: "shut", mouth: "weak", hunch: true },
    kangxi: { name: "康熙", sheet: "康熙·小玄子", sub: "小玄子", age: "teen", shape: "oval", build: "normal", skin: "#f2d4b6", skin2: "#e2b898", hair: "#1a1614", hairStyle: "neat", robe: "#c6a15a", robe2: "#8d6a32", trim: "#3a342c", outfit: "robe", brow: "level", eye: "calm", mouth: "smile", dragon: true },
    aobai: { name: "鳌拜", age: "adult", shape: "square", build: "huge", skin: "#e0b898", skin2: "#c08860", hair: "#1a1614", hairStyle: "queue", robe: "#3a2e2a", robe2: "#241816", trim: "#6a5030", outfit: "armor", brow: "heavy", eye: "fierce", mouth: "grim", beard: "stubble", fur: true },
    dowager: { name: "皇太后", age: "adult", shape: "oval", build: "normal", skin: "#f6e0cc", skin2: "#e8c8b0", hair: "#241c1a", hairStyle: "high", robe: "#b08948", robe2: "#7a5a30", trim: "#f3ead7", outfit: "robe", brow: "sharp", eye: "sharp", mouth: "composed", pin: true },
  };

  function buildWidth(p, h) {
    if (p.build === "huge") return h * 0.33;
    if (p.build === "broad") return h * 0.3;
    if (p.build === "thin") return h * 0.2;
    return h * 0.25;
  }
  function headSize(p, h) {
    if (p.age === "child") return h * 0.165;
    if (p.age === "teen") return h * 0.145;
    if (p.age === "old") return h * 0.14;
    return h * 0.135;
  }

  function headPath(ctx, cx, cy, rx, ry, shape) {
    const chin = shape === "square" ? 0.82 : shape === "gaunt" ? 0.7 : shape === "round" ? 1 : 0.9;
    ctx.beginPath();
    ctx.moveTo(cx, cy - ry);
    ctx.bezierCurveTo(cx + rx * 1.08, cy - ry * 0.7, cx + rx * (shape === "gaunt" ? 0.72 : 0.95), cy + ry * 0.28, cx + rx * 0.38 * chin, cy + ry * 0.95);
    ctx.quadraticCurveTo(cx, cy + ry * (shape === "square" ? 1.02 : 1.08), cx - rx * 0.38 * chin, cy + ry * 0.95);
    ctx.bezierCurveTo(cx - rx * (shape === "gaunt" ? 0.72 : 0.95), cy + ry * 0.28, cx - rx * 1.08, cy - ry * 0.7, cx, cy - ry);
  }

  function eye(ctx, x, y, s, kind) {
    ctx.save();
    ctx.translate(x, y);
    const shut = kind === "shut";
    const timid = kind === "timid";
    ctx.lineCap = "round";
    if (shut) {
      ctx.strokeStyle = "#2a211c";
      ctx.lineWidth = Math.max(1, s * 0.16);
      ctx.beginPath();
      ctx.moveTo(-s, 0);
      ctx.quadraticCurveTo(0, s * 0.35, s, 0);
      ctx.stroke();
      ctx.restore();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.quadraticCurveTo(0, -s * 0.55, s, 0);
    ctx.quadraticCurveTo(0, s * (timid ? 0.2 : 0.38), -s, 0);
    ctx.fillStyle = "#fbf6ee";
    ctx.fill();
    ctx.lineWidth = Math.max(0.8, s * 0.12);
    ctx.strokeStyle = "#241c18";
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(s * 0.08, s * 0.02, s * 0.28, s * (kind === "sharp" ? 0.26 : 0.34), 0, 0, Math.PI * 2);
    ctx.fillStyle = "#241c18";
    ctx.fill();
    ctx.fillStyle = "rgba(255,250,240,0.85)";
    ctx.beginPath();
    ctx.arc(-s * 0.05, -s * 0.08, s * 0.1, 0, 7);
    ctx.fill();
    ctx.restore();
  }

  function brows(ctx, x, y, s, kind) {
    ctx.strokeStyle = "#1c1814";
    ctx.lineWidth = Math.max(1, s * 0.14);
    ctx.lineCap = "round";
    const lift = kind === "sly" ? -s * 0.28 : kind === "kind" || kind === "soft" ? -s * 0.05 : 0;
    ctx.beginPath();
    ctx.moveTo(x - s * 1.15, y);
    ctx.quadraticCurveTo(x, y - s * 0.45 + lift, x + s * 1.05, y + (kind === "heavy" ? s * 0.15 : 0));
    ctx.stroke();
  }

  function mouth(ctx, x, y, s, kind) {
    ctx.strokeStyle = "#7a3d3a";
    ctx.lineWidth = Math.max(1, s * 0.12);
    ctx.lineCap = "round";
    ctx.beginPath();
    if (kind === "smirk") {
      ctx.moveTo(x - s, y);
      ctx.quadraticCurveTo(x, y + s * 0.7, x + s * 1.15, y - s * 0.15);
    } else if (kind === "grin") {
      ctx.moveTo(x - s * 1.1, y);
      ctx.quadraticCurveTo(x, y + s * 0.9, x + s * 1.1, y);
    } else if (kind === "smile") {
      ctx.moveTo(x - s * 0.8, y);
      ctx.quadraticCurveTo(x, y + s * 0.55, x + s * 0.8, y);
    } else if (kind === "grim") {
      ctx.moveTo(x - s, y + s * 0.2);
      ctx.quadraticCurveTo(x, y - s * 0.2, x + s, y + s * 0.25);
    } else if (kind === "soft") {
      ctx.strokeStyle = "#a85a58";
      ctx.moveTo(x - s * 0.7, y);
      ctx.quadraticCurveTo(x, y + s * 0.4, x + s * 0.7, y);
    } else {
      ctx.moveTo(x - s * 0.7, y);
      ctx.lineTo(x + s * 0.7, y + s * 0.05);
    }
    ctx.stroke();
  }

  function hairBack(ctx, cx, cy, rx, ry, p) {
    ctx.fillStyle = p.hair;
    if (p.hairStyle === "hat") return;
    ctx.beginPath();
    ctx.ellipse(cx, cy - ry * 0.15, rx * 1.05, ry * 1.05, 0, Math.PI, 0);
    ctx.fill();
    if (p.hairStyle === "messy") {
      ctx.beginPath();
      ctx.moveTo(cx - rx, cy);
      ctx.quadraticCurveTo(cx - rx * 1.3, cy + ry * 0.2, cx - rx * 0.8, cy + ry * 0.7);
      ctx.quadraticCurveTo(cx - rx * 0.2, cy - ry * 0.2, cx, cy - ry);
      ctx.fill();
    }
    if (p.hairStyle === "bun" || p.hairStyle === "high") {
      ctx.beginPath();
      ctx.ellipse(cx, cy - ry * 1.15, rx * 0.48, ry * 0.42, 0, 0, 7);
      ctx.fill();
    }
    if (p.hairStyle === "queue" || p.hairStyle === "neat") {
      ctx.strokeStyle = p.hair;
      ctx.lineWidth = Math.max(2, rx * 0.18);
      ctx.beginPath();
      ctx.moveTo(cx + rx * 0.2, cy - ry * 0.2);
      ctx.quadraticCurveTo(cx + rx * 1.1, cy + ry * 0.4, cx + rx * 0.7, cy + ry * 1.5);
      ctx.stroke();
    }
  }

  function hat(ctx, cx, cy, rx, ry, p) {
    if (p.hat === "eunuch") {
      ctx.fillStyle = "#1c1a18";
      ctx.beginPath();
      ctx.ellipse(cx, cy - ry * 0.72, rx * 0.95, ry * 0.42, 0, 0, 7);
      ctx.fill();
      ctx.fillRect(cx - rx * 0.7, cy - ry * 0.85, rx * 1.4, ry * 0.28);
    }
    if (p.bandage) {
      ctx.strokeStyle = "#f4efe6";
      ctx.lineWidth = Math.max(3, ry * 0.18);
      ctx.beginPath();
      ctx.moveTo(cx - rx * 0.9, cy - ry * 0.15);
      ctx.quadraticCurveTo(cx, cy - ry * 0.45, cx + rx * 0.9, cy - ry * 0.1);
      ctx.stroke();
      ctx.strokeStyle = "rgba(40,30,30,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function beard(ctx, cx, cy, rx, ry, p) {
    if (!p.beard) return;
    ctx.strokeStyle = p.beard === "white" ? "rgba(240,236,228,0.95)" : "rgba(28,22,18,0.8)";
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = 1;
    if (p.beard === "full" || p.beard === "white") {
      for (let i = -4; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * rx * 0.12, cy + ry * 0.35);
        ctx.quadraticCurveTo(cx + i * rx * 0.18, cy + ry * 0.7, cx + i * rx * 0.08, cy + ry * (0.85 + Math.abs(i) * 0.04));
        ctx.stroke();
      }
    } else {
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * rx * 0.14, cy + ry * 0.42);
        ctx.lineTo(cx + i * rx * 0.12, cy + ry * 0.58);
        ctx.stroke();
      }
    }
  }

  function faceFeatures(ctx, cx, cy, rx, ry, p) {
    const es = Math.max(4, rx * 0.38);
    const yEye = cy - ry * 0.04;
    const spread = rx * 0.4;
    brows(ctx, cx - spread, yEye - es * 0.95, es * 0.85, p.brow);
    brows(ctx, cx + spread, yEye - es * 0.95, es * 0.85, p.brow === "sly" ? "level" : p.brow);
    eye(ctx, cx - spread, yEye, es, p.eye);
    eye(ctx, cx + spread, yEye, es, p.eye);
    ctx.strokeStyle = "rgba(140,86,68,0.65)";
    ctx.lineWidth = Math.max(1, rx * 0.07);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.02, cy - ry * 0.02);
    ctx.quadraticCurveTo(cx + rx * 0.16, cy + ry * 0.16, cx + rx * 0.02, cy + ry * 0.28);
    ctx.stroke();
    ctx.fillStyle = "rgba(180,100,90,0.35)";
    ctx.beginPath();
    ctx.ellipse(cx + rx * 0.08, cy + ry * 0.3, rx * 0.06, ry * 0.035, 0.4, 0, Math.PI * 2);
    ctx.fill();
    mouth(ctx, cx, cy + ry * 0.46, es * 0.9, p.mouth);
    ctx.fillStyle = "rgba(196,120,110,0.13)";
    ctx.beginPath();
    ctx.ellipse(cx - rx * 0.45, cy + ry * 0.18, rx * 0.16, ry * 0.08, 0, 0, 7);
    ctx.ellipse(cx + rx * 0.48, cy + ry * 0.18, rx * 0.16, ry * 0.08, 0, 0, 7);
    ctx.fill();
    if (p.age === "old" || p.shape === "gaunt") {
      ctx.strokeStyle = "rgba(120,80,60,0.35)";
      ctx.lineWidth = Math.max(1, rx * 0.045);
      ctx.beginPath();
      ctx.moveTo(cx - rx * 0.72, cy + ry * 0.12);
      ctx.quadraticCurveTo(cx - rx * 0.25, cy + ry * 0.32, cx - rx * 0.55, cy + ry * 0.42);
      ctx.moveTo(cx + rx * 0.72, cy + ry * 0.12);
      ctx.quadraticCurveTo(cx + rx * 0.25, cy + ry * 0.32, cx + rx * 0.55, cy + ry * 0.42);
      ctx.stroke();
    }
  }

  function hangSleeve(ctx, sx, sy, side, len, color, dark) {
    const x2 = sx + side * len * 0.42;
    const y2 = sy + len;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(sx + side * len * 0.08, sy + len * 0.2, sx + side * len * 0.38, sy + len * 0.55, x2, y2);
    ctx.lineTo(x2 - side * len * 0.16, y2 - len * 0.02);
    ctx.bezierCurveTo(sx + side * len * 0.12, sy + len * 0.62, sx + side * 3, sy + len * 0.25, sx + side * 2, sy + 3);
    ctx.closePath();
    const g = ctx.createLinearGradient(sx, sy, x2, y2);
    g.addColorStop(0, color);
    g.addColorStop(1, dark);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(22,18,14,0.78)";
    ctx.lineWidth = 1.15;
    ctx.stroke();
    ctx.strokeStyle = "rgba(243,234,215,0.16)";
    ctx.beginPath();
    ctx.moveTo(sx + side * 4, sy + 6);
    ctx.quadraticCurveTo(sx + side * len * 0.3, sy + len * 0.4, x2 - side * 4, y2);
    ctx.stroke();
  }

  function drawFigure(ctx, id, x, footY, h, pose) {
    const p = PEOPLE[id];
    if (!p || h < 8) return;
    pose = pose || "stand";
    const hh = h * (p.age === "child" ? 0.16 : p.age === "teen" ? 0.145 : 0.135);
    const rx = hh * (p.shape === "round" ? 0.5 : p.shape === "gaunt" ? 0.4 : p.shape === "square" ? 0.52 : 0.46);
    const ry = hh * 0.56;
    const sw = buildWidth(p, h);
    const headCy = footY - h + ry * 1.02 + (p.hunch ? h * 0.035 : 0);
    const shoulderY = headCy + ry * 0.95;
    const hem = p.outfit === "short" ? footY - h * 0.2 : footY - h * 0.015;
    const hipY = shoulderY + (hem - shoulderY) * 0.48;

    ctx.save();
    ctx.fillStyle = "rgba(40,36,30,0.15)";
    ctx.beginPath();
    ctx.ellipse(x, footY + 1, sw * 0.42, h * 0.018, 0, 0, Math.PI * 2);
    ctx.fill();

    hairBack(ctx, x, headCy, rx, ry, p);

    if (p.outfit === "short" || p.outfit === "armor") {
      ctx.fillStyle = p.pants || "#5c5348";
      const top = hem - h * 0.02;
      const lw = Math.max(4, sw * 0.16);
      ctx.beginPath();
      ctx.moveTo(x - sw * 0.16, top);
      ctx.lineTo(x - sw * 0.22, footY);
      ctx.lineTo(x - sw * 0.22 + lw, footY);
      ctx.lineTo(x - sw * 0.16 + lw * 0.7, top);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + sw * 0.02, top);
      ctx.lineTo(x + sw * 0.06, footY);
      ctx.lineTo(x + sw * 0.06 + lw, footY);
      ctx.lineTo(x + sw * 0.02 + lw * 0.7, top);
      ctx.fill();
      ctx.fillStyle = "#2a2420";
      ctx.fillRect(x - sw * 0.24, footY - h * 0.028, lw + 2, h * 0.03);
      ctx.fillRect(x + sw * 0.04, footY - h * 0.028, lw + 2, h * 0.03);
    }

    ctx.beginPath();
    ctx.moveTo(x - rx * 0.35, shoulderY);
    ctx.quadraticCurveTo(x - sw * 0.55, shoulderY + h * 0.02, x - sw * 0.48, hipY);
    ctx.quadraticCurveTo(x - sw * 0.62, (hipY + hem) / 2, x - sw * 0.5, hem);
    ctx.quadraticCurveTo(x, hem + h * 0.012, x + sw * 0.5, hem);
    ctx.quadraticCurveTo(x + sw * 0.62, (hipY + hem) / 2, x + sw * 0.48, hipY);
    ctx.quadraticCurveTo(x + sw * 0.55, shoulderY + h * 0.02, x + rx * 0.35, shoulderY);
    ctx.quadraticCurveTo(x, shoulderY + ry * 0.35, x - rx * 0.35, shoulderY);
    const rg = ctx.createLinearGradient(x - sw, shoulderY, x + sw, hem);
    rg.addColorStop(0, p.robe2);
    rg.addColorStop(0.42, p.robe);
    rg.addColorStop(1, p.robe2);
    ctx.fillStyle = rg;
    ctx.fill();
    ctx.strokeStyle = "rgba(22,18,14,0.8)";
    ctx.lineWidth = 1.15;
    ctx.stroke();
    ctx.strokeStyle = "rgba(243,234,215,0.14)";
    ctx.beginPath();
    ctx.moveTo(x - sw * 0.08, shoulderY + 8);
    ctx.quadraticCurveTo(x - sw * 0.2, hipY, x - sw * 0.05, hem - 4);
    ctx.moveTo(x + sw * 0.12, shoulderY + 10);
    ctx.quadraticCurveTo(x + sw * 0.22, hipY, x + sw * 0.08, hem - 6);
    ctx.stroke();

    ctx.strokeStyle = p.trim;
    ctx.lineWidth = Math.max(2, h * 0.012);
    ctx.beginPath();
    ctx.moveTo(x - sw * 0.22, hipY);
    ctx.quadraticCurveTo(x, hipY + 3, x + sw * 0.22, hipY);
    ctx.stroke();

    if (p.dragon) {
      ctx.strokeStyle = "rgba(110,48,36,0.55)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(x, (shoulderY + hipY) / 2, sw * 0.16, 0.4, 2.2);
      ctx.stroke();
    }
    if (p.fur) {
      ctx.strokeStyle = "rgba(92,70,48,0.75)";
      for (let i = -4; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * sw * 0.08, shoulderY + 2);
        ctx.quadraticCurveTo(x + i * sw * 0.1, shoulderY + 8, x + i * sw * 0.06, shoulderY + 14);
        ctx.stroke();
      }
    }

    const sl = h * (pose === "reach" ? 0.34 : 0.3);
    if (pose === "reach" || pose === "fight") {
      hangSleeve(ctx, x - sw * 0.32, shoulderY, -1, sl * 0.85, p.robe, p.robe2);
      hangSleeve(ctx, x + sw * 0.28, shoulderY - 2, 1, sl * 1.15, p.robe, p.robe2);
    } else if (pose === "guard") {
      hangSleeve(ctx, x - sw * 0.2, shoulderY, -1, sl * 0.55, p.robe, p.robe2);
      hangSleeve(ctx, x + sw * 0.2, shoulderY, 1, sl * 0.55, p.robe, p.robe2);
    } else {
      hangSleeve(ctx, x - sw * 0.34, shoulderY, -1, sl, p.robe, p.robe2);
      hangSleeve(ctx, x + sw * 0.34, shoulderY, 1, sl, p.robe, p.robe2);
    }

    ctx.fillStyle = p.skin2;
    ctx.fillRect(x - rx * 0.22, headCy + ry * 0.82, rx * 0.44, Math.max(4, shoulderY - headCy - ry * 0.7));

    const hg = ctx.createLinearGradient(x - rx, headCy - ry, x + rx, headCy + ry);
    hg.addColorStop(0, p.skin);
    hg.addColorStop(1, p.skin2);
    ctx.fillStyle = hg;
    headPath(ctx, x, headCy, rx, ry, p.shape);
    ctx.fill();
    ctx.strokeStyle = "rgba(50,36,30,0.55)";
    ctx.lineWidth = 1;
    ctx.stroke();

    if (h > 70) faceFeatures(ctx, x, headCy, rx, ry, p);
    beard(ctx, x, headCy, rx, ry, p);
    hat(ctx, x, headCy, rx, ry, p);
    if (p.flower) {
      ctx.fillStyle = "#8e3a32";
      ctx.beginPath();
      ctx.ellipse(x + rx * 0.85, headCy - ry * 0.95, rx * 0.18, ry * 0.12, 0.6, 0, 7);
      ctx.fill();
    }
    if (p.pin) {
      ctx.strokeStyle = "#e6d7a4";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x - rx * 0.15, headCy - ry * 1.35);
      ctx.lineTo(x + rx * 0.55, headCy - ry * 1.1);
      ctx.stroke();
    }
    if (p.weapon === "saber") {
      ctx.strokeStyle = "#2e2a26";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + sw * 0.32, hipY);
      ctx.quadraticCurveTo(x + sw * 0.55, hipY + h * 0.08, x + sw * 0.36, hem + h * 0.02);
      ctx.stroke();
      ctx.strokeStyle = "#8d6b3a";
      ctx.beginPath();
      ctx.moveTo(x + sw * 0.28, hipY - 2);
      ctx.lineTo(x + sw * 0.4, hipY + 5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPortrait(ctx, id, size) {
    const p = PEOPLE[id];
    if (!p) return;
    const S = size;
    ctx.clearRect(0, 0, S, S);
    ctx.save();
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 2 - 1, 0, Math.PI * 2);
    ctx.clip();
    const g = ctx.createLinearGradient(0, 0, 0, S);
    g.addColorStop(0, "#efe6d4");
    g.addColorStop(1, "#d5c7b0");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    ridge(ctx, S, S * 0.78, S * 0.08, "#8ea3ab", 0.28, hash(id), 3);
    const cx = S * 0.5;
    const cy = S * 0.44;
    const rx = S * 0.23;
    const ry = S * 0.27;
    hairBack(ctx, cx, cy, rx * 1.05, ry, p);
    ctx.beginPath();
    ctx.moveTo(cx - S * 0.34, S * 0.98);
    ctx.quadraticCurveTo(cx - S * 0.38, S * 0.62, cx - rx * 0.9, cy + ry * 0.85);
    ctx.lineTo(cx + rx * 0.9, cy + ry * 0.85);
    ctx.quadraticCurveTo(cx + S * 0.38, S * 0.62, cx + S * 0.34, S * 0.98);
    ctx.closePath();
    const rg = ctx.createLinearGradient(cx - S * 0.3, cy, cx + S * 0.3, S);
    rg.addColorStop(0, p.robe);
    rg.addColorStop(1, p.robe2);
    ctx.fillStyle = rg;
    ctx.fill();
    ctx.strokeStyle = "rgba(22,18,14,0.65)";
    ctx.stroke();
    ctx.strokeStyle = p.trim;
    ctx.lineWidth = Math.max(2, S * 0.012);
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.7, S * 0.78);
    ctx.quadraticCurveTo(cx, S * 0.8, cx + rx * 0.7, S * 0.78);
    ctx.stroke();
    if (p.fur) {
      ctx.strokeStyle = "rgba(90,70,48,0.8)";
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * rx * 0.22, cy + ry);
        ctx.lineTo(cx + i * rx * 0.18, cy + ry + S * 0.06);
        ctx.stroke();
      }
    }
    ctx.fillStyle = p.skin2;
    ctx.fillRect(cx - rx * 0.18, cy + ry * 0.85, rx * 0.36, S * 0.08);
    const hg = ctx.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry);
    hg.addColorStop(0, p.skin);
    hg.addColorStop(1, p.skin2);
    ctx.fillStyle = hg;
    headPath(ctx, cx, cy, rx, ry, p.shape);
    ctx.fill();
    ctx.strokeStyle = "rgba(40,28,22,0.45)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    faceFeatures(ctx, cx, cy, rx, ry, p);
    beard(ctx, cx, cy, rx, ry, p);
    hat(ctx, cx, cy, rx, ry, p);
    if (p.flower) {
      ctx.fillStyle = "#8e3a32";
      ctx.beginPath();
      ctx.ellipse(cx + rx * 0.9, cy - ry * 0.85, rx * 0.16, ry * 0.1, 0.5, 0, 7);
      ctx.fill();
    }
    if (p.pin) {
      ctx.strokeStyle = "#e8d7a8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - rx * 0.1, cy - ry * 1.25);
      ctx.lineTo(cx + rx * 0.7, cy - ry * 1.02);
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(28,24,20,0.82)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 2 - 1.2, 0, Math.PI * 2);
    ctx.stroke();
  }

  function paint(ctx, w, h, spec) {
    const id = spec.id;
    const night = !!spec.night;
    const seed = hash(id);
    paper(ctx, w, h);
    sky(ctx, w, h, night);
    if (night) moon(ctx, w * 0.22, h * 0.12, Math.min(w, h) * 0.035);
    mountains(ctx, w, h, seed, night);
    birds(ctx, w * 0.62, h * 0.1, seed);

    if (id === "title") {
      mistBand(ctx, w, h * 0.28, h * 0.12, 0.45, 0);
      willow(ctx, w * 0.04, h * 0.72, h * 0.5, seed, 8);
      const px = w * 0.42;
      const py = h * 0.5;
      const pw = w * 0.28;
      const ph = h * 0.16;
      ctx.fillStyle = "#7a4038";
      ctx.globalAlpha = 0.9;
      for (let i = 0; i < 4; i++) ctx.fillRect(px + pw * (0.12 + i * 0.22), py + ph * 0.42, Math.max(3, pw * 0.035), ph * 0.4);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#e6dfd2";
      ctx.fillRect(px, py + ph * 0.78, pw, ph * 0.1);
      roof(ctx, px - pw * 0.08, py, pw * 1.16, ph * 0.5);
      pine(ctx, w * 0.8, h * 0.62, h * 0.12);
      mistBand(ctx, w, h * 0.5, h * 0.16, 0.5, 0);
      vtext(ctx, "鹿鼎记", w * 0.8, h * 0.16, Math.min(64, w * 0.16), "#1c1814", KAI);
      vtext(ctx, "康熙初年", w * 0.66, h * 0.2, 14, "rgba(28,24,20,0.7)", KAI);
      seal(ctx, w * 0.8, h * 0.52, 46, "鹿鼎");
    } else if (id === "yangzhou") {
      mistBand(ctx, w, h * 0.3, h * 0.1, 0.4, 0);
      water(ctx, w, h * 0.72, h * 0.28, seed);
      const foot = h * 0.7;
      building(ctx, w * 0.02, foot, w * 0.3, h * 0.26, { shop: "茶" });
      building(ctx, w * 0.36, foot, w * 0.36, h * 0.32, { gate: true, sign: "丽春院", lantern: night });
      building(ctx, w * 0.74, foot, w * 0.24, h * 0.24, { lantern: night });
      bridge(ctx, w * 0.28, h * 0.78, w * 0.4, h * 0.08);
      willow(ctx, w * 0.08, h * 0.86, h * 0.34, seed + 5, 0);
      slabs(ctx, 0, h * 0.66, w, h * 0.06);
      if (night) {
        lantern(ctx, w * 0.2, h * 0.5, 8, 0.2);
        lantern(ctx, w * 0.9, h * 0.52, 8, 0.12);
      }
    } else if (id === "lichun") {
      ctx.fillStyle = "#e7d3b4";
      ctx.fillRect(0, 0, w, h);
      interiorScreen(ctx, w * 0.12, h * 0.16, w * 0.76, h * 0.28);
      ctx.fillStyle = "#6b4e3a";
      ctx.fillRect(w * 0.18, h * 0.55, w * 0.64, h * 0.06);
      ctx.fillStyle = "#8a4038";
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(w * (0.28 + i * 0.1), h * 0.54, 7, 4, 0, 0, 7);
        ctx.fill();
      }
      lantern(ctx, w * 0.2, h * 0.48, 12, 0.2);
      lantern(ctx, w * 0.8, h * 0.48, 12, 0.2);
      lattice(ctx, w * 0.08, h * 0.5, w * 0.12, h * 0.16);
      lattice(ctx, w * 0.8, h * 0.5, w * 0.12, h * 0.16);
      ctx.fillStyle = "#5c4034";
      ctx.fillRect(w * 0.46, h * 0.18, 18, h * 0.22);
      vtext(ctx, "丽春", w * 0.46 + 9, h * 0.2, 14, "#f3ead7", KAI);
    } else if (id === "desheng") {
      mistBand(ctx, w, h * 0.34, h * 0.12, 0.42, 0);
      ctx.fillStyle = "#d7d0c2";
      ctx.beginPath();
      ctx.moveTo(0, h * 0.78);
      ctx.quadraticCurveTo(w * 0.3, h * 0.6, w * 0.55, h * 0.7);
      ctx.quadraticCurveTo(w * 0.8, h * 0.8, w, h * 0.66);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();
      ctx.fillStyle = "#b7b0a2";
      ctx.beginPath();
      ctx.ellipse(w * 0.42, h * 0.74, w * 0.08, h * 0.025, 0, 0, 7);
      ctx.fill();
      willow(ctx, w * 0.72, h * 0.7, h * 0.28, seed, 0);
      pine(ctx, w * 0.14, h * 0.78, h * 0.16);
      if (night) moon(ctx, w * 0.78, h * 0.14, 16);
      vtext(ctx, "得胜山", w * 0.12, h * 0.2, 16, "rgba(28,24,20,0.55)", KAI);
    } else if (id === "road") {
      water(ctx, w, h * 0.62, h * 0.38, seed);
      ctx.fillStyle = "#e6dcc8";
      ctx.beginPath();
      ctx.moveTo(0, h * 0.62);
      ctx.lineTo(w, h * 0.58);
      ctx.lineTo(w, h * 0.7);
      ctx.lineTo(0, h * 0.74);
      ctx.fill();
      willow(ctx, w * 0.12, h * 0.7, h * 0.3, seed, 4);
      willow(ctx, w * 0.88, h * 0.66, h * 0.26, seed + 2, -3);
      ctx.fillStyle = "#6b5344";
      ctx.beginPath();
      ctx.moveTo(w * 0.55, h * 0.64);
      ctx.lineTo(w * 0.78, h * 0.6);
      ctx.lineTo(w * 0.8, h * 0.66);
      ctx.lineTo(w * 0.58, h * 0.7);
      ctx.fill();
      ctx.strokeStyle = "#3a342c";
      ctx.stroke();
      mistBand(ctx, w, h * 0.4, h * 0.12, 0.4, 0);
    } else if (id === "inn" || id === "tavern") {
      ctx.fillStyle = "#eadcc6";
      ctx.fillRect(0, 0, w, h);
      interiorScreen(ctx, w * 0.08, h * 0.14, w * 0.4, h * 0.24);
      ctx.fillStyle = "#6b4e3a";
      ctx.fillRect(w * 0.12, h * 0.5, w * 0.5, h * 0.045);
      ctx.fillRect(w * 0.62, h * 0.58, w * 0.28, h * 0.04);
      lantern(ctx, w * 0.3, h * 0.42, 14, 0.25);
      lantern(ctx, w * 0.72, h * 0.46, 11, 0.15);
      lattice(ctx, w * 0.78, h * 0.18, w * 0.14, h * 0.16);
      vtext(ctx, id === "tavern" ? "酒楼" : "客栈", 28, h * 0.2, 16, "rgba(28,24,20,0.6)", KAI);
    } else if (id === "hairoom") {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#d9d0c0");
      g.addColorStop(1, "#b7aa96");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#6b5344";
      ctx.fillRect(w * 0.18, h * 0.42, w * 0.46, h * 0.03);
      candle(ctx, w * 0.28, h * 0.42);
      candle(ctx, w * 0.52, h * 0.42);
      ctx.strokeStyle = "rgba(60,50,40,0.45)";
      ctx.strokeRect(w * 0.62, h * 0.48, w * 0.22, h * 0.12);
      ctx.beginPath();
      ctx.ellipse(w * 0.24, h * 0.7, w * 0.1, h * 0.04, 0, 0, 7);
      ctx.stroke();
      ctx.fillStyle = "rgba(80,100,110,0.18)";
      ctx.fill();
    } else if (id === "palace" || id === "ending") {
      ctx.fillStyle = "#c4554a";
      ctx.globalAlpha = 0.28;
      ctx.fillRect(0, h * 0.22, w * 0.08, h * 0.5);
      ctx.fillRect(w * 0.92, h * 0.22, w * 0.08, h * 0.5);
      ctx.globalAlpha = 1;
      palaceHall(ctx, w, h);
      mistBand(ctx, w, h * 0.48, h * 0.1, 0.35, 0);
      slabs(ctx, w * 0.1, h * 0.8, w * 0.8, h * 0.05);
      if (id === "ending") vtext(ctx, "未完待续", w * 0.5, h * 0.16, 22, "rgba(28,24,20,0.75)", KAI);
    } else if (id === "courtyard") {
      pine(ctx, w * 0.1, h * 0.78, h * 0.22);
      pine(ctx, w * 0.88, h * 0.78, h * 0.2);
      ctx.fillStyle = "rgba(232,226,214,0.9)";
      ctx.fillRect(w * 0.2, h * 0.28, w * 0.6, h * 0.18);
      roof(ctx, w * 0.16, h * 0.2, w * 0.68, h * 0.12);
      ctx.strokeStyle = "rgba(28,24,20,0.6)";
      ctx.strokeRect(w * 0.2, h * 0.28, w * 0.6, h * 0.18);
      lattice(ctx, w * 0.28, h * 0.32, w * 0.12, h * 0.1);
      lattice(ctx, w * 0.6, h * 0.32, w * 0.12, h * 0.1);
      slabs(ctx, w * 0.15, h * 0.62, w * 0.7, h * 0.16);
      willow(ctx, w * 0.78, h * 0.7, h * 0.2, seed, 2);
    } else if (id === "study") {
      ctx.fillStyle = "#efe4d0";
      ctx.fillRect(0, 0, w, h);
      interiorScreen(ctx, w * 0.1, h * 0.12, w * 0.55, h * 0.26);
      ctx.fillStyle = "#5c4034";
      ctx.fillRect(w * 0.16, h * 0.5, w * 0.5, h * 0.05);
      ctx.fillStyle = "#3a342c";
      ctx.fillRect(w * 0.2, h * 0.46, w * 0.12, h * 0.045);
      ctx.fillStyle = "#8d6b3a";
      ctx.beginPath();
      ctx.ellipse(w * 0.62, h * 0.5, 14, 8, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#6e6256";
      ctx.beginPath();
      ctx.ellipse(w * 0.62, h * 0.48, 8, 4, 0, 0, 7);
      ctx.fill();
      candle(ctx, w * 0.32, h * 0.5);
      lattice(ctx, w * 0.74, h * 0.2, w * 0.16, h * 0.2);
      vtext(ctx, "上书房", w * 0.08, h * 0.2, 15, "rgba(28,24,20,0.55)", KAI);
    } else if (id === "beijing") {
      mistBand(ctx, w, h * 0.32, 40, 0.4, 0);
      ctx.fillStyle = "#b7aa9a";
      ctx.fillRect(0, h * 0.42, w, h * 0.08);
      ctx.fillStyle = "#8a4038";
      ctx.globalAlpha = 0.85;
      ctx.fillRect(w * 0.08, h * 0.28, w * 0.16, h * 0.16);
      ctx.fillRect(w * 0.76, h * 0.26, w * 0.16, h * 0.18);
      ctx.globalAlpha = 1;
      roof(ctx, w * 0.05, h * 0.2, w * 0.22, h * 0.1);
      roof(ctx, w * 0.73, h * 0.18, w * 0.22, h * 0.1);
      building(ctx, w * 0.28, h * 0.7, w * 0.22, h * 0.24, { shop: "酒" });
      building(ctx, w * 0.52, h * 0.7, w * 0.24, h * 0.22, { lantern: true });
      slabs(ctx, 0, h * 0.68, w, h * 0.08);
      willow(ctx, w * 0.14, h * 0.86, h * 0.22, seed, 0);
    }

    mistBand(ctx, w, h * 0.58, h * 0.1, 0.22, 0);
    stains(ctx, w, h, seed);
    grain(ctx, w, h);
    vignette(ctx, w, h);
  }

  function drift(ctx, w, h, t) {
    const x = Math.sin(t * 0.00025) * 24;
    mistBand(ctx, w, h * 0.36, h * 0.08, 0.18, x);
    mistBand(ctx, w, h * 0.5, h * 0.07, 0.14, -x * 0.6);
  }

  function blob(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot || 0);
    ctx.globalAlpha = Math.max(0, p.life);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r);
    g.addColorStop(0, p.color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.r, p.r * (p.flat || 0.62), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function palm(ctx, x, y, a, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#2a2622";
    ctx.beginPath();
    ctx.ellipse(0, 4, 7, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.ellipse(i * 3.6, -8, 1.5, 6, i * 0.12, 0, 7);
      ctx.fill();
    }
    ctx.restore();
  }

  function inkMap(ctx, w, h, known, current) {
    paper(ctx, w, h);
    ctx.strokeStyle = "rgba(40,60,70,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.22, h * 0.78);
    ctx.quadraticCurveTo(w * 0.4, h * 0.4, w * 0.7, h * 0.28);
    ctx.stroke();
    ridge(ctx, w, h * 0.55, 18, "#8ea3ab", 0.3, 2, 4);
    const pts = [
      ["yangzhou", "扬州", 0.22, 0.78],
      ["road", "运河", 0.42, 0.55],
      ["beijing", "北京", 0.68, 0.32],
      ["palace", "紫禁城", 0.8, 0.2],
    ];
    pts.forEach(function (p) {
      const on = known[p[0]];
      ctx.beginPath();
      ctx.arc(w * p[2], h * p[3], current === p[0] ? 6 : 4, 0, 7);
      ctx.fillStyle = !on ? "rgba(28,24,20,0.15)" : current === p[0] ? "#8e3a32" : "#1c1814";
      ctx.fill();
      if (on) {
        ctx.fillStyle = "#1c1814";
        ctx.font = "13px " + KAI;
        ctx.textAlign = "left";
        ctx.fillText(p[1], w * p[2] + 8, h * p[3] + 4);
      }
    });
    grain(ctx, w, h);
  }

  window.LDJArt = {
    PEOPLE: PEOPLE,
    paint: paint,
    drift: drift,
    figure: drawFigure,
    portrait: drawPortrait,
    blob: blob,
    palm: palm,
    seal: seal,
    map: inkMap,
    ids: Object.keys(PEOPLE),
  };
})();
