'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Pagination from '@mui/material/Pagination';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Autocomplete from '@mui/material/Autocomplete';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArchiveIcon from '@mui/icons-material/Archive';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridViewIcon from '@mui/icons-material/GridView';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import MultiSelectFilter from '@/components/shared/MultiSelectFilter';
import DealAlerts from '@/components/notifications/DealAlerts';
import { useCustomerStore } from '@/stores/customerStore';
import { useDealStore } from '@/stores/dealStore';
import { useOfferStore } from '@/stores/offerStore';
import { useOrderStore } from '@/stores/orderStore';
import { useOpportunityStore } from '@/stores/opportunityStore';
import { useActivityStore } from '@/stores/activityStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHydration } from '@/hooks/useHydration';
import { usePipelineStagesStore } from '@/stores/pipelineStagesStore';
import { v4 as uuidv4 } from 'uuid';
import type { Customer } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';

const CARDS_PER_PAGE = 12;

// Next step logic based on deal artifacts
function getNextStep(
  dealId: string,
  opps: any[],
  offers: any[],
  orders: any[],
  pipelineStage: string
): { label: string; href: string; color: string } {
  // Exit stages
  if (['Lost', 'Expired', 'Cancelled'].includes(pipelineStage)) {
    return { label: 'Re-engage client', href: `/deals/${dealId}`, color: '#7C3AED' };
  }

  const dealOpps = opps.filter((o: any) => o.dealId === dealId);
  const dealOffers = offers.filter((o: any) => o.dealId === dealId);
  const dealOrders = orders.filter((o: any) => o.dealId === dealId);

  // Has orders → track fulfillment
  if (dealOrders.length > 0) {
    const latestOrder = dealOrders[dealOrders.length - 1];
    if (['Draft', 'Confirmed', 'In Production', 'Shipped'].includes(latestOrder.status)) {
      return { label: 'Track fulfillment', href: `/deals/${dealId}/orders/${latestOrder.id}`, color: '#059669' };
    }
    return { label: 'Cross sell', href: `/deals/${dealId}`, color: '#059669' };
  }

  // Has offers
  if (dealOffers.length > 0) {
    const latestOffer = dealOffers.sort((a: any, b: any) => b.version - a.version)[0];
    if (latestOffer.status === 'Draft') {
      return { label: 'Send offer', href: `/deals/${dealId}/offers/${latestOffer.id}`, color: '#F59E0B' };
    }
    if (latestOffer.status === 'Sent' || latestOffer.status === 'Pending') {
      return { label: 'Awaiting customer\'s response', href: `/deals/${dealId}/offers/${latestOffer.id}`, color: '#F59E0B' };
    }
    if (latestOffer.status === 'Approved' || latestOffer.status === 'Accepted') {
      return { label: 'Create an order', href: `/deals/${dealId}`, color: '#059669' };
    }
    return { label: 'Follow up with client', href: `/deals/${dealId}`, color: '#F59E0B' };
  }

  // Has opportunities but no offers
  if (dealOpps.length > 0) {
    return { label: 'Draft a proposal', href: `/deals/${dealId}/offers/new`, color: '#2563EB' };
  }

  // Empty deal
  return { label: 'Create an opportunity', href: `/deals/${dealId}`, color: '#2563EB' };
}

