'use client';

import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Tooltip from '@mui/material/Tooltip';
import EmptyState from '@/components/shared/EmptyState';
import Link from 'next/link';
import { useDealNoteStore } from '@/stores/dealNoteStore';
import { useDealStore } from '@/stores/dealStore';
import { format, isAfter, isBefore, subDays } from 'date-fns';
import type { DealNote, DealNoteCategory } from '@/types';

interface CustomerDealNotesProps {
  customerId: string;
}

const DEAL_COLORS = [
  '#E65100', '#1565C0', '#2E7D32', '#6A1B9A', '#C62828',
  '#00838F', '#4E342E', '#283593', '#558B2F', '#AD1457',
];

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

const CATEGORY_OPTIONS: (DealNoteCategory | 'all')[] = [
  'all', 'Call Summary', 'Internal Note', 'Price Discussion', 'Customer Feedback',
];

export default function CustomerDealNotes({ customerId }: CustomerDealNotesProps) {
  const allNotes = useDealNoteStore((s) => s.notes);
  const deals = useDealStore((s) => s.deals);

  // Get deals for this customer
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

  // Get all notes across these deals
  const customerNotes = useMemo(
    () => allNotes.filter((n) => customerDeals.some((d) => d.id === n.dealId)),
    [allNotes, customerDeals]
  );

  // Filters (multi-select for deal, category, date range)
  const [dealFilter, setDealFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');

  // Collapsed state per deal
  const [collapsedDeals, setCollapsedDeals] = useState<Record<string, boolean>>({});

  const toggleDeal = (dealId: string) => {
    setCollapsedDeals((prev) => ({ ...prev, [dealId]: !prev[dealId] }));
  };

  // Apply filters
  const filteredNotes = useMemo(() => {
    let notes = customerNotes;

    if (dealFilter.length > 0) {
      notes = notes.filter((n) => dealFilter.includes(n.dealId));
    }
    if (categoryFilter.length > 0) {
      notes = notes.filter((n) => categoryFilter.includes(n.category));
    }
    if (dateRange.length > 0) {
      // Use the smallest date range selected (most restrictive)
      const minDays = Math.min(...dateRange.map((d) => parseInt(d)));
      const cutoff = subDays(new Date(), minDays);
      notes = notes.filter((n) => isAfter(new Date(n.createdAt), cutoff));
    }
    if (searchText.trim()) {
      const lower = searchText.toLowerCase();
      notes = notes.filter((n) => n.body.toLowerCase().includes(lower));
    }

    return notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [customerNotes, dealFilter, categoryFilter, dateRange, searchText]);

  // Group by deal
  const groupedByDeal = useMemo(() => {
    const groups: Record<string, DealNote[]> = {};
    for (const note of filteredNotes) {
      if (!groups[note.dealId]) groups[note.dealId] = [];
      groups[note.dealId].push(note);
    }
    return groups;
  }, [filteredNotes]);

  const getDealName = (dealId: string) => {
    const deal = customerDeals.find((d) => d.id === dealId);
    return deal?.name || dealId;
  };

  const totalCount = filteredNotes.length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, pb: 0.75, borderBottom: '1px solid #E5E7EB' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#111827' }}>Notes</Typography>
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
          <InputLabel>Category</InputLabel>
          <Select
            multiple
            value={categoryFilter}
            label="Category"
            onChange={(e: SelectChangeEvent<string[]>) => setCategoryFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
            input={<OutlinedInput label="Category" />}
            renderValue={(selected) => selected.length === 0 ? 'All categories' : selected.join(', ')}
          >
            {CATEGORY_OPTIONS.filter((c) => c !== 'all').map((c) => (
              <MenuItem key={c} value={c}>
                <Checkbox checked={categoryFilter.includes(c)} size="small" />
                <ListItemText primary={c} primaryTypographyProps={{ fontSize: '0.85rem' }} />
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

        <TextField
          size="small"
          placeholder="Search notes..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ minWidth: 180 }}
        />
      </Stack>

      {/* Grouped Notes */}
      {totalCount === 0 ? (
        <EmptyState message="No notes found matching your filters." />
      ) : (
        <Stack spacing={2}>
          {Object.entries(groupedByDeal).map(([dealId, notes]) => {
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
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#6B7280' }}>{notes.length}</Typography>
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

                {/* Notes */}
                <Collapse in={!isCollapsed}>
                  <Stack spacing={0} divider={<Box sx={{ borderBottom: '1px solid #F3F4F6' }} />}>
                    {notes.map((note) => (
                      <Box key={note.id} sx={{ px: 2, py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                          <Chip
                            label={note.category}
                            size="small"
                            sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#FFF3E0', color: '#E65100' }}
                          />
                          {note.priority === 'High' && (
                            <Chip
                              label="High"
                              size="small"
                              sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#FFEBEE', color: '#C62828' }}
                            />
                          )}
                        </Box>
                        <Typography variant="body2" sx={{ color: '#374151', mb: 0.75, whiteSpace: 'pre-wrap' }}>
                          {note.body}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                            {note.createdBy}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                            {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Collapse>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
