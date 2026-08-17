import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const gameId = String(body.gameId || "");
    if (!/^run-[A-Za-z0-9-]+$/.test(gameId)) return Response.json({ error: "Invalid game ID" }, { status: 400 });
    const root = path.resolve(process.cwd(), "runs");
    const folder = path.resolve(root, gameId);
    if (!folder.startsWith(`${root}${path.sep}`)) return Response.json({ error: "Invalid archive path" }, { status: 400 });
    await mkdir(folder, { recursive: true });
    await writeFile(path.join(folder, "report.md"), String(body.report || ""), "utf8");
    await writeFile(path.join(folder, "timeline.json"), JSON.stringify(body.archive, null, 2), "utf8");
    await writeFile(path.join(folder, "summary.json"), JSON.stringify({ gameId, createdAt: body.archive?.createdAt, configuration: body.archive?.configuration, ending: body.archive?.ending, players: body.archive?.players }, null, 2), "utf8");
    return Response.json({ saved: true, folder });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Archive save failed" }, { status: 500 });
  }
}
