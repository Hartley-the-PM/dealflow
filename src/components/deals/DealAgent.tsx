'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import VideocamIcon from '@mui/icons-material/Videocam';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import SmsIcon from '@mui/icons-material/Sms';
import GroupsIcon from '@mui/icons-material/Groups';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DescriptionIcon from '@mui/icons-material/Description';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import Grid from '@mui/material/Grid';
import { useAgentStore } from '@/stores/agentStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useOfferStore } from '@/stores/offerStore';
import { useOrderStore } from '@/stores/orderStore';
import { useOpportunityStore } from '@/stores/opportunityStore';
import type { AgentSourceType, AgentDraftType, AgentDraft, AgentActivity } from '@/types';

const SOURCE_ICONS: Record<AgentSourceType, React.ReactNode> = {
  zoom_call: <VideocamIcon sx={{ fontSize: 16 }} />,
  teams_meeting: <GroupsIcon sx={{ fontSize: 16 }} />,
  email: <EmailIcon sx={{ fontSize: 16 }} />,
  sms: <SmsIcon sx={{ fontSize: 16 }} />,
  whatsapp: <WhatsAppIcon sx={{ fontSize: 16 }} />,
  phone_call: <PhoneIcon sx={{ fontSize: 16 }} />,
};

const SOURCE_COLORS: Record<AgentSourceType, string> = {
  zoom_call: '#2563EB',
  teams_meeting: '#7C3AED',
  email: '#E97A2B',
  sms: '#059669',
  whatsapp: '#25D366',
  phone_call: '#DC2626',
};

const DRAFT_TYPE_CONFIG: Record<AgentDraftType, { icon: React.ReactNode; color: string; label: string }> = {
  opportunity: { icon: <LightbulbIcon sx={{ fontSize: 16 }} />, color: '#E97A2B', label: 'Opportunity' },
  offer: { icon: <DescriptionIcon sx={{ fontSize: 16 }} />, color: '#7C3AED', label: 'Offer' },
  order: { icon: <ShoppingCartIcon sx={{ fontSize: 16 }} />, color: '#059669', label: 'Order' },
  note: { icon: <NoteAddIcon sx={{ fontSize: 16 }} />, color: '#2563EB', label: 'Note' },
};

interface DealAgentProps {
  dealId: string;
}

