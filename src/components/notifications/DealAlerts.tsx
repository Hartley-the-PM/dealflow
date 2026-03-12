'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useNotificationStore } from '@/stores/notificationStore';
import type { NotificationPriority } from '@/types/notification';

interface DealAlertsProps {
  dealId: string;
  compact?: boolean;
}

const priorityToSeverity: Record<NotificationPriority, 'error' | 'warning' | 'info' | 'success'> = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'success',
};

export default function DealAlerts({ dealId, compact = false }: DealAlertsProps) {
  const notifications = useNotificationStore((s) => s.notifications);

  const dealAlerts = useMemo(
    () =>
      notifications.filter(
        (n) => n.dealId === dealId && n.status !== 'dismissed' && n.status !== 'snoozed'
      ),
    [notifications, dealId]
  );

  if (dealAlerts.length === 0) return null;

  if (compact) {
    const tooltipContent = dealAlerts
      .slice(0, 5)
      .map((a) => a.title)
      .join('\n');
    const suffix = dealAlerts.length > 5 ? `\n+${dealAlerts.length - 5} more` : '';

    return (
      <Tooltip title={<Typography variant="caption" sx={{ whiteSpace: 'pre-line' }}>{tooltipContent + suffix}</Typography>}>
        <IconButton size="small" sx={{ color: 'warning.main' }}>
          <WarningAmberIcon fontSize="small" />
          {dealAlerts.length > 1 && (
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                top: -2,
                right: -2,
                bgcolor: 'error.main',
                color: 'white',
                borderRadius: '50%',
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.6rem',
                fontWeight: 700,
              }}
            >
              {dealAlerts.length}
            </Typography>
          )}
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
      {dealAlerts.slice(0, 5).map((alert) => (
        <Alert
          key={alert.id}
          severity={priorityToSeverity[alert.priority]}
          sx={{ py: 0, '& .MuiAlert-message': { fontSize: '0.8rem' } }}
        >
          <strong>{alert.title}:</strong> {alert.message}
        </Alert>
      ))}
      {dealAlerts.length > 5 && (
        <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
          +{dealAlerts.length - 5} more alerts
        </Typography>
      )}
    </Box>
  );
}
