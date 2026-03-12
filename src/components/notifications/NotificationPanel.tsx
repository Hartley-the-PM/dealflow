'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import SnoozeIcon from '@mui/icons-material/Snooze';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonIcon from '@mui/icons-material/Person';
import { useNotificationStore } from '@/stores/notificationStore';
import type { Notification, NotificationCategory, NotificationPriority } from '@/types/notification';

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

const priorityColors: Record<NotificationPriority, string> = {
  low: '#6B7280',
  medium: '#2563EB',
  high: '#D97706',
  critical: '#DC2626',
};

const categoryIcons: Record<NotificationCategory, React.ReactNode> = {
  time_based: <AccessTimeIcon fontSize="small" />,
  status_based: <ErrorOutlineIcon fontSize="small" />,
  pricing: <AttachMoneyIcon fontSize="small" />,
  milestone: <EmojiEventsIcon fontSize="small" />,
  buyer: <PersonIcon fontSize="small" />,
};

function groupByDay(notifications: Notification[]): Map<string, Notification[]> {
  const groups = new Map<string, Notification[]>();
  notifications.forEach((n) => {
    const day = new Date(n.createdAt).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    const list = groups.get(day) || [];
    list.push(n);
    groups.set(day, list);
  });
  return groups;
}

export default function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const notifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const snooze = useNotificationStore((s) => s.snooze);
  const dismiss = useNotificationStore((s) => s.dismiss);

  const activeNotifications = useMemo(
    () => notifications.filter((n) => n.status !== 'dismissed'),
    [notifications]
  );

  const filtered = useMemo(() => {
    switch (tab) {
      case 1:
        return activeNotifications.filter((n) => n.status === 'unread');
      case 2:
        return activeNotifications.filter(
          (n) => n.category === 'time_based' || n.category === 'status_based' || n.category === 'milestone' || n.category === 'buyer'
        );
      case 3:
        return activeNotifications.filter((n) => n.category === 'pricing');
      default:
        return activeNotifications;
    }
  }, [activeNotifications, tab]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);
  const unreadCount = activeNotifications.filter((n) => n.status === 'unread').length;

  const handleClick = (notification: Notification) => {
    if (notification.status === 'unread') {
      markRead(notification.id);
    }
    if (notification.dealId) {
      router.push(`/deals/${notification.dealId}`);
      onClose();
    } else if (notification.offerId) {
      onClose();
    }
  };

  const handleSnooze = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    snooze(id, tomorrow.toISOString());
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: { sx: { width: { xs: '100%', sm: 420 } } },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" fontWeight={700}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip label={unreadCount} size="small" color="error" sx={{ height: 22, fontSize: 11 }} />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {unreadCount > 0 && (
              <Tooltip title="Mark all as read">
                <IconButton size="small" onClick={markAllRead}>
                  <DoneAllIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 40, '& .MuiTab-root': { minHeight: 40, py: 0, fontSize: '0.8rem' } }}
        >
          <Tab label="All" />
          <Tab label="Unread" />
          <Tab label="Deals" />
          <Tab label="Pricing" />
        </Tabs>

        {/* Notification List */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
          {filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary" variant="body2">
                No notifications
              </Typography>
            </Box>
          ) : (
            Array.from(grouped.entries()).map(([day, items]) => (
              <Box key={day} sx={{ mt: 1.5 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ px: 1, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem' }}
                >
                  {day}
                </Typography>
                {items.map((n) => (
                  <Box
                    key={n.id}
                    onClick={() => handleClick(n)}
                    sx={{
                      display: 'flex',
                      gap: 1.5,
                      p: 1.5,
                      mx: 0.5,
                      mt: 0.5,
                      borderRadius: 1.5,
                      cursor: n.dealId ? 'pointer' : 'default',
                      bgcolor: n.status === 'unread' ? 'action.hover' : 'transparent',
                      '&:hover': { bgcolor: 'action.selected' },
                      borderLeft: '3px solid',
                      borderLeftColor: priorityColors[n.priority],
                    }}
                  >
                    <Box sx={{ color: priorityColors[n.priority], mt: 0.25 }}>
                      {categoryIcons[n.category]}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={n.status === 'unread' ? 600 : 400} noWrap>
                        {n.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                        {n.message}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', mt: 0.25, display: 'block' }}>
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      <Tooltip title="Snooze 1 day">
                        <IconButton size="small" onClick={(e) => handleSnooze(e, n.id)} sx={{ opacity: 0.4, '&:hover': { opacity: 1 } }}>
                          <SnoozeIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Dismiss">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismiss(n.id);
                          }}
                          sx={{ opacity: 0.4, '&:hover': { opacity: 1 } }}
                        >
                          <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
