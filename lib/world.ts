import type { Archetype, Locale, PlayerState } from "./game";

export type StatEffects = { resources: number; power: number; health: number; influence: number; reputation: number; trust: number; threat: number; halo: number };
export type ViewEffects = { trust: number; cooperation: number; order: number; risk: number; mercy: number };
export type WorldLocation = { id: string; name: Record<Locale, string>; x: number; y: number; terrain: Record<Locale, string> };
export type MonthlyEvent = {
  id: string;
  seedId: string;
  tier: number;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  choice: Record<Locale, string>;
  polarity: "fortune" | "peril" | "mixed";
  category: string;
  rarity: number;
  regionId: string;
  baseEffects: StatEffects;
  worldviewEffects: ViewEffects;
  tags: string[];
};

export const locations: WorldLocation[] = [
  { id: "canglan", name: { zh: "沧澜港", en: "Canglan Port" }, x: 12, y: 72, terrain: { zh: "海港与商路", en: "harbor and trade routes" } },
  { id: "chixiao", name: { zh: "赤霄岭", en: "Chixiao Ridge" }, x: 24, y: 19, terrain: { zh: "火山山脉", en: "volcanic mountains" } },
  { id: "qinghe", name: { zh: "清河城", en: "Qinghe City" }, x: 34, y: 58, terrain: { zh: "河谷大城", en: "river-valley city" } },
  { id: "beiming", name: { zh: "北冥原", en: "Beiming Steppe" }, x: 48, y: 9, terrain: { zh: "寒原与古战场", en: "frozen steppe and old battlefields" } },
  { id: "yunmeng", name: { zh: "云梦泽", en: "Yunmeng Marsh" }, x: 55, y: 78, terrain: { zh: "雾泽与灵药", en: "mist marsh and spirit herbs" } },
  { id: "tianji", name: { zh: "天机台", en: "Tianji Terrace" }, x: 65, y: 43, terrain: { zh: "学宫与机关城", en: "academies and artificer halls" } },
  { id: "huangsha", name: { zh: "黄沙关", en: "Yellow Sand Pass" }, x: 79, y: 67, terrain: { zh: "荒漠边关", en: "desert frontier" } },
  { id: "xuanming", name: { zh: "玄溟海", en: "Xuanming Sea" }, x: 90, y: 29, terrain: { zh: "群岛与深海遗迹", en: "islands and drowned ruins" } },
  { id: "wuliang", name: { zh: "无量山", en: "Wuliang Mountain" }, x: 42, y: 36, terrain: { zh: "宗门林立", en: "sect-held mountains" } },
  { id: "luori", name: { zh: "落日墟", en: "Sunset Ruins" }, x: 71, y: 18, terrain: { zh: "破碎古城", en: "shattered ancient city" } },
  { id: "jingdu", name: { zh: "镜都", en: "Mirror Capital" }, x: 18, y: 40, terrain: { zh: "王朝中枢", en: "imperial capital" } },
  { id: "guixu", name: { zh: "归墟眼", en: "Guixu Eye" }, x: 88, y: 86, terrain: { zh: "世界裂隙", en: "world rift" } }
];

type EventSeed = Omit<MonthlyEvent, "id" | "tier" | "title" | "description" | "regionId" | "baseEffects" | "worldviewEffects"> & {
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  effects: Partial<StatEffects>;
  views?: Partial<ViewEffects>;
};

const zeroStats: StatEffects = { resources: 0, power: 0, health: 0, influence: 0, reputation: 0, trust: 0, threat: 0, halo: 0 };
const zeroViews: ViewEffects = { trust: 0, cooperation: 0, order: 0, risk: 0, mercy: 0 };

