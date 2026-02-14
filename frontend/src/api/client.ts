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
}

export interface RecommendedAction {
  action: string;
  type: 'send_email' | 'schedule_zoom' | 'schedule_meeting' | 'crm_update' | 'create_campaign' | 'send_slack';
  target_segment: string;
  priority: 'high' | 'medium' | 'low';
  details: string;
}

export interface AgentEvent {
  event: string;
  agent?: string;
  label?: string;
  message?: string;
  thinking?: string[];
  summary?: string;
  elapsed_s?: number;
  phase?: number;
  agents?: string[];
  // complete event
  brief?: any;
  brief_id?: string;
  confidence_score?: number;
  agent_outputs?: any;
  timing?: Record<string, number>;
  created_at?: string;
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

export const fetchUsers = () =>
  request<{ users: CrmUser[]; count: number }>('/users');

/**
 * SSE streaming brief generation.
 * Calls the callback for each event, returns when complete.
 */
export async function generateBriefStream(
  onEvent: (event: AgentEvent) => void
): Promise<void> {
  const res = await fetch(`${BASE}/generate-brief-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || body.error || res.statusText);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    let currentData = '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        currentData = line.slice(6);
        try {
          const event = JSON.parse(currentData) as AgentEvent;
          onEvent(event);
        } catch {
          // skip parse errors
        }
        currentData = '';
      }
    }
  }
}
