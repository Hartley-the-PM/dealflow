'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ImageIcon from '@mui/icons-material/Image';
import { useOfferBuilderSettingsStore } from '@/stores/offerBuilderSettingsStore';
import type { BrandProfile } from '@/types/offerBuilder';
import { v4 as uuidv4 } from 'uuid';

export default function BrandProfilesSection() {
  const brandProfiles = useOfferBuilderSettingsStore((s) => s.brandProfiles);
  const addBrandProfile = useOfferBuilderSettingsStore((s) => s.addBrandProfile);
  const updateBrandProfile = useOfferBuilderSettingsStore((s) => s.updateBrandProfile);
  const deleteBrandProfile = useOfferBuilderSettingsStore((s) => s.deleteBrandProfile);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<BrandProfile, 'id'>>({
    name: '', logoUrl: '', primaryColor: '#1A1A2E', accentColor: '#4F46E5', companyName: '',
  });

  const startNew = () => {
    setEditingId('new');
    setForm({ name: '', logoUrl: '', primaryColor: '#1A1A2E', accentColor: '#4F46E5', companyName: '' });
  };

  const startEdit = (profile: BrandProfile) => {
    setEditingId(profile.id);
    setForm({ name: profile.name, logoUrl: profile.logoUrl, primaryColor: profile.primaryColor, accentColor: profile.accentColor, companyName: profile.companyName });
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingId === 'new') {
      addBrandProfile({ id: uuidv4(), ...form });
    } else if (editingId) {
      updateBrandProfile(editingId, form);
    }
    setEditingId(null);
  };

  const handleCancel = () => setEditingId(null);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Brand Profiles</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={startNew}>Add Profile</Button>
      </Box>

      {/* Editing form */}
      {editingId && (
        <Card variant="outlined" sx={{ mb: 2, borderColor: 'primary.main' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {editingId === 'new' ? 'New Brand Profile' : 'Edit Brand Profile'}
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField size="small" fullWidth label="Profile Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField size="small" fullWidth label="Company Name" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Logo</Typography>
                {form.logoUrl ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, border: '1px solid #E5E7EB', borderRadius: 1.5, bgcolor: '#FAFBFC' }}>
                    <Box
                      component="img"
                      src={form.logoUrl}
                      alt="Logo preview"
                      sx={{ height: 48, maxWidth: 160, objectFit: 'contain' }}
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                        {form.logoUrl.startsWith('data:') ? 'Uploaded file' : form.logoUrl}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      color="error"
                      variant="text"
                      onClick={() => setForm({ ...form, logoUrl: '' })}
                      sx={{ textTransform: 'none', fontSize: '0.75rem', minWidth: 0 }}
                    >
                      Remove
                    </Button>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: '2px dashed #D1D5DB',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': { borderColor: 'primary.main', bgcolor: '#F8FAFC' },
                    }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/png,image/jpeg,image/svg+xml,image/webp,application/pdf,.svg,.png,.jpg,.jpeg,.webp,.pdf';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (!file) return;
                        // For SVG files, read as text and create a data URL
                        if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            const svgText = reader.result as string;
                            const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgText)))}`;
                            setForm((prev) => ({ ...prev, logoUrl: dataUrl }));
                          };
                          reader.readAsText(file);
                        } else {
                          // For raster images and PDFs, read as data URL
                          const reader = new FileReader();
                          reader.onload = () => {
                            setForm((prev) => ({ ...prev, logoUrl: reader.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                  >
                    <CloudUploadIcon sx={{ fontSize: 32, color: '#9CA3AF', mb: 0.5 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.25 }}>
                      Click to upload logo
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      PNG, SVG, JPG, WebP, or PDF — max 2MB
                    </Typography>
                  </Box>
                )}
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                    style={{ width: 36, height: 36, border: '1px solid #E5E7EB', cursor: 'pointer', borderRadius: 6, padding: 0 }}
                  />
                  <TextField
                    size="small"
                    label="Primary Color"
                    value={form.primaryColor}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (!val.startsWith('#')) val = '#' + val;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setForm({ ...form, primaryColor: val });
                    }}
                    sx={{ flex: 1, '& .MuiInputBase-root': { fontSize: '0.8rem' } }}
                    inputProps={{ maxLength: 7 }}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type="color"
                    value={form.accentColor}
                    onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                    style={{ width: 36, height: 36, border: '1px solid #E5E7EB', cursor: 'pointer', borderRadius: 6, padding: 0 }}
                  />
                  <TextField
                    size="small"
                    label="Accent Color"
                    value={form.accentColor}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (!val.startsWith('#')) val = '#' + val;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setForm({ ...form, accentColor: val });
                    }}
                    sx={{ flex: 1, '& .MuiInputBase-root': { fontSize: '0.8rem' } }}
                    inputProps={{ maxLength: 7 }}
                  />
                </Box>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button size="small" onClick={handleCancel} startIcon={<CloseIcon />}>Cancel</Button>
              <Button size="small" variant="contained" onClick={handleSave} startIcon={<SaveIcon />} disabled={!form.name.trim()}>Save</Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Profile list */}
      {brandProfiles.map((profile) => (
        <Card key={profile.id} variant="outlined" sx={{ mb: 1 }}>
          <CardContent sx={{ py: '10px !important', display: 'flex', alignItems: 'center', gap: 2 }}>
            {profile.logoUrl && (
              <Box
                component="img"
                src={profile.logoUrl}
                alt={profile.name}
                sx={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 1 }}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{profile.name}</Typography>
              <Typography variant="caption" color="text.secondary">{profile.companyName}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: profile.primaryColor, border: '1px solid #E5E7EB' }} />
              <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: profile.accentColor, border: '1px solid #E5E7EB' }} />
            </Box>
            <IconButton size="small" onClick={() => startEdit(profile)}><EditIcon fontSize="small" /></IconButton>
            <IconButton size="small" color="error" onClick={() => deleteBrandProfile(profile.id)}><DeleteIcon fontSize="small" /></IconButton>
          </CardContent>
        </Card>
      ))}

      {brandProfiles.length === 0 && !editingId && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No brand profiles yet. Create one to customize offer styling.
        </Typography>
      )}
    </Box>
  );
}
