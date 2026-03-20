'use client';

import { useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import Snackbar from '@mui/material/Snackbar';
import Autocomplete from '@mui/material/Autocomplete';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import Tooltip from '@mui/material/Tooltip';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DescriptionIcon from '@mui/icons-material/Description';
import PageHeader from '@/components/shared/PageHeader';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import FileUploadZone from '@/components/shared/FileUploadZone';
import DealActivityLog from '@/components/deals/DealActivityLog';
import { useDealStore } from '@/stores/dealStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useOrderStore } from '@/stores/orderStore';
import { useProductStore } from '@/stores/productStore';
import { usePricingStore } from '@/stores/pricingStore';
import { useActivityStore } from '@/stores/activityStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHydration } from '@/hooks/useHydration';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import type { OrderStatus, OrderLine, OrderDocument, ShippingAddress } from '@/types';

const STATUS_COLORS: Record<OrderStatus, string> = {
  Draft: '#6B7280',
  Confirmed: '#2563EB',
  'In Production': '#F59E0B',
  Shipped: '#7C3AED',
  Delivered: '#059669',
  Cancelled: '#DC2626',
};

const STATUS_OPTIONS: OrderStatus[] = ['Draft', 'Confirmed', 'In Production', 'Shipped', 'Delivered', 'Cancelled'];
const STEPPER_STATUSES: OrderStatus[] = ['Draft', 'Confirmed', 'In Production', 'Shipped', 'Delivered'];

const INCOTERMS_OPTIONS = ['FCA', 'FOB', 'CIF', 'CFR', 'EXW', 'DAP', 'DDP'];
const CURRENCY_OPTIONS = ['USD', 'EUR'];
const PAYMENT_TERMS_OPTIONS = ['Net 30', 'Net 60', 'Net 90', 'Prepaid', 'COD', 'LC at Sight', 'LC 30 Days', 'LC 60 Days', 'LC 90 Days'];
const DOCUMENT_TYPES = ['Purchase Order', 'Invoice', 'Bill of Lading', 'Certificate', 'TDS', 'SDS', 'Shipping Docs', 'Other'] as const;

const DOC_TYPE_COLORS: Record<string, string> = {
  'Purchase Order': '#2563EB',
  Invoice: '#059669',
  'Bill of Lading': '#7C3AED',
  Certificate: '#D97706',
  TDS: '#0891B2',
  SDS: '#DC2626',
  'Shipping Docs': '#4F46E5',
  Other: '#6B7280',
};

export default function OrderDetailPage() {
  const hydrated = useHydration();
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  const orderId = params.orderId as string;

  const getDealById = useDealStore((s) => s.getDealById);
  const getCustomerById = useCustomerStore((s) => s.getCustomerById);
  const getOrderById = useOrderStore((s) => s.getOrderById);
  const updateOrder = useOrderStore((s) => s.updateOrder);
  const deleteOrder = useOrderStore((s) => s.deleteOrder);
  const getProductById = useProductStore((s) => s.getProductById);
  const products = useProductStore((s) => s.products);
  const getMSPForProduct = usePricingStore((s) => s.getMSPForProduct);
  const addActivity = useActivityStore((s) => s.addActivity);
  const settings = useSettingsStore((s) => s.settings);

  const [viewTab, setViewTab] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const deal = getDealById(dealId);
  const order = getOrderById(orderId);
  const customer = deal ? getCustomerById(deal.customerId) : undefined;

  const currentMonth = format(new Date(), 'yyyy-MM');

  const saveField = useCallback(
    (updates: Partial<typeof order>) => {
      if (!order) return;
      updateOrder(orderId, { ...updates, updatedAt: new Date().toISOString() });
    },
    [order, orderId, updateOrder]
  );

  const summary = useMemo(() => {
    if (!order) return { totalValue: 0, lineCount: 0 };
    let totalValue = 0;
    order.lines.forEach((line) => {
      if (line.quantity !== null && line.quantity > 0) {
        totalValue += line.pricePerUnit * line.quantity;
      }
    });
    return { totalValue, lineCount: order.lines.length };
  }, [order]);

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (!order) return;
    const now = new Date().toISOString();
    updateOrder(orderId, { status: newStatus, updatedAt: now });
    addActivity({
      id: uuidv4(),
      entityType: 'order',
      entityId: orderId,
      dealId,
      action: 'status_changed',
      details: `Order status changed to ${newStatus}`,
      userId: settings.currentUser,
      timestamp: now,
    });
    setSnackbar(`Status updated to ${newStatus}`);
  };

  const handleDelete = () => {
    deleteOrder(orderId);
    addActivity({
      id: uuidv4(),
      entityType: 'order',
      entityId: orderId,
      dealId,
      action: 'deal_deleted',
      details: `Order ${order?.orderNumber} deleted`,
      userId: settings.currentUser,
      timestamp: new Date().toISOString(),
    });
    router.push(`/deals/${dealId}`);
  };

  // Line items helpers
  const handleAddLine = () => {
    if (!order) return;
    const newLine: OrderLine = {
      id: uuidv4(),
      productId: '',
      quantity: null,
      unit: 'MT',
      pricePerUnit: 0,
      currency: order.currency || 'USD',
    };
    saveField({ lines: [...order.lines, newLine] });
  };

  const handleRemoveLine = (lineId: string) => {
    if (!order) return;
    saveField({ lines: order.lines.filter((l) => l.id !== lineId) });
  };

  const handleUpdateLine = (lineId: string, updates: Partial<OrderLine>) => {
    if (!order) return;
    saveField({
      lines: order.lines.map((l) => (l.id === lineId ? { ...l, ...updates } : l)),
    });
  };

  // Document helpers
  const handleAddDocument = (dataUrl: string) => {
    if (!order || !dataUrl) return;
    const newDoc: OrderDocument = {
      id: uuidv4(),
      name: `Document-${order.documents.length + 1}`,
      type: 'Other',
      url: dataUrl,
      uploadedAt: new Date().toISOString(),
      uploadedBy: settings.currentUser,
    };
    saveField({ documents: [...order.documents, newDoc] });
    setSnackbar('Document uploaded');
  };

  const handleUpdateDocument = (docId: string, updates: Partial<OrderDocument>) => {
    if (!order) return;
    saveField({
      documents: order.documents.map((d) => (d.id === docId ? { ...d, ...updates } : d)),
    });
  };

  const handleRemoveDocument = (docId: string) => {
    if (!order) return;
    saveField({ documents: order.documents.filter((d) => d.id !== docId) });
  };

  const handleUpdateAddress = (field: keyof ShippingAddress, value: string) => {
    if (!order) return;
    saveField({
      shippingAddress: { ...order.shippingAddress, [field]: value },
    });
  };

  if (!hydrated) return null;

  if (!deal || !order) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          {!deal ? 'Deal not found.' : 'Order not found.'}
        </Typography>
      </Box>
    );
  }

  const activeStepIndex = STEPPER_STATUSES.indexOf(order.status as OrderStatus);

  return (
    <Box>
      {/* Header */}
      <PageHeader
        title={order.name || order.orderNumber}
        breadcrumbs={[
          { label: 'Pipeline', href: '/deals' },
          { label: deal.name, href: `/deals/${dealId}` },
          { label: order.name || order.orderNumber },
        ]}
        actions={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {/* Status Selector */}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={order.status}
                onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                renderValue={(val) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: STATUS_COLORS[val as OrderStatus],
                      }}
                    />
                    <Typography variant="body2" fontWeight={600}>
                      {val}
                    </Typography>
                  </Box>
                )}
              >
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: STATUS_COLORS[s],
                        }}
                      />
                      {s}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Kebab Menu */}
            <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
            >
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  setConfirmDelete(true);
                }}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                Delete Order
              </MenuItem>
            </Menu>
          </Box>
        }
      />

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={viewTab} onChange={(_, v) => setViewTab(v)}>
          <Tab label="Details" sx={{ minHeight: 48 }} />
          <Tab label="Fulfillment" sx={{ minHeight: 48 }} />
          <Tab label="Documents" sx={{ minHeight: 48 }} />
          <Tab label="Activity" sx={{ minHeight: 48 }} />
        </Tabs>
      </Box>

      {/* ==================== DETAILS TAB ==================== */}
      {viewTab === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Order Info Card */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Order Info
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Name"
                      fullWidth
                      size="small"
                      value={order.name || ''}
                      onChange={(e) => saveField({ name: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="PO Number"
                      fullWidth
                      size="small"
                      value={order.poNumber || ''}
                      onChange={(e) => saveField({ poNumber: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Order Date"
                      fullWidth
                      size="small"
                      type="date"
                      value={order.orderDate ? order.orderDate.slice(0, 10) : ''}
                      onChange={(e) => saveField({ orderDate: e.target.value })}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Delivery Date"
                      fullWidth
                      size="small"
                      type="date"
                      value={order.deliveryDate ? order.deliveryDate.slice(0, 10) : ''}
                      onChange={(e) => saveField({ deliveryDate: e.target.value || null })}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Payment Terms</InputLabel>
                      <Select
                        label="Payment Terms"
                        value={order.paymentTerms || ''}
                        onChange={(e) => saveField({ paymentTerms: e.target.value })}
                      >
                        {PAYMENT_TERMS_OPTIONS.map((pt) => (
                          <MenuItem key={pt} value={pt}>
                            {pt}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Incoterms</InputLabel>
                      <Select
                        label="Incoterms"
                        value={order.incoterms || ''}
                        onChange={(e) => saveField({ incoterms: e.target.value })}
                      >
                        {INCOTERMS_OPTIONS.map((ic) => (
                          <MenuItem key={ic} value={ic}>
                            {ic}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Incoterms Location"
                      fullWidth
                      size="small"
                      value={order.incotermsLocation || ''}
                      onChange={(e) => saveField({ incotermsLocation: e.target.value })}
                    />
                  </Grid>

                  {/* Shipping Address */}
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mt: 1, mb: 1, color: 'text.secondary' }}>
                      Shipping Address
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Street"
                      fullWidth
                      size="small"
                      value={order.shippingAddress?.street || ''}
                      onChange={(e) => handleUpdateAddress('street', e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="City"
                      fullWidth
                      size="small"
                      value={order.shippingAddress?.city || ''}
                      onChange={(e) => handleUpdateAddress('city', e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      label="State"
                      fullWidth
                      size="small"
                      value={order.shippingAddress?.state || ''}
                      onChange={(e) => handleUpdateAddress('state', e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      label="Postal Code"
                      fullWidth
                      size="small"
                      value={order.shippingAddress?.postalCode || ''}
                      onChange={(e) => handleUpdateAddress('postalCode', e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Country"
                      fullWidth
                      size="small"
                      value={order.shippingAddress?.country || ''}
                      onChange={(e) => handleUpdateAddress('country', e.target.value)}
                    />
                  </Grid>

                  {/* Notes */}
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Notes"
                      fullWidth
                      size="small"
                      multiline
                      minRows={3}
                      value={order.notes || ''}
                      onChange={(e) => saveField({ notes: e.target.value })}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Line Items Card */}
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Line Items ({order.lines.length})</Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={handleAddLine}>
                    Add Line
                  </Button>
                </Box>
                {order.lines.length === 0 ? (
                  <Typography color="text.secondary">No line items. Click Add Line to start.</Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Qty</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Unit</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Price/Unit</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Currency</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">MSP</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Margin</TableCell>
                          <TableCell sx={{ fontWeight: 600, width: 48 }} />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {order.lines.map((line) => {
                          const product = line.productId ? getProductById(line.productId) : undefined;
                          const mspEntry = line.productId ? getMSPForProduct(line.productId, currentMonth) : undefined;
                          const mspPrice = mspEntry?.price ?? null;
                          const lineTotal = line.quantity !== null && line.quantity > 0 ? line.pricePerUnit * line.quantity : null;
                          let marginPct: number | null = null;
                          if (mspPrice !== null && line.pricePerUnit > 0) {
                            marginPct = ((line.pricePerUnit - mspPrice) / line.pricePerUnit) * 100;
                          }
                          const isBelowMSP = mspPrice !== null && line.pricePerUnit < mspPrice;

                          return (
                            <TableRow key={line.id}>
                              <TableCell sx={{ minWidth: 200 }}>
                                <Autocomplete
                                  size="small"
                                  options={products}
                                  getOptionLabel={(opt) => `${opt.name} (${opt.code})`}
                                  value={product || null}
                                  onChange={(_, val) =>
                                    handleUpdateLine(line.id, { productId: val?.id || '' })
                                  }
                                  renderInput={(params) => (
                                    <TextField {...params} placeholder="Select product" variant="standard" />
                                  )}
                                  disableClearable={false}
                                />
                              </TableCell>
                              <TableCell align="right" sx={{ width: 100 }}>
                                <TextField
                                  variant="standard"
                                  size="small"
                                  type="number"
                                  value={line.quantity ?? ''}
                                  onChange={(e) =>
                                    handleUpdateLine(line.id, {
                                      quantity: e.target.value ? Number(e.target.value) : null,
                                    })
                                  }
                                  slotProps={{ htmlInput: { style: { textAlign: 'right' } } }}
                                />
                              </TableCell>
                              <TableCell sx={{ width: 80 }}>
                                <Select
                                  variant="standard"
                                  size="small"
                                  value={line.unit}
                                  onChange={(e) =>
                                    handleUpdateLine(line.id, { unit: e.target.value as 'MT' | 'KG' })
                                  }
                                >
                                  <MenuItem value="MT">MT</MenuItem>
                                  <MenuItem value="KG">KG</MenuItem>
                                </Select>
                              </TableCell>
                              <TableCell align="right" sx={{ width: 110 }}>
                                <TextField
                                  variant="standard"
                                  size="small"
                                  type="number"
                                  value={line.pricePerUnit || ''}
                                  onChange={(e) =>
                                    handleUpdateLine(line.id, {
                                      pricePerUnit: Number(e.target.value) || 0,
                                    })
                                  }
                                  slotProps={{ htmlInput: { style: { textAlign: 'right' } } }}
                                />
                              </TableCell>
                              <TableCell sx={{ width: 80 }}>
                                <Select
                                  variant="standard"
                                  size="small"
                                  value={line.currency || 'USD'}
                                  onChange={(e) =>
                                    handleUpdateLine(line.id, { currency: e.target.value })
                                  }
                                >
                                  {CURRENCY_OPTIONS.map((c) => (
                                    <MenuItem key={c} value={c}>
                                      {c}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </TableCell>
                              <TableCell align="right">
                                {lineTotal !== null
                                  ? `${line.currency} ${lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  : '\u2014'}
                              </TableCell>
                              <TableCell align="right">
                                {mspPrice !== null
                                  ? mspPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                  : '\u2014'}
                              </TableCell>
                              <TableCell align="right">
                                {marginPct !== null ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                    {isBelowMSP && (
                                      <Tooltip title="Below MSP">
                                        <WarningAmberIcon fontSize="small" color="warning" />
                                      </Tooltip>
                                    )}
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color: marginPct >= 0 ? 'success.main' : 'error.main',
                                        fontWeight: 500,
                                      }}
                                    >
                                      {marginPct.toFixed(1)}%
                                    </Typography>
                                  </Box>
                                ) : (
                                  '\u2014'
                                )}
                              </TableCell>
                              <TableCell>
                                <IconButton size="small" onClick={() => handleRemoveLine(line.id)} color="error">
                                  <RemoveCircleOutlineIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column */}
          <Grid size={{ xs: 12, md: 4 }}>
            {/* Summary Card */}
            <Card variant="outlined" sx={{ position: 'sticky', top: 24, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Summary
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Value
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {summary.totalValue > 0
                        ? `${order.currency || 'USD'} ${summary.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '\u2014'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Line Count
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {summary.lineCount}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      PO #
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {order.poNumber || '\u2014'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Order Date
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {order.orderDate ? format(new Date(order.orderDate), 'MMM d, yyyy') : '\u2014'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Delivery Date
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {order.deliveryDate ? format(new Date(order.deliveryDate), 'MMM d, yyyy') : '\u2014'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Quick Info Card */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Quick Info
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Customer
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {customer?.name || '\u2014'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Incoterms
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {order.incoterms || '\u2014'}
                      {order.incotermsLocation ? ` \u2013 ${order.incotermsLocation}` : ''}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Payment Terms
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {order.paymentTerms || '\u2014'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ==================== FULFILLMENT TAB ==================== */}
      {viewTab === 1 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Status Stepper */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Fulfillment Progress
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {order.status === 'Cancelled' ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, bgcolor: '#FEE2E2', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ color: '#DC2626', fontWeight: 600 }}>
                      This order has been cancelled.
                    </Typography>
                  </Box>
                ) : (
                  <Stepper activeStep={activeStepIndex} orientation="vertical">
                    {STEPPER_STATUSES.map((status, index) => {
                      const isCompleted = activeStepIndex > index;
                      const isCurrent = activeStepIndex === index;
                      return (
                        <Step key={status} completed={isCompleted}>
                          <StepLabel
                            icon={
                              isCompleted ? (
                                <CheckCircleIcon sx={{ color: STATUS_COLORS[status] }} />
                              ) : isCurrent ? (
                                <Box
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    bgcolor: STATUS_COLORS[status],
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: 12,
                                    fontWeight: 700,
                                  }}
                                >
                                  {index + 1}
                                </Box>
                              ) : undefined
                            }
                            sx={{
                              '& .MuiStepLabel-label': {
                                fontWeight: isCurrent ? 700 : 400,
                                color: isCurrent ? STATUS_COLORS[status] : undefined,
                              },
                            }}
                          >
                            {status}
                          </StepLabel>
                          <StepContent>
                            {isCompleted || isCurrent ? (
                              <Typography variant="caption" color="text.secondary">
                                {isCurrent ? 'Current status' : `Completed`}
                                {order.updatedAt ? ` \u2014 ${format(new Date(order.updatedAt), 'MMM d, yyyy')}` : ''}
                              </Typography>
                            ) : null}
                          </StepContent>
                        </Step>
                      );
                    })}
                  </Stepper>
                )}
              </CardContent>
            </Card>

            {/* Shipping Info */}
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LocalShippingIcon color="action" />
                  <Typography variant="h6">Shipping Info</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Carrier"
                      fullWidth
                      size="small"
                      value={order.carrier || ''}
                      onChange={(e) => saveField({ carrier: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Tracking Number"
                      fullWidth
                      size="small"
                      value={order.trackingNumber || ''}
                      onChange={(e) => saveField({ trackingNumber: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="ETA"
                      fullWidth
                      size="small"
                      type="date"
                      value={order.estimatedArrival ? order.estimatedArrival.slice(0, 10) : ''}
                      onChange={(e) => saveField({ estimatedArrival: e.target.value || null })}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Shipping Address */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card variant="outlined" sx={{ position: 'sticky', top: 24 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Shipping Address
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {order.shippingAddress &&
                (order.shippingAddress.street || order.shippingAddress.city || order.shippingAddress.country) ? (
                  <Box>
                    {order.shippingAddress.street && (
                      <Typography variant="body2">{order.shippingAddress.street}</Typography>
                    )}
                    <Typography variant="body2">
                      {[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postalCode]
                        .filter(Boolean)
                        .join(', ')}
                    </Typography>
                    {order.shippingAddress.country && (
                      <Typography variant="body2" fontWeight={500}>
                        {order.shippingAddress.country}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No shipping address provided. Add one in the Details tab.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ==================== DOCUMENTS TAB ==================== */}
      {viewTab === 2 && (
        <Box>
          {/* Product Documents (auto from TDS) */}
          {order.lines.some((l) => {
            const p = getProductById(l.productId);
            return p?.tds;
          }) && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Product Technical Data
              </Typography>
              <Grid container spacing={2}>
                {order.lines.map((line) => {
                  const product = getProductById(line.productId);
                  if (!product?.tds) return null;
                  const tds = product.tds;
                  return (
                    <Grid key={line.id} size={{ xs: 12, md: 6 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <DescriptionIcon color="primary" fontSize="small" />
                            <Typography variant="subtitle1" fontWeight={600}>
                              {product.name} ({product.code})
                            </Typography>
                          </Box>
                          <Divider sx={{ mb: 1.5 }} />

                          {/* General */}
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            General
                          </Typography>
                          <Grid container spacing={1} sx={{ mb: 1.5, mt: 0.5 }}>
                            {tds.grade && (
                              <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" color="text.secondary">Grade</Typography>
                                <Typography variant="body2">{tds.grade}</Typography>
                              </Grid>
                            )}
                            {tds.form && (
                              <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" color="text.secondary">Form</Typography>
                                <Typography variant="body2">{tds.form}</Typography>
                              </Grid>
                            )}
                            {tds.color && (
                              <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" color="text.secondary">Color</Typography>
                                <Typography variant="body2">{tds.color}</Typography>
                              </Grid>
                            )}
                            {tds.supplier && (
                              <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" color="text.secondary">Supplier</Typography>
                                <Typography variant="body2">{tds.supplier}</Typography>
                              </Grid>
                            )}
                          </Grid>

                          {/* Mechanical */}
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Mechanical Properties
                          </Typography>
                          <Grid container spacing={1} sx={{ mb: 1.5, mt: 0.5 }}>
                            {tds.density && (
                              <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" color="text.secondary">Density</Typography>
                                <Typography variant="body2">{tds.density}</Typography>
                              </Grid>
                            )}
                            {tds.meltFlowIndex && (
                              <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" color="text.secondary">Melt Flow Index</Typography>
                                <Typography variant="body2">{tds.meltFlowIndex}</Typography>
                              </Grid>
                            )}
                            {tds.tensileStrength && (
                              <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" color="text.secondary">Tensile Strength</Typography>
                                <Typography variant="body2">{tds.tensileStrength}</Typography>
                              </Grid>
                            )}
                            {tds.elongationAtBreak && (
                              <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" color="text.secondary">Elongation at Break</Typography>
                                <Typography variant="body2">{tds.elongationAtBreak}</Typography>
                              </Grid>
                            )}
                            {tds.flexuralModulus && (
                              <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" color="text.secondary">Flexural Modulus</Typography>
                                <Typography variant="body2">{tds.flexuralModulus}</Typography>
                              </Grid>
                            )}
                            {tds.impactStrength && (
                              <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" color="text.secondary">Impact Strength</Typography>
                                <Typography variant="body2">{tds.impactStrength}</Typography>
                              </Grid>
                            )}
                          </Grid>

                          {/* Thermal */}
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Thermal Properties
                          </Typography>
                          <Grid container spacing={1} sx={{ mb: 1.5, mt: 0.5 }}>
                            {tds.vicatSofteningTemp && (
                              <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" color="text.secondary">Vicat Softening Temp</Typography>
                                <Typography variant="body2">{tds.vicatSofteningTemp}</Typography>
                              </Grid>
                            )}
                            {tds.heatDeflectionTemp && (
                              <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" color="text.secondary">Heat Deflection Temp</Typography>
                                <Typography variant="body2">{tds.heatDeflectionTemp}</Typography>
                              </Grid>
                            )}
                            {tds.meltingPoint && (
                              <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" color="text.secondary">Melting Point</Typography>
                                <Typography variant="body2">{tds.meltingPoint}</Typography>
                              </Grid>
                            )}
                            {tds.shoreHardness && (
                              <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" color="text.secondary">Shore Hardness</Typography>
                                <Typography variant="body2">{tds.shoreHardness}</Typography>
                              </Grid>
                            )}
                          </Grid>

                          {/* Applications & Compliance */}
                          {tds.applications && tds.applications.length > 0 && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" color="text.secondary">Applications</Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                {tds.applications.map((app) => (
                                  <Chip key={app} label={app} size="small" variant="outlined" />
                                ))}
                              </Box>
                            </Box>
                          )}
                          {tds.compliance && tds.compliance.length > 0 && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" color="text.secondary">Compliance</Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                {tds.compliance.map((c) => (
                                  <Chip key={c} label={c} size="small" color="success" variant="outlined" />
                                ))}
                              </Box>
                            </Box>
                          )}
                          {tds.processingMethods && tds.processingMethods.length > 0 && (
                            <Box>
                              <Typography variant="caption" color="text.secondary">Processing Methods</Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                {tds.processingMethods.map((m) => (
                                  <Chip key={m} label={m} size="small" variant="outlined" />
                                ))}
                              </Box>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}

          {/* Uploaded Documents */}
          <Typography variant="h6" sx={{ mb: 2 }}>
            Uploaded Documents
          </Typography>
          {order.documents.length > 0 && (
            <TableContainer sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Uploaded</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>By</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 48 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <FormControl size="small" variant="standard" sx={{ minWidth: 120 }}>
                          <Select
                            value={doc.type}
                            onChange={(e) =>
                              handleUpdateDocument(doc.id, { type: e.target.value as OrderDocument['type'] })
                            }
                          >
                            {DOCUMENT_TYPES.map((dt) => (
                              <MenuItem key={dt} value={dt}>
                                <Chip
                                  label={dt}
                                  size="small"
                                  sx={{
                                    bgcolor: `${DOC_TYPE_COLORS[dt]}15`,
                                    color: DOC_TYPE_COLORS[dt],
                                    fontWeight: 600,
                                    fontSize: '0.7rem',
                                  }}
                                />
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <TextField
                          variant="standard"
                          size="small"
                          value={doc.name}
                          onChange={(e) => handleUpdateDocument(doc.id, { name: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {doc.uploadedAt ? format(new Date(doc.uploadedAt), 'MMM d, yyyy') : '\u2014'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{doc.uploadedBy}</Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleRemoveDocument(doc.id)} color="error">
                          <RemoveCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Upload Document
              </Typography>
              <FileUploadZone
                value=""
                onChange={handleAddDocument}
                label="Document"
                accept="image/png,image/jpeg,application/pdf,.png,.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx"
                acceptLabel="PDF, PNG, JPG, DOC, XLS"
              />
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ==================== ACTIVITY TAB ==================== */}
      {viewTab === 3 && <DealActivityLog dealId={dealId} />}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete}
        title="Delete Order"
        message={`Are you sure you want to delete order ${order.orderNumber}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        color="error"
      />

      <Snackbar
        open={!!snackbar}
        autoHideDuration={2000}
        onClose={() => setSnackbar('')}
        message={snackbar}
      />
    </Box>
  );
}
