'use client';

import { useState, useMemo, useEffect } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { useDealStore } from '@/stores/dealStore';
import { useOfferStore } from '@/stores/offerStore';
import { useOrderStore } from '@/stores/orderStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useHydration } from '@/hooks/useHydration';
import type { Deal, Offer, Order } from '@/types';
import PipelineDrawer from './PipelineDrawer';

export type SankeyStage = 'Opportunity' | 'Offer' | 'Order' | 'Lost' | 'Expired';

// --- Classification ---

export function classifyDeal(deal: Deal, offers: Offer[]): SankeyStage {
  if (deal.status === 'Lost') return 'Lost';
  if (deal.status === 'Expired') return 'Expired';
  if (deal.status === 'Won') return 'Order';
  const dealOffers = offers.filter((o) => o.dealId === deal.id);
  const hasAdvancedOffer = dealOffers.some((o) =>
    ['Sent', 'Pending', 'Approved'].includes(o.status)
  );
  if (hasAdvancedOffer) return 'Offer';
  return 'Opportunity';
}

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

// --- Stage Config ---

interface StageConfig {
  id: SankeyStage;
  label: string;
  color1: string;
  color2: string;
}

const STAGE_CONFIGS: StageConfig[] = [
  { id: 'Opportunity', label: 'Opportunity', color1: '#2E6DB4', color2: '#002855' },
  { id: 'Offer', label: 'Offer', color1: '#3B82F6', color2: '#1D4ED8' },
  { id: 'Order', label: 'Order', color1: '#10B981', color2: '#059669' },
  { id: 'Lost', label: 'Lost', color1: '#F87171', color2: '#DC2626' },
  { id: 'Expired', label: 'Expired', color1: '#9CA3AF', color2: '#6B7280' },
];

function getConfig(stage: SankeyStage) {
  return STAGE_CONFIGS.find((c) => c.id === stage)!;
}

// --- Layout ---

const VB_W = 960;
const VB_H = 520;
const NODE_W = 150;
const BRANCH_W = 130;
const MIN_H = 40;
const MAX_H = 170;

interface NodeLayout {
  stage: SankeyStage;
  x: number;
  y: number;
  w: number;
  h: number;
  throughput: number;
  currentCount: number;
  revenue: number;
  volume: number;
}

interface LinkLayout {
  id: string;
  source: SankeyStage;
  target: SankeyStage;
  path: string;
  gradientId: string;
  dealCount: number;
}

