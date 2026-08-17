export type Locale = "zh" | "en";

export type Archetype = {
  id: string;
  name: Record<Locale, string>;
  characterName: Record<Locale, string>;
  epithet: Record<Locale, string>;
  premise: Record<Locale, string>;
  traits: Record<Locale, string[]>;
  decisionRules: Record<Locale, string[]>;
  values: Record<Locale, string[]>;
  blindSpots: Record<Locale, string[]>;
  worldview: { trust: number; cooperation: number; order: number; risk: number; mercy: number };
  halo: { base: number; fortuneBias: number; adversityShield: number; description: Record<Locale, string> };
  color: string;
};

export type GameEvent = {
  id: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  stakes: Record<Locale, string>;
  tags: string[];
};

export type PlayerState = {
  id: string;
  archetypeId: string;
  name: string;
  resources: number;
  power: number;
  health: number;
  influence: number;
  reputation: number;
  trust: number;
  threat: number;
  halo: number;
  ageMonths: number;
  position: { x: number; y: number; regionId: string };
  active: boolean;
  worldview: Archetype["worldview"];
  beliefs: string[];
  salientMemories: string[];
  recentEpisodes: string[];
  monthlyHistory: string[];
};

export type Decision = {
  actionType: string;
  action: string;
  targetIds: string[];
  publicStatement: string;
  decisionBasis: string[];
  consideredOptions: { option: string; whyRejected: string }[];
  expectedOutcome: string;
  riskEstimate: number;
  memoryRefs: string[];
  worldviewSignal: Partial<Archetype["worldview"]>;
};

export type Consequence = {
  playerId: string;
  resourceDelta: number;
  influenceDelta: number;
  trustDelta: number;
  threatDelta: number;
  reason: string;
};

export type Verdict = {
  verdict: string;
  narrative: string;
  fairnessCheck: string;
  consequences: Consequence[];
  relationshipChanges: { fromId: string; toId: string; delta: number; reason: string }[];
  worldChange: string;
  beliefUpdates: { playerId: string; belief: string }[];
  salientMemory: string;
  cooperationScore: number;
  conflictScore: number;
};

export type LogEntry = {
  id: string;
  round: number;
  phase: "event" | "decision" | "verdict" | "final-decision" | "ending";
  actorId?: string;
  eventId?: string;
  timestamp: string;
  model?: string;
  usage?: Record<string, number>;
  payload: Record<string, unknown>;
  contextDigest?: string;
};

