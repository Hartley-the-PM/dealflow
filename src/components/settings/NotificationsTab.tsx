'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EmailIcon from '@mui/icons-material/Email';
import { useNotificationStore } from '@/stores/notificationStore';
import { useNotificationPrefsStore } from '@/stores/notificationPrefsStore';
import { useHydration } from '@/hooks/useHydration';

export default function NotificationsTab() {
  const hydrated = useHydration();
  const notifSettings = useNotificationStore((s) => s.settings);
  const setNotifSettings = useNotificationStore((s) => s.setSettings);
  const preferences = useNotificationPrefsStore((s) => s.preferences);
  const updatePref = useNotificationPrefsStore((s) => s.updatePref);
  const toggleAll = useNotificationPrefsStore((s) => s.toggleAll);

  if (!hydrated) return null;

  const allInApp = preferences.every((p) => p.inApp);
  const allEmail = preferences.every((p) => p.email);

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 0.5 }}>Notifications</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Control how and when you receive notifications.
      </Typography>

      {/* Master Toggle */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, bgcolor: '#F9FAFB', borderRadius: 2, border: '1px solid #E5E7EB' }}>
        <FormControlLabel
          control={
            <Switch
              checked={notifSettings.enabled}
              onChange={(e) => setNotifSettings({ enabled: e.target.checked })}
              color="primary"
            />
          }
          label={
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Enable Smart Notifications</Typography>
              <Typography variant="caption" color="text.secondary">The notification engine scans your deals and triggers alerts based on your preferences</Typography>
            </Box>
          }
        />
      </Box>

      {!notifSettings.enabled && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          Notifications are disabled. Enable them above to configure preferences.
        </Typography>
      )}

      {notifSettings.enabled && (
        <>
          {/* Per-event preferences */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Event Preferences</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="text" sx={{ textTransform: 'none', fontSize: '0.75rem' }} onClick={() => toggleAll('inApp', !allInApp)}>
                {allInApp ? 'Disable' : 'Enable'} all in-app
              </Button>
              <Button size="small" variant="text" sx={{ textTransform: 'none', fontSize: '0.75rem' }} onClick={() => toggleAll('email', !allEmail)}>
                {allEmail ? 'Disable' : 'Enable'} all email
              </Button>
            </Box>
          </Box>

          <TableContainer sx={{ borderRadius: 2, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Event</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280', width: 100 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <NotificationsActiveIcon sx={{ fontSize: 14 }} /> In-App
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280', width: 100 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <EmailIcon sx={{ fontSize: 14 }} /> Email
                    </Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {preferences.map((pref) => (
                  <TableRow key={pref.eventType} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827' }}>{pref.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{pref.description}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Switch
                        size="small"
                        checked={pref.inApp}
                        onChange={(e) => updatePref(pref.eventType, 'inApp', e.target.checked)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Switch
                        size="small"
                        checked={pref.email}
                        onChange={(e) => updatePref(pref.eventType, 'email', e.target.checked)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
