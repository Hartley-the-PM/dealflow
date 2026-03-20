'use client';

import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import BlockIcon from '@mui/icons-material/Block';
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import { usePricingEngineStore } from '@/stores/pricingEngineStore';
import { useProductStore } from '@/stores/productStore';
import { useCustomerStore } from '@/stores/customerStore';
import type { Guardrail, GuardrailType, GuardrailAction } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const TYPE_LABELS: Record<GuardrailType, string> = {
  min_margin_pct: 'Min Margin %',
  max_discount_pct: 'Max Discount %',
  below_cost: 'Below Cost',
  below_msp: 'Below MSP',
};

const ACTION_CONFIG: Record<GuardrailAction, { label: string; color: string; bgcolor: string; icon: React.ReactNode }> = {
  warn: { label: 'Warn', color: '#B45309', bgcolor: '#FEF3C7', icon: <WarningIcon sx={{ fontSize: 16, color: '#B45309' }} /> },
  block: { label: 'Block', color: '#DC2626', bgcolor: '#FEE2E2', icon: <BlockIcon sx={{ fontSize: 16, color: '#DC2626' }} /> },
  require_approval: { label: 'Require Approval', color: '#EA580C', bgcolor: '#FFF7ED', icon: <GppMaybeIcon sx={{ fontSize: 16, color: '#EA580C' }} /> },
};

export default function GuardrailsTab() {
  const products = useProductStore((s) => s.products);
  const customers = useCustomerStore((s) => s.customers);
  const guardrails = usePricingEngineStore((s) => s.guardrails);
  const addGuardrail = usePricingEngineStore((s) => s.addGuardrail);
  const updateGuardrail = usePricingEngineStore((s) => s.updateGuardrail);
  const deleteGuardrail = usePricingEngineStore((s) => s.deleteGuardrail);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGR, setEditingGR] = useState<Guardrail | null>(null);
  const [grName, setGrName] = useState('');
  const [grType, setGrType] = useState<GuardrailType>('min_margin_pct');
  const [grThreshold, setGrThreshold] = useState('');
  const [grAction, setGrAction] = useState<GuardrailAction>('warn');


  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' }>({
    open: false, message: '', severity: 'success',
  });

  const openDialog = (gr?: Guardrail) => {
    if (gr) {
      setEditingGR(gr);
      setGrName(gr.name);
      setGrType(gr.type);
      setGrThreshold(String(gr.threshold));
      setGrAction(gr.action);
    } else {
      setEditingGR(null);
      setGrName('');
      setGrType('min_margin_pct');
      setGrThreshold('');
      setGrAction('warn');
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    const data: Guardrail = {
      id: editingGR?.id ?? uuidv4(),
      name: grName,
      type: grType,
      threshold: parseFloat(grThreshold) || 0,
      action: grAction,
      active: editingGR?.active ?? true,
    };
    if (editingGR) {
      updateGuardrail(editingGR.id, data);
      setSnackbar({ open: true, message: 'Guardrail updated', severity: 'success' });
    } else {
      addGuardrail(data);
      setSnackbar({ open: true, message: 'Guardrail created', severity: 'success' });
    }
    setDialogOpen(false);
  };


  return (
    <Box>
      {/* Guardrails table */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>Pricing Guardrails</Typography>
          <Chip
            label={`${guardrails.filter((g) => g.active).length} active`}
            size="small"
            color="primary"
            sx={{ ml: 1 }}
          />
        </Box>
        <Button variant="outlined" startIcon={<AddIcon />} size="small" onClick={() => openDialog()}>
          Add Guardrail
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Threshold</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Active</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center" width={100}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {guardrails.map((gr) => {
              const actionCfg = ACTION_CONFIG[gr.action];
              return (
                <TableRow key={gr.id} hover sx={{ opacity: gr.active ? 1 : 0.5 }}>
                  <TableCell sx={{ fontWeight: 500 }}>{gr.name}</TableCell>
                  <TableCell>
                    <Chip label={TYPE_LABELS[gr.type]} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight={600}>
                      {gr.threshold}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={actionCfg.icon as React.ReactElement}
                      label={actionCfg.label}
                      size="small"
                      sx={{ bgcolor: actionCfg.bgcolor, color: actionCfg.color, fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      size="small"
                      checked={gr.active}
                      onChange={() => updateGuardrail(gr.id, { active: !gr.active })}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => openDialog(gr)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        deleteGuardrail(gr.id);
                        setSnackbar({ open: true, message: 'Guardrail deleted', severity: 'info' });
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Guardrail Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingGR ? 'Edit Guardrail' : 'Add Guardrail'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Name" value={grName} onChange={(e) => setGrName(e.target.value)} size="small" fullWidth />
          <FormControl size="small" fullWidth>
            <InputLabel>Type</InputLabel>
            <Select value={grType} label="Type" onChange={(e) => setGrType(e.target.value as GuardrailType)}>
              <MenuItem value="min_margin_pct">Min Margin %</MenuItem>
              <MenuItem value="max_discount_pct">Max Discount %</MenuItem>
              <MenuItem value="below_cost">Below Cost</MenuItem>
              <MenuItem value="below_msp">Below MSP</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Threshold (%)" value={grThreshold} onChange={(e) => setGrThreshold(e.target.value)} size="small" type="number" />
          <FormControl size="small" fullWidth>
            <InputLabel>Action</InputLabel>
            <Select value={grAction} label="Action" onChange={(e) => setGrAction(e.target.value as GuardrailAction)}>
              <MenuItem value="warn">Warn</MenuItem>
              <MenuItem value="block">Block</MenuItem>
              <MenuItem value="require_approval">Require Approval</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!grName || !grThreshold}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
