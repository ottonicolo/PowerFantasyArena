import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { archetypes, clamp, compactContext, type PlayerState } from "../lib/game.ts";
import { ageAtMonth, drawMonthlyEvent, encounterGroups, eventPool, locations, moveToward, seededRandom, type EncounterStage, type MonthlyEvent } from "../lib/world.ts";

type Decision = { playerId: string; month: number; eventId: string; action: string; publicStatement: string; decisionBasis: string[]; consideredOption: { option: string; whyRejected: string }; expectedOutcome: string; riskEstimate: number; memoryRefs: string[] };
type Verdict = { playerId: string; month: number; eventId: string; verdict: string; narrative: string; fairnessCheck: string; statDeltas: Record<string, number>; worldviewDeltas: Record<string, number>; beliefUpdate: string; salientMemory: string; moveNote: string; eliminated: boolean };
type Encounter = { outcome: "cooperation" | "conflict" | "disengagement"; title: string; narrative: string; fairnessCheck: string; winnerId: string | null; effects: { playerId: string; statDeltas: Record<string, number>; worldviewDeltas: Record<string, number>; beliefUpdate: string; memory: string }[]; relationshipChanges: { fromId: string; toId: string; delta: number; reason: string }[]; eliminatedIds: string[]; futureConsequence: string };

const baseUrl = process.env.WANXIANG_URL || "http://localhost:3000";
const seed = crypto.randomInt(100000000, 999999999);
const runId = `run-${new Date().toISOString().replace(/[:.]/g, "-")}-${seed}`;
const folder = path.resolve("runs", runId);
const judge = { id: "referee-one", name: "衡鉴 / The Arbiter", model: "deepseek-v4-pro", constitution: "one independent referee; evidence-bound; neutral across heroic and ruthless strategies" };
const random = seededRandom(seed);
const profileIds = [...archetypes.map((item) => item.id)].sort(() => random() - 0.5).slice(0, 2);
const statKeys = ["power", "health", "resources", "reputation", "influence", "trust", "threat", "halo"] as const;
const viewKeys = ["trust", "cooperation", "order", "risk", "mercy"] as const;
const statCaps: Record<(typeof statKeys)[number], number> = { power: 500, health: 100, resources: 1000, reputation: 500, influence: 500, trust: 100, threat: 100, halo: 100 };
const timeline: any[] = [];
const apiCalls: any[] = [];

let players: PlayerState[] = profileIds.map((archetypeId, index) => {
  const profile = archetypes.find((item) => item.id === archetypeId)!;
  const region = locations[Math.floor(random() * locations.length)];
  return { id: `p${index + 1}`, archetypeId, name: profile.characterName.zh, resources: 50, power: 20, health: 85, influence: 20, reputation: 20, trust: profile.worldview.trust, threat: 10, halo: profile.halo.base, ageMonths: 0, position: { x: region.x, y: region.y, regionId: region.id }, active: true, worldview: { ...profile.worldview }, beliefs: [], salientMemories: [], recentEpisodes: [], monthlyHistory: [] };
});
let relationships: Record<string, number> = { "p1->p2": 0, "p2->p1": 0 };
let ending: Encounter | null = null;

