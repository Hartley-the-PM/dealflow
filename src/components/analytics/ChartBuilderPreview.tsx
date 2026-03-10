'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DynamicChart from './DynamicChart';
import { resolveChartData } from '@/lib/chartDataResolver';
import { useDashboardStore } from '@/stores/dashboardStore';

export default function ChartBuilderPreview() {
  const session = useDashboardStore((s) => s.builderSession);
  const activeDashboardId = useDashboardStore((s) => s.activeDashboardId);
  const addChartToDashboard = useDashboardStore((s) => s.addChartToDashboard);
  const closeBuilder = useDashboardStore((s) => s.closeBuilder);

  const config = session.currentConfig;

  const data = useMemo(() => {
    if (!config) return [];
    try {
      return resolveChartData(config);
    } catch {
      return [];
    }
  }, [config]);

  const handleAddToDashboard = () => {
    if (!config) return;
    addChartToDashboard(activeDashboardId, config);
    closeBuilder();
  };

  const handleDiscard = () => {
    closeBuilder();
  };

  if (!config) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 2,
          color: 'text.secondary',
        }}
      >
        <AutoAwesomeIcon sx={{ fontSize: 48, opacity: 0.3 }} />
        <Typography variant="h6" color="text.secondary">
          Chart Preview
        </Typography>
        <Typography variant="body2" color="text.disabled" textAlign="center" maxWidth={300}>
          Describe the chart you want in the chat panel. The AI will generate a preview here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chart Title */}
      <Box sx={{ px: 3, pt: 2, pb: 1 }}>
        <Typography variant="h6">{config.title}</Typography>
        {config.description && (
          <Typography variant="body2" color="text.secondary">
            {config.description}
          </Typography>
        )}
      </Box>

      {/* Chart Preview */}
      <Box sx={{ flex: 1, px: 3, py: 1, overflow: 'auto' }}>
        <Paper variant="outlined" sx={{ p: 2, height: 350 }}>
          <DynamicChart config={config} data={data} height={310} />
        </Paper>

        {/* Data Info */}
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            Data source: <strong>{config.dataSource}</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Chart type: <strong>{config.chartType}</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Data points: <strong>{data.length}</strong>
          </Typography>
        </Box>
      </Box>

      {/* Actions */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1.5,
        }}
      >
        <Button variant="outlined" onClick={handleDiscard} color="inherit">
          Discard
        </Button>
        <Button variant="contained" onClick={handleAddToDashboard}>
          Add to Dashboard
        </Button>
      </Box>
    </Box>
  );
}