function computeLayout(
  stageCounts: Record<SankeyStage, { current: number; revenue: number; volume: number }>,
  totalDeals: number
) {
  // Throughput: cumulative deals that passed through or are in each stage
  const opportunityThroughput = totalDeals;
  const offerThroughput = totalDeals - stageCounts.Opportunity.current;
  const orderThroughput = stageCounts.Order.current;
  const lostThroughput = stageCounts.Lost.current;
  const expiredThroughput = stageCounts.Expired.current;

  function scaleH(throughput: number) {
    if (totalDeals === 0) return MIN_H;
    return Math.max(MIN_H, Math.min(MAX_H, MIN_H + (throughput / totalDeals) * (MAX_H - MIN_H)));
  }

  const oppH = scaleH(opportunityThroughput);
  const offH = scaleH(offerThroughput);
  const ordH = scaleH(orderThroughput);
  const lostH = scaleH(lostThroughput);
  const expH = scaleH(expiredThroughput);

  // Main flow centered vertically around y=160
  const mainCenterY = 155;

  const nodes: NodeLayout[] = [
    {
      stage: 'Opportunity', x: 40, y: mainCenterY - oppH / 2, w: NODE_W, h: oppH,
      throughput: opportunityThroughput,
      currentCount: stageCounts.Opportunity.current,
      revenue: stageCounts.Opportunity.revenue,
      volume: stageCounts.Opportunity.volume,
    },
    {
      stage: 'Offer', x: 310, y: mainCenterY - offH / 2, w: NODE_W, h: offH,
      throughput: offerThroughput,
      currentCount: stageCounts.Offer.current,
      revenue: stageCounts.Offer.revenue,
      volume: stageCounts.Offer.volume,
    },
    {
      stage: 'Order', x: 580, y: mainCenterY - ordH / 2, w: NODE_W, h: ordH,
      throughput: orderThroughput,
      currentCount: stageCounts.Order.current,
      revenue: stageCounts.Order.revenue,
      volume: stageCounts.Order.volume,
    },
    {
      stage: 'Lost', x: 530, y: 350, w: BRANCH_W, h: lostH,
      throughput: lostThroughput,
      currentCount: stageCounts.Lost.current,
      revenue: stageCounts.Lost.revenue,
      volume: stageCounts.Lost.volume,
    },
    {
      stage: 'Expired', x: 740, y: 350, w: BRANCH_W, h: expH,
      throughput: expiredThroughput,
      currentCount: stageCounts.Expired.current,
      revenue: stageCounts.Expired.revenue,
      volume: stageCounts.Expired.volume,
    },
  ];

  // Build links
  const links: LinkLayout[] = [];

  // Helper: horizontal flow band path
  function hFlowPath(
    sx: number, sy: number, sh: number,
    tx: number, ty: number, th: number
  ): string {
    const cpOff = (tx - sx) * 0.45;
    const sTop = sy - sh / 2;
    const sBot = sy + sh / 2;
    const tTop = ty - th / 2;
    const tBot = ty + th / 2;
    return [
      `M ${sx},${sTop}`,
      `C ${sx + cpOff},${sTop} ${tx - cpOff},${tTop} ${tx},${tTop}`,
      `L ${tx},${tBot}`,
      `C ${tx - cpOff},${tBot} ${sx + cpOff},${sBot} ${sx},${sBot}`,
      'Z',
    ].join(' ');
  }

  // Helper: branch-off path (curves downward from source right edge to target top edge)
  function branchPath(
    sx: number, sy: number, sh: number,
    tx: number, ty: number, tw: number, th: number
  ): string {
    const halfTw = tw / 2;
    const tcx = tx + halfTw; // target center x
    const cpX = sx + (tcx - sx) * 0.35;
    const cpY1 = sy + (ty - sy) * 0.25;
    const cpY2 = ty - (ty - sy) * 0.3;
    return [
      `M ${sx},${sy - sh / 2}`,
      `C ${cpX},${cpY1} ${tcx - halfTw * 0.6},${cpY2} ${tcx - halfTw},${ty}`,
      `L ${tcx + halfTw},${ty}`,
      `C ${tcx + halfTw * 0.6},${cpY2} ${cpX + 8},${cpY1 + 4} ${sx},${sy + sh / 2}`,
      'Z',
    ].join(' ');
  }

  // Link 1: Opportunity -> Offer
  const oppNode = nodes[0];
  const offNode = nodes[1];
  const oppToOffBandH = (offerThroughput / Math.max(opportunityThroughput, 1)) * oppH;
  links.push({
    id: 'opp-offer',
    source: 'Opportunity',
    target: 'Offer',
    path: hFlowPath(
      oppNode.x + oppNode.w, oppNode.y + oppNode.h / 2, oppToOffBandH,
      offNode.x, offNode.y + offNode.h / 2, offNode.h
    ),
    gradientId: 'grad-opp-offer',
    dealCount: offerThroughput,
  });

  // Link 2: Offer -> Order
  const ordNode = nodes[2];
  const offToOrdBandSrc = (orderThroughput / Math.max(offerThroughput, 1)) * offH;
  links.push({
    id: 'offer-order',
    source: 'Offer',
    target: 'Order',
    path: hFlowPath(
      offNode.x + offNode.w, offNode.y + offToOrdBandSrc / 2, offToOrdBandSrc,
      ordNode.x, ordNode.y + ordNode.h / 2, ordNode.h
    ),
    gradientId: 'grad-offer-order',
    dealCount: orderThroughput,
  });

  // Link 3: Offer -> Lost (branch downward)
  const lostNode = nodes[3];
  const lostBandH = (lostThroughput / Math.max(offerThroughput, 1)) * offH;
  const lostSourceY = offNode.y + offToOrdBandSrc + lostBandH / 2 + 4;
  if (lostThroughput > 0) {
    links.push({
      id: 'offer-lost',
      source: 'Offer',
      target: 'Lost',
      path: branchPath(
        offNode.x + offNode.w, lostSourceY, lostBandH,
        lostNode.x, lostNode.y, lostNode.w, lostNode.h
      ),
      gradientId: 'grad-offer-lost',
      dealCount: lostThroughput,
    });
  }

  // Link 4: Offer -> Expired (branch downward-right)
  const expNode = nodes[4];
  const expBandH = (expiredThroughput / Math.max(offerThroughput, 1)) * offH;
  const expSourceY = lostSourceY + lostBandH / 2 + expBandH / 2 + 4;
  if (expiredThroughput > 0) {
    links.push({
      id: 'offer-expired',
      source: 'Offer',
      target: 'Expired',
      path: branchPath(
        offNode.x + offNode.w, expSourceY, expBandH,
        expNode.x, expNode.y, expNode.w, expNode.h
      ),
      gradientId: 'grad-offer-expired',
      dealCount: expiredThroughput,
    });
  }

  return { nodes, links };
}

