'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Switch from '@mui/material/Switch';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import PageHeader from '@/components/shared/PageHeader';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'CRM' | 'ERP' | 'Communication' | 'Meeting' | 'Automation';
  logo: string;
  connected: boolean;
}

const INITIAL_INTEGRATIONS: Integration[] = [
  // CRM
  { id: 'salesforce', name: 'Salesforce', description: 'Sync deals, contacts, and accounts with Salesforce CRM', category: 'CRM', logo: '/integrations/salesforce.svg', connected: true },
  { id: 'hubspot', name: 'HubSpot', description: 'Connect your HubSpot CRM for lead and deal management', category: 'CRM', logo: '/integrations/hubspot.svg', connected: false },
  // ERP
  { id: 'sap', name: 'SAP', description: 'Integrate with SAP ERP for order management and logistics', category: 'ERP', logo: '/integrations/sap.svg', connected: true },
  { id: 'netsuite', name: 'Oracle NetSuite', description: 'Sync orders, invoices, and inventory with NetSuite', category: 'ERP', logo: '/integrations/netsuite.svg', connected: false },
  { id: 'quickbooks', name: 'QuickBooks', description: 'Connect QuickBooks for accounting and invoicing', category: 'ERP', logo: '/integrations/quickbooks.svg', connected: false },
  // Communication
  { id: 'slack', name: 'Slack', description: 'Get deal notifications and updates in Slack channels', category: 'Communication', logo: '/integrations/slack.svg', connected: true },
  { id: 'teams', name: 'Microsoft Teams', description: 'Receive alerts and collaborate on deals in Teams', category: 'Communication', logo: '/integrations/teams.svg', connected: false },
  { id: 'gmail', name: 'Gmail', description: 'Send offers and track email communication via Gmail', category: 'Communication', logo: '/integrations/gmail.svg', connected: true },
  { id: 'outlook', name: 'Outlook', description: 'Send offers and sync emails with Microsoft Outlook', category: 'Communication', logo: '/integrations/outlook.svg', connected: false },
  { id: 'whatsapp', name: 'WhatsApp Business', description: 'Send offer notifications and updates via WhatsApp', category: 'Communication', logo: '/integrations/whatsapp.svg', connected: false },
  { id: 'twilio', name: 'Twilio', description: 'SMS notifications for deal updates and reminders', category: 'Communication', logo: '/integrations/twilio.svg', connected: false },
  // Meeting
  { id: 'zoom', name: 'Zoom', description: 'Schedule and join deal meetings directly from Vailent', category: 'Meeting', logo: '/integrations/zoom.svg', connected: true },
  { id: 'googlemeet', name: 'Google Meet', description: 'Create and join Google Meet calls for deal discussions', category: 'Meeting', logo: '/integrations/googlemeet.svg', connected: false },
  // Automation
  { id: 'zapier', name: 'Zapier', description: 'Automate workflows between Vailent and 5000+ apps', category: 'Automation', logo: '/integrations/zapier.svg', connected: false },
];

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  CRM: { label: 'CRM', color: '#2563EB' },
  ERP: { label: 'ERP', color: '#7C3AED' },
  Communication: { label: 'Communication', color: '#E97A2B' },
  Meeting: { label: 'Meeting', color: '#059669' },
  Automation: { label: 'Automation', color: '#DC2626' },
};

const CATEGORIES = ['CRM', 'ERP', 'Communication', 'Meeting', 'Automation'] as const;

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState(INITIAL_INTEGRATIONS);

  const toggleIntegration = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i))
    );
  };

  const connectedCount = integrations.filter((i) => i.connected).length;

  return (
    <Box>
      <PageHeader
        title="Integrations"
        subtitle={`${connectedCount} of ${integrations.length} connected`}
      />

      {CATEGORIES.map((category) => {
        const items = integrations.filter((i) => i.category === category);
        const catCfg = CATEGORY_LABELS[category];
        return (
          <Box key={category} sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1rem' }}>
                {catCfg.label}
              </Typography>
              <Chip
                label={`${items.filter((i) => i.connected).length}/${items.length}`}
                size="small"
                sx={{ fontSize: '0.7rem', fontWeight: 600, bgcolor: `${catCfg.color}12`, color: catCfg.color }}
              />
            </Box>

            <Grid container spacing={2}>
              {items.map((integration) => (
                <Grid key={integration.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      borderColor: integration.connected ? `${catCfg.color}40` : 'divider',
                      transition: 'border-color 0.2s',
                      '&:hover': { borderColor: catCfg.color },
                    }}
                  >
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 1.5,
                              bgcolor: '#FFFFFF',
                              border: '1px solid #E5E7EB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              p: 0.5,
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={integration.logo}
                              alt={integration.name}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                              {integration.name}
                            </Typography>
                            {integration.connected && (
                              <Typography variant="caption" sx={{ color: '#059669', fontWeight: 500 }}>
                                Connected
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Switch
                          checked={integration.connected}
                          onChange={() => toggleIntegration(integration.id)}
                          size="small"
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: catCfg.color },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: catCfg.color },
                          }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                        {integration.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      })}
    </Box>
  );
}
