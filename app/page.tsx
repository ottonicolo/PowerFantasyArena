"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { archetypes, clamp, compactContext, type Locale, type PlayerState } from "../lib/game";
import { ageAtMonth, drawMonthlyEvent, encounterGroups, eventPool, locations, mapDistance, moveToward, seededRandom, type EncounterStage, type MonthlyEvent } from "../lib/world";

type View = "home" | "game" | "profiles" | "method";
type ApiResult<T> = { data: T; usage: Record<string, number>; model: string; thinkingFallback?: boolean };
type BatchDecision = { playerId: string; month: number; eventId: string; actionType: string; action: string; publicStatement: string; decisionBasis: string[]; consideredOption: { option: string; whyRejected: string }; expectedOutcome: string; riskEstimate: number; memoryRefs: string[]; worldviewSignal: Record<string, number> };
type BatchVerdict = { playerId: string; month: number; eventId: string; verdict: string; narrative: string; fairnessCheck: string; statDeltas: Record<string, number>; worldviewDeltas: Record<string, number>; beliefUpdate: string; salientMemory: string; moveNote: string; eliminated: boolean };
type EncounterResult = { outcome: "cooperation" | "conflict" | "disengagement"; title: string; narrative: string; fairnessCheck: string; effects: { playerId: string; statDeltas: Record<string, number>; worldviewDeltas: Record<string, number>; beliefUpdate: string; memory: string }[]; relationshipChanges: { fromId: string; toId: string; delta: number; reason: string }[]; eliminatedIds: string[]; futureConsequence: string; winnerId?: string | null };
type TimelineEntry = { id: string; kind: "month" | "meeting-check" | "encounter" | "ending"; month: number; playerId?: string; title: string; payload: Record<string, any>; model?: string; usage?: Record<string, number>; timestamp: string };

const ui = {
  zh: {
    nav: ["开一局", "主角名册", "规则"], kicker: "十年命途模拟", hero: "把六种主角，\n扔进同一个十年。", intro: "他们从十八岁出发。每个月各走各的运，偶尔撞见彼此。到了二十八岁，该联手还是该拼个你死我活，谁也躲不过。", setup: "选人开局", readRules: "先看规则", years: "10 年", months: "120 次月度刷新", pool: "120 种事件", referee: "1 位 Pro 裁判", profiles: "六位主角，六套活法", profileNote: "名字是原创代号。性格决定他们怎么选，运气只负责把麻烦和机缘送到门口。", gameSetup: "这局怎么开", playerCount: "上场人数", fixedTime: "固定时长", seed: "随机种子", random: "重新抽人", selected: "本局人物", launch: "进入十年", apiReady: "DeepSeek 已接通", apiMissing: "还没找到 API 密钥", run: "跑完这十年", running: "正在推演", save: "保存本局", reset: "换一批人", map: "行走地图", timeline: "十年流水账", empty: "还没发生任何事。按下开局，他们会从十八岁走到二十八岁。", age: "年龄", month: "第 {n} 个月", phaseEarly: "前期", phaseMiddle: "中期", phaseLate: "后期", stats: ["修为", "体魄", "资源", "声望", "势力", "信任", "威胁", "光环"], worldviews: ["信任", "合作", "秩序", "冒险", "怜悯"], encounterCheck: "相遇判定", encounter: "人物相遇", decision: "他怎么选", judge: "裁判怎么判", change: "这一月之后", basis: "理由", rejected: "没选的路", fairness: "裁判核对", methodTitle: "完整档案留在硬盘里，提示词只带真正有用的部分。", methodIntro: "十年有 120 个月。全部原文每次都塞给 Flash，迟早会把角色挤没。这里每六个月结一次账：人物设定不动，属性和三观更新，近事与大事分开记。", safety: "界面展示的是角色给出的公开理由和裁判依据。隐藏思维链不在记录范围内。", noMeeting: "这次没碰上", finalMeeting: "终局会合", eventPool: "事件池", halo: "主角光环", distance: "地图距离", checkpoints: "六个月检查点", ended: "十年结束", eliminated: "已退场"
  },
  en: {
    nav: ["New game", "Cast", "Rules"], kicker: "TEN-YEAR FATE SIMULATOR", hero: "Six heroes.\nOne shared decade.", intro: "They start at eighteen. Every month brings a private break or a fresh problem. They may cross paths along the way. At twenty-eight, nobody gets to avoid the final choice: work together or fight for the ending.", setup: "Set up a run", readRules: "Read the rules", years: "10 years", months: "120 monthly draws", pool: "120 event variants", referee: "1 Pro referee", profiles: "Six leads. Six ways to survive.", profileNote: "The names are original. Character drives the choice; luck decides what lands on the doorstep.", gameSetup: "Build this run", playerCount: "Players", fixedTime: "Fixed span", seed: "Random seed", random: "Draw a new cast", selected: "Cast", launch: "Start the decade", apiReady: "DeepSeek connected", apiMissing: "API key not found", run: "Run all ten years", running: "Simulating", save: "Save this run", reset: "Change the cast", map: "World map", timeline: "The ten-year record", empty: "Nothing has happened yet. Start the run and they will age from eighteen to twenty-eight.", age: "Age", month: "Month {n}", phaseEarly: "Early years", phaseMiddle: "Middle years", phaseLate: "Late years", stats: ["Power", "Health", "Resources", "Reputation", "Influence", "Trust", "Threat", "Halo"], worldviews: ["Trust", "Cooperation", "Order", "Risk", "Mercy"], encounterCheck: "Meeting check", encounter: "Encounter", decision: "The choice", judge: "The ruling", change: "After this month", basis: "Why", rejected: "The road not taken", fairness: "Referee check", methodTitle: "Keep the full record on disk. Give the model only what it can use.", methodIntro: "A decade means 120 monthly events. Stuffing the whole transcript into Flash would eventually bury the character. The game closes its books every six months: the constitution stays fixed, attributes and beliefs update, and recent events remain separate from lasting memories.", safety: "The interface shows public reasons and referee evidence. Hidden chain-of-thought is never requested or stored.", noMeeting: "No meeting this time", finalMeeting: "Final convergence", eventPool: "Event pool", halo: "Protagonist halo", distance: "Map distance", checkpoints: "Six-month checkpoints", ended: "The decade ends", eliminated: "Out of the game"
  }
};

