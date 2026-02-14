/* ── API client for the Node backend ── */

const BASE = '/api';

async function request<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
}

/* ── Types ── */
export interface CrmUser {
  id: string;
  email: string;
  name: string;
  company: string;
  company_size: string;
  role: string;
  industry: string;
  source: string;
  status: string;
  signed_up_at: string | null;
  last_active: string | null;
}

export interface Stats {
  total: number;
  signed_up: number;
  not_engaged: number;
  by_source: Record<string, number>;
  by_company_size: Record<string, number>;
  by_role: Record<string, number>;
  by_industry: Record<string, number>;
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
export const connectCrm = (source: 'salesforce' | 'hubspot') =>
  request<{ message: string; stats: Stats }>(`/connect/${source}`, { method: 'POST' });

export const fetchStats = () => request<Stats>('/stats');

export const fetchUsers = (status?: string) =>
  request<{ users: CrmUser[]; count: number }>(
    `/users${status ? `?status=${status}` : ''}`
  );

export const generateBrief = () =>
  request<Brief>('/generate-brief', { method: 'POST' });

export const submitFeedback = (brief_id: string, feedback: string) =>
  request<Brief>('/feedback', {
    method: 'POST',
    body: JSON.stringify({ brief_id, feedback }),
  });

export const fetchLatestBrief = () => request<Brief>('/brief');
