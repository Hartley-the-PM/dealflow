'use client';

import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import IconButton from '@mui/material/IconButton';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import WinRateByProduct from './WinRateByProduct';
import WinRateByCustomer from './WinRateByCustomer';
import MonthlyActivity from './MonthlyActivity';
import MarginAnalysis from './MarginAnalysis';
import type { Offer, Deal, Customer } from '@/types';

const TITLES: Record<string, string> = {
  WinRateByProduct: 'Win Rate by Product',
  WinRateByCustomer: 'Win Rate by Customer',
  MonthlyActivity: 'Monthly Activity',
  MarginAnalysis: 'Margin Analysis',
};

interface DefaultChartWrapperProps {
  componentName: 'WinRateByProduct' | 'WinRateByCustomer' | 'MonthlyActivity' | 'MarginAnalysis';
  filteredOffers: Offer[];
  deals: Deal[];
  customers: Customer[];
  onRemove?: () => void;
}

export default function DefaultChartWrapper({
  componentName,
  filteredOffers,
  deals,
  customers,
  onRemove,
}: DefaultChartWrapperProps) {
  const [hover, setHover] = useState(false);

  const renderChart = () => {
    switch (componentName) {
      case 'WinRateByProduct':
        return <WinRateByProduct offers={filteredOffers} />;
      case 'WinRateByCustomer':
        return <WinRateByCustomer offers={filteredOffers} deals={deals} customers={customers} />;
      case 'MonthlyActivity':
        return <MonthlyActivity offers={filteredOffers} />;
      case 'MarginAnalysis':
        return <MarginAnalysis offers={filteredOffers} />;
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Box
        className="drag-handle"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1,
          pt: 0.5,
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <DragIndicatorIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.secondary">
            {TITLES[componentName] ?? componentName}
          </Typography>
        </Box>
        {hover && onRemove && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' }, p: 0.25 }}
          >
            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Box>
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {renderChart()}
      </Box>
    </Box>
  );
}
