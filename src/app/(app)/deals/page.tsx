'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Autocomplete from '@mui/material/Autocomplete';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import StatusChip from '@/components/shared/StatusChip';
import MultiSelectFilter from '@/components/shared/MultiSelectFilter';
import { useCustomerStore } from '@/stores/customerStore';
import { useDealStore } from '@/stores/dealStore';
import { useOfferStore } from '@/stores/offerStore';
import { useActivityStore } from '@/stores/activityStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHydration } from '@/hooks/useHydration';
import { v4 as uuidv4 } from 'uuid';
import DealAlerts from '@/components/notifications/DealAlerts';
import type { DealStatus, Customer } from '@/types';

const DEAL_STATUSES: DealStatus[] = ['Draft', 'Active', 'Won', 'Lost', 'Expired'];

export default function DealsPage() {
  const hydrated = useHydration();
  const router = useRouter();
  const customers = useCustomerStore((s) => s.customers);
  const getCustomerById = useCustomerStore((s) => s.getCustomerById);
  const deals = useDealStore((s) => s.deals);
  const addDeal = useDealStore((s) => s.addDeal);
  const deleteDeal = useDealStore((s) => s.deleteDeal);
  const getLatestOfferForDeal = useOfferStore((s) => s.getLatestOfferForDeal);
  const addActivity = useActivityStore((s) => s.addActivity);
  const currentUser = useSettingsStore((s) => s.settings.currentUser);

  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [monthFilter, setMonthFilter] = useState<string[]>([]);

  // Create deal dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newDealName, setNewDealName] = useState('');
  const [newDealCustomer, setNewDealCustomer] = useState<Customer | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const customerOptions = useMemo(
    () => customers.map((c) => c.name).sort(),
    [customers]
  );

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
        const ym = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        set.add(ym);
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
        return (
          d.name.toLowerCase().includes(lower) ||
          (customer && customer.name.toLowerCase().includes(lower))
        );
      });
    }
    if (customerFilter.length > 0) {
      const selectedIds = customerFilter.map((name) => customerNameToId.get(name)).filter(Boolean);
      result = result.filter((d) => selectedIds.includes(d.customerId));
    }
    if (statusFilter.length > 0) {
      result = result.filter((d) => statusFilter.includes(d.status));
    }
    if (monthFilter.length > 0) {
      result = result.filter((d) => {
        const date = new Date(d.updatedAt);
        if (isNaN(date.getTime())) return false;
        const ym = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return monthFilter.includes(ym);
      });
    }

    result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return result;
  }, [deals, search, customerFilter, statusFilter, monthFilter, getCustomerById, customerNameToId]);

  const getLatestOfferStatus = (dealId: string) => {
    const latest = getLatestOfferForDeal(dealId);
    return latest ? latest.status : null;
  };

  const getProductCount = (dealId: string) => {
    const latest = getLatestOfferForDeal(dealId);
    if (!latest) return 0;
    const productIds = new Set(latest.lines.map((l) => l.productId));
    return productIds.size;
  };

  const handleCreateDeal = () => {
    if (!newDealName.trim() || !newDealCustomer) return;
    const now = new Date().toISOString();
    const dealId = uuidv4();
    addDeal({
      id: dealId,
      customerId: newDealCustomer.id,
      name: newDealName.trim(),
      status: 'Draft',
      createdBy: currentUser,
      createdAt: now,
      updatedAt: now,
    });
    addActivity({
      id: uuidv4(),
      entityType: 'deal',
      entityId: dealId,
      dealId,
      action: 'deal_created',
      details: `Deal "${newDealName.trim()}" created for ${newDealCustomer.name}`,
      userId: currentUser,
      timestamp: now,
    });
    setNewDealName('');
    setNewDealCustomer(null);
    setCreateOpen(false);
    router.push(`/deals/${dealId}`);
  };

  const handleDeleteDeal = () => {
    if (!deleteTarget) return;
    deleteDeal(deleteTarget.id);
    addActivity({
      id: uuidv4(),
      entityType: 'deal',
      entityId: deleteTarget.id,
      dealId: deleteTarget.id,
      action: 'deal_deleted',
      details: `Deal "${deleteTarget.name}" deleted`,
      userId: currentUser,
      timestamp: new Date().toISOString(),
    });
    setDeleteTarget(null);
  };

  if (!hydrated) return null;

  return (
    <Box>
      <PageHeader
        title="Deals"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Create Deal
          </Button>
        }
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <TextField
          size="small"
          placeholder="Search deals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 240 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <MultiSelectFilter
          label="Customer"
          options={customerOptions}
          selected={customerFilter}
          onChange={setCustomerFilter}
          minWidth={200}
        />
        <MultiSelectFilter
          label="Status"
          options={DEAL_STATUSES}
          selected={statusFilter}
          onChange={setStatusFilter}
          minWidth={140}
        />
        <MultiSelectFilter
          label="Month"
          options={months}
          selected={monthFilter}
          onChange={setMonthFilter}
          minWidth={160}
        />
      </Box>

      {filteredDeals.length === 0 ? (
        <EmptyState message="No deals found." />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={40} />
                <TableCell sx={{ fontWeight: 600 }}>Deal Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Last Offer Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  # Products
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Last Updated</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Owner (AM)</TableCell>
                <TableCell width={50} />
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDeals.map((deal) => {
                const customer = getCustomerById(deal.customerId);
                const latestOfferStatus = getLatestOfferStatus(deal.id);
                const productCount = getProductCount(deal.id);

                return (
                  <TableRow
                    key={deal.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/deals/${deal.id}`)}
                  >
                    <TableCell align="center" onClick={(e) => e.stopPropagation()} sx={{ px: 0.5 }}>
                      <DealAlerts dealId={deal.id} compact />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{deal.name}</TableCell>
                    <TableCell>{customer?.name ?? '\u2014'}</TableCell>
                    <TableCell>
                      {latestOfferStatus ? (
                        <StatusChip status={latestOfferStatus} type="offer" />
                      ) : (
                        '\u2014'
                      )}
                    </TableCell>
                    <TableCell align="center">{productCount}</TableCell>
                    <TableCell>
                      {new Date(deal.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{customer?.assignedAM ?? deal.createdBy}</TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteTarget({ id: deal.id, name: deal.name })}
                        sx={{ opacity: 0.4, '&:hover': { opacity: 1, color: 'error.main' } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Deal Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Deal</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            autoFocus
            label="Deal Name"
            value={newDealName}
            onChange={(e) => setNewDealName(e.target.value)}
            size="small"
            fullWidth
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newDealName.trim() && newDealCustomer) handleCreateDeal();
            }}
          />
          <Autocomplete
            options={customers}
            getOptionLabel={(c) => c.name}
            value={newDealCustomer}
            onChange={(_, v) => setNewDealCustomer(v)}
            renderInput={(params) => <TextField {...params} label="Customer" size="small" />}
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateDeal}
            disabled={!newDealName.trim() || !newDealCustomer}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Deal</DialogTitle>
        <DialogContent>
          <Typography>
            Delete &ldquo;{deleteTarget?.name}&rdquo;? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteDeal}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