const judge = { id: "referee-one", name: "衡鉴 / The Arbiter", model: "deepseek-v4-pro", constitution: "one independent referee; evidence-bound; neutral across heroic and ruthless strategies" };
const statKeys = ["power", "health", "resources", "reputation", "influence", "trust", "threat", "halo"] as const;
const viewKeys = ["trust", "cooperation", "order", "risk", "mercy"] as const;
const statCaps: Record<(typeof statKeys)[number], number> = { power: 500, health: 100, resources: 1000, reputation: 500, influence: 500, trust: 100, threat: 100, halo: 100 };

function relationKey(from: string, to: string) { return `${from}->${to}`; }
function phaseAt(month: number): EncounterStage { return month <= 40 ? "early" : month <= 80 ? "middle" : "final"; }
function phaseLabel(month: number, locale: Locale) { const t = ui[locale]; return month <= 40 ? t.phaseEarly : month <= 80 ? t.phaseMiddle : t.phaseLate; }
function formatAge(month: number, locale: Locale) { const age = ageAtMonth(month); return locale === "zh" ? `${age.years} 岁${age.months ? `${age.months} 个月` : ""}` : `${age.years}y ${age.months}m`; }

async function callApi<T>(body: Record<string, unknown>): Promise<ApiResult<T>> {
  const response = await fetch("/api/deepseek", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `API ${response.status}`);
  return result;
}

function newPlayers(ids: string[], locale: Locale, seed: number): PlayerState[] {
  const random = seededRandom(seed);
  return ids.map((archetypeId, index) => {
    const profile = archetypes.find((item) => item.id === archetypeId)!;
    const region = locations[Math.floor(random() * locations.length)];
    return { id: `p${index + 1}`, archetypeId, name: profile.characterName[locale], resources: 50, power: 20, health: 85, influence: 20, reputation: 20, trust: profile.worldview.trust, threat: 10, halo: profile.halo.base, ageMonths: 0, position: { x: region.x, y: region.y, regionId: region.id }, active: true, worldview: { ...profile.worldview }, beliefs: [], salientMemories: [], recentEpisodes: [], monthlyHistory: [] };
  });
}

