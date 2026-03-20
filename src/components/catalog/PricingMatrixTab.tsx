'use client';

import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Autocomplete from '@mui/material/Autocomplete';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { usePricingEngineStore } from '@/stores/pricingEngineStore';
import { usePricingStore } from '@/stores/pricingStore';
import { useProductStore } from '@/stores/productStore';
import { useCustomerStore } from '@/stores/customerStore';
import type {
  PricingRule,
  CustomerOverride,
  AdjustmentTrigger,
  AdjustmentType,
  PricingRuleCondition,
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

const PRODUCT_TYPE_COLOR: Record<string, string> = {
  LDPE: '#2563EB',
  HDPE: '#059669',
  PP: '#D97706',
  PVC: '#7C3AED',
  PS: '#DC2626',
  PET: '#0891B2',
};

const TRIGGER_LABELS: Record<AdjustmentTrigger, string> = {
  volume: 'Volume',
  customer_tier: 'Customer Tier',
  incoterms: 'Incoterms',
  payment_terms: 'Payment Terms',
  product_type: 'Product Type',
};

function formatCondition(rule: PricingRule): string {
  const c = rule.condition;
  switch (rule.trigger) {
    case 'volume': {
      const parts: string[] = [];
      if (c.minQuantity != null) parts.push(`≥${c.minQuantity} MT`);
      if (c.maxQuantity != null) parts.push(`≤${c.maxQuantity} MT`);
      return parts.join(' & ') || '—';
    }
    case 'customer_tier':
      return c.tiers?.map((t) => `Tier ${t}`).join(', ') ?? '—';
    case 'incoterms':
      return c.incoterms?.join(', ') ?? '—';
    case 'payment_terms':
      return c.paymentTermsMinDays != null ? `≥${c.paymentTermsMinDays} days` : '—';
    case 'product_type':
      return c.categories?.join(', ') ?? '—';
    default:
      return '—';
  }
}

function formatAdjustment(rule: PricingRule): string {
  const val = rule.adjustmentValue;
  if (rule.adjustmentType === 'percentage') {
    return `${val > 0 ? '+' : ''}${val}%`;
  }
  return `${val > 0 ? '+' : ''}$${val}/MT`;
}

function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(parseInt(year), parseInt(m) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

// ─── Mini MSP Chart (compact, no controls) ─────────────────────────────
function MiniMSPChart({ productId }: { productId: string }) {
  const entries = usePricingStore((s) => s.entries);

  const chartData = useMemo(() => {
    const productEntries = entries
      .filter((e) => e.productId === productId)
      .sort((a, b) => a.month.localeCompare(b.month));
    // Last 6 months
    const recent = productEntries.slice(-6);
    return recent.map((e) => ({
      month: formatMonth(e.month),
      price: e.price,
    }));
  }, [entries, productId]);

  if (chartData.length === 0) {
    return (
      <Box sx={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="caption" color="text.secondary">No MSP data</Typography>
      </Box>
    );
  }

  const prices = chartData.map((d) => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const padding = (max - min) * 0.15 || 20;

  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="month" fontSize={10} tickMargin={4} />
        <YAxis
          fontSize={10}
          tickFormatter={(v: number) => `$${v}`}
          domain={[min - padding, max + padding]}
          width={55}
        />
        <RechartsTooltip
          formatter={((value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}/MT`, 'MSP']) as any}
          contentStyle={{ fontSize: 11, borderRadius: 6 }}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#1E40AF"
          strokeWidth={2}
          dot={{ r: 3 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────
export default function PricingMatrixTab() {
  const products = useProductStore((s) => s.products);
  const customers = useCustomerStore((s) => s.customers);
  const basePrices = usePricingEngineStore((s) => s.basePrices);
  const updateBasePrice = usePricingEngineStore((s) => s.updateBasePrice);
  const rules = usePricingEngineStore((s) => s.rules);
  const addRule = usePricingEngineStore((s) => s.addRule);
  const updateRule = usePricingEngineStore((s) => s.updateRule);
  const deleteRule = usePricingEngineStore((s) => s.deleteRule);
  const overrides = usePricingEngineStore((s) => s.overrides);
  const addOverride = usePricingEngineStore((s) => s.addOverride);
  const deleteOverride = usePricingEngineStore((s) => s.deleteOverride);

  // Product list state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Base price editing
  const [editingBP, setEditingBP] = useState(false);
  const [editBPValue, setEditBPValue] = useState('');

  // Rule dialog
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [ruleName, setRuleName] = useState('');
  const [ruleTrigger, setRuleTrigger] = useState<AdjustmentTrigger>('volume');
  const [ruleAdjType, setRuleAdjType] = useState<AdjustmentType>('percentage');
  const [ruleAdjValue, setRuleAdjValue] = useState('');
  const [rulePriority, setRulePriority] = useState('10');
  const [ruleConditionValue, setRuleConditionValue] = useState('');

  // Override dialog
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [ovrCustomerId, setOvrCustomerId] = useState('');
  const [ovrPrice, setOvrPrice] = useState('');
  const [ovrNote, setOvrNote] = useState('');

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' }>({
    open: false, message: '', severity: 'success',
  });

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.productType));
    return Array.from(cats).sort();
  }, [products]);

  // Enriched product list with base price + counts
  const productRows = useMemo(() => {
    let filtered = products;
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.code.toLowerCase().includes(lower)
      );
    }
    if (categoryFilter) {
      filtered = filtered.filter((p) => p.productType === categoryFilter);
    }

    return filtered
      .map((p) => {
        const bp = basePrices.find((b) => b.productId === p.id);
        const ruleCount = rules.filter(
          (r) => r.productId === p.id || !r.productId
        ).length;
        const productRuleCount = rules.filter((r) => r.productId === p.id).length;
        const overrideCount = overrides.filter((o) => o.productId === p.id).length;
        return {
          ...p,
          basePrice: bp?.price ?? null,
          basePriceId: bp?.id ?? null,
          ruleCount,
          productRuleCount,
          overrideCount,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, basePrices, rules, overrides, search, categoryFilter]);

  const selectedProduct = selectedProductId
    ? products.find((p) => p.id === selectedProductId)
    : null;

  const selectedBP = selectedProductId
    ? basePrices.find((b) => b.productId === selectedProductId)
    : null;

  // Rules for the selected product: global + product-specific
  const selectedRules = useMemo(() => {
    if (!selectedProductId) return [];
    return rules
      .filter((r) => !r.productId || r.productId === selectedProductId)
      .sort((a, b) => a.priority - b.priority);
  }, [rules, selectedProductId]);

  // Overrides for the selected product
  const selectedOverrides = useMemo(() => {
    if (!selectedProductId) return [];
    return overrides
      .filter((o) => o.productId === selectedProductId)
      .map((o) => ({
        ...o,
        customerName: customers.find((c) => c.id === o.customerId)?.name ?? 'Unknown',
      }));
  }, [overrides, customers, selectedProductId]);

  // ─── Handlers ───────────────────────────────────────────────────────

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    setEditingBP(false);
    const bp = basePrices.find((b) => b.productId === productId);
    setEditBPValue(bp ? String(bp.price) : '');
  };

  const handleSaveBP = () => {
    if (!selectedBP) return;
    const val = parseFloat(editBPValue);
    if (!isNaN(val) && val >= 0) {
      updateBasePrice(selectedBP.id, { price: val });
      setSnackbar({ open: true, message: 'Base price updated', severity: 'success' });
    }
    setEditingBP(false);
  };

  // Rule dialog
  const openRuleDialog = (rule?: PricingRule) => {
    if (rule) {
      setEditingRule(rule);
      setRuleName(rule.name);
      setRuleTrigger(rule.trigger);
      setRuleAdjType(rule.adjustmentType);
      setRuleAdjValue(String(rule.adjustmentValue));
      setRulePriority(String(rule.priority));
      const c = rule.condition;
      if (rule.trigger === 'volume') setRuleConditionValue(String(c.minQuantity ?? c.maxQuantity ?? ''));
      else if (rule.trigger === 'customer_tier') setRuleConditionValue(c.tiers?.join(',') ?? '');
      else if (rule.trigger === 'incoterms') setRuleConditionValue(c.incoterms?.join(',') ?? '');
      else if (rule.trigger === 'payment_terms') setRuleConditionValue(String(c.paymentTermsMinDays ?? ''));
      else if (rule.trigger === 'product_type') setRuleConditionValue(c.categories?.join(',') ?? '');
    } else {
      setEditingRule(null);
      setRuleName('');
      setRuleTrigger('volume');
      setRuleAdjType('percentage');
      setRuleAdjValue('');
      setRulePriority('10');
      setRuleConditionValue('');
    }
    setRuleDialogOpen(true);
  };

  const handleSaveRule = () => {
    const condition: PricingRuleCondition = {};
    if (ruleTrigger === 'volume') {
      const val = parseFloat(ruleConditionValue);
      if (val > 0) condition.minQuantity = val;
    } else if (ruleTrigger === 'customer_tier')
      condition.tiers = ruleConditionValue.split(',').map((s) => s.trim());
    else if (ruleTrigger === 'incoterms')
      condition.incoterms = ruleConditionValue.split(',').map((s) => s.trim());
    else if (ruleTrigger === 'payment_terms')
      condition.paymentTermsMinDays = parseInt(ruleConditionValue) || 30;
    else if (ruleTrigger === 'product_type')
      condition.categories = ruleConditionValue.split(',').map((s) => s.trim());

    const ruleData: PricingRule = {
      id: editingRule?.id ?? uuidv4(),
      name: ruleName,
      productId: selectedProductId ?? undefined,
      trigger: ruleTrigger,
      condition,
      adjustmentType: ruleAdjType,
      adjustmentValue: parseFloat(ruleAdjValue) || 0,
      priority: parseInt(rulePriority) || 10,
      active: editingRule?.active ?? true,
    };

    if (editingRule) {
      updateRule(editingRule.id, ruleData);
      setSnackbar({ open: true, message: 'Rule updated', severity: 'success' });
    } else {
      addRule(ruleData);
      setSnackbar({ open: true, message: 'Rule created', severity: 'success' });
    }
    setRuleDialogOpen(false);
  };

  const conditionLabel = () => {
    switch (ruleTrigger) {
      case 'volume': return 'Min Quantity (MT)';
      case 'customer_tier': return 'Tiers (comma-separated: A,B,C)';
      case 'incoterms': return 'Incoterms (comma-separated)';
      case 'payment_terms': return 'Min Days';
      case 'product_type': return 'Product Types (comma-separated)';
      default: return 'Condition';
    }
  };

  // Override dialog
  const openOverrideDialog = () => {
    setOvrCustomerId('');
    setOvrPrice('');
    setOvrNote('');
    setOverrideDialogOpen(true);
  };

  const handleSaveOverride = () => {
    const price = parseFloat(ovrPrice);
    if (!ovrCustomerId || !selectedProductId || isNaN(price)) return;
    const override: CustomerOverride = {
      id: uuidv4(),
      customerId: ovrCustomerId,
      productId: selectedProductId,
      overridePrice: price,
      currency: 'USD',
      validFrom: new Date().toISOString().slice(0, 10),
      note: ovrNote,
    };
    addOverride(override);
    setSnackbar({ open: true, message: 'Override created', severity: 'success' });
    setOverrideDialogOpen(false);
  };

  return (
    <Box>
      {/* Search + Category Filter */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 260 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        {categories.map((cat) => (
          <Chip
            key={cat}
            label={cat}
            size="small"
            variant={categoryFilter === cat ? 'filled' : 'outlined'}
            onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
            sx={{
              fontWeight: 600,
              fontSize: 11,
              ...(categoryFilter === cat && {
                bgcolor: PRODUCT_TYPE_COLOR[cat] ?? '#666',
                color: '#fff',
              }),
            }}
          />
        ))}
      </Box>

      {/* Product Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Product Code</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Product Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Product Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Base Price</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {productRows.map((row) => (
              <TableRow
                key={row.id}
                hover
                selected={selectedProductId === row.id}
                sx={{ cursor: 'pointer' }}
                onClick={() => handleSelectProduct(row.id)}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500, fontSize: 12 }}>
                    {row.code}
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
                <TableCell>
                  <Chip
                    label={row.productType}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      fontSize: 11,
                      bgcolor: `${PRODUCT_TYPE_COLOR[row.productType] ?? '#666'}15`,
                      color: PRODUCT_TYPE_COLOR[row.productType] ?? '#666',
                      border: `1px solid ${PRODUCT_TYPE_COLOR[row.productType] ?? '#666'}40`,
                    }}
                  />
                </TableCell>
                <TableCell align="right">
                  {row.basePrice != null ? (
                    <Typography variant="body2" fontWeight={600}>
                      ${row.basePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}/MT
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">—</Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ─── Product Drawer ─────────────────────────────────────────── */}
      <Drawer
        anchor="right"
        open={!!selectedProduct}
        onClose={() => setSelectedProductId(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 520 }, p: 0 } }}
      >
        {selectedProduct && (
          <Box sx={{ height: '100%', overflow: 'auto' }}>
            {/* Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                p: 2.5,
                pb: 1.5,
                position: 'sticky',
                top: 0,
                bgcolor: 'background.paper',
                zIndex: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                  {selectedProduct.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    {selectedProduct.code}
                  </Typography>
                  <Chip
                    label={selectedProduct.productType}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      fontSize: 10,
                      height: 20,
                      bgcolor: `${PRODUCT_TYPE_COLOR[selectedProduct.productType] ?? '#666'}15`,
                      color: PRODUCT_TYPE_COLOR[selectedProduct.productType] ?? '#666',
                    }}
                  />
                </Box>
              </Box>
              <IconButton onClick={() => setSelectedProductId(null)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>

            <Box sx={{ p: 2.5, pt: 2 }}>
              {/* ─── Mini MSP Chart ─────────────────────────────────── */}
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                MSP Trend (6 months)
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5, mb: 3 }}>
                <MiniMSPChart productId={selectedProduct.id} />
              </Paper>

              {/* ─── Base Price ─────────────────────────────────────── */}
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Base Price
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                {selectedBP ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {editingBP ? (
                      <>
                        <TextField
                          size="small"
                          value={editBPValue}
                          onChange={(e) => setEditBPValue(e.target.value)}
                          type="number"
                          sx={{ width: 140 }}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveBP();
                            if (e.key === 'Escape') setEditingBP(false);
                          }}
                          slotProps={{
                            input: {
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                              endAdornment: <InputAdornment position="end">/MT</InputAdornment>,
                            },
                          }}
                        />
                        <IconButton size="small" color="primary" onClick={handleSaveBP}>
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setEditingBP(false)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <Typography variant="h5" fontWeight={700}>
                          ${selectedBP.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}/MT
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Effective {selectedBP.effectiveFrom}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditBPValue(String(selectedBP.price));
                            setEditingBP(true);
                          }}
                          sx={{ ml: 'auto' }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </Box>
                ) : (
                  <Typography color="text.secondary" variant="body2">
                    No base price set for this product.
                  </Typography>
                )}
              </Paper>

              {/* ─── Adjustment Rules ──────────────────────────────── */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Adjustment Rules
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => openRuleDialog()}
                  sx={{ fontSize: 12 }}
                >
                  Add Rule
                </Button>
              </Box>

              {selectedRules.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 2, mb: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No rules configured.
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                  {selectedRules.filter((r) => r.active).map((rule) => {
                    const isGlobal = !rule.productId;
                    return (
                      <Paper
                        key={rule.id}
                        variant="outlined"
                        sx={{
                          px: 2,
                          py: 1.25,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          '&:hover .rule-actions': { opacity: 1 },
                        }}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Typography variant="body2" fontWeight={500} sx={{ fontSize: 13 }} noWrap>
                              {rule.name}
                            </Typography>
                            {isGlobal && (
                              <Chip
                                label="Global"
                                size="small"
                                sx={{ height: 18, fontSize: 9, fontWeight: 600, bgcolor: '#F1F5F9', color: '#64748B' }}
                              />
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                            {formatCondition(rule)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1.5, flexShrink: 0 }}>
                          <Chip
                            label={formatAdjustment(rule)}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: 12,
                              height: 24,
                              bgcolor: rule.adjustmentValue < 0 ? '#FEE2E2' : '#D1FAE5',
                              color: rule.adjustmentValue < 0 ? '#DC2626' : '#059669',
                            }}
                          />
                          <Box
                            className="rule-actions"
                            sx={{ opacity: 0, transition: 'opacity 0.15s', display: 'flex', gap: 0.25 }}
                          >
                            <IconButton size="small" onClick={() => openRuleDialog(rule)} sx={{ p: 0.5 }}>
                              <EditIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                            {!isGlobal && (
                              <IconButton
                                size="small"
                                onClick={() => {
                                  deleteRule(rule.id);
                                  setSnackbar({ open: true, message: 'Rule deleted', severity: 'info' });
                                }}
                                sx={{ p: 0.5 }}
                              >
                                <DeleteIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            )}
                          </Box>
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              )}

              {/* ─── Customer Overrides ─────────────────────────────── */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Customer Overrides
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={openOverrideDialog}
                  sx={{ fontSize: 12 }}
                >
                  Add Override
                </Button>
              </Box>

              {selectedOverrides.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No customer overrides for this product.
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                  {selectedOverrides.map((o) => (
                    <Paper
                      key={o.id}
                      variant="outlined"
                      sx={{
                        px: 2,
                        py: 1.25,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        '&:hover .ovr-actions': { opacity: 1 },
                      }}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" fontWeight={500} sx={{ fontSize: 13 }} noWrap>
                          {o.customerName}
                        </Typography>
                        {o.note && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }} noWrap>
                            {o.note}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1.5, flexShrink: 0 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ fontSize: 13 }}>
                          ${o.overridePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </Typography>
                        <Box
                          className="ovr-actions"
                          sx={{ opacity: 0, transition: 'opacity 0.15s' }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => {
                              deleteOverride(o.id);
                              setSnackbar({ open: true, message: 'Override removed', severity: 'info' });
                            }}
                            sx={{ p: 0.5 }}
                          >
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Drawer>

      {/* ─── Rule Dialog ─────────────────────────────────────────────── */}
      <Dialog open={ruleDialogOpen} onClose={() => setRuleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRule ? 'Edit Rule' : 'Add Adjustment Rule'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Rule Name" value={ruleName} onChange={(e) => setRuleName(e.target.value)} size="small" fullWidth />
          <FormControl size="small" fullWidth>
            <InputLabel>Trigger</InputLabel>
            <Select value={ruleTrigger} label="Trigger" onChange={(e) => setRuleTrigger(e.target.value as AdjustmentTrigger)}>
              <MenuItem value="volume">Volume</MenuItem>
              <MenuItem value="customer_tier">Customer Tier</MenuItem>
              <MenuItem value="incoterms">Incoterms</MenuItem>
              <MenuItem value="payment_terms">Payment Terms</MenuItem>
              <MenuItem value="product_type">Product Type</MenuItem>
            </Select>
          </FormControl>
          <TextField label={conditionLabel()} value={ruleConditionValue} onChange={(e) => setRuleConditionValue(e.target.value)} size="small" fullWidth />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>Type</InputLabel>
              <Select value={ruleAdjType} label="Type" onChange={(e) => setRuleAdjType(e.target.value as AdjustmentType)}>
                <MenuItem value="percentage">Percentage (%)</MenuItem>
                <MenuItem value="fixed">Fixed ($/MT)</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Value" value={ruleAdjValue} onChange={(e) => setRuleAdjValue(e.target.value)} size="small" type="number" sx={{ flex: 1 }} />
          </Box>
          <TextField label="Priority" value={rulePriority} onChange={(e) => setRulePriority(e.target.value)} size="small" type="number" helperText="Lower = applied first" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRuleDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveRule} disabled={!ruleName || !ruleAdjValue}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Override Dialog ─────────────────────────────────────────── */}
      <Dialog open={overrideDialogOpen} onClose={() => setOverrideDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Customer Override</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <Autocomplete
            options={customers}
            getOptionLabel={(c) => c.name}
            value={customers.find((c) => c.id === ovrCustomerId) ?? null}
            onChange={(_, v) => setOvrCustomerId(v?.id ?? '')}
            renderInput={(params) => <TextField {...params} label="Customer" size="small" />}
            size="small"
          />
          <TextField label="Override Price ($/MT)" value={ovrPrice} onChange={(e) => setOvrPrice(e.target.value)} size="small" type="number" />
          <TextField label="Note" value={ovrNote} onChange={(e) => setOvrNote(e.target.value)} size="small" multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOverrideDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveOverride} disabled={!ovrCustomerId || !ovrPrice}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
