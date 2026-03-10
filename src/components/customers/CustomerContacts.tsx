'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useCustomerStore } from '@/stores/customerStore';
import type { Contact } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface CustomerContactsProps {
  customerId: string;
}

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  role: '',
  isPrimary: false,
};

export default function CustomerContacts({ customerId }: CustomerContactsProps) {
  const getContactsByCustomer = useCustomerStore((s) => s.getContactsByCustomer);
  const addContact = useCustomerStore((s) => s.addContact);
  const updateContact = useCustomerStore((s) => s.updateContact);
  const deleteContact = useCustomerStore((s) => s.deleteContact);

  const contacts = getContactsByCustomer(customerId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingContact(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (contact: Contact) => {
    setEditingContact(contact);
    setForm({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      role: contact.role,
      isPrimary: contact.isPrimary,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;

    if (editingContact) {
      updateContact(editingContact.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role.trim(),
        isPrimary: form.isPrimary,
      });
    } else {
      addContact({
        id: uuidv4(),
        customerId,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role.trim(),
        isPrimary: form.isPrimary,
      });
    }

    setDialogOpen(false);
    setForm(emptyForm);
    setEditingContact(null);
  };

  const handleConfirmDelete = () => {
    if (contactToDelete) {
      deleteContact(contactToDelete);
    }
    setDeleteDialogOpen(false);
    setContactToDelete(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          Add Contact
        </Button>
      </Box>

      {contacts.length === 0 ? (
        <EmptyState message="No contacts for this customer yet." />
      ) : (
        <Grid container spacing={2}>
          {contacts.map((contact) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={contact.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {contact.name}
                      </Typography>
                      {contact.role && (
                        <Typography variant="body2" color="text.secondary">
                          {contact.role}
                        </Typography>
                      )}
                    </Box>
                    <Stack direction="row" spacing={0}>
                      <IconButton size="small" onClick={() => handleOpenEdit(contact)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setContactToDelete(contact.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>

                  {contact.isPrimary && (
                    <Chip
                      label="Primary"
                      size="small"
                      color="primary"
                      sx={{ mb: 1.5, fontWeight: 600, fontSize: '0.75rem' }}
                    />
                  )}

                  {contact.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2">{contact.email}</Typography>
                    </Box>
                  )}
                  {contact.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2">{contact.phone}</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingContact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              fullWidth
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <TextField
              label="Email"
              fullWidth
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <TextField
              label="Phone"
              fullWidth
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <TextField
              label="Role"
              fullWidth
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.isPrimary}
                  onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))}
                />
              }
              label="Primary contact"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.name.trim()}
          >
            {editingContact ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Contact"
        message="Are you sure you want to delete this contact? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setContactToDelete(null);
        }}
        color="error"
      />
    </Box>
  );
}
