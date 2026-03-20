'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from '@mui/material/Autocomplete';
import Avatar from '@mui/material/Avatar';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ShieldIcon from '@mui/icons-material/Shield';
import TimerIcon from '@mui/icons-material/Timer';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { usePipelineStagesStore } from '@/stores/pipelineStagesStore';
import type { PipelineStage } from '@/stores/pipelineStagesStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { usePricingEngineStore } from '@/stores/pricingEngineStore';
import { useTeamStore } from '@/stores/teamStore';
import { useHydration } from '@/hooks/useHydration';
import type { GuardrailApprover } from '@/types/pricingEngine';
import { v4 as uuidv4 } from 'uuid';

const ACTION_COLORS: Record<string, string> = {
  warn: '#F59E0B',
  block: '#EF4444',
  require_approval: '#8B5CF6',
};

const ROLE_COLORS: Record<string, string> = {
  Admin: '#7C3AED',
  'Sales Manager': '#2563EB',
  'Account Manager': '#059669',
  Viewer: '#6B7280',
};

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function PipelinePricingTab() {
  const hydrated = useHydration();
  const notifSettings = useNotificationStore((s) => s.settings);
  const setNotifSettings = useNotificationStore((s) => s.setSettings);
  const guardrails = usePricingEngineStore((s) => s.guardrails);
  const updateGuardrail = usePricingEngineStore((s) => s.updateGuardrail);
  const addGuardrail = usePricingEngineStore((s) => s.addGuardrail);
  const members = useTeamStore((s) => s.members);
  const pipelineStages = usePipelineStagesStore((s) => s.stages);
  const updateStage = usePipelineStagesStore((s) => s.updateStage);
  const addStage = usePipelineStagesStore((s) => s.addStage);
  const deleteStage = usePipelineStagesStore((s) => s.deleteStage);
  const [newStageName, setNewStageName] = useState('');

  const progressionStages = pipelineStages.filter((s) => s.type === 'progression').sort((a, b) => a.order - b.order);
  const exitStages = pipelineStages.filter((s) => s.type === 'exit').sort((a, b) => a.order - b.order);

  // Seed guardrails if empty
  useEffect(() => {
    if (hydrated && guardrails.length === 0) {
      const seeds = [
        { id: 'gr-001', name: 'Minimum Margin', type: 'min_margin_pct' as const, threshold: 5, action: 'warn' as const, active: true, description: 'Warn when offer margin falls below threshold' },
        { id: 'gr-002', name: 'Maximum Discount', type: 'max_discount_pct' as const, threshold: 15, action: 'require_approval' as const, active: true, description: 'Require approval for discounts exceeding threshold', approvers: [{ userId: 'user-002', userName: 'Anna Kowalski', order: 1 }, { userId: 'user-001', userName: 'John Mitchell', order: 2 }] },
        { id: 'gr-003', name: 'Below Cost', type: 'below_cost' as const, threshold: 0, action: 'block' as const, active: true, description: 'Block offers priced below product cost' },
        { id: 'gr-004', name: 'Below MSP', type: 'below_msp' as const, threshold: 0, action: 'require_approval' as const, active: true, description: 'Require approval for prices below minimum selling price', approvers: [{ userId: 'user-002', userName: 'Anna Kowalski', order: 1 }] },
      ];
      seeds.forEach((g) => addGuardrail(g));
    }
  }, [hydrated, guardrails.length, addGuardrail]);

  if (!hydrated) return null;

  const activeMembers = members.filter((m) => m.status === 'active');

  const handleAddApprover = (guardrailId: string, userId: string) => {
    const g = guardrails.find((gr) => gr.id === guardrailId);
    if (!g) return;
    const member = members.find((m) => m.id === userId);
    if (!member) return;
    const existing = g.approvers || [];
    if (existing.some((a) => a.userId === userId)) return;
    const newApprover: GuardrailApprover = {
      userId: member.id,
      userName: member.name,
      order: existing.length + 1,
    };
    updateGuardrail(guardrailId, { approvers: [...existing, newApprover] });
  };

  const handleRemoveApprover = (guardrailId: string, userId: string) => {
    const g = guardrails.find((gr) => gr.id === guardrailId);
    if (!g) return;
    const filtered = (g.approvers || []).filter((a) => a.userId !== userId);
    // Re-order
    const reordered = filtered.map((a, i) => ({ ...a, order: i + 1 }));
    updateGuardrail(guardrailId, { approvers: reordered });
  };

  const handleMoveApprover = (guardrailId: string, userId: string, direction: 'up' | 'down') => {
    const g = guardrails.find((gr) => gr.id === guardrailId);
    if (!g) return;
    const approvers = [...(g.approvers || [])].sort((a, b) => a.order - b.order);
    const idx = approvers.findIndex((a) => a.userId === userId);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= approvers.length) return;
    [approvers[idx], approvers[swapIdx]] = [approvers[swapIdx], approvers[idx]];
    const reordered = approvers.map((a, i) => ({ ...a, order: i + 1 }));
    updateGuardrail(guardrailId, { approvers: reordered });
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 0.5 }}>Pipeline & Pricing</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure business rules, pricing guardrails, and deal management thresholds.
      </Typography>

      {/* Pipeline Stages */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <AccountTreeIcon sx={{ fontSize: 20, color: '#1976D2' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Pipeline Stages</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Define the stages deals flow through. This affects the Sankey pipeline chart and opportunity probability defaults.
      </Typography>

      {/* Progression stages */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.6rem', mb: 1, display: 'block' }}>
          Main Flow (in order)
        </Typography>
        {progressionStages.map((stage, idx) => (
          <Box key={stage.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75, borderBottom: idx < progressionStages.length - 1 ? '1px solid #F3F4F6' : undefined }}>
            <DragIndicatorIcon sx={{ color: 'text.disabled', fontSize: 16 }} />
            <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: stage.color, flexShrink: 0 }} />
            <TextField size="small" value={stage.name} onChange={(e) => updateStage(stage.id, { name: e.target.value })} sx={{ flex: 1, '& .MuiInputBase-root': { fontSize: '0.85rem' } }} />
            <TextField size="small" type="number" label="Prob %" value={stage.defaultProbability} onChange={(e) => updateStage(stage.id, { defaultProbability: parseInt(e.target.value) || 0 })} sx={{ width: 80, '& .MuiInputBase-root': { fontSize: '0.8rem' } }} inputProps={{ min: 0, max: 100 }} />
            <input type="color" value={stage.color} onChange={(e) => updateStage(stage.id, { color: e.target.value })} style={{ width: 24, height: 24, border: '1px solid #E5E7EB', borderRadius: 4, cursor: 'pointer', padding: 0 }} />
            <IconButton size="small" color="error" onClick={() => deleteStage(stage.id)} disabled={progressionStages.length <= 2} sx={{ p: 0.25 }}>
              <DeleteIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        ))}

        {/* Add new stage */}
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <TextField size="small" placeholder="New stage name..." value={newStageName} onChange={(e) => setNewStageName(e.target.value)} sx={{ flex: 1, '& .MuiInputBase-root': { fontSize: '0.85rem' } }} onKeyDown={(e) => { if (e.key === 'Enter' && newStageName.trim()) { addStage({ name: newStageName.trim(), order: progressionStages.length + 1, type: 'progression', defaultProbability: 50, color: '#6366F1' }); setNewStageName(''); } }} />
          <Button size="small" startIcon={<AddIcon />} disabled={!newStageName.trim()} onClick={() => { addStage({ name: newStageName.trim(), order: progressionStages.length + 1, type: 'progression', defaultProbability: 50, color: '#6366F1' }); setNewStageName(''); }}>Add</Button>
        </Box>
      </Box>

      {/* Exit stages */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.6rem', mb: 1, display: 'block' }}>
          Exit Stages (always available)
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {exitStages.map((stage) => (
            <Chip key={stage.id} label={stage.name} size="small" sx={{ bgcolor: `${stage.color}15`, color: stage.color, fontWeight: 600 }} />
          ))}
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Pricing Guardrails */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <ShieldIcon sx={{ fontSize: 20, color: '#7C3AED' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Pricing Guardrails</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Rules that trigger when offer prices fall outside acceptable ranges.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
        {guardrails.map((g) => {
          const approvers = (g.approvers || []).sort((a, b) => a.order - b.order);
          const availableApprovers = activeMembers.filter(
            (m) => !approvers.some((a) => a.userId === m.id)
          );

          return (
            <Card key={g.id} variant="outlined" sx={{ borderColor: g.active ? ACTION_COLORS[g.action] + '40' : undefined }}>
              <CardContent sx={{ py: '12px !important' }}>
                {/* Main row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: g.action === 'require_approval' ? 1.5 : 0 }}>
                  <Switch
                    size="small"
                    checked={g.active}
                    onChange={(e) => updateGuardrail(g.id, { active: e.target.checked })}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: ACTION_COLORS[g.action] } }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: g.active ? '#111827' : '#9CA3AF' }}>{g.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{g.description || ''}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <TextField
                      size="small" type="number" label="Threshold %"
                      value={g.threshold}
                      onChange={(e) => updateGuardrail(g.id, { threshold: parseFloat(e.target.value) || 0 })}
                      sx={{ width: 110, '& .MuiInputBase-root': { fontSize: '0.8rem' } }}
                      inputProps={{ min: 0, max: 100, step: 1 }}
                    />
                    <TextField
                      select size="small" label="Action" value={g.action}
                      onChange={(e) => updateGuardrail(g.id, { action: e.target.value as any })}
                      sx={{ width: 170, '& .MuiInputBase-root': { fontSize: '0.8rem' } }}
                    >
                      <MenuItem value="warn">⚠ Warn</MenuItem>
                      <MenuItem value="block">🚫 Block</MenuItem>
                      <MenuItem value="require_approval">🔒 Require Approval</MenuItem>
                    </TextField>
                  </Box>
                </Box>

                {/* Approver chain (only for require_approval) */}
                {g.action === 'require_approval' && (
                  <Box sx={{ ml: 5, mt: 1, p: 2, bgcolor: '#F8F5FF', borderRadius: 1.5, border: '1px solid #E9E0FF' }}>
                    <Typography variant="caption" fontWeight={600} color="#7C3AED" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.6rem', mb: 1, display: 'block' }}>
                      Approval Chain (in order)
                    </Typography>

                    {approvers.length === 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        No approvers configured. Add team members who must approve.
                      </Typography>
                    )}

                    {/* Approver list */}
                    {approvers.map((approver, idx) => {
                      const member = members.find((m) => m.id === approver.userId);
                      return (
                        <Box
                          key={approver.userId}
                          sx={{
                            display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75,
                            borderBottom: idx < approvers.length - 1 ? '1px solid #E9E0FF' : undefined,
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#7C3AED', minWidth: 16 }}>{approver.order}</Typography>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.6rem', bgcolor: ROLE_COLORS[member?.role || 'Viewer'] }}>
                            {getInitials(approver.userName)}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>{approver.userName}</Typography>
                            <Typography variant="caption" color="text.secondary">{member?.role || ''}</Typography>
                          </Box>
                          <IconButton size="small" disabled={idx === 0} onClick={() => handleMoveApprover(g.id, approver.userId, 'up')} sx={{ p: 0.25 }}>
                            <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                          <IconButton size="small" disabled={idx === approvers.length - 1} onClick={() => handleMoveApprover(g.id, approver.userId, 'down')} sx={{ p: 0.25 }}>
                            <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleRemoveApprover(g.id, approver.userId)} sx={{ p: 0.25 }}>
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                      );
                    })}

                    {/* Add approver */}
                    {availableApprovers.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <TextField
                          select size="small" label="Add approver" value=""
                          onChange={(e) => handleAddApprover(g.id, e.target.value)}
                          sx={{ minWidth: 220, '& .MuiInputBase-root': { fontSize: '0.8rem' } }}
                        >
                          {availableApprovers.map((m) => (
                            <MenuItem key={m.id} value={m.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 20, height: 20, fontSize: '0.55rem', bgcolor: ROLE_COLORS[m.role] }}>
                                  {getInitials(m.name)}
                                </Avatar>
                                {m.name}
                                <Chip label={m.role} size="small" sx={{ height: 18, fontSize: '0.6rem', ml: 'auto' }} />
                              </Box>
                            </MenuItem>
                          ))}
                        </TextField>
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Pricing Alerts */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <AttachMoneyIcon sx={{ fontSize: 20, color: '#059669' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Pricing Alerts</Typography>
      </Box>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth size="small" type="number" label="Margin alert threshold (%)" value={notifSettings.marginThresholdPct} onChange={(e) => setNotifSettings({ marginThresholdPct: parseFloat(e.target.value) || 5 })} inputProps={{ min: 0, max: 50, step: 0.5 }} helperText="Alert when margin drops below this %" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth size="small" type="number" label="High-value deal threshold ($)" value={notifSettings.dealValueThreshold} onChange={(e) => setNotifSettings({ dealValueThreshold: parseInt(e.target.value) || 100000 })} inputProps={{ min: 0, step: 10000 }} helperText="Deals above this value get special tracking" />
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      {/* Pipeline Timing */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <TimerIcon sx={{ fontSize: 20, color: '#2563EB' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Pipeline Timing</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Set thresholds for automated reminders and inactivity detection.
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth size="small" type="number" label="Offer validity warning (days)" value={notifSettings.offerValidityDays} onChange={(e) => setNotifSettings({ offerValidityDays: parseInt(e.target.value) || 3 })} inputProps={{ min: 1, max: 30 }} helperText="Warn before offer expires" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth size="small" type="number" label="Deal inactive threshold (days)" value={notifSettings.dealInactiveDays} onChange={(e) => setNotifSettings({ dealInactiveDays: parseInt(e.target.value) || 14 })} inputProps={{ min: 1, max: 90 }} helperText="Flag deals with no activity" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth size="small" type="number" label="Follow-up after send (days)" value={notifSettings.followUpDays} onChange={(e) => setNotifSettings({ followUpDays: parseInt(e.target.value) || 5 })} inputProps={{ min: 1, max: 30 }} helperText="Remind to follow up after sending offer" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth size="small" type="number" label="No response threshold (days)" value={notifSettings.offerNoResponseDays} onChange={(e) => setNotifSettings({ offerNoResponseDays: parseInt(e.target.value) || 7 })} inputProps={{ min: 1, max: 60 }} helperText="Alert if buyer hasn't responded" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth size="small" type="number" label="Draft stuck threshold (days)" value={notifSettings.dealStuckDraftDays} onChange={(e) => setNotifSettings({ dealStuckDraftDays: parseInt(e.target.value) || 10 })} inputProps={{ min: 1, max: 60 }} helperText="Alert if draft hasn't progressed" />
        </Grid>
      </Grid>
    </Box>
  );
}