export const archetypes: Archetype[] = [
  {
    id: "climber",
    name: { zh: "逆势登阶者", en: "Adversity Climber" },
    characterName: { zh: "小楚", en: "Xiao Chu" },
    epithet: { zh: "以伤痕丈量高度", en: "Measures height by scars" },
    premise: { zh: "起点低、受轻视，却相信能力可以积累、尊严必须夺回。", en: "Starts low and underestimated, but believes strength compounds and dignity must be reclaimed." },
    traits: { zh: ["坚韧", "重情", "好胜"], en: ["resilient", "loyal", "competitive"] },
    decisionRules: { zh: ["先争取可成长的机会", "回报善意，记住羞辱", "接受有上升空间的风险"], en: ["Prefer opportunities that compound", "Repay kindness and remember humiliation", "Accept risks with upside"] },
    values: { zh: ["成长", "尊严", "互惠"], en: ["growth", "dignity", "reciprocity"] },
    blindSpots: { zh: ["容易把妥协理解为软弱", "成功后可能过度扩张"], en: ["May mistake compromise for weakness", "May overexpand after success"] },
    worldview: { trust: 55, cooperation: 58, order: 48, risk: 68, mercy: 62 }, halo: { base: 78, fortuneBias: 15, adversityShield: 10, description: { zh: "低谷之后更容易撞见翻盘的台阶。", en: "Setbacks tend to reveal a way back up." } }, color: "#d35b45"
  },
  {
    id: "survivor",
    name: { zh: "冷峻求生者", en: "Ruthless Survivor" },
    characterName: { zh: "小顾", en: "Xiao Gu" },
    epithet: { zh: "活下去才有资格定义善恶", en: "Only survivors define morality" },
    premise: { zh: "世界被视为资源有限、承诺脆弱的危险场；善意必须通过证据验证。", en: "Sees a dangerous world of scarce resources and fragile promises; goodwill must be proven." },
    traits: { zh: ["克制", "多疑", "功利"], en: ["controlled", "skeptical", "pragmatic"] },
    decisionRules: { zh: ["生存优先", "拒绝不可逆承诺", "用最小暴露换最大控制"], en: ["Survival first", "Avoid irreversible commitments", "Trade minimal exposure for maximum control"] },
    values: { zh: ["自主", "真实", "可控"], en: ["autonomy", "truth", "control"] },
    blindSpots: { zh: ["低估真诚合作的复利", "预防性敌意会制造敌人"], en: ["Undervalues compounding trust", "Preemptive hostility creates enemies"] },
    worldview: { trust: 20, cooperation: 30, order: 35, risk: 45, mercy: 22 }, halo: { base: 68, fortuneBias: 3, adversityShield: 22, description: { zh: "好事未必找上门，杀局却常常差一步落空。", en: "Luck rarely spoils him, but killing blows often miss." } }, color: "#815f9d"
  },
  {
    id: "builder",
    name: { zh: "秩序建设者", en: "Order Builder" },
    characterName: { zh: "小沈", en: "Xiao Shen" },
    epithet: { zh: "把个人胜利写进制度", en: "Turns victory into institutions" },
    premise: { zh: "真正的力量不是一时无敌，而是让组织、规则与生产能力持续运转。", en: "Real power is not momentary dominance but durable institutions, rules, and productive capacity." },
    traits: { zh: ["理性", "耐心", "组织型"], en: ["rational", "patient", "organizational"] },
    decisionRules: { zh: ["优先改变激励结构", "计算长期公共收益", "合作必须可执行、可审计"], en: ["Change incentives first", "Calculate long-term public value", "Make cooperation enforceable and auditable"] },
    values: { zh: ["秩序", "繁荣", "责任"], en: ["order", "prosperity", "responsibility"] },
    blindSpots: { zh: ["可能把人当作系统变量", "改革速度会触发既得利益反扑"], en: ["May reduce people to system variables", "Reform speed can trigger backlash"] },
    worldview: { trust: 60, cooperation: 78, order: 86, risk: 42, mercy: 60 }, halo: { base: 72, fortuneBias: 10, adversityShield: 13, description: { zh: "机缘常以人脉、产业和可复制的方法出现。", en: "Opportunity arrives as allies, infrastructure, and repeatable methods." } }, color: "#386b8c"
  },
  {
    id: "guardian",
    name: { zh: "守诺担当者", en: "Oath Guardian" },
    characterName: { zh: "小陆", en: "Xiao Lu" },
    epithet: { zh: "有些线不能退", en: "Some lines cannot move" },
    premise: { zh: "力量的正当性来自保护与担当；承诺一旦说出口，就高于短期得失。", en: "Power is justified through protection and responsibility; a spoken oath outweighs short-term gain." },
    traits: { zh: ["侠义", "直接", "忠诚"], en: ["righteous", "direct", "loyal"] },
    decisionRules: { zh: ["保护弱者和同伴", "公开面对不义", "宁可受损也不背诺"], en: ["Protect the vulnerable and allies", "Confront injustice openly", "Accept loss before breaking an oath"] },
    values: { zh: ["公义", "忠诚", "勇气"], en: ["justice", "loyalty", "courage"] },
    blindSpots: { zh: ["容易被道德绑架", "正面对抗可能忽略间接代价"], en: ["Vulnerable to moral leverage", "Direct confrontation can hide indirect costs"] },
    worldview: { trust: 66, cooperation: 70, order: 64, risk: 72, mercy: 78 }, halo: { base: 74, fortuneBias: 9, adversityShield: 11, description: { zh: "救下的人会回来还情，但替人出头也会招来麻烦。", en: "Those he saves often return the favor, though rescue creates enemies." } }, color: "#bf873d"
  },
  {
    id: "immortal",
    name: { zh: "隐忍长生者", en: "Patient Immortal" },
    characterName: { zh: "小宁", en: "Xiao Ning" },
    epithet: { zh: "时间站在留有退路的人一边", en: "Time favors those with exits" },
    premise: { zh: "不争一时声名，保存实力、隐藏底牌，以漫长时间消化几乎所有风险。", en: "Ignores short-lived fame, preserves strength, hides trump cards, and lets time absorb risk." },
    traits: { zh: ["谨慎", "低调", "自持"], en: ["cautious", "discreet", "self-contained"] },
    decisionRules: { zh: ["不做收益不对称的冒险", "永远保留退出路径", "信息不足时先观察"], en: ["Avoid negatively asymmetric risks", "Always keep an exit", "Observe when information is scarce"] },
    values: { zh: ["存续", "自由", "耐心"], en: ["continuity", "freedom", "patience"] },
    blindSpots: { zh: ["错过必须及时介入的窗口", "难以赢得深度信任"], en: ["Misses time-sensitive windows", "Struggles to earn deep trust"] },
    worldview: { trust: 38, cooperation: 46, order: 50, risk: 18, mercy: 48 }, halo: { base: 84, fortuneBias: 7, adversityShield: 28, description: { zh: "大机缘来得慢，致命坏事也很难真正黏住他。", en: "Great fortune comes slowly; fatal trouble rarely sticks." } }, color: "#4e8069"
  },
  {
    id: "trickster",
    name: { zh: "机变破局者", en: "Rule-Breaking Trickster" },
    characterName: { zh: "小叶", en: "Xiao Ye" },
    epithet: { zh: "规则是工具，不是天条", en: "Rules are tools, not scripture" },
    premise: { zh: "把危机看成重新组合规则的机会，用幽默、信息差和快速试错制造奇胜。", en: "Treats crises as opportunities to recombine rules, using humor, information gaps, and fast experiments." },
    traits: { zh: ["灵活", "反套路", "机会型"], en: ["adaptive", "unorthodox", "opportunistic"] },
    decisionRules: { zh: ["寻找第三条路", "以小实验换信息", "让对手误判自己的目标"], en: ["Find a third path", "Buy information with small experiments", "Let rivals misread the objective"] },
    values: { zh: ["自由", "创造", "胜负效率"], en: ["freedom", "creativity", "efficient victory"] },
    blindSpots: { zh: ["低估稳定规则的价值", "玩笑会损伤严肃承诺"], en: ["Undervalues stable rules", "Playfulness can weaken serious commitments"] },
    worldview: { trust: 50, cooperation: 54, order: 24, risk: 76, mercy: 52 }, halo: { base: 76, fortuneBias: 18, adversityShield: 4, description: { zh: "好事坏事都来得猛，往往还藏着一条没人看见的岔路。", en: "Good and bad luck both hit hard, usually with an overlooked third option." } }, color: "#d0708f"
  }
];

