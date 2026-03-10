'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import BlockIcon from '@mui/icons-material/Block';
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PersonIcon from '@mui/icons-material/Person';
import { usePricingEngine } from '@/hooks/usePricingEngine';
import { useProductStore } from '@/stores/productStore';
import { usePricingStore } from '@/stores/pricingStore';
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

interface PricingPanelLine {
  id: string;
  productId: string;
  quantity: string;
  pricePerUnit: string;
}

interface PricingPanelProps {
  lines: PricingPanelLine[];
  customerId: string;
  incoterms: Incoterms;
  paymentTerms: string;
  onApplyPrice: (lineId: string, price: number) => void;
}

interface LineResult {
  lineId: string;
  productId: string;
  productName: string;
  result: PricingResult;
  currentPrice: number;
  mspHistory: { month: string; price: number }[];
}

export default function PricingPanel({
  lines,
  customerId,
  incoterms,
  paymentTerms,
  onApplyPrice,
}: PricingPanelProps) {
  const { computePrice } = usePricingEngine();
  const products = useProductStore((s) => s.products);
  const mspEntries = usePricingStore((s) => s.entries);

  const lineResults: LineResult[] = useMemo(() => {
    return lines
      .filter((l) => l.productId && customerId)
      .map((line) => {
        const product = products.find((p) => p.id === line.productId);
        const qty = parseFloat(line.quantity) || 50;
        const result = computePrice(line.productId, qty, customerId, incoterms, paymentTerms);
        const history = mspEntries
          .filter((e) => e.productId === line.productId)
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-3)
          .map((e) => ({ month: e.month, price: e.price }));

        return {
          lineId: line.id,
          productId: line.productId,
          productName: product?.name ?? 'Unknown',
          result,
          currentPrice: parseFloat(line.pricePerUnit) || 0,
          mspHistory: history,
        };
      });
  }, [lines, customerId, incoterms, paymentTerms, computePrice, products, mspEntries]);

  if (lineResults.length === 0) {
    return (
      <Card variant="outlined" sx={{ position: 'sticky', top: 24 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AutoFixHighIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2" fontWeight={600}>Pricing Intelligence</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Add product lines to see pricing recommendations.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ position: 'sticky', top: 24 }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <AutoFixHighIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={600}>Pricing Intelligence</Typography>
        </Box>

        {lineResults.map((lr, i) => {
          const priceDiff = lr.currentPrice > 0 ? lr.currentPrice - lr.result.finalPrice : 0;
          const marginColor = (m: number | null) => {
            if (m == null) return '#6B7280';
            if (m >= 20) return '#059669';
            if (m >= 10) return '#B45309';
            return '#DC2626';
          };

          return (
            <Box key={lr.lineId}>
              {i > 0 && <Divider sx={{ my: 1.5 }} />}
              <Typography variant="caption" fontWeight={600} color="text.secondary" noWrap>
                {lr.productName}
              </Typography>

              {/* Suggested price */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Suggested
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="primary">
                    ${lr.result.finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}/MT
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.65rem', px: 1, py: 0.25, minHeight: 0 }}
                  onClick={() => onApplyPrice(lr.lineId, lr.result.finalPrice)}
                >
                  Use Price
                </Button>
              </Box>

              {/* Override indicator */}
              {lr.result.hasOverride && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <PersonIcon sx={{ fontSize: 14, color: '#1D4ED8' }} />
                  <Typography variant="caption" color="#1D4ED8" fontWeight={500}>
                    Customer override: ${lr.result.overridePrice?.toLocaleString()}/MT
                  </Typography>
                </Box>
              )}

              {/* Price breakdown */}
              {lr.result.adjustments.length > 0 && (
                <Box sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    Base: ${lr.result.basePrice.toLocaleString()}
                  </Typography>
                  {lr.result.adjustments.map((adj, j) => (
                    <Box key={j} sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                      <ArrowForwardIcon sx={{ fontSize: 10, color: 'text.secondary' }} />
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: adj.impact < 0 ? '#DC2626' : '#059669' }}>
                        {adj.ruleName}: {adj.impact > 0 ? '+' : ''}{adj.adjustmentType === 'percentage' ? `${adj.adjustmentValue}%` : `$${adj.impact}`}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Margins */}
              <Box sx={{ mt: 1 }}>
                {lr.result.marginVsCost != null && (
                  <Box sx={{ mb: 0.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>vs Cost</Typography>
                      <Typography variant="caption" fontWeight={600} sx={{ color: marginColor(lr.result.marginVsCost), fontSize: '0.65rem' }}>
                        {lr.result.marginVsCost.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(Math.max(lr.result.marginVsCost, 0), 50) * 2}
                      sx={{ height: 4, borderRadius: 2, bgcolor: '#F3F4F6', '& .MuiLinearProgress-bar': { bgcolor: marginColor(lr.result.marginVsCost), borderRadius: 2 } }}
                    />
                  </Box>
                )}
                {lr.result.marginVsMSP != null && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>vs MSP</Typography>
                      <Typography variant="caption" fontWeight={600} sx={{ color: marginColor(lr.result.marginVsMSP), fontSize: '0.65rem' }}>
                        {lr.result.marginVsMSP.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(Math.max(lr.result.marginVsMSP + 20, 0), 50) * 2}
                      sx={{ height: 4, borderRadius: 2, bgcolor: '#F3F4F6', '& .MuiLinearProgress-bar': { bgcolor: marginColor(lr.result.marginVsMSP), borderRadius: 2 } }}
                    />
                  </Box>
                )}
              </Box>

              {/* Guardrails */}
              <Box sx={{ mt: 0.5 }}>
                {lr.result.guardrailViolations.length === 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircleIcon sx={{ fontSize: 14, color: '#059669' }} />
                    <Typography variant="caption" color="#059669" fontWeight={500} sx={{ fontSize: '0.65rem' }}>
                      All guardrails OK
                    </Typography>
                  </Box>
                ) : (
                  lr.result.guardrailViolations.map((v, j) => {
                    const cfg = ACTION_COLORS[v.action];
                    return (
                      <Tooltip key={j} title={`${v.guardrailName}: ${v.actualValue.toFixed(1)}% vs threshold ${v.threshold}%`}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                          {ACTION_ICONS[v.action]}
                          <Typography variant="caption" sx={{ color: cfg.color, fontWeight: 500, fontSize: '0.65rem' }}>
                            {v.guardrailName}
                          </Typography>
                        </Box>
                      </Tooltip>
                    );
                  })
                )}
              </Box>

              {/* MSP History mini sparkline (just numbers) */}
              {lr.mspHistory.length > 0 && (
                <Box sx={{ mt: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUpIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                      MSP: {lr.mspHistory.map((h) => `${h.month.slice(5)}: $${h.price}`).join(' → ')}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          );
        })}
      </CardContent>
    </Card>
  );
}