function makeId(seed: number) { return `run-${new Date().toISOString().replace(/[:.]/g, "-")}-${seed}`; }
function archiveSnapshot(player: PlayerState) { const { monthlyHistory, ...snapshot } = player; return snapshot; }

export default function Home() {
  const [locale, setLocale] = useState<Locale>("zh");
  const [view, setView] = useState<View>("home");
  const [playerCount, setPlayerCount] = useState(2);
  const [seed, setSeed] = useState(20260816);
  const [selected, setSelected] = useState(["climber", "survivor"]);
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [relationships, setRelationships] = useState<Record<string, number>>({});
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [currentMonth, setCurrentMonth] = useState(0);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [apiReady, setApiReady] = useState(false);
  const [gameId, setGameId] = useState("");
  const [ending, setEnding] = useState<EncounterResult | null>(null);
  const setupRef = useRef<HTMLDivElement>(null);
  const t = ui[locale];

  useEffect(() => { fetch("/api/deepseek").then((response) => response.json()).then((data) => setApiReady(Boolean(data.configured))).catch(() => setApiReady(false)); }, []);

  const chosenProfiles = useMemo(() => selected.map((id) => archetypes.find((item) => item.id === id)!).filter(Boolean), [selected]);

  const setCount = (count: number) => {
    setPlayerCount(count);
    setSelected((current) => [...current, ...archetypes.map((item) => item.id).filter((id) => !current.includes(id))].slice(0, count));
  };

  const randomCast = () => {
    const nextSeed = Math.floor(Math.random() * 900000000) + 100000000;
    const random = seededRandom(nextSeed);
    const ids = [...archetypes.map((item) => item.id)];
    ids.sort(() => random() - 0.5);
    setSeed(nextSeed); setSelected(ids.slice(0, playerCount));
  };

  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < playerCount ? [...current, id] : [...current.slice(1), id]);

  const enterGame = () => {
    const cast = newPlayers(selected, locale, seed);
    const relations: Record<string, number> = {};
    cast.forEach((a) => cast.forEach((b) => { if (a.id !== b.id) relations[relationKey(a.id, b.id)] = 0; }));
    setPlayers(cast); setRelationships(relations); setTimeline([]); setCurrentMonth(0); setProgress(0); setEnding(null); setGameId(makeId(seed)); setError(""); setView("game");
  };

  const addEntry = (entries: TimelineEntry[], entry: Omit<TimelineEntry, "id" | "timestamp">) => {
    const full = { ...entry, id: `T${String(entries.length + 1).padStart(4, "0")}`, timestamp: new Date().toISOString() } as TimelineEntry;
    entries.push(full); return full;
  };

  const applyVerdict = (player: PlayerState, event: MonthlyEvent & { draw: Record<string, number> }, decision: BatchDecision, verdict: BatchVerdict, month: number) => {
    const next = { ...player, ageMonths: month, position: moveToward(player.position, event, seed, player.id, month), active: player.active && !verdict.eliminated };
    statKeys.forEach((key) => { (next as any)[key] = clamp(Number((next as any)[key]) + Number(verdict.statDeltas?.[key] || 0), 0, statCaps[key]); });
    next.worldview = { ...next.worldview };
    viewKeys.forEach((key) => { next.worldview[key] = clamp(next.worldview[key] + Number(verdict.worldviewDeltas?.[key] || 0)); });
    const episode = `${month}: ${event.title[locale]} / ${decision.action} / ${verdict.verdict}`;
    const compacted = compactContext(next, episode, verdict.salientMemory);
    compacted.monthlyHistory = [...player.monthlyHistory, episode];
    if (verdict.beliefUpdate && !compacted.beliefs.includes(verdict.beliefUpdate)) compacted.beliefs = [...compacted.beliefs, verdict.beliefUpdate].slice(-10);
    return compacted;
  };

  const processEncounter = async (stage: EncounterStage, month: number, current: PlayerState[], relations: Record<string, number>, entries: TimelineEntry[]) => {
    const check = encounterGroups(current, stage, seed);
    let finalResult: EncounterResult | null = null;
    addEntry(entries, { kind: "meeting-check", month, title: stage === "final" ? t.finalMeeting : t.encounterCheck, payload: check as unknown as Record<string, any> });
    setTimeline([...entries]);
    for (const group of check.groups) {
      const meetingPlayers = current.filter((player) => group.includes(player.id) && player.active);
      const assignments = meetingPlayers.map((player) => ({ player, events: [{ id: `encounter-${stage}-${month}`, month, title: { zh: stage === "final" ? "终局会合" : "命途交汇", en: stage === "final" ? "Final convergence" : "Paths cross" }, description: { zh: `你在${locations.find((item) => item.id === player.position.regionId)?.name.zh || "途中"}遇到了其他主角。`, en: `You meet the other protagonists near ${locations.find((item) => item.id === player.position.regionId)?.name.en || "the road"}.` }, choice: { zh: "合作、试探、避开，还是开战？", en: "Cooperate, probe, withdraw, or fight?" }, tier: stage === "final" ? 4 : stage === "middle" ? 3 : 2, polarity: "mixed", category: "encounter", regionId: player.position.regionId, baseEffects: {}, worldviewEffects: {} }] }));
      const actorResult = await callApi<{ decisions: BatchDecision[] }>({ mode: "batch-actors", locale, checkpoint: { stage, month, type: "encounter" }, assignments, relationships: relations, recentLogs: entries.slice(-12) });
      const result = await callApi<EncounterResult>({ mode: "encounter-judge", locale, judge, stage, month, meetingCheck: check.checks.filter((item) => group.includes(item.a) && group.includes(item.b)), players: meetingPlayers, relationships: relations, decisions: actorResult.data.decisions, recentLogs: entries.slice(-14) });
      const outcome = result.data;
      current = current.map((player) => {
        const effect = outcome.effects?.find((item) => item.playerId === player.id);
        if (!effect) return player;
        const next = { ...player, active: player.active && !outcome.eliminatedIds?.includes(player.id), worldview: { ...player.worldview } };
        statKeys.forEach((key) => { (next as any)[key] = clamp(Number((next as any)[key]) + Number(effect.statDeltas?.[key] || 0), 0, statCaps[key]); });
        viewKeys.forEach((key) => { next.worldview[key] = clamp(next.worldview[key] + Number(effect.worldviewDeltas?.[key] || 0)); });
        next.salientMemories = [...next.salientMemories, effect.memory].filter(Boolean).slice(-8);
        if (effect.beliefUpdate) next.beliefs = [...next.beliefs, effect.beliefUpdate].slice(-10);
        return next;
      });
      outcome.relationshipChanges?.forEach((change) => { const key = relationKey(change.fromId, change.toId); relations[key] = clamp((relations[key] || 0) + change.delta, -100, 100); });
      addEntry(entries, { kind: stage === "final" ? "ending" : "encounter", month, title: outcome.title, payload: { ...outcome, decisions: actorResult.data.decisions }, model: result.model, usage: result.usage });
      if (stage === "final") setEnding(outcome);
      if (stage === "final") finalResult = outcome;
      setPlayers([...current]); setRelationships({ ...relations }); setTimeline([...entries]);
    }
    return { players: current, relationships: relations, ending: finalResult };
  };

  const runDecade = async () => {
    if (busy || !players.length) return;
    setBusy(true); setError(""); setEnding(null);
    let current = structuredClone(players);
    let relations = { ...relationships };
    let finalOutcome: EncounterResult | null = null;
    const entries: TimelineEntry[] = [];
    try {
      let start = 1;
      while (start <= 120) {
        const boundary = start <= 40 ? 40 : start <= 80 ? 80 : 120;
        const end = Math.min(start + 5, boundary);
        setStatus(`${phaseLabel(start, locale)} · ${t.month.replace("{n}", `${start}-${end}`)}`);
        const assignments = current.filter((player) => player.active).map((player) => {
          const profile = archetypes.find((item) => item.id === player.archetypeId)!;
          const monthlyEvents = [];
          for (let month = start; month <= end; month++) monthlyEvents.push({ ...drawMonthlyEvent(profile, player.id, month, seed), month });
          return { player, events: monthlyEvents };
        });
        const actorResult = await callApi<{ decisions: BatchDecision[] }>({ mode: "batch-actors", locale, checkpoint: { start, end, phase: phaseAt(start) }, assignments, relationships: relations, recentLogs: entries.slice(-12) });
        const judgeResult = await callApi<{ verdicts: BatchVerdict[] }>({ mode: "batch-judge", locale, judge, checkpoint: { start, end, phase: phaseAt(start) }, players: current, assignments, decisions: actorResult.data.decisions, recentLogs: entries.slice(-12) });
        for (let month = start; month <= end; month++) for (const assignment of assignments) {
          const event = assignment.events.find((item: any) => item.month === month)! as MonthlyEvent & { month: number; draw: Record<string, number> };
          const decision = actorResult.data.decisions.find((item) => item.playerId === assignment.player.id && item.month === month && item.eventId === event.id);
          const verdict = judgeResult.data.verdicts.find((item) => item.playerId === assignment.player.id && item.month === month && item.eventId === event.id);
          if (!decision || !verdict) throw new Error(`Missing monthly record for ${assignment.player.id}, month ${month}`);
          const before = archiveSnapshot(structuredClone(current.find((item) => item.id === assignment.player.id)!));
          current = current.map((player) => player.id === assignment.player.id ? applyVerdict(player, event, decision, verdict, month) : player);
          const after = archiveSnapshot(current.find((item) => item.id === assignment.player.id)!);
          addEntry(entries, { kind: "month", month, playerId: assignment.player.id, title: event.title[locale], model: `${actorResult.model} + ${judgeResult.model}`, usage: { total_tokens: Number(actorResult.usage?.total_tokens || 0) + Number(judgeResult.usage?.total_tokens || 0) }, payload: { event, decision, verdict, before, after, phase: phaseAt(month) } });
        }
        setPlayers([...current]); setTimeline([...entries]); setCurrentMonth(end); setProgress(end / 120);
        if ([40, 80, 120].includes(end)) {
          const encounter = await processEncounter(end === 40 ? "early" : end === 80 ? "middle" : "final", end, current, relations, entries);
          current = encounter.players; relations = encounter.relationships;
          if (encounter.ending) finalOutcome = encounter.ending;
        }
        start = end + 1;
      }
      setStatus(t.ended);
      await saveArchive(current, relations, entries, finalOutcome);
    } catch (failure) { setError(failure instanceof Error ? failure.message : String(failure)); } finally { setBusy(false); }
  };

  const makeArchive = (cast = players, relations = relationships, entries = timeline, final = ending) => ({ version: "2.0", gameId, createdAt: new Date().toISOString(), locale, configuration: { years: 10, months: 120, checkpointMonths: 6, playerCount, seed, eventPoolSize: eventPool.length, actorModel: "deepseek-v4-flash", judgeModel: "deepseek-v4-pro" }, judge, players: cast, relationships: relations, ending: final, timeline: entries });

  const report = (archive: ReturnType<typeof makeArchive>) => {
    const names = Object.fromEntries(archive.players.map((player) => [player.id, player.name]));
    const lines = [`# ${locale === "zh" ? "万象局十年对局档案" : "Power Fantasy Arena: ten-year record"}`, "", `- ID: ${archive.gameId}`, `- Seed: ${seed}`, `- Cast: ${archive.players.map((player) => `${player.name} / ${archetypes.find((item) => item.id === player.archetypeId)?.name[locale]}`).join(", ")}`, `- Span: 18 → 28 / 120 months`, `- Event pool: ${eventPool.length}`, "", `> ${t.safety}`, ""];
    archive.timeline.forEach((entry) => {
      lines.push(`## ${entry.id} · ${entry.title}`, "", `- ${t.month.replace("{n}", String(entry.month))} · ${formatAge(entry.month, locale)}`, `- ${entry.playerId ? names[entry.playerId] : judge.name}`, "");
      if (entry.kind === "month") { const { event, decision, verdict, before, after } = entry.payload; lines.push(event.description[locale], "", `### ${t.decision}`, decision.action, "", `> ${decision.publicStatement}`, "", `#### ${t.basis}`, ...decision.decisionBasis.map((item: string) => `- ${item}`), "", `#### ${t.rejected}`, `- ${decision.consideredOption.option}: ${decision.consideredOption.whyRejected}`, "", `### ${t.judge}`, verdict.verdict, "", verdict.narrative, "", `#### ${t.fairness}`, verdict.fairnessCheck, "", `#### ${t.change}`, ...statKeys.map((key, index) => `- ${t.stats[index]}: ${before[key]} → ${after[key]}`), ...viewKeys.map((key, index) => `- ${t.worldviews[index]}: ${before.worldview[key]} → ${after.worldview[key]}`)); }
      if (entry.kind === "meeting-check") lines.push(JSON.stringify(entry.payload.checks, null, 2));
      if (entry.kind === "encounter" || entry.kind === "ending") lines.push(entry.payload.narrative, "", `### ${t.fairness}`, entry.payload.fairnessCheck, "", `### ${t.decision}`, ...entry.payload.decisions.map((item: BatchDecision) => `- ${names[item.playerId]}: ${item.action}`));
      lines.push("");
    });
    return lines.join("\n");
  };

  const saveArchive = async (cast = players, relations = relationships, entries = timeline, final = ending) => {
    const archive = makeArchive(cast, relations, entries, final);
    const response = await fetch("/api/archive", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId, archive, report: report(archive) }) });
    if (!response.ok) throw new Error((await response.json()).error || "Archive save failed");
    return response.json();
  };

  return <main className="shell decadeShell">
    <header className="topbar"><button className="brand brandButton" onClick={() => setView("home")}><span className="brandMark">界</span><span><b>万象局</b><small>POWER FANTASY ARENA</small></span></button><nav>{t.nav.map((label, index) => <button key={label} className={(index === 0 && ["home", "game"].includes(view)) || (index === 1 && view === "profiles") || (index === 2 && view === "method") ? "navActive" : ""} onClick={() => setView(index === 0 ? "home" : index === 1 ? "profiles" : "method")}>{label}</button>)}</nav><div className="topActions"><span className={`apiDot ${apiReady ? "ok" : ""}`} /><button className="lang" onClick={() => setLocale(locale === "zh" ? "en" : "zh")}>{locale === "zh" ? "中 / EN" : "EN / 中"}</button></div></header>

    {view === "home" && <><section className="hero decadeHero"><div className="eyebrow"><span>AGE 18 → 28</span><i />{t.kicker}</div><h1>{t.hero.split("\n").map((line) => <span key={line}>{line}<br /></span>)}</h1><p>{t.intro}</p><div className="heroActions"><button className="primary" onClick={() => setupRef.current?.scrollIntoView({ behavior: "smooth" })}>{t.setup}<span>→</span></button><button className="secondary" onClick={() => setView("method")}>{t.readRules}</button></div><div className="metrics"><div><strong>{t.years}</strong><span>{t.months}</span></div><div><strong>120</strong><span>{t.pool}</span></div><div><strong>1</strong><span>{t.referee}</span></div></div></section><section className="profiles compactProfiles"><div className="sectionHead"><div><span>THE CAST</span><h2>{t.profiles}</h2></div><p>{t.profileNote}</p></div><ProfileGrid locale={locale} selected={selected} onToggle={toggle} /></section><section className="setupSection" ref={setupRef}><div className="setupCard decadeSetup"><div className="setupTitle"><span>RUN CONFIGURATION</span><h2>{t.gameSetup}</h2><p>{apiReady ? t.apiReady : t.apiMissing}</p></div><div className="controlGroup"><label>{t.playerCount}</label><div className="segmented">{[2,3,4,5,6].map((count) => <button key={count} className={count === playerCount ? "active" : ""} onClick={() => setCount(count)}>{count}</button>)}</div></div><div className="controlGroup fixedSpan"><label>{t.fixedTime}</label><strong>18 → 28</strong><span>120 MONTHS</span></div><div className="controlGroup"><label>{t.seed}</label><input className="seedInput" value={seed} type="number" onChange={(event) => setSeed(Number(event.target.value))} /><button className="randomBtn" onClick={randomCast}>↻ {t.random}</button></div><div className="selectedRow"><label>{t.selected}</label><div>{chosenProfiles.map((profile) => <span key={profile.id} style={{ borderColor: profile.color }}>{profile.characterName[locale]} · {profile.name[locale]}</span>)}</div></div><button className="launch" disabled={!apiReady || selected.length !== playerCount} onClick={enterGame}>{t.launch}<b>→</b></button></div></section></>}

    {view === "game" && <section className="decadeGame"><div className="runHeader"><div><span>{gameId || "TEN-YEAR RUN"}</span><h1>{ending?.title || (busy ? status : formatAge(currentMonth, locale))}</h1><p>{phaseLabel(Math.max(1, currentMonth), locale)} · {currentMonth}/120</p></div><div className="runActions">{timeline.length > 0 && <button onClick={() => saveArchive()}>{t.save}</button>}<button onClick={() => setView("home")}>{t.reset}</button></div></div><div className="progressRail"><i style={{ width: `${progress * 100}%` }} /><span>{Math.round(progress * 100)}%</span></div>{error && <div className="errorBox">{error}</div>}<div className="castStrip">{players.map((player) => <PlayerCard key={player.id} player={player} locale={locale} />)}</div><div className="decadeGrid"><aside><WorldMap players={players} locale={locale} /><div className="refereeBox"><div className={`judgeSeal ${busy ? "pulse" : ""}`}>衡</div><div><h3>{judge.name}</h3><p>DeepSeek V4 Pro</p></div><button className="runButton" disabled={busy || currentMonth >= 120} onClick={runDecade}>{busy ? t.running : `▶ ${t.run}`}</button><small>{t.checkpoints} · {eventPool.length} {t.eventPool}</small></div></aside><section className="decadeTimeline"><div className="ledgerHead"><span>MONTHLY TRACE / {timeline.length}</span><h2>{t.timeline}</h2></div>{timeline.length === 0 ? <p className="emptyLedger">{t.empty}</p> : <div className="timeline">{[...timeline].reverse().map((entry) => <TimelineCard key={entry.id} entry={entry} players={players} locale={locale} />)}</div>}</section></div></section>}

    {view === "profiles" && <section className="library"><div className="libraryIntro"><span>THE CAST</span><h1>{t.profiles}</h1><p>{t.profileNote}</p></div><div className="profileDetails">{archetypes.map((profile, index) => <article key={profile.id} style={{ "--accent": profile.color } as React.CSSProperties}><div className="detailIndex">0{index + 1}</div><div><span className="detailTag">{profile.epithet[locale]}</span><h2>{profile.characterName[locale]}</h2><h3>{profile.name[locale]}</h3><p>{profile.premise[locale]}</p></div><dl><div><dt>{t.halo} · {profile.halo.base}</dt><dd>{profile.halo.description[locale]}</dd></div><div><dt>VALUES</dt><dd>{profile.values[locale].join(" · ")}</dd></div><div><dt>DECISION RULES</dt><dd>{profile.decisionRules[locale].join(" / ")}</dd></div><div><dt>BLIND SPOTS</dt><dd>{profile.blindSpots[locale].join(" / ")}</dd></div></dl></article>)}</div></section>}

    {view === "method" && <section className="methodPage"><div className="methodHero"><span>HOW THE HARNESS WORKS</span><h1>{t.methodTitle}</h1><p>{t.methodIntro}</p></div><div className="ruleGrid"><article><b>120</b><h3>{t.eventPool}</h3><p>{locale === "zh" ? "30 个网文母题，各分四档强度。光环改变好运、坏事和混合事件的抽取权重。" : "Thirty web-fiction motifs, each with four intensity tiers. Halo changes the draw weights for fortune, peril, and mixed events."}</p></article><article><b>40 / 80 / 120</b><h3>{t.encounterCheck}</h3><p>{locale === "zh" ? "前期看运气和距离，中期基础概率上升，最后一个月所有存活者必定会合。" : "Early meetings depend on luck and distance. Midgame odds rise. Every survivor converges in month 120."}</p></article><article><b>6</b><h3>{t.checkpoints}</h3><p>{t.methodIntro}</p></article><article><b>∞</b><h3>LOSSLESS RUN FOLDER</h3><p>{locale === "zh" ? "每局都有自己的文件夹，保存 Markdown 报告和完整 JSON。" : "Every run gets its own folder with a Markdown report and the full JSON trace."}</p></article></div><div className="ethicsNote"><b>DECISION RECORD</b><p>{t.safety}</p></div></section>}
  </main>;
}

