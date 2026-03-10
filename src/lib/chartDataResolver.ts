import { useCustomerStore } from '@/stores/customerStore';
import { useDealStore } from '@/stores/dealStore';
import { useOfferStore } from '@/stores/offerStore';
import { useOrderStore } from '@/stores/orderStore';
import { useProductStore } from '@/stores/productStore';
import { useActivityStore } from '@/stores/activityStore';
import { usePricingStore } from '@/stores/pricingStore';
import { format, parseISO, startOfMonth, startOfWeek, startOfQuarter, startOfYear } from 'date-fns';
import type { ChartConfig, ChartDataSource, ChartFilter, JoinConfig, TimeGranularity, AggregationFunction } from '@/types';

// ========== Raw Data Access ==========

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

// ========== Joins ==========

function applyJoins(data: Record<string, unknown>[], joins?: JoinConfig[]): Record<string, unknown>[] {
  if (!joins || joins.length === 0) return data;

  let enriched = data.map((row) => ({ ...row }));
  for (const join of joins) {
    const joinedData = getRawData(join.source);
    const lookupMap = new Map<unknown, Record<string, unknown>>();
    for (const row of joinedData) {
      lookupMap.set(row[join.sourceField], row);
    }

    enriched = enriched.map((row) => {
      const matched = lookupMap.get(row[join.targetField]);
      if (!matched) return row;
      const extra: Record<string, unknown> = {};
      for (const field of join.fields) {
        extra[`${join.source}_${field}`] = matched[field];
      }
      return { ...row, ...extra };
    });
  }
  return enriched;
}

// ========== Filters ==========

function applyFilters(data: Record<string, unknown>[], filters?: ChartFilter[]): Record<string, unknown>[] {
  if (!filters || filters.length === 0) return data;

  return data.filter((row) => {
    return filters.every((f) => {
      const val = row[f.field];
      switch (f.operator) {
        case 'eq':
          return val === f.value;
        case 'neq':
          return val !== f.value;
        case 'gt':
          return typeof val === 'number' && val > (f.value as number);
        case 'gte':
          return typeof val === 'number' && val >= (f.value as number);
        case 'lt':
          return typeof val === 'number' && val < (f.value as number);
        case 'lte':
          return typeof val === 'number' && val <= (f.value as number);
        case 'in':
          return Array.isArray(f.value) && f.value.includes(String(val));
        case 'contains':
          return typeof val === 'string' && typeof f.value === 'string' && val.toLowerCase().includes(f.value.toLowerCase());
        default:
          return true;
      }
    });
  });
}

// ========== Offer Lines Flattening ==========

const OFFER_LINE_FIELDS = new Set(['pricePerUnit', 'quantity', 'productId', 'unit', 'currency', 'incoterms', 'paymentTerms', 'belowMSPReason']);

function shouldFlattenOfferLines(config: ChartConfig): boolean {
  if (config.dataSource !== 'offers') return false;

  const referencedFields = new Set<string>();
  config.series.forEach((s) => {
    referencedFields.add(s.field);
    if (s.aggregation) referencedFields.add(s.aggregation.field);
  });
  if (config.xAxis) referencedFields.add(config.xAxis.field);
  if (config.yAxis) referencedFields.add(config.yAxis.field);
  if (config.groupBy) referencedFields.add(config.groupBy);
  if (config.nameField) referencedFields.add(config.nameField);
  if (config.valueField) referencedFields.add(config.valueField);
  config.filters?.forEach((f) => referencedFields.add(f.field));

  return [...referencedFields].some((field) => OFFER_LINE_FIELDS.has(field));
}

function flattenOfferLines(data: Record<string, unknown>[]): Record<string, unknown>[] {
  const flattened: Record<string, unknown>[] = [];
  for (const row of data) {
    const lines = row.lines as Record<string, unknown>[] | undefined;
    if (!lines || !Array.isArray(lines)) {
      flattened.push(row);
      continue;
    }
    for (const line of lines) {
      const { lines: _, ...rest } = row;
      flattened.push({ ...rest, ...line });
    }
  }
  return flattened;
}

// ========== Time Bucketing ==========

function getTimeBucket(dateStr: string, granularity: TimeGranularity): string {
  try {
    const date = parseISO(dateStr);
    switch (granularity) {
      case 'day':
        return format(date, 'yyyy-MM-dd');
      case 'week':
        return format(startOfWeek(date), 'yyyy-MM-dd');
      case 'month':
        return format(startOfMonth(date), 'MMM yyyy');
      case 'quarter': {
        const q = startOfQuarter(date);
        return `Q${Math.ceil((q.getMonth() + 1) / 3)} ${format(q, 'yyyy')}`;
      }
      case 'year':
        return format(startOfYear(date), 'yyyy');
      default:
        return format(date, 'MMM yyyy');
    }
  } catch {
    return String(dateStr);
  }
}

