'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import HandshakeIcon from '@mui/icons-material/Handshake';
import InventoryIcon from '@mui/icons-material/Inventory';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import GroupsIcon from '@mui/icons-material/Groups';
import LogoutIcon from '@mui/icons-material/Logout';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ScienceIcon from '@mui/icons-material/Science';
import LabelIcon from '@mui/icons-material/Label';
import FolderIcon from '@mui/icons-material/Folder';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAgentStore } from '@/stores/agentStore';

const DRAWER_WIDTH = 260;
const ACTIVE_BG = '#FFF7ED';
const ACTIVE_COLOR = '#E97A2B';

const salesItems = [
  { label: 'Workspace', href: '/workspace', icon: <DashboardIcon /> },
  { label: 'Pipeline', href: '/deals', icon: <HandshakeIcon /> },
  { label: 'Customers', href: '/customers', icon: <PeopleIcon /> },
  { label: 'Catalog', href: '/products', icon: <InventoryIcon /> },
];

const productMgmtItems = [
  { label: 'White Labelling', href: '/white-labelling', icon: <LabelIcon /> },
  { label: 'Formulations', href: '/formulations', icon: <ScienceIcon /> },
];

const systemItems = [
  { label: 'Document Manager', href: '/documents', icon: <FolderIcon /> },
  { label: 'Integrations', href: '/integrations', icon: <IntegrationInstructionsIcon /> },
  { label: 'Settings', href: '/settings', icon: <SettingsIcon /> },
];

