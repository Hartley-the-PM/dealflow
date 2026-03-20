'use client';

import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Tooltip from '@mui/material/Tooltip';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import Link from 'next/link';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TimerOffIcon from '@mui/icons-material/TimerOff';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import EmptyState from '@/components/shared/EmptyState';
import { useActivityStore } from '@/stores/activityStore';
import { useDealStore } from '@/stores/dealStore';
import { format, subDays, isAfter } from 'date-fns';
import type { ActivityAction, ActivityEntry } from '@/types';

interface CustomerDealActivityProps {
  customerId: string;
}

const DEAL_COLORS = [
  '#E65100', '#1565C0', '#2E7D32', '#6A1B9A', '#C62828',
  '#00838F', '#4E342E', '#283593', '#558B2F', '#AD1457',
];

const actionIcons: Record<ActivityAction, React.ReactNode> = {
  deal_created: <AddCircleOutlineIcon sx={{ fontSize: 18, color: '#1976D2' }} />,
  offer_created: <AddCircleOutlineIcon sx={{ fontSize: 18, color: '#0288D1' }} />,
  offer_sent: <SendIcon sx={{ fontSize: 18, color: '#1976D2' }} />,
  offer_approved: <CheckCircleIcon sx={{ fontSize: 18, color: '#2E7D32' }} />,
  offer_rejected: <CancelIcon sx={{ fontSize: 18, color: '#C62828' }} />,
  offer_expired: <TimerOffIcon sx={{ fontSize: 18, color: '#9E9E9E' }} />,
  order_created: <ShoppingCartIcon sx={{ fontSize: 18, color: '#2E7D32' }} />,
  pdf_generated: <PictureAsPdfIcon sx={{ fontSize: 18, color: '#616161' }} />,
  status_changed: <SwapHorizIcon sx={{ fontSize: 18, color: '#ED6C02' }} />,
  note_added: <NoteAddIcon sx={{ fontSize: 18, color: '#0288D1' }} />,
  deal_updated: <SwapHorizIcon sx={{ fontSize: 18, color: '#616161' }} />,
  deal_deleted: <CancelIcon sx={{ fontSize: 18, color: '#C62828' }} />,
  offer_shared: <SendIcon sx={{ fontSize: 18, color: '#1976D2' }} />,
  buyer_accepted: <CheckCircleIcon sx={{ fontSize: 18, color: '#2E7D32' }} />,
  buyer_rejected: <CancelIcon sx={{ fontSize: 18, color: '#C62828' }} />,
  buyer_counter_proposed: <SwapHorizIcon sx={{ fontSize: 18, color: '#ED6C02' }} />,
};

const actionLabels: Record<ActivityAction, string> = {
  deal_created: 'Deal Created',
  deal_updated: 'Deal Updated',
  deal_deleted: 'Deal Deleted',
  offer_created: 'Offer Created',
  offer_sent: 'Offer Sent',
  offer_approved: 'Offer Approved',
  offer_rejected: 'Offer Rejected',
  offer_expired: 'Offer Expired',
  order_created: 'Order Created',
  pdf_generated: 'PDF Generated',
  status_changed: 'Status Changed',
  note_added: 'Note Added',
  offer_shared: 'Offer Shared',
  buyer_accepted: 'Buyer Accepted',
  buyer_rejected: 'Buyer Rejected',
  buyer_counter_proposed: 'Buyer Counter-Proposed',
};

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

