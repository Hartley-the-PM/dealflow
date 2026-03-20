'use client';

import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { usePricingStore } from '@/stores/pricingStore';
import { useProductStore } from '@/stores/productStore';
import type { Product } from '@/types';

interface MSPPriceChartProps {
  productId: string;
}

const COMPARISON_COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6'];

const PRODUCT_TYPE_COLOR: Record<string, string> = {
  LDPE: '#2563EB',
  HDPE: '#059669',
  PP: '#D97706',
  PVC: '#7C3AED',
  PS: '#DC2626',
  PET: '#0891B2',
};

type DateRange = '3M' | '6M' | '12M' | 'all' | 'custom';

function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(parseInt(year), parseInt(m) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export default function MSPPriceChart({ productId }: MSPPriceChartProps) {
  const entries = usePricingStore((s) => s.entries);
  const products = useProductStore((s) => s.products);

  const [dateRange, setDateRange] = useState<DateRange>('12M');
  const [customFrom, setCustomFrom] = useState('2025-04');
  const [customTo, setCustomTo] = useState('2026-03');
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const product = products.find((p) => p.id === productId);
  const primaryColor = PRODUCT_TYPE_COLOR[product?.productType ?? ''] ?? '#1E40AF';

  // Products in same category for easy comparison
  const sameCategoryProducts = useMemo(
    () => products.filter((p) => p.productType === product?.productType && p.id !== productId),
    [products, product, productId]
  );

  // All products except current for comparison picker
  const comparableProducts = useMemo(
    () => products.filter((p) => p.id !== productId),
    [products, productId]
  );

  const allMonths = useMemo(() => {
    const months = new Set<string>();
    entries.forEach((e) => months.add(e.month));
    return Array.from(months).sort();
  }, [entries]);

  const visibleMonths = useMemo(() => {
    if (dateRange === 'custom') {
      return allMonths.filter((m) => m >= customFrom && m <= customTo);
    }
    if (dateRange === 'all') return allMonths;
    const latest = allMonths[allMonths.length - 1] ?? '2026-03';
    const [y, mo] = latest.split('-').map(Number);
    const monthsBack = dateRange === '3M' ? 3 : dateRange === '6M' ? 6 : 12;
    let fromM = mo - monthsBack + 1;
    let fromY = y;
    while (fromM <= 0) { fromM += 12; fromY -= 1; }
    const fromStr = `${fromY}-${String(fromM).padStart(2, '0')}`;
    return allMonths.filter((m) => m >= fromStr);
  }, [allMonths, dateRange, customFrom, customTo]);

  // Build chart data
  const chartData = useMemo(() => {
    const priceMap = new Map<string, Map<string, number>>();
    entries.forEach((e) => {
      if (!priceMap.has(e.month)) priceMap.set(e.month, new Map());
      priceMap.get(e.month)!.set(e.productId, e.price);
    });

    const allIds = [productId, ...compareIds];
    return visibleMonths.map((month) => {
      const row: Record<string, unknown> = { month, monthLabel: formatMonth(month) };
      const monthPrices = priceMap.get(month);
      allIds.forEach((id) => {
        row[id] = monthPrices?.get(id) ?? null;
      });
      return row;
    });
  }, [entries, visibleMonths, productId, compareIds]);

  // Stats for the primary product
  const stats = useMemo(() => {
    const productPrices = chartData
      .map((d) => d[productId] as number | null)
      .filter((v): v is number => v != null);
    if (productPrices.length === 0) return null;

    const current = productPrices[productPrices.length - 1];
    const first = productPrices[0];
    const change = current - first;
    const changePct = (change / first) * 100;
    const high = Math.max(...productPrices);
    const low = Math.min(...productPrices);
    const avg = productPrices.reduce((a, b) => a + b, 0) / productPrices.length;

    return { current, change, changePct, high, low, avg };
  }, [chartData, productId]);

  const handleDateRangeChange = (_: React.MouseEvent<HTMLElement>, val: DateRange | null) => {
    if (val) setDateRange(val);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          MSP Price History
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <ToggleButtonGroup size="small" value={dateRange} exclusive onChange={handleDateRangeChange}>
            <ToggleButton value="3M" sx={{ px: 1.5, fontSize: 12 }}>3M</ToggleButton>
            <ToggleButton value="6M" sx={{ px: 1.5, fontSize: 12 }}>6M</ToggleButton>
            <ToggleButton value="12M" sx={{ px: 1.5, fontSize: 12 }}>12M</ToggleButton>
            <ToggleButton value="all" sx={{ px: 1.5, fontSize: 12 }}>All</ToggleButton>
            <ToggleButton value="custom" sx={{ px: 1.5, fontSize: 12 }}>Custom</ToggleButton>
          </ToggleButtonGroup>
          {dateRange === 'custom' && (
            <>
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <InputLabel>From</InputLabel>
                <Select value={customFrom} label="From" onChange={(e) => setCustomFrom(e.target.value)}>
                  {allMonths.map((m) => (
                    <MenuItem key={m} value={m}>{formatMonth(m)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary">to</Typography>
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <InputLabel>To</InputLabel>
                <Select value={customTo} label="To" onChange={(e) => setCustomTo(e.target.value)}>
                  {allMonths.map((m) => (
                    <MenuItem key={m} value={m}>{formatMonth(m)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </Box>
      </Box>

      {/* Stats bar */}
      {stats && (
        <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Current</Typography>
            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              ${stats.current.toLocaleString(undefined, { minimumFractionDigits: 2 })}/MT
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Change</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {stats.change >= 0 ? (
                <TrendingUpIcon sx={{ fontSize: 18, color: 'success.main' }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: 18, color: 'error.main' }} />
              )}
              <Typography
                variant="body1"
                fontWeight={600}
                sx={{ color: stats.change >= 0 ? 'success.main' : 'error.main', lineHeight: 1.2 }}
              >
                {stats.change >= 0 ? '+' : ''}${stats.change.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                {' '}({stats.changePct >= 0 ? '+' : ''}{stats.changePct.toFixed(1)}%)
              </Typography>
            </Box>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">High</Typography>
            <Typography variant="body1" fontWeight={600} sx={{ lineHeight: 1.2 }}>
              ${stats.high.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Low</Typography>
            <Typography variant="body1" fontWeight={600} sx={{ lineHeight: 1.2 }}>
              ${stats.low.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Average</Typography>
            <Typography variant="body1" fontWeight={600} sx={{ lineHeight: 1.2 }}>
              ${stats.avg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Chart */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        {chartData.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <Typography color="text.secondary">No pricing data available for this date range</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="monthLabel" fontSize={12} tickMargin={8} />
              <YAxis
                fontSize={12}
                tickFormatter={(v: number) => `$${v.toLocaleString()}`}
                domain={['auto', 'auto']}
                width={70}
              />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={((value: number, name: string) => {
                  const p = products.find((pr) => pr.id === name);
                  return [
                    `$${value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/MT`,
                    p?.name ?? name,
                  ];
                }) as any}
                labelFormatter={((label: string) => label) as any}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              {(compareIds.length > 0) && (
                <Legend
                  formatter={((value: string) => {
                    const p = products.find((pr) => pr.id === value);
                    return p ? p.code : value;
                  }) as any}
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                />
              )}
              {stats && (
                <ReferenceLine
                  y={stats.avg}
                  stroke="#94A3B8"
                  strokeDasharray="4 4"
                  label={{ value: 'Avg', position: 'right', fontSize: 11, fill: '#94A3B8' }}
                />
              )}
              {/* Primary product line */}
              <Line
                type="monotone"
                dataKey={productId}
                name={productId}
                stroke={primaryColor}
                strokeWidth={3}
                dot={{ r: 4, fill: primaryColor }}
                activeDot={{ r: 6 }}
                connectNulls
              />
              {/* Comparison lines */}
              {compareIds.map((cid, i) => (
                <Line
                  key={cid}
                  type="monotone"
                  dataKey={cid}
                  name={cid}
                  stroke={COMPARISON_COLORS[i % COMPARISON_COLORS.length]}
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </Paper>

      {/* Compare with other products */}
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <CompareArrowsIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Compare with
          </Typography>
          {/* Quick add: same category chips */}
          {sameCategoryProducts.slice(0, 4).map((p) => {
            const isActive = compareIds.includes(p.id);
            return (
              <Chip
                key={p.id}
                label={p.code}
                size="small"
                variant={isActive ? 'filled' : 'outlined'}
                onClick={() =>
                  setCompareIds((prev) =>
                    isActive ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                  )
                }
                sx={{
                  fontSize: 11,
                  ...(isActive && {
                    bgcolor: COMPARISON_COLORS[compareIds.indexOf(p.id) % COMPARISON_COLORS.length],
                    color: '#fff',
                  }),
                }}
              />
            );
          })}
        </Box>
        <Autocomplete
          multiple
          size="small"
          options={comparableProducts}
          getOptionLabel={(p) => `${p.name} (${p.productType})`}
          value={products.filter((p) => compareIds.includes(p.id))}
          onChange={(_, vals) => setCompareIds(vals.map((v) => v.id))}
          groupBy={(p) => p.productType}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Search products to compare..."
              size="small"
            />
          )}
          renderTags={(vals, getTagProps) =>
            vals.map((p, i) => (
              <Chip
                {...getTagProps({ index: i })}
                key={p.id}
                label={p.code}
                size="small"
                sx={{
                  bgcolor: COMPARISON_COLORS[i % COMPARISON_COLORS.length],
                  color: '#fff',
                }}
              />
            ))
          }
        />
      </Box>
    </Box>
  );
}
