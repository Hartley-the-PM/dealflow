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
import { useOrderStore } from '@/stores/orderStore';
import { useProductStore } from '@/stores/productStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { v4 as uuidv4 } from 'uuid';
import type { OrderStatus } from '@/types';

interface DealOrdersProps {
  dealId: string;
}

const STATUS_COLORS: Record<OrderStatus, { color: string; bg: string }> = {
  Draft: { color: '#6B7280', bg: '#F3F4F6' },
  Confirmed: { color: '#2563EB', bg: '#EFF6FF' },
  'In Production': { color: '#F59E0B', bg: '#FFFBEB' },
  Shipped: { color: '#7C3AED', bg: '#F5F3FF' },
  Delivered: { color: '#059669', bg: '#ECFDF5' },
  Cancelled: { color: '#DC2626', bg: '#FEF2F2' },
};

export default function DealOrders({ dealId }: DealOrdersProps) {
  const router = useRouter();
  const orders = useOrderStore((s) => s.orders);
  const addOrder = useOrderStore((s) => s.addOrder);
  const deleteOrder = useOrderStore((s) => s.deleteOrder);
  const products = useProductStore((s) => s.products);
  const settings = useSettingsStore((s) => s.settings);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; id: string } | null>(null);

  const dealOrders = useMemo(() => {
    return orders.filter((o) => o.dealId === dealId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [orders, dealId]);

  const getProductName = (productId: string) => {
    const p = products.find((pr) => pr.id === productId);
    return p ? p.name : 'Unknown';
  };

  if (dealOrders.length === 0) return <EmptyState message="No orders yet." />;

  return (
    <>
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Order #</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>PO Number</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Total Value</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Products</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Order Date</TableCell>
              <TableCell width={50} />
            </TableRow>
          </TableHead>
          <TableBody>
            {dealOrders.map((order) => {
              const totalValue = (order.lines || []).reduce((sum, l) => sum + ((l.quantity || 0) * (l.pricePerUnit || 0)), 0);
              const statusStyle = STATUS_COLORS[order.status as OrderStatus] || { color: '#6B7280', bg: '#F3F4F6' };
              const productNames = (order.lines || []).slice(0, 2).map((l) => getProductName(l.productId));
              return (
                <TableRow key={order.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/deals/${dealId}/orders/${order.id}`)}>
                  <TableCell sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.8rem' }}>{order.orderNumber}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{order.name || '\u2014'}</TableCell>
                  <TableCell>
                    <Chip label={order.status} size="small" sx={{ fontSize: '0.7rem', height: 22, fontWeight: 600, color: statusStyle.color, bgcolor: statusStyle.bg }} />
                  </TableCell>
                  <TableCell><Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{order.poNumber || '\u2014'}</Box></TableCell>
                  <TableCell align="right">
                    {totalValue > 0 ? `${order.currency || 'USD'} ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '\u2014'}
                  </TableCell>
                  <TableCell>
                    {productNames.length > 0 ? (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {productNames.map((name, i) => <Chip key={i} label={name} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />)}
                        {(order.lines || []).length > 2 && <Chip label={`+${(order.lines || []).length - 2}`} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />}
                      </Box>
                    ) : '\u2014'}
                  </TableCell>
                  <TableCell>{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '\u2014'}</TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <IconButton size="small" onClick={(e) => setMenuAnchor({ el: e.currentTarget, id: order.id })}>
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
        <MenuItem onClick={() => { if (menuAnchor) router.push(`/deals/${dealId}/orders/${menuAnchor.id}`); setMenuAnchor(null); }}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (menuAnchor) {
            const order = orders.find((o) => o.id === menuAnchor.id);
            if (order) {
              const newId = uuidv4();
              const now = new Date().toISOString();
              const newOrderNumber = `ORD-${Date.now().toString().slice(-6)}`;
              addOrder({
                ...order,
                id: newId,
                orderNumber: newOrderNumber,
                name: `Copy of ${order.name}`,
                status: 'Draft',
                trackingNumber: '',
                carrier: '',
                estimatedArrival: null,
                documents: [],
                createdBy: settings.currentUser,
                createdAt: now,
                updatedAt: now,
              });
              router.push(`/deals/${dealId}/orders/${newId}`);
            }
          }
          setMenuAnchor(null);
        }}>
          <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { if (menuAnchor) deleteOrder(menuAnchor.id); setMenuAnchor(null); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
