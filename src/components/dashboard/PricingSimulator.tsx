'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Autocomplete from '@mui/material/Autocomplete';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import CalculateIcon from '@mui/icons-material/Calculate';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import BlockIcon from '@mui/icons-material/Block';
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useProductStore } from '@/stores/productStore';
import { useCustomerStore } from '@/stores/customerStore';
import { usePricingEngine } from '@/hooks/usePricingEngine';
import type { Incoterms } from '@/types/offer';
import type { PricingResult, GuardrailAction } from '@/types/pricingEngine';

const ACTION_ICONS: Record<GuardrailAction, React.ReactNode> = {
  warn: <WarningIcon sx={{ fontSize: 14, color: '#B45309' }} />,
  block: <BlockIcon sx={{ fontSize: 14, color: '#DC2626' }} />,
  require_approval: <GppMaybeIcon sx={{ fontSize: 14, color: '#EA580C' }} />,
};

const ACTION_COLORS: Record<GuardrailAction, { color: string; bg: string }> = {
  warn: { color: '#B45309', bg: '#FEF3C7' },
  block: { color: '#DC2626', bg: '#FEE2E2' },
  require_approval: { color: '#EA580C', bg: '#FFF7ED' },
};

export default function PricingSimulator() {
  const products = useProductStore((s) => s.products);
  const customers = useCustomerStore((s) => s.customers);
  const { computePrice } = usePricingEngine();

  const [productId, setProductId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [quantity, setQuantity] = useState('50');
  const [incoterms, setIncoterms] = useState<Incoterms>('FCA');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [result, setResult] = useState<PricingResult | null>(null);

  const handleCalculate = () => {
    if (!productId || !customerId) return;
    const r = computePrice(productId, parseFloat(quantity) || 50, customerId, incoterms, paymentTerms);
    setResult(r);
  };

  const marginColor = (margin: number | null) => {
    if (margin == null) return 'text.secondary';
    if (margin >= 20) return '#059669';
    if (margin >= 10) return '#B45309';
    return '#DC2626';
  };

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CalculateIcon color="primary" />
          <Typography variant="h6" fontWeight={600} fontSize="1rem">
            Pricing Simulator
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Autocomplete
            options={products}
            getOptionLabel={(p) => `${p.name} (${p.code})`}
            value={products.find((p) => p.id === productId) ?? null}
            onChange={(_, v) => { setProductId(v?.id ?? ''); setResult(null); }}
            renderInput={(params) => <TextField {...params} label="Product" size="small" />}
            size="small"
          />
          <Autocomplete
            options={customers}
            getOptionLabel={(c) => `${c.name} (Tier ${c.tier})`}
            value={customers.find((c) => c.id === customerId) ?? null}
            onChange={(_, v) => { setCustomerId(v?.id ?? ''); setResult(null); }}
            renderInput={(params) => <TextField {...params} label="Customer" size="small" />}
            size="small"
          />
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              label="Qty (MT)"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              size="small"
              type="number"
              sx={{ flex: 1 }}
            />
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>Incoterms</InputLabel>
              <Select value={incoterms} label="Incoterms" onChange={(e) => setIncoterms(e.target.value as Incoterms)}>
                {['FCA', 'FOB', 'CIF', 'CFR', 'EXW', 'DAP', 'DDP'].map((i) => (
                  <MenuItem key={i} value={i}>{i}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <FormControl size="small" fullWidth>
            <InputLabel>Payment Terms</InputLabel>
            <Select value={paymentTerms} label="Payment Terms" onChange={(e) => setPaymentTerms(e.target.value)}>
              {['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90'].map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={handleCalculate}
            disabled={!productId || !customerId}
            fullWidth
            size="small"
          >
            Calculate Price
          </Button>
        </Box>

        {result && (
          <>
            <Divider sx={{ my: 2 }} />

            {/* Price breakdown */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Base Price</Typography>
                <Typography variant="body2" fontWeight={600}>${result.basePrice.toLocaleString()}/MT</Typography>
              </Box>

              {result.hasOverride && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Customer Override</Typography>
                  <Chip label={`$${result.overridePrice?.toLocaleString()}/MT`} size="small" color="info" sx={{ fontWeight: 600 }} />
                </Box>
              )}

              {result.adjustments.map((adj, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ArrowForwardIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">{adj.ruleName}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: adj.impact < 0 ? '#DC2626' : '#059669', fontWeight: 500 }}>
                    {adj.impact > 0 ? '+' : ''}{adj.adjustmentType === 'percentage' ? `${adj.adjustmentValue}%` : `$${adj.impact}`}
                  </Typography>
                </Box>
              ))}

              <Divider sx={{ my: 1 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" fontWeight={700}>Final Price</Typography>
                <Typography variant="body2" fontWeight={700} color="primary">
                  ${result.finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}/MT
                </Typography>
              </Box>

              {/* Margin bars */}
              <Box sx={{ mt: 1.5 }}>
                {result.marginVsCost != null && (
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">Margin vs Cost</Typography>
                      <Typography variant="caption" fontWeight={600} sx={{ color: marginColor(result.marginVsCost) }}>
                        {result.marginVsCost.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(Math.max(result.marginVsCost, 0), 50) * 2}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: '#F3F4F6',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: marginColor(result.marginVsCost),
                          borderRadius: 3,
                        },
                      }}
                    />
                  </Box>
                )}
                {result.marginVsMSP != null && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">Margin vs MSP</Typography>
                      <Typography variant="caption" fontWeight={600} sx={{ color: marginColor(result.marginVsMSP) }}>
                        {result.marginVsMSP.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(Math.max(result.marginVsMSP + 20, 0), 50) * 2}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: '#F3F4F6',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: marginColor(result.marginVsMSP),
                          borderRadius: 3,
                        },
                      }}
                    />
                  </Box>
                )}
              </Box>

              {/* Guardrail status */}
              <Box sx={{ mt: 1.5 }}>
                {result.guardrailViolations.length === 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircleIcon sx={{ fontSize: 16, color: '#059669' }} />
                    <Typography variant="caption" color="#059669" fontWeight={600}>All guardrails passed</Typography>
                  </Box>
                ) : (
                  result.guardrailViolations.map((v, i) => {
                    const cfg = ACTION_COLORS[v.action];
                    return (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        {ACTION_ICONS[v.action]}
                        <Typography variant="caption" sx={{ color: cfg.color, fontWeight: 500 }}>
                          {v.guardrailName} ({v.actualValue.toFixed(1)}% vs {v.threshold}%)
                        </Typography>
                      </Box>
                    );
                  })
                )}
              </Box>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
