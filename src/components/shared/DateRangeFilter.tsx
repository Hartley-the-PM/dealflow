'use client';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface DateRangeFilterProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartChange: (date: Date | null) => void;
  onEndChange: (date: Date | null) => void;
  views?: ('year' | 'month' | 'day')[];
  format?: string;
  label?: string;
}

export default function DateRangeFilter({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  views = ['year', 'month'],
  format = 'MMM yyyy',
  label = 'Date Range',
}: DateRangeFilterProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 1.5,
          py: 0.5,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
          '&:hover': { borderColor: 'text.primary' },
          transition: 'border-color 0.2s',
        }}
      >
        <DatePicker
          value={startDate}
          onChange={onStartChange}
          views={views}
          format={format}
          maxDate={endDate ?? undefined}
          slotProps={{
            textField: {
              size: 'small',
              variant: 'standard',
              placeholder: 'Start',
              sx: { width: 120 },
              InputProps: { disableUnderline: true },
            },
          }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ userSelect: 'none' }}>
          —
        </Typography>
        <DatePicker
          value={endDate}
          onChange={onEndChange}
          views={views}
          format={format}
          minDate={startDate ?? undefined}
          slotProps={{
            textField: {
              size: 'small',
              variant: 'standard',
              placeholder: 'End',
              sx: { width: 120 },
              InputProps: { disableUnderline: true },
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
}
