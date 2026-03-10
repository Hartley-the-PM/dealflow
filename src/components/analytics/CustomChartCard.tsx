'use client';

import { useMemo, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DynamicChart from './DynamicChart';
import { resolveChartData } from '@/lib/chartDataResolver';
import type { ChartConfig } from '@/types';

interface CustomChartCardProps {
  config: ChartConfig;
  onDelete?: () => void;
}

export default function CustomChartCard({ config, onDelete }: CustomChartCardProps) {
  const [hover, setHover] = useState(false);

  const data = useMemo(() => {
    try {
      return resolveChartData(config);
    } catch {
      return [];
    }
  }, [config]);

  return (
    <Card
      variant="outlined"
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Box
        className="drag-handle"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          pt: 1.5,
          pb: 0.5,
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <DragIndicatorIcon sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0 }} />
          <Typography variant="subtitle2" noWrap>
            {config.title}
          </Typography>
        </Box>
        {hover && onDelete && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      <CardContent sx={{ flex: 1, pt: 0, pb: '8px !important', overflow: 'hidden' }}>
        <DynamicChart config={config} data={data} height={undefined} />
      </CardContent>
    </Card>
  );
}
