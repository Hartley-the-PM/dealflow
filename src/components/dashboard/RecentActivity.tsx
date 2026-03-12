'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TimerOffIcon from '@mui/icons-material/TimerOff';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CommentIcon from '@mui/icons-material/Comment';
import NextLink from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useActivityStore } from '@/stores/activityStore';
import { useHydration } from '@/hooks/useHydration';
import type { ActivityAction } from '@/types';

const actionIcons: Record<ActivityAction, React.ReactNode> = {
  deal_created: <AddCircleIcon color="primary" />,
  offer_created: <NoteAddIcon color="primary" />,
  offer_sent: <SendIcon sx={{ color: '#1D4ED8' }} />,
  offer_approved: <CheckCircleIcon sx={{ color: '#059669' }} />,
  offer_rejected: <CancelIcon sx={{ color: '#DC2626' }} />,
  offer_expired: <TimerOffIcon sx={{ color: '#9CA3AF' }} />,
  order_created: <ShoppingCartIcon sx={{ color: '#7C3AED' }} />,
  pdf_generated: <PictureAsPdfIcon sx={{ color: '#D97706' }} />,
  status_changed: <SwapHorizIcon color="action" />,
  note_added: <CommentIcon color="action" />,
  deal_updated: <SwapHorizIcon color="action" />,
  deal_deleted: <CancelIcon sx={{ color: '#DC2626' }} />,
  offer_shared: <SendIcon sx={{ color: '#7C3AED' }} />,
  buyer_accepted: <CheckCircleIcon sx={{ color: '#059669' }} />,
  buyer_rejected: <CancelIcon sx={{ color: '#DC2626' }} />,
  buyer_counter_proposed: <SwapHorizIcon sx={{ color: '#D97706' }} />,
};

export default function RecentActivity() {
  const hydrated = useHydration();
  const getRecentActivities = useActivityStore((s) => s.getRecentActivities);

  if (!hydrated) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Skeleton width={160} height={28} sx={{ mb: 2 }} />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={48} sx={{ mb: 1 }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  const activities = getRecentActivities(10);

  return (
    <Card variant="outlined">
      <CardContent sx={{ pb: 1 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Recent Activity
        </Typography>
        {activities.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No recent activity
          </Typography>
        ) : (
          <List disablePadding>
            {activities.map((activity) => {
              const icon = actionIcons[activity.action] ?? <SwapHorizIcon color="action" />;
              const timeAgo = formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true });
              const href = activity.dealId ? `/deals/${activity.dealId}` : undefined;

              const content = (
                <>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={activity.details}
                    secondary={timeAgo}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </>
              );

              return href ? (
                <ListItemButton
                  key={activity.id}
                  component={NextLink}
                  href={href}
                  divider
                  sx={{ px: 1 }}
                >
                  {content}
                </ListItemButton>
              ) : (
                <ListItemButton
                  key={activity.id}
                  divider
                  sx={{ px: 1, cursor: 'default' }}
                  disableRipple
                >
                  {content}
                </ListItemButton>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
