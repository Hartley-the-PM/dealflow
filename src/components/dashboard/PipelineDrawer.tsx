'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Tooltip from '@mui/material/Tooltip';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useDealStore } from '@/stores/dealStore';
import { useOfferStore } from '@/stores/offerStore';
import { useCustomerStore } from '@/stores/customerStore';
import { usePipelineStagesStore } from '@/stores/pipelineStagesStore';
import type { DealStatus, Deal, Offer } from '@/types';
import { classifyDeal } from './PipelineSankey';
import type { SankeyStage } from './PipelineSankey';

const DEAL_STATUSES: DealStatus[] = ['Draft', 'Active', 'Won', 'Lost', 'Expired'];

// Dynamic color lookup — built from pipeline stages store in the component
function getStageStyle(stage: string, pipelineStages: Array<{ name: string; color: string }>) {
  const found = pipelineStages.find((s) => s.name === stage);
  const color = found?.color || '#6B7280';
  // Create a light background from the color
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const bg = `rgba(${r},${g},${b},0.08)`;
  return { color, bg, label: stage };
}

const statusDotColors: Record<DealStatus, string> = {
  Draft: '#6B7280',
  Active: '#1D4ED8',
  Won: '#059669',
  Lost: '#DC2626',
  Expired: '#9CA3AF',
};

function getDealMetrics(deal: Deal, offers: Offer[]) {
  const latestOffer = offers
    .filter((o) => o.dealId === deal.id)
    .sort((a, b) => b.version - a.version)[0];
  if (!latestOffer) return { revenue: 0, volume: 0, offerStatus: null as string | null, productCount: 0 };
  let revenue = 0;
  let volume = 0;
  const productIds = new Set<string>();
  for (const line of latestOffer.lines) {
    const qty = line.quantity ?? 0;
    revenue += line.pricePerUnit * qty;
    volume += qty;
    productIds.add(line.productId);
  }
  return { revenue, volume, offerStatus: latestOffer.status, productCount: productIds.size };
}

interface PipelineDrawerProps {
  stage: SankeyStage | null;
  onClose: () => void;
}