export default function CustomerDealActivity({ customerId }: CustomerDealActivityProps) {
  const allActivities = useActivityStore((s) => s.activities);
  const deals = useDealStore((s) => s.deals);

  const customerDeals = useMemo(
    () => deals.filter((d) => d.customerId === customerId),
    [deals, customerId]
  );

  const dealColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    customerDeals.forEach((d, i) => {
      map[d.id] = DEAL_COLORS[i % DEAL_COLORS.length];
    });
    return map;
  }, [customerDeals]);

  const customerActivities = useMemo(
    () => allActivities.filter((a) => a.dealId && customerDeals.some((d) => d.id === a.dealId)),
    [allActivities, customerDeals]
  );

  // Filters (multi-select)
  const [dealFilter, setDealFilter] = useState<string[]>([]);
  const [actionFilter, setActionFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<string[]>([]);

  // Collapsed state per deal
  const [collapsedDeals, setCollapsedDeals] = useState<Record<string, boolean>>({});

  const toggleDeal = (dealId: string) => {
    setCollapsedDeals((prev) => ({ ...prev, [dealId]: !prev[dealId] }));
  };

  // Get unique action types from activities
  const actionTypes = useMemo(() => {
    const types = new Set(customerActivities.map((a) => a.action));
    return Array.from(types).sort();
  }, [customerActivities]);

  // Apply filters
  const filteredActivities = useMemo(() => {
    let activities = customerActivities;

    if (dealFilter.length > 0) {
      activities = activities.filter((a) => a.dealId && dealFilter.includes(a.dealId));
    }
    if (actionFilter.length > 0) {
      activities = activities.filter((a) => actionFilter.includes(a.action));
    }
    if (dateRange.length > 0) {
      const minDays = Math.min(...dateRange.map((d) => parseInt(d)));
      const cutoff = subDays(new Date(), minDays);
      activities = activities.filter((a) => isAfter(new Date(a.timestamp), cutoff));
    }

    return activities.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [customerActivities, dealFilter, actionFilter, dateRange]);

  // Group by deal
  const groupedByDeal = useMemo(() => {
    const groups: Record<string, ActivityEntry[]> = {};
    for (const act of filteredActivities) {
      const key = act.dealId || 'unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(act);
    }
    return groups;
  }, [filteredActivities]);

  const getDealName = (dealId: string) => {
    const deal = customerDeals.find((d) => d.id === dealId);
    return deal?.name || dealId;
  };

  const totalCount = filteredActivities.length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, pb: 0.75, borderBottom: '1px solid #E5E7EB' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#111827' }}>Activity Log</Typography>
          <Box sx={{ height: 18, minWidth: 18, px: 0.5, borderRadius: '9px', bgcolor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280' }}>{totalCount}</Typography>
          </Box>
        </Box>
      </Box>

      {/* Filters */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Deal</InputLabel>
          <Select
            multiple
            value={dealFilter}
            label="Deal"
            onChange={(e: SelectChangeEvent<string[]>) => setDealFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
            input={<OutlinedInput label="Deal" />}
            renderValue={(selected) => selected.length === 0 ? 'All deals' : selected.map((id) => customerDeals.find((d) => d.id === id)?.name || id).join(', ')}
          >
            {customerDeals.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                <Checkbox checked={dealFilter.includes(d.id)} size="small" />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dealColorMap[d.id] }} />
                  <ListItemText primary={d.name} primaryTypographyProps={{ fontSize: '0.85rem' }} />
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Action type</InputLabel>
          <Select
            multiple
            value={actionFilter}
            label="Action type"
            onChange={(e: SelectChangeEvent<string[]>) => setActionFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
            input={<OutlinedInput label="Action type" />}
            renderValue={(selected) => selected.length === 0 ? 'All actions' : selected.map((t) => actionLabels[t as ActivityAction] || t).join(', ')}
          >
            {actionTypes.map((t) => (
              <MenuItem key={t} value={t}>
                <Checkbox checked={actionFilter.includes(t)} size="small" />
                <ListItemText primary={actionLabels[t] || t} primaryTypographyProps={{ fontSize: '0.85rem' }} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Date range</InputLabel>
          <Select
            multiple
            value={dateRange}
            label="Date range"
            onChange={(e: SelectChangeEvent<string[]>) => setDateRange(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
            input={<OutlinedInput label="Date range" />}
            renderValue={(selected) => selected.length === 0 ? 'All time' : selected.map((v) => DATE_RANGE_OPTIONS.find((o) => o.value === v)?.label || v).join(', ')}
          >
            {DATE_RANGE_OPTIONS.filter((o) => o.value !== 'all').map((o) => (
              <MenuItem key={o.value} value={o.value}>
                <Checkbox checked={dateRange.includes(o.value)} size="small" />
                <ListItemText primary={o.label} primaryTypographyProps={{ fontSize: '0.85rem' }} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Grouped Activity */}
      {totalCount === 0 ? (
        <EmptyState message="No activity found matching your filters." />
      ) : (
        <Stack spacing={2}>
          {Object.entries(groupedByDeal).map(([dealId, activities]) => {
            const isCollapsed = collapsedDeals[dealId] ?? false;
            const color = dealColorMap[dealId] || '#666';

            return (
              <Card key={dealId} variant="outlined" sx={{ overflow: 'visible' }}>
                {/* Deal Group Header */}
                <Box
                  onClick={() => toggleDeal(dealId)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1.25,
                    cursor: 'pointer',
                    bgcolor: '#FAFAFA',
                    borderBottom: isCollapsed ? 'none' : '1px solid #E5E7EB',
                    '&:hover': { bgcolor: '#F3F4F6' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                    <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#111827' }}>
                      {getDealName(dealId)}
                    </Typography>
                    <Box sx={{ height: 18, minWidth: 18, px: 0.5, borderRadius: '9px', bgcolor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#6B7280' }}>{activities.length}</Typography>
                    </Box>
                    <Tooltip title="Open deal" arrow>
                      <IconButton
                        component={Link}
                        href={`/deals/${dealId}`}
                        size="small"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        sx={{ color: '#9CA3AF', '&:hover': { color: '#4B5563' } }}
                      >
                        <OpenInNewIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <IconButton size="small">
                    {isCollapsed ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
                  </IconButton>
                </Box>

                {/* Activities */}
                <Collapse in={!isCollapsed}>
                  <List disablePadding>
                    {activities.map((activity, idx) => {
                      const timestamp = new Date(activity.timestamp);
                      const isValidDate = !isNaN(timestamp.getTime());

                      return (
                        <ListItem
                          key={activity.id}
                          sx={{
                            py: 1.25,
                            px: 2,
                            borderBottom: idx < activities.length - 1 ? '1px solid #F3F4F6' : 'none',
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            {actionIcons[activity.action] ?? <SwapHorizIcon sx={{ fontSize: 18 }} />}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                                  {actionLabels[activity.action] ?? activity.action}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                                  by {activity.userId}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 0.25 }}>
                                <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.78rem' }}>
                                  {activity.details}
                                </Typography>
                                {isValidDate && (
                                  <Typography variant="caption" sx={{ color: '#D1D5DB', mt: 0.25, display: 'block', fontSize: '0.7rem' }}>
                                    {format(timestamp, "MMM d, yyyy 'at' h:mm a")}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Collapse>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