const seeds: EventSeed[] = [
  { seedId: "manual", title: { zh: "残卷认主", en: "The Broken Manual" }, description: { zh: "一卷无人看懂的残篇在你手中显出第二层文字。", en: "A discarded manual reveals a second layer of text in your hands." }, choice: { zh: "独自参悟、找人补全，还是卖掉？", en: "Study it alone, seek help, or sell it?" }, polarity: "fortune", category: "inheritance", rarity: 7, effects: { power: 5, halo: 1 }, views: { risk: 1 }, tags: ["功法", "传承"] },
  { seedId: "mentor", title: { zh: "过路高人", en: "The Passing Master" }, description: { zh: "一名重伤的老修士看出了你的根骨，也看出了你的麻烦。", en: "A wounded master notices both your talent and your trouble." }, choice: { zh: "救人、拜师，还是先问清代价？", en: "Help, ask for training, or demand the price first?" }, polarity: "fortune", category: "mentor", rarity: 6, effects: { power: 4, reputation: 2 }, views: { trust: 1 }, tags: ["师徒", "人情"] },
  { seedId: "herb", title: { zh: "天材地宝", en: "Spirit Herb" }, description: { zh: "山涧里长着一株即将成熟的灵药，附近已有妖兽留下气味。", en: "A rare herb is about to ripen beside tracks left by a spirit beast." }, choice: { zh: "抢先采摘、设局守候，还是离开？", en: "Take it now, set an ambush, or walk away?" }, polarity: "fortune", category: "treasure", rarity: 8, effects: { health: 4, resources: 3 }, views: { risk: 1 }, tags: ["灵药", "争夺"] },
  { seedId: "beast", title: { zh: "灵兽择主", en: "A Spirit Beast Chooses" }, description: { zh: "一只幼年灵兽甩开追兵，躲进了你的行囊。", en: "A young spirit beast escapes its hunters and hides in your pack." }, choice: { zh: "收留、交还，还是借它引开追兵？", en: "Keep it, return it, or use it to misdirect the hunters?" }, polarity: "fortune", category: "companion", rarity: 6, effects: { power: 2, reputation: 3, threat: 2 }, views: { mercy: 1 }, tags: ["灵兽", "追兵"] },
  { seedId: "windfall", title: { zh: "商路暴利", en: "Trade Route Windfall" }, description: { zh: "两地价格突然倒挂，消息还没有传开。", en: "Prices diverge sharply between two cities, and the news has not spread." }, choice: { zh: "重仓、拉人合伙，还是只赚一笔就走？", en: "Commit heavily, bring in partners, or take one quick profit?" }, polarity: "fortune", category: "commerce", rarity: 10, effects: { resources: 6, influence: 2 }, views: { cooperation: 1 }, tags: ["商战", "情报"] },
  { seedId: "gratitude", title: { zh: "旧恩回响", en: "An Old Favor Returns" }, description: { zh: "你曾顺手救过的人带着家族信物找上门。", en: "Someone you once saved returns with a family seal." }, choice: { zh: "接受回报、换取人情，还是推辞？", en: "Take the reward, bank the favor, or decline?" }, polarity: "fortune", category: "social", rarity: 9, effects: { influence: 4, reputation: 4, trust: 2 }, views: { trust: 1 }, tags: ["人情", "家族"] },
  { seedId: "selection", title: { zh: "宗门开山", en: "Sect Recruitment" }, description: { zh: "大宗门十年一次收徒，名额不多，规矩不少。", en: "A major sect recruits once a decade. Seats are scarce and rules are strict." }, choice: { zh: "按规矩应试、另辟门路，还是拒绝加入？", en: "Take the trial, find another route, or refuse to join?" }, polarity: "fortune", category: "sect", rarity: 8, effects: { power: 3, influence: 3 }, views: { order: 1 }, tags: ["宗门", "试炼"] },
  { seedId: "cache", title: { zh: "洞府余藏", en: "Hidden Cave Cache" }, description: { zh: "坍塌的山壁后露出一间无主洞府，禁制还在运转。", en: "A landslide reveals an ownerless cave dwelling with active wards." }, choice: { zh: "破阵、等人探路，还是封锁消息？", en: "Break the ward, send a scout, or bury the news?" }, polarity: "fortune", category: "ruin", rarity: 7, effects: { resources: 4, power: 3, threat: 1 }, views: { risk: 1 }, tags: ["洞府", "阵法"] },
  { seedId: "craft", title: { zh: "技艺破关", en: "Craft Breakthrough" }, description: { zh: "困扰你多日的炼器或炼丹难题忽然有了答案。", en: "A stubborn crafting problem finally gives way." }, choice: { zh: "公开方法、批量生产，还是留作底牌？", en: "Publish it, scale production, or keep it secret?" }, polarity: "fortune", category: "craft", rarity: 10, effects: { resources: 3, influence: 3, power: 2 }, views: { cooperation: 1 }, tags: ["炼器", "炼丹"] },
  { seedId: "bloodline", title: { zh: "血脉苏醒", en: "Bloodline Awakening" }, description: { zh: "一次高烧后，你体内出现了陌生而强劲的力量。", en: "After a violent fever, an unfamiliar power wakes in your body." }, choice: { zh: "立即试用、查明来源，还是设法压制？", en: "Test it, investigate it, or suppress it?" }, polarity: "fortune", category: "awakening", rarity: 4, effects: { power: 7, health: -1, threat: 2 }, views: { risk: 1 }, tags: ["血脉", "觉醒"] },
  { seedId: "assassin", title: { zh: "夜半杀局", en: "Midnight Assassins" }, description: { zh: "窗纸刚响，你已经闻到淬毒弩箭的气味。", en: "The paper window rustles; the crossbow bolts smell poisoned." }, choice: { zh: "正面迎敌、遁走，还是反追雇主？", en: "Fight, flee, or trace the employer?" }, polarity: "peril", category: "attack", rarity: 9, effects: { health: -5, threat: 4, power: 1 }, views: { trust: -1 }, tags: ["刺杀", "追查"] },
  { seedId: "betrayal", title: { zh: "亲信倒戈", en: "A Trusted Hand Defects" }, description: { zh: "掌握你行踪的人把密信送给了对手。", en: "Someone with access to your movements sends a cipher to a rival." }, choice: { zh: "抓人、放长线，还是假装不知？", en: "Arrest them, run a counterplot, or pretend not to know?" }, polarity: "peril", category: "betrayal", rarity: 7, effects: { trust: -4, influence: -2, threat: 3 }, views: { trust: -2 }, tags: ["背叛", "内鬼"] },
  { seedId: "deviation", title: { zh: "走火入魔", en: "Cultivation Backlash" }, description: { zh: "经脉在突破关口逆行，旧伤一起发作。", en: "Your meridians reverse at the breakthrough, reopening old wounds." }, choice: { zh: "强行突破、散功保命，还是求医？", en: "Force the breakthrough, abandon progress, or seek a healer?" }, polarity: "peril", category: "cultivation", rarity: 8, effects: { health: -6, power: -2, threat: 1 }, views: { risk: -1 }, tags: ["修炼", "反噬"] },
  { seedId: "horde", title: { zh: "兽潮压境", en: "Beast Tide" }, description: { zh: "迁徙兽群冲向有人烟的山口，守军已经开始溃散。", en: "A migrating beast horde reaches a settled pass as defenders break." }, choice: { zh: "守城、护送撤离，还是趁乱取利？", en: "Hold the pass, escort civilians, or profit from the chaos?" }, polarity: "peril", category: "disaster", rarity: 7, effects: { health: -3, resources: -3, reputation: 2 }, views: { mercy: 1 }, tags: ["兽潮", "守城"] },
  { seedId: "plague", title: { zh: "城中怪疫", en: "Strange Plague" }, description: { zh: "一场怪病封住城门，药价一夜翻了十倍。", en: "A strange illness seals the city and medicine prices rise tenfold." }, choice: { zh: "救治、囤药，还是离城避险？", en: "Treat the sick, hoard medicine, or leave?" }, polarity: "peril", category: "plague", rarity: 8, effects: { health: -3, resources: -4, reputation: 1 }, views: { mercy: 1 }, tags: ["疫病", "药材"] },
  { seedId: "framed", title: { zh: "栽赃通缉", en: "Framed and Hunted" }, description: { zh: "城门贴出了你的画像，罪名证据齐全，唯独不是你做的。", en: "Your portrait appears at the gate beside convincing evidence of a crime you did not commit." }, choice: { zh: "自证、逃亡，还是反向利用通缉？", en: "Clear your name, run, or use the warrant as cover?" }, polarity: "peril", category: "law", rarity: 8, effects: { reputation: -5, threat: 5, influence: -2 }, views: { order: -1 }, tags: ["通缉", "冤案"] },
  { seedId: "robbery", title: { zh: "强者截道", en: "Roadside Extortion" }, description: { zh: "成名已久的强者拦路索要你一半身家。", en: "A famous cultivator blocks the road and demands half your wealth." }, choice: { zh: "交钱、决斗，还是设法让他惹上更强的人？", en: "Pay, duel, or redirect a stronger enemy toward them?" }, polarity: "peril", category: "conflict", rarity: 10, effects: { resources: -5, power: 1, threat: 3 }, views: { risk: 1 }, tags: ["拦路", "强敌"] },
  { seedId: "purge", title: { zh: "宗门清洗", en: "Sect Purge" }, description: { zh: "派系斗争失控，与你有过来往的人被连夜带走。", en: "Factional conflict spills over; your contacts disappear overnight." }, choice: { zh: "站队、救人，还是切断一切联系？", en: "Choose a faction, rescue contacts, or sever every tie?" }, polarity: "peril", category: "politics", rarity: 6, effects: { influence: -4, trust: -3, threat: 4 }, views: { order: -1 }, tags: ["宗门", "派系"] },
  { seedId: "debt", title: { zh: "灵契陷阱", en: "Spirit Contract Trap" }, description: { zh: "你签过的小契约被人层层转卖，如今利息比本金更高。", en: "A minor contract you signed has been resold until the interest exceeds the principal." }, choice: { zh: "还债、毁约，还是追查契约链？", en: "Pay, break the contract, or trace the chain of owners?" }, polarity: "peril", category: "contract", rarity: 9, effects: { resources: -5, reputation: -1, threat: 2 }, views: { trust: -1 }, tags: ["契约", "债务"] },
  { seedId: "quake", title: { zh: "地脉翻身", en: "The Earth Vein Turns" }, description: { zh: "地脉震动撕开道路，也把埋藏的东西推到地面。", en: "An earth-vein quake breaks the road and pushes buried things to the surface." }, choice: { zh: "救灾、寻宝，还是抢占安全地带？", en: "Aid survivors, search the breach, or secure high ground?" }, polarity: "peril", category: "disaster", rarity: 8, effects: { health: -2, resources: -3, halo: 1 }, views: { cooperation: 1 }, tags: ["地震", "异变"] },
  { seedId: "auction", title: { zh: "拍卖会暗标", en: "Sealed Auction" }, description: { zh: "压轴拍品与你需要的东西有关，场内至少三方知道它的价值。", en: "The final lot matters to you, and at least three bidders know why." }, choice: { zh: "竞价、联手，还是让别人先抢？", en: "Bid, form a buying pact, or let someone else seize it?" }, polarity: "mixed", category: "auction", rarity: 10, effects: { resources: -2, power: 3, influence: 1 }, views: { trust: 1 }, tags: ["拍卖", "博弈"] },
  { seedId: "realm", title: { zh: "秘境开门", en: "Secret Realm Opens" }, description: { zh: "只开放七日的秘境出现了，入口周围已经挤满各路人马。", en: "A secret realm opens for seven days, and every faction crowds its gate." }, choice: { zh: "组队、独行，还是在入口做生意？", en: "Join a team, enter alone, or trade at the gate?" }, polarity: "mixed", category: "exploration", rarity: 7, effects: { power: 3, resources: 2, health: -2 }, views: { cooperation: 1, risk: 1 }, tags: ["秘境", "组队"] },
  { seedId: "alliance", title: { zh: "联姻请柬", en: "Alliance Proposal" }, description: { zh: "一个势力愿意用婚约和资源换你的长期站队。", en: "A faction offers marriage and resources in exchange for long-term loyalty." }, choice: { zh: "接受、谈条件，还是当众拒绝？", en: "Accept, negotiate, or refuse in public?" }, polarity: "mixed", category: "alliance", rarity: 8, effects: { resources: 3, influence: 3, trust: -1 }, views: { cooperation: 1, order: 1 }, tags: ["联姻", "势力"] },
  { seedId: "rebellion", title: { zh: "城中兵变", en: "City Mutiny" }, description: { zh: "守军扣下俸饷，士卒推举你主持公道。", en: "Officers withhold pay and soldiers ask you to settle the dispute." }, choice: { zh: "调停、支持兵变，还是替官府镇压？", en: "Mediate, back the mutiny, or suppress it for the court?" }, polarity: "mixed", category: "politics", rarity: 7, effects: { influence: 3, threat: 3, reputation: 1 }, views: { order: 1, mercy: 1 }, tags: ["兵变", "权谋"] },
  { seedId: "challenge", title: { zh: "同代约战", en: "A Rival's Challenge" }, description: { zh: "同辈强者公开约战，拒绝不会受伤，但会被议论很久。", en: "A peer challenges you in public. Refusal is safe, but people will remember." }, choice: { zh: "应战、改规则，还是拒绝？", en: "Fight, change the terms, or refuse?" }, polarity: "mixed", category: "rivalry", rarity: 10, effects: { power: 2, health: -2, reputation: 2 }, views: { risk: 1 }, tags: ["约战", "声望"] },
  { seedId: "hostage", title: { zh: "仇家幼子", en: "The Enemy's Child" }, description: { zh: "仇家的幼子落入你手中，他并未参与旧事。", en: "An enemy's child falls into your hands and had no part in the old feud." }, choice: { zh: "放人、交换，还是斩草除根？", en: "Release, trade, or remove the future threat?" }, polarity: "mixed", category: "morality", rarity: 8, effects: { reputation: 2, threat: 1, trust: 1 }, views: { mercy: 2 }, tags: ["复仇", "选择"] },
  { seedId: "forbidden", title: { zh: "禁术捷径", en: "Forbidden Shortcut" }, description: { zh: "一门禁术能让你短期暴涨，代价写得含糊。", en: "A forbidden art promises rapid power, while its price is deliberately vague." }, choice: { zh: "修炼、研究破解，还是销毁？", en: "Use it, study its flaw, or destroy it?" }, polarity: "mixed", category: "cultivation", rarity: 6, effects: { power: 6, health: -4, threat: 3 }, views: { risk: 2 }, tags: ["禁术", "代价"] },
  { seedId: "dispute", title: { zh: "宝物归属", en: "A Disputed Treasure" }, description: { zh: "你和陌生人同时发现宝物，谁先看到已经说不清了。", en: "You and a stranger discover the same treasure. No one can prove who saw it first." }, choice: { zh: "平分、竞价，还是抢？", en: "Split it, bid for it, or take it by force?" }, polarity: "mixed", category: "conflict", rarity: 10, effects: { resources: 3, trust: -1, threat: 1 }, views: { cooperation: 1 }, tags: ["宝物", "冲突"] },
  { seedId: "war", title: { zh: "边关征召", en: "Frontier Draft" }, description: { zh: "边关告急，各方按实力征召人手，军功可以换资源。", en: "The frontier calls for fighters, with resources offered for military merit." }, choice: { zh: "参战、出资，还是避开征召？", en: "Fight, fund the defense, or avoid the draft?" }, polarity: "mixed", category: "war", rarity: 8, effects: { power: 2, reputation: 3, health: -2 }, views: { order: 1 }, tags: ["战争", "军功"] },
  { seedId: "prophecy", title: { zh: "天机批命", en: "A Dangerous Prophecy" }, description: { zh: "术士说你十年内会改朝换代，旁听者已经把话传了出去。", en: "A diviner says you will overturn a dynasty within ten years, and witnesses spread the claim." }, choice: { zh: "承认、否认，还是让预言为你所用？", en: "Accept it, deny it, or turn the rumor to your advantage?" }, polarity: "mixed", category: "fate", rarity: 5, effects: { influence: 3, threat: 5, halo: 1 }, views: { order: -1 }, tags: ["预言", "天命"] }
];

