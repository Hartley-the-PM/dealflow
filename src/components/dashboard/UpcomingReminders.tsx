'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import NextLink from 'next/link';
import { format } from 'date-fns';
import { useReminderStore } from '@/stores/reminderStore';
import { useHydration } from '@/hooks/useHydration';
import StatusChip from '@/components/shared/StatusChip';
import type { ReminderStatus } from '@/types';

const reminderStatusColors: Record<ReminderStatus, { bg: string; color: string }> = {
  active: { bg: '#DBEAFE', color: '#1D4ED8' },
  done: { bg: '#D1FAE5', color: '#059669' },
  snoozed: { bg: '#FEF3C7', color: '#D97706' },
};

export default function UpcomingReminders() {
  const hydrated = useHydration();
  const getUpcoming = useReminderStore((s) => s.getUpcoming);

  if (!hydrated) {
    return (
      <Card variant="outlined" sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton width={180} height={28} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={40} sx={{ mb: 1 }} />
          <Skeleton variant="rounded" height={40} sx={{ mb: 1 }} />
          <Skeleton variant="rounded" height={40} />
        </CardContent>
      </Card>
    );
  }

  const upcoming = getUpcoming(14);

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ pb: 1 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Upcoming Reminders
        </Typography>
        {upcoming.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No upcoming reminders
          </Typography>
        ) : (
          <List disablePadding>
            {upcoming.map((reminder) => {
              const href = reminder.type === 'customer'
                ? `/customers/${reminder.targetId}`
                : `/products/${reminder.targetId}`;

              const statusStyle = reminderStatusColors[reminder.status] || reminderStatusColors.active;

              return (
                <ListItem key={reminder.id} disablePadding divider>
                  <ListItemButton
                    component={NextLink}
                    href={href}
                    sx={{ px: 1, py: 1 }}
                  >
                    <ListItemText
                      primary={reminder.title}
                      secondary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography component="span" variant="caption" color="text.secondary">
                            {reminder.targetName}
                          </Typography>
                          <Typography component="span" variant="caption" color="text.secondary">
                            {format(new Date(reminder.dueDate), 'MMM d, yyyy')}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box
                      sx={{
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        bgcolor: statusStyle.bg,
                        color: statusStyle.color,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        ml: 1,
                      }}
                    >
                      {reminder.status}
                    </Box>
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