export default function PipelineDrawer({ stage, onClose }: PipelineDrawerProps) {
  const router = useRouter();
  const deals = useDealStore((s) => s.deals);
  const updateDeal = useDealStore((s) => s.updateDeal);
  const offers = useOfferStore((s) => s.offers);
  const getCustomerById = useCustomerStore((s) => s.getCustomerById);
  const pipelineStages = usePipelineStagesStore((s) => s.stages);
  const progressionStages = useMemo(
    () => pipelineStages.filter((s) => s.type === 'progression').sort((a, b) => a.order - b.order),
    [pipelineStages]
  );

  const stageDeals = useMemo(() => {
    if (!stage) return [];
    return deals
      .filter((d) => classifyDeal(d, offers, progressionStages) === stage)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [deals, offers, stage, progressionStages]);

  const stageConfig = stage ? getStageStyle(stage, pipelineStages) : null;

  const totalRevenue = useMemo(() => {
    return stageDeals.reduce((sum, d) => sum + getDealMetrics(d, offers).revenue, 0);
  }, [stageDeals, offers]);

  const totalVolume = useMemo(() => {
    return stageDeals.reduce((sum, d) => sum + getDealMetrics(d, offers).volume, 0);
  }, [stageDeals, offers]);

  const allStageNames = useMemo(() => {
    const prog = progressionStages.map((s) => ({ name: s.name, color: s.color, isExit: false }));
    const exit = pipelineStages.filter((s) => s.type === 'exit').sort((a, b) => a.order - b.order).map((s) => ({ name: s.name, color: s.color, isExit: true }));
    return [...prog, ...exit];
  }, [progressionStages, pipelineStages]);

  // Derive DealStatus from pipeline stage
  const deriveStatus = (stageName: string): DealStatus => {
    const lastProgStage = progressionStages[progressionStages.length - 1];
    if (stageName === 'Lost' || stageName === 'Cancelled') return 'Lost';
    if (stageName === 'Expired') return 'Expired';
    if (lastProgStage && stageName === lastProgStage.name) return 'Won';
    return 'Active';
  };

  const handleStageChange = (dealId: string, newStage: string) => {
    const newStatus = deriveStatus(newStage);
    updateDeal(dealId, {
      pipelineStage: newStage,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    } as any);
  };

  return (
    <Drawer
      anchor="right"
      open={!!stage}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 440 },
          p: 0,
          mt: { xs: '56px', sm: '64px' },
          height: { xs: 'calc(100% - 56px)', sm: 'calc(100% - 64px)' },
        },
      }}
      slotProps={{
        backdrop: {
          sx: { top: { xs: '56px', sm: '64px' } },
        },
      }}
    >
      {stage && stageConfig && (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box
            sx={{
              p: 2.5,
              bgcolor: stageConfig.bg,
              borderBottom: `3px solid ${stageConfig.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: stageConfig.color }}>
                {stageConfig.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stageDeals.length} deal{stageDeals.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Summary row */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              px: 2.5,
              py: 1.5,
              bgcolor: 'grey.50',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography variant="body2" fontWeight={600}>
                ${totalRevenue.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Revenue
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography variant="body2" fontWeight={600}>
                {totalVolume.toLocaleString()} MT
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Volume
              </Typography>
            </Box>
          </Box>

          {/* Deal cards */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {stageDeals.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">No deals in this stage.</Typography>
              </Box>
            ) : (
              stageDeals.map((deal) => {
                const customer = getCustomerById(deal.customerId);
                const metrics = getDealMetrics(deal, offers);
                return (
                  <Card key={deal.id} variant="outlined" sx={{ '&:hover': { borderColor: stageConfig.color } }}>
                    <CardContent sx={{ pb: '12px !important' }}>
                      {/* Top row: name + open link */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" fontWeight={600} noWrap>
                            {deal.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {customer?.name ?? 'Unknown'}
                          </Typography>
                        </Box>
                        <Tooltip title="Open deal">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/deals/${deal.id}`);
                            }}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      {/* Metrics row */}
                      <Box sx={{ display: 'flex', gap: 1, my: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={`$${metrics.revenue.toLocaleString()}`}
                          size="small"
                          sx={{ fontSize: '0.7rem', fontWeight: 600, bgcolor: '#F0FDF4', color: '#059669' }}
                        />
                        <Chip
                          label={`${metrics.volume.toLocaleString()} MT`}
                          size="small"
                          sx={{ fontSize: '0.7rem', fontWeight: 600, bgcolor: '#EFF6FF', color: '#1D4ED8' }}
                        />
                        {metrics.offerStatus && (
                          <Chip
                            label={`Offer: ${metrics.offerStatus}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        )}
                        <Chip
                          label={`${metrics.productCount} product${metrics.productCount !== 1 ? 's' : ''}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Box>

                      {/* Pipeline stage selector */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                          Move to:
                        </Typography>
                        <Select
                          value={(deal as any).pipelineStage || 'Opportunity'}
                          onChange={(e) => handleStageChange(deal.id, e.target.value)}
                          size="small"
                          sx={{
                            fontSize: '0.75rem',
                            height: 28,
                            flex: 1,
                            '& .MuiSelect-select': { py: 0.5 },
                          }}
                        >
                          {allStageNames.map((s, idx) => (
                            <MenuItem
                              key={s.name}
                              value={s.name}
                              sx={{ fontSize: '0.8rem' }}
                              divider={!s.isExit && idx === progressionStages.length - 1}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
                                {s.name}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </Box>

                      {/* Footer */}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        Updated {new Date(deal.updatedAt).toLocaleDateString()} &middot; {deal.createdBy}
                      </Typography>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </Box>
        </Box>
      )}
    </Drawer>
  );
}
