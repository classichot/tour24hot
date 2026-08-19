import { TAP_AGENCIES, TAP_TOOLS, TAP_VERSION } from "@/lib/tap";

export function GET() {
  const body = [
    `# TOUR24 — Agent Engine Optimization`,
    `# Tour Agent Protocol (TAP) ${TAP_VERSION}`,
    ``,
    `TOUR24 is AI-native distribution and comparison infrastructure`,
    `connecting travelers, AI agents and verified tour operators.`,
    ``,
    `Compare by humans. Discoverable by AI. Book direct.`,
    ``,
    `Traveler → AI agent → TOUR24 Agent Gateway → verified travel agencies → live package / price / seats / terms → direct booking.`,
    `The agency is the merchant of record. Klook / KKday / Traveloka are not in the path.`,
    ``,
    `Identity: /agent.json`,
    `Well-known: /.well-known/tour24.json`,
    `Registry: GET /api/agent/discover`,
    `Search: GET /api/agent/search`,
    `Tools: POST /api/agent/invoke  { "tool": "search", "arguments": { ... } }`,
    `MCP: GET /api/agent/mcp`,
    `Feed: GET /api/agent/feed`,
    `Playground: /agents`,
    `Agencies: /agent-direct`,
    ``,
    `Tools:`,
    ...TAP_TOOLS.map((t) => `- ${t.name}: ${t.description}`),
    ``,
    `Verified agencies (Agent Direct):`,
    ...Object.entries(TAP_AGENCIES)
      .filter(([, tap]) => tap.agentDirect)
      .map(([id, tap]) => `- ${tap.tour24Id} ${id} · ${tap.destinations.join(", ")}`),
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Access-Control-Allow-Origin": "*" },
  });
}
