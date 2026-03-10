import Anthropic from '@anthropic-ai/sdk';
import { CHART_SYSTEM_PROMPT } from '@/lib/chartSystemPrompt';
import type { ChartAPIRequest, ChartAPIResponse } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const CHART_CONFIG_TOOL = {
  name: 'generate_chart_config' as const,
  description: 'Generate a chart configuration based on the user request. Returns a structured ChartConfig object that the frontend will render using Recharts.',
  input_schema: {
    type: 'object' as const,
    required: ['title', 'chartType', 'dataSource', 'series'],
    properties: {
      title: { type: 'string' as const, description: 'Chart title displayed above the visualization' },
      description: { type: 'string' as const, description: 'Brief description of what this chart shows' },
      chartType: { type: 'string' as const, enum: ['line', 'bar', 'pie', 'area', 'scatter', 'table'] },
      dataSource: { type: 'string' as const, enum: ['orders', 'offers', 'customers', 'pricing', 'products', 'activities', 'deals'] },
      xAxis: {
        type: 'object' as const,
        properties: {
          field: { type: 'string' as const },
          label: { type: 'string' as const },
          type: { type: 'string' as const, enum: ['category', 'number', 'time'] },
          format: { type: 'string' as const },
        },
        required: ['field'],
      },
      yAxis: {
        type: 'object' as const,
        properties: {
          field: { type: 'string' as const },
          label: { type: 'string' as const },
          type: { type: 'string' as const, enum: ['category', 'number', 'time'] },
          format: { type: 'string' as const },
        },
      },
      series: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          required: ['field', 'label'],
          properties: {
            field: { type: 'string' as const, description: 'The data field name for this series values' },
            label: { type: 'string' as const, description: 'Display label in legend/tooltip' },
            color: { type: 'string' as const, description: 'Hex color code' },
            type: { type: 'string' as const, enum: ['monotone', 'linear', 'step'] },
            aggregation: {
              type: 'object' as const,
              properties: {
                function: { type: 'string' as const, enum: ['count', 'sum', 'avg', 'min', 'max', 'distinct_count'] },
                field: { type: 'string' as const },
              },
              required: ['function', 'field'],
            },
          },
        },
      },
      groupBy: { type: 'string' as const, description: 'Field to group/bucket data by' },
      timeGroupBy: {
        type: 'object' as const,
        properties: {
          field: { type: 'string' as const, description: 'Date field to group by' },
          granularity: { type: 'string' as const, enum: ['day', 'week', 'month', 'quarter', 'year'] },
        },
        required: ['field', 'granularity'],
      },
      aggregation: {
        type: 'object' as const,
        description: 'Global aggregation applied to all series if not defined per-series',
        properties: {
          function: { type: 'string' as const, enum: ['count', 'sum', 'avg', 'min', 'max', 'distinct_count'] },
          field: { type: 'string' as const },
        },
        required: ['function', 'field'],
      },
      joins: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          required: ['source', 'sourceField', 'targetField', 'fields'],
          properties: {
            source: { type: 'string' as const, enum: ['orders', 'offers', 'customers', 'pricing', 'products', 'activities', 'deals'] },
            sourceField: { type: 'string' as const },
            targetField: { type: 'string' as const },
            fields: { type: 'array' as const, items: { type: 'string' as const } },
          },
        },
      },
      filters: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          required: ['field', 'operator', 'value'],
          properties: {
            field: { type: 'string' as const },
            operator: { type: 'string' as const, enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'contains'] },
            value: {},
          },
        },
      },
      sortBy: { type: 'string' as const },
      sortOrder: { type: 'string' as const, enum: ['asc', 'desc'] },
      limit: { type: 'number' as const },
      colors: { type: 'array' as const, items: { type: 'string' as const } },
      showLegend: { type: 'boolean' as const },
      showGrid: { type: 'boolean' as const },
      showTooltip: { type: 'boolean' as const },
      columns: {
        type: 'array' as const,
        description: 'For table chartType only',
        items: {
          type: 'object' as const,
          required: ['field', 'label'],
          properties: {
            field: { type: 'string' as const },
            label: { type: 'string' as const },
            align: { type: 'string' as const, enum: ['left', 'center', 'right'] },
            format: { type: 'string' as const },
          },
        },
      },
      nameField: { type: 'string' as const, description: 'For pie charts: field used as segment name' },
      valueField: { type: 'string' as const, description: 'For pie charts: field used as segment value' },
    },
  },
};

function buildUserPrompt(body: ChartAPIRequest): string {
  let prompt = body.prompt;

  if (body.dataSource) {
    prompt += `\n\nData source selected: ${body.dataSource}`;
  }
  if (body.chartType) {
    prompt += `\nPreferred chart type: ${body.chartType}`;
  }
  if (body.currentConfig) {
    prompt += `\n\nCurrent chart config to refine/update:\n${JSON.stringify(body.currentConfig, null, 2)}`;
  }

  prompt += `\n\nData summary:\n${JSON.stringify(body.dataSummary, null, 2)}`;

  return prompt;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your-key-here') {
      return Response.json(
        { error: 'ANTHROPIC_API_KEY is not configured. Please add your API key to .env.local.' },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });
    const body: ChartAPIRequest = await request.json();

    // Build messages from conversation history + current prompt
    const messages: Anthropic.MessageParam[] = [
      ...body.conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: buildUserPrompt(body),
      },
    ];

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: CHART_SYSTEM_PROMPT,
      messages,
      tools: [CHART_CONFIG_TOOL],
      tool_choice: { type: 'tool' as const, name: 'generate_chart_config' },
    });

    // Extract tool_use result
    const toolBlock = response.content.find((b) => b.type === 'tool_use');
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      return Response.json(
        { error: 'AI did not return a chart configuration.' },
        { status: 500 }
      );
    }

    const configInput = toolBlock.input as Record<string, unknown>;

    // Add id to the config
    const config = {
      ...configInput,
      id: uuidv4(),
    };

    // Extract text explanation if present
    const textBlock = response.content.find((b) => b.type === 'text');
    const explanation = textBlock && textBlock.type === 'text' ? textBlock.text : 'Chart configuration generated.';

    const result: ChartAPIResponse = {
      config: config as unknown as ChartAPIResponse['config'],
      explanation,
    };

    return Response.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Chart AI error:', message);
    return Response.json(
      { error: `Failed to generate chart: ${message}` },
      { status: 500 }
    );
  }
}
