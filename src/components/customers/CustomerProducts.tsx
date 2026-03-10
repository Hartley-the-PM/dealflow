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
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EmptyState from '@/components/shared/EmptyState';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { useDealStore } from '@/stores/dealStore';
import { useOfferStore } from '@/stores/offerStore';
import { useOrderStore } from '@/stores/orderStore';
import { useProductStore } from '@/stores/productStore';
import { usePricingEngineStore } from '@/stores/pricingEngineStore';

const CATEGORY_COLOR: Record<string, string> = {
  LDPE: '#2563EB',
  HDPE: '#059669',
  PP: '#D97706',
  PVC: '#7C3AED',
  PS: '#DC2626',
  PET: '#0891B2',
};

interface PricePoint {
  date: string;
  price: number;
  quantity: number | null;
  dealName: string;
  offerName: string;
  version: number;
  type: 'Offered' | 'Ordered';
  margin: number | null;
}

interface ProductRow {
  productId: string;
  productName: string;
  productCode: string;
  category: string;
  timesOffered: number;
  timesOrdered: number;
  lastPrice: number;
  lastDate: string;
  pricePoints: PricePoint[];
}

interface CustomerProductsProps {
  customerId: string;
}

export default function CustomerProducts({ customerId }: CustomerProductsProps) {
  const getDealsByCustomer = useDealStore((s) => s.getDealsByCustomer);
  const getOffersByDeal = useOfferStore((s) => s.getOffersByDeal);
  const getOrderByOffer = useOrderStore((s) => s.getOrderByOffer);
  const products = useProductStore((s) => s.products);
  const costs = usePricingEngineStore((s) => s.costs);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const productRows = useMemo((): ProductRow[] => {
    const deals = getDealsByCustomer(customerId);
    const productMap = new Map<string, PricePoint[]>();

    for (const deal of deals) {
      const offers = getOffersByDeal(deal.id);
      for (const offer of offers) {
        const order = getOrderByOffer(offer.id);
        const isOrdered = !!order;

        for (const line of offer.lines) {
          if (!line.productId || !line.pricePerUnit) continue;

          // Get cost for margin calculation
          const productCosts = costs
            .filter((c) => c.productId === line.productId)
            .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
          const latestCost = productCosts[0]?.cost ?? null;
          const margin =
            latestCost != null && line.pricePerUnit > 0
              ? ((line.pricePerUnit - latestCost) / line.pricePerUnit) * 100
              : null;

          const point: PricePoint = {
            date: isOrdered ? order.createdAt : offer.createdAt,
            price: line.pricePerUnit,
            quantity: line.quantity,
            dealName: deal.name,
            offerName: offer.name,
            version: offer.version,
            type: isOrdered ? 'Ordered' : 'Offered',
            margin,
          };

          const existing = productMap.get(line.productId) ?? [];
          existing.push(point);
          productMap.set(line.productId, existing);
        }
      }
    }

    // Build rows
    const rows: ProductRow[] = [];
    for (const [productId, points] of productMap) {
      const product = products.find((p) => p.id === productId);
      if (!product) continue;

      const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
      const last = sorted[sorted.length - 1];

      rows.push({
        productId,
        productName: product.name,
        productCode: product.code,
        category: product.category,
        timesOffered: points.filter((p) => p.type === 'Offered').length,
        timesOrdered: points.filter((p) => p.type === 'Ordered').length,
        lastPrice: last.price,
        lastDate: last.date,
        pricePoints: sorted,
      });
    }

    // Sort by most recent first
    rows.sort((a, b) => b.lastDate.localeCompare(a.lastDate));
    return rows;
  }, [customerId, getDealsByCustomer, getOffersByDeal, getOrderByOffer, products, costs]);

  if (productRows.length === 0) {
    return <EmptyState message="No products have been offered to this customer yet." />;
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell width={40} />
            <TableCell sx={{ fontWeight: 600 }}>Product Code</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Product Name</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="center">Offered</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="center">Ordered</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">Last Price</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Last Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {productRows.map((row) => {
            const isExpanded = expandedId === row.productId;
            return (
              <ProductExpandableRow
                key={row.productId}
                row={row}
                isExpanded={isExpanded}
                onToggle={() => setExpandedId(isExpanded ? null : row.productId)}
              />
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ─── Expandable Row ──────────────────────────────────────────────────────

function ProductExpandableRow({
  row,
  isExpanded,
  onToggle,
}: {
  row: ProductRow;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <TableRow
        hover
        sx={{ cursor: 'pointer', '& > *': { borderBottom: isExpanded ? 'none !important' : undefined } }}
        onClick={onToggle}
      >
        <TableCell>
          <IconButton size="small" sx={{ p: 0.5 }}>
            {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500, fontSize: 12 }}>
            {row.productCode}
          </Typography>
        </TableCell>
        <TableCell sx={{ fontWeight: 500 }}>{row.productName}</TableCell>
        <TableCell>
          <Chip
            label={row.category}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: 11,
              bgcolor: `${CATEGORY_COLOR[row.category] ?? '#666'}15`,
              color: CATEGORY_COLOR[row.category] ?? '#666',
              border: `1px solid ${CATEGORY_COLOR[row.category] ?? '#666'}40`,
            }}
          />
        </TableCell>
        <TableCell align="center">{row.timesOffered}</TableCell>
        <TableCell align="center">
          {row.timesOrdered > 0 ? (
            <Chip label={row.timesOrdered} size="small" sx={{ fontWeight: 600, fontSize: 11, bgcolor: '#D1FAE5', color: '#059669', height: 22 }} />
          ) : (
            '0'
          )}
        </TableCell>
        <TableCell align="right">
          <Typography variant="body2" fontWeight={600}>
            ${row.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}/MT
          </Typography>
        </TableCell>
        <TableCell>
          {new Date(row.lastDate).toLocaleDateString()}
        </TableCell>
      </TableRow>

      {/* Expanded content */}
      <TableRow>
        <TableCell colSpan={8} sx={{ py: 0, px: 0 }}>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ px: 3, py: 2.5, bgcolor: '#FAFAFA' }}>
              <PriceHistoryChart points={row.pricePoints} />
              <PriceHistoryTable points={row.pricePoints} />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// ─── Price History Chart ─────────────────────────────────────────────────

