'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadZone from '@/components/shared/FileUploadZone';
import { useWhiteLabelStore } from '@/stores/whiteLabelStore';
import { v4 as uuidv4 } from 'uuid';

interface BrandForm {
  name: string;
  prefix: string;
  description: string;
  logoUrl: string;
}

const EMPTY_FORM: BrandForm = { name: '', prefix: '', description: '', logoUrl: '' };

export default function WhiteLabelBrandsSection() {
  const brands = useWhiteLabelStore((s) => s.brands);
  const addBrand = useWhiteLabelStore((s) => s.addBrand);
  const updateBrand = useWhiteLabelStore((s) => s.updateBrand);
  const deleteBrand = useWhiteLabelStore((s) => s.deleteBrand);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BrandForm>(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (brand: { id: string; name: string; prefix: string; description: string; logoUrl: string }) => {
    setEditingId(brand.id);
    setForm({ name: brand.name, prefix: brand.prefix, description: brand.description, logoUrl: brand.logoUrl });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.prefix.trim()) return;
    const now = new Date().toISOString();
    if (editingId) {
      updateBrand(editingId, { ...form, updatedAt: now });
    } else {
      addBrand({
        id: uuidv4(),
        name: form.name.trim(),
        prefix: form.prefix.trim(),
        description: form.description.trim(),
        logoUrl: form.logoUrl,
        createdAt: now,
        updatedAt: now,
      });
    }
    setDialogOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      deleteBrand(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>White Label Brands</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={openAdd}>Add Brand</Button>
      </Box>

      {brands.length > 0 ? (
        <TableContainer sx={{ borderRadius: 2, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Prefix</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Description</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {brands.map((brand) => (
                <TableRow key={brand.id} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ fontSize: '0.8rem', color: '#374151' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {brand.logoUrl && (
                        <Box
                          component="img"
                          src={brand.logoUrl}
                          alt={brand.name}
                          sx={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 0.5 }}
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{brand.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', color: '#374151' }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', bgcolor: '#F3F4F6', px: 1, py: 0.25, borderRadius: 0.5, display: 'inline-block' }}>
                      {brand.prefix}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', color: '#6B7280', maxWidth: 260 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {brand.description || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(brand)} sx={{ color: 'text.secondary' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteConfirmId(brand.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No white label brands yet. Create one to start building private-label products.
        </Typography>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit White Label Brand' : 'Add White Label Brand'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            autoFocus
            size="small"
            fullWidth
            label="Brand Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <TextField
            size="small"
            fullWidth
            label="Prefix"
            placeholder="e.g. VNP"
            value={form.prefix}
            onChange={(e) => setForm({ ...form, prefix: e.target.value.toUpperCase() })}
            inputProps={{ maxLength: 6 }}
            helperText="Used for auto-naming products (max 6 characters)"
          />
          <TextField
            size="small"
            fullWidth
            label="Description"
            multiline
            minRows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Logo</Typography>
            <FileUploadZone
              value={form.logoUrl}
              onChange={(dataUrl) => setForm({ ...form, logoUrl: dataUrl })}
              label="Logo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name.trim() || !form.prefix.trim()}>
            {editingId ? 'Save Changes' : 'Add Brand'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Brand</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete this white label brand? Any products linked to this brand may be affected.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
