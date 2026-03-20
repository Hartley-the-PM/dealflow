'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EmptyState from '@/components/shared/EmptyState';
import { useSampleStore } from '@/stores/sampleStore';
import { useProductStore } from '@/stores/productStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { v4 as uuidv4 } from 'uuid';
import type { SampleStatus } from '@/types';

interface DealSamplesProps {
  dealId: string;
}

const STATUS_COLORS: Record<SampleStatus, { color: string; bg: string }> = {
  Requested: { color: '#2563EB', bg: '#EFF6FF' },
  Sent: { color: '#F59E0B', bg: '#FFFBEB' },
  Received: { color: '#7C3AED', bg: '#F5F3FF' },
  Approved: { color: '#059669', bg: '#ECFDF5' },
  Rejected: { color: '#DC2626', bg: '#FEF2F2' },
};

export default function DealSamples({ dealId }: DealSamplesProps) {
  const router = useRouter();
  const getSamplesByDeal = useSampleStore((s) => s.getSamplesByDeal);
  const addSample = useSampleStore((s) => s.addSample);
  const deleteSample = useSampleStore((s) => s.deleteSample);
  const products = useProductStore((s) => s.products);
  const settings = useSettingsStore((s) => s.settings);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; id: string } | null>(null);

  const samples = useMemo(() => {
    return getSamplesByDeal(dealId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [getSamplesByDeal, dealId]);

  const getProductNames = (lines: typeof samples[0]['lines']) => {
    return lines.slice(0, 2).map((line) => {
      if (line.productId) {
        const p = products.find((pr) => pr.id === line.productId);
        return p ? p.name : line.productName;
      }
      return line.productName || 'Unknown';
    });
  };

  const getTotalQty = (lines: typeof samples[0]['lines']) => {
    return lines.reduce((sum, l) => sum + (l.quantity || 0), 0);
  };

  if (samples.length === 0) return <EmptyState message="No samples yet." />;

  return (
    <>
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Product(s)</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Qty</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Carrier</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Tracking</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Requested Date</TableCell>
              <TableCell width={50} />
            </TableRow>
          </TableHead>
          <TableBody>
            {samples.map((sample) => {
              const statusStyle = STATUS_COLORS[sample.status] || { color: '#6B7280', bg: '#F3F4F6' };
              const productNames = getProductNames(sample.lines);
              const totalQty = getTotalQty(sample.lines);
              return (
                <TableRow key={sample.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/deals/${dealId}/samples/${sample.id}`)}>
                  <TableCell sx={{ fontWeight: 500 }}>{sample.name}</TableCell>
                  <TableCell>
                    {productNames.length > 0 ? (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {productNames.map((name, i) => <Chip key={i} label={name} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />)}
                        {sample.lines.length > 2 && <Chip label={`+${sample.lines.length - 2}`} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />}
                      </Box>
                    ) : '\u2014'}
                  </TableCell>
                  <TableCell align="right">{totalQty > 0 ? totalQty : '\u2014'}</TableCell>
                  <TableCell>
                    <Chip label={sample.status} size="small" sx={{ fontSize: '0.7rem', height: 22, fontWeight: 600, color: statusStyle.color, bgcolor: statusStyle.bg }} />
                  </TableCell>
                  <TableCell>{sample.carrier || '\u2014'}</TableCell>
                  <TableCell>
                    {sample.trackingNumber ? (
                      <Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{sample.trackingNumber}</Box>
                    ) : '\u2014'}
                  </TableCell>
                  <TableCell>{sample.requestedDate ? new Date(sample.requestedDate).toLocaleDateString() : '\u2014'}</TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <IconButton size="small" onClick={(e) => setMenuAnchor({ el: e.currentTarget, id: sample.id })}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Menu anchorEl={menuAnchor?.el} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => { if (menuAnchor) router.push(`/deals/${dealId}/samples/${menuAnchor.id}`); setMenuAnchor(null); }}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (menuAnchor) {
            const sample = samples.find((s) => s.id === menuAnchor.id);
            if (sample) {
              const newId = uuidv4();
              const now = new Date().toISOString();
              addSample({
                ...sample,
                id: newId,
                name: `Copy of ${sample.name}`,
                status: 'Requested',
                trackingNumber: '',
                carrier: '',
                sentDate: null,
                receivedDate: null,
                feedback: '',
                feedbackRating: null,
                requestedBy: settings.currentUser,
                requestedDate: now,
                createdAt: now,
                updatedAt: now,
              });
              router.push(`/deals/${dealId}/samples/${newId}`);
            }
          }
          setMenuAnchor(null);
        }}>
          <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { if (menuAnchor) deleteSample(menuAnchor.id); setMenuAnchor(null); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
