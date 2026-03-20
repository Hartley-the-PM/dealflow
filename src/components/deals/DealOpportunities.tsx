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
import { useOpportunityStore } from '@/stores/opportunityStore';
import { useProductStore } from '@/stores/productStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { v4 as uuidv4 } from 'uuid';

interface DealOpportunitiesProps {
  dealId: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  High: '#DC2626', Medium: '#F59E0B', Low: '#6B7280',
};

export default function DealOpportunities({ dealId }: DealOpportunitiesProps) {
  const router = useRouter();
  const opportunities = useOpportunityStore((s) => s.opportunities);
  const addOpportunity = useOpportunityStore((s) => s.addOpportunity);
  const deleteOpportunity = useOpportunityStore((s) => s.deleteOpportunity);
  const products = useProductStore((s) => s.products);
  const settings = useSettingsStore((s) => s.settings);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; id: string } | null>(null);

  const dealOpps = useMemo(() => {
    return opportunities.filter((o) => o.dealId === dealId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [opportunities, dealId]);

  const getProductName = (productId: string, productName: string) => {
    if (productName) return productName;
    const p = products.find((pr) => pr.id === productId);
    return p ? p.name : 'Unknown';
  };

  if (dealOpps.length === 0) return <EmptyState message="No opportunities yet." />;

  return (
    <>
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Source</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Probability</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Est. Value</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Products</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Expected Close</TableCell>
              <TableCell width={50} />
            </TableRow>
          </TableHead>
          <TableBody>
            {dealOpps.map((opp) => {
              const estValue = opp.estimatedValue || opp.lines.reduce((sum, l) => sum + ((l.estimatedQty || 0) * (l.targetPrice || 0)), 0);
              const productNames = opp.lines.slice(0, 2).map((l) => getProductName(l.productId, l.productName));
              return (
                <TableRow key={opp.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/deals/${dealId}/opportunities/${opp.id}`)}>
                  <TableCell sx={{ fontWeight: 500 }}>{opp.title}</TableCell>
                  <TableCell><Chip label={opp.source} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} /></TableCell>
                  <TableCell>
                    <Chip label={opp.priority} size="small" sx={{ fontSize: '0.7rem', height: 22, fontWeight: 600, color: PRIORITY_COLORS[opp.priority], bgcolor: `${PRIORITY_COLORS[opp.priority]}12` }} />
                  </TableCell>
                  <TableCell align="right"><Box component="span" sx={{ fontWeight: 500 }}>{opp.probability}%</Box></TableCell>
                  <TableCell align="right">{estValue > 0 ? `$${estValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '\u2014'}</TableCell>
                  <TableCell>
                    {productNames.length > 0 ? (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {productNames.map((name, i) => <Chip key={i} label={name} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />)}
                        {opp.lines.length > 2 && <Chip label={`+${opp.lines.length - 2}`} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />}
                      </Box>
                    ) : '\u2014'}
                  </TableCell>
                  <TableCell>{opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toLocaleDateString() : '\u2014'}</TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <IconButton size="small" onClick={(e) => setMenuAnchor({ el: e.currentTarget, id: opp.id })}>
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
        <MenuItem onClick={() => { if (menuAnchor) router.push(`/deals/${dealId}/opportunities/${menuAnchor.id}`); setMenuAnchor(null); }}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (menuAnchor) {
            const opp = opportunities.find((o) => o.id === menuAnchor.id);
            if (opp) {
              const newId = uuidv4();
              const now = new Date().toISOString();
              addOpportunity({
                ...opp,
                id: newId,
                title: `Copy of ${opp.title}`,
                status: 'Open',
                createdBy: settings.currentUser,
                createdAt: now,
                updatedAt: now,
                convertedOfferId: null,
                convertedOrderId: null,
              });
              router.push(`/deals/${dealId}/opportunities/${newId}`);
            }
          }
          setMenuAnchor(null);
        }}>
          <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { if (menuAnchor) deleteOpportunity(menuAnchor.id); setMenuAnchor(null); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