const tiers = [
  { zh: "微澜", en: "Minor", scale: 0.65, rarity: 1.4 },
  { zh: "转折", en: "Turning", scale: 1, rarity: 1 },
  { zh: "大势", en: "Major", scale: 1.55, rarity: 0.55 },
  { zh: "天命", en: "Fated", scale: 2.25, rarity: 0.22 }
];

function scaled<T extends Record<string, number>>(base: T, scale: number): T {
  return Object.fromEntries(Object.entries(base).map(([key, value]) => [key, Math.round(value * scale)])) as T;
}

export const eventPool: MonthlyEvent[] = seeds.flatMap((seed, seedIndex) => tiers.map((tier, index) => {
  const location = locations[(seedIndex * 3 + index * 5) % locations.length];
  return {
    ...seed,
    id: `${seed.seedId}-t${index + 1}`,
    tier: index + 1,
    title: { zh: `${tier.zh}·${seed.title.zh}`, en: `${tier.en}: ${seed.title.en}` },
    description: { zh: `${seed.description.zh}${index >= 2 ? " 这次牵涉的人更多，后果也更难收拾。" : ""}`, en: `${seed.description.en}${index >= 2 ? " More factions are involved, and the fallout will travel." : ""}` },
    regionId: location.id,
    rarity: seed.rarity * tier.rarity,
    baseEffects: scaled({ ...zeroStats, ...seed.effects }, tier.scale),
    worldviewEffects: scaled({ ...zeroViews, ...seed.views }, Math.min(tier.scale, 1.55))
  };
}));

