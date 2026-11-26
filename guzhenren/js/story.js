/* 鹿鼎记 opening arc: 扬州丽春院 through 擒鳌拜. Short lines, not the novel text. */
(function () {
  "use strict";

  const WHO = {
    narr: { name: "", face: null },
    wei: { name: "韦小宝", face: "wei" },
    mind: { name: "韦小宝", face: "wei", aside: true },
    mother: { name: "韦春花", face: "mother" },
    mao: { name: "茅十八", face: "mao" },
    salt: { name: "青帮老者", face: "salt" },
    thug: { name: "盐枭", face: "salt" },
    shi: { name: "史松", face: "shi" },
    wu: { name: "吴大鹏", face: "wu" },
    hai: { name: "海大富", face: "hai" },
    guizi: { name: "小桂子", face: "guizi" },
    xuan: { name: "小玄子", face: "kangxi" },
    kang: { name: "康熙", face: "kangxi" },
    ao: { name: "鳌拜", face: "aobai" },
    dow: { name: "皇太后", face: "dowager" },
    keeper: { name: "店小二", face: "salt" },
    ped: { name: "货郎", face: "wu" },
    guard: { name: "侍卫", face: "shi" },
  };

  const ITEMS = {
    lime: { name: "石灰", desc: "仙女桥边私盐帮吃过的亏。撒进眼里，英雄也睁不开眼。" },
    dagger: { name: "匕首", desc: "短，利，不讲规矩。韦小宝从地上捡起来的。", equip: 4 },
    golddagger: { name: "金柄匕首", desc: "康熙从书桌抽屉里取出，嘱咐藏进靴筒。", equip: 8 },
    sycee: { name: "元宝", desc: "茅十八说：哥儿俩你的就是我的。十两，已经兑成银子。" },
    note: { name: "银票", desc: "小玄子押的彩头。票面干净，比铜钱神气。" },
    drug: { name: "蒙汗药", desc: "入酒即倒。江湖人骂它下作，危急时却好用。" },
    pill: { name: "金创药", desc: "苦。止血。茅十八说少废话，敷上。", heal: 30 },
    bun: { name: "馒头", desc: "扬州街上三个铜板一个，垫得住。", heal: 14 },
    ash: { name: "香灰", desc: "上书房铜香炉里的细灰，比石灰更缠人。" },
    rope: { name: "牛筋绳", desc: "康熙预先藏好的。用来绑满洲第一勇士。" },
  };

  const SKILLS = {
    brawl: { name: "市井扭打", mp: 0, kind: "hit", mult: 1, learn: true, text: "矮身一钻，照着腰眼便撞。" },
    taunt: { name: "油嘴", mp: 0, kind: "taunt", learn: true, text: "骂得又快又损，对手怒得招式走形。" },
    grab: { name: "抱腿", mp: 0, kind: "stun", mult: 0.7, text: "一头钻到胯下，死死抱住双腿。" },
    dagger: { name: "匕首", mp: 0, kind: "hit", mult: 1.35, needEquip: true, text: "刀光一闪，专挑软处。" },
    lime: { name: "撒石灰", mp: 0, kind: "blind", item: "lime", consume: true, text: "白粉飞扬，直扑双眼。" },
    qin: { name: "大擒拿手", mp: 4, kind: "stun", mult: 1.05, learn: true, stun: 0.35, text: "扣住关节，往外一错。" },
    leaf: { name: "千叶手", mp: 6, kind: "stun", mult: 0.95, learn: true, stun: 0.4, text: "南海礼佛。掌势虚虚实实，点在穴上。" },
    empty: { name: "觉后空空", mp: 3, kind: "dodge", learn: true, text: "身形一晃，人已偏开。" },
    wrestle: { name: "摔跤", mp: 0, kind: "hit", mult: 1, text: "扭住胳膊，往地下赖。" },
    dodge: { name: "滑开", mp: 0, kind: "dodge", text: "市井里滚打出来的身法，一缩就没了。" },
    cheat: { name: "抓辫子", mp: 0, kind: "hit", mult: 1.6, flag: "cheated", text: "手一伸，揪住辫子往下按。不算英雄，可是有用。" },
    pill: { name: "金创药", mp: 0, kind: "heal", item: "pill", consume: true, heal: 30, text: "药粉撒上伤口，火辣辣地醒过来。" },
    drug: { name: "蒙汗药", mp: 0, kind: "stun", item: "drug", consume: true, text: "药粉扬起，对手眼前一黑。" },
    ash: { name: "撒香灰", mp: 0, kind: "blind", item: "ash", once: true, text: "香灰又细又黏，一入眼便散开。" },
    hold: { name: "众监抱腰", mp: 0, kind: "guard", uses: 4, text: "小太监们扳手攀臂，抱腰扯腿。" },
    furnace: { name: "砸香炉", mp: 0, kind: "heavy", needBlind: true, once: true, flat: 78, text: "跳上龙椅，青铜香炉对准后脑砸落。" },
    bind: { name: "牛筋绑上", mp: 0, kind: "finish", needBind: true, text: "康熙抽出牛筋。两人合力，把鳌拜手足绑住。" },
    bun: { name: "吃馒头", mp: 0, kind: "heal", item: "bun", consume: true, heal: 14, text: "就着唾沫咽下去，到底垫了点。" },
  };

  const LOCS = {
    mingyu: {
      name: "扬州·鸣玉坊", scene: "yangzhou", night: true, v: "鸣玉坊", map: "yangzhou",
      figures: [{ id: "wei", x: 0.34, y: 0.84, h: 0.3, pose: "stand" }],
      spots: [
        { id: "tea", x: 0.16, y: 0.4, label: "茶馆", go: "tea_gossip", unless: "teaHeard" },
        { id: "gate", x: 0.55, y: 0.34, label: "丽春院", go: "enter_lichun", unless: "raidDone" },
        { id: "bridge", x: 0.84, y: 0.6, label: "石桥", go: "bridge_look" },
        { id: "gate2", x: 0.55, y: 0.34, label: "回院里", go: "lichun_quiet", need: "raidDone", unless: "departed" },
      ],
    },
    lichun: {
      name: "丽春院", scene: "lichun", night: true, v: "丽春院", map: "yangzhou",
      figures: [
        { id: "mother", x: 0.62, y: 0.84, h: 0.34, pose: "stand" },
        { id: "wei", x: 0.36, y: 0.86, h: 0.28, pose: "stand" },
      ],
      spots: [
        { id: "feast", x: 0.5, y: 0.3, label: "筵席", go: "feast", unless: "raidDone" },
        { id: "mother", x: 0.84, y: 0.42, label: "娘", go: "mother_chat", unless: "raidDone" },
        { id: "door", x: 0.12, y: 0.44, label: "大门", go: "back_street", unless: "raidDone" },
      ],
    },
    desheng: {
      name: "得胜山", scene: "desheng", night: false, v: "得胜山", map: "yangzhou",
      figures: [
        { id: "mao", x: 0.58, y: 0.8, h: 0.4, pose: "stand" },
        { id: "wei", x: 0.32, y: 0.84, h: 0.28, pose: "stand" },
      ],
      spots: [
        { id: "shop", x: 0.14, y: 0.4, label: "镇口", go: "shop_town", unless: "shiWon" },
        { id: "wait", x: 0.84, y: 0.42, label: "等候", go: "wait_noon", need: "shopSeen", unless: "shiWon" },
      ],
    },
    inn: {
      name: "运河客栈", scene: "inn", night: false, v: "客栈", map: "road",
      figures: [
        { id: "mao", x: 0.6, y: 0.82, h: 0.38, pose: "sit" },
        { id: "wei", x: 0.36, y: 0.84, h: 0.28, pose: "stand" },
      ],
      spots: [],
    },
    beijing: {
      name: "北京·西城", scene: "beijing", night: false, v: "西城", map: "beijing",
      figures: [
        { id: "wei", x: 0.4, y: 0.84, h: 0.3, pose: "stand" },
        { id: "mao", x: 0.68, y: 0.8, h: 0.4, pose: "stand" },
      ],
      spots: [
        { id: "rumor", x: 0.16, y: 0.4, label: "茶座", go: "bj_rumor" },
        { id: "ped", x: 0.86, y: 0.44, label: "货郎", go: "bj_peddler", unless: "hasDrug" },
        { id: "tavern", x: 0.48, y: 0.34, label: "酒楼", go: "tavern_in", unless: "captured" },
      ],
    },
    tavern: {
      name: "西城酒楼", scene: "tavern", night: false, v: "酒楼", map: "beijing",
      figures: [
        { id: "salt", x: 0.72, y: 0.82, h: 0.38, pose: "stand" },
        { id: "wei", x: 0.3, y: 0.84, h: 0.28, pose: "stand" },
      ],
      spots: [],
    },
    hairoom: {
      name: "大内·尚膳监", scene: "hairoom", night: true, v: "尚膳监", map: "palace",
      figures: [
        { id: "hai", x: 0.62, y: 0.84, h: 0.36, pose: "hunch" },
        { id: "wei", x: 0.34, y: 0.86, h: 0.28, pose: "stand" },
      ],
      spots: [
        { id: "out", x: 0.2, y: 0.58, label: "廊下", go: "free_palace", need: "qinDone" },
      ],
    },
    palace: {
      name: "紫禁城", scene: "palace", night: false, v: "紫禁城", map: "palace",
      figures: [{ id: "wei", x: 0.42, y: 0.82, h: 0.3, pose: "stand" }],
      spots: [
        { id: "yard", x: 0.14, y: 0.38, label: "小院", go: "yard_meet", unless: "metXuan" },
        { id: "gamble", x: 0.88, y: 0.38, label: "偏屋", go: "gamble", unless: "gambled", need: "qinDone" },
        { id: "study", x: 0.5, y: 0.28, label: "上书房", go: "search_study", need: "knowEmperor", unless: "plan" },
        { id: "hai", x: 0.14, y: 0.52, label: "海老公", go: "hai_visit", need: "metXuan" },
      ],
    },
    courtyard: {
      name: "宫中小院", scene: "courtyard", night: false, v: "小院", map: "palace",
      figures: [
        { id: "kangxi", x: 0.62, y: 0.8, h: 0.36, pose: "stand" },
        { id: "wei", x: 0.34, y: 0.84, h: 0.28, pose: "guard" },
      ],
      spots: [
        { id: "back", x: 0.18, y: 0.58, label: "回去", go: "free_palace", need: "metXuan" },
      ],
    },
    study: {
      name: "上书房", scene: "study", night: false, v: "上书房", map: "palace",
      figures: [
        { id: "kangxi", x: 0.66, y: 0.82, h: 0.36, pose: "stand" },
        { id: "wei", x: 0.34, y: 0.84, h: 0.28, pose: "stand" },
      ],
      spots: [
        { id: "censer", x: 0.72, y: 0.36, label: "香炉", go: "get_ash", need: "plan", unless: "haveAsh" },
        { id: "book", x: 0.22, y: 0.34, label: "书架", go: "search_study", unless: "searched" },
        { id: "leave", x: 0.1, y: 0.48, label: "出门", go: "free_palace" },
      ],
    },
    ending: {
      name: "北京街市", scene: "ending", night: false, v: "京城", map: "beijing",
      figures: [{ id: "wei", x: 0.4, y: 0.82, h: 0.3, pose: "stand" }],
      spots: [],
    },
  };

  function q(s, title, detail, spot) {
    s.quest = { title: title, detail: detail, spot: spot || "" };
  }
  function once(s, flag, fn) {
    if (s.flags[flag]) return;
    s.flags[flag] = 1;
    fn();
  }

  const NODES = {
    intro: {
      loc: "mingyu",
      lines: [
        { s: "narr", t: "康熙初年。扬州瘦西湖畔，鸣玉坊华灯初上，丝竹和笑骂搅在一起。" },
        { s: "narr", t: "丽春院的韦小宝才十二三岁，整天在妓院、茶馆、赌场里钻进钻出。" },
        { s: "mind", t: "听说城西贴了榜，江洋大盗茅十八，赏银二千两。这热闹可得去听。" },
      ],
      next: "free_mingyu",
      onEnter: function (s) {
        s.known.yangzhou = true;
        s.flags.open_mingyu = 1;
        q(s, "鸣玉坊", "华灯初上。先到茶馆听白书，顺便打听榜文。", "tea");
      },
    },
    free_mingyu: {
      loc: "mingyu", explore: true,
      onEnter: function (s) {
        s.flags.open_mingyu = 1;
        if (!s.flags.teaHeard) q(s, "鸣玉坊", "茶馆里人声鼎沸，先去听听。", "tea");
        else if (!s.flags.raidDone) q(s, "回丽春院", "娘还在院子里。盐商们的筵席也摆上了。", "gate");
      },
    },
    tea_gossip: {
      loc: "mingyu",
      lines: [
        { s: "narr", t: "茶博士不赶他。韦小宝蹲在桌腿边，听人说茅十八越狱、杀官，扬州城都翻了。" },
        { s: "narr", t: "又有人压低声音：鳌拜是满洲第一勇士，北京街上曾一拳打死一头疯牛。朝政都在他手里。" },
        { s: "mind", t: "二千两我拿不动。一千两通风报信……妈的，英雄好汉可不干这个。" },
      ],
      next: "free_mingyu",
      onEnter: function (s) { s.flags.teaHeard = 1; },
    },
    bridge_look: {
      loc: "mingyu",
      lines: [
        { s: "narr", t: "石桥下的水又黑又亮。远处有人唱杜牧的句子，唱到青楼二字，院子里便笑。" },
        { s: "mind", t: "腰缠十万贯，骑鹤上扬州。我韦小宝如今是光杆，鹤也没有。" },
      ],
      next: "free_mingyu",
    },
    enter_lichun: {
      loc: "lichun",
      lines: [
        { s: "mother", t: "小宝！又死到哪里去了？厅上盐商们正请客，你少在人眼前晃。" },
        { s: "wei", t: "娘，我听书去了。茶博士说我嘴甜，赏了我一碟子瓜子。" },
      ],
      choices: [
        { t: "娘辛苦，明儿我给你买桂花糖。", go: "mother_soft" },
        { t: "那些盐商腰里全是银子，个个都是肥羊。", go: "mother_sharp" },
      ],
      onEnter: function (s) { s.flags.open_lichun = 1; },
    },
    mother_soft: {
      loc: "lichun",
      lines: [
        { s: "mother", t: "油嘴。糖我自己会买。今晚别闯祸，闯了祸娘可护不住你。" },
        { s: "mind", t: "她嘴上凶，手倒是把我衣襟拉正了。" },
      ],
      next: "free_lichun",
      onEnter: function (s) { s.flags.sweet = 1; },
    },
    mother_sharp: {
      loc: "lichun",
      lines: [
        { s: "mother", t: "肥羊也是会踢人的羊。你再去摸人家荷包，看我不打断你的腿。" },
        { s: "wei", t: "摸摸又不掉肉。掉的是他们的肉。" },
      ],
      next: "free_lichun",
    },
    free_lichun: {
      loc: "lichun", explore: true,
      onEnter: function (s) {
        q(s, "丽春院", "厅上正在大排筵席。东厢有人喝酒，门关着。", "feast");
      },
    },
    mother_chat: {
      loc: "lichun",
      lines: [
        { s: "mother", t: "看什么看。去，别站在盐商脚边，免得挨踢。" },
        { s: "wei", t: "有人踢我，我就咬他。" },
      ],
      next: "free_lichun",
    },
    back_street: { loc: "mingyu", explore: true, next: "free_mingyu", onEnter: function (s) { q(s, "鸣玉坊", "院子里的筵席还没散。", "gate"); } },
    lichun_quiet: {
      loc: "lichun",
      lines: [{ s: "narr", t: "丽春院的灯还亮着，人却散了。地上有血，有碎掉的椅脚。娘坐在门边，不说话。" }],
      next: "free_mingyu",
    },
    feast: {
      loc: "lichun",
      lines: [
        { s: "narr", t: "坊南坊北忽然一起吆喝：只找一个人，旁人别乱动。" },
        { s: "salt", t: "天地会的贾老六，今儿在瘦西湖骂我们贩私盐的没种。他人呢？" },
        { s: "narr", t: "东厢里一个粗嗓子笑：老子不姓贾。你们骂天地会，老子听着不顺耳。" },
        { s: "thug", t: "臭婊子笑什么？" },
        { s: "narr", t: "巴掌落在韦春花脸上。韦小宝从人腿缝里钻出来。" },
      ],
      choices: [
        { t: "你敢打我妈！出门就天打雷劈！", go: "feast_curse" },
        { t: "先躲到盐商身后，再找空子。", go: "feast_sly" },
      ],
    },
    feast_curse: {
      loc: "lichun",
      lines: [
        { s: "wei", t: "死乌龟烂王八！你私盐贩子家里盐多，腌肉都卖不出价钱！" },
        { s: "thug", t: "小杂种，我今日非打死你不可。" },
        { s: "narr", t: "拳头砸下来。韦小宝无路可退，一头撞开东厢的门。" },
      ],
      next: "east_room",
      onEnter: function (s) { s.flags.brave = 1; },
    },
    feast_sly: {
      loc: "lichun",
      lines: [
        { s: "mind", t: "硬扛是傻。从人胯下钻过去，门就在那边。" },
        { s: "narr", t: "他钻得快，还是被一脚踢得打转，跌进东厢。" },
      ],
      next: "east_room",
    },
    east_room: {
      loc: "lichun",
      figures: [
        { id: "mao", x: 0.62, y: 0.78, h: 0.38, pose: "guard" },
        { id: "wei", x: 0.34, y: 0.84, h: 0.28, pose: "guard" },
      ],
      lines: [
        { s: "narr", t: "床上坐着个虬髯大汉，满头白布，单刀舞得火星乱迸。两个盐枭已经躺下了。" },
        { s: "mao", t: "有种的进来打！" },
        { s: "mind", t: "这人站都站不稳，还在吓人。书上说，有难同当。" },
      ],
      choices: [
        { t: "冲上去，抱住那大汉的腿。", go: "salt_fight" },
        { t: "把掉在地上的刀踢给他。", go: "salt_fight" },
      ],
    },
    salt_fight: {
      loc: "lichun",
      lines: [{ s: "mao", t: "小孩，你闪远些！……也罢，一起来。" }],
      thenBattle: "salt",
    },
    lose_salt: {
      loc: "lichun",
      lines: [
        { s: "mao", t: "起来。盐枭的刀没长眼睛，你再躺着，真把你切了。" },
        { s: "wei", t: "辣块妈妈，腿软了一下。再来。" },
      ],
      thenBattle: "salt",
    },
    after_salt: {
      loc: "lichun",
      figures: [
        { id: "mao", x: 0.6, y: 0.8, h: 0.4, pose: "stand" },
        { id: "wei", x: 0.32, y: 0.84, h: 0.28, pose: "stand" },
      ],
      lines: [
        { s: "mao", t: "孩子，你去将门闩上了。" },
        { s: "wei", t: "咱们好朋友讲义气。有福同享，有难同当。" },
        { s: "mao", t: "这两句话，老子听过几千遍。有福共享的见得多，有难同当的，碰不到几个。" },
        { s: "narr", t: "盐枭抬着伤者逃走了。茅十八把一柄短刀塞进他手里：路上用得着。" },
      ],
      next: "to_hill",
      onEnter: function (s) {
        s.flags.raidDone = 1;
        once(s, "gotDagger", function () {
          s.p.inv.dagger = 1;
          s.p.equip = "dagger";
        });
      },
    },
    to_hill: {
      loc: "desheng",
      lines: [
        { s: "narr", t: "驴车出城。得胜山只是个小丘，南宋韩世忠曾在这里破金兵。" },
        { s: "mao", t: "柳树后面两个乌龟，给老子滚出来。" },
        { s: "narr", t: "跟踪的盐枭中了计。小孩哭得凄惨，人一近身，刀已经出去了。" },
        { s: "wei", t: "你两位见了阎王，谁回去通风报信啊？" },
      ],
      next: "hill_name",
      onEnter: function (s) {
        s.flags.open_desheng = 1;
        s.loc = "desheng";
      },
    },
    hill_name: {
      loc: "desheng",
      lines: [
        { s: "mao", t: "我姓茅，茅草之茅，不是毛虫之虫。排行第十八。茅十八便是我。" },
        { s: "wei", t: "榜文上的人！杀了你赏二千两，通风报信也有一千两。" },
        { s: "mao", t: "白花花的银子，谁不爱？你要去报，我也拦不住。" },
      ],
      choices: [
        { t: "出卖朋友还讲什么江湖义气？", go: "hill_loyal" },
        { t: "一千两……我娘能穿金戴银。可是我去报，我还是人吗？", go: "hill_loyal_late" },
      ],
    },
    hill_loyal: {
      loc: "desheng",
      lines: [
        { s: "mao", t: "好。明日午时，有两个朋友要来。死约会，不见不散。" },
        { s: "wei", t: "你身上有伤。我去镇口买吃的，也看看有没有能帮忙的东西。" },
      ],
      next: "hill_morn",
      onEnter: function (s) {
        s.flags.loyal = 1;
        once(s, "pillGift", function () { s.p.inv.pill = (s.p.inv.pill || 0) + 1; });
      },
    },
    hill_loyal_late: {
      loc: "desheng",
      lines: [
        { s: "mao", t: "心里过了一过，还是没去。这比张口就说漂亮话，更像朋友。" },
        { s: "wei", t: "别煽了。明日午时是吧？我陪你。" },
      ],
      next: "hill_morn",
      onEnter: function (s) { s.flags.loyal = 1; s.p.ji += 1; },
    },
    hill_morn: {
      loc: "desheng",
      lines: [
        { s: "mao", t: "哥儿俩，你的就是我的。这元宝拿去使，别说借。" },
        { s: "narr", t: "镇口有熟牛肉、黄酒、馒头。杂货铺一只缸里，是碎石灰。" },
        { s: "mind", t: "去年仙女桥，私盐帮被人撒了石灰，当场就败了。茅大哥腿上有伤……" },
      ],
      next: "free_desheng",
      onEnter: function (s) {
        once(s, "paid", function () {
          s.p.wen += 8000;
          s.p.inv.sycee = 1;
        });
        q(s, "镇口", "午时有人来比武。石灰在杂货铺，买不买随你。", "shop");
      },
    },
    free_desheng: {
      loc: "desheng", explore: true,
      onEnter: function (s) {
        if (!s.flags.shopSeen) q(s, "镇口", "先去杂货铺看看。石灰、伤药、馒头都有。", "shop");
        else q(s, "死约会", "吃饱了就在柳树下等。吴老爷子快到了。", "wait");
      },
    },
    shop_town: {
      loc: "desheng",
      shop: [
        { id: "lime", price: 800, once: true },
        { id: "pill", price: 500 },
        { id: "bun", price: 80 },
      ],
      leave: "after_shop",
    },
    after_shop: {
      loc: "desheng", explore: true,
      onEnter: function (s) {
        s.flags.shopSeen = 1;
        q(s, "得胜山", "回到柳树下。午时的人，该来了。", "wait");
      },
    },
    wait_noon: {
      loc: "desheng",
      lines: [
        { s: "narr", t: "大路上来了两个人。一个白须老者，面皮红润；一个秃头，后脑一条小辫。" },
        { s: "wu", t: "十八兄，别来好啊。" },
        { s: "mao", t: "这位吴老爷子，摩云手吴大鹏。这位王潭，双笔开山。小朋友姓韦，名小宝，江湖人称小白龙。" },
        { s: "mind", t: "水上功夫最了得？我连游泳池都没下过。西洋镜可拆不得。" },
        { s: "wu", t: "茅兄身上有伤。这场架，不如再推迟半年。" },
        { s: "mao", t: "推迟什么。今日非分胜负不可。" },
      ],
      next: "shi_come",
    },
    shi_come: {
      loc: "desheng",
      figures: [
        { id: "shi", x: 0.78, y: 0.78, h: 0.4, pose: "stand" },
        { id: "mao", x: 0.48, y: 0.8, h: 0.4, pose: "fight" },
        { id: "wei", x: 0.22, y: 0.84, h: 0.26, pose: "guard" },
      ],
      lines: [
        { s: "narr", t: "蹄声响。十余骑清兵围上来。为首的军官拍了拍腰间软鞭。" },
        { s: "shi", t: "在下黑龙鞭史松，奉鳌少保将令，擒拿天地会反贼。" },
        { s: "mao", t: "天地会的朋友当然是英雄好汉。为人不识陈近南，就称英雄也枉然。" },
        { s: "shi", t: "鳌少保天生神勇，一拳打死疯牛。凭你也配跟他动手？跟我们走。" },
        { s: "wu", t: "茅兄怎能见外。今日是以三敌十三。" },
        { s: "mind", t: "石灰在袋子里的话，这就是时候。没有的话，就只有挨打。" },
      ],
      thenBattle: "shisong",
    },
    lose_shi: {
      loc: "desheng",
      lines: [
        { s: "mao", t: "还没死？好。史松的鞭子再卷过来，你就往旁边滚，别充好汉。" },
        { s: "wei", t: "谁充好汉。我是小白龙。" },
      ],
      thenBattle: "shisong",
    },
    after_shi: {
      loc: "desheng",
      lines: [
        { s: "mao", t: "韦兄弟，这一刀是你捅的。吴老爷子，王兄，承你们拔刀。" },
        { s: "wu", t: "天父地母。茅兄原来不是天地会的人，却肯说陈总舵主的好话。" },
        { s: "mao", t: "我识不得陈近南。识不得，才要说。你们……真是会里的？" },
        { s: "wu", t: "宏化堂的小脚色。这句话，我带到陈总舵主耳朵里。山长水远，后会有期。" },
        { s: "mao", t: "你为何用石灰？这法子阴损得很。" },
      ],
      choices: [
        { t: "你要死了，我管它阴不阴损。", go: "quarrel" },
        { t: "下次我光明正大，用嘴咬。", go: "quarrel" },
      ],
      onEnter: function (s) { s.flags.shiWon = 1; },
    },
    quarrel: {
      loc: "desheng",
      lines: [
        { s: "mao", t: "我上北京。鳌拜自称满洲第一勇士，我不信，要去斗一斗。" },
        { s: "wei", t: "从扬州到北京千里路。你不敢带我，是怕我看见你向鳌拜叫饶命。" },
        { s: "mao", t: "谁说我打不过鳌拜！上来。一路上听我的，不许胡闹。" },
        { s: "wei", t: "老鬼头，你进监牢出监牢，杀官越狱，还说我胡闹。" },
        { s: "mao", t: "我说不过你。认输。走了。" },
      ],
      next: "road_talk",
      onEnter: function (s) {
        s.flags.departed = 1;
        s.flags.open_mingyu = 0;
        s.flags.open_lichun = 0;
        s.flags.open_desheng = 0;
        s.known.road = true;
      },
    },
    road_talk: {
      loc: "inn",
      lines: [
        { s: "narr", t: "两人共骑一马，沿运河北上。面馆里，韦小宝第一次跟人并排坐在桌边吃饭。" },
        { s: "keeper", t: "客官，面条来了。炒蛋要不要加？" },
        { s: "narr", t: "门外涌进十几个官面上的人，操云南口音，催着上酒上菜。" },
        { s: "mao", t: "小宝，你可知道世上最不要脸的是谁？" },
      ],
      choices: [
        { t: "吴三桂。一只乌龟是吴一龟，三只就是吴三龟。", go: "inn_provoke" },
        { t: "我不知道。低头吃面，免得找死。", go: "inn_quiet" },
      ],
      onEnter: function (s) { q(s, "北上", "北京还远。这客栈里的人，来路不正。", ""); },
    },
    inn_provoke: {
      loc: "inn",
      lines: [
        { s: "mao", t: "正是吴三桂这大汉奸，把江山双手送给鞑子。" },
        { s: "narr", t: "刀剑出鞘。桌子底下，韦小宝看清楚了：茅十八穿草鞋，其余的都是靴。" },
      ],
      thenBattle: "innfight",
    },
    inn_quiet: {
      loc: "inn",
      lines: [
        { s: "mind", t: "茅大哥想骂。我先踢他一脚，让他把「吴三龟」咽回去。" },
        { s: "narr", t: "那队人吃完就走，马蹄往北。一个货郎凑过来，袖子里有一小包白粉。" },
        { s: "ped", t: "小朋友，蒙汗药。旅途不太平，一两五钱，卖你个便宜。" },
      ],
      choices: [
        { t: "买下。危急时比讲义气有用。", go: "buy_drug" },
        { t: "趁他转身，摸走半包。", go: "steal_drug" },
        { t: "不要。这种东西坏名头。", go: "beijing_gate" },
      ],
    },
    buy_drug: {
      loc: "inn",
      lines: [{ s: "ped", t: "识货。别洒在自己酒里。" }],
      next: "beijing_gate",
      onEnter: function (s) {
        if (s.p.wen >= 1500 && !s.flags.hasDrug) {
          s.p.wen -= 1500;
          s.p.inv.drug = 1;
          s.flags.hasDrug = 1;
        }
      },
    },
    steal_drug: {
      loc: "inn",
      lines: [
        { s: "narr", t: "手指伸进袖子。货郎骂了声扬州猴子，拍开他的手，又或是没拍着。" },
      ],
      next: "beijing_gate",
      onEnter: function (s) {
        const ok = Math.random() < 0.45 + s.p.ji * 0.03;
        if (ok) {
          s.p.inv.drug = (s.p.inv.drug || 0) + 1;
          s.flags.hasDrug = 1;
          s.pendingToast = "摸到一包蒙汗药";
        } else {
          s.p.hp = Math.max(1, s.p.hp - 10);
          s.pendingToast = "被货郎拍了手";
        }
      },
    },
    lose_inn: {
      loc: "inn",
      lines: [{ s: "mao", t: "桌底的小鬼，刀口朝他们的脚。再来。" }],
      thenBattle: "innfight",
    },
    after_inn: {
      loc: "inn",
      lines: [
        { s: "narr", t: "亲兵逃走时掉了一小包药。韦小宝拈起来闻了闻，冲，是蒙汗药。" },
        { s: "mao", t: "收着。别对朋友用。" },
      ],
      next: "beijing_gate",
      onEnter: function (s) {
        once(s, "drugDrop", function () {
          s.p.inv.drug = (s.p.inv.drug || 0) + 1;
          s.flags.hasDrug = 1;
        });
      },
    },
    beijing_gate: {
      loc: "beijing", explore: true,
      onEnter: function (s) {
        s.known.beijing = true;
        s.flags.open_beijing = 1;
        if (!s.flags.captured) q(s, "天子脚下", "茅大哥要找鳌拜。先在西城酒楼歇脚。", "tavern");
      },
    },
    bj_rumor: {
      loc: "beijing",
      lines: [
        { s: "narr", t: "茶座上有人说：鳌拜欺凌幼主，顾命四大臣，如今只剩他的话算数。" },
        { s: "narr", t: "也有人摇头：宫里的事，市井别议论。上一回明史案，江南士子死了多少。" },
        { s: "mind", t: "扬州的榜文、北京的茶，说的是同一个人。茅大哥这架，不好打。" },
      ],
      next: "beijing_gate",
    },
    bj_peddler: {
      loc: "beijing",
      lines: [
        { s: "ped", t: "小哥儿眼生。蒙汗药，京城里的价，二两。要不要？" },
      ],
      choices: [
        { t: "二两就二两。买了揣好。", go: "bj_buy" },
        { t: "太贵。扬州货郎只要一两五。", go: "beijing_gate" },
      ],
    },
    bj_buy: {
      loc: "beijing", explore: true,
      onEnter: function (s) {
        if (!s.flags.hasDrug && s.p.wen >= 2000) {
          s.p.wen -= 2000;
          s.p.inv.drug = (s.p.inv.drug || 0) + 1;
          s.flags.hasDrug = 1;
        }
        q(s, "酒楼", "药有了更好。该进酒楼了。", "tavern");
      },
    },
    tavern_in: {
      loc: "tavern",
      lines: [
        { s: "narr", t: "酒楼里先进来一老一小。老太监脸色蜡黄，不住咳嗽，把药粉溶在酒里。" },
        { s: "narr", t: "跟着是七个满洲布库，油光赤膊，抓住酒保就往店外摔。" },
        { s: "mao", t: "摔跤的莽夫。跟这种人有什么好打。" },
        { s: "wei", t: "你一个人打得过他们七个？" },
      ],
      choices: [
        { t: "大声替茅大哥挑明：他一个打你们七个！", go: "tavern_loud" },
        { t: "踢茅大哥一脚，让他少说两句。", go: "tavern_quiet" },
      ],
    },
    tavern_loud: {
      loc: "tavern",
      lines: [
        { s: "narr", t: "茅十八酒壶砸出去，肘撞掌劈，转眼放倒四个。第七个抓住他的腰，却被双腿踢得吐血。" },
        { s: "mao", t: "小鬼头就会闯祸。快走。" },
        { s: "narr", t: "门口那病秧子老太监只一推。茅十八全身一震，穴道已经被封住了。" },
      ],
      next: "captured",
      onEnter: function (s) { s.flags.loud = 1; },
    },
    tavern_quiet: {
      loc: "tavern",
      lines: [
        { s: "narr", t: "话还是漏出去了。布库围上来，茅十八不得不打。打赢了人，没赢过那个咳嗽的老太监。" },
        { s: "narr", t: "一根筷子弹在韦小宝腿弯上。他骂到一半，后半句缩了回去。" },
      ],
      next: "captured",
    },
    captured: {
      loc: "hairoom",
      lines: [
        { s: "hai", t: "送到大内尚膳监。说是海老公要的人。" },
        { s: "guizi", t: "公公，人放在这儿了。" },
        { s: "mind", t: "这小太监叫小桂子。名字里有个小字，跟爷爷我一样。" },
        { s: "hai", t: "茅十八。扬州杀官越狱的那位？来京师，想干什么？" },
        { s: "mao", t: "鳌拜是不是满洲第一勇士，我要亲自试试。要杀要剐，随你。" },
        { s: "hai", t: "听说你是云南平西王的心腹亲信。" },
        { s: "mao", t: "谁跟吴三桂这大汉奸有干系！你这么说，污了我的名头。" },
      ],
      choices: [
        { t: "（低声）冒充吴三桂的人，说不定能活。", go: "hai_lie" },
        { t: "别劝。茅大哥要骨头，就让他硬。", go: "hai_hard" },
      ],
      onEnter: function (s) {
        s.flags.captured = 1;
        s.flags.open_beijing = 0;
        q(s, "尚膳监", "人在海大富手里。先活命。", "");
      },
    },
    hai_lie: {
      loc: "hairoom",
      lines: [
        { s: "wei", t: "茅大哥，好汉不吃眼前亏。先认个名头，出去再骂他十八代祖宗。" },
        { s: "mao", t: "出去是以后的事。眼下这句话，姓茅的说不出口。" },
        { s: "hai", t: "倒是个硬汉。小桂子，看着他们。" },
      ],
      next: "medicine",
    },
    hai_hard: {
      loc: "hairoom",
      lines: [
        { s: "mind", t: "我要是开口，他就更不肯认。算了。" },
        { s: "hai", t: "小桂子，药包拿来。咳……今天又过了量。" },
      ],
      next: "medicine",
    },
    medicine: {
      loc: "hairoom",
      lines: [
        { s: "narr", t: "海大富咳得跪倒，让小桂子扶他去水缸里浸。桌上酒杯、药包、一柄割绳子的匕首，都空着。" },
        { s: "mind", t: "他自个儿说，这药多半分就要命。小桂子每次只挑一点点。" },
      ],
      choices: [
        { t: "连挑几指甲，全倒进酒里。", go: "spiked" },
        { t: "手缩回来。下药的事，想想再做。", go: "hesitate" },
      ],
    },
    hesitate: {
      loc: "hairoom",
      lines: [
        { s: "narr", t: "水声响。海大富湿淋淋地出来，又是一阵咳，朝酒杯指了指。" },
        { s: "mind", t: "现在不下，一会儿他眼睛还亮着，我和茅大哥都走不脱。" },
      ],
      choices: [
        { t: "趁他咳嗽，把药抖进去。", go: "spiked" },
        { t: "翻倒杯子，装成手滑。", go: "spilled" },
      ],
    },
    spiked: {
      loc: "hairoom",
      lines: [{ s: "narr", t: "粉末溶进酒里，看不出多少。小桂子把杯子送到海大富嘴边。" }],
      next: "stab",
      onEnter: function (s) { s.flags.spiked = 1; },
    },
    spilled: {
      loc: "hairoom",
      lines: [
        { s: "narr", t: "杯子一翻，酒和药粉淌了一桌。海大富骂小桂子毛手毛脚，自己又舀着喝了剩的。" },
      ],
      next: "stab",
      onEnter: function (s) { s.flags.spiked = 1; },
    },
    stab: {
      loc: "hairoom",
      lines: [
        { s: "narr", t: "海大富喝干，忽然扑倒，满地打滚。小桂子扑上去叫公公，背心正对着床边。" },
        { s: "narr", t: "韦小宝拿起那柄匕首。一刀没入，小桂子低哼一声，再不出声。" },
        { s: "hai", t: "小……小桂子，这药不对啊。" },
        { s: "narr", t: "他抓住韦小宝的手腕，眼睛却对不准人。药毒积在瞳子里，他看不见了。" },
        { s: "mind", t: "他当我是小桂子。茅大哥，你先走。我多骗一刻是一刻。" },
        { s: "mao", t: "一起走。" },
        { s: "wei", t: "你腿不利落。出了这门再等我。快。" },
      ],
      next: "blind_night",
      onEnter: function (s) {
        s.p.disguise = true;
        s.flags.maoGone = 1;
      },
    },
    blind_night: {
      loc: "hairoom",
      figures: [
        { id: "hai", x: 0.64, y: 0.84, h: 0.36, pose: "hunch" },
        { id: "wei", x: 0.36, y: 0.86, h: 0.28, pose: "stand" },
      ],
      lines: [
        { s: "hai", t: "小桂子，公公眼睛瞎了。这世上只剩你照顾我。你不会走吧？" },
        { s: "wei", t: "公公待我好得很啊。我走去哪儿。" },
        { s: "hai", t: "把地上收拾干净。天一亮，你还是你。宫里没有第二个人知道。" },
        { s: "mind", t: "小桂子的衣服、鞋子、帽子，我都换上了。镜子没有，只好凭他那双瞎眼。" },
      ],
      next: "teach_qin",
    },
    teach_qin: {
      loc: "hairoom",
      lines: [
        { s: "hai", t: "从今日起，我教你大擒拿手。用来跟一个人摔跤，点到为止，不许真伤人。" },
        { s: "wei", t: "跟谁摔？宫里的小太监？" },
        { s: "hai", t: "你到了就知道。这门功夫再往下，是分筋错骨，用在那个人身上，是死罪。" },
        { s: "hai", t: "先把已教的三招使给我看。使错了，我就多拍你两下。" },
      ],
      thenBattle: "qin",
      onEnter: function (s) {
        s.p.arts.qin = s.p.arts.qin || 1;
        s.p.mpMax += 4;
        s.p.mp = s.p.mpMax;
        s.flags.open_hairoom = 1;
      },
    },
    after_qin_scold: {
      loc: "hairoom",
      lines: [
        { s: "hai", t: "懒。招式忘了一半。也罢，宫里用不着你真把人拆了。" },
        { s: "wei", t: "是是是。老猫鼻子上挂咸鱼——嗅鲞，休想。" },
      ],
      next: "free_palace",
    },
    after_qin: {
      loc: "hairoom",
      lines: [
        { s: "hai", t: "凑合。记住，跟那孩子扭打，可以输，不能下死手。" },
        { s: "narr", t: "门外有人叫小桂子。赌局已经开了，骰子声玎玲玲地响。" },
      ],
      next: "free_palace",
      onEnter: function (s) { s.flags.qinDone = 1; s.flags.open_palace = 1; },
    },
    free_palace: {
      loc: "palace", explore: true,
      onEnter: function (s) {
        s.flags.open_palace = 1;
        s.known.palace = true;
        if (!s.flags.metXuan) q(s, "紫禁城", "海老公叫你去小院。别把大擒拿手使真了。", "yard");
        else if (!s.flags.knowEmperor) q(s, "回尚膳监", "小玄子约了明日。先回去见海老公。", "hai");
        else if (!s.flags.searched) q(s, "四十二章经", "海老公要你在上书房里找一部经。", "study");
        else if (!s.flags.plan) q(s, "上书房", "皇上有大事。去上书房等他。", "study");
        else if (!s.flags.haveAsh) q(s, "香灰", "香炉在上书房。灰要事先抓一把。", "study");
      },
    },
    hai_visit: {
      loc: "hairoom",
      lines: [
        { s: "hai", t: "小玄子是谁，你还装不知道？" },
        { s: "wei", t: "一个爱摔跤的小孩，吃我的千层糕。" },
        { s: "hai", t: "小玄子就是皇上。我起始教你擒拿的时候，就知道了。" },
      ],
      next: "reveal_check",
    },
    gamble: {
      loc: "palace",
      lines: [
        { s: "narr", t: "偏屋里五六个小太监押大小。有人笑：小桂子今天不怎么小气。" },
        { s: "mind", t: "小桂子原是个常输的。我要是把骰子换了，赢太多，西洋镜就穿了。" },
      ],
      choices: [
        { t: "换一颗骰子，小赢一把就停。", go: "gamble_cheat" },
        { t: "老实押，输赢看天。", go: "gamble_fair" },
        { t: "不赌了。宫里的钱烫手。", go: "free_palace" },
      ],
      onEnter: function (s) { s.flags.gambled = 1; },
    },
    gamble_cheat: {
      loc: "palace", explore: true,
      onEnter: function (s) {
        once(s, "gamblePay", function () {
          s.p.wen += 2500;
          s.p.ji += 1;
        });
        q(s, "小院", "银子暖了荷包。小院里还有个小孩等着摔跤。", "yard");
      },
    },
    gamble_fair: {
      loc: "palace", explore: true,
      onEnter: function (s) {
        once(s, "gamblePay", function () {
          if (Math.random() < 0.5) s.p.wen += 800;
          else s.p.wen = Math.max(0, s.p.wen - 400);
        });
        q(s, "小院", "赌完了。去小院。", "yard");
      },
    },
    yard_meet: {
      loc: "courtyard",
      lines: [
        { s: "narr", t: "小院空着。一个比他略大的男孩正在偷点心，额头都是汗，像刚跟谁打过一架。" },
        { s: "xuan", t: "你叫什么名字？" },
        { s: "wei", t: "我叫小桂子。你呢？" },
        { s: "xuan", t: "我叫……小玄子。你是哪个公公手下的？" },
        { s: "wei", t: "我跟海老公。你偷点心的胆子不小，摔跤呢？" },
        { s: "xuan", t: "你没学过摔跤，手脚倒灵活。再打几个回合，你便输了。" },
      ],
      choices: [
        { t: "赌三两银子。输的付钱。", go: "wrestle_bet" },
        { t: "不赌钱。摔就摔。", go: "wrestle_plain" },
      ],
    },
    wrestle_bet: {
      loc: "courtyard",
      lines: [
        { s: "xuan", t: "好。大丈夫一言既出，马难追。" },
        { s: "mind", t: "是驷马。算了，他爱怎么说怎么说。" },
      ],
      thenBattle: "wrestle",
      onEnter: function (s) { s.flags.bet = 1; },
    },
    wrestle_plain: {
      loc: "courtyard",
      lines: [{ s: "xuan", t: "那就玩一玩。投不投降，等会儿再说。" }],
      thenBattle: "wrestle",
    },
    wrestle_win: {
      loc: "courtyard",
      lines: [
        { s: "xuan", t: "你这手下得贱，可是我压你不住。明天再来。" },
        { s: "wei", t: "死约会，不见不散。" },
      ],
      next: "after_wrestle",
    },
    wrestle_lose: {
      loc: "courtyard",
      lines: [
        { s: "xuan", t: "投不投降？" },
        { s: "wei", t: "死也不降。" },
        { s: "xuan", t: "哈哈，起来吧。明天还在这儿。" },
      ],
      next: "after_wrestle",
    },
    after_wrestle: {
      loc: "hairoom",
      lines: [
        { s: "hai", t: "你跟皇上摔过了？" },
        { s: "wei", t: "皇上？那小孩说他叫小玄子。" },
        { s: "hai", t: "小玄子就是皇上。以后大擒拿手不许往死里用。我另教你一门：大慈大悲千叶手。" },
        { s: "wei", t: "这名字怪。我只听过大慈大悲、救苦救难观世音菩萨。" },
        { s: "hai", t: "佛门功夫。能制住对方，却不杀人。第一手，叫南海礼佛。" },
        { s: "hai", t: "招式又多又烦。你记不全也罢，装个样子，够跟他拆。" },
      ],
      thenBattle: "leaf",
      onEnter: function (s) {
        s.flags.metXuan = 1;
        s.flags.knowEmperor = 1;
        s.p.arts.leaf = s.p.arts.leaf || 1;
        s.p.arts.empty = s.p.arts.empty || 1;
        s.p.mpMax += 6;
        s.p.mp = s.p.mpMax;
        if (s.flags.bet) {
          once(s, "betPay", function () {
            if (s.flags.won_wrestle) {
              s.p.inv.note = 1;
              s.p.wen += 3000;
            } else s.p.wen = Math.max(0, s.p.wen - 500);
          });
        }
        q(s, "千叶手", "海老公要看南海礼佛。点到为止。", "");
      },
    },
    after_leaf: {
      loc: "hairoom",
      lines: [
        { s: "hai", t: "够了。皇上若问，你就说尚膳监的小桂子只会伺候，不会武。" },
        { s: "hai", t: "还有一件事。宫里藏着一部四十二章经。你每日进上书房，替我找。" },
        { s: "mind", t: "找经。他教我武功，原来是要我当眼睛。" },
      ],
      next: "free_palace",
      onEnter: function (s) {
        s.flags.leafDone = 1;
        s.flags.open_study = 1;
        q(s, "四十二章经", "上书房里翻一翻。别让人看见你翻抽屉。", "study");
      },
    },
    after_leaf_scold: {
      loc: "hairoom",
      lines: [
        { s: "hai", t: "掌法像在赶苍蝇。也罢，去上书房，把四十二章经找出来。" },
      ],
      next: "free_palace",
      onEnter: function (s) {
        s.flags.leafDone = 1;
        s.flags.metXuan = 1;
        s.flags.knowEmperor = 1;
        s.flags.open_study = 1;
      },
    },
    search_study: {
      loc: "study",
      lines: [
        { s: "narr", t: "书架、抽屉、棋枰底下，都没有什么四十二章经。只有皇上的功课，和一只青铜香炉。" },
        { s: "kang", t: "小桂子，你鬼鬼祟祟找什么？" },
        { s: "wei", t: "侍候皇上。看看茶凉了没有。" },
        { s: "kang", t: "茶在那边。明日一早来，我有一件非同小可的事。" },
      ],
      choices: [
        { t: "回去跟海老公说：经我见着了，在一只金匣里。", go: "lie_book" },
        { t: "说实话：找遍了，没有。", go: "honest_book" },
      ],
      onEnter: function (s) { s.flags.searched = 1; },
    },
    lie_book: {
      loc: "hairoom",
      lines: [
        { s: "hai", t: "金匣？你摸到没有？" },
        { s: "wei", t: "摸到个角，皇上进来了，不敢再翻。" },
        { s: "hai", t: "……继续盯着。别把假话也当成功劳。" },
        { s: "mind", t: "这老乌龟耳朵灵。谎宜小，不宜圆。" },
      ],
      next: "kang_plan",
      onEnter: function (s) {
        s.flags.liedBook = 1;
        once(s, "lieSilver", function () { s.p.wen += 1000; });
      },
    },
    honest_book: {
      loc: "hairoom",
      lines: [
        { s: "hai", t: "没有？先帝把经藏得深。你肯说没有，比编一个金匣强。" },
        { s: "hai", t: "千叶手再记两招：镜里观影，水中捉月。记不住就罢。" },
      ],
      next: "kang_plan",
      onEnter: function (s) {
        s.flags.honestBook = 1;
        if ((s.p.arts.leaf || 1) < 3) s.p.arts.leaf = (s.p.arts.leaf || 1) + 1;
      },
    },
    kang_plan: {
      loc: "study",
      lines: [
        { s: "kang", t: "小桂子，我要你办一件事。你有没有胆子？" },
        { s: "wei", t: "你叫我办事，我还怕什么。最多我有性命之忧，你是皇帝，谁敢害你。" },
        { s: "kang", t: "鳌拜横蛮无礼，心有异谋。今日咱们要拿了他。你敢不敢？" },
        { s: "kang", t: "宫里侍卫多是他的人。我不能亲自动手。待会他来奏事，我茶盏一落地，你们便上。" },
        { s: "kang", t: "这柄金匕首收进靴筒。香炉里的灰，你先抓一把。牛筋我已经藏在抽屉里。" },
        { s: "wei", t: "好家伙。咱们干他的。" },
      ],
      next: "free_study",
      onEnter: function (s) {
        s.flags.plan = 1;
        once(s, "gotGold", function () {
          s.p.inv.golddagger = 1;
          s.p.equip = "golddagger";
          s.p.inv.rope = 1;
        });
        q(s, "擒鳌拜", "先抓一把香灰。茶盏落地，才是动手的时候。", "censer");
      },
    },
    free_study: {
      loc: "study", explore: true,
      onEnter: function (s) {
        if (!s.flags.haveAsh) q(s, "香灰", "香炉就在书案旁。抓一把，明日用。", "censer");
        else q(s, "等候", "出了上书房，在廊下等皇上传鳌少保。", "leave");
      },
    },
    get_ash: {
      loc: "study",
      lines: [
        { s: "narr", t: "香灰又细又轻，一握就从指缝里往外飘。他用手帕包了，塞进怀里。" },
        { s: "mind", t: "石灰是扬州的办法。香灰是宫里的办法。说到底，都是往眼睛里撒。" },
      ],
      next: "dawn",
      onEnter: function (s) {
        once(s, "haveAsh", function () { s.p.inv.ash = 1; });
        s.flags.haveAsh = 1;
      },
    },
    dawn: {
      loc: "study",
      lines: [
        { s: "kang", t: "十二个小太监在布库房练了几个月。赢了，每人五十两。输了，一齐斩首。" },
        { s: "narr", t: "他说得声不颤、手不抖。韦小宝手心里全是汗。" },
        { s: "guard", t: "鳌少保见驾。皇上万福金安。" },
        { s: "kang", t: "鳌少保进来。听说你是满洲勇士里武功第一，来指点他们几招。" },
        { s: "ao", t: "皇上有兴，臣自当效力。汉人的书，读了有什么用？" },
        { s: "kang", t: "小桂子，吩咐外面侍卫下去休息。" },
        { s: "narr", t: "茶盏举到唇边。韦小宝盯着那只杯子。" },
      ],
      thenBattle: "aobai",
    },
    lose_ao: {
      loc: "study",
      lines: [
        { s: "kang", t: "书桌底下还有地方。起来。茶盏可以再摔一次——在这儿，只有我们看见。" },
        { s: "wei", t: "辣块妈妈。鳌拜的拳头真像疯牛。再来。" },
      ],
      thenBattle: "aobai",
    },
    after_ao: {
      loc: "study",
      figures: [
        { id: "aobai", x: 0.7, y: 0.86, h: 0.42, pose: "down" },
        { id: "kangxi", x: 0.4, y: 0.8, h: 0.34, pose: "stand" },
        { id: "wei", x: 0.22, y: 0.84, h: 0.28, pose: "stand" },
      ],
      lines: [
        { s: "kang", t: "小桂子，真有你的。" },
        { s: "ao", t: "我是忠臣，我无罪！这般阴谋害我，我死也不服。" },
        { s: "wei", t: "你造反，带了刀子来上书房。背上有一把，手臂上有一把，还敢说没带刀？" },
        { s: "kang", t: "你们都瞧见了。鳌拜犯上作乱。宣康亲王杰书、索额图进来。" },
        { s: "narr", t: "鳌拜被押下去。康亲王办事很快，党羽一夜之间倒了大半。" },
        { s: "mind", t: "千叶手没用上几成。管用的是香灰，是香炉，是赖皮。小玄子倒不嫌我。" },
      ],
      next: "dowager",
      onEnter: function (s) { s.flags.aoDown = 1; },
    },
    dowager: {
      loc: "palace",
      figures: [
        { id: "dowager", x: 0.62, y: 0.8, h: 0.38, pose: "stand" },
        { id: "wei", x: 0.32, y: 0.84, h: 0.28, pose: "stand" },
      ],
      lines: [
        { s: "narr", t: "康熙自己进了太后寝宫，让小桂子在门外等。珠帘掀开时，他偷眼看了一下。" },
        { s: "dow", t: "听皇帝说，今日擒拿叛臣鳌拜，你立了好大的功劳。" },
        { s: "wei", t: "奴才该死，奴才只是听皇上的吩咐。" },
        { s: "dow", t: "好好的尽心办事。" },
        { s: "mind", t: "她眉头皱着。贵为太后，好像也有不开心的事。这宫里的水，比瘦西湖深。" },
      ],
      next: "cheer",
    },
    cheer: {
      loc: "ending",
      lines: [
        { s: "narr", t: "京城茶馆里都在说：擒住大奸臣鳌拜的，是一位十来岁的小公公。" },
        { s: "narr", t: "百姓鼓掌。韦小宝生平没受过这种荣耀，自己先笑了。" },
        { s: "mind", t: "海老公还等着四十二章经。天地会的陈近南，我还没见过。茅大哥不知走出宫没有。" },
        { s: "mind", t: "小玄子说我们是朋友。皇帝的朋友，不知道能当多久。" },
      ],
      next: "ending",
    },
    ending: {
      loc: "ending",
      ending: true,
      onEnter: function (s) {
        s.flags.cleared = 1;
        q(s, "未完", "鳌拜倒了。鹿还在别人手里。", "");
      },
    },
    reveal_check: {
      loc: "hairoom",
      lines: [
        { s: "hai", t: "知道了就好。千叶手还没教完，先回廊下待着，别到处说皇上跟你摔跤。" },
      ],
      next: "free_palace",
      onEnter: function (s) {
        if (!s.flags.metXuan) s.flags.metXuan = 1;
        s.flags.knowEmperor = 1;
      },
    },
  };

  const BATTLES = {
    salt: {
      name: "盐枭", title: "青帮汉子", face: "salt", scene: "lichun",
      hp: 42, atk: 9, def: 2, spd: 8,
      ally: { name: "茅十八", face: "mao", hp: 50, atk: 14, line: "茅十八单刀横扫，盐枭的肩骨应声一响。" },
      moves: [
        { name: "钢刀", mult: 1.1, text: "盐枭一刀劈来，刀风又直又狠。" },
        { name: "铁尺", mult: 0.85, text: "铁尺横砸，专敲不会躲的人。" },
      ],
      palette: ["brawl", "grab", "taunt", "pill"],
      win: "after_salt", lose: "lose_salt", exp: 22,
    },
    shisong: {
      name: "史松", title: "黑龙鞭", face: "shi", scene: "desheng",
      hp: 92, atk: 15, def: 4, spd: 12,
      ally: { name: "茅十八", face: "mao", hp: 64, atk: 13, line: "五虎断门刀挂住软鞭，茅十八骂一声好鞭法。" },
      moves: [
        { name: "玉带围腰", mult: 1.15, text: "黑龙鞭远远圈来，要把人钉在树上。" },
        { name: "白蛇吐信", mult: 1, text: "鞭梢一点，虚虚地探向肩头。" },
      ],
      palette: ["dagger", "brawl", "lime", "taunt", "pill", "bun"],
      win: "after_shi", lose: "lose_shi", exp: 32,
      onStart: function (rt, s) {
        if (!s.p.inv.lime) rt.ally.atk += 5;
      },
    },
    innfight: {
      name: "吴部亲兵", title: "平西王麾下", face: "shi", scene: "inn",
      hp: 70, atk: 12, def: 3, spd: 10,
      ally: { name: "茅十八", face: "mao", hp: 60, atk: 14, line: "茅十八坐在凳上出刀，骂他们是小汉奸。" },
      moves: [
        { name: "乱刀", mult: 1, text: "好几柄刀同时往桌边砍。" },
        { name: "掀桌", mult: 1.2, text: "桌子翻起来，碗筷汤面一齐飞。" },
      ],
      palette: ["dagger", "brawl", "taunt", "drug", "pill"],
      win: "after_inn", lose: "lose_inn", exp: 26,
    },
    qin: {
      name: "海大富", title: "试招", face: "hai", scene: "hairoom",
      hp: 160, atk: 8, def: 3, spd: 7,
      nonlethal: true,
      goal: { skill: "qin", n: 3 },
      maxTurns: 8,
      moves: [{ name: "拍肩", mult: 0.55, text: "海大富只拍你肩头，像在问你是不会，还是不肯。" }],
      palette: ["qin", "brawl", "taunt"],
      win: "after_qin", lose: "after_qin_scold", exp: 16,
    },
    leaf: {
      name: "海大富", title: "千叶手", face: "hai", scene: "hairoom",
      hp: 180, atk: 9, def: 4, spd: 8,
      nonlethal: true,
      goal: { skill: "leaf", n: 3 },
      maxTurns: 8,
      moves: [{ name: "点穴", mult: 0.6, text: "他出手如风，又收回去，只让你知道差了半寸。" }],
      palette: ["leaf", "qin", "empty", "brawl"],
      win: "after_leaf", lose: "after_leaf_scold", exp: 18,
    },
    wrestle: {
      name: "小玄子", title: "摔跤", face: "kangxi", scene: "courtyard",
      hp: 58, atk: 10, def: 3, spd: 11,
      nonlethal: true,
      moves: [
        { name: "压背", mult: 1, text: "小玄子扭住你的胳膊，把你往下压。" },
        { name: "绊脚", mult: 0.9, text: "他脚下一勾，你差点趴下。" },
      ],
      palette: ["wrestle", "dodge", "taunt", "cheat"],
      win: "wrestle_win", lose: "wrestle_lose", exp: 20,
    },
    aobai: {
      name: "鳌拜", title: "满洲第一勇士", face: "aobai", scene: "study",
      hp: 250, atk: 18, def: 8, spd: 13,
      survive: true,
      moves: [],
      palette: ["dagger", "leaf", "ash", "hold", "furnace", "bind", "drug", "pill"],
      win: "after_ao", lose: "lose_ao", exp: 48,
    },
  };

  window.LDJData = { WHO: WHO, ITEMS: ITEMS, SKILLS: SKILLS, LOCS: LOCS, NODES: NODES, BATTLES: BATTLES };
})();
