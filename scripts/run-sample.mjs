import fs from "node:fs/promises";
import path from "node:path";

const base = process.env.WANXIANG_URL || "http://localhost:3000";
const seed = 20260816;
const judge = { id: "referee-one", name: "衡鉴 / The Arbiter", model: "deepseek-v4-pro", constitution: "independent, evidence-bound, outcome-oriented, impartial across moral styles" };
const profiles = {
  climber: { name: "逆势登阶者", alias: "烬川", worldview: { trust: 55, cooperation: 58, order: 48, risk: 68, mercy: 62 } },
  survivor: { name: "冷峻求生者", alias: "墨衡", worldview: { trust: 20, cooperation: 30, order: 35, risk: 45, mercy: 22 } }
};
const eventDeck = [
  { id: "shared-vault", title: { zh: "双钥秘库" }, description: { zh: "一座秘库必须由至少两人同时开启。宝物足够壮大所有参与者，但任何一人都能在开启瞬间夺走核心。" }, stakes: { zh: "合作可共享增长；背叛者可能独占，也可能触发封锁。" }, tags: ["trust", "resources"] },
  { id: "refugee-city", title: { zh: "无主之城" }, description: { zh: "灾民涌入一座失去统治者的城市。粮仓只够十日，各派都邀请主角接管。" }, stakes: { zh: "救助、征税、撤离或夺权都会永久改变民意与资源。" }, tags: ["order", "mercy"] },
  { id: "captured-rival", title: { zh: "阶下旧敌" }, description: { zh: "一名曾背叛众人的强敌失去力量，被押到主角们面前。他掌握通往终局的半份地图。" }, stakes: { zh: "处决、宽恕、审讯或交易都会发出强烈的价值信号。" }, tags: ["mercy", "information"] }
];
const finalEvent = { id: "final-gate", title: { zh: "终局之门" }, description: { zh: "所有主角终于在唯一的终局之门前相遇。结盟能共同建立新世界；争夺则只有一人可以掌握门后的权柄。" }, stakes: { zh: "这是最终承诺：合作、有限联盟、威慑、背叛或全面斗争。" }, tags: ["final", "cooperation", "conflict"] };
let players = Object.entries(profiles).map(([archetypeId, profile], index) => ({ id: `p${index + 1}`, archetypeId, name: profile.alias, resources: 50, influence: 35, trust: profile.worldview.trust, threat: 15, worldview: { ...profile.worldview }, beliefs: [], salientMemories: [], recentEpisodes: [] }));
let relationships = { "p1->p2": 0, "p2->p1": 0 };
const logs = [];

