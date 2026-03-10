import { useCustomerStore } from '@/stores/customerStore';
import { useDealStore } from '@/stores/dealStore';
import { useOfferStore } from '@/stores/offerStore';
import { useOrderStore } from '@/stores/orderStore';
import { useProductStore } from '@/stores/productStore';
import { useActivityStore } from '@/stores/activityStore';
import { usePricingStore } from '@/stores/pricingStore';
import type { ChartDataSource, DataSummary, FieldStats } from '@/types';

function getRawData(source: ChartDataSource): Record<string, unknown>[] {
  switch (source) {
    case 'customers':
      return useCustomerStore.getState().customers as unknown as Record<string, unknown>[];
    case 'deals':
      return useDealStore.getState().deals as unknown as Record<string, unknown>[];
    case 'offers':
      return useOfferStore.getState().offers as unknown as Record<string, unknown>[];
    case 'orders':
      return useOrderStore.getState().orders as unknown as Record<string, unknown>[];
    case 'products':
      return useProductStore.getState().products as unknown as Record<string, unknown>[];
    case 'activities':
      return useActivityStore.getState().activities as unknown as Record<string, unknown>[];
    case 'pricing':
      return usePricingStore.getState().entries as unknown as Record<string, unknown>[];
    default:
      return [];
  }
}

function inferType(value: unknown): FieldStats['type'] {
  if (value === null || value === undefined) return 'string';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') {
    // Check if it looks like a date
    if (/^\d{4}-\d{2}(-\d{2})?/.test(value)) return 'date';
    return 'string';
  }
  return 'string';
}

function computeFieldStats(rows: Record<string, unknown>[], field: string): FieldStats {
  const values = rows.map((r) => r[field]).filter((v) => v !== null && v !== undefined);
  if (values.length === 0) return { type: 'string' };

  const type = inferType(values[0]);

  const stats: FieldStats = { type };

  if (type === 'number') {
    const nums = values.map(Number).filter((n) => !isNaN(n));
    if (nums.length > 0) {
      stats.min = Math.min(...nums);
      stats.max = Math.max(...nums);
      stats.mean = Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
    }
    stats.uniqueValues = new Set(nums).size;
  } else if (type === 'string' || type === 'date') {
    const strValues = values.map(String);
    const uniqueSet = new Set(strValues);
    stats.uniqueValues = uniqueSet.size;

    // Top values (for categorical fields with <=50 unique values)
    if (uniqueSet.size <= 50 && type === 'string') {
      const counts = new Map<string, number>();
      strValues.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
      stats.topValues = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({ value, count }));
    }

    if (type === 'date') {
      const sorted = strValues.sort();
      stats.min = sorted[0];
      stats.max = sorted[sorted.length - 1];
    }
  } else if (type === 'boolean') {
    const trueCount = values.filter(Boolean).length;
    stats.topValues = [
      { value: 'true', count: trueCount },
      { value: 'false', count: values.length - trueCount },
    ];
  }

  return stats;
}

function buildSchema(rows: Record<string, unknown>[]): Record<string, string> {
  if (rows.length === 0) return {};
  const schema: Record<string, string> = {};
  const sample = rows[0];

  for (const [key, value] of Object.entries(sample)) {
    if (key === 'lines' && Array.isArray(value)) {
      schema[key] = 'OfferLine[] (nested array: each line has id, productId, quantity, unit, pricePerUnit, currency, incoterms, paymentTerms, belowMSPReason, belowMSPNote)';
    } else {
      schema[key] = inferType(value);
    }
  }

  return schema;
}

export function buildDataSummary(source: ChartDataSource): DataSummary {
  const rows = getRawData(source);

  const schema = buildSchema(rows);

  // Sample rows (first 3, with large arrays/objects truncated)
  const sampleRows = rows.slice(0, 3).map((row) => {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (Array.isArray(value)) {
        cleaned[key] = `[${value.length} items]`;
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = '{...}';
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  });

  // Field stats (skip nested objects/arrays)
  const fieldStats: Record<string, FieldStats> = {};
  const fieldsToAnalyze = Object.keys(schema).filter(
    (k) => !schema[k].startsWith('OfferLine') && schema[k] !== 'object' && schema[k] !== 'array'
  );

  for (const field of fieldsToAnalyze) {
    fieldStats[field] = computeFieldStats(rows, field);
  }

  return {
    source,
    schema,
    rowCount: rows.length,
    sampleRows,
    fieldStats,
  };
}
