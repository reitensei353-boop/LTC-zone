/* 鹿鼎记 — exploration, dialogue, turn-based combat. Offline, no build. */
(function () {
  "use strict";

  const D = window.LDJData;
  const Art = window.LDJArt;
  const $ = function (id) { return document.getElementById(id); };
  const KEY = "ldj-weixiaobao-v1";
  const CN = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  const RANKS = ["", "市井小儿", "小白龙", "惯会惹事", "进京客", "冒牌太监", "桂公公", "擒鳌之人", "鹿鼎未完"];

  let state;
  let dpr = 1;
  let cssW = 1;
  let cssH = 1;
  let cache = null;
  let cacheKey = "";
  let checkpoint = null;
  let particles = [];
  let toastTimer = 0;
  const params = new URLSearchParams(location.search);

  function freshPlayer() {
    return {
      wen: 46, lv: 1, exp: 0, next: 22, yueli: 0,
      hp: 52, hpMax: 52, mp: 12, mpMax: 12,
      li: 8, shen: 14, gen: 7, ji: 16,
      arts: { brawl: 1, taunt: 1 },
      inv: { pill: 1 },
      equip: null,
      disguise: false,
    };
  }
  function baseState() {
    return {
      p: freshPlayer(),
      flags: {},
      node: "",
      loc: "mingyu",
      mode: "title",
      panel: "",
      quest: null,
      log: [],
      known: {},
      line: 0,
      battle: null,
      figureOverride: null,
      fast: params.get("fast") === "1",
      pendingToast: "",
    };
  }

  function silverText(wen) {
    wen = Math.max(0, wen | 0);
    if (wen >= 1000) {
      const liang = Math.floor(wen / 1000);
      const qian = Math.floor((wen % 1000) / 100);
      return qian ? liang + "两" + qian + "钱" : liang + "两";
    }
    return wen + "文";
  }
  function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("on"); }, 1400);
  }
  function wait(ms) {
    return new Promise(function (res) { setTimeout(res, state && state.fast ? 16 : ms); });
  }
  function shake() {
    const app = $("app");
    app.classList.remove("shake");
    void app.offsetWidth;
    app.classList.add("shake");
  }
  function noteQuest() {
    if (!state.quest) return;
    state.log = state.log || [];
    const t = state.quest.title;
    if (!state.log.some(function (q) { return q.title === t; })) state.log.push({ title: state.quest.title, detail: state.quest.detail });
    else state.log.forEach(function (q) { if (q.title === t) q.detail = state.quest.detail; });
  }
  function faceOf(speaker) {
    if (!speaker) return null;
    if ((speaker === "wei" || speaker === "mind") && state.p.disguise) return "wei_eunuch";
    const w = D.WHO[speaker];
    return w ? w.face : null;
  }
  function nameOf(speaker) {
    const w = D.WHO[speaker] || { name: "" };
    if (speaker === "wei" && state.p.disguise) {
      const loc = state.loc;
      if (loc === "hairoom" || loc === "palace" || loc === "courtyard" || loc === "study" || loc === "ending") return "小桂子";
    }
    if (speaker === "mind") return "心里";
    return w.name || "";
  }
  function playerAtk(rank) {
    let a = 7 + state.p.li * 0.55 + (rank - 1) * 2;
    if (state.p.equip === "dagger") a += 4;
    if (state.p.equip === "golddagger") a += 8;
    return a;
  }
  function playerDef() { return 2 + state.p.gen * 0.35; }
  function roll(atk, def, mult) {
    const base = atk * (mult || 1) - def * 0.45;
    const v = 0.9 + Math.random() * 0.2;
    return Math.max(1, Math.round(base * v));
  }
  function grantExp(n) {
    const p = state.p;
    p.exp += n;
    p.yueli += Math.ceil(n / 2);
    let ups = 0;
    while (p.exp >= p.next && p.lv < 8) {
      p.exp -= p.next;
      p.lv += 1;
      p.next = Math.round(p.next * 1.4 + 6);
      p.hpMax += 10;
      p.mpMax += 4;
      p.ji += 1;
      if (p.lv % 2 === 0) p.li += 1;
      else p.shen += 1;
      ups += 1;
    }
    p.hp = p.hpMax;
    p.mp = p.mpMax;
    if (ups) toast("修为升至" + (CN[p.lv] || p.lv) + " · " + (RANKS[p.lv] || ""));
  }

  function save() {
    try {
      let mode = state.mode;
      if (mode === "battle" || mode === "shop" || mode === "panel" || mode === "sheet") mode = "explore";
      if (mode === "choice") mode = "talk";
      const snap = {
        p: state.p, flags: state.flags, node: state.node, loc: state.loc,
        mode: mode, quest: state.quest, log: state.log, known: state.known,
      };
      localStorage.setItem(KEY, JSON.stringify(snap));
    } catch (e) { /* private mode */ }
  }
  function hasSave() {
    try { return !!localStorage.getItem(KEY); } catch (e) { return false; }
  }
  function loadGame() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      state = baseState();
      state.p = Object.assign(freshPlayer(), s.p);
      state.flags = s.flags || {};
      state.node = s.node || "intro";
      state.loc = s.loc || "mingyu";
      state.quest = s.quest || null;
      state.log = s.log || [];
      state.known = s.known || {};
      state.mode = s.mode || "explore";
      if (state.mode === "talk" || state.mode === "choice") {
        state.mode = "talk";
        state.line = 0;
      }
      if (!D.NODES[state.node]) state.mode = "title";
      render();
      return true;
    } catch (e) {
      return false;
    }
  }

  function goto(id) {
    const n = D.NODES[id];
    if (!n) {
      console.error("missing node", id);
      return;
    }
    state.figureOverride = null;
    state.node = id;
    state.battle = null;
    if (n.loc) state.loc = n.loc;
    if (n.onEnter) n.onEnter(state);
    noteQuest();
    state.line = 0;
    if (state.pendingToast) {
      toast(state.pendingToast);
      state.pendingToast = "";
    }
    if (n.shop) {
      state.mode = "shop";
      save();
      render();
      return;
    }
    if (n.ending) {
      state.mode = "end";
      save();
      render();
      return;
    }
    if (n.explore) {
      state.mode = "explore";
      save();
      render();
      return;
    }
    if (n.lines && n.lines.length) {
      state.mode = "talk";
      save();
      render();
      return;
    }
    if (n.thenBattle) {
      beginBattle(n.thenBattle);
      return;
    }
    if (n.next) goto(n.next);
    else {
      state.mode = "explore";
      render();
    }
  }

  function advance() {
    if (state.mode !== "talk") return;
    const n = D.NODES[state.node];
    if (!n || !n.lines) return;
    if (state.line < n.lines.length - 1) {
      state.line += 1;
      render();
      return;
    }
    if (n.choices && n.choices.length) {
      state.mode = "choice";
      render();
      return;
    }
    if (n.thenBattle) {
      beginBattle(n.thenBattle);
      return;
    }
    if (n.next) goto(n.next);
    else {
      state.mode = "explore";
      save();
      render();
    }
  }
  function choose(i) {
    const n = D.NODES[state.node];
    if (!n || !n.choices || !n.choices[i]) return;
    const c = n.choices[i];
    if (c.fx) c.fx(state);
    if (c.battle) beginBattle(c.battle);
    else goto(c.go);
  }

  function beginBattle(id) {
    const b = D.BATTLES[id];
    if (!b) return;
    state.p.hp = state.p.hpMax;
    state.p.mp = state.p.mpMax;
    checkpoint = JSON.parse(JSON.stringify({ p: state.p, flags: state.flags }));
    const rt = {
      id: id, hp: b.hp, hpMax: b.hp, atk: b.atk, def: b.def,
      turn: 1, busy: false, blind: 0, dodge: 0, guard: 0, stun: 0,
      goal: 0, goalMet: false, used: {}, enraged: false,
      survived: false, kangxi: false,
      log: b.name + "挡在面前。",
      poseP: "guard", poseE: "fight",
      ally: b.ally ? { name: b.ally.name, face: b.ally.face, atk: b.ally.atk, line: b.ally.line } : null,
    };
    if (b.onStart) b.onStart(rt, state);
    state.battle = rt;
    state.mode = "battle";
    render();
  }
  function skillById(id) { return D.SKILLS[id]; }
  function visibleSkill(id) {
    const sk = skillById(id);
    if (!sk) return false;
    if (sk.learn && !state.p.arts[id]) return false;
    if (sk.needEquip && state.p.equip !== "dagger" && state.p.equip !== "golddagger") return false;
    if (sk.item && !(state.p.inv[sk.item] > 0)) return false;
    return true;
  }
  function enabledSkill(id) {
    const sk = skillById(id);
    const rt = state.battle;
    if (!sk || !rt) return false;
    if (!visibleSkill(id)) return false;
    if (sk.mp && state.p.mp < sk.mp) return false;
    if (sk.once && rt.used[id]) return false;
    if (sk.uses && (rt.used[id] || 0) >= sk.uses) return false;
    if (sk.needBlind && !(rt.blind > 0)) return false;
    if (sk.needBind && !(rt.blind > 0 && rt.hp <= rt.hpMax * 0.45)) return false;
    return true;
  }
  function pay(id, sk, rt) {
    if (sk.mp) state.p.mp = Math.max(0, state.p.mp - sk.mp);
    if (sk.consume && sk.item) {
      state.p.inv[sk.item] = (state.p.inv[sk.item] || 1) - 1;
      if (state.p.inv[sk.item] <= 0) delete state.p.inv[sk.item];
    }
    if (sk.once) rt.used[id] = 1;
    if (sk.uses) rt.used[id] = (rt.used[id] || 0) + 1;
    if (sk.flag) state.flags[sk.flag] = 1;
    if (id === "lime") state.flags.limeUsed = 1;
  }
  function floatNum(n, xf) {
    const el = document.createElement("div");
    el.className = "floater";
    el.textContent = (n > 0 ? "-" : "") + n;
    el.style.left = (xf * 100) + "%";
    el.style.top = "34%";
    $("floaters").appendChild(el);
    setTimeout(function () { el.remove(); }, 820);
  }
  function burst(kind, right) {
    const x = cssW * (right ? 0.7 : 0.32);
    const y = cssH * 0.34;
    const n = kind === "blind" ? 18 : kind === "heavy" ? 14 : kind === "palm" ? 7 : 9;
    for (let i = 0; i < n; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 36,
        y: y + (Math.random() - 0.5) * 26,
        vx: (Math.random() - 0.5) * 2.4,
        vy: -0.4 - Math.random() * 1.2,
        r: 7 + Math.random() * (kind === "blind" ? 18 : 14),
        life: 0.9 + Math.random() * 0.3,
        rot: Math.random() * 6,
        color: kind === "blind" ? "rgba(236,236,232,0.75)" : kind === "heavy" ? "rgba(90,30,28,0.55)" : "rgba(24,20,16,0.62)",
        flat: kind === "blind" ? 0.45 : 0.62,
        palm: kind === "palm",
        ang: (i / n) * Math.PI * 2,
      });
    }
  }
  function resolvePlayer(id, sk, rt, b) {
    if (sk.kind === "heal") {
      state.p.hp = Math.min(state.p.hpMax, state.p.hp + (sk.heal || 20));
      return sk.text;
    }
    if (sk.kind === "taunt") {
      rt.atk = Math.max(5, rt.atk - 1);
      return sk.text;
    }
    if (sk.kind === "dodge") {
      rt.dodge = 2;
      return sk.text;
    }
    if (sk.kind === "guard") {
      rt.guard = Math.min(3, rt.guard + 1);
      const d = roll(8 + state.p.li * 0.3, rt.def, 0.55);
      rt.hp -= d;
      floatNum(d, 0.7);
      return sk.text;
    }
    if (sk.kind === "blind") {
      rt.blind = Math.max(rt.blind, 3);
      burst("blind", true);
      return sk.text;
    }
    if (sk.kind === "finish") {
      rt.hp = 0;
      burst("heavy", true);
      return sk.text;
    }
    if (sk.kind === "heavy") {
      const d = sk.flat || 70;
      rt.hp -= d;
      rt.stun = 1;
      floatNum(d, 0.7);
      burst("heavy", true);
      shake();
      return sk.text;
    }
    const rank = state.p.arts[id] || 1;
    const d = roll(playerAtk(rank), rt.def, sk.mult || 1);
    rt.hp -= d;
    floatNum(d, 0.7);
    if (b.goal && b.goal.skill === id) rt.goal += 1;
    if (sk.kind === "stun" && Math.random() < (sk.stun || 0.3)) rt.stun = 1;
    if (id === "leaf") burst("palm", true);
    else burst("ink", true);
    let extra = "";
    if (rt.stun > 0 && sk.kind === "stun") extra = "对方滞了一滞。";
    if (b.goal && rt.goal > 0 && b.goal.skill === id) extra += "（第" + CN[rt.goal] + "手）";
    return sk.text + extra;
  }
  function pickMove(b, rt) {
    if (b.id === "aobai") {
      if (rt.guard > 0 && rt.turn % 3 === 0) return { mult: 1.15, text: "鳌拜双臂一振，小太监被甩了开去。", clear: true };
      if (rt.blind > 0) return { mult: 0.82, text: "鳌拜揉着眼，乱拳仍砸得风响。", acc: 0.45 };
      if (rt.hp < rt.hpMax * 0.5) return { mult: 1.28, text: "鳌拜大叫：大伙儿一起死了罢！" };
      return { mult: 1.08, text: "鳌拜一拳砸下。他曾在北京街上一拳打死疯牛。" };
    }
    const moves = b.moves && b.moves.length ? b.moves : [{ mult: 1, text: b.name + "攻了上来。" }];
    return moves[(rt.turn - 1) % moves.length];
  }
  function act(id) {
    const rt = state.battle;
    const b = rt && D.BATTLES[rt.id];
    if (!rt || rt.busy || !b) return;
    if (!enabledSkill(id)) return;
    const sk = skillById(id);
    rt.busy = true;
    pay(id, sk, rt);
    rt.poseP = (sk.kind === "dodge" || sk.kind === "heal") ? "guard" : "reach";
    rt.log = resolvePlayer(id, sk, rt, b);
    render();
    wait(460).then(function () {
      if (!state.battle) return;
      rt.poseP = "guard";
      if (rt.hp <= 0) return winBattle();
      if (b.goal && rt.goal >= b.goal.n) {
        rt.goalMet = true;
        return winBattle();
      }
      enemyPhase();
    });
  }
  function enemyPhase() {
    const rt = state.battle;
    const b = D.BATTLES[rt.id];
    let lead = "";
    if (rt.ally && rt.hp > 0) {
      const d = roll(rt.ally.atk, rt.def, 1);
      rt.hp -= d;
      lead = rt.ally.line;
      floatNum(d, 0.7);
    }
    if (rt.hp <= 0) {
      rt.log = lead || rt.log;
      return winBattle();
    }
    if (rt.stun > 0) {
      rt.stun -= 1;
      rt.log = (lead ? lead + " " : "") + b.name + "这一招没能递出来。";
      render();
      return endRound();
    }
    const move = pickMove(b, rt);
    let hit = true;
    const acc = rt.blind > 0 ? (move.acc || 0.42) : 1;
    if (Math.random() > acc) hit = false;
    if (hit && rt.dodge > 0 && Math.random() < 0.55) hit = false;
    if (hit) {
      let dealt = roll(rt.atk, playerDef(), move.mult || 1);
      dealt = Math.max(1, Math.round(dealt * (1 - Math.min(0.55, rt.guard * 0.2))));
      if (move.clear) rt.guard = 0;
      state.p.hp -= dealt;
      floatNum(dealt, 0.28);
      rt.poseE = "reach";
      burst("ink", false);
      if (dealt > 16) shake();
    }
    rt.log = (lead ? lead + " " : "") + (hit ? move.text : b.name + "一招走空。");
    render();
    wait(480).then(function () {
      if (!state.battle) return;
      rt.poseE = "fight";
      if (state.p.hp <= 0) {
        if (b.survive && !rt.survived) {
          rt.survived = true;
          state.p.hp = Math.max(10, Math.round(state.p.hpMax * 0.34));
          rt.log = "康熙把你拖进书桌底下。鳌拜砸偏了。";
          render();
          return endRound();
        }
        return loseBattle();
      }
      if (b.id === "aobai" && !rt.kangxi && state.p.hp < state.p.hpMax * 0.42) {
        rt.kangxi = true;
        const d2 = 36;
        rt.hp -= d2;
        rt.log = "康熙绕到背后，一刀插入鳌拜背心。刀口偏了，人却怒得转身。";
        floatNum(d2, 0.7);
        burst("heavy", true);
        render();
        if (rt.hp <= 0) return winBattle();
      }
      if (b.maxTurns && rt.turn >= b.maxTurns) return winBattle();
      endRound();
    });
  }
  function endRound() {
    const rt = state.battle;
    if (!rt) return;
    if (rt.blind > 0) rt.blind -= 1;
    if (rt.dodge > 0) rt.dodge -= 1;
    rt.turn += 1;
    rt.busy = false;
    render();
  }
  function winBattle() {
    const rt = state.battle;
    if (!rt) return;
    const b = D.BATTLES[rt.id];
    state.flags["won_" + b.id] = 1;
    state.flags.lastGoal = !!rt.goalMet || (!b.goal);
    if (b.goal && rt.goal >= b.goal.n) state.flags.lastGoal = true;
    state.battle = null;
    grantExp(b.exp || 12);
    goto(b.win);
  }
  function loseBattle() {
    const rt = state.battle;
    if (!rt) return;
    const b = D.BATTLES[rt.id];
    if (checkpoint) {
      state.p = JSON.parse(JSON.stringify(checkpoint.p));
      state.flags = JSON.parse(JSON.stringify(checkpoint.flags));
    }
    state.p.hp = state.p.hpMax;
    state.battle = null;
    toast(b.nonlethal ? "这一场输了" : "幸而未死");
    goto(b.lose);
  }

  function useItem(id) {
    const it = D.ITEMS[id];
    if (!it || !(state.p.inv[id] > 0)) return;
    if (it.heal) {
      state.p.hp = Math.min(state.p.hpMax, state.p.hp + it.heal);
      state.p.inv[id] -= 1;
      if (state.p.inv[id] <= 0) delete state.p.inv[id];
      toast("气血回来些");
    } else if (it.equip) {
      state.p.equip = id;
      toast("换上了" + it.name);
    } else toast(it.desc);
    save();
    render();
  }
  function train(id) {
    const rank = state.p.arts[id] || 0;
    if (!rank || rank >= 3) return;
    const cost = 12 * rank;
    if (state.p.yueli < cost) return;
    state.p.yueli -= cost;
    state.p.arts[id] = rank + 1;
    toast(D.SKILLS[id].name + " 第" + CN[rank + 1] + "重");
    save();
    render();
  }
  function buy(id, price, once) {
    if (once && state.p.inv[id]) return;
    if (state.p.wen < price) { toast("银子不够"); return; }
    state.p.wen -= price;
    state.p.inv[id] = (state.p.inv[id] || 0) + 1;
    toast("买下" + D.ITEMS[id].name);
    save();
    render();
  }
  function travel(locId) {
    if (!state.flags["open_" + locId]) return;
    state.loc = locId;
    state.mode = "explore";
    state.node = "wander";
    save();
    render();
  }
  function openPanel(kind) {
    state.prev = state.mode;
    state.panel = kind;
    state.mode = kind === "sheet" ? "sheet" : "panel";
    render();
  }
  function closePanel() {
    state.mode = state.prev && state.prev !== "panel" && state.prev !== "sheet" ? state.prev : (state.node ? "explore" : "title");
    if (state.mode === "talk" || state.mode === "choice" || state.mode === "battle" || state.mode === "shop") {
      /* keep */
    }
    render();
  }

  function figures() {
    if (state.figureOverride) return state.figureOverride;
    const n = D.NODES[state.node];
    if (n && n.figures && state.mode !== "explore") return n.figures;
    const loc = D.LOCS[state.loc];
    return (loc && loc.figures) || [];
  }
  function sceneSpec() {
    if (state.mode === "title" || (state.mode === "sheet" && !state.node)) return { id: "title", night: true };
    if (state.battle) {
      const b = D.BATTLES[state.battle.id];
      const loc = D.LOCS[state.loc] || {};
      return { id: b.scene || loc.scene || "yangzhou", night: !!loc.night };
    }
    const loc = D.LOCS[state.loc] || D.LOCS.mingyu;
    return { id: loc.scene, night: !!loc.night };
  }

  function resize() {
    const r = $("app").getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cssW = Math.max(1, r.width);
    cssH = Math.max(1, r.height);
    const cv = $("cv");
    cv.width = Math.round(cssW * dpr);
    cv.height = Math.round(cssH * dpr);
    cacheKey = "";
  }
  function frame(t) {
    requestAnimationFrame(frame);
    const ctx = $("cv").getContext("2d");
    const spec = sceneSpec();
    const key = spec.id + "|" + (spec.night ? 1 : 0) + "|" + Math.round(cssW) + "|" + Math.round(cssH);
    if (key !== cacheKey) {
      cache = document.createElement("canvas");
      cache.width = $("cv").width;
      cache.height = $("cv").height;
      const c = cache.getContext("2d");
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      Art.paint(c, cssW, cssH, spec);
      cacheKey = key;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.drawImage(cache, 0, 0, cssW, cssH);
    if (!state.fast) Art.drift(ctx, cssW, cssH, t || 0);
    const bob = state.fast ? 0 : Math.sin((t || 0) * 0.002) * 1.2;
    if (state.mode === "battle" && state.battle) {
      const b = D.BATTLES[state.battle.id];
      const rt = state.battle;
      const fh = cssH * (b.id === "aobai" ? 0.4 : 0.34);
      Art.figure(ctx, state.p.disguise ? "wei_eunuch" : "wei", cssW * 0.3, cssH * 0.56 + bob, cssH * 0.32, rt.poseP);
      Art.figure(ctx, b.face, cssW * 0.72, cssH * 0.57, fh, rt.poseE);
      if (rt.ally) Art.figure(ctx, rt.ally.face, cssW * 0.14, cssH * 0.58, cssH * 0.26, "guard");
    } else if (state.mode !== "title") {
      figures().forEach(function (f) {
        let id = f.id;
        if (id === "wei" && state.p.disguise) id = "wei_eunuch";
        Art.figure(ctx, id, cssW * f.x, cssH * f.y + bob, cssH * (f.h || 0.3), f.pose || "stand");
      });
    }
    particles.forEach(function (p) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      if (p.palm) Art.palm(ctx, p.x, p.y, p.ang, Math.max(0, p.life) * 0.45);
      else Art.blob(ctx, p);
    });
    particles = particles.filter(function (p) { return p.life > 0; });
  }

  function setBar(id, cur, max) {
    const el = $(id);
    el.style.width = Math.max(0, Math.min(100, (cur / max) * 100)) + "%";
  }
  function paintFace(canvas, id, size) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!id) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    Art.portrait(ctx, id, size || canvas.width);
  }
  function spotsNow() {
    const loc = D.LOCS[state.loc];
    if (!loc) return [];
    return (loc.spots || []).filter(function (s) {
      if (s.need && !state.flags[s.need]) return false;
      if (s.unless && state.flags[s.unless]) return false;
      return true;
    });
  }
  function renderSpots() {
    const box = $("spots");
    box.innerHTML = "";
    if (state.mode !== "explore") return;
    const goal = state.quest && state.quest.spot;
    spotsNow().forEach(function (s) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "spot" + (s.id === goal ? " main" : "");
      b.style.left = (s.x * 100) + "%";
      b.style.top = (s.y * 100) + "%";
      b.innerHTML = "<i></i><span></span>";
      b.querySelector("span").textContent = s.label;
      b.addEventListener("click", function () { goto(s.go); });
      box.appendChild(b);
    });
  }
  function renderTalk() {
    const n = D.NODES[state.node];
    const line = n && n.lines && n.lines[state.line];
    const show = state.mode === "talk" || state.mode === "choice";
    $("dlg").hidden = !show;
    $("choices").hidden = state.mode !== "choice";
    if (!show || !line) return;
    const face = faceOf(line.s);
    $("dlg-port").hidden = !face;
    if (face) paintFace($("face"), face, 192);
    $("dlg-name").textContent = nameOf(line.s);
    $("dlg-text").textContent = line.t;
    $("dlg-text").classList.toggle("aside", !!(D.WHO[line.s] && D.WHO[line.s].aside));
    $("dlg-hint").hidden = state.mode !== "talk";
    if (state.mode === "choice") {
      const box = $("choices");
      box.innerHTML = "";
      n.choices.forEach(function (c, i) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "choice";
        b.textContent = c.t;
        b.addEventListener("click", function () { choose(i); });
        box.appendChild(b);
      });
    }
  }
  function renderBattle() {
    const on = state.mode === "battle" && state.battle;
    $("battle").hidden = !on;
    if (!on) return;
    const rt = state.battle;
    const b = D.BATTLES[rt.id];
    $("b-name").textContent = b.name;
    $("b-title").textContent = b.title + (rt.blind > 0 ? "  · 目不能视" : "");
    setBar("b-hp", rt.hp, rt.hpMax);
    paintFace($("b-face"), b.face, 128);
    $("b-log").textContent = rt.log;
    $("b-you").textContent = "气血 " + state.p.hp + "/" + state.p.hpMax + "    内力 " + state.p.mp + "/" + state.p.mpMax + (rt.guard ? "    被抱住" : "");
    const box = $("skills");
    box.innerHTML = "";
    (b.palette || []).forEach(function (id) {
      if (!visibleSkill(id)) return;
      const sk = skillById(id);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "skill" + (sk.needBlind || sk.needBind ? " key" : "");
      btn.disabled = !enabledSkill(id) || rt.busy;
      const sub = sk.mp ? "内力 " + sk.mp : (sk.needBlind && !(rt.blind > 0) ? "先迷其目" : (sk.needBind ? "目盲且力竭" : (sk.item ? "消耗" : "")));
      btn.innerHTML = "<span></span>" + (sub ? "<small></small>" : "");
      btn.querySelector("span").textContent = sk.name;
      if (sub) btn.querySelector("small").textContent = sub;
      btn.addEventListener("click", function () { act(id); });
      box.appendChild(btn);
    });
  }
  function renderTop() {
    const hide = state.mode === "title" || state.mode === "sheet";
    $("top").hidden = hide;
    $("vlabel").hidden = hide || state.mode === "panel" || state.mode === "end";
    if (hide) return;
    const loc = D.LOCS[state.loc];
    $("loc-name").textContent = loc ? loc.name : "";
    $("vlabel").textContent = loc ? loc.v : "";
    $("silver").textContent = silverText(state.p.wen);
    $("hp-n").textContent = state.p.hp + "/" + state.p.hpMax;
    $("mp-n").textContent = state.p.mp + "/" + state.p.mpMax;
    setBar("hp-b", state.p.hp, state.p.hpMax);
    setBar("mp-b", state.p.mp, state.p.mpMax);
    const q = $("quest");
    if (state.quest) {
      q.hidden = false;
      q.innerHTML = "";
      const b = document.createElement("b");
      b.textContent = state.quest.title;
      q.appendChild(b);
      q.appendChild(document.createTextNode(state.quest.detail));
    } else q.hidden = true;
  }
  function panelCard(html) {
    $("panel").hidden = false;
    $("panel-body").innerHTML = html;
  }
  function renderChar() {
    const p = state.p;
    panelCard(
      '<h2>人物</h2><div class="seal-line">小宝</div>' +
      '<div class="char-top"><canvas class="char-face" id="char-face" width="220" height="220"></canvas>' +
      '<div><div id="char-rank"></div><div id="char-lv"></div><p id="char-eq"></p></div></div>' +
      '<table class="stats"><tbody id="char-stats"></tbody></table>' +
      '<button type="button" class="back" id="save-btn">记下这一笔</button>' +
      '<button type="button" class="back" id="panel-back">回到江湖</button>'
    );
    const face = p.disguise ? "wei_eunuch" : "wei";
    paintFace($("char-face"), face, 220);
    $("char-rank").textContent = RANKS[p.lv] || "";
    $("char-lv").textContent = "修为" + (CN[p.lv] || p.lv) + "  ·  阅历 " + p.yueli;
    const eq = p.equip ? D.ITEMS[p.equip] : null;
    $("char-eq").textContent = eq ? "兵刃  " + eq.name : "兵刃  空着手";
    const rows = [
      ["气血", p.hp + " / " + p.hpMax],
      ["内力", p.mp + " / " + p.mpMax],
      ["臂力", String(p.li)],
      ["身法", String(p.shen)],
      ["根骨", String(p.gen)],
      ["机灵", String(p.ji)],
      ["银两", silverText(p.wen)],
      ["名号", p.disguise ? "宫中称小桂子" : "扬州韦小宝"],
    ];
    const tb = $("char-stats");
    rows.forEach(function (r) {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      th.textContent = r[0];
      const td = document.createElement("td");
      td.textContent = r[1];
      tr.appendChild(th);
      tr.appendChild(td);
      tb.appendChild(tr);
    });
    $("save-btn").addEventListener("click", function () { save(); toast("已记下"); });
    $("panel-back").addEventListener("click", closePanel);
  }
  function renderBag() {
    panelCard('<h2>背包</h2><div class="seal-line">行囊</div><div class="grid-items" id="bag"></div><button type="button" class="back" id="panel-back">回到江湖</button>');
    const box = $("bag");
    const ids = Object.keys(state.p.inv);
    if (!ids.length) {
      const p = document.createElement("p");
      p.textContent = "口袋比脸还干净。";
      box.appendChild(p);
    }
    ids.forEach(function (id) {
      const it = D.ITEMS[id];
      if (!it || !(state.p.inv[id] > 0)) return;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "item";
      const name = document.createElement("b");
      name.textContent = it.name + "  ×" + state.p.inv[id];
      const desc = document.createElement("span");
      desc.textContent = (state.p.equip === id ? "已装备。 " : "") + it.desc;
      b.appendChild(name);
      b.appendChild(desc);
      b.addEventListener("click", function () { useItem(id); });
      box.appendChild(b);
    });
    $("panel-back").addEventListener("click", closePanel);
  }
  function renderArts() {
    panelCard('<h2>武学</h2><div class="seal-line">手上的功夫</div><div id="arts"></div><button type="button" class="back" id="panel-back">回到江湖</button>');
    const box = $("arts");
    Object.keys(state.p.arts).forEach(function (id) {
      const sk = D.SKILLS[id];
      if (!sk) return;
      const rank = state.p.arts[id];
      const cost = 12 * rank;
      const row = document.createElement("div");
      row.className = "skill-row";
      const left = document.createElement("div");
      const b = document.createElement("b");
      b.textContent = sk.name + "  · 第" + (CN[rank] || rank) + "重";
      const p = document.createElement("p");
      p.textContent = sk.text;
      left.appendChild(b);
      left.appendChild(p);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mini";
      btn.textContent = rank >= 3 ? "已足" : "温习 " + cost;
      btn.disabled = rank >= 3 || state.p.yueli < cost;
      btn.addEventListener("click", function () { train(id); });
      row.appendChild(left);
      row.appendChild(btn);
      box.appendChild(row);
    });
    $("panel-back").addEventListener("click", closePanel);
  }
  function renderQuests() {
    panelCard('<h2>任务</h2><div class="seal-line">要做的事</div><div id="qs"></div><button type="button" class="back" id="panel-back">回到江湖</button>');
    const box = $("qs");
    const list = (state.log || []).slice().reverse();
    if (!list.length) {
      const p = document.createElement("p");
      p.textContent = "还没有人支使你。";
      box.appendChild(p);
    }
    list.forEach(function (q, i) {
      const d = document.createElement("div");
      d.className = "quest-block";
      const b = document.createElement("b");
      b.textContent = (i === 0 ? "当前  " : "经过  ") + q.title;
      const p = document.createElement("p");
      p.textContent = q.detail;
      d.appendChild(b);
      d.appendChild(p);
      box.appendChild(d);
    });
    $("panel-back").addEventListener("click", closePanel);
  }
  function renderMap() {
    panelCard('<h2>地图</h2><div class="seal-line">山河</div><canvas id="mapcv" width="680" height="360"></canvas><div class="map-list" id="map-list"></div><button type="button" class="back" id="panel-back">回到江湖</button>');
    const cv = $("mapcv");
    const ctx = cv.getContext("2d");
    const cur = (D.LOCS[state.loc] && D.LOCS[state.loc].map) || "yangzhou";
    Art.map(ctx, cv.width, cv.height, state.known, cur);
    const box = $("map-list");
    Object.keys(D.LOCS).forEach(function (id) {
      if (id === "tavern" || id === "ending" || id === "inn") return;
      const loc = D.LOCS[id];
      const b = document.createElement("button");
      b.type = "button";
      const open = !!state.flags["open_" + id];
      b.textContent = loc.name + (state.loc === id ? "  · 人在此处" : open ? "  · 可去" : "  · 未通");
      b.disabled = !open || state.loc === id;
      if (state.loc === id) b.className = "on";
      b.addEventListener("click", function () { travel(id); closePanel(); });
      box.appendChild(b);
    });
    $("panel-back").addEventListener("click", closePanel);
  }
  function renderShop() {
    const n = D.NODES[state.node];
    panelCard('<h2>镇口</h2><div class="seal-line">杂货</div><p id="shop-silver"></p><div class="grid-items" id="shop"></div><button type="button" class="back" id="shop-leave">离开</button>');
    $("shop-silver").textContent = "身上 " + silverText(state.p.wen);
    const box = $("shop");
    (n.shop || []).forEach(function (row) {
      const it = D.ITEMS[row.id];
      const b = document.createElement("button");
      b.type = "button";
      b.className = "item";
      const name = document.createElement("b");
      const owned = row.once && state.p.inv[row.id];
      name.textContent = it.name + "  " + silverText(row.price);
      const desc = document.createElement("span");
      desc.textContent = owned ? "已经有了。" : it.desc;
      b.disabled = !!owned;
      b.appendChild(name);
      b.appendChild(desc);
      b.addEventListener("click", function () { buy(row.id, row.price, row.once); });
      box.appendChild(b);
    });
    $("shop-leave").addEventListener("click", function () { goto(n.leave || "free_desheng"); });
  }
  function renderSheet() {
    panelCard('<h2>人物</h2><div class="seal-line">图鉴</div><div class="sheet" id="sheet"></div><button type="button" class="back" id="panel-back">返回</button>');
    const box = $("sheet");
    Art.ids.forEach(function (id) {
      const p = Art.PEOPLE[id];
      const fig = document.createElement("figure");
      const cv = document.createElement("canvas");
      cv.width = 200;
      cv.height = 200;
      const cap = document.createElement("figcaption");
      cap.textContent = p.sheet || p.name;
      fig.appendChild(cv);
      fig.appendChild(cap);
      box.appendChild(fig);
      paintFace(cv, id, 200);
    });
    $("panel-back").addEventListener("click", function () {
      if (!state.node) {
        state.mode = "title";
        render();
      } else closePanel();
    });
  }
  function renderEnd() {
    panelCard(
      '<div class="end-card"><h2>未完待续</h2><div class="seal-line">鹿鼎</div>' +
      '<p>康熙八年，鳌拜被擒。京城里都在说，动手的是一位十来岁的小公公。</p>' +
      '<p>韦小宝站在人群外面，靴筒里的匕首还温着。海大富仍在等那部四十二章经。天地会的陈近南，他还没见过面。为人不识陈近南，就称英雄也枉然——这句话，他记住了。</p>' +
      '<p>小玄子说他们是朋友。皇帝的朋友能做多久，扬州的小孩还不知道。</p>' +
      '<p style="text-align:center;letter-spacing:0.3em">—— 扬州的事，到这里先停下 ——</p></div>' +
      '<button type="button" class="back" id="end-title">回到题头</button>'
    );
    $("end-title").addEventListener("click", function () {
      state.mode = "title";
      render();
    });
  }

  function render() {
    const mode = state.mode;
    $("title").hidden = mode !== "title";
    $("btn-cont").hidden = !hasSave();
    $("tabs").hidden = mode !== "explore";
    $("dock").hidden = mode === "title" || mode === "panel" || mode === "sheet" || mode === "end" || mode === "shop";
    const showPanel = mode === "panel" || mode === "sheet" || mode === "end" || mode === "shop";
    $("panel").hidden = !showPanel;
    renderTop();
    renderSpots();
    renderTalk();
    renderBattle();
    if (mode === "panel") {
      if (state.panel === "char") renderChar();
      else if (state.panel === "bag") renderBag();
      else if (state.panel === "arts") renderArts();
      else if (state.panel === "quests") renderQuests();
      else if (state.panel === "map") renderMap();
      else renderChar();
    } else if (mode === "sheet") renderSheet();
    else if (mode === "end") renderEnd();
    else if (mode === "shop") renderShop();
  }

  function newGame() {
    state = baseState();
    state.fast = params.get("fast") === "1";
    goto("intro");
  }
  function latePlayer() {
    const p = state.p;
    p.lv = 6;
    p.hpMax = 108; p.hp = 96;
    p.mpMax = 36; p.mp = 28;
    p.li = 12; p.shen = 18; p.gen = 9; p.ji = 22;
    p.wen = 6400; p.yueli = 36; p.exp = 12; p.next = 80;
    p.disguise = true;
    p.arts = { brawl: 2, taunt: 1, qin: 2, leaf: 2, empty: 1 };
    p.inv = { golddagger: 1, dagger: 1, ash: 1, pill: 2, drug: 1, rope: 1, note: 1, sycee: 1, lime: 1 };
    p.equip = "golddagger";
    state.quest = { title: "擒鳌拜", detail: "茶盏落地，便一起上。", spot: "censer" };
    state.log = [
      { title: "鸣玉坊", detail: "已离开扬州。" },
      { title: "冒充小桂子", detail: "海大富看不见了。" },
      state.quest,
    ];
    state.known = { yangzhou: true, road: true, beijing: true, palace: true };
    state.flags.qinDone = 1;
    state.flags.knowEmperor = 1;
    state.flags.plan = 1;
    state.flags.open_palace = 1;
  }
  function setupShot(shot) {
    state = baseState();
    state.fast = true;
    if (shot === "street") { goto("free_mingyu"); return; }
    if (shot === "talk") { goto("after_salt"); return; }
    if (shot === "palace") {
      latePlayer();
      state.loc = "palace";
      state.mode = "explore";
      state.node = "free_palace";
      state.figureOverride = [
        { id: "wei", x: 0.34, y: 0.82, h: 0.32, pose: "stand" },
        { id: "kangxi", x: 0.66, y: 0.78, h: 0.38, pose: "stand" },
      ];
      render();
      return;
    }
    if (shot === "battle") {
      latePlayer();
      state.loc = "study";
      beginBattle("aobai");
      return;
    }
    if (shot === "char") {
      latePlayer();
      state.panel = "char";
      state.mode = "panel";
      state.prev = "explore";
      render();
      return;
    }
    if (shot === "sheet") {
      state.mode = "sheet";
      state.node = "";
      render();
      return;
    }
    state.mode = "title";
    render();
  }

  function bind() {
    $("btn-new").addEventListener("click", newGame);
    $("btn-cont").addEventListener("click", function () { if (!loadGame()) toast("还没有记下的事"); });
    $("btn-sheet").addEventListener("click", function () {
      state.prev = "title";
      state.node = state.node || "";
      state.mode = "sheet";
      render();
    });
    $("dlg").addEventListener("click", function () { if (state.mode === "talk") advance(); });
    document.querySelectorAll("#tabs .tab").forEach(function (b) {
      b.addEventListener("click", function () { openPanel(b.getAttribute("data-panel")); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === " " || e.key === "Enter") {
        if (state.mode === "talk") { e.preventDefault(); advance(); }
      }
      if (e.key >= "1" && e.key <= "9" && state.mode === "choice") choose(Number(e.key) - 1);
    });
    window.addEventListener("resize", resize);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", resize);
  }

  function boot() {
    bind();
    resize();
    const shot = params.get("shot");
    if (shot) setupShot(shot);
    else {
      state = baseState();
      state.mode = "title";
      render();
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { cacheKey = ""; });
    }
    requestAnimationFrame(frame);
  }

  window.LDJ = {
    get state() { return state; },
    goto: goto,
    advance: advance,
    choose: choose,
    act: act,
    newGame: newGame,
    save: save,
    load: loadGame,
    beginBattle: beginBattle,
  };
  boot();
})();