// ========== Aggregation Helpers ==========

function aggregate(values: number[], fn: AggregationFunction): number {
  if (values.length === 0) return 0;
  switch (fn) {
    case 'count':
      return values.length;
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'distinct_count':
      return new Set(values).size;
    default:
      return values.length;
  }
}

// ========== Grouping + Aggregation ==========

function applyGroupingAndAggregation(
  data: Record<string, unknown>[],
  config: ChartConfig
): Record<string, unknown>[] {
  const groupKey = config.groupBy;
  const timeGroup = config.timeGroupBy;

  if (!groupKey && !timeGroup) {
    // No grouping — apply global aggregation if present
    if (config.aggregation) {
      const values = data.map((r) => Number(r[config.aggregation!.field]) || 0);
      return [{ value: aggregate(values, config.aggregation.function) }];
    }
    return data;
  }

  // Build groups
  const groups = new Map<string, Record<string, unknown>[]>();

  for (const row of data) {
    let key: string;
    if (timeGroup) {
      const dateVal = String(row[timeGroup.field] ?? '');
      key = getTimeBucket(dateVal, timeGroup.granularity);
    } else {
      key = String(row[groupKey!] ?? 'Unknown');
    }
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  // Aggregate each group
  const result: Record<string, unknown>[] = [];

  for (const [key, rows] of groups) {
    const entry: Record<string, unknown> = {};

    // Set the group key field
    if (timeGroup) {
      entry[timeGroup.field] = key;
    }
    if (groupKey) {
      entry[groupKey] = key;
    }
    // Also set a generic 'name' field for pie charts
    entry.name = key;

    // Aggregate each series
    for (const series of config.series) {
      const aggConfig = series.aggregation ?? config.aggregation;
      if (aggConfig) {
        if (aggConfig.function === 'count') {
          entry[series.field] = rows.length;
        } else {
          const values = rows.map((r) => Number(r[aggConfig.field]) || 0);
          entry[series.field] = Math.round(aggregate(values, aggConfig.function) * 100) / 100;
        }
      } else {
        // No aggregation — take first value
        entry[series.field] = rows[0]?.[series.field];
      }
    }

    // For pie charts with valueField
    if (config.valueField) {
      const aggConfig = config.aggregation;
      if (aggConfig) {
        if (aggConfig.function === 'count') {
          entry[config.valueField] = rows.length;
        } else {
          const values = rows.map((r) => Number(r[aggConfig.field]) || 0);
          entry[config.valueField] = Math.round(aggregate(values, aggConfig.function) * 100) / 100;
        }
      } else {
        entry[config.valueField] = rows.length;
      }
    }

    result.push(entry);
  }

  return result;
}

// ========== Sort + Limit ==========

function applySort(data: Record<string, unknown>[], sortBy: string, order: 'asc' | 'desc' = 'asc'): Record<string, unknown>[] {
  return [...data].sort((a, b) => {
    const valA = a[sortBy];
    const valB = b[sortBy];
    let cmp = 0;
    if (typeof valA === 'number' && typeof valB === 'number') {
      cmp = valA - valB;
    } else {
      cmp = String(valA ?? '').localeCompare(String(valB ?? ''));
    }
    return order === 'desc' ? -cmp : cmp;
  });
}

// ========== Main Resolver ==========

export function resolveChartData(config: ChartConfig): Record<string, unknown>[] {
  // 1. Get raw data
  let data = getRawData(config.dataSource);

  // 2. Apply joins
  data = applyJoins(data, config.joins);

  // 3. Apply filters
  data = applyFilters(data, config.filters);

  // 4. Flatten offer lines if needed
  if (shouldFlattenOfferLines(config)) {
    data = flattenOfferLines(data);
    // Re-apply filters after flattening (some filters may target line fields)
    data = applyFilters(data, config.filters);
  }

  // 5. Grouping + aggregation
  if (config.groupBy || config.timeGroupBy || config.aggregation) {
    data = applyGroupingAndAggregation(data, config);
  }

  // 6. Sort
  if (config.sortBy) {
    data = applySort(data, config.sortBy, config.sortOrder);
  }

  // 7. Limit
  if (config.limit && config.limit > 0) {
    data = data.slice(0, config.limit);
  }

  return data;
}