function NavItem({ label, href, icon, isActive, onClick }: { label: string; href: string; icon: React.ReactNode; isActive: boolean; onClick?: () => void }) {
  return (
    <ListItem disablePadding sx={{ mb: 0.25 }}>
      <ListItemButton
        component={Link}
        href={href}
        onClick={onClick}
        sx={{
          borderRadius: 2,
          py: 0.75,
          px: 1.5,
          bgcolor: isActive ? ACTIVE_BG : 'transparent',
          '&:hover': {
            bgcolor: isActive ? ACTIVE_BG : '#F9FAFB',
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 36,
            color: isActive ? ACTIVE_COLOR : '#9CA3AF',
          }}
        >
          {icon}
        </ListItemIcon>
        <ListItemText
          primary={label}
          primaryTypographyProps={{
            fontSize: '0.875rem',
            fontWeight: isActive ? 600 : 400,
            color: isActive ? '#111827' : '#374151',
          }}
        />
      </ListItemButton>
    </ListItem>
  );
}

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ open = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });
  const settings = useSettingsStore((s) => s.settings);
  const agents = useAgentStore((s) => s.agents);
  const allDrafts = useAgentStore((s) => s.drafts);
  const pendingCount = allDrafts.filter((d) => d.status === 'pending').length;
  const [pipelineExpanded, setPipelineExpanded] = useState(true);
  const initials = settings.currentUser
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
  const roleLabel = settings.currentRole === 'account_manager' ? 'Account Manager' : 'Sales Manager';

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  // Close the drawer on mobile when a nav item is clicked
  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#FFFFFF' }}>
      {/* Logo */}
      <Box component={Link} href="/workspace" onClick={handleNavClick} sx={{ px: 2, py: 2.5, display: 'block', textDecoration: 'none' }}>
        <svg width="180" height="58" viewBox="0 0 251 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M69 23.3885C69 29.6782 63.967 34.777 57.7585 34.777C51.5499 34.777 46.5169 29.6782 46.5169 23.3885C46.5169 17.0988 51.5499 12 57.7585 12C63.967 12 69 17.0988 69 23.3885Z" fill="url(#vl0)"/>
          <path d="M22.2415 12C28.4501 12 33.4831 17.0988 33.4831 23.3885C33.4831 24.0405 33.4288 24.6796 33.3249 25.3016C31.5414 37.1393 30.2383 40.4851 44.5437 45.9823C48.9834 47.9812 51.4498 52.2896 51.4498 56.4768C51.4498 62.4737 46.5169 68.4705 38.6243 67.9708C33.1981 66.9713 29.2517 63.4731 28.7585 56.9765C28.7585 55.6443 28.9415 54.3272 29.2504 53.0313C31.9809 41.5732 29.6427 37.8139 19.0155 34.3009C14.3792 32.8963 11 28.5423 11 23.3885C11 17.0988 16.033 12 22.2415 12Z" fill="url(#vl1)"/>
          <path d="M225.675 35.2676H220.523V31.0676H225.675V23.0596H230.267V31.0676H237.491V35.2676H230.267V52.1236C230.267 53.3182 230.491 54.1769 230.939 54.6996C231.425 55.1849 232.246 55.4276 233.403 55.4276H238.387V59.6276H233.123C230.435 59.6276 228.513 59.0302 227.355 57.8356C226.235 56.6409 225.675 54.7556 225.675 52.1796V35.2676Z" fill="#1F1F1F"/>
          <path d="M207.221 30.7314C210.693 30.7314 213.474 31.7768 215.565 33.8674C217.693 35.9581 218.757 39.2434 218.757 43.7234V59.6274H214.165V44.0034C214.165 41.0541 213.493 38.8141 212.149 37.2834C210.842 35.7154 208.938 34.9314 206.437 34.9314C203.749 34.9314 201.639 35.8648 200.109 37.7314C198.578 39.5981 197.813 42.1368 197.813 45.3474V59.6274H193.221V31.0674H197.197L197.813 34.9314C199.978 32.1314 203.114 30.7314 207.221 30.7314Z" fill="#1F1F1F"/>
          <path d="M161.717 45.3474C161.717 42.4354 162.277 39.8781 163.397 37.6754C164.554 35.4728 166.159 33.7741 168.213 32.5794C170.266 31.3474 172.618 30.7314 175.269 30.7314C177.882 30.7314 180.197 31.2728 182.213 32.3554C184.229 33.4381 185.815 35.0061 186.973 37.0594C188.13 39.1128 188.746 41.5208 188.821 44.2834C188.821 44.6941 188.783 45.3474 188.709 46.2434H166.533V46.6354C166.607 49.4354 167.466 51.6754 169.109 53.3554C170.751 55.0354 172.898 55.8754 175.549 55.8754C177.602 55.8754 179.338 55.3714 180.757 54.3634C182.213 53.3181 183.183 51.8808 183.669 50.0514H188.317C187.757 52.9634 186.357 55.3528 184.117 57.2194C181.877 59.0488 179.133 59.9634 175.885 59.9634C173.047 59.9634 170.565 59.3661 168.437 58.1714C166.309 56.9394 164.647 55.2221 163.453 53.0194C162.295 50.7794 161.717 48.2221 161.717 45.3474ZM184.061 42.4354C183.837 40.0088 182.922 38.1234 181.317 36.7794C179.749 35.4354 177.751 34.7634 175.325 34.7634C173.159 34.7634 171.255 35.4728 169.613 36.8914C167.97 38.3101 167.037 40.1581 166.813 42.4354H184.061Z" fill="#1F1F1F"/>
          <path d="M152.683 20.4277H157.275V59.6277H152.683V20.4277Z" fill="#1F1F1F"/>
          <path d="M144.936 20.0361C145.794 20.0361 146.504 20.3161 147.064 20.8761C147.624 21.4361 147.904 22.1455 147.904 23.0041C147.904 23.8628 147.624 24.5721 147.064 25.1321C146.504 25.6921 145.794 25.9721 144.936 25.9721C144.077 25.9721 143.368 25.6921 142.808 25.1321C142.248 24.5721 141.968 23.8628 141.968 23.0041C141.968 22.1455 142.248 21.4361 142.808 20.8761C143.368 20.3161 144.077 20.0361 144.936 20.0361ZM142.64 31.0681H147.232V59.6281H142.64V31.0681Z" fill="#1F1F1F"/>
          <path d="M139.95 55.4274V59.6274H137.43C135.6 59.6274 134.294 59.2541 133.51 58.5074C132.726 57.7608 132.315 56.6594 132.278 55.2034C130.075 58.3768 126.883 59.9634 122.702 59.9634C119.528 59.9634 116.971 59.2168 115.03 57.7234C113.126 56.2301 112.174 54.1954 112.174 51.6194C112.174 48.7448 113.144 46.5421 115.086 45.0114C117.064 43.4808 119.92 42.7154 123.654 42.7154H132.054V40.7554C132.054 38.8888 131.419 37.4328 130.15 36.3874C128.918 35.3421 127.182 34.8194 124.942 34.8194C122.963 34.8194 121.32 35.2674 120.014 36.1634C118.744 37.0221 117.96 38.1794 117.662 39.6354H113.07C113.406 36.8354 114.638 34.6514 116.766 33.0834C118.931 31.5154 121.731 30.7314 125.166 30.7314C128.824 30.7314 131.643 31.6274 133.622 33.4194C135.638 35.1741 136.646 37.7128 136.646 41.0354V53.3554C136.646 54.7368 137.28 55.4274 138.55 55.4274H139.95ZM132.054 46.5794H123.206C118.95 46.5794 116.822 48.1661 116.822 51.3394C116.822 52.7581 117.382 53.8968 118.502 54.7554C119.622 55.6141 121.134 56.0434 123.038 56.0434C125.838 56.0434 128.04 55.3154 129.646 53.8594C131.251 52.3661 132.054 50.4061 132.054 47.9794V46.5794Z" fill="#1F1F1F"/>
          <path d="M80 20.4277H85.152L97.136 53.8597L109.064 20.4277H114.104L99.992 59.6277H94.112L80 20.4277Z" fill="#1F1F1F"/>
          <defs>
            <linearGradient id="vl0" x1="14.9658" y1="12" x2="79.3605" y2="29.1906" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FAEC8C"/><stop offset="1" stopColor="#FD6437"/>
            </linearGradient>
            <linearGradient id="vl1" x1="14.9658" y1="12" x2="79.3605" y2="29.1906" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FAEC8C"/><stop offset="1" stopColor="#FD6437"/>
            </linearGradient>
          </defs>
        </svg>
      </Box>

      <Divider sx={{ borderColor: '#F3F4F6' }} />

      {/* Sales section */}
      <Box sx={{ px: 2.5, pt: 2, pb: 0.5 }}>
        <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Sales
        </Typography>
      </Box>
      <List sx={{ px: 1.5, py: 0 }}>
        <NavItem label="Workspace" href="/workspace" icon={<DashboardIcon />} isActive={isActive('/workspace')} onClick={handleNavClick} />
        <NavItem label="Pipeline" href="/deals" icon={<HandshakeIcon />} isActive={isActive('/deals')} onClick={handleNavClick} />
        <NavItem label="Customers" href="/customers" icon={<PeopleIcon />} isActive={isActive('/customers')} onClick={handleNavClick} />
        <NavItem label="Catalog" href="/products" icon={<InventoryIcon />} isActive={isActive('/products')} onClick={handleNavClick} />
      </List>

      {/* Product Management section */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 0.5 }}>
        <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Product Management
        </Typography>
      </Box>
      <List sx={{ px: 1.5, py: 0 }}>
        {productMgmtItems.map((item) => (
          <NavItem key={item.href} {...item} isActive={isActive(item.href)} onClick={handleNavClick} />
        ))}
      </List>

      {/* System section */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 0.5 }}>
        <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          System
        </Typography>
      </Box>
      <List sx={{ px: 1.5, py: 0, flex: 1 }}>
        {systemItems.map((item) => (
          <NavItem key={item.href} {...item} isActive={isActive(item.href)} onClick={handleNavClick} />
        ))}
      </List>

      <Divider sx={{ borderColor: '#F3F4F6' }} />

      {/* User profile + Log out */}
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: '#E5E7EB',
            color: '#374151',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          {initials}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" fontWeight={500} noWrap sx={{ fontSize: '0.8rem', color: '#111827' }}>
            {settings.currentUser}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.7rem' }}>
            {roleLabel}
          </Typography>
        </Box>
      </Box>
      <List sx={{ px: 1.5, py: 0, pb: 1.5 }}>
        <ListItem disablePadding>
          <ListItemButton sx={{ borderRadius: 2, py: 0.75, px: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 36, color: '#9CA3AF' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="Log out"
              primaryTypographyProps={{ fontSize: '0.875rem', color: '#374151' }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? open : true}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
        ...(isMobile
          ? {}
          : {
              width: DRAWER_WIDTH,
              flexShrink: 0,
            }),
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