export default function DealAgent({ dealId }: DealAgentProps) {
  const allActivities = useAgentStore((s) => s.activities);
  const allDrafts = useAgentStore((s) => s.drafts);
  const agents = useAgentStore((s) => s.agents);
  const updateDraftStatus = useAgentStore((s) => s.updateDraftStatus);
  const settings = useSettingsStore((s) => s.settings);
  const offers = useOfferStore((s) => s.offers);
  const orders = useOrderStore((s) => s.orders);
  const allOpps = useOpportunityStore((s) => s.opportunities);

  const activities = useMemo(() =>
    allActivities.filter((a) => a.dealId === dealId).sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [allActivities, dealId]
  );

  const drafts = useMemo(() =>
    allDrafts.filter((d) => d.dealId === dealId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [allDrafts, dealId]
  );

  const pendingDrafts = drafts.filter((d) => d.status === 'pending');
  const resolvedDrafts = drafts.filter((d) => d.status !== 'pending');
  const activeAgents = agents.filter((a) => a.enabled && a.dealsMonitoring.includes(dealId));

  // Deal summary metrics
  const dealOffers = offers.filter((o) => o.dealId === dealId);
  const dealOrders = orders.filter((o) => o.dealId === dealId);
  const dealOpps = allOpps.filter((o) => o.dealId === dealId);

  const handleApprove = (draftId: string) => {
    updateDraftStatus(draftId, 'approved', settings.currentUser);
  };

  const handleDismiss = (draftId: string) => {
    updateDraftStatus(draftId, 'dismissed', settings.currentUser);
  };

  const getAgentName = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    return agent ? `${agent.avatar} ${agent.name}` : '🤖 AI Agent';
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' at ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <Box>
      {/* Deal Analyst — detailed overview */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={700}>Deal Analyst</Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {activeAgents.map((agent) => (
                <Chip key={agent.id} label={`${agent.avatar} ${agent.name}`} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
              ))}
            </Box>
          </Box>

          {/* Metrics row */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            {[
              { label: 'Opportunities', value: dealOpps.length, color: '#E97A2B' },
              { label: 'Offers', value: dealOffers.length, color: '#7C3AED' },
              { label: 'Orders', value: dealOrders.length, color: '#059669' },
              { label: 'Interactions', value: activities.length, color: '#2563EB' },
            ].map((m) => (
              <Box key={m.label} sx={{ px: 2, py: 1, bgcolor: '#FAFAFA', borderRadius: 1.5, textAlign: 'center', minWidth: 80 }}>
                <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1, color: m.color }}>{m.value}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{m.label}</Typography>
              </Box>
            ))}
          </Box>

          {/* AI summary */}
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 1.5 }}>
            {dealOffers.some(o => o.status === 'Approved') && <>✅ An offer has been approved. </>}
            {dealOffers.some(o => o.status === 'Pending' || o.status === 'Sent') && <>⏳ An offer is awaiting customer response. </>}
            {dealOrders.length > 0 && <>📦 {dealOrders.length} order{dealOrders.length !== 1 && 's'} placed. </>}
            {pendingDrafts.length > 0 && <>🔔 {pendingDrafts.length} copilot draft{pendingDrafts.length !== 1 && 's'} ready for your review. </>}
            {activities.length > 0 && <>The copilot has processed {activities.length} customer interaction{activities.length !== 1 && 's'} including {activities.filter(a => a.sourceType === 'zoom_call' || a.sourceType === 'teams_meeting').length > 0 ? 'meetings, ' : ''}{activities.filter(a => a.sourceType === 'email').length > 0 ? 'emails, ' : ''}{activities.filter(a => a.sourceType === 'phone_call').length > 0 ? 'calls' : ''}.</>}
          </Typography>

          {/* Latest activity preview */}
          {activities.length > 0 && (
            <Box sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: 1.5, border: '1px solid #E5E7EB' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: `${SOURCE_COLORS[activities[0].sourceType]}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: SOURCE_COLORS[activities[0].sourceType] }}>
                  {SOURCE_ICONS[activities[0].sourceType]}
                </Box>
                <Typography variant="caption" fontWeight={600}>{activities[0].sourceLabel}</Typography>
                <Typography variant="caption" color="text.disabled">{formatTime(activities[0].timestamp)}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {activities[0].summary.length > 120 ? activities[0].summary.substring(0, 120) + '...' : activities[0].summary}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Pending Drafts — simplified */}
      {pendingDrafts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, pb: 0.75, borderBottom: '1px solid #E5E7EB' }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#111827' }}>Pending Review</Typography>
            <Chip label={pendingDrafts.length} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#F3F4F6', color: '#6B7280' }} />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {pendingDrafts.map((draft) => {
              const cfg = DRAFT_TYPE_CONFIG[draft.draftType];
              const activity = activities.find((a) => a.id === draft.activityId);

              return (
                <Card key={draft.id} variant="outlined" sx={{ '&:hover': { borderColor: cfg.color } }}>
                  <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                    {/* Top row: type + title + source */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip label={cfg.label} size="small" sx={{ bgcolor: `${cfg.color}15`, color: cfg.color, fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
                      {activity && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: SOURCE_COLORS[activity.sourceType] }}>
                          {SOURCE_ICONS[activity.sourceType]}
                          <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{activity.sourceType.replace('_', ' ')}</Typography>
                        </Box>
                      )}
                      <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                        {formatTime(draft.createdAt)}
                      </Typography>
                    </Box>

                    {/* Title + summary */}
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{draft.title}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      {draft.summary}
                    </Typography>

                    {/* Key data for opportunities/orders */}
                    {(draft.draftType === 'opportunity' || draft.draftType === 'order') && draft.data && (
                      <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
                        {draft.data.productName && (
                          <Chip label={draft.data.productName} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 20 }} />
                        )}
                        {(draft.data.estimatedQty || draft.data.quantity) && (
                          <Typography variant="caption" color="text.secondary">{draft.data.estimatedQty || draft.data.quantity} MT</Typography>
                        )}
                        {(draft.data.estimatedValue || draft.data.totalValue) && (
                          <Typography variant="caption" fontWeight={600} sx={{ color: '#059669' }}>
                            ${(draft.data.estimatedValue || draft.data.totalValue)?.toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    )}

                    {/* Note preview */}
                    {draft.draftType === 'note' && draft.data?.noteText && (
                      <Box sx={{ mb: 1.5, p: 1.5, bgcolor: '#F9FAFB', borderRadius: 1, maxHeight: 60, overflow: 'hidden' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                          {draft.data.noteText.substring(0, 150)}...
                        </Typography>
                      </Box>
                    )}

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" variant="contained" onClick={() => handleApprove(draft.id)}
                        sx={{ fontSize: '0.7rem', py: 0.5, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}>
                        Approve
                      </Button>
                      <Button size="small" variant="outlined" sx={{ fontSize: '0.7rem', py: 0.5 }}>
                        Edit
                      </Button>
                      <Button size="small" variant="outlined" color="error" onClick={() => handleDismiss(draft.id)}
                        sx={{ fontSize: '0.7rem', py: 0.5 }}>
                        Dismiss
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Activity Timeline */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, pb: 0.75, borderBottom: '1px solid #E5E7EB' }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#111827' }}>Recent Activity</Typography>
        <Chip label={activities.length} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#F3F4F6', color: '#6B7280' }} />
      </Box>

      {activities.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <SmartToyIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">
              No AI agent activity for this deal yet.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {activities.map((activity) => {
            const srcColor = SOURCE_COLORS[activity.sourceType];
            const activityDrafts = drafts.filter((d) => d.activityId === activity.id);

            return (
              <Card key={activity.id} variant="outlined" sx={{ '&:hover': { bgcolor: '#FAFAFA' } }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box sx={{
                      width: 32, height: 32, borderRadius: '50%', bgcolor: `${srcColor}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: srcColor, flexShrink: 0, mt: 0.25,
                    }}>
                      {SOURCE_ICONS[activity.sourceType]}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                          {activity.sourceLabel}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {formatTime(activity.timestamp)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        {activity.summary.length > 150 ? activity.summary.substring(0, 150) + '...' : activity.summary}
                      </Typography>
                      {activity.participants.length > 0 && (
                        <Typography variant="caption" color="text.disabled">
                          Participants: {activity.participants.join(', ')}
                        </Typography>
                      )}
                      {activityDrafts.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                          {activityDrafts.map((d) => {
                            const dcfg = DRAFT_TYPE_CONFIG[d.draftType];
                            return (
                              <Chip
                                key={d.id}
                                label={`${d.status === 'approved' ? '✓' : d.status === 'pending' ? '⏳' : '✗'} ${dcfg.label}: ${d.title}`}
                                size="small"
                                sx={{
                                  fontSize: '0.6rem', height: 18,
                                  bgcolor: d.status === 'approved' ? '#ECFDF5' : d.status === 'pending' ? '#FFF7ED' : '#F3F4F6',
                                  color: d.status === 'approved' ? '#059669' : d.status === 'pending' ? '#E97A2B' : '#6B7280',
                                }}
                              />
                            );
                          })}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Resolved Drafts */}
      {resolvedDrafts.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, pb: 0.75, borderBottom: '1px solid #E5E7EB' }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#111827' }}>Resolved</Typography>
            <Chip label={resolvedDrafts.length} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#F3F4F6', color: '#6B7280' }} />
          </Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'none' }}>
            Resolved ({resolvedDrafts.length})
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {resolvedDrafts.map((draft) => {
              const cfg = DRAFT_TYPE_CONFIG[draft.draftType];
              return (
                <Box key={draft.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                  <Chip
                    label={draft.status === 'approved' ? '✓ Approved' : '✗ Dismissed'}
                    size="small"
                    sx={{
                      fontSize: '0.6rem', height: 18,
                      bgcolor: draft.status === 'approved' ? '#ECFDF5' : '#F3F4F6',
                      color: draft.status === 'approved' ? '#059669' : '#6B7280',
                    }}
                  />
                  <Chip
                    label={cfg.label}
                    size="small"
                    sx={{ fontSize: '0.6rem', height: 18, bgcolor: `${cfg.color}15`, color: cfg.color }}
                  />
                  <Typography variant="caption" color="text.secondary">{draft.title}</Typography>
                  {draft.reviewedBy && (
                    <Typography variant="caption" color="text.disabled">
                      by {draft.reviewedBy}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}
