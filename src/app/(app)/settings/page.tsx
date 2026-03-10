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
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '@/components/shared/PageHeader';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useSettingsStore } from '@/stores/settingsStore';
import type { UserRole } from '@/types';

export default function SettingsPage() {
  const settings = useSettingsStore((s) => s.settings);
  const updateRole = useSettingsStore((s) => s.updateRole);
  const updateUser = useSettingsStore((s) => s.updateUser);
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