function PriceHistoryChart({ points }: { points: PricePoint[] }) {
  const chartData = useMemo(() => {
    return points.map((p) => ({
      date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
      rawDate: p.date,
      offeredPrice: p.type === 'Offered' ? p.price : null,
      orderedPrice: p.type === 'Ordered' ? p.price : null,
      margin: p.margin != null ? Math.round(p.margin * 10) / 10 : null,
      dealName: p.dealName,
      quantity: p.quantity,
      type: p.type,
    }));
  }, [points]);

  if (chartData.length < 2) {
    // Not enough data for a meaningful chart — just show the table
    return null;
  }

  const allPrices = points.map((p) => p.price);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const pricePad = (maxPrice - minPrice) * 0.15 || 50;

  const margins = points.map((p) => p.margin).filter((m): m is number => m != null);
  const hasMargin = margins.length > 0;
  const minMargin = hasMargin ? Math.min(...margins) : 0;
  const maxMargin = hasMargin ? Math.max(...margins) : 50;
  const marginPad = (maxMargin - minMargin) * 0.2 || 5;

  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
        Price History
      </Typography>
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: hasMargin ? 50 : 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" fontSize={10} tickMargin={4} />
            <YAxis
              yAxisId="price"
              fontSize={10}
              tickFormatter={(v: number) => `$${v.toLocaleString()}`}
              domain={[minPrice - pricePad, maxPrice + pricePad]}
              width={70}
            />
            {hasMargin && (
              <YAxis
                yAxisId="margin"
                orientation="right"
                fontSize={10}
                tickFormatter={(v: number) => `${v}%`}
                domain={[Math.floor(minMargin - marginPad), Math.ceil(maxMargin + marginPad)]}
                width={45}
              />
            )}
            <RechartsTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0]?.payload;
                if (!data) return null;
                const price = data.offeredPrice ?? data.orderedPrice;
                return (
                  <Paper sx={{ p: 1.5, fontSize: 12 }}>
                    <Typography variant="caption" fontWeight={600} display="block">
                      {data.dealName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {data.date} · {data.type}
                    </Typography>
                    {price != null && (
                      <Typography variant="caption" display="block">
                        Price: ${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}/MT
                      </Typography>
                    )}
                    {data.quantity != null && (
                      <Typography variant="caption" display="block">
                        Qty: {data.quantity} MT
                      </Typography>
                    )}
                    {data.margin != null && (
                      <Typography variant="caption" display="block">
                        Margin: {data.margin}%
                      </Typography>
                    )}
                  </Paper>
                );
              }}
            />
            <Legend
              verticalAlign="top"
              height={28}
              iconSize={10}
              wrapperStyle={{ fontSize: 11 }}
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="offeredPrice"
              name="Offered"
              stroke="#3B82F6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: '#3B82F6' }}
              connectNulls={false}
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="orderedPrice"
              name="Ordered"
              stroke="#059669"
              strokeWidth={2}
              dot={{ r: 5, fill: '#059669' }}
              connectNulls={false}
            />
            {hasMargin && (
              <Line
                yAxisId="margin"
                type="monotone"
                dataKey="margin"
                name="Margin %"
                stroke="#F59E0B"
                strokeWidth={1.5}
                dot={{ r: 3, fill: '#F59E0B' }}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}

// ─── Price History Table ─────────────────────────────────────────────────

function PriceHistoryTable({ points }: { points: PricePoint[] }) {
  const sorted = useMemo(() => [...points].sort((a, b) => b.date.localeCompare(a.date)), [points]);

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
        Detail
      </Typography>
      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Deal</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Offer</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: 12 }} align="right">Qty</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: 12 }} align="right">Price</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: 12 }} align="right">Margin</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((p, i) => (
              <TableRow key={i}>
                <TableCell sx={{ fontSize: 12 }}>
                  {new Date(p.date).toLocaleDateString()}
                </TableCell>
                <TableCell sx={{ fontSize: 12, fontWeight: 500 }}>{p.dealName}</TableCell>
                <TableCell sx={{ fontSize: 12 }}>
                  {p.offerName} <Typography component="span" variant="caption" color="text.secondary">V{p.version}</Typography>
                </TableCell>
                <TableCell align="right" sx={{ fontSize: 12 }}>
                  {p.quantity != null ? `${p.quantity} MT` : '—'}
                </TableCell>
                <TableCell align="right" sx={{ fontSize: 12, fontWeight: 600 }}>
                  ${p.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell align="right" sx={{ fontSize: 12 }}>
                  {p.margin != null ? (
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: p.margin >= 15 ? '#059669' : p.margin >= 0 ? '#D97706' : '#DC2626',
                      }}
                    >
                      {p.margin.toFixed(1)}%
                    </Typography>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={p.type}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      fontSize: 10,
                      height: 20,
                      bgcolor: p.type === 'Ordered' ? '#D1FAE5' : '#DBEAFE',
                      color: p.type === 'Ordered' ? '#059669' : '#2563EB',
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
