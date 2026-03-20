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
import { usePipelineStagesStore } from '@/stores/pipelineStagesStore';
import type { PipelineStage } from '@/stores/pipelineStagesStore';
import { useHydration } from '@/hooks/useHydration';
import type { Deal, Offer, Order } from '@/types';
import PipelineDrawer from './PipelineDrawer';

// SankeyStage is now dynamic — any string matching a pipeline stage name
export type SankeyStage = string;

// --- Classification ---
// Simply returns the deal's explicit pipeline stage (source of truth)
export function classifyDeal(deal: Deal, _offers?: Offer[], _progressionStages?: PipelineStage[]): SankeyStage {
  return (deal as any).pipelineStage || 'Opportunity';
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

// --- Formatting ---
function fmtRevenue(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function fmtVolume(value: number): string {
  return `${value.toLocaleString()} MT`;
}

// --- Layout ---
const VB_W = 1200;
const VB_H = 440;
const NODE_W = 14;
const MIN_NODE_H = 55;
const MAX_NODE_H = 180;

interface NodeLayout {
  stage: string;
  x: number;
  y: number;
  h: number;
  currentCount: number;
  revenue: number;
  volume: number;
  color: string;
  label: string;
  isExit: boolean;
}

interface LinkLayout {
  id: string;
  source: string;
  target: string;
  path: string;
  sourceColor: string;
  targetColor: string;
  dealCount: number;
  labelX: number;
  labelY: number;
  isBranch: boolean;
}

// Horizontal bezier band between two vertical bars
function hBand(sx: number, sy: number, sh: number, tx: number, ty: number, th: number): string {
  const cp = (tx - sx) * 0.45;
  return [
    `M ${sx},${sy}`,
    `C ${sx + cp},${sy} ${tx - cp},${ty} ${tx},${ty}`,
    `L ${tx},${ty + th}`,
    `C ${tx - cp},${ty + th} ${sx + cp},${sy + sh} ${sx},${sy + sh}`,
    'Z',
  ].join(' ');
}

// Curved band going downward from source to target
function branchBand(sx: number, sy: number, sh: number, tx: number, ty: number, th: number): string {
  const mx = (sx + tx) / 2;
  return [
    `M ${sx},${sy}`,
    `C ${mx},${sy} ${mx},${ty} ${tx},${ty}`,
    `L ${tx},${ty + th}`,
    `C ${mx},${ty + th} ${mx},${sy + sh} ${sx},${sy + sh}`,
    'Z',
  ].join(' ');
}

function computeLayout(
  progressionStages: PipelineStage[],
  exitStages: PipelineStage[],
  stageCounts: Record<string, { current: number; revenue: number; volume: number }>,
  totalDeals: number
) {
  const nodes: NodeLayout[] = [];
  const links: LinkLayout[] = [];

  if (totalDeals === 0 || progressionStages.length === 0) {
    [...progressionStages, ...exitStages].forEach((cfg, i) => {
      nodes.push({
        stage: cfg.name, x: 100 + i * 180, y: VB_H / 2 - 20, h: MIN_NODE_H,
        currentCount: 0, revenue: 0, volume: 0, color: cfg.color, label: cfg.name, isExit: cfg.type === 'exit',
      });
    });
    return { nodes, links };
  }

  function scaleH(count: number) {
    if (count === 0) return MIN_NODE_H;
    const ratio = count / totalDeals;
    return Math.max(MIN_NODE_H, Math.pow(ratio, 0.4) * MAX_NODE_H);
  }

  // Calculate throughput for each progression stage
  // First stage = all deals, each subsequent = deals that passed through previous
  const progNames = progressionStages.map((s) => s.name);
  const throughput: number[] = [];
  throughput[0] = totalDeals;
  for (let i = 1; i < progNames.length; i++) {
    const prevCount = stageCounts[progNames[i - 1]]?.current || 0;
    throughput[i] = Math.max(0, throughput[i - 1] - prevCount);
  }

  // X positions: spread progression stages evenly
  const progCount = progressionStages.length;
  const availableWidth = VB_W - 240; // margin on both sides
  const xSpacing = Math.min(320, availableWidth / Math.max(progCount - 1, 1));
  const xStart = 80;
  const lastProgX = xStart + (progCount - 1) * xSpacing;

  // Main flow vertical center
  const mainY = 90;

  // Build progression nodes
  for (let i = 0; i < progressionStages.length; i++) {
    const stage = progressionStages[i];
    const h = scaleH(throughput[i]);
    const sc = stageCounts[stage.name] || { current: 0, revenue: 0, volume: 0 };
    nodes.push({
      stage: stage.name, x: xStart + i * xSpacing, y: mainY - h / 2, h,
      currentCount: sc.current, revenue: sc.revenue, volume: sc.volume,
      color: stage.color, label: stage.name, isExit: false,
    });
  }

  // Build exit nodes stacked vertically below the last progression stage
  const lastProgNode = nodes[nodes.length - 1];
  let exitY = lastProgNode ? lastProgNode.y + lastProgNode.h + 25 : mainY + 100;

  for (const exitStage of exitStages) {
    const sc = stageCounts[exitStage.name] || { current: 0, revenue: 0, volume: 0 };
    if (sc.current === 0) continue; // Skip empty exit stages
    const h = scaleH(sc.current);
    nodes.push({
      stage: exitStage.name, x: lastProgX, y: exitY, h,
      currentCount: sc.current, revenue: sc.revenue, volume: sc.volume,
      color: exitStage.color, label: exitStage.name, isExit: true,
    });
    exitY += h + 25;
  }

  // Build links between consecutive progression stages
  for (let i = 0; i < progressionStages.length - 1; i++) {
    const srcNode = nodes[i];
    const tgtNode = nodes[i + 1];
    const flowCount = throughput[i + 1];
    if (flowCount <= 0) continue;

    const srcBandH = Math.max(20, Math.pow(flowCount / totalDeals, 0.5) * srcNode.h);

    links.push({
      id: `prog-${i}-${i + 1}`,
      source: srcNode.stage, target: tgtNode.stage,
      path: hBand(srcNode.x + NODE_W, srcNode.y, srcBandH, tgtNode.x, tgtNode.y, tgtNode.h),
      sourceColor: srcNode.color, targetColor: tgtNode.color,
      dealCount: flowCount,
      labelX: (srcNode.x + NODE_W + tgtNode.x) / 2,
      labelY: (srcNode.y + srcBandH / 2 + tgtNode.y + tgtNode.h / 2) / 2,
      isBranch: false,
    });
  }

  // Build links from the second-to-last progression stage to exit stages
  if (progressionStages.length >= 2) {
    const sourceNode = nodes[progressionStages.length - 2]; // e.g. "Offer"
    const exitNodes = nodes.filter((n) => n.isExit && n.currentCount > 0);
    const totalExitCount = exitNodes.reduce((sum, n) => sum + n.currentCount, 0);

    if (totalExitCount > 0 && sourceNode) {
      // Calculate how much height the main flow uses
      const mainFlowCount = throughput[progressionStages.length - 1] || 0;
      const mainFlowBandH = Math.max(20, Math.pow(mainFlowCount / totalDeals, 0.5) * sourceNode.h);

      // Remaining height for exit flows
      const remainingH = Math.max(20, sourceNode.h - mainFlowBandH);
      const rawShares = exitNodes.map((n) => Math.pow(n.currentCount / totalExitCount, 0.6));
      const rawTotal = rawShares.reduce((a, b) => a + b, 0) || 1;

      let portY = sourceNode.y + mainFlowBandH;

      for (let j = 0; j < exitNodes.length; j++) {
        const exitNode = exitNodes[j];
        const bandH = Math.max(10, (rawShares[j] / rawTotal) * remainingH);

        links.push({
          id: `exit-${sourceNode.stage}-${exitNode.stage}`,
          source: sourceNode.stage, target: exitNode.stage,
          path: branchBand(sourceNode.x + NODE_W, portY, bandH, exitNode.x, exitNode.y, exitNode.h),
          sourceColor: sourceNode.color, targetColor: exitNode.color,
          dealCount: exitNode.currentCount,
          labelX: (sourceNode.x + NODE_W + exitNode.x) / 2,
          labelY: (portY + bandH / 2 + exitNode.y + exitNode.h / 2) / 2,
          isBranch: true,
        });
        portY += bandH;
      }
    }
  }

  return { nodes, links };
}

// --- Component ---
export default function PipelineSankey() {
  const hydrated = useHydration();
  const deals = useDealStore((s) => s.deals);
  const offers = useOfferStore((s) => s.offers);
  const pipelineStages = usePipelineStagesStore((s) => s.stages);

  const progressionStages = useMemo(
    () => pipelineStages.filter((s) => s.type === 'progression').sort((a, b) => a.order - b.order),
    [pipelineStages]
  );
  const exitStages = useMemo(
    () => pipelineStages.filter((s) => s.type === 'exit').sort((a, b) => a.order - b.order),
    [pipelineStages]
  );

  const [selectedStage, setSelectedStage] = useState<SankeyStage | null>(null);
  const [hoveredNode, setHoveredNode] = useState<SankeyStage | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const stageData = useMemo(() => {
    const counts: Record<string, { current: number; revenue: number; volume: number }> = {};
    for (const stage of [...progressionStages, ...exitStages]) {
      counts[stage.name] = { current: 0, revenue: 0, volume: 0 };
    }
    for (const deal of deals) {
      const stage = classifyDeal(deal, offers, progressionStages);
      if (!counts[stage]) counts[stage] = { current: 0, revenue: 0, volume: 0 };
      const m = calcDealMetrics(deal, offers);
      counts[stage].current += 1;
      counts[stage].revenue += m.revenue;
      counts[stage].volume += m.volume;
    }
    return counts;
  }, [deals, offers, progressionStages, exitStages]);

  const layout = useMemo(
    () => computeLayout(progressionStages, exitStages, stageData, deals.length),
    [progressionStages, exitStages, stageData, deals.length]
  );

  if (!hydrated) return <Skeleton variant="rounded" height={300} />;

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
              {layout.links.map((link) => (
                <linearGradient
                  key={`g-${link.id}`}
                  id={`sg-${link.id}`}
                  x1="0" y1="0" x2={link.isBranch ? '0.6' : '1'} y2={link.isBranch ? '1' : '0'}
                >
                  <stop offset="0%" stopColor={link.sourceColor} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={link.targetColor} stopOpacity="0.15" />
                </linearGradient>
              ))}
              {layout.links.map((link) => (
                <linearGradient
                  key={`gh-${link.id}`}
                  id={`sgh-${link.id}`}
                  x1="0" y1="0" x2={link.isBranch ? '0.6' : '1'} y2={link.isBranch ? '1' : '0'}
                >
                  <stop offset="0%" stopColor={link.sourceColor} stopOpacity="0.32" />
                  <stop offset="100%" stopColor={link.targetColor} stopOpacity="0.32" />
                </linearGradient>
              ))}
            </defs>

            {/* Flow bands */}
            {layout.links.map((link, i) => {
              const highlighted = isLinkHighlighted(link);
              const active = hoveredNode !== null && highlighted;
              return (
                <path
                  key={link.id}
                  d={link.path}
                  fill={active ? `url(#sgh-${link.id})` : `url(#sg-${link.id})`}
                  style={{
                    opacity: mounted ? (hoveredNode === null || highlighted ? 1 : 0.12) : 0,
                    transition: `opacity 0.3s ease ${0.08 + i * 0.05}s`,
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedStage(link.target)}
                />
              );
            })}

            {/* Flow count labels */}
            {layout.links.map((link) => (
              <text
                key={`lbl-${link.id}`}
                x={link.labelX}
                y={link.labelY}
                textAnchor="middle"
                dominantBaseline="central"
                fill={link.targetColor}
                fontSize="11"
                fontWeight="500"
                fontFamily="Inter, system-ui, sans-serif"
                style={{
                  opacity: mounted ? 0.55 : 0,
                  transition: 'opacity 0.4s ease 0.3s',
                  pointerEvents: 'none',
                }}
              >
                {link.dealCount} deal{link.dealCount !== 1 ? 's' : ''}
              </text>
            ))}

            {/* Nodes */}
            {layout.nodes.map((node, i) => {
              const hovered = hoveredNode === node.stage;
              const selected = selectedStage === node.stage;
              const dimmed = hoveredNode !== null && !hovered;
              const labelX = node.x + NODE_W + 10;

              return (
                <g
                  key={node.stage}
                  style={{
                    cursor: 'pointer',
                    opacity: mounted ? (dimmed ? 0.25 : 1) : 0,
                    transition: `opacity 0.35s ease ${i * 0.06}s`,
                  }}
                  onMouseEnter={() => setHoveredNode(node.stage)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setSelectedStage(selectedStage === node.stage ? null : node.stage)}
                >
                  {/* Selected indicator */}
                  {selected && (
                    <rect
                      x={node.x - 5} y={node.y - 5}
                      width={NODE_W + 10} height={node.h + 10}
                      rx={10} fill={node.color} fillOpacity={0.06}
                      stroke={node.color} strokeWidth={1.5} strokeOpacity={0.25} strokeDasharray="4 2"
                    />
                  )}

                  {/* Node bar */}
                  <rect
                    x={node.x} y={node.y} width={NODE_W} height={node.h}
                    rx={NODE_W / 2} fill={node.color}
                    style={{
                      filter: hovered ? `drop-shadow(0 0 8px ${node.color}55)` : 'none',
                      transition: 'filter 0.2s ease',
                    }}
                  />

                  {/* Hover outline */}
                  {hovered && (
                    <rect
                      x={node.x - 3} y={node.y - 3}
                      width={NODE_W + 6} height={node.h + 6}
                      rx={NODE_W / 2 + 3} fill="none"
                      stroke={node.color} strokeWidth={1.5} strokeOpacity={0.35}
                    />
                  )}

                  {/* Labels */}
                  <text x={labelX} y={node.y + 3} dominantBaseline="hanging" fill="#374151" fontSize="12" fontWeight="600" fontFamily="Inter, system-ui, sans-serif">
                    {node.label}
                  </text>
                  <text x={labelX} y={node.y + 19} dominantBaseline="hanging" fill={node.color} fontSize="20" fontWeight="700" fontFamily="Inter, system-ui, sans-serif">
                    {node.currentCount}
                  </text>
                  <text x={labelX} y={node.y + 43} dominantBaseline="hanging" fill="#6B7280" fontSize="10" fontWeight="500" fontFamily="Inter, system-ui, sans-serif">
                    {fmtRevenue(node.revenue)}
                  </text>
                  {node.volume > 0 && (
                    <text x={labelX} y={node.y + 56} dominantBaseline="hanging" fill="#9CA3AF" fontSize="10" fontWeight="400" fontFamily="Inter, system-ui, sans-serif">
                      {fmtVolume(node.volume)}
                    </text>
                  )}
                </g>
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
