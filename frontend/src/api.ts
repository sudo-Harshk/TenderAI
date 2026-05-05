import type { AuditEntry, BidderResult } from "./types";

const API = "http://localhost:8000";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function uploadTender(file: File): Promise<{ message: string; filename: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API}/upload-tender`, { method: "POST", body: form });
  return handleResponse(res);
}

export async function evaluateBidder(file: File, bidderName: string): Promise<BidderResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("bidder_name", bidderName);
  const res = await fetch(`${API}/evaluate-bidder`, { method: "POST", body: form });
  return handleResponse(res);
}

export async function getResults(): Promise<BidderResult[]> {
  const res = await fetch(`${API}/results`);
  return handleResponse(res);
}

export async function submitReview(data: {
  bidder_id: string;
  criterion_id: string;
  confirmed_value: string;
  reviewer_name: string;
}): Promise<BidderResult> {
  const res = await fetch(`${API}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function getAuditLog(): Promise<AuditEntry[]> {
  const res = await fetch(`${API}/audit-log`);
  return handleResponse(res);
}

export async function resetDemo(): Promise<{ message: string }> {
  const res = await fetch(`${API}/reset`, { method: "DELETE" });
  return handleResponse(res);
}