export function seededRandom(seed: number) {
  let value = Math.abs(Math.floor(seed)) % 2147483647 || 1;
  return () => { value = value * 16807 % 2147483647; return (value - 1) / 2147483646; };
}

function hashText(text: string) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return hash >>> 0;
}

export function drawMonthlyEvent(profile: Archetype, playerId: string, month: number, seed: number) {
  const random = seededRandom(seed + month * 7919 + hashText(playerId));
  const fortuneChance = Math.max(20, Math.min(68, 34 + profile.halo.fortuneBias + (profile.halo.base - 70) * 0.45));
  const perilChance = Math.max(8, Math.min(48, 35 - profile.halo.adversityShield - (profile.halo.base - 70) * 0.25));
  const roll = random() * 100;
  const polarity: MonthlyEvent["polarity"] = roll < fortuneChance ? "fortune" : roll < fortuneChance + perilChance ? "peril" : "mixed";
  const candidates = eventPool.filter((event) => event.polarity === polarity);
  const total = candidates.reduce((sum, event) => sum + event.rarity, 0);
  let pick = random() * total;
  const event = candidates.find((candidate) => { pick -= candidate.rarity; return pick <= 0; }) || candidates.at(-1)!;
  return { ...event, draw: { roll: Math.round(roll * 100) / 100, fortuneChance: Math.round(fortuneChance * 100) / 100, perilChance: Math.round(perilChance * 100) / 100, halo: profile.halo.base } };
}

