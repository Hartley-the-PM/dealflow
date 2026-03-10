// ========== Data Source Types ==========

export type ChartDataSource =
  | 'orders'
  | 'offers'
  | 'customers'
  | 'pricing'
  | 'products'
  | 'activities'
  | 'deals';

// ========== Chart Types ==========

export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'table';

// ========== Aggregation ==========

export type AggregationFunction = 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct_count';

export type TimeGranularity = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface AggregationConfig {
  function: AggregationFunction;
  field: string;
}

// ========== Axis / Series ==========

export interface AxisConfig {
  field: string;
  label?: string;
  type?: 'category' | 'number' | 'time';
  format?: string;
}

export interface SeriesConfig {
  field: string;
  label: string;
  color?: string;
  type?: 'monotone' | 'linear' | 'step';
  aggregation?: AggregationConfig;
}

// ========== Filters ==========

export interface ChartFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: string | number | boolean | string[];
}

// ========== Join Config ==========

export interface JoinConfig {
  source: ChartDataSource;
  sourceField: string;
  targetField: string;
  fields: string[];
}

// ========== Table-Specific Config ==========

export interface TableColumn {
  field: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  format?: string;
  width?: number;
}

// ========== The Core ChartConfig ==========

export interface ChartConfig {
  id: string;
  title: string;
  description?: string;
  chartType: ChartType;
  dataSource: ChartDataSource;

  // Axis mappings
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;

  // Series definitions
  series: SeriesConfig[];

  // Data shaping
  groupBy?: string;
  timeGroupBy?: {
    field: string;
    granularity: TimeGranularity;
  };
  aggregation?: AggregationConfig;

  // Cross-store joins
  joins?: JoinConfig[];

  // Filters
  filters?: ChartFilter[];

  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;

  // Visual config
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;

  // Table-specific
  columns?: TableColumn[];

  // Pie-specific
  nameField?: string;
  valueField?: string;
}

// ========== Dashboard Layout ==========

export interface DashboardChartItem {
  type: 'custom';
  chartId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface DefaultChartItem {
  type: 'default';
  id: string;
  componentName: 'WinRateByProduct' | 'WinRateByCustomer' | 'MonthlyActivity' | 'MarginAnalysis';
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export type DashboardItem = DashboardChartItem | DefaultChartItem;

export interface Dashboard {
  id: string;
  name: string;
  items: DashboardItem[];
  createdAt: string;
  updatedAt: string;
}

// ========== Chat / Conversation ==========

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  chartConfig?: ChartConfig;
  timestamp: string;
}

export interface ChartBuilderSession {
  id: string;
  messages: ChatMessage[];
  currentConfig: ChartConfig | null;
  selectedDataSource: ChartDataSource | null;
  selectedChartType: ChartType | null;
  status: 'idle' | 'loading' | 'error';
  error?: string;
}

// ========== API Route Types ==========

export interface ChartAPIRequest {
  prompt: string;
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
  dataSource?: ChartDataSource;
  chartType?: ChartType;
  currentConfig?: ChartConfig;
  dataSummary: DataSummary;
}

export interface ChartAPIResponse {
  config: ChartConfig;
  explanation: string;
}

// ========== Data Summary (sent to AI) ==========

export interface FieldStats {
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  uniqueValues?: number;
  topValues?: { value: string; count: number }[];
  min?: number | string;
  max?: number | string;
  mean?: number;
}

export interface DataSummary {
  source: ChartDataSource;
  schema: Record<string, string>;
  rowCount: number;
  sampleRows: Record<string, unknown>[];
  fieldStats: Record<string, FieldStats>;
}
