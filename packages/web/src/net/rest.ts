const base = "/api";

export async function getAgents() { return (await fetch(`${base}/agents`)).json(); }
export async function getHistory(id: string) { return (await fetch(`${base}/agents/${id}/history`)).json(); }
export async function postTask(id: string, task: string) {
  await fetch(`${base}/agents/${id}/task`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task }) });
}
export async function postReply(id: string, text: string) {
  await fetch(`${base}/agents/${id}/reply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
}
export async function addAgent(body: unknown) {
  return (await fetch(`${base}/agents`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json();
}
export async function saveSettings(body: unknown) {
  await fetch(`${base}/settings`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
export async function getSettings() { return (await fetch(`${base}/settings`)).json(); }
export async function getCapabilities() { return (await fetch(`${base}/capabilities`)).json(); }
export async function postDecision(id: string, requestId: string, decision: "allow" | "deny") {
  await fetch(`${base}/agents/${id}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId, decision }) });
}
export async function updateAgent(id: string, patch: unknown) {
  await fetch(`${base}/agents/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
}
export async function deleteAgent(id: string) {
  await fetch(`${base}/agents/${id}`, { method: "DELETE" });
}