async function post(body) {
  const response = await fetch(`${base}/api/deepseek`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
  return result;
}

function add(round, phase, payload, extra = {}) {
  const entry = { id: `L${String(logs.length + 1).padStart(3, "0")}`, round, phase, timestamp: new Date().toISOString(), payload, ...extra };
  logs.push(entry);
  return entry;
}

function clamp(value, min = 0, max = 100) { return Math.max(min, Math.min(max, Math.round(value))); }

function recent() { return logs.slice(-8).map(({ id, phase, actorId, payload }) => ({ id, phase, actorId, payload })); }

for (let round = 1; round <= eventDeck.length; round++) {
  const event = eventDeck[round - 1];
  add(round, "event", { title: event.title.zh, description: event.description.zh, stakes: event.stakes.zh }, { eventId: event.id });
  const order = round % 2 === 1 ? [...players] : [...players].reverse();
  for (const ordered of order) {
    const actor = players.find((player) => player.id === ordered.id);
    const actorResult = await post({ mode: "actor", locale: "zh", player: actor, players, relationships, event, round, recentLogs: recent() });
    add(round, "decision", actorResult.data, { actorId: actor.id, eventId: event.id, model: actorResult.model, usage: actorResult.usage });
    const verdictResult = await post({ mode: "judge", locale: "zh", judge, round, actorId: actor.id, decision: actorResult.data, players, relationships, event, recentLogs: recent() });
    const verdict = verdictResult.data;
    add(round, "verdict", verdict, { actorId: judge.id, eventId: event.id, model: verdictResult.model, usage: verdictResult.usage });
    players = players.map((player) => {
      const effect = verdict.consequences.find((item) => item.playerId === player.id);
      const belief = verdict.beliefUpdates.find((item) => item.playerId === player.id)?.belief;
      const episode = player.id === actor.id ? `${event.title.zh}：${actorResult.data.action} → ${verdict.verdict}` : `${event.title.zh}：${verdict.worldChange}`;
      const next = { ...player, recentEpisodes: [...player.recentEpisodes, episode].slice(-3), salientMemories: effect ? [...player.salientMemories, verdict.salientMemory].slice(-8) : player.salientMemories, beliefs: belief && !player.beliefs.includes(belief) ? [...player.beliefs, belief].slice(-6) : player.beliefs };
      if (!effect) return next;
      return { ...next, resources: clamp(next.resources + effect.resourceDelta), influence: clamp(next.influence + effect.influenceDelta), trust: clamp(next.trust + effect.trustDelta), threat: clamp(next.threat + effect.threatDelta) };
    });
    verdict.relationshipChanges.forEach((change) => { const key = `${change.fromId}->${change.toId}`; relationships[key] = clamp((relationships[key] || 0) + change.delta, -100, 100); });
  }
}

add(4, "event", { title: finalEvent.title.zh, description: finalEvent.description.zh, stakes: finalEvent.stakes.zh }, { eventId: finalEvent.id });
const finalSnapshot = structuredClone(players);
const finalDecisions = [];
for (const actor of finalSnapshot) {
  const result = await post({ mode: "actor", locale: "zh", final: true, player: actor, players: finalSnapshot, relationships, event: finalEvent, round: 4, recentLogs: recent() });
  finalDecisions.push({ playerId: actor.id, decision: result.data });
  add(4, "final-decision", result.data, { actorId: actor.id, eventId: finalEvent.id, model: result.model, usage: result.usage });
}
const finalResult = await post({ mode: "final", locale: "zh", judge, players, relationships, event: finalEvent, decisions: finalDecisions, logs: logs.map(({ id, round, phase, actorId, payload }) => ({ id, round, phase, actorId, payload })) });
const ending = finalResult.data;
add(4, "ending", ending, { actorId: judge.id, eventId: finalEvent.id, model: finalResult.model, usage: finalResult.usage });

const archive = { version: "1.0", generatedAt: new Date().toISOString(), locale: "zh", configuration: { playerCount: 2, roundCount: 3, seed, actorModel: "deepseek-v4-flash", judgeModel: "deepseek-v4-pro", memoryPolicy: { recentEpisodes: 3, recentPublicLogs: 8, salientMemories: 8, losslessArchive: true } }, judge, players, relationships, ending, logs };
const names = Object.fromEntries(players.map((player) => [player.id, player.name]));
const lines = ["# 万象局：双主角样例对局档案", "", `- 生成时间：${archive.generatedAt}`, `- 随机种子：${seed}`, `- 参与者：${players.map((player) => `${player.name}（${profiles[player.archetypeId].name}）`).join("、")}`, "- 男主模型：deepseek-v4-flash", `- 唯一裁判：${judge.name} / deepseek-v4-pro`, "", "> 本档案保留模型给出的公开决策理由、证据、备选方案与裁决，不包含或推断隐藏思维链。", ""];
for (const log of logs) {
  const p = log.payload;
  const labels = { event: "世界事件", decision: "行动决策", verdict: "裁判裁决", "final-decision": "终局承诺", ending: "最终结局" };
  lines.push(`## ${log.id} · ${labels[log.phase]}${log.actorId ? ` · ${names[log.actorId] || judge.name}` : ""}`, "", `- 回合：${log.round}`, `- 模型：${log.model || "本地规则引擎"}`, "");
  if (log.phase === "event") lines.push(`**${p.title}**`, "", p.description, "", `风险：${p.stakes}`);
  if (log.phase === "decision" || log.phase === "final-decision") lines.push(`**行动：** ${p.action}`, "", `**公开表态：** ${p.publicStatement}`, "", "**为什么这样做：**", ...(p.decisionBasis || []).map((item) => `- ${item}`), "", "**考虑后放弃：**", ...(p.consideredOptions || []).map((item) => `- ${item.option}：${item.whyRejected}`), "", `**预期结果：** ${p.expectedOutcome}`, "", `**风险估计：** ${p.riskEstimate}/100`, "", `**引用记忆：** ${(p.memoryRefs || []).join("；") || "无"}`);
  if (log.phase === "verdict") lines.push(`**裁决：** ${p.verdict}`, "", p.narrative, "", `**公平性检查：** ${p.fairnessCheck}`, "", `**世界变化：** ${p.worldChange}`, "", "**数值后果：**", ...(p.consequences || []).map((item) => `- ${names[item.playerId] || item.playerId}：资源 ${item.resourceDelta >= 0 ? "+" : ""}${item.resourceDelta}，影响 ${item.influenceDelta >= 0 ? "+" : ""}${item.influenceDelta}，信任 ${item.trustDelta >= 0 ? "+" : ""}${item.trustDelta}，威胁 ${item.threatDelta >= 0 ? "+" : ""}${item.threatDelta}。${item.reason}`));
  if (log.phase === "ending") lines.push(`**${p.title}**`, "", p.summary, "", "**关键依据：**", ...(p.rationale || []).map((item) => `- ${item}`), "", `**尾声：** ${p.epilogue}`);
  lines.push("");
}
const outputDir = path.resolve("outputs");
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(path.join(outputDir, "sample-two-protagonists.md"), lines.join("\n"), "utf8");
await fs.writeFile(path.join(outputDir, "sample-two-protagonists.json"), JSON.stringify(archive, null, 2), "utf8");
const usage = logs.reduce((sum, log) => sum + Number(log.usage?.total_tokens || 0), 0);
process.stdout.write(JSON.stringify({ endingType: ending.endingType, title: ending.title, winnerId: ending.winnerId, logs: logs.length, totalTokens: usage, markdown: path.join(outputDir, "sample-two-protagonists.md") }));
