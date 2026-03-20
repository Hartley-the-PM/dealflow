'use client';

import { useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from '@mui/material/Autocomplete';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import BlockIcon from '@mui/icons-material/Block';
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { ProductsModule, ProductsModuleEntry } from '@/types/offerBuilder';
import type { PricingResult, GuardrailViolation } from '@/types/pricingEngine';
import type { Currency, Incoterms, BelowMSPReason } from '@/types/offer';
import { usePricingStore } from '@/stores/pricingStore';
import { usePricingEngineStore } from '@/stores/pricingEngineStore';
import { checkGuardrails } from '@/lib/pricingEngine';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

interface Product {
  id: string;
  name: string;
  code: string;
  legacyName?: string;
  category?: string;
}

export interface PricingContext {
  customerId: string;
  incoterms: Incoterms;
  paymentTerms: string;
  currency: Currency;
  computePrice: (productId: string, qty: number, customerId: string, incoterms: Incoterms, paymentTerms: string) => PricingResult;
  allProducts: Product[];
}

interface Props {
  module: ProductsModule;
  onChange: (updated: ProductsModule) => void;
  pricingContext?: PricingContext;
}

const BELOW_MSP_REASONS: BelowMSPReason[] = [
  'Volume commitment',
  'Strategic account',
  'Market conditions',
  'Competitive pressure',
  'Other',
];

export default function ProductsModuleEditor({ module, onChange, pricingContext }: Props) {
  const getMSPForProduct = usePricingStore((s) => s.getMSPForProduct);
  const guardrails = usePricingEngineStore((s) => s.guardrails);
  const currentMonth = format(new Date(), 'yyyy-MM');

  const addEntry = useCallback(() => {
    const entry: ProductsModuleEntry = {
      id: uuidv4(),
      productId: '',
      quantity: null,
      unit: 'MT',
      pricePerUnit: 0,
      description: '',
      imageUrl: '',
    };
    onChange({ ...module, entries: [...module.entries, entry] });
  }, [module, onChange]);

  const removeEntry = useCallback((entryId: string) => {
    onChange({ ...module, entries: module.entries.filter((e) => e.id !== entryId) });
  }, [module, onChange]);

  const updateEntry = useCallback((entryId: string, updates: Partial<ProductsModuleEntry>) => {
    onChange({
      ...module,
      entries: module.entries.map((e) => (e.id === entryId ? { ...e, ...updates } : e)),
    });
  }, [module, onChange]);

  const handleProductSelect = useCallback((entryId: string, product: Product | null) => {
    if (!product) {
      updateEntry(entryId, { productId: '' });
      return;
    }
    const entry = module.entries.find((e) => e.id === entryId);
    let price = entry?.pricePerUnit ?? 0;
    if (pricingContext) {
      try {
        const qty = entry?.quantity ?? 50;
        const result = pricingContext.computePrice(
          product.id, qty, pricingContext.customerId, pricingContext.incoterms, pricingContext.paymentTerms
        );
        if (result.finalPrice > 0) {
          price = result.finalPrice;
        }
      } catch {
        // keep existing price
      }
    }
    updateEntry(entryId, { productId: product.id, pricePerUnit: price });
  }, [module.entries, pricingContext, updateEntry]);

  const toggle = (field: 'showQuantity' | 'showUnit' | 'showUnitPrice' | 'showTotal') => {
    onChange({ ...module, [field]: !module[field] });
  };

  const allProducts = pricingContext?.allProducts ?? [];

  // Summary calculations
  const summary = useMemo(() => {
    let totalValue = 0;
    let belowMSPCount = 0;
    const margins: number[] = [];

    module.entries.forEach((entry) => {
      if (entry.quantity && entry.pricePerUnit > 0) {
        totalValue += entry.pricePerUnit * entry.quantity;
      }
      if (entry.productId && entry.pricePerUnit > 0) {
        const mspEntry = getMSPForProduct(entry.productId, currentMonth);
        if (mspEntry) {
          if (entry.pricePerUnit < mspEntry.price) belowMSPCount++;
          margins.push(((entry.pricePerUnit - mspEntry.price) / entry.pricePerUnit) * 100);
        }
      }
    });

    const avgMargin = margins.length > 0 ? margins.reduce((a, b) => a + b, 0) / margins.length : null;
    return { totalValue, avgMargin, belowMSPCount, lineCount: module.entries.length };
  }, [module.entries, getMSPForProduct, currentMonth]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Products & Pricing
      </Typography>

      {/* Summary bar */}
      {module.entries.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Lines</Typography>
            <Typography variant="body2" fontWeight={600}>{summary.lineCount}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Est. Total</Typography>
            <Typography variant="body2" fontWeight={600}>
              {summary.totalValue > 0 ? `${pricingContext?.currency ?? 'USD'} ${summary.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '\u2014'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Avg Margin</Typography>
            <Typography variant="body2" fontWeight={600} sx={{ color: summary.avgMargin !== null ? (summary.avgMargin >= 0 ? 'success.main' : 'error.main') : 'text.primary' }}>
              {summary.avgMargin !== null ? `${summary.avgMargin.toFixed(1)}%` : '\u2014'}
            </Typography>
          </Box>
          {summary.belowMSPCount > 0 && (
            <Chip
              icon={<WarningAmberIcon sx={{ fontSize: 14 }} />}
              label={`${summary.belowMSPCount} below MSP`}
              size="small"
              color="warning"
              sx={{ height: 24, fontSize: '0.7rem' }}
            />
          )}
        </Box>
      )}

      {/* Column visibility toggles */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        <FormControlLabel control={<Switch checked={module.showQuantity} onChange={() => toggle('showQuantity')} size="small" />} label="Qty" />
        <FormControlLabel control={<Switch checked={module.showUnit} onChange={() => toggle('showUnit')} size="small" />} label="Unit" />
        <FormControlLabel control={<Switch checked={module.showUnitPrice} onChange={() => toggle('showUnitPrice')} size="small" />} label="Price/Unit" />
        <FormControlLabel control={<Switch checked={module.showTotal} onChange={() => toggle('showTotal')} size="small" />} label="Total" />
      </Box>

      {/* Add Product button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button size="small" startIcon={<AddIcon />} onClick={addEntry}>
          Add Product
        </Button>
      </Box>

      {/* Product entries */}
      {module.entries.map((entry) => (
        <ProductEntryCard
          key={entry.id}
          entry={entry}
          allProducts={allProducts}
          pricingContext={pricingContext}
          getMSPForProduct={getMSPForProduct}
          currentMonth={currentMonth}
          guardrails={guardrails}
          onUpdate={updateEntry}
          onRemove={removeEntry}
          onSelectProduct={handleProductSelect}
        />
      ))}

      {module.entries.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No products yet. Click &quot;Add Product&quot; to start.
        </Typography>
      )}
    </Box>
  );
}

// --- Product Entry Card (with full pricing intelligence) ---

interface ProductEntryCardProps {
  entry: ProductsModuleEntry;
  allProducts: Product[];
  pricingContext?: PricingContext;
  getMSPForProduct: (productId: string, month: string) => { price: number } | undefined;
  currentMonth: string;
  guardrails: import('@/types/pricingEngine').Guardrail[];
  onUpdate: (entryId: string, updates: Partial<ProductsModuleEntry>) => void;
  onRemove: (entryId: string) => void;
  onSelectProduct: (entryId: string, product: Product | null) => void;
}

function ProductEntryCard({
  entry,
  allProducts,
  pricingContext,
  getMSPForProduct,
  currentMonth,
  guardrails,
  onUpdate,
  onRemove,
  onSelectProduct,
}: ProductEntryCardProps) {
  const selectedProduct = allProducts.find((p) => p.id === entry.productId) ?? null;

  // MSP
  const mspEntry = entry.productId ? getMSPForProduct(entry.productId, currentMonth) : undefined;
  const mspPrice = mspEntry?.price ?? null;

  // Margin
  const margin = useMemo(() => {
    if (!mspPrice || entry.pricePerUnit <= 0) return null;
    const abs = entry.pricePerUnit - mspPrice;
    const pct = (abs / entry.pricePerUnit) * 100;
    return { abs, pct };
  }, [mspPrice, entry.pricePerUnit]);

  const belowMSP = mspPrice !== null && entry.pricePerUnit > 0 && entry.pricePerUnit < mspPrice;

  // Recommended price
  const recommended = useMemo((): PricingResult | null => {
    if (!pricingContext || !entry.productId) return null;
    try {
      const qty = entry.quantity ?? 50;
      return pricingContext.computePrice(
        entry.productId, qty, pricingContext.customerId, pricingContext.incoterms, pricingContext.paymentTerms
      );
    } catch {
      return null;
    }
  }, [pricingContext, entry.productId, entry.quantity]);

  const isUsingRecommended = recommended && recommended.finalPrice > 0 && Math.abs(entry.pricePerUnit - recommended.finalPrice) < 0.01;

  // Guardrail violations
  const violations = useMemo((): GuardrailViolation[] => {
    if (!recommended || entry.pricePerUnit <= 0) return [];
    const active = guardrails.filter((g) => g.active);
    return checkGuardrails(entry.pricePerUnit, recommended.basePrice, recommended.cost, recommended.msp, active);
  }, [recommended, entry.pricePerUnit, guardrails]);

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: belowMSP ? 'warning.main' : undefined,
        borderWidth: belowMSP ? 2 : 1,
      }}
    >
      <CardContent sx={{ pb: '12px !important', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {selectedProduct ? `${selectedProduct.name} (${selectedProduct.code})` : 'New Product'}
          </Typography>
          <IconButton size="small" color="error" onClick={() => onRemove(entry.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Product dropdown */}
        <Autocomplete
          size="small"
          options={allProducts}
          value={selectedProduct}
          onChange={(_, newValue) => onSelectProduct(entry.id, newValue)}
          getOptionLabel={(option) => `${option.name}${option.legacyName ? ` (${option.legacyName})` : ''} - ${option.code}`}
          filterOptions={(options, { inputValue }) => {
            const lower = inputValue.toLowerCase();
            return options.filter(
              (o) =>
                o.name.toLowerCase().includes(lower) ||
                (o.legacyName?.toLowerCase().includes(lower) ?? false) ||
                o.code.toLowerCase().includes(lower)
            );
          }}
          renderInput={(params) => (
            <TextField {...params} label="Product" placeholder="Search catalog..." />
          )}
          isOptionEqualToValue={(option, value) => option.id === value.id}
        />

        <Grid container spacing={1.5}>
          <Grid size={{ xs: 4 }}>
            <TextField
              size="small"
              fullWidth
              label="Quantity"
              type="number"
              value={entry.quantity ?? ''}
              onChange={(e) => onUpdate(entry.id, {
                quantity: e.target.value === '' ? null : parseFloat(e.target.value),
              })}
              inputProps={{ min: 0, step: 'any' }}
            />
          </Grid>
          <Grid size={{ xs: 3 }}>
            <TextField
              select
              size="small"
              fullWidth
              label="Unit"
              value={entry.unit}
              onChange={(e) => onUpdate(entry.id, { unit: e.target.value as 'MT' | 'KG' })}
            >
              <MenuItem value="MT">MT</MenuItem>
              <MenuItem value="KG">KG</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 5 }}>
            <TextField
              size="small"
              fullWidth
              label="Price/Unit"
              type="number"
              value={entry.pricePerUnit || ''}
              onChange={(e) => onUpdate(entry.id, {
                pricePerUnit: parseFloat(e.target.value) || 0,
              })}
              inputProps={{ min: 0, step: 'any' }}
            />
          </Grid>
        </Grid>

        {/* MSP + Margin row (matching classic) */}
        {entry.productId && (
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', px: 0.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>MSP</Typography>
              <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8rem' }}>
                {mspPrice !== null
                  ? mspPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : '\u2014'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Margin</Typography>
              {margin !== null ? (
                <Typography
                  variant="body2"
                  fontWeight={500}
                  sx={{ color: margin.pct >= 0 ? 'success.main' : 'error.main', fontSize: '0.8rem' }}
                >
                  {margin.abs >= 0 ? '+' : ''}
                  {margin.abs.toFixed(2)} ({margin.pct.toFixed(1)}%)
                </Typography>
              ) : (
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{'\u2014'}</Typography>
              )}
            </Box>
            {entry.quantity !== null && entry.pricePerUnit > 0 && (
              <Box sx={{ ml: 'auto' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Line Total</Typography>
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                  {pricingContext?.currency ?? 'USD'} {(entry.pricePerUnit * entry.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Recommended Price (matching classic) */}
        {recommended && recommended.finalPrice > 0 && (
          <Box
            sx={{
              p: 1.5,
              bgcolor: isUsingRecommended ? '#F0FDF4' : '#F8FAFC',
              borderRadius: 1,
              border: '1px solid',
              borderColor: isUsingRecommended ? '#BBF7D0' : '#E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoFixHighIcon sx={{ fontSize: 16, color: isUsingRecommended ? '#059669' : '#6366F1' }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Price Book Recommended
                </Typography>
                <Typography variant="body2" fontWeight={700} color={isUsingRecommended ? 'success.main' : 'primary'}>
                  ${recommended.finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}/{entry.unit}
                </Typography>
              </Box>
              {recommended.hasOverride && (
                <Chip label="Customer Override" size="small" sx={{ height: 18, fontSize: 10, fontWeight: 600, bgcolor: '#DBEAFE', color: '#1D4ED8' }} />
              )}
              {recommended.adjustments.length > 0 && !recommended.hasOverride && (
                <Tooltip
                  title={
                    <Box>
                      <Typography variant="caption">Base: ${recommended.basePrice.toLocaleString()}/MT</Typography>
                      {recommended.adjustments.map((adj, j) => (
                        <Typography key={j} variant="caption" display="block">
                          {adj.ruleName}: {adj.impact > 0 ? '+' : ''}{adj.adjustmentType === 'percentage' ? `${adj.adjustmentValue}%` : `$${adj.impact}`}
                        </Typography>
                      ))}
                    </Box>
                  }
                >
                  <Chip
                    label={`${recommended.adjustments.length} rule${recommended.adjustments.length > 1 ? 's' : ''} applied`}
                    size="small"
                    sx={{ height: 18, fontSize: 10, fontWeight: 500, bgcolor: '#F1F5F9', color: '#64748B' }}
                  />
                </Tooltip>
              )}
            </Box>
            {isUsingRecommended ? (
              <Chip label="Using recommended" size="small" color="success" sx={{ height: 22, fontSize: 11, fontWeight: 600 }} />
            ) : (
              <Button
                size="small"
                variant="outlined"
                color="primary"
                sx={{ fontSize: 11, px: 1.5, py: 0.25, minHeight: 0 }}
                onClick={() => onUpdate(entry.id, { pricePerUnit: recommended.finalPrice })}
              >
                Use Price
              </Button>
            )}
          </Box>
        )}

        {/* Guardrail violations (matching classic) */}
        {violations.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {violations.map((v, j) => (
              <Alert
                key={j}
                severity={v.action === 'block' ? 'error' : 'warning'}
                icon={v.action === 'block' ? <BlockIcon fontSize="small" /> : v.action === 'require_approval' ? <GppMaybeIcon fontSize="small" /> : <WarningAmberIcon fontSize="small" />}
                sx={{ py: 0, '& .MuiAlert-message': { fontSize: 12 } }}
              >
                <strong>{v.guardrailName}</strong>
                {v.action === 'block' && ' — Blocked'}
                {v.action === 'require_approval' && ' — Requires Approval'}
                {' '}({v.actualValue.toFixed(1)}% vs {v.threshold}% threshold)
              </Alert>
            ))}
          </Box>
        )}

        {/* Below MSP warning + reason fields (matching classic) */}
        <Collapse in={belowMSP}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Alert severity="warning" icon={<WarningAmberIcon fontSize="small" />}>
              Price is below MSP. A reason is required.
            </Alert>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Below MSP Reason"
                  value={(entry as any).belowMSPReason ?? ''}
                  onChange={(e) => onUpdate(entry.id, { belowMSPReason: e.target.value } as any)}
                >
                  <MenuItem value="" disabled>Select a reason...</MenuItem>
                  {BELOW_MSP_REASONS.map((r) => (
                    <MenuItem key={r} value={r}>{r}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Note"
                  value={(entry as any).belowMSPNote ?? ''}
                  onChange={(e) => onUpdate(entry.id, { belowMSPNote: e.target.value } as any)}
                  placeholder="Explain..."
                />
              </Grid>
            </Grid>
          </Box>
        </Collapse>

        {/* Description + Image (collapsed, not prominent) */}
        <TextField
          size="small"
          fullWidth
          label="Description (optional)"
          value={entry.description}
          onChange={(e) => onUpdate(entry.id, { description: e.target.value })}
          placeholder="Concise product description for showcase..."
          sx={{ '& .MuiInputBase-root': { fontSize: '0.8rem' } }}
        />
      </CardContent>
    </Card>
  );
}
