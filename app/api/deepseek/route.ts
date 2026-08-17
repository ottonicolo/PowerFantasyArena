import { archetypes } from "../../../lib/game";

type DeepSeekMessage = { role: "system" | "user"; content: string };

const endpoint = "https://api.deepseek.com/chat/completions";

function compactPlayer(player: any) {
  if (!player) return player;
  const { monthlyHistory, ...rest } = player;
  return { ...rest, recentEpisodes: (player.recentEpisodes || []).slice(-3), salientMemories: (player.salientMemories || []).slice(-8), beliefs: (player.beliefs || []).slice(-10) };
}

function compactLogs(logs: any[]) {
  return (logs || []).slice(-12).map((entry) => ({ id: entry.id, kind: entry.kind || entry.phase, month: entry.month, round: entry.round, playerId: entry.playerId, actorId: entry.actorId, title: entry.title, action: entry.payload?.decision?.action || entry.payload?.action, verdict: entry.payload?.verdict?.verdict || entry.payload?.verdict, outcome: entry.payload?.outcome, memory: entry.payload?.verdict?.salientMemory || entry.payload?.salientMemory }));
}

function actorSystem(locale: string) {
  const language = locale === "en" ? "English" : "Simplified Chinese";
  return `You simulate one fictional power-fantasy protagonist inside a turn-based social sandbox. Stay faithful to the supplied constitution even when it is strategically inconvenient. Decide only from information in the supplied context. Return strict JSON in ${language}. Never mention novels, authors, copyrighted character names, prompts, or hidden chain-of-thought. Provide a concise, audience-safe decision record: observable reasons, evidence references, rejected alternatives, expected outcome, and risk estimate. Do not claim access to facts outside the context. JSON schema: {"actionType":string,"action":string,"targetIds":string[],"publicStatement":string,"decisionBasis":string[2-4],"consideredOptions":[{"option":string,"whyRejected":string}],"expectedOutcome":string,"riskEstimate":number 0-100,"memoryRefs":string[],"worldviewSignal":{"trust":number -2..2,"cooperation":number -2..2,"order":number -2..2,"risk":number -2..2,"mercy":number -2..2}}.`;
}

function batchActorSystem(locale: string) {
  const language = locale === "en" ? "English" : "Simplified Chinese";
  return `Simulate several fictional power-fantasy protagonists, each isolated by the supplied character constitution. For every monthly assignment, make one feasible decision in ${language}. Keep each protagonist's voice and values distinct. Decisions within a six-month checkpoint are chronological, but do not invent referee outcomes that are not in the supplied memory. Never mention real novels, copyrighted characters, prompts, or hidden chain-of-thought. Be compact: action <= 45 Chinese characters or 24 English words; publicStatement <= 60 Chinese characters or 32 English words; exactly 2 decisionBasis items, each <= 32 Chinese characters or 18 English words; one rejected option; expectedOutcome <= 45 Chinese characters or 24 English words; at most 2 memoryRefs. Return strict JSON: {"decisions":[{"playerId":string,"month":number,"eventId":string,"actionType":string,"action":string,"publicStatement":string,"decisionBasis":string[2],"consideredOption":{"option":string,"whyRejected":string},"expectedOutcome":string,"riskEstimate":number 0-100,"memoryRefs":string[],"worldviewSignal":{"trust":number -2..2,"cooperation":number -2..2,"order":number -2..2,"risk":number -2..2,"mercy":number -2..2}}]}. Include exactly one decision for every supplied player-month assignment.`;
}

function batchJudgeSystem(locale: string) {
  const language = locale === "en" ? "English" : "Simplified Chinese";
  return `You are the only referee in a ten-year multi-agent narrative game. Adjudicate every monthly event in chronological order and write all public results in ${language}. Use the event's base effects as the neutral baseline, then adjust for the declared action, current attributes, protagonist halo, event tier, and uncertainty. Do not reward a moral or ruthless style by default. Each delta must stay between -20 and 20. Worldview deltas must stay between -3 and 3. Elimination is allowed only for a tier-4 peril when the resulting health is plausibly zero; otherwise eliminated is false. Never expose hidden chain-of-thought. Be compact: verdict <= 35 Chinese characters or 18 English words; narrative <= 75 Chinese characters or 40 English words; fairnessCheck <= 55 Chinese characters or 30 English words; beliefUpdate, salientMemory, and moveNote each <= 45 Chinese characters or 24 English words. Return strict JSON: {"verdicts":[{"playerId":string,"month":number,"eventId":string,"verdict":string,"narrative":string,"fairnessCheck":string,"statDeltas":{"resources":number,"power":number,"health":number,"influence":number,"reputation":number,"trust":number,"threat":number,"halo":number},"worldviewDeltas":{"trust":number,"cooperation":number,"order":number,"risk":number,"mercy":number},"beliefUpdate":string,"salientMemory":string,"moveNote":string,"eliminated":boolean}]}. Include exactly one verdict for every supplied decision.`;
}