export default function DealsPage() {
  const hydrated = useHydration();
  const router = useRouter();
  const customers = useCustomerStore((s) => s.customers);
  const getCustomerById = useCustomerStore((s) => s.getCustomerById);
  const deals = useDealStore((s) => s.deals);
  const addDeal = useDealStore((s) => s.addDeal);
  const updateDeal = useDealStore((s) => s.updateDeal);
  const deleteDeal = useDealStore((s) => s.deleteDeal);
  const offers = useOfferStore((s) => s.offers);
  const orders = useOrderStore((s) => s.orders);
  const opportunities = useOpportunityStore((s) => s.opportunities);
  const addActivity = useActivityStore((s) => s.addActivity);
  const currentUser = useSettingsStore((s) => s.settings.currentUser);
  const pipelineStages = usePipelineStagesStore((s) => s.stages);
  const stageNames = useMemo(() => pipelineStages.map((s) => s.name), [pipelineStages]);

  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [monthFilter, setMonthFilter] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [cardPage, setCardPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [newDealName, setNewDealName] = useState('');
  const [newDealCustomer, setNewDealCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [dealMenuAnchor, setDealMenuAnchor] = useState<{ el: HTMLElement; deal: { id: string; name: string } } | null>(null);

  const customerOptions = useMemo(() => customers.map((c) => c.name).sort(), [customers]);
  const customerNameToId = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach((c) => map.set(c.name, c.id));
    return map;
  }, [customers]);

  const months = useMemo(() => {
    const set = new Set<string>();
    deals.forEach((d) => {
      const date = new Date(d.updatedAt);
      if (!isNaN(date.getTime())) {
        set.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
      }
    });
    return Array.from(set).sort().reverse();
  }, [deals]);

  const filteredDeals = useMemo(() => {
    let result = [...deals];
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter((d) => {
        const customer = getCustomerById(d.customerId);
        return d.name.toLowerCase().includes(lower) || (customer && customer.name.toLowerCase().includes(lower));
      });
    }
    if (customerFilter.length > 0) {
      const selectedIds = customerFilter.map((name) => customerNameToId.get(name)).filter(Boolean);
      result = result.filter((d) => selectedIds.includes(d.customerId));
    }
    if (statusFilter.length > 0) {
      result = result.filter((d) => statusFilter.includes((d as any).pipelineStage || d.status));
    }
    if (monthFilter.length > 0) {
      result = result.filter((d) => {
        const date = new Date(d.updatedAt);
        if (isNaN(date.getTime())) return false;
        return monthFilter.includes(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
      });
    }
    result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return result;
  }, [deals, search, customerFilter, statusFilter, monthFilter, getCustomerById, customerNameToId]);

  const getDealValue = (dealId: string) => {
    const dealOffers = offers.filter((o) => o.dealId === dealId);
    if (dealOffers.length === 0) return 0;
    const latest = dealOffers.sort((a, b) => b.version - a.version)[0];
    return latest.lines.reduce((sum, l) => sum + l.pricePerUnit * (l.quantity ?? 0), 0);
  };

  const fmtValue = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    if (v === 0) return '—';
    return `$${v.toLocaleString()}`;
  };

  const fmtTimeAgo = (dateStr: string) => {
    try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }); } catch { return ''; }
  };

  const getStageConfig = (deal: any) => {
    const stage = deal.pipelineStage || 'Opportunity';
    const config = pipelineStages.find((s) => s.name === stage);
    return { name: stage, color: config?.color || '#6B7280' };
  };

  const fmtDate = (dateStr: string) => {
    try { return `Added ${format(new Date(dateStr), 'MMM d, yyyy')}`; } catch { return ''; }
  };

  const handleCreateDeal = () => {
    if (!newDealName.trim() || !newDealCustomer) return;
    const now = new Date().toISOString();
    const dealId = uuidv4();
    addDeal({ id: dealId, customerId: newDealCustomer.id, name: newDealName.trim(), status: 'Draft', createdBy: currentUser, createdAt: now, updatedAt: now });
    addActivity({ id: uuidv4(), entityType: 'deal', entityId: dealId, dealId, action: 'deal_created', details: `Deal "${newDealName.trim()}" created for ${newDealCustomer.name}`, userId: currentUser, timestamp: now });
    setNewDealName(''); setNewDealCustomer(null); setCreateOpen(false);
    router.push(`/deals/${dealId}`);
  };

  const handleDeleteDeal = () => {
    if (!deleteTarget) return;
    deleteDeal(deleteTarget.id);
    addActivity({ id: uuidv4(), entityType: 'deal', entityId: deleteTarget.id, dealId: deleteTarget.id, action: 'deal_deleted', details: `Deal "${deleteTarget.name}" deleted`, userId: currentUser, timestamp: new Date().toISOString() });
    setDeleteTarget(null);
  };

  const totalPages = Math.ceil(filteredDeals.length / CARDS_PER_PAGE);
  const paginatedDeals = viewMode === 'card' ? filteredDeals.slice((cardPage - 1) * CARDS_PER_PAGE, cardPage * CARDS_PER_PAGE) : filteredDeals;

  if (!hydrated) return null;

  return (
    <Box>
      <PageHeader title="Pipeline" actions={
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>Create Deal</Button>
      } />

      {/* Filters + view toggle */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" placeholder="Search deals..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 240 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
        <MultiSelectFilter label="Customer" options={customerOptions} selected={customerFilter} onChange={setCustomerFilter} minWidth={200} />
        <MultiSelectFilter label="Stage" options={stageNames} selected={statusFilter} onChange={setStatusFilter} minWidth={140} />
        <MultiSelectFilter label="Month" options={months} selected={monthFilter} onChange={setMonthFilter} minWidth={160} />
        <Box sx={{ flexGrow: 1 }} />
        <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => { if (v) { setViewMode(v); setCardPage(1); } }} size="small">
          <ToggleButton value="list" sx={{ px: 1.5 }}><ViewListIcon fontSize="small" /></ToggleButton>
          <ToggleButton value="card" sx={{ px: 1.5 }}><GridViewIcon fontSize="small" /></ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {filteredDeals.length === 0 ? (
        <EmptyState message="No deals found." />
      ) : viewMode === 'list' ? (
        /* ─── TABLE VIEW (matches Customers/Products) ─── */
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', borderBottom: '2px solid #E5E7EB', py: 1.5 } }}>
                <TableCell width={36} />
                <TableCell>Deal Name</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Stage</TableCell>
                <TableCell>Next Step</TableCell>
                <TableCell align="right">Value</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell>Owner</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDeals.map((deal) => {
                const customer = getCustomerById(deal.customerId);
                const { name: stageName, color: stageColor } = getStageConfig(deal);
                const nextStep = getNextStep(deal.id, opportunities, offers, orders, (deal as any).pipelineStage || 'Opportunity');
                const value = getDealValue(deal.id);

                return (
                  <TableRow
                    key={deal.id}
                    hover
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#FAFBFC' },
                      '& td': { py: 1.75, borderBottom: '1px solid #F3F4F6' },
                    }}
                    onClick={() => router.push(`/deals/${deal.id}`)}
                  >
                    <TableCell align="center" onClick={(e) => e.stopPropagation()} sx={{ px: 0.5 }}>
                      <DealAlerts dealId={deal.id} compact />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>{deal.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#6B7280' }}>{customer?.name ?? '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={stageName}
                        size="small"
                        sx={{
                          fontWeight: 600, fontSize: '0.65rem', height: 22,
                          color: stageColor, bgcolor: `${stageColor}12`, border: `1px solid ${stageColor}25`,
                        }}
                      />
                    </TableCell>
                    <TableCell onClick={(e) => { e.stopPropagation(); router.push(nextStep.href); }} sx={{ cursor: 'pointer' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, '&:hover .cta-text': { textDecoration: 'underline' } }}>
                        <AutoAwesomeIcon sx={{ fontSize: 13, color: nextStep.color }} />
                        <Typography className="cta-text" variant="caption" sx={{ color: nextStep.color, fontWeight: 500, fontSize: '0.7rem' }}>
                          {nextStep.label}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>{fmtValue(value)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.75rem' }}>{fmtTimeAgo(deal.updatedAt)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>{customer?.assignedAM ?? deal.createdBy}</Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* ─── CARD VIEW ─── */
        <>
          <Grid container spacing={2}>
            {paginatedDeals.map((deal) => {
              const customer = getCustomerById(deal.customerId);
              const { name: stageName, color: stageColor } = getStageConfig(deal);
              const nextStep = getNextStep(deal.id, opportunities, offers, orders, (deal as any).pipelineStage || 'Opportunity');

              return (
                <Grid key={deal.id} size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 2.5, border: '1px solid #E5E7EB', height: '100%',
                      display: 'flex', flexDirection: 'column',
                      transition: 'all 0.15s ease',
                      '&:hover': { borderColor: stageColor, boxShadow: `0 2px 12px ${stageColor}12`, transform: 'translateY(-1px)' },
                    }}
                  >
                    <CardActionArea onClick={() => router.push(`/deals/${deal.id}`)} sx={{ p: 0, flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                      <Box sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Header: name + stage chip */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                          <Chip
                            label={stageName.length > 8 ? stageName.slice(0, 6) : stageName}
                            size="small"
                            sx={{
                              fontWeight: 700, fontSize: '0.55rem', height: 22,
                              color: stageColor, bgcolor: `${stageColor}10`, border: `1px solid ${stageColor}20`,
                              flexShrink: 0,
                            }}
                          />
                        </Box>

                        {/* Deal name */}
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#111827', lineHeight: 1.3, mb: 0.25 }}>
                          {deal.name}
                        </Typography>

                        {/* Customer */}
                        <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.75rem', mb: 'auto' }}>
                          {customer?.name ?? '—'}
                        </Typography>

                        {/* Date */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2, mb: 1.5 }}>
                          <CalendarTodayIcon sx={{ fontSize: 12, color: '#D1D5DB' }} />
                          <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.68rem' }}>
                            {fmtDate(deal.createdAt)}
                          </Typography>
                        </Box>

                        {/* Next step CTA */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AutoAwesomeIcon sx={{ fontSize: 13, color: nextStep.color }} />
                          <Typography variant="caption" sx={{ color: nextStep.color, fontWeight: 500, fontSize: '0.68rem' }}>
                            {nextStep.label}
                          </Typography>
                          <OpenInNewIcon sx={{ fontSize: 10, color: nextStep.color, opacity: 0.5 }} />
                        </Box>
                      </Box>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination count={totalPages} page={cardPage} onChange={(_, p) => setCardPage(p)} shape="rounded" size="small" />
            </Box>
          )}
        </>
      )}

      {/* Deal kebab menu */}
      <Menu anchorEl={dealMenuAnchor?.el} open={Boolean(dealMenuAnchor)} onClose={() => setDealMenuAnchor(null)}>
        <MenuItem onClick={() => { if (dealMenuAnchor) router.push(`/deals/${dealMenuAnchor.deal.id}`); setDealMenuAnchor(null); }}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View Deal</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { if (dealMenuAnchor) updateDeal(dealMenuAnchor.deal.id, { pipelineStage: 'Lost', status: 'Lost', updatedAt: new Date().toISOString() } as any); setDealMenuAnchor(null); }}>
          <ListItemIcon><ArchiveIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Archive</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { if (dealMenuAnchor) setDeleteTarget(dealMenuAnchor.deal); setDealMenuAnchor(null); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create Deal Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Deal</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField autoFocus label="Deal Name" value={newDealName} onChange={(e) => setNewDealName(e.target.value)} size="small" fullWidth
            onKeyDown={(e) => { if (e.key === 'Enter' && newDealName.trim() && newDealCustomer) handleCreateDeal(); }} />
          <Autocomplete options={customers} getOptionLabel={(c) => c.name} value={newDealCustomer} onChange={(_, v) => setNewDealCustomer(v)}
            renderInput={(params) => <TextField {...params} label="Customer" size="small" />} size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateDeal} disabled={!newDealName.trim() || !newDealCustomer}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Deal</DialogTitle>
        <DialogContent>
          <Typography>Delete &ldquo;{deleteTarget?.name}&rdquo;? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteDeal}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