function ProfileGrid({ locale, selected, onToggle }: { locale: Locale; selected: string[]; onToggle: (id: string) => void }) { return <div className="profileGrid">{archetypes.map((profile, index) => <article key={profile.id} className={selected.includes(profile.id) ? "featured" : ""} style={{ "--profile": profile.color } as React.CSSProperties}><span>0{index + 1}</span><div className="sigil">{profile.characterName[locale][0]}</div><h3>{profile.characterName[locale]}</h3><b>{profile.name[locale]}</b><p>{profile.halo.description[locale]}</p><button onClick={() => onToggle(profile.id)} aria-label={profile.characterName[locale]}>{selected.includes(profile.id) ? "✓" : "＋"}</button></article>)}</div>; }

function PlayerCard({ player, locale }: { player: PlayerState; locale: Locale }) { const profile = archetypes.find((item) => item.id === player.archetypeId)!; const keys = ["power", "health", "resources", "reputation", "halo"] as const; return <article className={`playerCard decadePlayer ${player.active ? "" : "inactive"}`} style={{ "--player": profile.color } as React.CSSProperties}><div className="playerTop"><span>{profile.name[locale]}</span><b>{player.name}</b></div><div className="miniStats">{keys.map((key, index) => <span key={key}><i>{ui[locale].stats[[0,1,2,3,7][index]]}</i><b>{player[key]}</b></span>)}</div><p>{player.active ? (player.beliefs.at(-1) || profile.epithet[locale]) : ui[locale].eliminated}</p></article>; }

