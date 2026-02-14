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

export interface ProductRecommendation {
  title: string;
  description: string;
  source: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  category: string;
  action_type: string;
}

export interface Interview {
  id: number;
  title: string;
  participant: string;
  role: string;
  company_type: string;
  date: string;
  duration: string;
  video_id: string;
  focus: string;
  has_transcript: boolean;
  key_insights: { type: string; area: string; description: string; action: string | null }[];
  pm_questions: { question: string; answer: string }[];
  transcript_preview: string | null;
  transcript?: string;
}

export interface EngagementData {
  weekly_trends: { week: string; week_label: string; dau: number; wau: number; signups: number; churn: number; nps: number }[];
  funnel: { stage: string; count: number; rate: number }[];
  feature_adoption: { feature: string; enterprise: number; mid_market: number; smb: number; free: number }[];
  segments: { name: string; users: number; revenue: number; dau_mau: number; health: number }[];
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

export const fetchInterviews = () =>
  request<{ interviews: Interview[]; count: number }>('/interviews');

export const fetchInterview = (id: number) =>
  request<Interview>(`/interviews/${id}`);

export const fetchEngagementData = () =>
  request<EngagementData>('/engagement-data');

/**
 * SSE streaming brief generation.
 * Robustly handles large payloads split across chunks.
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

    // Process complete SSE messages (terminated by double newline)
    const messages = buffer.split('\n\n');
    buffer = messages.pop() || '';

    for (const msg of messages) {
      if (!msg.trim()) continue;
      const dataLines: string[] = [];
      for (const line of msg.split('\n')) {
        if (line.startsWith('data: ')) {
          dataLines.push(line.slice(6));
        }
      }
      if (dataLines.length > 0) {
        const jsonStr = dataLines.join('\n');
        try {
          const event = JSON.parse(jsonStr) as AgentEvent;
          onEvent(event);
        } catch (e) {
          console.warn('SSE parse error:', e);
        }
      }
    }
  }

  // Flush remaining buffer
  if (buffer.trim()) {
    const dataLines: string[] = [];
    for (const line of buffer.split('\n')) {
      if (line.startsWith('data: ')) {
        dataLines.push(line.slice(6));
      }
    }
    if (dataLines.length > 0) {
      try {
        const event = JSON.parse(dataLines.join('\n')) as AgentEvent;
        onEvent(event);
      } catch { /* ignore */ }
    }
  }
}