export const events: GameEvent[] = [
  { id: "shared-vault", title: { zh: "双钥秘库", en: "The Two-Key Vault" }, description: { zh: "一座秘库必须由至少两人同时开启。宝物足够壮大所有参与者，但任何一人都能在开启瞬间夺走核心。", en: "A vault requires at least two people to open. Its riches can empower all, but anyone may seize the core at the critical moment." }, stakes: { zh: "合作可共享增长；背叛者可能独占，也可能触发封锁。", en: "Cooperation shares growth; betrayal may monopolize it or seal the vault." }, tags: ["trust", "resources"] },
  { id: "refugee-city", title: { zh: "无主之城", en: "The Leaderless City" }, description: { zh: "灾民涌入一座失去统治者的城市。粮仓只够十日，各派都邀请主角接管。", en: "Refugees flood a city without rulers. Food lasts ten days, and factions invite the protagonists to take control." }, stakes: { zh: "救助、征税、撤离或夺权都会永久改变民意与资源。", en: "Relief, taxation, evacuation, or seizure will permanently alter legitimacy and resources." }, tags: ["order", "mercy"] },
  { id: "false-prophecy", title: { zh: "真假天命", en: "The Counterfeit Prophecy" }, description: { zh: "预言宣称在场一人将毁灭世界，但证据互相矛盾。群众要求立刻处决嫌疑人。", en: "A prophecy says one present figure will destroy the world, but the evidence conflicts. The crowd demands an execution." }, stakes: { zh: "相信、调查、操纵或拒绝预言，将重塑众人对真相与权威的看法。", en: "Belief, investigation, manipulation, or rejection will reshape views of truth and authority." }, tags: ["truth", "threat"] },
  { id: "dying-mentor", title: { zh: "陌生人的遗愿", en: "A Stranger's Last Request" }, description: { zh: "一位救过数千人的强者临终，请主角们保护他曾经的仇敌之子。追兵即将抵达。", en: "A dying hero who saved thousands asks the protagonists to protect a former enemy's child. Pursuers are close." }, stakes: { zh: "承诺会招致强敌；拒绝则保全实力，却损害声望与自我认同。", en: "Accepting invites powerful enemies; refusal preserves strength but harms reputation and self-concept." }, tags: ["oath", "risk"] },
  { id: "scarcity-winter", title: { zh: "长冬配额", en: "The Long-Winter Quota" }, description: { zh: "异常长冬使物资减半。情报表明，只要有人主动削减自身配额，整体存活率就会上升。", en: "An abnormal winter halves supplies. Evidence shows that voluntary sacrifice by some increases total survival." }, stakes: { zh: "牺牲可能换来信任，也可能被他人利用。", en: "Sacrifice may earn trust or invite exploitation." }, tags: ["scarcity", "cooperation"] },
  { id: "captured-rival", title: { zh: "阶下旧敌", en: "The Captured Rival" }, description: { zh: "一名曾背叛众人的强敌失去力量，被押到主角们面前。他掌握通往终局的半份地图。", en: "A former betrayer is captured and powerless. He holds half a map to the endgame." }, stakes: { zh: "处决、宽恕、审讯或交易都会发出强烈的价值信号。", en: "Execution, mercy, interrogation, or bargaining sends a strong value signal." }, tags: ["mercy", "information"] },
  { id: "world-engine", title: { zh: "世界引擎", en: "The World Engine" }, description: { zh: "远古引擎能永久提升生产力，但启动会让操作者暴露三项最重要的秘密。", en: "An ancient engine can permanently raise productivity, but activation exposes the operator's three most important secrets." }, stakes: { zh: "公共繁荣与个人安全直接冲突。", en: "Public prosperity directly conflicts with personal security." }, tags: ["progress", "secrecy"] },
  { id: "final-gate", title: { zh: "终局之门", en: "The Final Gate" }, description: { zh: "所有主角终于在唯一的终局之门前相遇。结盟能共同建立新世界；争夺则只有一人可以掌握门后的权柄。", en: "All protagonists finally meet before the only final gate. An alliance can build a shared world; conflict grants its power to only one." }, stakes: { zh: "这是最终承诺：合作、有限联盟、威慑、背叛或全面斗争。", en: "This is the final commitment: cooperate, form a limited alliance, deter, betray, or fight." }, tags: ["final", "cooperation", "conflict"] }
];

export const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

export function seededShuffle<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  let value = seed || 1;
  const random = () => { value = (value * 16807) % 2147483647; return (value - 1) / 2147483646; };
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function compactContext(player: PlayerState, newEpisode: string, memory?: string): PlayerState {
  const recentEpisodes = [...player.recentEpisodes, newEpisode].slice(-3);
  const salientMemories = memory ? [...player.salientMemories, memory].slice(-8) : player.salientMemories;
  return { ...player, recentEpisodes, salientMemories };
}

export function digest(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, "0");
}
