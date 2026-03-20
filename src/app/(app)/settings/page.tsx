'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import GroupIcon from '@mui/icons-material/Group';
import PaletteIcon from '@mui/icons-material/Palette';
import TuneIcon from '@mui/icons-material/Tune';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PageHeader from '@/components/shared/PageHeader';
import TeamRolesTab from '@/components/settings/TeamRolesTab';
import BrandingTab from '@/components/settings/BrandingTab';
import PipelinePricingTab from '@/components/settings/PipelinePricingTab';
import NotificationsTab from '@/components/settings/NotificationsTab';

const TABS = [
  { id: 'team', label: 'Team & Roles', icon: <GroupIcon /> },
  { id: 'branding', label: 'Branding', icon: <PaletteIcon /> },
  { id: 'pipeline', label: 'Pipeline & Pricing', icon: <TuneIcon /> },
  { id: 'notifications', label: 'Notifications', icon: <NotificationsIcon /> },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('team');

  return (
    <Box>
      <PageHeader title="Settings" />
      <Box sx={{ display: 'flex', gap: 0, minHeight: 'calc(100vh - 180px)' }}>
        {/* Sidebar */}
        <Box
          sx={{
            width: 220,
            flexShrink: 0,
            borderRight: '1px solid #E5E7EB',
            bgcolor: '#FAFBFC',
            borderRadius: '12px 0 0 12px',
            py: 1,
          }}
        >
          <List disablePadding>
            {TABS.map((tab) => (
              <ListItemButton
                key={tab.id}
                selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                sx={{
                  mx: 1,
                  borderRadius: 1.5,
                  mb: 0.5,
                  py: 1,
                  '&.Mui-selected': {
                    bgcolor: '#FFF7ED',
                    color: '#EA580C',
                    '& .MuiListItemIcon-root': { color: '#EA580C' },
                    '&:hover': { bgcolor: '#FFF7ED' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>
                  {tab.icon}
                </ListItemIcon>
                <ListItemText
                  primary={tab.label}
                  primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: activeTab === tab.id ? 600 : 400 }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, p: 3, maxWidth: 800, overflowY: 'auto' }}>
          {activeTab === 'team' && <TeamRolesTab />}
          {activeTab === 'branding' && <BrandingTab />}
          {activeTab === 'pipeline' && <PipelinePricingTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
        </Box>
      </Box>
    </Box>
  );
}
