'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import type { SelectChangeEvent } from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Menu from '@mui/material/Menu';
import Chip from '@mui/material/Chip';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import MuiLink from '@mui/material/Link';
import Popover from '@mui/material/Popover';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AddIcon from '@mui/icons-material/Add';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ShareIcon from '@mui/icons-material/Share';
import ArchiveIcon from '@mui/icons-material/Archive';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import DescriptionIcon from '@mui/icons-material/Description';
import ScienceIcon from '@mui/icons-material/Science';
import type { DealStatus, Sample } from '@/types';
import Divider from '@mui/material/Divider';
import { usePipelineStagesStore } from '@/stores/pipelineStagesStore';
import DealOffers from '@/components/deals/DealOffers';
import DealActivityLog from '@/components/deals/DealActivityLog';
import DealNotes from '@/components/deals/DealNotes';
import DealOrders from '@/components/deals/DealOrders';
import DealSamples from '@/components/deals/DealSamples';
import DealOpportunities from '@/components/deals/DealOpportunities';
import DealAgent from '@/components/deals/DealAgent';
import DealAlerts from '@/components/notifications/DealAlerts';
import DealDocumentManager from '@/components/deals/DealDocumentManager';
import OrderScheduler from '@/components/deals/OrderScheduler';
import { useDealStore } from '@/stores/dealStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useOfferStore } from '@/stores/offerStore';
import { useOrderStore } from '@/stores/orderStore';
import { useActivityStore } from '@/stores/activityStore';
import { useOpportunityStore } from '@/stores/opportunityStore';
import { useSampleStore } from '@/stores/sampleStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHydration } from '@/hooks/useHydration';
import { v4 as uuidv4 } from 'uuid';

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

const DEAL_STATUSES: DealStatus[] = ['Draft', 'Active', 'Won', 'Lost', 'Expired'];
const statusColors: Record<DealStatus, string> = {
  Draft: '#6B7280', Active: '#E97A2B', Won: '#059669', Lost: '#DC2626', Expired: '#9CA3AF',
};
const statusBg: Record<DealStatus, string> = {
  Draft: '#F3F4F6', Active: '#FFF7ED', Won: '#ECFDF5', Lost: '#FEF2F2', Expired: '#F9FAFB',
};

