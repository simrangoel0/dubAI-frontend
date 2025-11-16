const API_BASE = "http://localhost:8000";

export async function getChatMessages(conversationId = "default") {
  const res = await fetch(
    `${API_BASE}/api/chat/messages?conversation_id=${encodeURIComponent(
      conversationId
    )}`
  );
  if (!res.ok) throw new Error("Failed to load chat messages");
  const data = await res.json();
  // map backend ChatMessageOut -> frontend Message
  return data.map((m: any) => ({
    id: String(m.id),
    role: m.role === "user" ? "user" : "agent",
    text: m.content,
    timestamp: new Date(m.created_at).getTime(),
  }));
}

export async function getContextGraph() {
  const res = await fetch(`${API_BASE}/api/context/graph`);
  if (!res.ok) throw new Error("Failed to load context graph");
  const data = await res.json();
  // Map ContextNode -> ContextChunk shape used by UI
  return data.nodes.map((n: any) => ({
    id: n.chunk_id,
    file: n.file_path || n.source || n.chunk_id,
    lineStart: n.start_line ?? 0,
    lineEnd: n.end_line ?? 0,
    preview: n.text_preview ?? "",
    totalInfluence: n.stats?.avg_influence ?? 0,
    // small synthetic usage timeline so charts don't break
    usageTimeline: [0.1, 0.2, 0.3, n.stats?.avg_influence ?? 0],
    category: n.source ?? "unknown",
    dropped: false,
  }));
}

export async function getTraceTimeline(limit = 50) {
  const res = await fetch(`${API_BASE}/api/trace-timeline?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to load trace timeline");
  const data = await res.json();
  // Map TimelineItem -> TraceLogRun minimal shape
  return data.map((r: any) => ({
    type: "run",
    run_id: r.run_id,
    summary: r.user_query ?? "",
    timestamp: r.created_at,
    messageId: r.message_id,
    retrieveStep: undefined,
  }));
}

export async function getRunContext(runId: string) {
  const res = await fetch(
    `${API_BASE}/api/trace/run/${encodeURIComponent(runId)}/context`
  );
  if (!res.ok) throw new Error("Failed to load run context");
  const data = await res.json();

  const toRC = (c: any) => ({
    id: c.chunk_id,
    influenceScore: c.influence_score ?? c.influenceScore ?? 0,
    selected: !!c.is_selected,
    rationale: c.selection_rationale ?? "",
    reasoning: c.explanation ?? undefined,
    evidence: c.evidence ?? [],
  });

  return {
    chunks: data.selected.map(toRC),
    droppedChunks: data.dropped.map(toRC),
  };
}

export async function getChunkDetail(chunkId: string) {
  const res = await fetch(
    `${API_BASE}/api/context/${encodeURIComponent(chunkId)}`
  );
  if (!res.ok) throw new Error("Failed to load chunk detail");
  const data = await res.json();
  return data;
}

export async function modifyContext(
  runId: string,
  chunkId: string,
  action: string,
  reason?: string
) {
  const res = await fetch(`${API_BASE}/api/context/modify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ run_id: runId, chunk_id: chunkId, action, reason }),
  });
  if (!res.ok) throw new Error("Failed to modify context");
  return res.json();
}

/**
 * Run pipeline – now sends full conversation history so the backend
 * can index + persist it.
 */
export async function runPipeline(
  query: string,
  history: { role: string; content: string }[],
  conversationId = "default"
) {
  const res = await fetch(`${API_BASE}/api/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      history,
      conversation_id: conversationId,
    }),
  });
  if (!res.ok) throw new Error("Pipeline run failed");
  return res.json();
}
