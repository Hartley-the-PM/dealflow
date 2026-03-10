'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  AreaChart, Area,
  ScatterChart, Scatter,
  XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import type { ChartConfig, TableColumn } from '@/types';

const DEFAULT_COLORS = ['#002855', '#2E6DB4', '#2E7D32', '#F5A623', '#D32F2F', '#9C27B0', '#00838F', '#FF6F00', '#1565C0', '#4E342E'];

interface DynamicChartProps {
  config: ChartConfig;
  data: Record<string, unknown>[];
  height?: number;
}

// ========== Format helpers ==========

function formatValue(value: unknown, fmt?: string): string {
  if (value === null || value === undefined) return '—';
  if (fmt === 'currency') return `$${Number(value).toLocaleString()}`;
  if (fmt === 'percentage') return `${Number(value).toFixed(1)}%`;
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
}

// ========== Sub-renderers ==========

function LineChartRenderer({ config, data, height }: DynamicChartProps) {
  const colors = config.colors ?? DEFAULT_COLORS;
  return (
    <ResponsiveContainer width="100%" height={height ?? 300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        {config.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={config.xAxis?.field} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        {config.showTooltip !== false && <Tooltip />}
        {config.showLegend !== false && <Legend />}
        {config.series.map((s, i) => (
          <Line
            key={s.field}
            type={s.type ?? 'monotone'}
            dataKey={s.field}
            stroke={s.color ?? colors[i % colors.length]}
            strokeWidth={2}
            name={s.label}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function BarChartRenderer({ config, data, height }: DynamicChartProps) {
  const colors = config.colors ?? DEFAULT_COLORS;
  return (
    <ResponsiveContainer width="100%" height={height ?? 300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        {config.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={config.xAxis?.field} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        {config.showTooltip !== false && <Tooltip />}
        {config.showLegend !== false && <Legend />}
        {config.series.map((s, i) => (
          <Bar
            key={s.field}
            dataKey={s.field}
            fill={s.color ?? colors[i % colors.length]}
            name={s.label}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

function PieChartRenderer({ config, data, height }: DynamicChartProps) {
  const colors = config.colors ?? DEFAULT_COLORS;
  const nameField = config.nameField ?? 'name';
  const valueField = config.valueField ?? config.series[0]?.field ?? 'value';
  return (
    <ResponsiveContainer width="100%" height={height ?? 300}>
      <PieChart>
        {config.showTooltip !== false && <Tooltip />}
        {config.showLegend !== false && <Legend />}
        <Pie
          data={data}
          dataKey={valueField}
          nameKey={nameField}
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ name, percent }: { name?: string; percent?: number }) =>
            `${name ?? ''}: ${((percent ?? 0) * 100).toFixed(0)}%`
          }
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

function AreaChartRenderer({ config, data, height }: DynamicChartProps) {
  const colors = config.colors ?? DEFAULT_COLORS;
  return (
    <ResponsiveContainer width="100%" height={height ?? 300}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        {config.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={config.xAxis?.field} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        {config.showTooltip !== false && <Tooltip />}
        {config.showLegend !== false && <Legend />}
        {config.series.map((s, i) => {
          const color = s.color ?? colors[i % colors.length];
          return (
            <Area
              key={s.field}
              type={s.type ?? 'monotone'}
              dataKey={s.field}
              stroke={color}
              fill={color}
              fillOpacity={0.2}
              strokeWidth={2}
              name={s.label}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ScatterChartRenderer({ config, data, height }: DynamicChartProps) {
  const colors = config.colors ?? DEFAULT_COLORS;
  return (
    <ResponsiveContainer width="100%" height={height ?? 300}>
      <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        {config.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis
          dataKey={config.xAxis?.field}
          name={config.xAxis?.label ?? config.xAxis?.field}
          tick={{ fontSize: 12 }}
          type={config.xAxis?.type === 'number' ? 'number' : 'category'}
        />
        <YAxis
          dataKey={config.yAxis?.field}
          name={config.yAxis?.label ?? config.yAxis?.field}
          tick={{ fontSize: 12 }}
        />
        {config.showTooltip !== false && <Tooltip cursor={{ strokeDasharray: '3 3' }} />}
        {config.showLegend !== false && <Legend />}
        <Scatter
          name={config.series[0]?.label ?? 'Data'}
          data={data}
          fill={config.series[0]?.color ?? colors[0]}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function TableRenderer({ config, data }: DynamicChartProps) {
  const columns: TableColumn[] = config.columns ?? config.series.map((s) => ({
    field: s.field,
    label: s.label,
  }));

  return (
    <TableContainer sx={{ maxHeight: 400 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.field} align={col.align ?? 'left'} sx={{ fontWeight: 600 }}>
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i} hover>
              {columns.map((col) => (
                <TableCell key={col.field} align={col.align ?? 'left'}>
                  {formatValue(row[col.field], col.format)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ========== Main Component ==========

export default function DynamicChart({ config, data, height }: DynamicChartProps) {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: height ?? 300 }}>
        <Typography color="text.secondary">No data available for this chart configuration.</Typography>
      </Box>
    );
  }

  try {
    switch (config.chartType) {
      case 'line':
        return <LineChartRenderer config={config} data={data} height={height} />;
      case 'bar':
        return <BarChartRenderer config={config} data={data} height={height} />;
      case 'pie':
        return <PieChartRenderer config={config} data={data} height={height} />;
      case 'area':
        return <AreaChartRenderer config={config} data={data} height={height} />;
      case 'scatter':
        return <ScatterChartRenderer config={config} data={data} height={height} />;
      case 'table':
        return <TableRenderer config={config} data={data} height={height} />;
      default:
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: height ?? 300 }}>
            <Typography color="text.secondary">Unsupported chart type: {config.chartType}</Typography>
          </Box>
        );
    }
  } catch (err) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: height ?? 300 }}>
        <Typography color="error">Error rendering chart: {String(err)}</Typography>
      </Box>
    );
  }
}