// --- Formatting ---

function fmtRevenue(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function fmtVolume(value: number): string {
  return `${value.toLocaleString()} MT`;
}

// --- Component ---

export default function PipelineSankey() {
  const hydrated = useHydration();
  const deals = useDealStore((s) => s.deals);
  const offers = useOfferStore((s) => s.offers);

  const [selectedStage, setSelectedStage] = useState<SankeyStage | null>(null);
  const [hoveredNode, setHoveredNode] = useState<SankeyStage | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Classify deals and compute metrics per stage
  const stageData = useMemo(() => {
    const counts: Record<SankeyStage, { current: number; revenue: number; volume: number }> = {
      Opportunity: { current: 0, revenue: 0, volume: 0 },
      Offer: { current: 0, revenue: 0, volume: 0 },
      Order: { current: 0, revenue: 0, volume: 0 },
      Lost: { current: 0, revenue: 0, volume: 0 },
      Expired: { current: 0, revenue: 0, volume: 0 },
    };
    for (const deal of deals) {
      const stage = classifyDeal(deal, offers);
      const m = calcDealMetrics(deal, offers);
      counts[stage].current += 1;
      counts[stage].revenue += m.revenue;
      counts[stage].volume += m.volume;
    }
    return counts;
  }, [deals, offers]);

  const layout = useMemo(
    () => computeLayout(stageData, deals.length),
    [stageData, deals.length]
  );

  if (!hydrated) return <Skeleton variant="rounded" height={300} />;

  const isNodeHighlighted = (stage: SankeyStage) =>
    hoveredNode === null || hoveredNode === stage;

  const isLinkHighlighted = (link: LinkLayout) =>
    hoveredNode === null || hoveredNode === link.source || hoveredNode === link.target;

  return (
    <>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Deal Pipeline
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Click any stage to view deals and update statuses
        </Typography>

        <Box sx={{ width: '100%', overflow: 'hidden' }}>
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            width="100%"
            style={{ display: 'block' }}
          >
            <defs>
              {/* Node gradients */}
              {STAGE_CONFIGS.map((cfg) => (
                <linearGradient key={`ng-${cfg.id}`} id={`node-grad-${cfg.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cfg.color1} />
                  <stop offset="100%" stopColor={cfg.color2} />
                </linearGradient>
              ))}

              {/* Link gradients */}
              <linearGradient id="grad-opp-offer" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#002855" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="grad-offer-order" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="grad-offer-lost" x1="0" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#DC2626" stopOpacity="0.28" />
              </linearGradient>
              <linearGradient id="grad-offer-expired" x1="0" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#6B7280" stopOpacity="0.22" />
              </linearGradient>

              {/* Filters */}
              <filter id="f-shadow" x="-10%" y="-10%" width="130%" height="130%">
                <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000" floodOpacity="0.12" />
              </filter>
              <filter id="f-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur" />
                <feFlood floodColor="#3B82F6" floodOpacity="0.35" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Links (rendered first, behind nodes) */}
            {layout.links.map((link, i) => (
              <path
                key={link.id}
                d={link.path}
                fill={`url(#${link.gradientId})`}
                style={{
                  opacity: mounted ? (isLinkHighlighted(link) ? 1 : 0.25) : 0,
                  transition: `opacity 0.4s ease ${0.15 + i * 0.08}s`,
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedStage(link.target)}
              />
            ))}

            {/* Nodes */}
            {layout.nodes.map((node, i) => {
              const cfg = getConfig(node.stage);
              const hovered = hoveredNode === node.stage;
              const selected = selectedStage === node.stage;
              const cx = node.x + node.w / 2;
              const cy = node.y + node.h / 2;
              const dimmed = hoveredNode !== null && !hovered;

              return (
                <g
                  key={node.stage}
                  style={{
                    cursor: 'pointer',
                    opacity: mounted ? (dimmed ? 0.4 : 1) : 0,
                    transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.2s ease`,
                    transform: hovered ? `scale(1.04)` : 'scale(1)',
                    transformOrigin: `${cx}px ${cy}px`,
                    filter: hovered ? 'url(#f-glow)' : 'url(#f-shadow)',
                  }}
                  onMouseEnter={() => setHoveredNode(node.stage)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setSelectedStage(selectedStage === node.stage ? null : node.stage)}
                >
                  {/* Node rect */}
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.w}
                    height={node.h}
                    rx={10}
                    ry={10}
                    fill={`url(#node-grad-${node.stage})`}
                  />

                  {/* Selected ring */}
                  {selected && (
                    <rect
                      x={node.x - 3}
                      y={node.y - 3}
                      width={node.w + 6}
                      height={node.h + 6}
                      rx={12}
                      ry={12}
                      fill="none"
                      stroke={cfg.color1}
                      strokeWidth={2.5}
                      strokeDasharray="6 3"
                      opacity={0.7}
                    />
                  )}

                  {/* Stage label */}
                  <text
                    x={cx}
                    y={node.h >= 80 ? cy - 22 : cy - 14}
                    textAnchor="middle"
                    fill="white"
                    fontSize="15"
                    fontWeight="700"
                    fontFamily="Inter, system-ui, sans-serif"
                  >
                    {node.stage}
                  </text>

                  {/* Deal count */}
                  <text
                    x={cx}
                    y={node.h >= 80 ? cy + 2 : cy + 4}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.9)"
                    fontSize="26"
                    fontWeight="800"
                    fontFamily="Inter, system-ui, sans-serif"
                  >
                    {node.currentCount}
                  </text>

                  {/* Revenue + Volume (only if enough height) */}
                  {node.h >= 70 && (
                    <>
                      <text
                        x={cx}
                        y={cy + 26}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.78)"
                        fontSize="11"
                        fontWeight="500"
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        {fmtRevenue(node.revenue)}
                      </text>
                      <text
                        x={cx}
                        y={cy + 40}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.65)"
                        fontSize="10"
                        fontWeight="400"
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        {fmtVolume(node.volume)}
                      </text>
                    </>
                  )}
                </g>
              );
            })}

            {/* Flow labels on links (deal counts on the flow bands) */}
            {layout.links.map((link) => {
              const src = layout.nodes.find((n) => n.stage === link.source)!;
              const tgt = layout.nodes.find((n) => n.stage === link.target)!;
              const isBranch = link.target === 'Lost' || link.target === 'Expired';
              const midX = isBranch
                ? (src.x + src.w + tgt.x + tgt.w / 2) / 2
                : (src.x + src.w + tgt.x) / 2;
              const midY = isBranch
                ? (src.y + src.h / 2 + tgt.y) / 2
                : (src.y + src.h / 2 + tgt.y + tgt.h / 2) / 2;
              return (
                <text
                  key={`label-${link.id}`}
                  x={midX}
                  y={midY}
                  textAnchor="middle"
                  fill={getConfig(link.target).color2}
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="Inter, system-ui, sans-serif"
                  style={{
                    opacity: mounted ? 0.7 : 0,
                    transition: `opacity 0.5s ease 0.5s`,
                    pointerEvents: 'none',
                  }}
                >
                  {link.dealCount} deal{link.dealCount !== 1 ? 's' : ''}
                </text>
              );
            })}
          </svg>
        </Box>
      </Paper>

      <PipelineDrawer
        stage={selectedStage}
        onClose={() => setSelectedStage(null)}
      />
    </>
  );
}