function WorldMap({ players, locale }: { players: PlayerState[]; locale: Locale }) { return <section className="worldMap"><div className="mapHead"><span>COORDINATES</span><h2>{ui[locale].map}</h2></div><div className="mapField">{locations.map((location) => <span key={location.id} className="mapLocation" style={{ left: `${location.x}%`, top: `${location.y}%` }} title={location.terrain[locale]}><i />{location.name[locale]}</span>)}{players.map((player) => { const profile = archetypes.find((item) => item.id === player.archetypeId)!; return <span key={player.id} className={`mapPlayer ${player.active ? "" : "inactive"}`} style={{ left: `${player.position.x}%`, top: `${player.position.y}%`, "--marker": profile.color } as React.CSSProperties}><b>{player.name.slice(0,1)}</b><em>{player.name}</em></span>; })}</div>{players.length === 2 && <p className="distanceLine">{ui[locale].distance}: {mapDistance(players[0].position, players[1].position)}</p>}</section>; }

function TimelineCard({ entry, players, locale }: { entry: TimelineEntry; players: PlayerState[]; locale: Locale }) { const t = ui[locale]; const name = players.find((player) => player.id === entry.playerId)?.name; if (entry.kind === "month") { const { event, decision, verdict, before, after } = entry.payload; return <article className="monthCard"><div className="monthMeta"><b>{String(entry.month).padStart(3, "0")}</b><span>{formatAge(entry.month, locale)}</span><em>{name}</em><small>{event.polarity} · T{event.tier}</small></div><div className="monthBody"><header><span>{phaseLabel(entry.month, locale)}</span><h3>{entry.title}</h3><p>{event.description[locale]}</p></header><div className="decisionBlock"><h4>{t.decision}</h4><p className="lead">{decision.action}</p><blockquote>{decision.publicStatement}</blockquote><ul>{decision.decisionBasis.map((item: string) => <li key={item}>{item}</li>)}</ul><details><summary>{t.rejected}</summary><p>{decision.consideredOption.option}: {decision.consideredOption.whyRejected}</p></details></div><div className="verdictBlock"><h4>{t.judge}</h4><p className="lead">{verdict.verdict}</p><p>{verdict.narrative}</p><div className="fairness"><b>{t.fairness}</b>{verdict.fairnessCheck}</div></div><div className="deltaRow">{statKeys.map((key, index) => before[key] !== after[key] && <span key={key} className={after[key] > before[key] ? "up" : "down"}>{t.stats[index]} {before[key]}→{after[key]}</span>)}</div></div></article>; }
  const checks = entry.payload.checks || [];
  return <article className={`specialCard ${entry.kind}`}><div><span>{entry.kind === "meeting-check" ? t.encounterCheck : entry.kind === "ending" ? t.ended : t.encounter}</span><h3>{entry.title}</h3></div>{entry.kind === "meeting-check" ? <ul>{checks.map((check: any) => <li key={`${check.a}-${check.b}`}>{players.find((player) => player.id === check.a)?.name} / {players.find((player) => player.id === check.b)?.name}: d={check.distance}, p={Math.round(check.probability * 100)}%, roll={Math.round(check.roll * 100)}% · {check.met ? t.encounter : t.noMeeting}</li>)}</ul> : <><p>{entry.payload.narrative}</p><div className="fairness"><b>{t.fairness}</b>{entry.payload.fairnessCheck}</div></>}</article>;
}
