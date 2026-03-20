'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Popover from '@mui/material/Popover';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { alpha } from '@mui/material/styles';
import GlobalSearch from './GlobalSearch';
import NotificationPanel from '@/components/notifications/NotificationPanel';
import { useReminderStore } from '@/stores/reminderStore';
import { useNotificationStore } from '@/stores/notificationStore';

interface TopBarProps {
  onMenuClick?: () => void;
  onMenuToggle?: () => void;
  currentRole: string;
  currentUser: string;
}

export default function TopBar({ onMenuClick, onMenuToggle, currentRole, currentUser }: TopBarProps) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<HTMLElement | null>(null);
  const notifPanelOpen = Boolean(notifAnchorEl);
  const reminders = useReminderStore((s) => s.reminders);
  const notificationCount = useNotificationStore((s) => s.getActiveCount());

  const activeReminders = reminders.filter((r) => r.status === 'active').length;
  const badgeCount = notificationCount + activeReminders;
  const initials = currentUser
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const roleLabel = currentRole === 'account_manager' ? 'Account Manager' : 'Sales Manager';

  const handleMenuClick = onMenuClick || onMenuToggle;

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: 'white',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: (theme) => theme.zIndex.drawer - 1,
          width: { xs: '100%', md: 'calc(100% - 260px)' },
          ml: { xs: 0, md: '260px' },
        }}
      >
        <Toolbar sx={{ px: { xs: 1, sm: 2, md: 3 }, minHeight: { xs: 56, md: 64 } }}>
          <IconButton
            edge="start"
            onClick={handleMenuClick}
            sx={{ mr: { xs: 1, sm: 2 }, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flex: 1 }} />

          {/* Desktop: full search bar */}
          <Box
            onClick={() => setSearchOpen(true)}
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 0.75,
              borderRadius: 2,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
              border: '1px solid',
              borderColor: 'divider',
              cursor: 'pointer',
              minWidth: { sm: 180, md: 240 },
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              Search...
            </Typography>
            <Typography
              variant="caption"
              sx={{
                px: 0.75,
                py: 0.25,
                borderRadius: 0.5,
                bgcolor: 'action.hover',
                color: 'text.secondary',
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                display: { sm: 'none', md: 'block' },
              }}
            >
              ⌘K
            </Typography>
          </Box>

          {/* Mobile: search icon only */}
          <IconButton
            onClick={() => setSearchOpen(true)}
            size="small"
            sx={{
              display: { xs: 'flex', sm: 'none' },
              color: 'text.secondary',
            }}
          >
            <SearchIcon />
          </IconButton>

          <Box sx={{ flex: 1 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
            <IconButton
              onClick={(e) => setNotifAnchorEl(e.currentTarget)}
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              <Badge
                badgeContent={badgeCount}
                color="error"
                max={99}
              >
                <NotificationsIcon fontSize="small" />
              </Badge>
            </IconButton>

            <IconButton
              onClick={(e) => setProfileAnchor(e.currentTarget)}
              size="small"
              sx={{ ml: { xs: 0, sm: 0.5 } }}
            >
              <Avatar
                sx={{
                  width: { xs: 28, sm: 32 },
                  height: { xs: 28, sm: 32 },
                  bgcolor: 'primary.main',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                {initials}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <NotificationPanel open={notifPanelOpen} onClose={() => setNotifAnchorEl(null)} anchorEl={notifAnchorEl} />

      {/* Profile Popover */}
      <Popover
        open={Boolean(profileAnchor)}
        anchorEl={profileAnchor}
        onClose={() => setProfileAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { width: 280, mt: 1, borderRadius: 2 },
          },
        }}
      >
        <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 44,
              height: 44,
              bgcolor: 'primary.main',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>
              {currentUser}
            </Typography>
            <Chip
              label={roleLabel}
              size="small"
              color={currentRole === 'account_manager' ? 'primary' : 'secondary'}
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem', mt: 0.25 }}
            />
          </Box>
        </Box>
        <Divider />
        <List disablePadding sx={{ py: 0.5 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                setProfileAnchor(null);
                router.push('/settings');
              }}
              sx={{ py: 1, px: 2.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Profile & Role"
                primaryTypographyProps={{ fontSize: '0.875rem' }}
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                setProfileAnchor(null);
                router.push('/settings');
              }}
              sx={{ py: 1, px: 2.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Settings"
                primaryTypographyProps={{ fontSize: '0.875rem' }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Popover>
    </>
  );
}
