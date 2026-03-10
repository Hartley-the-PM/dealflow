'use client';

import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import { useDealStore } from '@/stores/dealStore';
import { useOfferStore } from '@/stores/offerStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useHydration } from '@/hooks/useHydration';
import type { DealStatus, Deal, Offer } from '@/types';
import PipelineDrawer from './PipelineDrawer';

interface StageConfig {
  status: DealStatus;
  label: string;
  color: string;
  bgLight: string;
}

const STAGES: StageConfig[] = [
  { status: 'Draft', label: 'Draft', color: '#6B7280', bgLight: '#F3F4F6' },
  { status: 'Active', label: 'Active', color: '#1D4ED8', bgLight: '#DBEAFE' },
  { status: 'Won', label: 'Won', color: '#059669', bgLight: '#D1FAE5' },
  { status: 'Lost', label: 'Lost', color: '#DC2626', bgLight: '#FEE2E2' },
  { status: 'Expired', label: 'Expired', color: '#9CA3AF', bgLight: '#F3F4F6' },
];

function calcDealMetrics(deal: Deal, offers: Offer[]) {
  const latestOffer = offers
    .filter((o) => o.dealId === deal.id)
    .sort((a, b) => b.version - a.version)[0];
  if (!latestOffer) return { revenue: 0, volume: 0 };
  let revenue = 0;
  let volume = 0;
  for (const line of latestOffer.lines) {
    const qty = line.quantity ?? 0;
    revenue += line.pricePerUnit * qty;
    volume += qty;
  }
  return { revenue, volume };
}

export default function PipelineFunnel() {
  const hydrated = useHydration();
  const deals = useDealStore((s) => s.deals);
  const offers = useOfferStore((s) => s.offers);
  const [selectedStage, setSelectedStage] = useState<DealStatus | null>(null);

  const stageData = useMemo(() => {
    return STAGES.map((stage) => {
      const stageDeals = deals.filter((d) => d.status === stage.status);
      let totalRevenue = 0;
      let totalVolume = 0;
      for (const deal of stageDeals) {
        const m = calcDealMetrics(deal, offers);
        totalRevenue += m.revenue;
        totalVolume += m.volume;
      }
      return {
        ...stage,
        count: stageDeals.length,
        revenue: totalRevenue,
        volume: totalVolume,
      };
    });
  }, [deals, offers]);

  const maxCount = Math.max(...stageData.map((s) => s.count), 1);

  if (!hydrated) {
    return <Skeleton variant="rounded" height={220} />;
  }

  return (
    <>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Deal Pipeline
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
          Click any stage to view deals and update statuses
        </Typography>

        {/* Funnel bars */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end', minHeight: 160 }}>
          {stageData.map((stage) => {
            const barHeight = Math.max((stage.count / maxCount) * 120, 24);
            const isSelected = selectedStage === stage.status;
            return (
              <Tooltip
                key={stage.status}
                title={
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" fontWeight={600}>{stage.label}</Typography>
                    <Typography variant="caption">
                      {stage.count} deal{stage.count !== 1 ? 's' : ''}
                    </Typography>
                    <br />
                    <Typography variant="caption">
                      ${stage.revenue.toLocaleString()} revenue
                    </Typography>
                    <br />
                    <Typography variant="caption">
                      {stage.volume.toLocaleString()} MT volume
                    </Typography>
                  </Box>
                }
                arrow
              >
                <Box
                  onClick={() => setSelectedStage(isSelected ? null : stage.status)}
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.15s',
                    '&:hover': { transform: 'translateY(-2px)' },
                  }}
                >
                  {/* Count label */}
                  <Typography
                    variant="h4"
                    fontWeight={700}
                    sx={{ color: stage.color, mb: 0.5 }}
                  >
                    {stage.count}
                  </Typography>

                  {/* Bar */}
                  <Box
                    sx={{
                      width: '100%',
                      height: barHeight,
                      bgcolor: isSelected ? stage.color : stage.bgLight,
                      border: `2px solid ${stage.color}`,
                      borderRadius: 1.5,
                      transition: 'all 0.2s',
                      position: 'relative',
                      overflow: 'hidden',
                      ...(isSelected && { boxShadow: `0 0 0 3px ${stage.color}33` }),
                    }}
                  />

                  {/* Label */}
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    sx={{ mt: 1, color: stage.color, textAlign: 'center' }}
                  >
                    {stage.label}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>

        {/* Revenue / Volume summary row */}
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            mt: 2,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          {stageData.map((stage) => (
            <Box
              key={stage.status}
              sx={{ flex: 1, textAlign: 'center' }}
            >
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{ color: stage.color, fontSize: '0.8rem' }}
              >
                ${stage.revenue >= 1000000
                  ? `${(stage.revenue / 1000000).toFixed(1)}M`
                  : stage.revenue >= 1000
                    ? `${(stage.revenue / 1000).toFixed(0)}K`
                    : stage.revenue.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {stage.volume.toLocaleString()} MT
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      <PipelineDrawer
        stage={selectedStage as any}
        onClose={() => setSelectedStage(null)}
      />
    </>
  );
}
