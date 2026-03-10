'use client';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Autocomplete from '@mui/material/Autocomplete';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SnoozeIcon from '@mui/icons-material/Snooze';
import PageHeader from '@/components/shared/PageHeader';
import { useReminderStore } from '@/stores/reminderStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useProductStore } from '@/stores/productStore';
import { format, addDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { ReminderType, ReminderFrequency } from '@/types';

export default function RemindersPage() {
  const reminders = useReminderStore((s) => s.reminders);
  const addReminder = useReminderStore((s) => s.addReminder);
  const markDone = useReminderStore((s) => s.markDone);
  const snooze = useReminderStore((s) => s.snooze);
  const customers = useCustomerStore((s) => s.customers);
  const products = useProductStore((s) => s.products);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    type: 'customer' as ReminderType,
    targetId: '',
    title: '',
    frequency: 'monthly' as ReminderFrequency,
    dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
  });

  const statusColors: Record<string, 'success' | 'warning' | 'default'> = {
    active: 'warning',
    done: 'success',
    snoozed: 'default',
  };

  const targets = form.type === 'customer'
    ? customers.map((c) => ({ id: c.id, label: c.name }))
    : products.map((p) => ({ id: p.id, label: p.name }));

  const selectedTarget = targets.find((t) => t.id === form.targetId);

  const handleCreate = () => {
    const target = targets.find((t) => t.id === form.targetId);
    if (!form.targetId || !form.title) return;
    addReminder({
      id: uuidv4(),
      type: form.type,
      targetId: form.targetId,
      targetName: target?.label || '',
      title: form.title,
      frequency: form.frequency,
      dueDate: new Date(form.dueDate).toISOString(),
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    setDialogOpen(false);
    setForm({ type: 'customer', targetId: '', title: '', frequency: 'monthly', dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd') });
  };

  const handleSnooze = (id: string) => {
    snooze(id, addDays(new Date(), 7).toISOString());
  };

  const sorted = [...reminders].sort((a, b) => {
    const order = { active: 0, snoozed: 1, done: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  return (
    <Box>
      <PageHeader
        title="Reminders"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Create Reminder
          </Button>
        }
      />
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Frequency</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((r) => (
                <TableRow key={r.id}>
                  <TableCell sx={{ fontWeight: 500 }}>{r.title}</TableCell>
                  <TableCell>
                    <Chip label={r.type} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                  </TableCell>
                  <TableCell>{r.targetName}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{r.frequency}</TableCell>
                  <TableCell>{format(new Date(r.dueDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <Chip label={r.status} size="small" color={statusColors[r.status] || 'default'} sx={{ textTransform: 'capitalize' }} />
                  </TableCell>
                  <TableCell>
                    {r.status !== 'done' && (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" color="success" onClick={() => markDone(r.id)} title="Mark Done">
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleSnooze(r.id)} title="Snooze 7 days">
                          <SnoozeIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Reminder</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., Create new deal for customer"
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select value={form.type} label="Type" onChange={(e) => setForm({ ...form, type: e.target.value as ReminderType, targetId: '' })}>
              <MenuItem value="customer">Customer</MenuItem>
              <MenuItem value="product">Product</MenuItem>
            </Select>
          </FormControl>
          <Autocomplete
            options={targets}
            getOptionLabel={(o) => o.label}
            value={selectedTarget || null}
            onChange={(_, v) => setForm({ ...form, targetId: v?.id || '' })}
            renderInput={(params) => <TextField {...params} label={form.type === 'customer' ? 'Customer' : 'Product'} />}
          />
          <FormControl fullWidth>
            <InputLabel>Frequency</InputLabel>
            <Select value={form.frequency} label="Frequency" onChange={(e) => setForm({ ...form, frequency: e.target.value as ReminderFrequency })}>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="quarterly">Quarterly</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Due Date"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.title || !form.targetId}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
