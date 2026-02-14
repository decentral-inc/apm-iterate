/* ── API client for the FastAPI backend ── */

const BASE = '/api';

async function request<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || body.error || res.statusText);
  }
  return res.json();
}

/* ── Types ── */

export interface Stats {
  total: number;
  signed_up: number;
  not_engaged: number;
  by_source: Record<string, number>;
  by_company_size: Record<string, number>;
  by_role: Record<string, number>;
  by_industry: Record<string, number>;
}

export interface MockCrmResponse {
  message: string;
  inserted: number;
  stats: Stats;
}

export interface Brief {
  id: string;
  content: any;
  summary: string;
  confidence_score: number;
  agent_outputs: any;
  feedback: string | null;
  parent_brief_id: string | null;
  created_at: string;
}

/* ── Endpoints ── */

export const mockConnectCrm = () =>
  request<MockCrmResponse>('/mock-crm', { method: 'POST' });

export const fetchMetrics = () =>
  request<Stats>('/metrics');

export const generateBrief = () =>
  request<Brief>('/generate-brief', { method: 'POST' });

export const submitFeedback = (brief_id: string, feedback: string) =>
  request<Brief>('/feedback', {
    method: 'POST',
    body: JSON.stringify({ brief_id, feedback }),
  });

export const fetchLatestBrief = () =>
  request<Brief>('/brief');
