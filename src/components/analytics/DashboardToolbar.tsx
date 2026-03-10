'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useDashboardStore } from '@/stores/dashboardStore';

export default function DashboardToolbar() {
  const dashboards = useDashboardStore((s) => s.dashboards);
  const activeDashboardId = useDashboardStore((s) => s.activeDashboardId);
  const setActiveDashboard = useDashboardStore((s) => s.setActiveDashboard);
  const createDashboard = useDashboardStore((s) => s.createDashboard);
  const renameDashboard = useDashboardStore((s) => s.renameDashboard);
  const deleteDashboard = useDashboardStore((s) => s.deleteDashboard);
  const openBuilder = useDashboardStore((s) => s.openBuilder);

  const [newDashOpen, setNewDashOpen] = useState(false);
  const [newDashName, setNewDashName] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameName, setRenameName] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const activeDash = dashboards.find((d) => d.id === activeDashboardId) ?? dashboards[0];

  const handleCreate = () => {
    if (newDashName.trim()) {
      createDashboard(newDashName.trim());
      setNewDashName('');
      setNewDashOpen(false);
    }
  };

  const handleRename = () => {
    if (renameName.trim()) {
      renameDashboard(activeDashboardId, renameName.trim());
      setRenameName('');
      setRenameOpen(false);
    }
  };

  const handleDelete = () => {
    deleteDashboard(activeDashboardId);
    setDeleteOpen(false);
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        {/* Left: Dashboard selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DashboardIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <Select
            value={activeDashboardId}
            onChange={(e) => setActiveDashboard(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          >
            {dashboards.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.name}
              </MenuItem>
            ))}
          </Select>

          <Tooltip title="New Dashboard">
            <IconButton
              size="small"
              onClick={() => setNewDashOpen(true)}
              sx={{ color: 'text.secondary' }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Rename Dashboard">
            <IconButton
              size="small"
              onClick={() => {
                setRenameName(activeDash?.name ?? '');
                setRenameOpen(true);
              }}
              sx={{ color: 'text.secondary' }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {dashboards.length > 1 && (
            <Tooltip title="Delete Dashboard">
              <IconButton
                size="small"
                onClick={() => setDeleteOpen(true)}
                sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Right: Add Chart button */}
        <Button
          variant="contained"
          startIcon={<AutoAwesomeIcon />}
          onClick={openBuilder}
          size="small"
          sx={{ textTransform: 'none' }}
        >
          AI Chart Builder
        </Button>
      </Box>

      {/* New Dashboard Dialog */}
      <Dialog open={newDashOpen} onClose={() => setNewDashOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New Dashboard</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Dashboard Name"
            value={newDashName}
            onChange={(e) => setNewDashName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewDashOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!newDashName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onClose={() => setRenameOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Rename Dashboard</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Dashboard Name"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameOpen(false)}>Cancel</Button>
          <Button onClick={handleRename} variant="contained" disabled={!renameName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs">
        <DialogTitle>Delete Dashboard</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{activeDash?.name}&quot;? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