export default function DealDetailPage() {
  const hydrated = useHydration();
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;

  const getDealById = useDealStore((s) => s.getDealById);
  const updateDeal = useDealStore((s) => s.updateDeal);
  const deleteDeal = useDealStore((s) => s.deleteDeal);
  const getCustomerById = useCustomerStore((s) => s.getCustomerById);
  const getLatestOfferForDeal = useOfferStore((s) => s.getLatestOfferForDeal);
  const addOrder = useOrderStore((s) => s.addOrder);
  const getOrderByOffer = useOrderStore((s) => s.getOrderByOffer);
  const addActivity = useActivityStore((s) => s.addActivity);
  const settings = useSettingsStore((s) => s.settings);
  const allOpps = useOpportunityStore((s) => s.opportunities);
  const allOffers = useOfferStore((s) => s.offers);
  const allOrders = useOrderStore((s) => s.orders);
  const addSample = useSampleStore((s) => s.addSample);
  const allSamples = useSampleStore((s) => s.samples);
  const oppCount = allOpps.filter((o) => o.dealId === dealId).length;
  const offerCount = allOffers.filter((o) => o.dealId === dealId).length;
  const orderCount = allOrders.filter((o) => o.dealId === dealId).length;
  const sampleCount = allSamples.filter((o) => o.dealId === dealId).length;

  const [tab, setTab] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [kebabAnchor, setKebabAnchor] = useState<HTMLElement | null>(null);
  const [statusAnchor, setStatusAnchor] = useState<HTMLElement | null>(null);
  const [orderMenuAnchor, setOrderMenuAnchor] = useState<HTMLElement | null>(null);
  const [exitReasonOpen, setExitReasonOpen] = useState(false);
  const [pendingExitStage, setPendingExitStage] = useState('');
  const [exitReason, setExitReason] = useState('');
  const [backwardsConfirmOpen, setBackwardsConfirmOpen] = useState(false);
  const [pendingBackwardsStage, setPendingBackwardsStage] = useState('');

  const pipelineStages = usePipelineStagesStore((s) => s.stages);
  const progressionStages = pipelineStages.filter((s) => s.type === 'progression').sort((a, b) => a.order - b.order);
  const exitStages = pipelineStages.filter((s) => s.type === 'exit').sort((a, b) => a.order - b.order);
  const allStages = [...progressionStages, ...exitStages];

  const deal = getDealById(dealId);
  const customer = deal ? getCustomerById(deal.customerId) : undefined;
  const latestOffer = getLatestOfferForDeal(dealId);

  const currentStage = (deal as any)?.pipelineStage || 'Opportunity';
  const currentStageConfig = allStages.find((s) => s.name === currentStage);

  // Derive DealStatus from pipeline stage
  const deriveStatus = (stageName: string): DealStatus => {
    const lastProg = progressionStages[progressionStages.length - 1];
    if (stageName === 'Lost' || stageName === 'Cancelled') return 'Lost';
    if (stageName === 'Expired') return 'Expired';
    if (lastProg && stageName === lastProg.name) return 'Won';
    return 'Active';
  };

  const handleStageChange = (newStage: string) => {
    setStatusAnchor(null);
    const isExit = exitStages.some((s) => s.name === newStage);

    // Check if exit stage — prompt for reason
    if (isExit) {
      setPendingExitStage(newStage);
      setExitReason('');
      setExitReasonOpen(true);
      return;
    }

    // Check if moving backwards
    const currentIdx = progressionStages.findIndex((s) => s.name === currentStage);
    const newIdx = progressionStages.findIndex((s) => s.name === newStage);
    if (currentIdx >= 0 && newIdx >= 0 && newIdx < currentIdx) {
      setPendingBackwardsStage(newStage);
      setBackwardsConfirmOpen(true);
      return;
    }

    applyStageChange(newStage);
  };

  const applyStageChange = (newStage: string, reason?: string) => {
    const newStatus = deriveStatus(newStage);
    const now = new Date().toISOString();
    const updates: any = { pipelineStage: newStage, status: newStatus, updatedAt: now };
    if (reason) updates.exitReason = reason;
    updateDeal(dealId, updates);
    addActivity({
      id: uuidv4(),
      entityType: 'deal',
      entityId: dealId,
      dealId,
      action: 'status_changed',
      details: `Deal moved to "${newStage}"${reason ? ` — ${reason}` : ''}`,
      userId: settings.currentUser,
      timestamp: now,
    });
  };

  // Keep legacy handler for backwards compat
  const handleStatusChange = (newStatus: DealStatus) => {
    updateDeal(dealId, { status: newStatus, updatedAt: new Date().toISOString() });
    setStatusAnchor(null);
  };

  const handleSaveName = () => {
    if (!editNameValue.trim() || !deal) return;
    const now = new Date().toISOString();
    updateDeal(dealId, { name: editNameValue.trim(), updatedAt: now });
    addActivity({
      id: uuidv4(),
      entityType: 'deal',
      entityId: dealId,
      dealId,
      action: 'deal_updated',
      details: `Deal renamed from "${deal.name}" to "${editNameValue.trim()}"`,
      userId: settings.currentUser,
      timestamp: now,
    });
    setEditingName(false);
  };

  const handleDeleteDeal = () => {
    if (!deal) return;
    addActivity({
      id: uuidv4(),
      entityType: 'deal',
      entityId: dealId,
      dealId,
      action: 'deal_deleted',
      details: `Deal "${deal.name}" deleted`,
      userId: settings.currentUser,
      timestamp: new Date().toISOString(),
    });
    deleteDeal(dealId);
    router.push('/deals');
  };

  const handleCreateOrderFromOffer = () => {
    if (!latestOffer || !deal) return;
    const orderId = uuidv4();
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
    addOrder({
      id: orderId,
      orderNumber,
      offerId: latestOffer.id,
      dealId: deal.id,
      customerId: deal.customerId,
      status: 'Created',
      createdAt: new Date().toISOString(),
    });
    addActivity({
      id: uuidv4(),
      entityType: 'order',
      entityId: orderId,
      dealId: deal.id,
      action: 'order_created',
      details: `Order ${orderNumber} created from offer V${latestOffer.version}`,
      userId: settings.currentUser,
      timestamp: new Date().toISOString(),
    });
    setOrderMenuAnchor(null);
    setTab(1); // Switch to Orders tab
  };

  const handleCreateOrderManually = () => {
    if (!deal) return;
    const orderId = uuidv4();
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
    addOrder({
      id: orderId,
      orderNumber,
      offerId: '',
      dealId: deal.id,
      customerId: deal.customerId,
      status: 'Created',
      createdAt: new Date().toISOString(),
    });
    addActivity({
      id: uuidv4(),
      entityType: 'order',
      entityId: orderId,
      dealId: deal.id,
      action: 'order_created',
      details: `Order ${orderNumber} created manually`,
      userId: settings.currentUser,
      timestamp: new Date().toISOString(),
    });
    setOrderMenuAnchor(null);
    setTab(1);
  };

  if (!hydrated) return null;

  if (!deal) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Deal not found.
        </Typography>
      </Box>
    );
  }

  const lastUpdated = new Date(deal.updatedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1.5 }}>
        <MuiLink component={Link} href="/deals" underline="hover" color="text.secondary" fontSize="0.875rem">
          Pipeline
        </MuiLink>
        <Typography color="text.primary" fontSize="0.875rem">
          {deal.name}
        </Typography>
      </Breadcrumbs>

      {/* Deal Header Card */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 3,
          /* clean header, no left border */
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          {/* Left: Title + Meta */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Title row: click-to-edit name + status chip */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              {editingName ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TextField
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    size="small"
                    autoFocus
                    sx={{ minWidth: 300, '& .MuiInputBase-input': { fontSize: '1.25rem', fontWeight: 700 } }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') setEditingName(false);
                    }}
                    onBlur={handleSaveName}
                  />
                  <IconButton size="small" color="primary" onClick={handleSaveName}>
                    <CheckIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => setEditingName(false)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Typography
                  variant="h5"
                  fontWeight={700}
                  onClick={() => {
                    setEditNameValue(deal.name);
                    setEditingName(true);
                  }}
                  sx={{
                    cursor: 'text',
                    borderRadius: 1,
                    px: 0.5,
                    mx: -0.5,
                    '&:hover': { bgcolor: '#F3F4F6' },
                  }}
                >
                  {deal.name}
                </Typography>
              )}

              {/* Pipeline stage chip with dropdown */}
              <Chip
                label={currentStage}
                size="small"
                onClick={(e) => setStatusAnchor(e.currentTarget)}
                onDelete={(e) => setStatusAnchor(e.currentTarget as HTMLElement)}
                deleteIcon={<ArrowDropDownIcon />}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  color: currentStageConfig?.color || '#6B7280',
                  bgcolor: currentStageConfig ? `${currentStageConfig.color}12` : '#F3F4F6',
                  border: `1px solid ${currentStageConfig?.color || '#6B7280'}20`,
                  cursor: 'pointer',
                  '& .MuiChip-deleteIcon': { color: currentStageConfig?.color || '#6B7280' },
                }}
              />
              <Popover
                open={Boolean(statusAnchor)}
                anchorEl={statusAnchor}
                onClose={() => setStatusAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              >
                {progressionStages.map((s) => (
                  <MenuItem
                    key={s.id}
                    onClick={() => handleStageChange(s.name)}
                    selected={currentStage === s.name}
                    sx={{ fontSize: '0.85rem', minWidth: 160 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
                      {s.name}
                    </Box>
                  </MenuItem>
                ))}
                <Divider />
                {exitStages.map((s) => (
                  <MenuItem
                    key={s.id}
                    onClick={() => handleStageChange(s.name)}
                    selected={currentStage === s.name}
                    sx={{ fontSize: '0.85rem', minWidth: 160 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
                      {s.name}
                    </Box>
                  </MenuItem>
                ))}
              </Popover>
            </Box>

            {/* Meta row: customer link + last updated */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {customer && (
                <MuiLink
                  component={Link}
                  href={`/customers/${customer.id}`}
                  underline="hover"
                  sx={{ fontSize: '0.875rem', color: 'text.secondary', fontWeight: 500 }}
                >
                  {customer.name}
                </MuiLink>
              )}
              <Typography variant="caption" color="text.disabled">
                Updated {lastUpdated}
              </Typography>
            </Box>
          </Box>

          {/* Right: Simplified actions */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
            {/* + New dropdown */}
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              endIcon={<ArrowDropDownIcon />}
              onClick={(e) => setOrderMenuAnchor(e.currentTarget)}
            >
              New
            </Button>
            <Menu
              anchorEl={orderMenuAnchor}
              open={Boolean(orderMenuAnchor)}
              onClose={() => setOrderMenuAnchor(null)}
            >
              <MenuItem onClick={() => { setOrderMenuAnchor(null); router.push(`/deals/${dealId}/opportunities/new`); }} sx={{ fontSize: '0.85rem' }}>
                <ListItemIcon><LightbulbIcon fontSize="small" /></ListItemIcon>
                <ListItemText>New Opportunity</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { setOrderMenuAnchor(null); router.push(`/deals/${dealId}/offers/new`); }} sx={{ fontSize: '0.85rem' }}>
                <ListItemIcon><DescriptionIcon fontSize="small" /></ListItemIcon>
                <ListItemText>New Offer</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { setOrderMenuAnchor(null); router.push(`/deals/${dealId}/orders/new`); }} sx={{ fontSize: '0.85rem' }}>
                <ListItemIcon><ShoppingCartIcon fontSize="small" /></ListItemIcon>
                <ListItemText>New Order</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => {
                setOrderMenuAnchor(null);
                const sampleId = uuidv4();
                const now = new Date().toISOString();
                addSample({
                  id: sampleId,
                  dealId,
                  name: `Sample ${sampleCount + 1}`,
                  status: 'Requested',
                  lines: [],
                  shippingAddress: { street: '', city: '', state: '', postalCode: '', country: '' },
                  carrier: '',
                  trackingNumber: '',
                  requestedDate: now,
                  sentDate: null,
                  receivedDate: null,
                  feedback: '',
                  feedbackRating: null,
                  requestedBy: settings.currentUser,
                  notes: '',
                  createdAt: now,
                  updatedAt: now,
                });
                addActivity({
                  id: uuidv4(),
                  entityType: 'sample',
                  entityId: sampleId,
                  dealId,
                  action: 'sample_created',
                  details: `Sample "Sample ${sampleCount + 1}" created`,
                  userId: settings.currentUser,
                  timestamp: now,
                });
                router.push(`/deals/${dealId}/samples/${sampleId}`);
              }} sx={{ fontSize: '0.85rem' }}>
                <ListItemIcon><ScienceIcon fontSize="small" /></ListItemIcon>
                <ListItemText>New Sample</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => { setOrderMenuAnchor(null); handleCreateOrderFromOffer(); }}
                disabled={!latestOffer || latestOffer.status !== 'Approved'}
                sx={{ fontSize: '0.85rem' }}
              >
                <ListItemIcon><ShoppingCartIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Order from Offer</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { setOrderMenuAnchor(null); setSchedulerOpen(true); }} sx={{ fontSize: '0.85rem' }}>
                <ListItemIcon><EditNoteIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Schedule Orders</ListItemText>
              </MenuItem>
            </Menu>

            {/* Kebab menu */}
            <IconButton
              size="small"
              onClick={(e) => setKebabAnchor(e.currentTarget)}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={kebabAnchor}
              open={Boolean(kebabAnchor)}
              onClose={() => setKebabAnchor(null)}
            >
              <MenuItem onClick={() => setKebabAnchor(null)} sx={{ fontSize: '0.85rem' }}>
                <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Share</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => setKebabAnchor(null)} sx={{ fontSize: '0.85rem' }}>
                <ListItemIcon><ArchiveIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Archive</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { setKebabAnchor(null); setDeleteDialogOpen(true); }} sx={{ fontSize: '0.85rem', color: 'error.main' }}>
                <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                <ListItemText>Delete</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ mb: 1, opacity: 0.7 }}>
        <DealAlerts dealId={dealId} />
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Copilot" />
          <Tab label="Pipeline" />
          <Tab label="Notes" />
          <Tab label="Document Manager" />
        </Tabs>
      </Box>

      <TabPanel value={tab} index={0}>
        <DealAgent dealId={dealId} />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        {/* Combined Pipeline view with clear section headers */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, pb: 0.75, borderBottom: '1px solid #E5E7EB' }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#111827' }}>Opportunities</Typography>
            <Chip label={oppCount} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#F3F4F6', color: '#6B7280' }} />
          </Box>
          <DealOpportunities dealId={dealId} />
        </Box>

        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, pb: 0.75, borderBottom: '1px solid #E5E7EB' }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#111827' }}>Offers</Typography>
            <Chip label={offerCount} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#F3F4F6', color: '#6B7280' }} />
          </Box>
          <DealOffers dealId={dealId} />
        </Box>

        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, pb: 0.75, borderBottom: '1px solid #E5E7EB' }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#111827' }}>Orders</Typography>
            <Chip label={orderCount} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#F3F4F6', color: '#6B7280' }} />
          </Box>
          <DealOrders dealId={dealId} />
        </Box>

        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, pb: 0.75, borderBottom: '1px solid #E5E7EB' }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#111827' }}>Samples</Typography>
            <Chip label={sampleCount} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#F3F4F6', color: '#6B7280' }} />
          </Box>
          <DealSamples dealId={dealId} />
        </Box>
      </TabPanel>
      <TabPanel value={tab} index={2}>
        <DealNotes dealId={dealId} />
        <Box sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, pb: 0.75, borderBottom: '1px solid #E5E7EB' }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#111827' }}>Activity Log</Typography>
          </Box>
          <DealActivityLog dealId={dealId} />
        </Box>
      </TabPanel>
      <TabPanel value={tab} index={3}>
        <DealDocumentManager dealId={dealId} />
      </TabPanel>

      {/* Order Scheduler */}
      <OrderScheduler dealId={dealId} open={schedulerOpen} onClose={() => setSchedulerOpen(false)} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Deal</DialogTitle>
        <DialogContent>
          <Typography>
            Delete &ldquo;{deal.name}&rdquo;? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteDeal}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Exit Stage Reason Dialog */}
      <Dialog open={exitReasonOpen} onClose={() => setExitReasonOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Moving to {pendingExitStage}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <Typography variant="body2" color="text.secondary">
            Why is this deal being moved to {pendingExitStage}?
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {['Competitor won', 'Price too high', 'No budget', 'No response', 'Timing not right', 'Requirements changed'].map((reason) => (
              <Chip
                key={reason}
                label={reason}
                size="small"
                onClick={() => setExitReason(reason)}
                sx={{
                  cursor: 'pointer',
                  fontWeight: exitReason === reason ? 600 : 400,
                  bgcolor: exitReason === reason ? '#FFF7ED' : undefined,
                  border: exitReason === reason ? '1px solid #EA580C' : '1px solid #E5E7EB',
                  color: exitReason === reason ? '#EA580C' : undefined,
                }}
              />
            ))}
          </Box>
          <TextField
            size="small"
            fullWidth
            label="Or type a custom reason"
            value={exitReason}
            onChange={(e) => setExitReason(e.target.value)}
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExitReasonOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              applyStageChange(pendingExitStage, exitReason || undefined);
              setExitReasonOpen(false);
            }}
          >
            Move to {pendingExitStage}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Backwards Move Confirmation */}
      <Dialog open={backwardsConfirmOpen} onClose={() => setBackwardsConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Move Deal Backwards?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will move the deal from <strong>{currentStage}</strong> back to <strong>{pendingBackwardsStage}</strong> in the pipeline. Are you sure?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackwardsConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              applyStageChange(pendingBackwardsStage);
              setBackwardsConfirmOpen(false);
            }}
          >
            Move Back
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
