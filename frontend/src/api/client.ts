/* ── API client for the FastAPI backend ── */

const BASE = '/api';

async function request<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body.detail ?? body.error ?? res.statusText;
    if (res.status === 404) {
      throw new Error(
        `${msg}. Is the backend running on the port Vite proxies to (default 4000)? Try: cd backend && python main.py`
      );
    }
    throw new Error(Array.isArray(msg) ? msg.join(' ') : msg);
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
