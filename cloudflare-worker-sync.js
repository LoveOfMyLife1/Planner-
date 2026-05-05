const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Sync-Key",
  "Access-Control-Max-Age": "86400"
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

    if (env.SYNC_KEY) {
      const providedKey = request.headers.get("X-Sync-Key");
      if (providedKey !== env.SYNC_KEY) return json({ error: "Unauthorized" }, 401);
    }

    if (request.method === "GET") {
      const saved = await env.TASK_PLANNER.get("tasks");
      return new Response(saved || "null", {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });
    }

    if (request.method === "PUT") {
      const body = await request.text();
      JSON.parse(body);
      await env.TASK_PLANNER.put("tasks", body);
      return json({ ok: true });
    }

    return json({ error: "Method not allowed" }, 405);
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
  });
}
