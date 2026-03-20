export type AgentSourceType = 'zoom_call' | 'teams_meeting' | 'email' | 'sms' | 'whatsapp' | 'phone_call';
export type AgentDraftType = 'opportunity' | 'offer' | 'order' | 'note';
export type AgentDraftStatus = 'pending' | 'approved' | 'dismissed';

export interface AgentActivity {
  id: string;
  dealId: string;
  agentId: string;
  sourceType: AgentSourceType;
  sourceLabel: string;        // e.g. "Zoom call with Erik Johansson"
  summary: string;            // AI-generated summary of what happened
  participants: string[];     // people in the meeting/email
  timestamp: string;
  draftsCreated: string[];    // IDs of AgentDraft items created from this activity
}

export interface AgentDraft {
  id: string;
  dealId: string;
  agentId: string;
  activityId: string;         // links to the AgentActivity that generated this
  draftType: AgentDraftType;
  status: AgentDraftStatus;
  title: string;
  summary: string;            // AI explanation of why it created this
  data: Record<string, any>;  // the draft data (opportunity fields, note text, etc.)
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  avatar: string;             // emoji or icon
  enabled: boolean;
  capabilities: AgentSourceType[];
  dealsMonitoring: string[];  // deal IDs this agent is watching
}
