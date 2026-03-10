'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TimerOffIcon from '@mui/icons-material/TimerOff';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import EmptyState from '@/components/shared/EmptyState';
import { useActivityStore } from '@/stores/activityStore';
import { format } from 'date-fns';
import type { ActivityAction } from '@/types';

interface DealActivityLogProps {
  dealId: string;
}

const actionIcons: Record<ActivityAction, React.ReactNode> = {
  deal_created: <AddCircleOutlineIcon color="primary" />,
  offer_created: <AddCircleOutlineIcon color="info" />,
  offer_sent: <SendIcon color="primary" />,
  offer_approved: <CheckCircleIcon color="success" />,
  offer_rejected: <CancelIcon color="error" />,
  offer_expired: <TimerOffIcon color="disabled" />,
  order_created: <ShoppingCartIcon color="success" />,
  pdf_generated: <PictureAsPdfIcon color="action" />,
  status_changed: <SwapHorizIcon color="warning" />,
  note_added: <NoteAddIcon color="info" />,
  deal_updated: <SwapHorizIcon color="action" />,
  deal_deleted: <CancelIcon color="error" />,
};

const actionLabels: Record<ActivityAction, string> = {
  deal_created: 'Deal Created',
  deal_updated: 'Deal Updated',
  deal_deleted: 'Deal Deleted',
  offer_created: 'Offer Created',
  offer_sent: 'Offer Sent',
  offer_approved: 'Offer Approved',
  offer_rejected: 'Offer Rejected',
  offer_expired: 'Offer Expired',
  order_created: 'Order Created',
  pdf_generated: 'PDF Generated',
  status_changed: 'Status Changed',
  note_added: 'Note Added',
};

export default function DealActivityLog({ dealId }: DealActivityLogProps) {
  const getActivitiesByDeal = useActivityStore((s) => s.getActivitiesByDeal);

  const activities = useMemo(() => {
    return getActivitiesByDeal(dealId).sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp)
    );
  }, [getActivitiesByDeal, dealId]);

  if (activities.length === 0) {
    return <EmptyState message="No activity recorded for this deal yet." />;
  }

  return (
    <Paper variant="outlined">
      <List disablePadding>
        {activities.map((activity, index) => {
          const timestamp = new Date(activity.timestamp);
          const isValidDate = !isNaN(timestamp.getTime());

          return (
            <Box key={activity.id}>
              {index > 0 && <Divider component="li" />}
              <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                  {actionIcons[activity.action] ?? <SwapHorizIcon color="action" />}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {actionLabels[activity.action] ?? activity.action}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        by {activity.userId}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {activity.details}
                      </Typography>
                      {isValidDate && (
                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                          {format(timestamp, 'MMM d, yyyy \'at\' h:mm a')}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            </Box>
          );
        })}
      </List>
    </Paper>
  );
}