async function api<T>(body: Record<string, unknown>, kind: string, checkpoint: string) {
  const started = Date.now();
  const response = await fetch(`${baseUrl}/api/deepseek`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
  apiCalls.push({ kind, checkpoint, model: result.model, usage: result.usage, thinkingFallback: result.thinkingFallback, elapsedMs: Date.now() - started });
  return result.data as T;
}

function add(kind: string, month: number, title: string, payload: Record<string, unknown>, playerId?: string) {
  timeline.push({ id: `T${String(timeline.length + 1).padStart(4, "0")}`, kind, month, title, playerId, timestamp: new Date().toISOString(), payload });
}

function archiveSnapshot(player: PlayerState) { const { monthlyHistory, ...snapshot } = player; return snapshot; }

function applyMonthly(player: PlayerState, event: MonthlyEvent & { draw: Record<string, number> }, decision: Decision, verdict: Verdict, month: number) {
  const next = { ...player, ageMonths: month, position: moveToward(player.position, event, seed, player.id, month), active: player.active && !verdict.eliminated, worldview: { ...player.worldview } };
  statKeys.forEach((key) => { (next as any)[key] = clamp(Number((next as any)[key]) + Number(verdict.statDeltas?.[key] || 0), 0, statCaps[key]); });
  viewKeys.forEach((key) => { next.worldview[key] = clamp(next.worldview[key] + Number(verdict.worldviewDeltas?.[key] || 0)); });
  const episode = `${month}: ${event.title.zh} / ${decision.action} / ${verdict.verdict}`;
  const compacted = compactContext(next, episode, verdict.salientMemory);
  compacted.monthlyHistory = [...player.monthlyHistory, episode];
  if (verdict.beliefUpdate && !compacted.beliefs.includes(verdict.beliefUpdate)) compacted.beliefs = [...compacted.beliefs, verdict.beliefUpdate].slice(-10);
  return compacted;
}

async function runEncounter(stage: EncounterStage, month: number) {
  const check = encounterGroups(players, stage, seed);
  add("meeting-check", month, stage === "final" ? "终局会合" : "阶段相遇判定", check as any);
  for (const group of check.groups) {
    const meetingPlayers = players.filter((player) => group.includes(player.id) && player.active);
    const assignments = meetingPlayers.map((player) => ({ player, events: [{ id: `encounter-${stage}-${month}`, month, title: { zh: stage === "final" ? "终局会合" : "命途交汇", en: stage === "final" ? "Final convergence" : "Paths cross" }, description: { zh: `几名主角在${locations.find((item) => item.id === player.position.regionId)?.name.zh || "途中"}碰面。`, en: "The protagonists cross paths." }, choice: { zh: "合作、试探、避开，还是开战？", en: "Cooperate, probe, withdraw, or fight?" }, tier: stage === "final" ? 4 : stage === "middle" ? 3 : 2, polarity: "mixed", category: "encounter", regionId: player.position.regionId, baseEffects: {}, worldviewEffects: {} }] }));
    const actorData = await api<{ decisions: Decision[] }>({ mode: "batch-actors", locale: "zh", checkpoint: { stage, month, type: "encounter" }, assignments, relationships, recentLogs: timeline.slice(-12) }, "actors", `encounter-${stage}-${month}`);
    const result = await api<Encounter>({ mode: "encounter-judge", locale: "zh", judge, stage, month, meetingCheck: check.checks.filter((item) => group.includes(item.a) && group.includes(item.b)), players: meetingPlayers, relationships, decisions: actorData.decisions, recentLogs: timeline.slice(-14) }, "judge", `encounter-${stage}-${month}`);
    players = players.map((player) => {
      const effect = result.effects?.find((item) => item.playerId === player.id);
      if (!effect) return player;
      const next = { ...player, active: player.active && !result.eliminatedIds?.includes(player.id), worldview: { ...player.worldview } };
      statKeys.forEach((key) => { (next as any)[key] = clamp(Number((next as any)[key]) + Number(effect.statDeltas?.[key] || 0), 0, statCaps[key]); });
      viewKeys.forEach((key) => { next.worldview[key] = clamp(next.worldview[key] + Number(effect.worldviewDeltas?.[key] || 0)); });
      next.salientMemories = [...next.salientMemories, effect.memory].filter(Boolean).slice(-8);
      if (effect.beliefUpdate) next.beliefs = [...next.beliefs, effect.beliefUpdate].slice(-10);
      return next;
    });
    result.relationshipChanges?.forEach((change) => { const key = `${change.fromId}->${change.toId}`; relationships[key] = clamp((relationships[key] || 0) + change.delta, -100, 100); });
    add(stage === "final" ? "ending" : "encounter", month, result.title, { ...result, decisions: actorData.decisions });
    if (stage === "final") ending = result;
  }
}

process.stdout.write(`${JSON.stringify({ runId, seed, cast: players.map((player) => ({ id: player.id, name: player.name, archetype: archetypes.find((item) => item.id === player.archetypeId)?.name.zh })) })}\n`);
await fs.mkdir(folder, { recursive: true });

let start = 1;
while (start <= 120) {
  const boundary = start <= 40 ? 40 : start <= 80 ? 80 : 120;
  const end = Math.min(start + 5, boundary);
  const assignments = players.filter((player) => player.active).map((player) => {
    const profile = archetypes.find((item) => item.id === player.archetypeId)!;
    const events = [];
    for (let month = start; month <= end; month++) events.push({ ...drawMonthlyEvent(profile, player.id, month, seed), month });
    return { player, events };
  });
  const actorData = await api<{ decisions: Decision[] }>({ mode: "batch-actors", locale: "zh", checkpoint: { start, end }, assignments, relationships, recentLogs: timeline.slice(-12) }, "actors", `${start}-${end}`);
  const judgeData = await api<{ verdicts: Verdict[] }>({ mode: "batch-judge", locale: "zh", judge, checkpoint: { start, end }, players, assignments, decisions: actorData.decisions, recentLogs: timeline.slice(-12) }, "judge", `${start}-${end}`);
  for (let month = start; month <= end; month++) for (const assignment of assignments) {
    const event = assignment.events.find((item: any) => item.month === month)! as MonthlyEvent & { month: number; draw: Record<string, number> };
    const decision = actorData.decisions.find((item) => item.playerId === assignment.player.id && item.month === month && item.eventId === event.id);
    const verdict = judgeData.verdicts.find((item) => item.playerId === assignment.player.id && item.month === month && item.eventId === event.id);
    if (!decision || !verdict) throw new Error(`Missing record: ${assignment.player.id}, month ${month}, ${event.id}`);
    const before = archiveSnapshot(structuredClone(players.find((item) => item.id === assignment.player.id)!));
    players = players.map((player) => player.id === assignment.player.id ? applyMonthly(player, event, decision, verdict, month) : player);
    const after = archiveSnapshot(players.find((item) => item.id === assignment.player.id)!);
    add("month", month, event.title.zh, { event, decision, verdict, before, after }, assignment.player.id);
  }
  if (end === 40) await runEncounter("early", 40);
  if (end === 80) await runEncounter("middle", 80);
  if (end === 120) await runEncounter("final", 120);
  await fs.writeFile(path.join(folder, "checkpoint.json"), JSON.stringify({ runId, seed, monthsDone: end, players, relationships, ending, timeline, apiCalls }, null, 2), "utf8");
  process.stdout.write(`${JSON.stringify({ checkpoint: `${start}-${end}`, monthsDone: end, records: timeline.length, active: players.filter((player) => player.active).length })}\n`);
  start = end + 1;
}

if (!ending) throw new Error("Final encounter did not produce an ending");

const archive = { version: "2.0", runId, createdAt: new Date().toISOString(), configuration: { years: 10, months: 120, checkpointMonths: 6, seed, eventPoolSize: eventPool.length, playerCount: 2, actorModel: "deepseek-v4-flash", judgeModel: "deepseek-v4-pro" }, judge, players, relationships, ending, timeline, apiCalls };
const names = Object.fromEntries(players.map((player) => [player.id, player.name]));
const lines = ["# 万象局十年对局档案", "", `- 对局 ID：${runId}`, `- 随机种子：${seed}`, `- 人物：${players.map((player) => `${player.name}（${archetypes.find((item) => item.id === player.archetypeId)?.name.zh}）`).join("、")}`, "- 时间：18 岁至 28 岁，共 120 个月", `- 事件池：${eventPool.length} 种`, "- 男主模型：deepseek-v4-flash", "- 唯一裁判：deepseek-v4-pro", "", "> 本档案保存角色公开给出的理由、备选方案和裁判依据，不包含隐藏思维链。", ""];
for (const entry of timeline) {
  const age = ageAtMonth(entry.month);
  lines.push(`## ${entry.id} · ${entry.title}`, "", `- 时间：第 ${entry.month} 个月，${age.years} 岁${age.months ? `${age.months} 个月` : ""}`, `- 人物：${entry.playerId ? names[entry.playerId] : judge.name}`, "");
  if (entry.kind === "month") {
    const { event, decision, verdict, before, after } = entry.payload;
    lines.push(event.description.zh, "", `抽取：${event.polarity} / 强度 ${event.tier} / 光环 ${event.draw.halo} / 好运阈值 ${event.draw.fortuneChance}% / 坏事阈值 ${event.draw.perilChance}% / 本次点数 ${event.draw.roll}`, "", "### 他怎么选", decision.action, "", `> ${decision.publicStatement}`, "", "理由：", ...decision.decisionBasis.map((item: string) => `- ${item}`), "", `没选的路：${decision.consideredOption.option}。${decision.consideredOption.whyRejected}`, "", `预期：${decision.expectedOutcome}`, `风险估计：${decision.riskEstimate}/100`, `引用记忆：${decision.memoryRefs.join("；") || "无"}`, "", "### 裁判怎么判", verdict.verdict, "", verdict.narrative, "", `公平性核对：${verdict.fairnessCheck}`, "", "### 属性和三观", ...statKeys.map((key) => `- ${key}: ${before[key]} → ${after[key]}`), ...viewKeys.map((key) => `- worldview.${key}: ${before.worldview[key]} → ${after.worldview[key]}`), `- 新看法：${verdict.beliefUpdate || "无"}`, `- 位置：${before.position.regionId} → ${after.position.regionId}`);
  }
  if (entry.kind === "meeting-check") lines.push("```json", JSON.stringify(entry.payload.checks, null, 2), "```");
  if (entry.kind === "encounter" || entry.kind === "ending") lines.push(entry.payload.narrative, "", `结果：${entry.payload.outcome}`, `公平性核对：${entry.payload.fairnessCheck}`, "", "各自决定：", ...entry.payload.decisions.map((decision: Decision) => `- ${names[decision.playerId]}：${decision.action}`), "", `后续影响：${entry.payload.futureConsequence}`);
  lines.push("");
}
const totalTokens = apiCalls.reduce((sum, call) => sum + Number(call.usage?.total_tokens || 0), 0);
lines.push("## API 用量", "", `- 调用次数：${apiCalls.length}`, `- 总 tokens：${totalTokens}`);
await fs.mkdir(folder, { recursive: true });
await fs.writeFile(path.join(folder, "report.md"), lines.join("\n"), "utf8");
await fs.writeFile(path.join(folder, "timeline.json"), JSON.stringify(archive, null, 2), "utf8");
await fs.writeFile(path.join(folder, "summary.json"), JSON.stringify({ runId, seed, cast: players.map((player) => ({ id: player.id, name: player.name, archetype: archetypes.find((item) => item.id === player.archetypeId)?.name.zh })), ending, finalStats: players, relationships, apiCalls: apiCalls.length, totalTokens }, null, 2), "utf8");
process.stdout.write(`${JSON.stringify({ complete: true, runId, folder, ending: ending.title, outcome: ending.outcome, winnerId: ending.winnerId, apiCalls: apiCalls.length, totalTokens })}\n`);