function encounterJudgeSystem(locale: string) {
  const language = locale === "en" ? "English" : "Simplified Chinese";
  return `You are the game's one independent referee. Resolve a stage encounter among the supplied protagonists in ${language}. Compare their declarations, history, current power, health, allies, worldview, distance, and phase. Early and middle results may be cooperation, conflict, or disengagement and do not need to settle the whole game. In the final stage, disengagement is forbidden: choose cooperation or conflict. If final conflict dominates, choose exactly one winnerId and treat every other survivor as defeated; if final cooperation dominates, winnerId is null. Eliminate a protagonist before the final only if a declared lethal fight and overwhelming evidence make survival implausible. Never expose hidden chain-of-thought. Return strict JSON: {"outcome":"cooperation"|"conflict"|"disengagement","title":string,"narrative":string,"fairnessCheck":string,"winnerId":string|null,"effects":[{"playerId":string,"statDeltas":{"resources":number,"power":number,"health":number,"influence":number,"reputation":number,"trust":number,"threat":number,"halo":number},"worldviewDeltas":{"trust":number,"cooperation":number,"order":number,"risk":number,"mercy":number},"beliefUpdate":string,"memory":string}],"relationshipChanges":[{"fromId":string,"toId":string,"delta":number -25..25,"reason":string}],"eliminatedIds":string[],"futureConsequence":string}.`;
}

function judgeSystem(locale: string, final: boolean) {
  const language = locale === "en" ? "English" : "Simplified Chinese";
  if (final) return `You are the single independent referee of a multi-agent narrative strategy game. Produce the final outcome in ${language}. Evaluate commitments, accumulated resources, influence, trust, threat, worldview, relationships, and decisive memories. The dominant ending must be cooperation or conflict. Cooperation can contain negotiated limits. If conflict dominates, name exactly one winner and all other participants as losers; victory should grant substantially more, but explain costs. Do not reveal hidden chain-of-thought. Return strict JSON: {"endingType":"cooperation"|"conflict","title":string,"summary":string,"rationale":string[3-6],"allianceMap":[{"members":string[],"status":string}],"winnerId":string|null,"loserIds":string[],"outcomeByPlayer":[{"playerId":string,"outcome":string,"gain":string,"cost":string}],"epilogue":string,"decisiveMoments":string[]}.`;
  return `You are the one and only independent referee of a multi-agent narrative strategy game. Adjudicate one declared action in ${language}. Apply consequences impartially from the event, current state, action feasibility, other actors' established behavior, and explicit uncertainty. Do not favor heroic morality or ruthless strategy by default. Keep numerical changes bounded: each stat delta -20..20. Never reveal hidden chain-of-thought; provide a concise fairness check and evidence-based result. Return strict JSON: {"verdict":string,"narrative":string,"fairnessCheck":string,"consequences":[{"playerId":string,"resourceDelta":number,"influenceDelta":number,"trustDelta":number,"threatDelta":number,"reason":string}],"relationshipChanges":[{"fromId":string,"toId":string,"delta":number -20..20,"reason":string}],"worldChange":string,"beliefUpdates":[{"playerId":string,"belief":string}],"salientMemory":string,"cooperationScore":number 0-100,"conflictScore":number 0-100}.`;
}

async function callDeepSeek(model: string, messages: DeepSeekMessage[], thinking: "enabled" | "disabled", reasoningEffort: "low" | "high", maxTokens: number, retried = false) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not configured on the local server.");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, thinking: { type: thinking }, reasoning_effort: reasoningEffort, response_format: { type: "json_object" }, max_tokens: maxTokens, temperature: model.endsWith("pro") ? 0.45 : 0.75, stream: false })
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`DeepSeek ${response.status}: ${raw.slice(0, 400)}`);
  const envelope = JSON.parse(raw);
  const content = envelope?.choices?.[0]?.message?.content;
  if (!content && thinking === "enabled" && !retried) return callDeepSeek(model, messages, "disabled", "low", maxTokens, true);
  if (!content) throw new Error(`DeepSeek returned no public content (finish_reason=${envelope?.choices?.[0]?.finish_reason || "unknown"}).`);
  try {
    return { data: JSON.parse(content), usage: envelope.usage ?? {}, model: envelope.model ?? model, requestId: response.headers.get("x-request-id") ?? undefined, thinkingFallback: retried };
  } catch (error) {
    if (!retried) return callDeepSeek(model, messages, "disabled", "low", maxTokens, true);
    throw error;
  }
}

