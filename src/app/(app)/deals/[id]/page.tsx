'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
import AddIcon from '@mui/icons-material/Add';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '@/components/shared/PageHeader';
import type { DealStatus } from '@/types';
import DealOffers from '@/components/deals/DealOffers';
import DealProducts from '@/components/deals/DealProducts';
import DealActivityLog from '@/components/deals/DealActivityLog';
import DealNotes from '@/components/deals/DealNotes';
import DealAlerts from '@/components/notifications/DealAlerts';
import { useDealStore } from '@/stores/dealStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useOfferStore } from '@/stores/offerStore';
import { useOrderStore } from '@/stores/orderStore';
import { useActivityStore } from '@/stores/activityStore';
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

  const [tab, setTab] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deal = getDealById(dealId);
  const customer = deal ? getCustomerById(deal.customerId) : undefined;
  const latestOffer = getLatestOfferForDeal(dealId);

  const DEAL_STATUSES: DealStatus[] = ['Draft', 'Active', 'Won', 'Lost', 'Expired'];
  const statusColors: Record<DealStatus, string> = {
    Draft: '#6B7280', Active: '#1D4ED8', Won: '#059669', Lost: '#DC2626', Expired: '#9CA3AF',
  };

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    updateDeal(dealId, { status: event.target.value as DealStatus, updatedAt: new Date().toISOString() });
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

  const canCreateOrder =
    latestOffer?.status === 'Approved' && !getOrderByOffer(latestOffer.id);

  const handleCreateOrder = () => {
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

  return (
    <Box>
      <PageHeader
        title={
          editingName ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                size="small"
                autoFocus
                sx={{ minWidth: 280 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') setEditingName(false);
                }}
              />
              <IconButton size="small" color="primary" onClick={handleSaveName}>
                <CheckIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setEditingName(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {deal.name}
              <IconButton
                size="small"
                onClick={() => {
                  setEditNameValue(deal.name);
                  setEditingName(true);
                }}
                sx={{ opacity: 0.4, '&:hover': { opacity: 1 } }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          )
        }
        subtitle={customer ? customer.name : undefined}
        breadcrumbs={[
          { label: 'Deals', href: '/deals' },
          { label: deal.name },
        ]}
        actions={
          <>
            <Select
              value={deal.status}
              onChange={handleStatusChange}
              size="small"
              sx={{
                fontSize: '0.8rem',
                fontWeight: 600,
                height: 36,
                minWidth: 120,
                color: statusColors[deal.status],
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: statusColors[deal.status],
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: statusColors[deal.status],
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: statusColors[deal.status],
                },
              }}
            >
              {DEAL_STATUSES.map((s) => (
                <MenuItem key={s} value={s} sx={{ fontSize: '0.8rem' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: statusColors[s] }} />
                    {s}
                  </Box>
                </MenuItem>
              ))}
            </Select>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push(`/deals/${dealId}/offers/new`)}
            >
              Create Offer
            </Button>
            {canCreateOrder && (
              <Button
                variant="outlined"
                startIcon={<ShoppingCartIcon />}
                onClick={handleCreateOrder}
              >
                Create Order
              </Button>
            )}
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete
            </Button>
          </>
        }
      />

      <DealAlerts dealId={dealId} />

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Offers" />
          <Tab label="Products" />
          <Tab label="Notes" />
          <Tab label="Activity Log" />
          <Tab label="Files" />
        </Tabs>
      </Box>

      <TabPanel value={tab} index={0}>
        <DealOffers dealId={dealId} />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <DealProducts dealId={dealId} />
      </TabPanel>
      <TabPanel value={tab} index={2}>
        <DealNotes dealId={dealId} />
      </TabPanel>
      <TabPanel value={tab} index={3}>
        <DealActivityLog dealId={dealId} />
      </TabPanel>
      <TabPanel value={tab} index={4}>
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            PDF files will appear here.
          </Typography>
        </Box>
      </TabPanel>

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
    </Box>
  );
}
