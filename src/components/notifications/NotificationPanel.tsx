'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationStore } from '@/stores/notificationStore';
import { useReminderStore } from '@/stores/reminderStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Notification, NotificationCategory } from '@/types/notification';

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
}

const categoryDotColors: Record<NotificationCategory, string> = {
  time_based: '#E97A2B',
  status_based: '#DC2626',
  pricing: '#16A34A',
  milestone: '#9333EA',
  buyer: '#2563EB',
};

type TimeGroup = 'Today' | 'Yesterday' | 'This Week' | 'Earlier';

function getTimeGroup(dateStr: string): TimeGroup {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (date >= today) return 'Today';
  if (date >= yesterday) return 'Yesterday';
  if (date >= weekAgo) return 'This Week';
  return 'Earlier';
}

function groupByTimeRange(
  notifications: Notification[]
): { label: TimeGroup; items: Notification[] }[] {
  const order: TimeGroup[] = ['Today', 'Yesterday', 'This Week', 'Earlier'];
  const map = new Map<TimeGroup, Notification[]>();
  order.forEach((g) => map.set(g, []));

  notifications.forEach((n) => {
    const group = getTimeGroup(n.createdAt);
    map.get(group)!.push(n);
  });

  return order
    .filter((g) => map.get(g)!.length > 0)
    .map((g) => ({ label: g, items: map.get(g)! }));
}

export default function NotificationPanel({
  open,
  onClose,
  anchorEl,
}: NotificationPanelProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const notifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const dismiss = useNotificationStore((s) => s.dismiss);
  const reminders = useReminderStore((s) => s.reminders);
  const currentUser = useSettingsStore((s) => s.settings.currentUser);

  const activeNotifications = useMemo(
    () => notifications.filter((n) => n.status !== 'dismissed'),
    [notifications]
  );

  const filtered = useMemo(() => {
    if (tab === 1) {
      return activeNotifications.filter((n) => n.status === 'unread');
    }
    return activeNotifications;
  }, [activeNotifications, tab]);

  const grouped = useMemo(() => groupByTimeRange(filtered), [filtered]);
  const unreadCount = activeNotifications.filter(
    (n) => n.status === 'unread'
  ).length;

  const handleClick = (notification: Notification) => {
    if (notification.status === 'unread') {
      markRead(notification.id);
    }
    if (notification.dealId) {
      router.push(`/deals/${notification.dealId}`);
      onClose();
    }
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dismiss(id);
  };

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: isMobile ? '100%' : 'auto',
        maxHeight: isMobile ? '100%' : 500,
        width: isMobile ? '100%' : 420,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          Notifications
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={markAllRead}
              sx={{
                textTransform: 'none',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: 'primary.main',
                minWidth: 'auto',
                px: 1,
              }}
            >
              Mark all as read
            </Button>
          )}
          {isMobile && (
            <IconButton size="small" onClick={onClose} edge="end">
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          minHeight: 40,
          px: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          '& .MuiTab-root': {
            minHeight: 40,
            py: 0,
            fontSize: '0.8rem',
            minWidth: 'auto',
            px: 1.5,
          },
        }}
      >
        <Tab label="All" />
        <Tab
          label={
            unreadCount > 0
              ? `Unread (${unreadCount})`
              : 'Unread'
          }
        />
      </Tabs>

      {/* Notification List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary" variant="body2">
              {tab === 1
                ? 'No unread notifications'
                : 'No notifications'}
            </Typography>
          </Box>
        ) : (
          grouped.map(({ label, items }) => (
            <Box key={label}>
              {/* Section header */}
              <Box
                sx={{
                  px: 2.5,
                  pt: 2,
                  pb: 0.75,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.65rem',
                    color: 'text.secondary',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </Typography>
                <Divider sx={{ flex: 1 }} />
              </Box>

              {/* Notification rows */}
              {items.map((n) => {
                const isUnread = n.status === 'unread';
                const isHovered = hoveredId === n.id;

                return (
                  <Box
                    key={n.id}
                    onClick={() => handleClick(n)}
                    onMouseEnter={() => setHoveredId(n.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1.5,
                      px: 2.5,
                      py: 1.25,
                      cursor: n.dealId ? 'pointer' : 'default',
                      borderLeft: '3px solid',
                      borderLeftColor: isUnread
                        ? 'primary.main'
                        : 'transparent',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {/* Category dot */}
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor:
                          categoryDotColors[n.category] || '#6B7280',
                        mt: 0.75,
                        flexShrink: 0,
                      }}
                    />

                    {/* Content */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        fontWeight={isUnread ? 600 : 400}
                        noWrap
                        sx={{ lineHeight: 1.4 }}
                      >
                        {n.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.4,
                          mt: 0.25,
                        }}
                      >
                        {n.message}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          color: 'text.disabled',
                          fontSize: '0.65rem',
                          mt: 0.5,
                        }}
                      >
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                        })}
                      </Typography>
                    </Box>

                    {/* Dismiss button (hover only) */}
                    <Box
                      sx={{
                        opacity: isHovered ? 1 : 0,
                        transition: 'opacity 0.15s ease',
                        flexShrink: 0,
                        mt: 0.25,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => handleDismiss(e, n.id)}
                        sx={{
                          width: 24,
                          height: 24,
                          color: 'text.secondary',
                          '&:hover': {
                            color: 'text.primary',
                            bgcolor: 'action.selected',
                          },
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ))
        )}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Button
          size="small"
          onClick={() => {
            router.push('/reminders');
            onClose();
          }}
          sx={{
            textTransform: 'none',
            fontSize: '0.8rem',
            fontWeight: 500,
            color: 'primary.main',
          }}
        >
          View all notifications
        </Button>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Dialog fullScreen open={open} onClose={onClose}>
        {content}
      </Dialog>
    );
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        paper: {
          sx: {
            mt: 1,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          },
        },
      }}
    >
      {content}
    </Popover>
  );
}