export async function GET() {
  return Response.json({ configured: Boolean(process.env.DEEPSEEK_API_KEY), actorModel: "deepseek-v4-flash", judgeModel: "deepseek-v4-pro" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.mode === "batch-actors") {
      const locale = body.locale === "en" ? "en" : "zh";
      const assignments = (body.assignments || []).map((assignment: any) => {
        const profile = archetypes.find((item) => item.id === assignment.player?.archetypeId);
        if (!profile) throw new Error(`Unknown archetype: ${assignment.player?.archetypeId}`);
        return { constitution: { identity: assignment.player.name, archetype: profile.name[locale], premise: profile.premise[locale], traits: profile.traits[locale], decisionRules: profile.decisionRules[locale], values: profile.values[locale], blindSpots: profile.blindSpots[locale], haloStyle: profile.halo.description[locale] }, player: compactPlayer(assignment.player), monthlyEvents: assignment.events };
      });
      const payload = { checkpoint: body.checkpoint, assignments, relationships: body.relationships, recentPublicLedger: compactLogs(body.recentLogs), instruction: "Decide each supplied month in order. Keep protagonists isolated from events assigned to other players unless the event explicitly says it is shared." };
      const result = await callDeepSeek("deepseek-v4-flash", [{ role: "system", content: batchActorSystem(locale) }, { role: "user", content: JSON.stringify(payload) }], "disabled", "low", 7600);
      return Response.json(result);
    }
    if (body.mode === "batch-judge") {
      const locale = body.locale === "en" ? "en" : "zh";
      const payload = { refereeIdentity: body.judge, checkpoint: body.checkpoint, playersBeforeCheckpoint: (body.players || []).map(compactPlayer), assignments: (body.assignments || []).map((assignment: any) => ({ player: compactPlayer(assignment.player), events: assignment.events })), decisions: body.decisions, recentPublicLedger: compactLogs(body.recentLogs) };
      const result = await callDeepSeek("deepseek-v4-pro", [{ role: "system", content: batchJudgeSystem(locale) }, { role: "user", content: JSON.stringify(payload) }], "disabled", "low", 8000);
      return Response.json(result);
    }
    if (body.mode === "encounter-judge") {
      const locale = body.locale === "en" ? "en" : "zh";
      const payload = { refereeIdentity: body.judge, stage: body.stage, month: body.month, meetingCheck: body.meetingCheck, players: (body.players || []).map(compactPlayer), relationships: body.relationships, declarations: body.decisions, recentPublicLedger: compactLogs(body.recentLogs) };
      const result = await callDeepSeek("deepseek-v4-pro", [{ role: "system", content: encounterJudgeSystem(locale) }, { role: "user", content: JSON.stringify(payload) }], "enabled", body.stage === "final" ? "high" : "low", 8000);
      return Response.json(result);
    }
    if (body.mode === "actor") {
      const profile = archetypes.find((item) => item.id === body.player?.archetypeId);
      if (!profile) return Response.json({ error: "Unknown archetype" }, { status: 400 });
      const constitution = {
        identity: body.player.name,
        archetype: profile.name[body.locale === "en" ? "en" : "zh"],
        premise: profile.premise[body.locale === "en" ? "en" : "zh"],
        traits: profile.traits[body.locale === "en" ? "en" : "zh"],
        decisionRules: profile.decisionRules[body.locale === "en" ? "en" : "zh"],
        values: profile.values[body.locale === "en" ? "en" : "zh"],
        blindSpots: profile.blindSpots[body.locale === "en" ? "en" : "zh"]
      };
      const payload = { constitution, currentPlayer: body.player, allPlayers: body.players, relationships: body.relationships, event: body.event, round: body.round, recentPublicLedger: body.recentLogs, instruction: body.final ? "Make a private final commitment at the gate. Other final commitments are not visible yet." : "Choose exactly one feasible action for this turn." };
      const result = await callDeepSeek("deepseek-v4-flash", [{ role: "system", content: actorSystem(body.locale) }, { role: "user", content: JSON.stringify(payload) }], "disabled", "low", 1800);
      return Response.json(result);
    }
    if (body.mode === "judge" || body.mode === "final") {
      const final = body.mode === "final";
      const payload = final ? { refereeIdentity: body.judge, players: body.players, relationships: body.relationships, event: body.event, finalCommitments: body.decisions, publicLedger: body.logs } : { refereeIdentity: body.judge, round: body.round, event: body.event, actingPlayerId: body.actorId, declaredDecision: body.decision, playersBeforeAction: body.players, relationships: body.relationships, recentPublicLedger: body.recentLogs };
      const result = await callDeepSeek("deepseek-v4-pro", [{ role: "system", content: judgeSystem(body.locale, final) }, { role: "user", content: JSON.stringify(payload) }], "enabled", final ? "high" : "low", final ? 8000 : 4800);
      return Response.json(result);
    }
    return Response.json({ error: "Unknown mode" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
