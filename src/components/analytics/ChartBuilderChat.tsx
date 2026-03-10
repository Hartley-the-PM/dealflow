'use client';

import { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import SendIcon from '@mui/icons-material/Send';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import AreaChartIcon from '@mui/icons-material/StackedLineChart';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import TableChartIcon from '@mui/icons-material/TableChart';
import { useDashboardStore } from '@/stores/dashboardStore';
import { buildDataSummary } from '@/lib/dataSummaryBuilder';
import { v4 as uuidv4 } from 'uuid';
import type { ChartDataSource, ChartType, ChatMessage, ChartAPIRequest } from '@/types';

const DATA_SOURCE_OPTIONS: { value: ChartDataSource; label: string }[] = [
  { value: 'offers', label: 'Offers' },
  { value: 'orders', label: 'Orders' },
  { value: 'deals', label: 'Deals' },
  { value: 'customers', label: 'Customers' },
  { value: 'products', label: 'Products' },
  { value: 'pricing', label: 'Pricing (MSP)' },
  { value: 'activities', label: 'Activities' },
];

const CHART_TYPE_OPTIONS: { value: ChartType; icon: React.ReactNode; label: string }[] = [
  { value: 'bar', icon: <BarChartIcon fontSize="small" />, label: 'Bar' },
  { value: 'line', icon: <ShowChartIcon fontSize="small" />, label: 'Line' },
  { value: 'pie', icon: <PieChartIcon fontSize="small" />, label: 'Pie' },
  { value: 'area', icon: <AreaChartIcon fontSize="small" />, label: 'Area' },
  { value: 'scatter', icon: <ScatterPlotIcon fontSize="small" />, label: 'Scatter' },
  { value: 'table', icon: <TableChartIcon fontSize="small" />, label: 'Table' },
];

export default function ChartBuilderChat() {
  const session = useDashboardStore((s) => s.builderSession);
  const addMessage = useDashboardStore((s) => s.addMessage);
  const setCurrentConfig = useDashboardStore((s) => s.setCurrentConfig);
  const setBuilderDataSource = useDashboardStore((s) => s.setBuilderDataSource);
  const setBuilderChartType = useDashboardStore((s) => s.setBuilderChartType);
  const setBuilderStatus = useDashboardStore((s) => s.setBuilderStatus);
  const setBuilderError = useDashboardStore((s) => s.setBuilderError);

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages]);

  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt || !session.selectedDataSource) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg);
    setInput('');
    setBuilderStatus('loading');

    try {
      // Build data summary
      const dataSummary = buildDataSummary(session.selectedDataSource);

      // Build conversation history (only text, not configs)
      const conversationHistory = session.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const requestBody: ChartAPIRequest = {
        prompt,
        conversationHistory,
        dataSource: session.selectedDataSource,
        chartType: session.selectedChartType ?? undefined,
        currentConfig: session.currentConfig ?? undefined,
        dataSummary,
      };

      const response = await fetch('/api/ai/chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to generate chart');
      }

      // Add assistant message
      const assistantMsg: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: data.explanation,
        chartConfig: data.config,
        timestamp: new Date().toISOString(),
      };
      addMessage(assistantMsg);
      setCurrentConfig(data.config);
      setBuilderStatus('idle');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setBuilderError(message);

      const errorMsg: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `Error: ${message}`,
        timestamp: new Date().toISOString(),
      };
      addMessage(errorMsg);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Selectors */}
      <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <FormControl size="small" fullWidth>
          <InputLabel>Data Source</InputLabel>
          <Select
            value={session.selectedDataSource ?? ''}
            label="Data Source"
            onChange={(e) => setBuilderDataSource(e.target.value as ChartDataSource)}
          >
            {DATA_SOURCE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Chart Type (optional)
          </Typography>
          <ToggleButtonGroup
            value={session.selectedChartType}
            exclusive
            onChange={(_, val) => setBuilderChartType(val)}
            size="small"
            fullWidth
          >
            {CHART_TYPE_OPTIONS.map((opt) => (
              <ToggleButton key={opt.value} value={opt.value} sx={{ textTransform: 'none', gap: 0.5, fontSize: 12, px: 1 }}>
                {opt.icon}
                {opt.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 1 }}>
        {session.messages.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Select a data source, then describe the chart you want to create.
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
              Example: &quot;Show me a bar chart of offer count by status&quot;
            </Typography>
          </Box>
        )}

        {session.messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 1.5,
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                px: 2,
                py: 1,
                maxWidth: '85%',
                bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.50',
                color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {msg.content}
              </Typography>
            </Paper>
          </Box>
        ))}

        {session.status === 'loading' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              Generating chart...
            </Typography>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box sx={{ px: 2, pb: 2, pt: 1, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={session.selectedDataSource ? 'Describe the chart you want...' : 'Select a data source first'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={!session.selectedDataSource || session.status === 'loading'}
            multiline
            maxRows={3}
          />
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={!input.trim() || !session.selectedDataSource || session.status === 'loading'}
            sx={{ minWidth: 44, px: 1 }}
          >
            <SendIcon fontSize="small" />
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