export function ageAtMonth(month: number) {
  const total = 18 * 12 + month;
  return { years: Math.floor(total / 12), months: total % 12, label: `${Math.floor(total / 12)}y ${total % 12}m` };
}

export function moveToward(position: PlayerState["position"], event: MonthlyEvent, seed: number, playerId: string, month: number) {
  const target = locations.find((location) => location.id === event.regionId)!;
  const random = seededRandom(seed + month * 3571 + hashText(playerId));
  const step = 0.24 + random() * 0.2;
  return { x: Math.round((position.x + (target.x - position.x) * step) * 10) / 10, y: Math.round((position.y + (target.y - position.y) * step) * 10) / 10, regionId: target.id };
}

export function mapDistance(a: PlayerState["position"], b: PlayerState["position"]) {
  return Math.round(Math.hypot(a.x - b.x, a.y - b.y) * 10) / 10;
}

export type EncounterStage = "early" | "middle" | "final";

export function encounterGroups(players: PlayerState[], stage: EncounterStage, seed: number) {
  const active = players.filter((player) => player.active);
  if (stage === "final") return { groups: active.length > 1 ? [active.map((player) => player.id)] : [], checks: active.flatMap((a, i) => active.slice(i + 1).map((b) => ({ a: a.id, b: b.id, distance: mapDistance(a.position, b.position), probability: 1, roll: 0, met: true }))) };
  const checks: { a: string; b: string; distance: number; probability: number; roll: number; met: boolean }[] = [];
  const random = seededRandom(seed + (stage === "early" ? 401 : 809));
  for (let i = 0; i < active.length; i++) for (let j = i + 1; j < active.length; j++) {
    const distance = mapDistance(active[i].position, active[j].position);
    const proximity = Math.max(0, 1 - distance / 110);
    const probability = Math.min(0.92, (stage === "early" ? 0.06 : 0.38) + proximity * (stage === "early" ? 0.42 : 0.48));
    const roll = random();
    checks.push({ a: active[i].id, b: active[j].id, distance, probability: Math.round(probability * 1000) / 1000, roll: Math.round(roll * 1000) / 1000, met: roll < probability });
  }
  const parent = Object.fromEntries(active.map((player) => [player.id, player.id]));
  const find = (id: string): string => parent[id] === id ? id : (parent[id] = find(parent[id]));
  const join = (a: string, b: string) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[rb] = ra; };
  checks.filter((check) => check.met).forEach((check) => join(check.a, check.b));
  const grouped = Object.values(active.reduce((result, player) => { const root = find(player.id); (result[root] ||= []).push(player.id); return result; }, {} as Record<string, string[]>)).filter((group) => group.length > 1);
  return { groups: grouped, checks };
}
