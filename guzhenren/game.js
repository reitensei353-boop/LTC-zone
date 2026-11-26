/* 蛊真人·青茅山 — standalone canvas port. Atlas is atlas.png (not embedded). */
(function () {
  "use strict";

  const ATLAS_W = 352;
  const AT = {
    hero: [0, 0, 64, 64],
    fangzheng: [64, 0, 16, 16],
    elder: [80, 0, 16, 16],
    chief: [96, 0, 16, 16],
    uncle: [112, 0, 16, 16],
    aunt: [128, 0, 16, 16],
    merchant: [144, 0, 16, 16],
    mobei: [160, 0, 16, 16],
    chicheng: [176, 0, 16, 16],
    face_hero: [192, 134, 48, 48],
    face_fangzheng: [38, 96, 38, 38],
    face_elder: [76, 96, 38, 38],
    face_chief: [114, 96, 38, 38],
    face_uncle: [152, 96, 38, 38],
    face_aunt: [190, 96, 38, 38],
    face_merchant: [228, 96, 38, 38],
    face_mobei: [266, 96, 38, 38],
    face_chicheng: [304, 96, 38, 38],
    wolf: [0, 134, 32, 32],
    bigwolf: [0, 166, 32, 32],
    boss: [0, 198, 32, 32],
    boar: [128, 134, 16, 16],
    house_thatch: [0, 230, 64, 47],
    house_plaster: [64, 230, 64, 47],
    house_thatch2: [128, 230, 64, 47],
    house_red: [192, 230, 64, 47],
    hero_old: [128, 280, 64, 64],
    face_hero_old: [256, 280, 48, 48],
    rv: [144, 32, 16, 16],
    rvelite: [192, 280, 32, 32],
    rvboss: [224, 280, 32, 32],
    face_rv_boss: [304, 280, 48, 48],
    baiguard: [64, 32, 16, 16],
    icewolf: [32, 280, 32, 32],
    bear: [0, 280, 32, 32],
    xionglin: [80, 32, 16, 16],
    face_xiongjiao: [0, 96, 38, 38],
    bnb: [112, 32, 16, 16],
    bnbbig: [96, 280, 32, 32],
    face_bnb_girl: [242, 134, 48, 48],
    face_bnb_boy: [208, 0, 38, 38],
    bat: [128, 32, 16, 16],
    enforcer: [80, 0, 16, 16],
  };
  const BIG32 = ["wolf", "bigwolf", "boss", "rvelite", "rvboss", "icewolf", "bear"];
  const BOSS_KINDS = ["boss", "rvboss", "bnb", "xionglin", "enforcer"];
  const HUMAN_KINDS = ["mobei", "chicheng", "rv", "rvelite", "rvboss", "baiguard", "xionglin", "bnb", "enforcer"];
  const FACE_OF = {
    "方源": "hero",
    "方源（心声）": "hero",
    "古月方正": "fangzheng",
    "学堂家老": "elder",
    "族长古月博": "chief",
    "古月冻土": "uncle",
    "舅母": "aunt",
    "贾家商队": "merchant",
    "族人": "mobei",
    "古月漠北": "mobei",
    "古月赤城": "chicheng",
    "魔头方源": "hero_old",
    "魔头方源（心声）": "hero_old",
    "正道盟主": "rv_boss",
    "白凝冰": "bnb_girl",
    "熊林": "xiongjiao",
    "白家蛊师": "bnb_boy",
    "古月执法家老": "elder",
    "垂死的正道蛊师": "rv_boss",
  };

  const PAL = {
    k: "#1a1c2c", w: "#f4f4f4", s: "#f2c9a0", S: "#c98e6a", h: "#26222e", g: "#2fbf71", G: "#1d6b52",
    y: "#ffcd75", r: "#c0394b", R: "#6e2a3a", b: "#3b5dc9", B: "#29366f", o: "#8b5a2b", O: "#5d3a1a",
    e: "#94b0c2", E: "#566c86", p: "#7a3d8f", c: "#73eff7", m: "#dff6ff", n: "#c9a16b", N: "#a87d4b",
    q: "#4f8f3a", Q: "#36692a", L: "#8cc24f", l: "#a7f070", d: "#3fa34d", j: "#6b7a8f", J: "#4b566a",
    x: "#3b2f4f", X: "#261d33", u: "#5c4a72", T: "#3a4466", t: "#5a6988", v: "#e8d8b0", i: "#b0d8ff",
    P: "#e07ba0", K: "#9c4468",
  };

  const GRASS = ["................", "...Q............", "..Q.Q......L....", "..........L.L...", "................", "......Q.........", ".....Q.Q........", "...............Q", ".L............Q.", "L.L.............", "........L.......", ".......L.L......", "................", "..Q.........Q...", ".Q.Q.......Q.Q..", "................"];
  const FLOWERS = ["................", "..i.......i.....", ".imi.....imi....", "..i.......i.....", "..d...i...d.....", "..d..imi..d..i..", "......i.....imi.", "......d......i..", ".i....d......d..", "imi...........d.", ".i.......i......", ".d......imi.....", ".d.......i......", "..........d.....", "....i.....d.....", "...imi.........."];
  const BAMBOO = ["..l....dl...l...", ".ldl..ldQl.ldl..", ".ldQ..ldQl.ldQ..", ".ldQ...dQ..ldQ..", ".QQQ...dQ..QQQ..", ".ldQ..QQQl.ldQ..", "lldQ...dQ..ldQl.", ".ldQ...dQl.ldQ..", ".ldQ...dQ..ldQ..", ".QQQ..ldQ..QQQ..", ".ldQ..QQQ..ldQ.l", ".ldQl..dQ..ldQl.", ".ldQ...dQ..ldQ..", ".ldQ..ldQl.ldQ..", ".QQQ...dQ..QQQ..", ".ldQ...dQ..ldQ.."];
  const TREE = [".....QQQQQ......", "...QQdddddQQ....", "..QdddLLdddQQ...", ".QddLLLddddddQ..", ".QdLLddddddddQ..", "QddddddddLLdddQ.", "QdddddddLLddddQ.", "QddLLdddddddddQ.", ".QdLLddddddddQ..", ".QQddddddddQQQ..", "..QQQddddQQQ....", "......QOOQ......", ".......OO.......", ".......OO.......", "......OOOO......", "................"];
  const PATH = ["................", "..N.........o...", "........N.......", "....o...........", "..............N.", "..........N.....", ".N..............", "......o.....N...", "................", "...N............", ".........o....o.", "..............N.", "....N...........", "...........N....", ".o......N.......", "................"];
  const ROCK = ["EEEEeEEEEEEEeEEE", "EeeeeeEEEEeeeeeE", "eewweeekEeeweeek", "eweeeeekEewwekkE", "eeeeeEkEEeeeekEE", "EeeeEkEEEEEEkEEE", "kEEEkEeeeeEEkEEe", "EkkkEeewweeekkee", "EEEEeewweeeeEkEe", "eeEEeeeeeeeekEEe", "weeEEeeeeeeEkEEe", "eeekEEEeeeEkEEee", "EEkEEEEEEEkEEEEe", "EkEeeeeEEkEEeeeE", "kEeeweeeEEEeeweE", "EEEEEEEEEEEEEEEE"];
  const CRACK = ["................", "................", ".......k........", "......kk........", "......kkk.......", ".....kkkk.......", ".....kkpkk......", "......kkkk......", "......kpkkk.....", ".....kkkkkk.....", ".....kkpkkk.....", "....kkkkkkkk....", "....kkkkpkkk....", "...kkkkkkkkkk...", "...kkkkkkkkkk...", "...kkkkkkkkkk..."];
  const PALISADE = ["..k...k...k...k.", ".kok.kok.kok.kok", "kooOkooOkooOkooO", "kooOkooOkooOkooO", "kooOkooOkooOkooO", "OOOOOOOOOOOOOOOO", "kooOkooOkooOkooO", "kooOkooOkooOkooO", "kooOkooOkooOkooO", "kooOkooOkooOkooO", "OOOOOOOOOOOOOOOO", "kooOkooOkooOkooO", "kooOkooOkooOkooO", "kooOkooOkooOkooO", "kkkkkkkkkkkkkkkk", "................"];
  const ROOF = ["kkkkkkkkkkkkkkkk", "TtTTtTTtTTtTTtTT", "TtTTtTTtTTtTTtTT", "kkkkkkkkkkkkkkkk", "tTTtTTtTTtTTtTTt", "tTTtTTtTTtTTtTTt", "kkkkkkkkkkkkkkkk", "TtTTtTTtTTtTTtTT", "TtTTtTTtTTtTTtTT", "kkkkkkkkkkkkkkkk", "tTTtTTtTTtTTtTTt", "tTTtTTtTTtTTtTTt", "kkkkkkkkkkkkkkkk", "OOOOOOOOOOOOOOOO", "oOoOoOoOoOoOoOoO", "kkkkkkkkkkkkkkkk"];
  const WALL = ["OvvvvvvvvvvvvvvO", "OvvvvvvvvvvvvvvO", "OvvkkkkkkkkkkvvO", "OvvkoOoOoOoOkvvO", "OvvkOyOyOyOykvvO", "OvvkoOoOoOoOkvvO", "OvvkOyOyOyOykvvO", "OvvkoOoOoOoOkvvO", "OvvkkkkkkkkkkvvO", "OvvvvvvvvvvvvvvO", "OvvvvvvvvvvvvvvO", "OOOOOOOOOOOOOOOO", "OvvvvvvvvvvvvvvO", "OvvvvvvvvvvvvvvO", "OOOOOOOOOOOOOOOO", "kkkkkkkkkkkkkkkk"];
  const HERO_DOWN = ["................", ".....kkkkkk.....", "....khhhhhhk....", "...khhhhhhhhk...", "...khhsssshhk...", "...khsksskshk...", "...kkssSSsskk...", "....kssssssk....", "...kgggwwgggk...", "..kggggwwggggk..", "..ksgGGyyGGgsk..", "..kkggGyyGggkk..", "...kggggggggk...", "...kgGggggGgk...", "...kGGGkkGGGk...", "...kkkk..kkkk..."];
  const HERO_UP = ["................", ".....kkkkkk.....", "....khhhhhhk....", "...khhhhhhhhk...", "...khhhhhhhhk...", "...khhhhhhhhk...", "...kkhhhhhhkk...", "....khhhhhhk....", "...kggggggggk...", "..kggggggggggk..", "..ksggGGGGggsk..", "..kkggggggggkk..", "...kggggggggk...", "...kgGggggGgk...", "...kGGGkkGGGk...", "...kkkk..kkkk..."];
  const BOAR = ["................", "................", "................", "................", "....kkkkkkk.....", "..kkOoooooOkk...", ".kOoooooooooOk..", "kwroooooooooOOk.", "kOooooooooooooOk", "kOoooooooooooOk.", ".kOooooooooooOk.", "..kOkOk..kOkOk..", "..kOkOk..kOkOk..", "..kk.kk..kk.kk..", "................", "................"];
  const WOLF = ["................", "................", "..k.k...........", ".kckck..........", ".keeeek.........", "keekeeek.....c..", "keeeeeekkkkkkck.", ".kweeeeeeeeeeek.", "..keeeeeeeeeeEk.", "..kEeeeeeeeeeEk.", "...keeeeeeeeEk..", "...keEk..keEk...", "...kEk...kEk....", "...kEk...kEk....", "...kkk...kkk....", "................"];
  const CROWN = [".y.y.y..........", ".yyyyy..........", "..cyc..........."];
  const REMAINS = ["................", "................", "................", "...........kk...", "..........kook..", "...........kk...", "..........kook..", "..kkkkk..koooook", ".kwwwwwk.koyyook", ".kwkwkwk.koooook", ".kwwwwwk..kooOk.", "..kwkwk....kkk..", "..kkkkk.........", "kweeeeeeeeewk...", ".kkkkkkkkkkk....", "................"];
  const STELE = ["................", "....kkkkkkkk....", "...keeeeeeeek...", "...kekkekkeEk...", "...keeeeeeeEk...", "...kekkkekeEk...", "...keeeeeeeEk...", "...kekekkkeEk...", "...keeeeeeeEk...", "...kekkekkeEk...", "...keeeeeeeEk...", "...kEEEEEEEEk...", "..kkkkkkkkkkkk..", "..kEEEEEEEEEEk..", "..kkkkkkkkkkkk..", "................"];
  const BLADE = ["......mmm.......", "........mm......", ".........mm.....", "..........mm....", "..........mcm...", "..........mcm...", "..........mm....", ".........mm.....", "........mm......", "......mmm......."];

  const MAP_W = 32, MAP_H = 26, VIEW_W = 11, VIEW_H = 9, T = 16;
  const CW = VIEW_W * T, CH = VIEW_H * T;
  const RAW_MAP = [
    "MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM", "MCCCCCCCCCMMqbbpqqqbbqMssssssssM", "MCcccccccCMMqqqpbbqqqbMssssssssM",
    "MCcccccccCMMbqqpqqqqqqMssssssssM", "MCcccccccCMMqqqpqqqqqbMssssssssM", "MCcccccccCMMqqqpqqbbqqMssssssssM",
    "MCCCCXCCCCMMqbbpqqqqqqMMMssMMMMM", "MqqqqppppppppppppppppppppppbbqqM", "MqbbqqqqqqqqqqqpqYqqqqbbqYqqqbqM",
    "MbqqqqYqqqqbqqqpqqqqbqqqqqYqqqbM", "M##############pp##############M", "MqqHHHHqqqHHHHqppqqqqqHHHHqqqqqM",
    "MYqHHHHqqqHHHHqppqqqqqHHHHqqqYqM", "MqqHHHHqqqHHHHqppqqqqqHHHHqqqqqM", "MqqqqpqqqqqpqqqppqqqqqqqpqpqqqqM",
    "MqpppppppppppppppppppppppppppppE", "MqqqqqqqqqqqqqqppqqqqqqqqqqqqqqM", "MqYHHHHqqqffffqppqfffqHHHHqqqYqM",
    "MqqHHHHqqqffffqppqfffqHHHHqqqqqM", "MqqHHHHqqqffffqppqfffqHHHHqqqqqM", "MqqqqpqqqqqqqqqppqqqqqqqpqqqqqqM",
    "MqppppppppppppppppppppppppppppqM", "MqqqqqqqqqqqqqqppqqqqqqqqqqqqqqM", "MqYqqqqqqYqqqqqppqqqqYqqqqqqqYqM",
    "MqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqM", "MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM",
  ];
  const PRO_MAP = [
    "MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM", "MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM", "MMMMMMMMMMMMMccccccccMMMMMMMMMMM",
    "MMMMMMMMMMMMMccccccccMMMMMMMMMMM", "MMMMMMMMMMMMMccccccccMMMMMMMMMMM", "MMMMMMMMMMMMMccccccccMMMMMMMMMMM",
    "MMMMMMMMMMMMMccccccccMMMMMMMMMMM", "MMMMMMMMMMsssspppppMMMMMMMMMMMMM", "MMMMMMMMMMYssspppppMMMMMMMMMMMMM",
    "MMMMMMMMMMsssssMMMMMMMMMMMMMMMMM", "MMMMMMMMMMsssssMMMMMMMMMMMMMMMMM", "MMMMMMMMMMsssssMMMMMMMMMMMMMMMMM",
    "MMMMMMMMMMsssssMMMMMMMMMMMMMMMMM", "MMMMMMMMMMssssspppppsssMMMMMMMMM", "MMMMMMMMMMssssspppppsssMMMMMMMMM",
    "MMMMMMMMMMMMMMMMMMMssYsMMMMMMMMM", "MMMMMMMMMMMMMMMMMMMssssMMMMMMMMM", "MMMMMMMMMMMMMMMMMMMssssMMMMMMMMM",
    "MMMMMMMMMMMMMMMMMMMssssMMMMMMMMM", "MMsYssssssMMMMMMMMMsYssMMMMMMMMM", "MMsssssssppppppppppssssMMMMMMMMM",
    "MMsssssssppppppppppssssMMMMMMMMM", "MMssssssssMMMMMMMMMMMMMMMMMMMMMM", "MMssYsssYsMMMMMMMMMMMMMMMMMMMMMM",
    "MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM", "MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM",
  ];
  const EAST_MAP = [
    "MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM", "MMMMMMMMMMMMMMMMMwwwwwwwwwwwwwwM", "MqqqqqqqqqqqqYqqMwYwwwwwwwwwwYwM",
    "MqYqqbqqpqqqqqqqMwwwwwwwwwwwwwwM", "MqqqqqqqpqqqYqqqMwwwwwpwwwwwwwwM", "MqqqYqqqpqqqqqqqMwwwwwpwwwwwwwwM",
    "MbqqqqqqpqbqqqqqqqwwwwpwwwYwwwwM", "MqqqqqqqpqqqqqYqqqwwwwpwwwwwwwwM", "MqqYqqqbpqqqqqqqqqwwwwpwwwwwwwwM",
    "MqqqqqqqpqqqqbqqqqwwYwpwwwwwwwwM", "MqqqqqYqpqqYqqqqqqwwwwpwwwwwYwwM", "MqYqqqqqpqqqqqYqqqwwwwpwwwwwwwwM",
    "MqqqqqqqqqqqqqqqqqqqqqpqqqqqqqqM", "<pppppppppppppppqqqqqqqqqqqqqqqM", "MqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqM",
    "MMMMMMMMMMqqqqqpqqqqqMMMMMMMMMMM", "MMMMMMMMMMqqqqqpqqYqqMMMMMMMMMMM", "MMMMMMMMMMqYqqqpqqqqqMMMMMMMMMMM",
    "MMMMMMMMMMqqqqqpqqqqqMMMMMMMMMMM", "MMMMMMMMMMqqqqqpqfqqqMMMMMMMMMMM", "MMMMMMMMMMqqqfqpqqqqqMMMMMMMMMMM",
    "MMMMMMMMMMqqqqqpqqqqqMMMMMMMMMMM", "MMMMMMMMMMqqqqqpqqqYqMMMMMMMMMMM", "MMMMMMMMMMqqYqqpfqqqqMMMMMMMMMMM",
    "MMMMMMMMMMqqqqqpqqqqqMMMMMMMMMMM", "MMMMMMMMMMMMMMMOMMMMMMMMMMMMMMMM",
  ];
  const MAPS = { main: RAW_MAP, pro: PRO_MAP, east: EAST_MAP };
  let CUR_MAP_ID = "main";
  const HOUSES = [
    { x: 3, y: 11, key: "house_plaster" }, { x: 10, y: 11, key: "house_red" }, { x: 22, y: 11, key: "house_thatch2" },
    { x: 3, y: 17, key: "house_thatch" }, { x: 22, y: 17, key: "house_plaster" },
  ];

  const RANKS = ["一转初阶", "一转中阶", "一转高阶", "一转巅峰", "二转初阶", "二转中阶", "二转高阶", "二转巅峰", "六转魔尊（前世）"];
  const RANK_NEED = [30, 60, 100, 999, 120, 160, 220, 999, 999];
  function rankCap(r) { return r >= 8 ? 8 : r >= 4 ? 7 : 3; }
  function maxHpOf(r) { return r >= 8 ? 300 : 60 + 20 * r + (r >= 4 ? 40 : 0); }
  function maxZyOf(r) { return r >= 8 ? 150 : 30 + 8 * r + (r >= 4 ? 20 : 0); }
  function atkOf(r) { return r >= 8 ? 44 : 9 + 3 * r + (r >= 4 ? 4 : 0); }
  function defOf(r) { return r >= 8 ? 22 : 3 + 2 * r + (r >= 4 ? 3 : 0); }

  const GU_INFO = {
    moon: { name: "月光蛊", cost: 6, food: "petal", desc: "凝月刃斩敌，1.9 倍伤害" },
    wine: { name: "酒虫", cost: 0, food: "liquor", desc: "回复 15 真元，下次蛊术 +50%" },
    pig: { name: "白豕蛊", cost: 5, food: "meat", desc: "3 回合攻击 +60%" },
    jade: { name: "玉皮蛊", cost: 5, food: "jadebits", desc: "3 回合受伤减半" },
    bloodmoon: { name: "血月蛊", cost: 8, food: "petal", desc: "血月斩，2.6 倍伤害并吸血" },
    bear: { name: "熊力蛊", cost: 7, food: "meat", desc: "熊力重拳，2.4 倍伤害且无视防御" },
    life: { name: "生机叶", cost: 8, food: "herb", desc: "回复 60 生命" },
    xuehai: { name: "血神子", cost: 25, food: "liquor", desc: "血海神通，4 倍伤害" },
  };
  const GU_ORDER = ["xuehai", "bloodmoon", "moon", "bear", "wine", "pig", "jade", "life"];
  const GU_MAX = 20;
  const ITEMS = {
    herb: { name: "疗伤草药", price: 15, desc: "生命 +40" },
    petal: { name: "月兰花瓣", price: 5, desc: "月光蛊食粮" },
    liquor: { name: "竹叶青酒", price: 10, desc: "酒虫食粮" },
    meat: { name: "野猪肉", price: 6, desc: "白豕蛊食粮" },
    jadebits: { name: "玉石碎", price: 8, desc: "玉皮蛊食粮" },
  };
  const ITEM_ORDER = ["herb", "petal", "liquor", "meat", "jadebits"];
  const GU_PRICE = { pig: 120, jade: 100, life: 150 };

  const ENEMY_TPL = {
    boar: { name: "山野猪", maxHp: 28, atk: 7, def: 1, exp: 8, stones: 4, drop: "meat", dropRate: 0.6 },
    wolf: { name: "电狼", maxHp: 48, atk: 12, def: 3, exp: 14, stones: 7, drop: "herb", dropRate: 0.3 },
    bigwolf: { name: "豪电狼", maxHp: 80, atk: 16, def: 5, exp: 24, stones: 12, drop: "herb", dropRate: 0.5 },
    mobei: { name: "古月漠北", maxHp: 42, atk: 9, def: 2, exp: 12, stones: 30, dropRate: 0 },
    chicheng: { name: "古月赤城", maxHp: 38, atk: 10, def: 2, exp: 12, stones: 30, dropRate: 0 },
    boss: { name: "雷冠头狼", maxHp: 240, atk: 23, def: 6, exp: 0, stones: 0, dropRate: 0 },
    rv: { name: "正道蛊师", maxHp: 110, atk: 30, def: 8, exp: 0, stones: 0, dropRate: 0 },
    rvelite: { name: "正道长老", maxHp: 200, atk: 36, def: 10, exp: 0, stones: 0, dropRate: 0 },
    rvboss: { name: "正道盟主", maxHp: 9999, atk: 40, def: 30, exp: 0, stones: 0, dropRate: 0 },
    baiguard: { name: "白家蛊师", maxHp: 110, atk: 22, def: 7, exp: 30, stones: 25, drop: "herb", dropRate: 0.4 },
    icewolf: { name: "霜狼", maxHp: 130, atk: 24, def: 8, exp: 32, stones: 15, drop: "meat", dropRate: 0.5 },
    bear: { name: "熊家驯熊", maxHp: 160, atk: 26, def: 10, exp: 38, stones: 18, drop: "meat", dropRate: 0.7 },
    xionglin: { name: "熊林", maxHp: 320, atk: 30, def: 12, exp: 80, stones: 120, dropRate: 0 },
    bnb: { name: "白凝冰", maxHp: 520, atk: 34, def: 14, exp: 120, stones: 0, dropRate: 0 },
    bat: { name: "血蝠", maxHp: 90, atk: 26, def: 5, exp: 26, stones: 12, drop: "herb", dropRate: 0.4 },
    enforcer: { name: "古月执法家老", maxHp: 420, atk: 36, def: 16, exp: 120, stones: 200, dropRate: 0 },
  };
  const BATTLE_INTRO = {
    rv: ["正道蛊师：魔头，纳命来！"],
    rvelite: ["正道长老：方源，你逃不掉的。", "魔头方源：逃？我只是在挑先杀谁。"],
    rvboss: ["正道盟主：天下正道，共诛此魔！", "魔头方源：来吧。"],
    baiguard: ["白家蛊师：古月家的狗，也敢来东麓？"],
    xionglin: ["熊林：小子，熊家的林子不是你能闯的！", "方源：林子是谁的，打完再说。"],
    bnb: ["白凝冰：让我看看，斩了狼王的人有几分本事。", "方源：你会后悔的。"],
    enforcer: ["古月执法家老：方源，束手就擒！", "方源：古月一族，拦不住我。"],
  };
  const CHARGE_MSG = {
    boss: ["雷冠头狼撕咬，随后头顶雷光汇聚……", "雷冠头狼释放「雷冠怒啸」！"],
    bnb: ["白凝冰周身寒气翻涌，北冥冰魄之力在凝聚……", "白凝冰释放「冰魄寒息」！"],
    xionglin: ["熊林气血鼓荡，双臂肌肉暴涨……", "熊林使出「熊力崩山」！"],
    enforcer: ["执法家老掐动法诀，金光渐盛……", "执法家老祭出「执法金光」！"],
  };

  const NPCS = [
    { id: "elder", name: "学堂家老", sprite: "elder", x: 5, y: 14 },
    { id: "chief", name: "族长古月博", sprite: "chief", x: 11, y: 14 },
    { id: "fangzheng", name: "古月方正", sprite: "fangzheng", x: 13, y: 14 },
    { id: "uncle", name: "舅舅古月冻土", sprite: "uncle", x: 24, y: 14 },
    { id: "aunt", name: "舅母", sprite: "aunt", x: 26, y: 14 },
    { id: "bed", name: "竹楼（家）", sprite: "", x: 5, y: 19 },
    { id: "merchant", name: "贾家商队", sprite: "merchant", x: 24, y: 20 },
    { id: "gatestone", name: "寨门石碑", sprite: "stele", x: 14, y: 11 },
    { id: "stele", name: "残破石碑", sprite: "stele", x: 3, y: 3 },
    { id: "remains", name: "花酒行者遗骸", sprite: "remains", x: 5, y: 2 },
    { id: "pdying", name: "垂死的正道蛊师", sprite: "rv", x: 6, y: 21, map: "pro" },
    { id: "pstele", name: "断崖石刻", sprite: "stele", x: 11, y: 12, map: "pro" },
    { id: "bstele", name: "三寨界碑", sprite: "stele", x: 2, y: 12, map: "east" },
    { id: "exitstele", name: "山口界碑", sprite: "stele", x: 14, y: 24, map: "east" },
  ];

  const OBJECTIVES = {
    "-3": "突围：击退围上来的正道蛊师",
    "-2": "登上山巅，直面正道盟主",
    "-1": "……",
    7: "第二章：去见族长古月博（红瓦大屋），领取狼潮功勋",
    8: "修炼至一转巅峰，回竹楼冲击二转（需 200 元石）",
    9: "已入二转，去见族长古月博",
    10: "第三章：从山寨东口前往东麓，击退白家蛊师",
    11: "击败北面林中的熊家蛊师熊林",
    12: "前往东北雪坡，迎战白家天才白凝冰",
    13: "第四章：三寨大战！回山寨北面山林，击退白熊联军",
    14: "执法家老守在山寨东口，击败他，杀出山寨",
    15: "经东麓南下，从山口离开青茅山",
    16: "青茅山篇完。之后可自由走动，随意逛逛",
  };
  ["去学堂（西北的白墙屋）找学堂家老，领取月光蛊", "在大路上拦下古月漠北、古月赤城，夺取元石", "出北门，去青茅山西北石壁的裂缝", "回山寨，向舅舅古月冻土讨回遗产", "去见族长古月博（红瓦大屋）", "狼潮：猎杀电狼", "前往东北狼窝，讨伐雷冠头狼"].forEach(function (t, i) { OBJECTIVES[i] = t; });

  function L(who, text) { return { who: who, text: text }; }
  const ME = "方源（心声）";
  const PME = "魔头方源（心声）";
  const OPENING = [
    L("旁白", "五百年后，魔头方源被正道群雄围杀。临死之际，他引动了春秋蝉。"),
    L("旁白", "光阴倒流。再睁眼，他回到了十五岁——青茅山，古月山寨，开窍大典。"),
    L(ME, "五百年的记忆都在。很好，这一世能少走些弯路。"),
    L("学堂家老", "古月方正，甲等资质！天佑我古月一族！"),
    L("族人", "甲等！方正少爷前途无量！"),
    L("学堂家老", "下一个，古月方源……丙等。"),
    L("族人", "丙等？还以为是什么天才，原来是个废物。"),
    L("古月方正", "哥哥……"),
    L(ME, "资质不过是起点。人心可以利用，元石可以抢，蛊虫可以炼。"),
    L("旁白", "【目标】去学堂（西北的白墙屋）找学堂家老，领取月光蛊。"),
  ];
  const ELDER_GIVE = [
    L("学堂家老", "丙等也是古月子弟。这只月光蛊，族里发给你，自己炼化。"),
    L("旁白", "方源以真元一遍遍冲刷蛊虫的意志……"),
    L(ME, "前世炼过的蛊数以万计。一只月光蛊，不值一提。"),
    L("旁白", "炼化成功！获得蛊虫「月光蛊」，月兰花瓣 x3。"),
    L("学堂家老", "月光蛊吃月兰花瓣。喂一次可用二十次，用尽了再喂，饿着就用不了。"),
    L(ME, "修炼要元石，养蛊也要元石。门口那两个刚领了元石的同窗……正合适。"),
    L("旁白", "【目标】在大路上拦下古月漠北、古月赤城，夺取元石。"),
  ];
  const STUDENTS_DONE = [
    L(ME, "几十块元石，杯水车薪。"),
    L(ME, "我记得——青茅山西北的石壁里，藏着花酒行者的遗藏。"),
    L("旁白", "【目标】出北门，前往青茅山西北石壁的裂缝。"),
  ];
  const CAVE_LOOT = [
    L("旁白", "洞穴深处，一具枯骨倚着石壁，身旁倒着一只酒葫芦。"),
    L("方源", "花酒行者，一代魔头，最后死在这种地方。"),
    L("方源", "也好。你的东西，我收下了。"),
    L("旁白", "获得蛊虫「酒虫」、元石 x80、竹叶青酒 x2，修为 +20！"),
    L(ME, "酒虫精炼真元，正好补上丙等资质的短板。下一步，拿回爹娘的家产。"),
    L("旁白", "【目标】回山寨，向舅舅古月冻土讨回父母遗产。"),
  ];
  const UNCLE_DEAL = [
    L("古月冻土", "哟，方源啊。你爹娘的酒楼和竹楼，舅舅替你打理得好好的。"),
    L("舅母", "一个丙等，要家产做什么？还不是糟蹋了。"),
    L("方源", "按族规，开了窍就算成年。家产，该还了。"),
    L("古月冻土", "你……小孩子懂什么！"),
    L("方源", "这些年酒楼的账，要不要拿到家老面前，一笔一笔算？"),
    L("古月冻土", "……好，好！元石给你，从此别再登门！"),
    L("旁白", "获得元石 x150。"),
    L(ME, "亲情？在元石面前，一文不值。"),
    L("旁白", "【目标】去见族长古月博。贾家商队出售白豕蛊、玉皮蛊。"),
  ];
  const CHIEF_TIDE = [
    L("族长古月博", "你来得正好。山中电狼成群，狼潮将至。"),
    L("族长古月博", "所有蛊师出寨猎狼，按斩杀记功，奖励元石。"),
    L(ME, "前世多少人死在这一波狼潮里。对我来说，是功勋，也是元石。"),
    L("旁白", "【目标】狼潮：猎杀电狼（豪电狼也算）3 只。"),
  ];
  const WOLVES_DONE = [
    L("旁白", "山中狼嚎震天——狼群之王「雷冠头狼」现身东北狼窝！"),
    L(ME, "杀了它，狼潮自破。顺便，让那些说我是废物的人闭嘴。"),
    L("旁白", "【目标】前往东北狼窝讨伐雷冠头狼。备好草药与元石。"),
  ];
  const CH1_END = [
    L("旁白", "雷冠头狼轰然倒地，狼潮退去。"),
    L("旁白", "族人围着方源欢呼，方正远远看着哥哥的背影，说不出话。"),
    L(ME, "他们的欢呼，与我无关。青茅山只是起点。"),
    L("旁白", "【第一章 完】"),
    L("旁白", "【第二章 · 二转】【目标】去见族长古月博，领取狼潮功勋。"),
  ];
  const CH2_REWARD = [
    L("族长古月博", "方源，狼王是你斩的。这两百块元石，是族里的赏赐。"),
    L("族长古月博", "你虽是丙等，若能冲上二转，族中自有你的位置。"),
    L(ME, "二转……空窍里的真元已经满溢，只差元石堆上去。"),
    L("旁白", "获得元石 x200。【目标】修炼至一转巅峰，回竹楼冲击二转（需 200 元石）。"),
  ];
  const BREAK_LINES = [
    L("旁白", "方源以元石冲击空窍壁障……青铜真元一点点化为赤铁。"),
    L("旁白", "突破成功！修为踏入二转初阶，生命、真元、攻防大涨。"),
    L(ME, "月光蛊吞了狼王的血气，已经蜕变。血月蛊，正合我意。"),
    L("旁白", "获得蛊虫「血月蛊」（喂一次可用 20 次）。贾家商队新到了「生机叶」。"),
    L("旁白", "【目标】去见族长古月博。"),
  ];
  const CH3_CALL = [
    L("族长古月博", "二转了？好。东麓那边，白家寨的人屡屡越界，熊家寨也在暗中窥伺。"),
    L("族长古月博", "你去三寨交界走一趟，把白家的探子打回去。"),
    L(ME, "三寨相争，正好浑水摸鱼。"),
    L("旁白", "【第二章 完】东麓山道已开放（山寨最东边的路口）。"),
    L("旁白", "【第三章 · 东麓风云】【目标】前往青茅山东麓，击退白家蛊师（0/3）。"),
  ];
  const BAI_DONE = [
    L("白家蛊师", "古月家的……你等着！我们白家的白凝冰不会放过你！"),
    L("旁白", "北边林中传来熊吼，熊家寨的熊林带着驯熊拦住了去路。"),
    L("熊林", "古月的小子，这片林子是我熊家的！"),
    L("旁白", "【目标】击败北面林中的熊家蛊师熊林。"),
  ];
  const XIONG_DONE = [
    L("熊林", "你……区区一个丙等……"),
    L("旁白", "获得蛊虫「熊力蛊」（喂一次可用 20 次）。"),
    L("旁白", "东北雪坡寒气骤起，白凝冰立在冰雪之中。他一身白衣，眼神冷得像冰。"),
    L("白凝冰", "你就是那个斩了狼王的古月方源？有趣。"),
    L("白凝冰", "我生来北冥冰魄体，活不长久。在死之前，总得找点乐子。"),
    L("旁白", "【目标】前往东北雪坡，迎战白家天才白凝冰。"),
  ];
  const BNB_DONE = [
    L("白凝冰", "哈……哈哈！痛快！方源，你和我是同一种人。"),
    L("方源", "也许。但我不会把命浪费在乐子上。"),
    L("白凝冰", "下次见面，我会杀了你。"),
    L("旁白", "白凝冰化作一道寒光遁走。远处，古月山寨方向火光冲天。"),
    L("旁白", "白、熊两家联军攻打古月山寨，三寨大战爆发！【第三章 完】"),
    L("旁白", "【第四章 · 三寨大战】【目标】回到山寨北面山林，击退白熊联军（0/4）。"),
  ];
  const WAR_DONE = [
    L("旁白", "联军退去，山寨满目疮痍。"),
    L("族长古月博", "方源，家老们在你竹楼里搜出了花酒行者的遗物，还有来路不明的元石。"),
    L("族长古月博", "私藏魔道传承，劫掠同族……古月一族容不下你。拿下他！"),
    L(ME, "早晚的事。青茅山，本来就困不住我。"),
    L("旁白", "【目标】执法家老守在山寨东口，击败他，杀出山寨。"),
  ];
  const ENF_DONE = [
    L("古月执法家老", "你……你这魔头……"),
    L("古月方正", "哥哥！你真的要走？"),
    L("方源", "方正，好好活着。下次见面，我们或许就是敌人了。"),
    L("旁白", "【目标】经东麓南下，从山口离开青茅山。"),
  ];
  const FINAL_LINES = [
    L("旁白", "山口的风很冷。方源回头望了一眼，古月山寨的灯火渐渐模糊。"),
    L(ME, "青茅山，到此为止。前面是南疆，是更大的天地。"),
    L(ME, "永生之路，我一个人走。"),
    L("旁白", "—— 青茅山篇 · 完 ——"),
    L("旁白", "感谢游玩。之后可以自由走动，山寨和东麓随意逛。"),
  ];
  const PRO_INTRO = [
    L("旁白", "【序章 · 魔尊末路】五百年后，南疆。"),
    L("旁白", "魔头方源身陷正道群雄重围，满山都是追杀他的蛊师。"),
    L("正道蛊师", "魔头方源！今日便是你的死期！"),
    L(PME, "五百年……兜兜转转，还是走到了这一步。"),
    L(PME, "也罢。我还有春秋蝉。"),
    L("旁白", "【目标】突围：击退围上来的正道蛊师（0/3）。蛊囊里是前世的强力蛊虫。"),
  ];
  const PRO_MID = [
    L("旁白", "山巅之上金光万丈，正道盟主亲自出手。"),
    L("正道盟主", "方源，你杀孽滔天，今日天下正道共诛之！"),
    L("魔头方源", "天下正道？不过是一群更会说漂亮话的强盗。"),
    L("旁白", "【目标】登上山巅，直面正道盟主。"),
  ];
  const PRO_END = [
    L("正道盟主", "束手就擒吧，魔头！"),
    L("魔头方源", "哈……想拿我的人头去换名声？"),
    L("魔头方源", "五百年前我一无所有，五百年后，我也不必给你们留下什么。"),
    L("旁白", "方源引爆全身空窍，血光吞没了半座山峰。"),
    L("旁白", "自爆的余波里，一只灰白的蝉振翅而起。春秋蝉，逆转光阴。"),
    L(PME, "春秋蝉……再来一次。"),
    L("旁白", "【序章 完】"),
  ];
  const REBIRTH = [L("旁白", "光阴长河倒卷。再睁眼，他回到了十五岁：青茅山，古月山寨，开窍大典。")].concat(OPENING.slice(2));
  const FULL_FOOD = { herb: 4, petal: 3, liquor: 2, meat: 3, jadebits: 2 };
  const CHAPTERS = [
    { title: "序章 · 魔尊末路", hero: { map: "pro", rank: 8, stones: 300, x: 4, y: 21, dir: "right", stage: -3, gu: { xuehai: 20, bloodmoon: 20, jade: 20, life: 20 }, bag: { herb: 3, petal: 2, liquor: 2, jadebits: 2 } }, intro: PRO_INTRO },
    { title: "第一章 · 开窍狼潮", hero: {}, intro: OPENING },
    { title: "第二章 · 二转", hero: { stage: 7, rank: 3, stones: 240, x: 11, y: 15, kills: 30, beaten: ["mobei", "chicheng"], gu: { moon: 20, wine: 20, pig: 20, jade: 20 }, bag: FULL_FOOD }, intro: [L("旁白", "【第二章 · 二转】狼潮已平，方源斩杀雷冠头狼，名动古月山寨。"), L(ME, "名声无用，元石才有用。"), L("旁白", "【目标】去见族长古月博（红瓦大屋），领取狼潮功勋。")] },
    { title: "第三章 · 东麓风云", hero: { stage: 10, rank: 5, stones: 220, x: 29, y: 15, kills: 50, beaten: ["mobei", "chicheng"], gu: { bloodmoon: 20, moon: 20, wine: 20, pig: 20, jade: 20, life: 20 }, bag: { herb: 5, petal: 3, liquor: 2, meat: 3, jadebits: 2 } }, intro: [L("旁白", "【第三章 · 东麓风云】方源已入二转。族长命他前往东麓三寨交界，驱逐白家探子。"), L(ME, "白家、熊家、古月……三寨相争，正好浑水摸鱼。"), L("旁白", "【目标】往东走出山寨东口，到东麓击退白家蛊师（0/3）。")] },
    { title: "第四章 · 三寨大战", hero: { stage: 13, rank: 6, stones: 300, x: 15, y: 12, kills: 70, beaten: ["mobei", "chicheng"], gu: { bloodmoon: 20, moon: 20, bear: 20, wine: 20, pig: 20, jade: 20, life: 20 }, bag: { herb: 6, petal: 3, liquor: 2, meat: 3, jadebits: 2 } }, intro: [L("旁白", "【第四章 · 三寨大战】方源在东麓击退白凝冰，白、熊两家联军却趁势攻打古月山寨。"), L("旁白", "【目标】出北门，在山林里击退白熊联军（0/4）。")] },
  ];

  function createEnemies() {
    function mk(id, kind, x, y, once, minStage, maxStage, map) {
      return { id: id, kind: kind, x: x, y: y, homeX: x, homeY: y, alive: true, respawn: 0, once: once, minStage: minStage, maxStage: maxStage, map: map || "main" };
    }
    return [
      mk("b1", "boar", 9, 8, false, 0, 99), mk("b2", "boar", 13, 8, false, 0, 99), mk("b3", "boar", 19, 8, false, 0, 99), mk("b4", "boar", 4, 9, false, 0, 99),
      mk("w1", "wolf", 13, 3, false, 0, 99), mk("w2", "wolf", 18, 2, false, 0, 99), mk("w3", "wolf", 20, 5, false, 0, 99), mk("w4", "wolf", 13, 5, false, 0, 99), mk("w5", "wolf", 24, 8, false, 0, 99),
      mk("bw1", "bigwolf", 24, 3, false, 0, 99), mk("bw2", "bigwolf", 29, 4, false, 0, 99),
      mk("mobei", "mobei", 7, 15, true, 1, 1), mk("chicheng", "chicheng", 9, 15, true, 1, 1), mk("boss", "boss", 27, 2, true, 6, 6),
      mk("p1", "rv", 12, 20, true, -3, -3, "pro"), mk("p2", "rv", 20, 17, true, -3, -3, "pro"), mk("p3", "rvelite", 17, 13, true, -3, -3, "pro"), mk("p4", "rv", 12, 10, true, -3, -3, "pro"), mk("pboss", "rvboss", 16, 3, true, -2, -2, "pro"),
      mk("e_b1", "bear", 5, 6, false, 10, 99, "east"), mk("e_b2", "bear", 11, 8, false, 10, 99, "east"), mk("e_b3", "bear", 3, 10, false, 10, 99, "east"),
      mk("e_i1", "icewolf", 20, 5, false, 10, 99, "east"), mk("e_i2", "icewolf", 27, 4, false, 10, 99, "east"),
      mk("e_g1", "baiguard", 19, 12, true, 10, 10, "east"), mk("e_g2", "baiguard", 24, 13, true, 10, 10, "east"), mk("e_g3", "baiguard", 27, 8, true, 10, 10, "east"),
      mk("e_xl", "xionglin", 8, 3, true, 11, 11, "east"), mk("e_bnb", "bnb", 22, 3, true, 12, 12, "east"),
      mk("e_bat1", "bat", 12, 18, false, 13, 99, "east"), mk("e_bat2", "bat", 18, 20, false, 13, 99, "east"),
      mk("war1", "baiguard", 6, 8, true, 13, 13), mk("war2", "baiguard", 20, 8, true, 13, 13), mk("war3", "bear", 11, 7, true, 13, 13), mk("war4", "bat", 12, 9, true, 13, 13), mk("war5", "bat", 27, 9, true, 13, 13),
      mk("enf", "enforcer", 30, 15, true, 14, 14),
    ];
  }
  function createHero() {
    return {
      rank: 0, exp: 0, hp: maxHpOf(0), zy: maxZyOf(0), stones: 10, x: 15, y: 16, dir: "down",
      steps: 0, kills: 0, stage: 0, wolfKills: 0, beaten: [], gu: {}, bag: { herb: 2 }, lastPick: -99, map: "main",
    };
  }

  const SAVE_KEY = "guzhenren-qingmao-save-v1";
  const state = {
    mode: "title",
    hero: null,
    enemies: [],
    battle: null,
    dialogue: null,
    typed: 0,
    toast: "按住十字键移动，靠近人物按 A 互动。",
    pressedDir: null,
    atlasReady: 0,
  };
  const atlasImg = new Image();
  let tiles = null;
  let spriteCache = null;
  let tick = 0;
  let anim = { fx: 15, fy: 16, tx: 15, ty: 16, t0: -100 };
  let fadeRef = 0;
  let veil = null;
  const fx = { shake: 0, lunge: 0, elunge: 0, flash: 0, glow: 0, blade: 0, slash: 0, floatText: "", floatColor: "#fff", floatAge: 0 };
  let holdTimer = null;
  let typeTimer = null;
  let lastKey = "";
  let actionToken = 0;
  let saveFlashUntil = 0;
  let saveFlashTimer = 0;
  let loopOn = false;
  const flashCanvas = document.createElement("canvas");
  flashCanvas.width = 128;
  flashCanvas.height = 128;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function delta(d) {
    if (d === "up") return { dx: 0, dy: -1 };
    if (d === "down") return { dx: 0, dy: 1 };
    if (d === "left") return { dx: -1, dy: 0 };
    return { dx: 1, dy: 0 };
  }
  function tileAt(x, y) {
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return "M";
    const row = (MAPS[CUR_MAP_ID] || RAW_MAP)[y] || "";
    return row.charAt(x) || "M";
  }
  function walkable(x, y, stage) {
    const ch = tileAt(x, y);
    if (ch === "X") return stage >= 2;
    if (ch === "E") return stage >= 10;
    if (ch === "O") return stage >= 15;
    return ch === "q" || ch === "p" || ch === "c" || ch === "s" || ch === "f" || ch === "w" || ch === "<";
  }
  function zoneName(x, y) {
    if (CUR_MAP_ID === "pro") return "南疆 · 五百年后";
    if (CUR_MAP_ID === "east") return y <= 11 ? (x >= 17 ? "白家雪坡" : "熊家林地") : "青茅山东麓";
    if (y <= 6 && x <= 10) return "花酒洞窟";
    if (y <= 6 && x >= 22) return "狼窝";
    if (y <= 9) return "青茅山";
    return "古月山寨";
  }
  function activeNpcs(stage) {
    return NPCS.filter(function (n) {
      return (n.map || "main") === CUR_MAP_ID && stage >= (n.minS === undefined ? -99 : n.minS) && stage <= (n.maxS === undefined ? 999 : n.maxS);
    });
  }
  function enemyActive(e, stage) {
    return e.alive && stage >= e.minStage && stage <= e.maxStage && (e.map || "main") === CUR_MAP_ID;
  }
  function objectiveText() {
    const h = state.hero;
    if (!h) return "";
    let s = OBJECTIVES[h.stage] || "";
    if (h.stage === 5 || h.stage === -3 || h.stage === 10) s += "（" + h.wolfKills + "/3）";
    else if (h.stage === 13) s += "（" + h.wolfKills + "/4）";
    else if (h.stage === 1) s += "（" + h.beaten.length + "/2）";
    return s;
  }
  function resetFx() {
    fx.shake = 0; fx.lunge = 0; fx.elunge = 0; fx.flash = 0; fx.glow = 0; fx.blade = 0; fx.slash = 0;
    fx.floatText = ""; fx.floatColor = "#fff"; fx.floatAge = 0;
  }
  function floatText(text, color) { fx.floatText = text; fx.floatColor = color; fx.floatAge = 40; }

  function saveGame(reason) {
    if (!state.hero || state.mode === "title") return;
    try {
      const data = {
        v: 1,
        reason: reason || "timer",
        savedAt: Date.now(),
        mode: state.mode,
        hero: state.hero,
        enemies: state.enemies,
        battle: state.mode === "battle" ? state.battle : null,
        dialogue: state.mode === "dialogue" ? state.dialogue : null,
        toast: state.toast,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      saveFlashUntil = Date.now() + 1200;
      const el = document.getElementById("save-flag");
      if (el) el.classList.add("on");
      clearTimeout(saveFlashTimer);
      saveFlashTimer = setTimeout(function () {
        const e = document.getElementById("save-flag");
        if (e && Date.now() >= saveFlashUntil) e.classList.remove("on");
      }, 1250);
    } catch (err) { /* private mode or full storage */ }
  }
  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || data.v !== 1 || !data.hero || !data.hero.map) return null;
      return data;
    } catch (err) { return null; }
  }
  function saveBlurb(data) {
    const h = data.hero;
    const mapName = h.map === "pro" ? "序章" : h.map === "east" ? "东麓" : "山寨";
    return (RANKS[h.rank] || "") + " · " + mapName + " · " + (OBJECTIVES[h.stage] || "自由行动");
  }
  function chapterSummary(i) {
    const base = createHero();
    const src = CHAPTERS[i].hero || {};
    const h = Object.assign({}, base, src);
    if (src.gu) h.gu = src.gu;
    const names = GU_ORDER.filter(function (id) { return h.gu[id] !== undefined; }).map(function (id) { return GU_INFO[id].name; });
    return RANKS[h.rank] + " · 元石 " + h.stones + " · " + (names.length ? names.join("、") : "尚无蛊虫");
  }

  function makeCanvas16(base, layers) {
    const c = document.createElement("canvas");
    c.width = 16; c.height = 16;
    const ctx = c.getContext("2d");
    if (!ctx) return c;
    if (base) { ctx.fillStyle = PAL[base] || "#000"; ctx.fillRect(0, 0, 16, 16); }
    layers.forEach(function (layer) {
      for (let y = 0; y < 16; y++) {
        const row = layer.rows[y] || "";
        for (let x = 0; x < 16; x++) {
          let ch = row.charAt(x);
          if (!ch || ch === ".") continue;
          if (layer.swap && layer.swap[ch]) ch = layer.swap[ch];
          const col = PAL[ch];
          if (!col) continue;
          ctx.fillStyle = col;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });
    return c;
  }
  function buildTiles() {
    const caveSwap = { e: "u", E: "X", w: "p" };
    return {
      q: makeCanvas16("q", [{ rows: GRASS }]),
      H: makeCanvas16("q", [{ rows: GRASS }]),
      f: makeCanvas16("q", [{ rows: GRASS }, { rows: FLOWERS }]),
      b: makeCanvas16("q", [{ rows: GRASS }, { rows: BAMBOO }]),
      Y: makeCanvas16("q", [{ rows: GRASS }, { rows: TREE }]),
      p: makeCanvas16("n", [{ rows: PATH }]),
      E: makeCanvas16("n", [{ rows: PATH }]),
      "<": makeCanvas16("n", [{ rows: PATH }]),
      O: makeCanvas16("n", [{ rows: PATH }]),
      w: makeCanvas16("m", [{ rows: GRASS, swap: { Q: "i", L: "e" } }]),
      s: makeCanvas16("j", [{ rows: PATH, swap: { N: "J", o: "e" } }]),
      c: makeCanvas16("x", [{ rows: PATH, swap: { N: "X", o: "u" } }]),
      M: makeCanvas16(null, [{ rows: ROCK }]),
      C: makeCanvas16(null, [{ rows: ROCK, swap: caveSwap }]),
      X: makeCanvas16(null, [{ rows: ROCK, swap: caveSwap }, { rows: CRACK }]),
      "#": makeCanvas16("q", [{ rows: GRASS }, { rows: PALISADE }]),
      roof: makeCanvas16(null, [{ rows: ROOF }]),
      wall: makeCanvas16(null, [{ rows: WALL }]),
    };
  }
  function buildSprites() {
    return {
      hero_down: makeCanvas16(null, [{ rows: HERO_DOWN }]),
      hero_up: makeCanvas16(null, [{ rows: HERO_UP }]),
      hero: makeCanvas16(null, [{ rows: HERO_DOWN }]),
      fangzheng: makeCanvas16(null, [{ rows: HERO_DOWN, swap: { g: "b", G: "B" } }]),
      elder: makeCanvas16(null, [{ rows: HERO_DOWN, swap: { h: "e", g: "p", G: "X" } }]),
      chief: makeCanvas16(null, [{ rows: HERO_DOWN, swap: { h: "w", g: "R", G: "k" } }]),
      uncle: makeCanvas16(null, [{ rows: HERO_DOWN, swap: { g: "o", G: "O" } }]),
      aunt: makeCanvas16(null, [{ rows: HERO_DOWN, swap: { g: "P", G: "K" } }]),
      merchant: makeCanvas16(null, [{ rows: HERO_DOWN, swap: { g: "y", G: "o", h: "O" } }]),
      mobei: makeCanvas16(null, [{ rows: HERO_DOWN, swap: { g: "E", G: "J" } }]),
      chicheng: makeCanvas16(null, [{ rows: HERO_DOWN, swap: { g: "r", G: "R", h: "R" } }]),
      boar: makeCanvas16(null, [{ rows: BOAR }]),
      wolf: makeCanvas16(null, [{ rows: WOLF }]),
      bigwolf: makeCanvas16(null, [{ rows: WOLF, swap: { e: "j", E: "J" } }]),
      boss: makeCanvas16(null, [{ rows: WOLF, swap: { e: "b", E: "B", w: "y", c: "y" } }, { rows: CROWN }]),
      remains: makeCanvas16(null, [{ rows: REMAINS }]),
      stele: makeCanvas16(null, [{ rows: STELE }]),
      blade: makeCanvas16(null, [{ rows: BLADE }]),
      rv: makeCanvas16(null, [{ rows: HERO_DOWN, swap: { g: "e", G: "B", h: "w" } }]),
      baiguard: makeCanvas16(null, [{ rows: HERO_DOWN, swap: { g: "e", G: "b", h: "w" } }]),
      bnb: makeCanvas16(null, [{ rows: HERO_DOWN, swap: { g: "w", G: "e", h: "w" } }]),
      xionglin: makeCanvas16(null, [{ rows: HERO_DOWN, swap: { g: "o", G: "O", h: "O" } }]),
      enforcer: makeCanvas16(null, [{ rows: HERO_DOWN, swap: { h: "e", g: "y", G: "o" } }]),
      bear: makeCanvas16(null, [{ rows: WOLF, swap: { e: "o", E: "O", w: "y" } }]),
      icewolf: makeCanvas16(null, [{ rows: WOLF, swap: { e: "i", E: "b", c: "c" } }]),
      bat: makeCanvas16(null, [{ rows: WOLF, swap: { e: "r", E: "R" } }]),
      rvelite: makeCanvas16(null, [{ rows: HERO_DOWN, swap: { g: "e", G: "B", h: "y" } }]),
      rvboss: makeCanvas16(null, [{ rows: HERO_DOWN, swap: { g: "y", G: "o", h: "w" } }]),
    };
  }
  function sprites() { if (!spriteCache) spriteCache = buildSprites(); return spriteCache; }

  function drawPart(ctx, atlas, rect, fallback, dx, dy, scale, flip) {
    let src = null, sx = 0, sy = 0, sw = 16, sh = 16, w = 16, h = 16;
    if (atlas && atlas.naturalWidth && rect) {
      const k = atlas.naturalWidth / ATLAS_W;
      src = atlas; sx = rect[0] * k; sy = rect[1] * k; sw = rect[2] * k; sh = rect[3] * k; w = rect[2]; h = rect[3];
    } else if (fallback) src = fallback;
    if (!src) return;
    const W = w * scale, H = h * scale, x = Math.round(dx), y = Math.round(dy);
    if (flip) {
      ctx.save(); ctx.translate(x + W, y); ctx.scale(-1, 1);
      ctx.drawImage(src, sx, sy, sw, sh, 0, 0, W, H); ctx.restore();
    } else ctx.drawImage(src, sx, sy, sw, sh, x, y, W, H);
  }
  function enemyRect(kind, frame, inBattle) {
    if (inBattle && kind === "bnb") return AT.bnbbig;
    const r = AT[kind];
    if (!r) return undefined;
    if (kind === "wolf" || kind === "bigwolf" || kind === "boss") return [r[0] + (frame % 4) * 32, r[1], 32, 32];
    if (BIG32.indexOf(kind) >= 0) return r;
    if (kind === "boar") return [r[0] + (frame % 2) * 16, r[1], 16, 16];
    return [r[0], r[1] + (frame % 2) * 16, 16, 16];
  }
  function enemySize(kind, atlas, inBattle) {
    if (!atlas || !atlas.naturalWidth) return 16;
    if (inBattle && kind === "bnb") return 32;
    return BIG32.indexOf(kind) >= 0 ? 32 : 16;
  }
  const spanCache = {};
  /** Opaque rows of every battle frame, so a tall sprite can be fitted without clipping its head. */
  function battleSpan(kind, atlas) {
    const key = kind + ":" + (atlas && atlas.naturalWidth ? atlas.naturalWidth : 0);
    if (spanCache[key]) return spanCache[key];
    let top = 0;
    let bottom = 15;
    if (atlas && atlas.naturalWidth) {
      let found = false;
      top = 999;
      bottom = -1;
      const sample = document.createElement("canvas");
      const sctx = sample.getContext("2d", { willReadFrequently: true });
      const k = atlas.naturalWidth / ATLAS_W;
      for (let f = 0; f < 4; f++) {
        const rect = enemyRect(kind, f, true);
        if (!rect || !sctx) continue;
        sample.width = rect[2];
        sample.height = rect[3];
        sctx.clearRect(0, 0, rect[2], rect[3]);
        sctx.drawImage(atlas, rect[0] * k, rect[1] * k, rect[2] * k, rect[3] * k, 0, 0, rect[2], rect[3]);
        const data = sctx.getImageData(0, 0, rect[2], rect[3]).data;
        for (let y = 0; y < rect[3]; y++) {
          for (let x = 0; x < rect[2]; x++) {
            if (data[(y * rect[2] + x) * 4 + 3] > 16) {
              if (y < top) top = y;
              if (y > bottom) bottom = y;
              found = true;
              break;
            }
          }
        }
      }
      if (!found) { top = 0; bottom = 15; }
    }
    spanCache[key] = { top: top, bottom: bottom };
    return spanCache[key];
  }
  function drawBackdrop(ctx, scene, now) {
    const skies = {
      village: ["#41a6f6", "#73c4f8", "#a6dcfa", "#cdeefc"],
      forest: ["#5d275d", "#b13e53", "#ef7d57", "#ffcd75"],
      night: ["#0d0b1a", "#1a1c2c", "#29366f", "#3b5dc9"],
    };
    const bands = skies[scene];
    for (let i = 0; i < 4; i++) { ctx.fillStyle = bands[i]; ctx.fillRect(0, i * 14, CW, 14); }
    if (scene === "night") {
      ctx.fillStyle = "#dff6ff"; ctx.fillRect(142, 8, 10, 12); ctx.fillRect(140, 10, 14, 8);
      ctx.fillStyle = "#0d0b1a"; ctx.fillRect(146, 7, 9, 9);
      ctx.fillStyle = "#f4f4f4";
      for (let i = 0; i < 9; i++) if ((Math.floor(now / 30) + i) % 3 !== 0) ctx.fillRect((i * 37) % CW, (i * 11) % 40, 1, 1);
    }
    ctx.fillStyle = scene === "night" ? "#1a1c2c" : scene === "forest" ? "#3b2f4f" : "#566c86";
    for (let x = 0; x < CW; x += 4) {
      const h = 14 + Math.round(Math.abs(Math.sin(x * 0.045)) * 16 + Math.abs(Math.sin(x * 0.11)) * 6);
      ctx.fillRect(x, 64 - h, 4, h);
    }
    ctx.fillStyle = scene === "village" ? "#c9a16b" : scene === "forest" ? "#4f8f3a" : "#4b566a";
    ctx.fillRect(0, 64, CW, CH - 64);
    ctx.fillStyle = scene === "village" ? "#a87d4b" : scene === "forest" ? "#36692a" : "#2b3343";
    for (let i = 0; i < 14; i++) ctx.fillRect((i * 29) % CW, 70 + ((i * 13) % 70), 3, 1);
    if (scene === "forest") {
      ctx.fillStyle = "#36692a";
      for (let i = 0; i < 6; i++) {
        const bx = 6 + i * 31;
        ctx.fillRect(bx, 20, 3, 46);
        for (let ny = 24; ny < 64; ny += 9) ctx.fillRect(bx - 1, ny, 5, 1);
      }
    }
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(88, 92, 72, 5); ctx.fillRect(94, 97, 60, 2); ctx.fillRect(10, 132, 60, 5); ctx.fillRect(16, 137, 48, 2);
  }

  function findAdjacent(h) {
    function check(px, py) {
      const npc = activeNpcs(h.stage).find(function (n) { return n.x === px && n.y === py; });
      if (npc) return { npc: npc };
      const enemy = state.enemies.find(function (en) { return enemyActive(en, h.stage) && en.x === px && en.y === py; });
      if (enemy) return { enemy: enemy };
      return null;
    }
    const d = delta(h.dir);
    const front = check(h.x + d.dx, h.y + d.dy);
    if (front) return front;
    const dirs = ["up", "down", "left", "right"];
    for (let i = 0; i < dirs.length; i++) {
      const dd = delta(dirs[i]);
      const r = check(h.x + dd.dx, h.y + dd.dy);
      if (r) return r;
    }
    return {};
  }

  function stopHold() {
    if (holdTimer !== null) { clearInterval(holdTimer); holdTimer = null; }
    state.pressedDir = null;
    document.querySelectorAll("[data-dir]").forEach(function (b) { b.classList.remove("down"); });
  }
  function startHold(d, e) {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.currentTarget && e.currentTarget.setPointerCapture && e.pointerId !== undefined) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
    stopHold();
    state.pressedDir = d;
    document.querySelectorAll("[data-dir]").forEach(function (b) { b.classList.toggle("down", b.dataset.dir === d); });
    moveHero(d);
    holdTimer = setInterval(function () {
      if (state.mode === "explore") moveHero(d);
      else stopHold();
    }, 160);
  }

  function setHero(h) { state.hero = h; CUR_MAP_ID = h.map || "main"; }

  function openDialogue(lines, after) {
    stopHold();
    state.dialogue = { lines: lines, index: 0, after: after || "explore" };
    state.mode = "dialogue";
    refresh();
  }
  function startChapter(ch, introOverride) {
    stopHold();
    const p = CHAPTERS[ch] || CHAPTERS[1];
    const base = createHero();
    const merged = Object.assign({}, base, p.hero || {});
    const h2 = Object.assign({}, merged, {
      hp: maxHpOf(merged.rank),
      zy: maxZyOf(merged.rank),
      gu: Object.assign({}, merged.gu),
      bag: Object.assign({}, merged.bag),
      beaten: (merged.beaten || []).slice(),
    });
    CUR_MAP_ID = h2.map;
    anim = { fx: h2.x, fy: h2.y, tx: h2.x, ty: h2.y, t0: -100 };
    fadeRef = 60;
    veil = null;
    resetFx();
    setHero(h2);
    state.enemies = createEnemies();
    state.battle = null;
    state.toast = "按住十字键移动，靠近人物按 A 互动，B 打开蛊囊。";
    state.dialogue = { lines: introOverride || p.intro, index: 0, after: "explore" };
    state.mode = "dialogue";
    saveGame("chapter");
    refresh();
  }
  function startBattle(e) {
    stopHold();
    const tpl = ENEMY_TPL[e.kind];
    resetFx();
    const logs = [];
    if (e.kind === "mobei") { logs.push("古月漠北：丙等废物，挡什么路？"); logs.push("方源：元石，交出来。"); }
    else if (e.kind === "chicheng") { logs.push("古月赤城：你想抢我？就凭你？"); logs.push("方源：就凭我。"); }
    else if (e.kind === "boss") { logs.push("雷冠头狼仰天长啸，头顶雷光炸裂！"); logs.push("方源：畜生而已。"); }
    else if (BATTLE_INTRO[e.kind]) BATTLE_INTRO[e.kind].forEach(function (line) { logs.push(line); });
    else logs.push("遭遇 " + tpl.name + "！");
    state.battle = {
      mapEnemyId: e.id, kind: e.kind, name: tpl.name, hp: tpl.maxHp, maxHp: tpl.maxHp, atk: tpl.atk, def: tpl.def,
      exp: tpl.exp, stones: tpl.stones, drop: tpl.drop, dropRate: tpl.dropRate, turn: 1, charging: false,
      pigTurns: 0, jadeTurns: 0, wineBoost: false, sub: "main", logs: logs, busy: false, awaiting: null, ending: null,
    };
    state.mode = "battle";
    refresh();
  }

  function talkTo(npc) {
    const h = state.hero;
    const st = h.stage;
    const stageBefore = st;
    if (npc.id === "pdying") {
      openDialogue([
        L("垂死的正道蛊师", "魔头……你杀了我师父，杀了我师兄……你不得好死……"),
        L("魔头方源", "好死不如赖活。可惜，今天我两样都不打算选。"),
        L(PME, "正道盟主就在山巅。春秋蝉在空窍里微微颤动，时候快到了。"),
      ]);
      return;
    }
    if (npc.id === "pstele") {
      openDialogue([L("断崖石刻", "「人是万物之灵，蛊是天地真精。」"), L(PME, "五百年来，我只信一件事：活下去，才有一切。")]);
      return;
    }
    if (npc.id === "bstele") { openDialogue([L("三寨界碑", "西：古月山寨　北：熊家寨林地　东北：白家寨雪坡　南：出山山口")]); return; }
    if (npc.id === "exitstele") {
      openDialogue(st >= 15
        ? [L("山口界碑", "出此山口，便离开青茅山地界。"), L(ME, "往南走就是了。")]
        : [L("山口界碑", "出此山口，便离开青茅山地界。"), L(ME, "还不是走的时候。")]);
      return;
    }
    if (npc.id === "chief" && st >= 7) {
      if (st === 7) { setHero(Object.assign({}, h, { stage: 8, stones: h.stones + 200 })); openDialogue(CH2_REWARD); }
      else if (st === 8) openDialogue([L("族长古月博", h.rank >= 3 ? "一转巅峰了？回竹楼，用元石冲击二转。" : "先把修为练到一转巅峰，再谈二转。")]);
      else if (st === 9) { setHero(Object.assign({}, h, { stage: 10, wolfKills: 0 })); openDialogue(CH3_CALL); }
      else if (st <= 12) openDialogue([L("族长古月博", "东麓那边办得如何？白家的白凝冰，不好对付。")]);
      else if (st === 13) openDialogue([L("族长古月博", "白熊联军就在北门外的山林里！古月子弟，随我迎敌！")]);
      else if (st === 14) openDialogue([L("族长古月博", "执法家老已守在东口。方源，你走不掉的。")]);
      else openDialogue([L("族长古月博", "……古月一族，从此再无方源。")]);
      if (state.hero.stage !== stageBefore) saveGame("story");
      return;
    }
    if (npc.id === "elder") {
      if (st === 0) {
        const bag = Object.assign({}, h.bag, { petal: (h.bag.petal || 0) + 3 });
        setHero(Object.assign({}, h, { stage: 1, gu: Object.assign({}, h.gu, { moon: GU_MAX }), bag: bag }));
        openDialogue(ELDER_GIVE);
      } else if (st >= 5) openDialogue([L("学堂家老", "狼潮之中，活下来的，才配谈资质。")]);
      else openDialogue([L("学堂家老", "蛊虫喂一次可用二十次，用尽了再喂。月兰花田里可以采花瓣。"), L(ME, "这些我比你清楚。")]);
      if (state.hero.stage !== stageBefore) saveGame("story");
      return;
    }
    if (npc.id === "chief") {
      if (st === 4) { setHero(Object.assign({}, h, { stage: 5, wolfKills: 0 })); openDialogue(CHIEF_TIDE); }
      else if (st === 5) openDialogue([L("族长古月博", "电狼还差 " + Math.max(0, 3 - h.wolfKills) + " 只。北门外的青茅山里到处都是。")]);
      else if (st === 6) openDialogue([L("族长古月博", "雷冠头狼就在东北狼窝！拿下它，你就是古月的功臣。")]);
      else openDialogue([L("族长古月博", "开窍只是开始。古月一族，需要能战之人。"), L(ME, "能战之人？你们需要的，是听话的人。")]);
      if (state.hero.stage !== stageBefore) saveGame("story");
      return;
    }
    if (npc.id === "fangzheng") {
      if (st <= 2) openDialogue([L("古月方正", "哥哥，丙等也没关系，以后我来保护你！"), L("方源", "保护我？先保住你自己。")]);
      else openDialogue([L("古月方正", "哥哥……你最近变得好陌生。"), L("方源", "我一直是这样，只是你从没看清。")]);
      return;
    }
    if (npc.id === "uncle") {
      if (st === 3) { setHero(Object.assign({}, h, { stage: 4, stones: h.stones + 150 })); openDialogue(UNCLE_DEAL); }
      else if (st > 3) openDialogue([L("古月冻土", "……你还想怎样？"), L("方源", "没什么。只是看看你还睡不睡得着。")]);
      else openDialogue([L("古月冻土", "一个丙等，来舅舅这儿做什么？去去去，别耽误生意。")]);
      if (state.hero.stage !== stageBefore) saveGame("story");
      return;
    }
    if (npc.id === "aunt") {
      if (st > 3) openDialogue([L("舅母", "哼，白眼狼！"), L("方源", "过奖。")]);
      else openDialogue([L("舅母", "你弟弟是甲等，你呢？丙等就该老老实实听话。")]);
      return;
    }
    if (npc.id === "bed") { stopHold(); state.mode = "home"; refresh(); return; }
    if (npc.id === "merchant") { openDialogue([L("贾家商队", "客官，草药、蛊粮、蛊虫都有，元石说话。")], "shop"); return; }
    if (npc.id === "gatestone") { openDialogue([L("寨门石碑", "北出寨门即青茅山。西北石壁、东北狼窝，凶险，慎入。")]); return; }
    if (npc.id === "stele") {
      openDialogue([L("残破石碑", "「一生好酒，一生行魔。后来者得我酒虫，莫负此酒。」——花酒行者"), L(ME, "酒虫能精炼真元。丙等资质，正缺这个。")]);
      return;
    }
    if (npc.id === "remains") {
      if (st === 2) {
        const bag = Object.assign({}, h.bag, { liquor: (h.bag.liquor || 0) + 2 });
        setHero(Object.assign({}, h, {
          stage: 3, stones: h.stones + 80, gu: Object.assign({}, h.gu, { wine: GU_MAX }), bag: bag,
          exp: h.rank >= 3 ? 0 : h.exp + 20,
        }));
        openDialogue(CAVE_LOOT);
      } else openDialogue([L("旁白", "只剩一具枯骨。")]);
      if (state.hero.stage !== stageBefore) saveGame("story");
    }
  }

  function handleInteract() {
    if (state.mode === "dialogue" && state.dialogue) {
      const text = state.dialogue.lines[state.dialogue.index].text;
      if (state.typed < text.length) { state.typed = text.length; paintDialogueText(); return; }
      if (state.dialogue.index + 1 < state.dialogue.lines.length) {
        state.dialogue = { lines: state.dialogue.lines, index: state.dialogue.index + 1, after: state.dialogue.after };
        refresh();
      } else {
        const after = state.dialogue.after;
        state.dialogue = null;
        if (after === "rebirth") { startChapter(1, REBIRTH); return; }
        state.mode = after;
        refresh();
      }
      return;
    }
    if (state.mode !== "explore") return;
    const t = findAdjacent(state.hero);
    if (t.enemy) { startBattle(t.enemy); return; }
    if (t.npc) { talkTo(t.npc); return; }
    const h = state.hero;
    if (tileAt(h.x, h.y) === "f") {
      if (h.steps - h.lastPick >= 12) {
        setHero(Object.assign({}, h, { lastPick: h.steps, bag: Object.assign({}, h.bag, { petal: (h.bag.petal || 0) + 1 }) }));
        state.toast = "采到一片月兰花瓣。";
      } else state.toast = "这片花刚采过，走一走再来。";
      refresh();
      return;
    }
    state.toast = "附近没有可以互动的东西。";
    refresh();
  }

  function moveHero(d) {
    if (state.mode !== "explore" || !state.hero) return;
    const h = state.hero;
    CUR_MAP_ID = h.map || "main";
    const step = delta(d);
    const nx = h.x + step.dx, ny = h.y + step.dy;
    const hit = state.enemies.find(function (e) { return enemyActive(e, h.stage) && e.x === nx && e.y === ny; });
    if (hit) { setHero(Object.assign({}, h, { dir: d })); startBattle(hit); return; }
    const blockNpc = activeNpcs(h.stage).some(function (n) { return n.x === nx && n.y === ny; });
    if (!walkable(nx, ny, h.stage) || blockNpc) {
      const bt = tileAt(nx, ny);
      if (blockNpc) state.toast = "面前有人，按 A 对话。";
      else if (bt === "X" && h.stage < 2) state.toast = "石壁上有一道细缝……现在还不是时候。";
      else if (bt === "E") state.toast = "东麓山道被族里封了，族长没发话，不能去。";
      else if (bt === "O") state.toast = "山口还不是走的时候。";
      setHero(Object.assign({}, h, { dir: d }));
      refresh();
      return;
    }
    const gate = tileAt(nx, ny);
    if (gate === "E" || gate === "<") {
      const toEast = gate === "E";
      const dm = toEast ? "east" : "main";
      const dxp = toEast ? 1 : 30;
      const dyp = toEast ? 13 : 15;
      CUR_MAP_ID = dm;
      anim = { fx: dxp, fy: dyp, tx: dxp, ty: dyp, t0: -100 };
      fadeRef = 24;
      setHero(Object.assign({}, h, { map: dm, x: dxp, y: dyp, dir: d, steps: h.steps + 1 }));
      state.toast = toEast ? "进入青茅山东麓 · 三寨交界。" : "回到古月山寨。";
      saveGame("map");
      refresh();
      return;
    }
    if (gate === "O" && h.stage === 15) {
      anim = { fx: h.x, fy: h.y, tx: nx, ty: ny, t0: tick };
      fadeRef = 60;
      setHero(Object.assign({}, h, { x: nx, y: ny, dir: d, steps: h.steps + 1, stage: 16 }));
      openDialogue(FINAL_LINES);
      saveGame("story");
      return;
    }
    anim = { fx: h.x, fy: h.y, tx: nx, ty: ny, t0: tick };
    const steps = h.steps + 1;
    setHero(Object.assign({}, h, { x: nx, y: ny, dir: d, steps: steps }));
    state.enemies = state.enemies.map(function (e) {
      if (e.alive || e.once) return e;
      if (e.respawn + 1 >= 25 && Math.abs(e.homeX - nx) + Math.abs(e.homeY - ny) > 4) return Object.assign({}, e, { x: e.homeX, y: e.homeY, alive: true, respawn: 0 });
      return Object.assign({}, e, { respawn: e.respawn + 1 });
    });
    refresh();
  }

  function applyVictory(b) {
    const h = state.hero;
    let rank = h.rank;
    let exp = h.exp + b.exp;
    let leveled = false;
    while (rank < rankCap(h.rank) && exp >= RANK_NEED[rank]) { exp -= RANK_NEED[rank]; rank += 1; leveled = true; }
    if (rank >= rankCap(h.rank)) exp = 0;
    const bag = Object.assign({}, h.bag);
    let dropMsg = "";
    if (b.drop && Math.random() < b.dropRate && ITEMS[b.drop]) {
      bag[b.drop] = (bag[b.drop] || 0) + 1;
      dropMsg = "，得到" + ITEMS[b.drop].name;
    }
    let stage = h.stage, wolfKills = h.wolfKills, beaten = h.beaten, lines = null, gu = h.gu;
    if (b.kind === "mobei" || b.kind === "chicheng") {
      beaten = h.beaten.concat([b.kind]);
      if (stage === 1 && beaten.indexOf("mobei") >= 0 && beaten.indexOf("chicheng") >= 0) { stage = 2; lines = STUDENTS_DONE; }
    }
    if ((b.kind === "wolf" || b.kind === "bigwolf") && stage === 5) {
      wolfKills += 1;
      if (wolfKills >= 3) { stage = 6; lines = WOLVES_DONE; }
    }
    if ((b.kind === "rv" || b.kind === "rvelite") && stage === -3) {
      wolfKills += 1;
      if (wolfKills >= 3) { stage = -2; wolfKills = 0; lines = PRO_MID; }
    }
    if (b.kind === "baiguard" && stage === 10) {
      wolfKills += 1;
      if (wolfKills >= 3) { stage = 11; wolfKills = 0; lines = BAI_DONE; }
    }
    if (b.kind === "xionglin" && stage === 11) { stage = 12; gu = Object.assign({}, gu, { bear: GU_MAX }); lines = XIONG_DONE; }
    if (b.kind === "bnb" && stage === 12) { stage = 13; wolfKills = 0; lines = BNB_DONE; }
    if ((b.kind === "baiguard" || b.kind === "bear" || b.kind === "bat" || b.kind === "icewolf") && stage === 13) {
      wolfKills += 1;
      if (wolfKills >= 4) { stage = 14; wolfKills = 0; lines = WAR_DONE; }
    }
    if (b.kind === "enforcer" && stage === 14) { stage = 15; lines = ENF_DONE; }
    if (b.kind === "boss") { stage = 7; lines = CH1_END; }
    setHero(Object.assign({}, h, {
      rank: rank, exp: exp, hp: leveled ? maxHpOf(rank) : h.hp, zy: leveled ? maxZyOf(rank) : h.zy,
      stones: h.stones + b.stones, bag: bag, kills: h.kills + 1, stage: stage, wolfKills: wolfKills, beaten: beaten, gu: gu,
    }));
    state.enemies = state.enemies.map(function (e) { return e.id === b.mapEnemyId ? Object.assign({}, e, { alive: false, respawn: 0 }) : e; });
    state.battle = null;
    state.toast = leveled
      ? "击败" + b.name + "！修为突破至" + RANKS[rank] + "，生命真元回满！"
      : "击败" + b.name + "！修为 +" + b.exp + "，元石 +" + b.stones + dropMsg + "。";
    if (lines) { state.dialogue = { lines: lines, index: 0, after: "explore" }; state.mode = "dialogue"; }
    else state.mode = "explore";
    saveGame("battle");
    refresh();
  }

  function enemyTurn(b, h) {
    const def = defOf(h.rank);
    let dmg = 0, msg = "", charging = b.charging;
    const isBoss = b.kind === "boss" || b.kind === "bnb" || b.kind === "xionglin" || b.kind === "enforcer";
    const cm = CHARGE_MSG[b.kind] || ["蓄力……", "重击！"];
    if (b.kind === "rvboss") {
      dmg = Math.max(30, Math.round(b.atk * 1.5 - def * 0.4));
      msg = ["正道盟主祭出金光剑阵！", "数十位正道蛊师齐出杀招！", "正道盟主一掌镇下，山石崩裂！"][b.turn % 3];
    } else if (isBoss && b.charging) {
      dmg = Math.max(8, Math.round(b.atk * 1.8 - def * 0.5)); msg = cm[1]; charging = false;
    } else if (isBoss && b.turn % 3 === 0) {
      dmg = Math.max(3, Math.round(b.atk * 0.6 - def * 0.5)); msg = cm[0]; charging = true;
    } else if ((b.kind === "wolf" || b.kind === "bigwolf") && Math.random() < 0.25) {
      dmg = Math.max(3, Math.round(b.atk * 1.4 - def * 0.5)); msg = b.name + "使出「雷电撕咬」！";
    } else {
      dmg = Math.max(2, Math.round(b.atk * (0.88 + Math.random() * 0.24) - def * 0.55)); msg = b.name + "发起攻击。";
    }
    if (b.jadeTurns > 0) { dmg = Math.max(1, Math.round(dmg * 0.5)); msg += "玉皮挡下一半，"; }
    msg += "受到 " + dmg + " 伤害。";
    fx.flash = 14; fx.elunge = 12;
    const hp = Math.max(0, h.hp - dmg);
    if (b.kind === "rvboss" && (hp <= Math.round(maxHpOf(h.rank) * 0.45) || b.turn >= 3)) {
      setHero(Object.assign({}, h, { hp: Math.max(1, hp) }));
      state.battle = Object.assign({}, b, { busy: true, ending: "rebirth", awaiting: null, logs: b.logs.slice(-1).concat([msg, "魔头方源（心声）：……到此为止了。"]) });
      veil = { rgb: "150,16,28", life: 48, max: 48 };
      fx.flash = 20;
      saveGame("battle");
      refresh();
      const token = ++actionToken;
      setTimeout(function () {
        if (token !== actionToken) return;
        if (!state.battle || state.battle.ending !== "rebirth") return;
        state.battle = null;
        state.dialogue = { lines: PRO_END, index: 0, after: "rebirth" };
        state.mode = "dialogue";
        saveGame("battle");
        refresh();
      }, 1500);
      return;
    }
    setHero(Object.assign({}, h, { hp: hp }));
    if (hp <= 0) {
      state.battle = null;
      state.mode = "gameover";
      saveGame("battle");
      refresh();
      return;
    }
    state.battle = Object.assign({}, b, {
      charging: charging, turn: b.turn + 1, pigTurns: Math.max(0, b.pigTurns - 1), jadeTurns: Math.max(0, b.jadeTurns - 1),
      busy: false, awaiting: null, logs: b.logs.slice(-2).concat([msg]),
    });
    refresh();
  }
  function finishAction(b, h, delay) {
    b.awaiting = b.hp <= 0 ? "victory" : "enemy";
    b.busy = true;
    state.battle = b;
    const token = ++actionToken;
    refresh();
    setTimeout(function () {
      if (token !== actionToken) return;
      if (state.mode !== "battle" || !state.battle) return;
      if (b.hp <= 0) applyVictory(b);
      else enemyTurn(b, h);
    }, delay);
  }
  function doAttack() {
    const b = state.battle;
    if (!b || b.busy) return;
    const h = state.hero;
    const crit = Math.random() < 0.12;
    const raw = atkOf(h.rank) * (0.9 + Math.random() * 0.2) * (b.pigTurns > 0 ? 1.6 : 1) * (crit ? 1.5 : 1);
    const dmg = Math.max(2, Math.round(raw - b.def * 0.5));
    fx.lunge = 12; fx.shake = 12; fx.slash = 10;
    floatText(crit ? "暴击" + dmg : "-" + dmg, crit ? "#ffcd75" : "#f4f4f4");
    const nb = Object.assign({}, b, {
      hp: Math.max(0, b.hp - dmg), sub: "main", busy: true,
      logs: b.logs.slice(-2).concat([crit ? "方源一拳正中要害，造成 " + dmg + " 伤害！" : "方源拳脚攻击，造成 " + dmg + " 伤害。"]),
    });
    finishAction(nb, h, 450);
  }
  function castGu(id) {
    const b = state.battle;
    if (!b || b.busy) return;
    const h = state.hero;
    const info = GU_INFO[id];
    const sat = h.gu[id];
    if (sat === undefined) return;
    if (sat <= 0) { state.battle = Object.assign({}, b, { logs: b.logs.slice(-2).concat([info.name + "饿得动不了，先喂食！"]) }); refresh(); return; }
    if (h.zy < info.cost) { state.battle = Object.assign({}, b, { logs: b.logs.slice(-2).concat(["真元不足！可用「握元石」回复。"]) }); refresh(); return; }
    let zy = h.zy - info.cost, heal = 0;
    let nb = Object.assign({}, b, { sub: "main", busy: true });
    let log = "";
    if (id === "moon") {
      const mult = 1.9 * (b.wineBoost ? 1.5 : 1) * (b.pigTurns > 0 ? 1.6 : 1);
      const dmg = Math.max(4, Math.round(atkOf(h.rank) * mult * (0.92 + Math.random() * 0.16) - b.def * 0.4));
      nb = Object.assign({}, nb, { hp: Math.max(0, b.hp - dmg), wineBoost: false });
      fx.blade = 16; fx.shake = 16; floatText("-" + dmg, "#73eff7");
      log = "月光蛊凝出月刃，斩出 " + dmg + " 伤害！";
    } else if (id === "wine") {
      zy = Math.min(maxZyOf(h.rank), zy + 15);
      nb = Object.assign({}, nb, { wineBoost: true });
      fx.glow = 20; floatText("+15真元", "#73eff7");
      log = "酒虫精炼真元，真元 +15，下次蛊术威力大增。";
    } else if (id === "bloodmoon" || id === "xuehai") {
      const big = id === "xuehai";
      const mult = (big ? 4 : 2.6) * (b.wineBoost ? 1.5 : 1) * (b.pigTurns > 0 ? 1.6 : 1);
      const dmg = Math.max(6, Math.round(atkOf(h.rank) * mult * (0.92 + Math.random() * 0.16) - b.def * 0.4));
      nb = Object.assign({}, nb, { hp: Math.max(0, b.hp - dmg), wineBoost: false });
      heal = big ? 0 : Math.round(dmg * 0.25);
      fx.blade = 16; fx.shake = 18; floatText("-" + dmg, "#c0394b");
      log = big ? "血神子化作滔天血海，造成 " + dmg + " 伤害！" : "血月斩出，造成 " + dmg + " 伤害，吸回 " + heal + " 生命！";
    } else if (id === "bear") {
      const mult = 2.4 * (b.wineBoost ? 1.5 : 1) * (b.pigTurns > 0 ? 1.6 : 1);
      const dmg = Math.max(6, Math.round(atkOf(h.rank) * mult * (0.92 + Math.random() * 0.16)));
      nb = Object.assign({}, nb, { hp: Math.max(0, b.hp - dmg), wineBoost: false });
      fx.lunge = 12; fx.shake = 16; fx.slash = 10; floatText("-" + dmg, "#ffcd75");
      log = "熊力蛊催动，一记重拳无视防御，造成 " + dmg + " 伤害！";
    } else if (id === "life") {
      heal = 60; fx.glow = 20; floatText("+60", "#a7f070"); log = "生机叶化作绿光没入体内，生命 +60。";
    } else if (id === "pig") {
      nb = Object.assign({}, nb, { pigTurns: 4 }); fx.glow = 20; floatText("豕力!", "#ffcd75"); log = "白豕蛊发力，气力暴涨！";
    } else {
      nb = Object.assign({}, nb, { jadeTurns: 4 }); fx.glow = 20; floatText("玉皮!", "#a7f070"); log = "玉皮蛊覆体，皮肤泛起玉光。";
    }
    nb.logs = b.logs.slice(-2).concat([log]);
    const nh = Object.assign({}, h, { zy: zy, hp: Math.min(maxHpOf(h.rank), h.hp + heal), gu: Object.assign({}, h.gu, (function () { const o = {}; o[id] = sat - 1; return o; })()) });
    setHero(nh);
    finishAction(nb, nh, 480);
  }
  function battleItem(which) {
    const b = state.battle;
    if (!b || b.busy) return;
    const h = state.hero;
    let nh = h, log = "";
    if (which === "herb") {
      if ((h.bag.herb || 0) <= 0) return;
      nh = Object.assign({}, h, { hp: Math.min(maxHpOf(h.rank), h.hp + 40), bag: Object.assign({}, h.bag, { herb: (h.bag.herb || 0) - 1 }) });
      floatText("+40", "#a7f070"); log = "嚼下疗伤草药，生命 +40。";
    } else {
      if (h.stones < 3) return;
      nh = Object.assign({}, h, { stones: h.stones - 3, zy: Math.min(maxZyOf(h.rank), h.zy + 20) });
      floatText("+20真元", "#73eff7"); log = "握住元石吸纳，真元 +20（-3 元石）。";
    }
    fx.glow = 20;
    setHero(nh);
    finishAction(Object.assign({}, b, { sub: "main", busy: true, logs: b.logs.slice(-2).concat([log]) }), nh, 420);
  }
  function flee() {
    const b = state.battle;
    if (!b || b.busy) return;
    if (BOSS_KINDS.indexOf(b.kind) >= 0 || b.kind === "rv" || b.kind === "rvelite") {
      state.battle = Object.assign({}, b, { logs: b.logs.slice(-2).concat([b.kind === "boss" ? "狼王封住了退路，逃不掉！" : "退路已被封死，逃不掉！"]) });
      refresh();
      return;
    }
    if (Math.random() < 0.75) {
      state.battle = null; state.mode = "explore";
      state.toast = "方源抽身而退。活着，才有以后。";
      saveGame("battle");
      refresh();
    } else finishAction(Object.assign({}, b, { busy: true, logs: b.logs.slice(-2).concat(["逃跑失败！"]) }), state.hero, 420);
  }

  function feed(id) {
    const h = state.hero;
    const food = GU_INFO[id].food;
    if ((h.bag[food] || 0) <= 0) { state.toast = "没有" + ITEMS[food].name + "了。"; refresh(); return; }
    const gu = Object.assign({}, h.gu); gu[id] = GU_MAX;
    const bag = Object.assign({}, h.bag); bag[food] = (bag[food] || 0) - 1;
    setHero(Object.assign({}, h, { gu: gu, bag: bag }));
    state.toast = "喂了" + GU_INFO[id].name + "一份" + ITEMS[food].name + "，可用次数回满 " + GU_MAX + "/" + GU_MAX + "。";
    refresh();
  }
  function eatHerb() {
    const h = state.hero;
    if ((h.bag.herb || 0) <= 0) return;
    if (h.hp >= maxHpOf(h.rank)) { state.toast = "生命已满。"; refresh(); return; }
    setHero(Object.assign({}, h, { hp: Math.min(maxHpOf(h.rank), h.hp + 40), bag: Object.assign({}, h.bag, { herb: (h.bag.herb || 0) - 1 }) }));
    state.toast = "用了疗伤草药，生命 +40。";
    refresh();
  }
  function absorbStones() {
    const h = state.hero;
    if (h.stones < 3) { state.toast = "元石不足。"; refresh(); return; }
    if (h.zy >= maxZyOf(h.rank)) { state.toast = "真元已满。"; refresh(); return; }
    setHero(Object.assign({}, h, { stones: h.stones - 3, zy: Math.min(maxZyOf(h.rank), h.zy + 20) }));
    state.toast = "吸纳元石，真元 +20。";
    refresh();
  }
  function buy(id) {
    const h = state.hero;
    if (GU_PRICE[id] !== undefined) {
      const price = GU_PRICE[id];
      if (h.gu[id] !== undefined) { state.toast = "这只蛊你已经有了。"; refresh(); return; }
      if (h.stones < price) { state.toast = "元石不够。"; refresh(); return; }
      const gu = Object.assign({}, h.gu); gu[id] = GU_MAX;
      setHero(Object.assign({}, h, { stones: h.stones - price, gu: gu }));
      state.toast = "买下并炼化了" + GU_INFO[id].name + "！";
      refresh();
      return;
    }
    const it = ITEMS[id];
    if (!it) return;
    if (h.stones < it.price) { state.toast = "元石不够。"; refresh(); return; }
    const bag = Object.assign({}, h.bag); bag[id] = (bag[id] || 0) + 1;
    setHero(Object.assign({}, h, { stones: h.stones - it.price, bag: bag }));
    state.toast = "买了" + it.name + "。";
    refresh();
  }
  function rest() {
    const h = state.hero;
    setHero(Object.assign({}, h, { hp: maxHpOf(h.rank), zy: maxZyOf(h.rank) }));
    state.enemies = state.enemies.map(function (e) { return e.once ? e : Object.assign({}, e, { alive: true, respawn: 0, x: e.homeX, y: e.homeY }); });
    state.toast = "在竹楼睡了一觉，生命与真元回满。山里的野兽也回来了。";
    refresh();
  }
  function cultivate() {
    const h = state.hero;
    if (h.rank >= rankCap(h.rank)) {
      state.toast = h.rank === 3 ? (h.stage >= 8 ? "瓶颈已经松动，可以冲击二转了。" : "一转巅峰，已到瓶颈。") : "已到本转巅峰。";
      refresh();
      return;
    }
    if (h.stones < 10) { state.toast = "修炼需要 10 块元石。"; refresh(); return; }
    let rank = h.rank, exp = h.exp + 15, up = false;
    while (rank < rankCap(h.rank) && exp >= RANK_NEED[rank]) { exp -= RANK_NEED[rank]; rank += 1; up = true; }
    if (rank >= rankCap(h.rank)) exp = 0;
    setHero(Object.assign({}, h, { stones: h.stones - 10, rank: rank, exp: exp, hp: up ? maxHpOf(rank) : h.hp, zy: up ? maxZyOf(rank) : h.zy }));
    state.toast = up ? "以元石温养空窍，突破至" + RANKS[rank] + "！" : "以元石温养空窍，修为 +15。";
    refresh();
  }
  function breakthrough() {
    const h = state.hero;
    if (h.rank !== 3 || h.stage < 8 || h.stones < 200) return;
    const r = 4;
    setHero(Object.assign({}, h, {
      rank: r, exp: 0, hp: maxHpOf(r), zy: maxZyOf(r), stones: h.stones - 200,
      stage: h.stage === 8 ? 9 : h.stage, gu: Object.assign({}, h.gu, { bloodmoon: GU_MAX }),
    }));
    fadeRef = 40;
    state.dialogue = { lines: BREAK_LINES, index: 0, after: "explore" };
    state.mode = "dialogue";
    saveGame("story");
    refresh();
  }
  function revive() {
    const h = state.hero;
    const pro = h.map === "pro";
    const rx = pro ? 4 : 5, ry = pro ? 21 : 20;
    CUR_MAP_ID = pro ? "pro" : "main";
    anim = { fx: rx, fy: ry, tx: rx, ty: ry, t0: -100 };
    setHero(Object.assign({}, h, {
      map: pro ? "pro" : "main", x: rx, y: ry, dir: "down",
      hp: maxHpOf(h.rank), zy: maxZyOf(h.rank), stones: pro ? h.stones : Math.floor(h.stones / 2),
    }));
    state.enemies = state.enemies.map(function (e) { return e.once ? e : Object.assign({}, e, { alive: true, respawn: 0, x: e.homeX, y: e.homeY }); });
    state.battle = null;
    state.mode = "explore";
    state.toast = pro ? "方源从血泊里撑起身。这一战，还没完。" : "方源在竹楼醒来，元石丢了一半。这笔账，记下了。";
    saveGame("battle");
    refresh();
  }
  function resumeBattle() {
    const b = state.battle;
    if (!b) { state.mode = "explore"; refresh(); return; }
    if (b.ending === "rebirth") {
      state.battle = null;
      state.dialogue = { lines: PRO_END, index: 0, after: "rebirth" };
      state.mode = "dialogue";
      refresh();
      return;
    }
    if (b.hp <= 0) { applyVictory(b); return; }
    if (b.awaiting === "enemy") { enemyTurn(b, state.hero); return; }
    if (b.awaiting === "victory") { applyVictory(b); return; }
    b.busy = false;
    refresh();
  }
  function continueGame() {
    const data = loadSave();
    if (!data) return;
    setHero(data.hero);
    state.enemies = Array.isArray(data.enemies) && data.enemies.length ? data.enemies : createEnemies();
    state.battle = data.battle || null;
    state.dialogue = data.dialogue || null;
    state.toast = data.toast || "继续上次的行程。";
    state.mode = data.mode || "explore";
    if (["title"].indexOf(state.mode) >= 0) state.mode = "explore";
    anim = { fx: state.hero.x, fy: state.hero.y, tx: state.hero.x, ty: state.hero.y, t0: -100 };
    fadeRef = 20;
    veil = null;
    resetFx();
    if (state.mode === "battle") resumeBattle();
    else {
      if (state.mode === "dialogue" && !state.dialogue) state.mode = "explore";
      refresh();
    }
  }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function uiKey() {
    const h = state.hero;
    if (state.mode === "explore") return "explore";
    if (state.mode === "dialogue" && state.dialogue) return "dlg:" + state.dialogue.index + ":" + state.dialogue.lines.length + ":" + state.dialogue.after;
    if (state.mode === "battle" && state.battle) {
      const b = state.battle;
      return ["bat", b.sub, b.hp, b.busy ? 1 : 0, b.charging ? 1 : 0, b.pigTurns, b.jadeTurns, b.wineBoost ? 1 : 0, b.turn, (b.logs || []).join("|"), h.hp, h.zy, h.stones, h.bag.herb || 0, JSON.stringify(h.gu)].join(";");
    }
    if (!h) return state.mode;
    if (state.mode === "bag" || state.mode === "shop" || state.mode === "home") return state.mode + JSON.stringify(h.gu) + JSON.stringify(h.bag) + h.stones + h.hp + h.zy + h.rank + h.exp + h.stage + state.toast + h.kills;
    return state.mode + (h.map || "");
  }
  function showPlay() {
    document.getElementById("title").hidden = true;
    document.getElementById("play").hidden = false;
  }
  function barHtml(label, v, max, color, text) {
    const pct = Math.round(clamp(v / max, 0, 1) * 100);
    return '<div class="bar"><span>' + label + '</span><div class="track"><div class="fill" style="width:' + pct + '%;background:' + color + '"></div></div><span class="num">' + esc(text) + "</span></div>";
  }
  function paintPortraits(root) {
    root.querySelectorAll("canvas.portrait").forEach(function (c) {
      const face = c.dataset.face;
      const rect = AT["face_" + face];
      const pw = rect ? rect[2] : 38, ph = rect ? rect[3] : 38;
      c.width = Math.max(pw, 144);
      c.height = Math.max(ph, 144);
      const ctx = c.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      if (window.HD && HD.paintFace(ctx, face, c.width, c.height)) return;
      ctx.fillStyle = "#1a1c2c";
      ctx.fillRect(0, 0, c.width, c.height);
      if (atlasImg.naturalWidth && rect) drawPart(ctx, atlasImg, rect, undefined, 0, 0, c.width / pw, false);
      else drawPart(ctx, null, undefined, sprites()[face] || sprites().hero, 8, 8, 4, false);
    });
  }
  function renderHud() {
    const h = state.hero;
    if (!h) return;
    const mHp = maxHpOf(h.rank), mZy = maxZyOf(h.rank);
    const cap = h.rank >= rankCap(h.rank);
    const need = cap ? 1 : RANK_NEED[h.rank];
    const face = h.map === "pro" ? "hero_old" : "hero";
    document.getElementById("hud").innerHTML =
      '<div class="panel hud"><canvas class="portrait" data-face="' + face + '" width="48" height="48"></canvas><div class="bars">' +
      '<div class="who-row"><span class="name">方源 <span class="meta">' + esc(RANKS[h.rank]) + " · " + esc(zoneName(h.x, h.y)) + '</span></span>' +
      '<span class="right"><span id="save-flag" class="saveflag' + (Date.now() < saveFlashUntil ? " on" : "") + '">已存</span>' +
      '<span class="stones">◆ ' + h.stones + "</span></span></div>" +
      barHtml("生命", h.hp, mHp, "var(--hp)", h.hp + "/" + mHp) +
      barHtml("真元", h.zy, mZy, "var(--zy)", h.zy + "/" + mZy) +
      barHtml("修为", cap ? 1 : h.exp, need, "var(--exp)", cap ? "圆满" : h.exp + "/" + need) +
      "</div></div>";
    paintPortraits(document.getElementById("hud"));
  }
  function patchExplore() {
    const obj = document.getElementById("objective");
    const tst = document.getElementById("toast");
    if (obj) obj.textContent = objectiveText();
    if (tst) tst.textContent = state.toast;
  }
  function exploreHTML() {
    return '<div class="stack"><div class="panel"><div class="obj"><span class="tag">目标</span><span class="txt" id="objective">' + esc(objectiveText()) + '</span></div><div class="toast" id="toast">' + esc(state.toast) + '</div></div>' +
      '<div class="panel controls"><div class="dpad">' +
      '<button type="button" class="u" data-dir="up" aria-label="向上">▲</button>' +
      '<button type="button" class="l" data-dir="left" aria-label="向左">◀</button>' +
      '<div class="c"></div>' +
      '<button type="button" class="r" data-dir="right" aria-label="向右">▶</button>' +
      '<button type="button" class="d" data-dir="down" aria-label="向下">▼</button></div>' +
      '<div class="ab"><div class="col"><button type="button" class="btn round sm" id="btn-b" data-act="bag">B</button><span>蛊囊</span></div>' +
      '<div class="col a"><button type="button" class="btn round primary" id="btn-a" data-act="interact">A</button><span>互动</span></div></div></div></div>';
  }
  function paintDialogueText() {
    const body = document.getElementById("dlg-body");
    const btn = document.getElementById("dlg-next");
    if (!state.dialogue || !body) return;
    const line = state.dialogue.lines[state.dialogue.index];
    const shown = line.text.slice(0, state.typed);
    body.textContent = shown;
    if (state.typed < line.text.length) body.insertAdjacentHTML("beforeend", '<span style="opacity:.5">▍</span>');
    if (btn) {
      btn.textContent = state.typed < line.text.length ? "跳过 ▶▶" : (state.dialogue.index + 1 < state.dialogue.lines.length ? "继续 ▼" : "确定");
    }
  }
  function startTypewriter() {
    if (typeTimer) { clearInterval(typeTimer); typeTimer = null; }
    if (state.mode !== "dialogue" || !state.dialogue) return;
    state.typed = 0;
    paintDialogueText();
    const text = state.dialogue.lines[state.dialogue.index].text;
    let n = 0;
    typeTimer = setInterval(function () {
      n += 1;
      state.typed = Math.max(state.typed, n);
      paintDialogueText();
      if (n >= text.length) { clearInterval(typeTimer); typeTimer = null; }
    }, 28);
  }
  function dialogueHTML() {
    const d = state.dialogue;
    const line = d.lines[d.index];
    const face = FACE_OF[line.who];
    return '<div class="panel dlg"><span class="tag">' + esc(line.who) + '</span><div class="dlg-row">' +
      (face ? '<canvas class="portrait lg" data-face="' + face + '" width="48" height="48"></canvas>' : "") +
      '<div id="dlg-body" class="dlg-text' + (line.who === "旁白" ? " narr" : "") + '"></div></div>' +
      '<div class="dlg-foot"><span class="muted">' + (d.index + 1) + "/" + d.lines.length + '</span>' +
      '<button type="button" class="btn primary" id="dlg-next" data-act="interact" style="width:140px">继续 ▼</button></div></div>';
  }
  function battleHTML() {
    const b = state.battle, h = state.hero;
    const pct = Math.round((b.hp / b.maxHp) * 100);
    let tags = "";
    if (b.pigTurns > 0) tags += '<span class="tag">豕力 ' + b.pigTurns + "</span>";
    if (b.jadeTurns > 0) tags += '<span class="tag">玉皮 ' + b.jadeTurns + "</span>";
    if (b.wineBoost) tags += '<span class="tag">酒力蓄势</span>';
    if (b.charging) tags += '<span class="warn">敌人正在蓄力！下回合重击，考虑玉皮或回血</span>';
    const logs = b.logs.map(function (line, i) {
      const last = i === b.logs.length - 1;
      return '<div class="' + (last ? "" : "old") + '">' + (last ? "▸ " : "") + esc(line) + "</div>";
    }).join("");
    let actions = "";
    if (b.sub === "main") {
      actions = '<div class="grid2"><button class="btn primary" data-act="attack"' + (b.busy ? " disabled" : "") + ">✊ 拳脚</button>" +
        '<button class="btn" data-act="sub" data-arg="gu"' + (b.busy ? " disabled" : "") + ">☾ 蛊术</button>" +
        '<button class="btn" data-act="sub" data-arg="item"' + (b.busy ? " disabled" : "") + ">◆ 道具</button>" +
        '<button class="btn" data-act="flee"' + (b.busy ? " disabled" : "") + ">↩ 逃跑</button></div>";
    } else if (b.sub === "gu") {
      const owned = GU_ORDER.filter(function (id) { return h.gu[id] !== undefined; });
      actions = '<div class="stack">' + (owned.length ? "" : '<div class="note">还没有蛊虫。先去学堂领取月光蛊。</div>') +
        owned.map(function (id) {
          const info = GU_INFO[id], sat = h.gu[id] || 0;
          const dis = b.busy || sat <= 0 || h.zy < info.cost;
          return '<button class="btn between" data-act="cast" data-arg="' + id + '"' + (dis ? " disabled" : "") + '><span><span>' + esc(info.name) + "  剩余 " + sat + "/" + GU_MAX + '</span><span class="ds" style="display:block;font-weight:500">' + esc(sat <= 0 ? "饿了！先喂食" : info.desc) + '</span></span><span class="muted">' + info.cost + " 真元</span></button>";
        }).join("") +
        '<button class="btn" data-act="sub" data-arg="main">← 返回</button></div>';
    } else {
      actions = '<div class="stack"><button class="btn between" data-act="item" data-arg="herb"' + (b.busy || (h.bag.herb || 0) <= 0 ? " disabled" : "") + '><span>疗伤草药（生命 +40）</span><span class="muted">x' + (h.bag.herb || 0) + "</span></button>" +
        '<button class="btn between" data-act="item" data-arg="stone"' + (b.busy || h.stones < 3 ? " disabled" : "") + '><span>握元石（真元 +20）</span><span class="muted">-3◆</span></button>' +
        '<button class="btn" data-act="sub" data-arg="main">← 返回</button></div>';
    }
    return '<div class="panel stack"><div><div class="who-row"><span class="name">' + (BOSS_KINDS.indexOf(b.kind) >= 0 ? "★ " : "") + esc(b.name) + '</span><span class="muted">' + b.hp + "/" + b.maxHp + '</span></div>' +
      '<div class="hpbar"><i style="width:' + pct + '%"></i></div><div class="tags">' + tags + "</div></div>" +
      '<div class="logbox">' + logs + "</div>" + actions + "</div>";
  }
  function bagHTML() {
    const h = state.hero;
    const stats = [["修为", RANKS[h.rank]], ["攻击", String(atkOf(h.rank))], ["防御", String(defOf(h.rank))], ["元石", String(h.stones)], ["斩敌", String(h.kills)], ["步数", String(h.steps)]];
    const owned = GU_ORDER.filter(function (id) { return h.gu[id] !== undefined; });
    return '<div class="panel stack"><div class="who-row"><span class="tag">蛊囊</span><span class="note">资质：丙等</span></div>' +
      '<div class="grid3">' + stats.map(function (p) { return '<div class="stat"><i>' + p[0] + "</i><b>" + esc(p[1]) + "</b></div>"; }).join("") + "</div>" +
      (state.toast ? '<div class="toast accent">' + esc(state.toast) + "</div>" : "") +
      '<div class="section-label">蛊虫（剩余次数为 0 时无法驱使，喂一次回满 ' + GU_MAX + " 次）</div>" +
      (owned.length ? "" : '<div class="note">还没有蛊虫。</div>') +
      owned.map(function (id) {
        const info = GU_INFO[id], sat = h.gu[id] || 0, have = h.bag[info.food] || 0;
        const col = sat <= 3 ? "#e04a5f" : "#38b764";
        return '<div class="rowcard"><div class="grow"><div class="nm">' + esc(info.name) + "  剩余 " + sat + "/" + GU_MAX + '</div><div class="sat"><i style="width:' + Math.round((sat / GU_MAX) * 100) + "%;background:" + col + '"></i></div><div class="ds">' + esc(info.desc) + '</div></div>' +
          '<button class="btn tiny" data-act="feed" data-arg="' + id + '"' + (have <= 0 || sat >= GU_MAX ? " disabled" : "") + ">喂" + esc(ITEMS[info.food].name.slice(-2)) + " x" + have + "</button></div>";
      }).join("") +
      '<div class="section-label">物品</div><div class="chips">' + ITEM_ORDER.map(function (id) { return '<span class="chip">' + esc(ITEMS[id].name) + " <b>x" + (h.bag[id] || 0) + "</b></span>"; }).join("") + "</div>" +
      '<div class="grid2"><button class="btn" data-act="eat"' + ((h.bag.herb || 0) <= 0 ? " disabled" : "") + '>用草药 +40</button><button class="btn" data-act="absorb"' + (h.stones < 3 ? " disabled" : "") + ">吸元石 +20</button></div>" +
      '<button class="btn primary" data-act="mode" data-arg="explore">← 返回</button></div>';
  }
  function shopHTML() {
    const h = state.hero;
    const gus = (h.stage >= 9 ? ["pig", "jade", "life"] : ["pig", "jade"]);
    return '<div class="panel stack"><div class="who-row"><span class="tag">贾家商队</span><span class="stones">◆ ' + h.stones + "</span></div>" +
      (state.toast ? '<div class="toast accent">' + esc(state.toast) + "</div>" : "") +
      ITEM_ORDER.map(function (id) {
        const it = ITEMS[id];
        return '<div class="rowcard"><div class="grow"><div class="nm">' + esc(it.name) + '</div><div class="ds">' + esc(it.desc) + " · 持有 " + (h.bag[id] || 0) + '</div></div><button class="btn tiny primary" data-act="buy" data-arg="' + id + '"' + (h.stones < it.price ? " disabled" : "") + ">◆" + it.price + "</button></div>";
      }).join("") +
      gus.map(function (id) {
        const owned = h.gu[id] !== undefined, price = GU_PRICE[id];
        return '<div class="rowcard" style="border-color:var(--text)"><div class="grow"><div class="nm">蛊 · ' + esc(GU_INFO[id].name) + '</div><div class="ds">' + esc(GU_INFO[id].desc) + '</div></div><button class="btn tiny primary" data-act="buy" data-arg="' + id + '"' + (owned || h.stones < price ? " disabled" : "") + ">" + (owned ? "已有" : "◆" + price) + "</button></div>";
      }).join("") +
      '<button class="btn" data-act="mode" data-arg="explore">离开</button></div>';
  }
  function homeHTML() {
    const h = state.hero;
    let extra = "";
    if (h.rank === 3 && h.stage >= 8) extra = '<button class="btn primary" data-act="break"' + (h.stones < 200 ? " disabled" : "") + ">冲击二转（200 元石）</button>";
    return '<div class="panel stack"><span class="tag">竹楼</span><div class="note">爹娘留下的竹楼。休息回满生命真元；修炼以元石温养空窍，提升修为。</div>' +
      (state.toast ? '<div class="toast accent">' + esc(state.toast) + "</div>" : "") +
      '<button class="btn primary" data-act="rest">休息（免费，回满）</button>' +
      '<button class="btn" data-act="cultivate"' + (h.stones < 10 || h.rank >= rankCap(h.rank) ? " disabled" : "") + ">修炼（10 元石 → 修为 +15）</button>" +
      extra + '<button class="btn" data-act="mode" data-arg="explore">离开</button></div>';
  }
  function gameoverHTML() {
    const pro = state.hero && state.hero.map === "pro";
    return '<div class="panel center-col"><div class="danger-title">方源 · 身死道消</div><div class="note">春秋蝉只能用一次。……但这是游戏，再给你一次机会。</div>' +
      '<button class="btn primary" data-act="revive">' + (pro ? "重整旗鼓，再战一次" : "在竹楼醒来（保留修为，元石减半）") + "</button>" +
      '<button class="btn" data-act="restart">从开窍大典重来</button></div>';
  }
  function renderPanel() {
    const panel = document.getElementById("panel");
    let html = "";
    if (state.mode === "explore") html = exploreHTML();
    else if (state.mode === "dialogue" && state.dialogue) html = dialogueHTML();
    else if (state.mode === "battle" && state.battle) html = battleHTML();
    else if (state.mode === "bag") html = bagHTML();
    else if (state.mode === "shop") html = shopHTML();
    else if (state.mode === "home") html = homeHTML();
    else if (state.mode === "gameover") html = gameoverHTML();
    panel.innerHTML = html;
    paintPortraits(panel);
  }
  function renderTitle() {
    const save = loadSave();
    const cont = save
      ? '<button class="btn primary column" id="btn-continue" data-act="continue"><span>继续游戏</span><small>' + esc(saveBlurb(save)) + "</small></button>"
      : "";
    const startClass = save ? "btn" : "btn primary";
    document.getElementById("title").innerHTML =
      '<img class="banner" src="title_banner.png" alt="像素风夜色山寨：方源与电狼">' +
      '<div class="pad stack"><div class="kicker">— 类像素回合制 RPG —</div><h1>蛊真人·青茅山</h1>' +
      '<p class="sub">春秋蝉逆转五百年光阴，魔头方源重回十五岁。<br>这一世，他依旧要走魔道。</p>' +
      '<div class="help"><div>十字键：移动（按住连走）</div><div>A：对话 / 调查 / 采花</div><div>B：蛊囊，喂蛊、吸元石</div><div>撞上敌人：回合制战斗</div></div>' +
      cont +
      '<button class="' + startClass + '" id="btn-start" data-act="chapter" data-arg="0">▶ 开始（从序章）</button>' +
      '<div class="section-label">章节选择</div>' +
      '<div class="note">进度会自动写在这台手机里：换地图、打完仗、以及每隔一会儿。选章节会按该章配好修为、元石和蛊，并覆盖当前存档。</div>' +
      '<div class="chapters">' + CHAPTERS.map(function (c, i) {
        return '<button class="btn chapter-btn" id="btn-ch-' + i + '" data-act="chapter" data-arg="' + i + '"><span>' + esc(c.title) + "<small>" + esc(chapterSummary(i)) + "</small></span></button>";
      }).join("") + "</div>" +
      '<p class="credits">素材：方源（含序章魔尊形象）、白凝冰、正道蛊师、熊林与地形为原创像素画；其余角色与房屋来自 Ninja Adventure（Pixel-boy，CC0）；狼群来自 Wolf Pack（patvanmackelberg，OpenGameArt，CC0）。详见 CREDITS.txt。可添加到主屏幕，全屏游玩。</p></div>';
  }
  function refresh() {
    if (state.mode === "title") {
      document.getElementById("play").hidden = true;
      document.getElementById("title").hidden = false;
      lastKey = "";
      renderTitle();
      return;
    }
    showPlay();
    fitCanvas();
    renderHud();
    const key = uiKey();
    if (key !== lastKey) {
      lastKey = key;
      renderPanel();
      if (state.mode === "dialogue") startTypewriter();
    } else if (state.mode === "explore") patchExplore();
  }
  function fitCanvas() {
    const wrap = document.getElementById("view-wrap");
    const canvas = document.getElementById("view");
    if (!wrap || wrap.clientWidth === 0) return;
    const maxW = wrap.clientWidth - 6;
    const avail = window.innerHeight || 700;
    const bw = 352, bh = 288;
    let scale = Math.floor(maxW / bw);
    if (scale < 1) scale = 1;
    if (scale > 3) scale = 3;
    while (scale > 1 && bh * scale > avail - 280) scale -= 1;
    canvas.style.width = (bw * scale) + "px";
    canvas.style.height = (bh * scale) + "px";
  }

  function frame() {
    tick += 1;
    const canvas = document.getElementById("view");
    const ctx = canvas.getContext("2d");
    if (ctx && state.mode !== "title" && state.hero) {
      if (!tiles) tiles = buildTiles();
      const spr = sprites();
      const atlas = atlasImg.naturalWidth ? atlasImg : null;
      if (window.HD) HD.prepare(canvas, ctx);
      else ctx.imageSmoothingEnabled = false;
      CUR_MAP_ID = state.hero.map || "main";
      if (fx.shake > 0) fx.shake -= 1;
      if (fx.lunge > 0) fx.lunge -= 1;
      if (fx.elunge > 0) fx.elunge -= 1;
      if (fx.flash > 0) fx.flash -= 1;
      if (fx.glow > 0) fx.glow -= 1;
      if (fx.blade > 0) fx.blade -= 1;
      if (fx.slash > 0) fx.slash -= 1;
      if (fx.floatAge > 0) fx.floatAge -= 1;
      if (veil && veil.life > 0) veil.life -= 1;
      if (state.mode === "battle" && state.battle) {
        const b = state.battle;
        const scene = (state.hero.map === "pro" || b.kind === "bnb" || b.kind === "enforcer" || b.kind === "bat") ? "night"
          : (b.kind === "mobei" || b.kind === "chicheng") ? "village"
          : (b.kind === "boss" || b.kind === "bigwolf") ? "night" : "forest";
        if (window.HD) HD.drawBattle(ctx, { battle: b, hero: state.hero, fx: fx, tick: tick, scene: scene });
        else drawBackdrop(ctx, scene, tick);
        if (fx.flash > 8) { ctx.fillStyle = "rgba(192,57,75,0.25)"; ctx.fillRect(0, 0, CW, CH); }
        if (fx.glow > 0) {
          ctx.fillStyle = "#a7f070";
          const r = 20 - fx.glow;
          ctx.fillRect(22 - r, 108, 2, 2); ctx.fillRect(58 + r, 104, 2, 2); ctx.fillRect(40, 86 - r, 2, 2); ctx.fillRect(32, 128 + Math.floor(r / 2), 2, 2);
        }
        if (fx.blade > 0) {
          const p = 1 - fx.blade / 16;
          drawPart(ctx, null, undefined, spr.blade, 52 + p * 64, 88 - p * 46, 2, false);
        }
        if (b.charging) {
          ctx.fillStyle = tick % 8 < 4 ? "#ffcd75" : "#73eff7";
          for (let i = 0; i < 5; i++) ctx.fillRect(84 + i * 15, 10 + ((tick + i * 5) % 12), 2, 7);
        }
        if (fx.floatAge > 0 && fx.floatText) {
          const rise = Math.round((40 - fx.floatAge) * 0.5);
          ctx.font = "bold 10px monospace";
          ctx.fillStyle = "#1a1c2c"; ctx.fillText(fx.floatText, 109, 31 - rise);
          ctx.fillStyle = fx.floatColor; ctx.fillText(fx.floatText, 108, 30 - rise);
        }
      } else {
        const h = state.hero;
        let vx = h.x, vy = h.y, moving = false;
        if (anim.tx === h.x && anim.ty === h.y) {
          const p = clamp((tick - anim.t0) / 8, 0, 1);
          vx = anim.fx + (anim.tx - anim.fx) * p;
          vy = anim.fy + (anim.ty - anim.fy) * p;
          moving = p < 1;
        }
        if (holdTimer !== null) moving = true;
        const camX = Math.round(clamp(vx * T + T / 2 - CW / 2, 0, MAP_W * T - CW));
        const camY = Math.round(clamp(vy * T + T / 2 - CH / 2, 0, MAP_H * T - CH));
        const tx0 = Math.floor(camX / T), ty0 = Math.floor(camY / T);
        for (let ty = ty0; ty <= ty0 + VIEW_H; ty++) {
          for (let tx = tx0; tx <= tx0 + VIEW_W; tx++) {
            const ch = tileAt(tx, ty);
            if (window.HD) {
              HD.setScene(CUR_MAP_ID, tileAt);
              HD.blitTile(ctx, ch, tx * T - camX, ty * T - camY, tx, ty);
            }
            else ctx.drawImage(tiles[ch] || tiles.M, tx * T - camX, ty * T - camY);
          }
        }
        if (CUR_MAP_ID === "main") {
          HOUSES.forEach(function (hs) {
            const px = hs.x * T - camX, py = hs.y * T - camY;
            if (px > CW || py > CH || px < -64 || py < -48) return;
            if (window.HD) HD.drawHouse(ctx, hs.key, px, py);
            else if (atlas) drawPart(ctx, atlas, AT[hs.key], undefined, px, py + 1, 1, false);
            else for (let k = 0; k < 4; k++) { ctx.drawImage(tiles.roof, px + k * T, py); ctx.drawImage(tiles.roof, px + k * T, py + T); ctx.drawImage(tiles.wall, px + k * T, py + 2 * T); }
          });
        }
        if (window.HD) HD.drawDecor(ctx, CUR_MAP_ID, camX, camY, tick);
        function vis(x, y) { return x * T - camX > -40 && x * T - camX < CW + 24 && y * T - camY > -40 && y * T - camY < CH + 24; }
        activeNpcs(h.stage).forEach(function (n, i) {
          if (!n.sprite || !vis(n.x, n.y)) return;
          if (n.id === "remains" && h.stage >= 3) return;
          const fr = Math.floor(tick / 40 + i) % 2;
          if (window.HD && (n.sprite === "stele" || n.sprite === "remains")) {
            HD.drawProp(ctx, "stele", n.x * T - camX, n.y * T - camY + 16);
          } else if (window.HD) {
            HD.drawActor(ctx, n.sprite, "down", fr, n.x * T - camX + 8, n.y * T - camY + 16);
          } else {
            const r = AT[n.sprite];
            const rect = r ? [r[0], r[1] + fr * 16, 16, 16] : undefined;
            drawPart(ctx, atlas, rect, spr[n.sprite], n.x * T - camX, n.y * T - camY, 1, false);
          }
        });
        state.enemies.forEach(function (e, i) {
          if (!enemyActive(e, h.stage) || !vis(e.x, e.y)) return;
          const fr = Math.floor(tick / 14 + i) % 4;
          const isBeast = HUMAN_KINDS.indexOf(e.kind) < 0;
          if (window.HD) HD.drawActor(ctx, e.kind, h.x > e.x ? "left" : "right", fr, e.x * T - camX + 8, e.y * T - camY + 16);
          else {
            const size = enemySize(e.kind, atlas);
            drawPart(ctx, atlas, enemyRect(e.kind, fr), spr[e.kind], e.x * T + T / 2 - size / 2 - camX, e.y * T + T - size - camY, 1, isBeast && h.x > e.x);
          }
        });
        const hpx = vx * T - camX, hpy = vy * T - camY;
        const dirCol = h.dir === "down" ? 0 : h.dir === "up" ? 1 : h.dir === "left" ? 2 : 3;
        const hfr = moving ? Math.floor(tick / 6) % 4 : 0;
        if (window.HD) HD.drawActor(ctx, h.map === "pro" ? "hero_old" : "hero", h.dir, hfr, hpx + 8, hpy + 16);
        else drawPart(ctx, atlas, h.map === "pro" ? [128 + dirCol * 16, 280 + hfr * 16, 16, 16] : [dirCol * 16, hfr * 16, 16, 16], h.dir === "up" ? spr.hero_up : spr.hero_down, hpx, hpy, 1, false);
        if (!window.HD && h.map === "pro") { ctx.fillStyle = "rgba(70,0,24,0.30)"; ctx.fillRect(0, 0, CW, CH); }
        if (state.mode === "explore") {
          const adj = findAdjacent(h);
          let tx = -1, ty = -1;
          if (adj.npc) { tx = adj.npc.x; ty = adj.npc.y; }
          else if (adj.enemy) { tx = adj.enemy.x; ty = adj.enemy.y; }
          if (tx >= 0) {
            const bx = tx * T - camX + 4;
            const by = ty * T - camY - 8 - (Math.floor(tick / 20) % 2);
            ctx.fillStyle = "#1a1c2c"; ctx.fillRect(bx - 1, by - 1, 10, 8);
            ctx.fillStyle = adj.enemy ? "#c0394b" : "#f4f4f4";
            ctx.fillRect(bx, by, 8, 6); ctx.fillRect(bx + 3, by + 6, 2, 1);
            ctx.fillStyle = "#1a1c2c";
            if (adj.enemy) { ctx.fillRect(bx + 3, by + 1, 2, 3); ctx.fillRect(bx + 3, by + 5, 2, 1); }
            else { ctx.fillRect(bx + 1, by + 3, 1, 1); ctx.fillRect(bx + 3, by + 3, 2, 1); ctx.fillRect(bx + 6, by + 3, 1, 1); }
          }
        }
      }
      if (fadeRef > 0) {
        fadeRef -= 1;
        ctx.fillStyle = "rgba(255,255,255," + (fadeRef / 60).toFixed(2) + ")";
        ctx.fillRect(0, 0, CW, CH);
      }
      if (veil && veil.life > 0) {
        ctx.fillStyle = "rgba(" + veil.rgb + "," + (veil.life / veil.max).toFixed(2) + ")";
        ctx.fillRect(0, 0, CW, CH);
      }
    }
    requestAnimationFrame(frame);
  }

  function onAct(act, arg, ev) {
    if (act === "chapter") startChapter(Number(arg));
    else if (act === "continue") continueGame();
    else if (act === "interact") handleInteract();
    else if (act === "bag") { if (state.mode === "explore") { stopHold(); state.mode = "bag"; refresh(); } }
    else if (act === "attack") doAttack();
    else if (act === "flee") flee();
    else if (act === "sub") { if (state.battle && !state.battle.busy) { state.battle = Object.assign({}, state.battle, { sub: arg }); refresh(); } }
    else if (act === "cast") castGu(arg);
    else if (act === "item") battleItem(arg);
    else if (act === "feed") feed(arg);
    else if (act === "eat") eatHerb();
    else if (act === "absorb") absorbStones();
    else if (act === "buy") buy(arg);
    else if (act === "rest") rest();
    else if (act === "cultivate") cultivate();
    else if (act === "break") breakthrough();
    else if (act === "mode") { state.mode = arg; refresh(); }
    else if (act === "revive") revive();
    else if (act === "restart") startChapter(1);
    if (ev && ev.target && ev.target.blur) ev.target.blur();
  }

  function boot() {
    const app = document.getElementById("app");
    app.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-act]");
      if (!btn || btn.disabled) return;
      onAct(btn.dataset.act, btn.dataset.arg, e);
    });
    app.addEventListener("pointerdown", function (e) {
      const b = e.target.closest("[data-dir]");
      if (!b) return;
      startHold(b.dataset.dir, e);
    });
    window.addEventListener("pointerup", stopHold);
    window.addEventListener("pointercancel", stopHold);
    window.addEventListener("keydown", function (ev) {
      const k = ev.key;
      if (k === "ArrowUp" || k === "w" || k === "W") { ev.preventDefault(); moveHero("up"); }
      else if (k === "ArrowDown" || k === "s" || k === "S") { ev.preventDefault(); moveHero("down"); }
      else if (k === "ArrowLeft" || k === "a" || k === "A") { ev.preventDefault(); moveHero("left"); }
      else if (k === "ArrowRight" || k === "d" || k === "D") { ev.preventDefault(); moveHero("right"); }
      else if (k === "Enter" || k === " ") {
        if (ev.target && ev.target.closest && ev.target.closest("button")) return;
        if (state.mode === "explore" || state.mode === "dialogue") { ev.preventDefault(); handleInteract(); }
      } else if ((k === "b" || k === "B") && state.mode === "explore") {
        state.mode = "bag"; refresh();
      } else if (k === "Escape" && (state.mode === "bag" || state.mode === "shop" || state.mode === "home")) {
        state.mode = "explore"; refresh();
      }
    });
    document.addEventListener("touchmove", function (e) {
      if (e.target.closest && e.target.closest(".scroll") && !(e.target.closest("[data-dir]"))) return;
      e.preventDefault();
    }, { passive: false });
    document.addEventListener("gesturestart", function (e) { e.preventDefault(); });
    document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    window.addEventListener("resize", fitCanvas);
    atlasImg.onload = function () { state.atlasReady += 1; if (state.mode !== "title") refresh(); };
    atlasImg.src = "atlas.png";
    setInterval(function () { if (state.mode !== "title" && state.hero) saveGame("timer"); }, 15000);
    refresh();
    if (!loopOn) { loopOn = true; requestAnimationFrame(frame); }
  }

  window.GZ = {
    get mode() { return state.mode; },
    get hero() { return state.hero; },
    get battle() { return state.battle; },
    get dialogue() { return state.dialogue; },
    get toast() { return state.toast; },
    atlas: function () { return !!(atlasImg.complete && atlasImg.naturalWidth); },
    objective: objectiveText,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
