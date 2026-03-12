'use client';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '@/components/shared/PageHeader';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useSettingsStore } from '@/stores/settingsStore';
import { useNotificationStore } from '@/stores/notificationStore';
import type { UserRole } from '@/types';

export default function SettingsPage() {
  const settings = useSettingsStore((s) => s.settings);
  const updateRole = useSettingsStore((s) => s.updateRole);
  const updateUser = useSettingsStore((s) => s.updateUser);
  const notifSettings = useNotificationStore((s) => s.settings);
  const setNotifSettings = useNotificationStore((s) => s.setSettings);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const handleReset = () => {
    // Clear all dealflow localStorage keys
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('dealflow-')) {
        localStorage.removeItem(key);
      }
    });
    setConfirmOpen(false);
    setSnackbar('Data reset. Reload the page to re-seed.');
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <Box>
      <PageHeader title="Settings" />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 600 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Role & User
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Switch between Account Manager and Sales Manager roles. Sales Managers can approve and reject offers.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Current Role</InputLabel>
                <Select
                  value={settings.currentRole}
                  label="Current Role"
                  onChange={(e) => updateRole(e.target.value as UserRole)}
                >
                  <MenuItem value="account_manager">Account Manager</MenuItem>
                  <MenuItem value="sales_manager">Sales Manager</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Current User</InputLabel>
                <Select
                  value={settings.currentUser}
                  label="Current User"
                  onChange={(e) => updateUser(e.target.value)}
                >
                  <MenuItem value="John Mitchell">John Mitchell</MenuItem>
                  <MenuItem value="Sarah Chen">Sarah Chen</MenuItem>
                  <MenuItem value="Marco Rodriguez">Marco Rodriguez</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Role Permissions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Alert severity="info" variant="outlined">
                <strong>Account Manager:</strong> Create/edit deals, create/edit offers, send offers, generate PDFs, create orders from approved offers.
              </Alert>
              <Alert severity="info" variant="outlined">
                <strong>Sales Manager:</strong> All AM permissions + approve/reject offers.
              </Alert>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Notifications
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure automated notification thresholds. The notification engine scans your deals every 60 seconds.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notifSettings.enabled}
                    onChange={(e) => setNotifSettings({ enabled: e.target.checked })}
                  />
                }
                label="Enable smart notifications"
              />
              <Divider />
              <Typography variant="subtitle2" color="text.secondary">
                Time-Based Thresholds
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Offer validity warning (days)"
                    value={notifSettings.offerValidityDays}
                    onChange={(e) => setNotifSettings({ offerValidityDays: parseInt(e.target.value) || 3 })}
                    inputProps={{ min: 1, max: 30 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Deal inactive threshold (days)"
                    value={notifSettings.dealInactiveDays}
                    onChange={(e) => setNotifSettings({ dealInactiveDays: parseInt(e.target.value) || 14 })}
                    inputProps={{ min: 1, max: 90 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Follow-up after send (days)"
                    value={notifSettings.followUpDays}
                    onChange={(e) => setNotifSettings({ followUpDays: parseInt(e.target.value) || 5 })}
                    inputProps={{ min: 1, max: 30 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="No response threshold (days)"
                    value={notifSettings.offerNoResponseDays}
                    onChange={(e) => setNotifSettings({ offerNoResponseDays: parseInt(e.target.value) || 7 })}
                    inputProps={{ min: 1, max: 60 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Draft stuck threshold (days)"
                    value={notifSettings.dealStuckDraftDays}
                    onChange={(e) => setNotifSettings({ dealStuckDraftDays: parseInt(e.target.value) || 10 })}
                    inputProps={{ min: 1, max: 60 }}
                  />
                </Grid>
              </Grid>
              <Divider />
              <Typography variant="subtitle2" color="text.secondary">
                Pricing Thresholds
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Margin alert threshold (%)"
                    value={notifSettings.marginThresholdPct}
                    onChange={(e) => setNotifSettings({ marginThresholdPct: parseFloat(e.target.value) || 5 })}
                    inputProps={{ min: 0, max: 50, step: 0.5 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Deal value threshold ($)"
                    value={notifSettings.dealValueThreshold}
                    onChange={(e) => setNotifSettings({ dealValueThreshold: parseInt(e.target.value) || 100000 })}
                    inputProps={{ min: 0, step: 10000 }}
                  />
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>

        <Divider />

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="error">
              Danger Zone
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Reset all data to the default seed state. This will clear all changes made during this session.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setConfirmOpen(true)}
            >
              Reset All Data
            </Button>
          </CardContent>
        </Card>
      </Box>

      <ConfirmDialog
        open={confirmOpen}
        title="Reset All Data"
        message="This will delete all your changes and restore the default seed data. This action cannot be undone."
        confirmLabel="Reset"
        onConfirm={handleReset}
        onCancel={() => setConfirmOpen(false)}
        color="error"
      />

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        message={snackbar}
      />
    </Box>
  );
}
