'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import Slider from '@mui/material/Slider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import { useOfferBuilderSettingsStore } from '@/stores/offerBuilderSettingsStore';
import type { ContentPresetType, ContentPreset } from '@/types/offerBuilder';
import { v4 as uuidv4 } from 'uuid';

const PRESET_TYPES: { value: ContentPresetType; label: string }[] = [
  { value: 'terms', label: 'Terms' },
  { value: 'testimonials', label: 'Testimonials' },
  { value: 'cover_image', label: 'Cover Image' },
  { value: 'company_about', label: 'Company About' },
];

export default function ContentPresetsSection() {
  const contentPresets = useOfferBuilderSettingsStore((s) => s.contentPresets);
  const addContentPreset = useOfferBuilderSettingsStore((s) => s.addContentPreset);
  const deleteContentPreset = useOfferBuilderSettingsStore((s) => s.deleteContentPreset);
  const defaultPresets = useOfferBuilderSettingsStore((s) => s.defaultPresets);
  const setDefaultPreset = useOfferBuilderSettingsStore((s) => s.setDefaultPreset);
  const clearDefaultPreset = useOfferBuilderSettingsStore((s) => s.clearDefaultPreset);

  const [tabIndex, setTabIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editType, setEditType] = useState<ContentPresetType>('terms');
  const [editName, setEditName] = useState('');
  const [editData, setEditData] = useState<Record<string, unknown>>({});

  // Chip input state
  const [certInput, setCertInput] = useState('');
  const [diffInput, setDiffInput] = useState('');

  const currentType = PRESET_TYPES[tabIndex].value;
  const filteredPresets = contentPresets.filter((p) => p.type === currentType);

  const startNew = () => {
    setEditing(true);
    setEditType(currentType);
    setEditName('');
    setEditData(getDefaultData(currentType));
  };

  const handleSave = () => {
    if (!editName.trim()) return;
    addContentPreset({ id: uuidv4(), name: editName.trim(), type: editType, data: editData });
    setEditing(false);
  };

  const updateData = (key: string, value: unknown) => {
    setEditData((prev) => ({ ...prev, [key]: value }));
  };

  function getDefaultData(type: ContentPresetType): Record<string, unknown> {
    switch (type) {
      case 'terms': return { paymentTerms: '', incoterms: '', validity: '', delivery: '', legalNotes: '' };
      case 'testimonials': return { testimonials: [] };
      case 'cover_image': return { backgroundImageUrl: '', title: '', subtitle: '', overlayOpacity: 0.5, overlayColor: '#000000' };
      case 'company_about': return { mission: '', certifications: [], differentiators: [] };
    }
  }

  const renderEditForm = () => {
    switch (editType) {
      case 'terms':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField size="small" fullWidth label="Payment Terms" value={editData.paymentTerms || ''} onChange={(e) => updateData('paymentTerms', e.target.value)} />
            <TextField size="small" fullWidth label="Incoterms" value={editData.incoterms || ''} onChange={(e) => updateData('incoterms', e.target.value)} />
            <TextField size="small" fullWidth label="Validity" value={editData.validity || ''} onChange={(e) => updateData('validity', e.target.value)} />
            <TextField size="small" fullWidth label="Delivery" value={editData.delivery || ''} onChange={(e) => updateData('delivery', e.target.value)} />
            <TextField size="small" fullWidth label="Legal Notes" multiline minRows={2} value={editData.legalNotes || ''} onChange={(e) => updateData('legalNotes', e.target.value)} />
          </Box>
        );
      case 'testimonials': {
        const testimonials = (editData.testimonials as Array<{ quote: string; author: string; company: string }>) || [];
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {testimonials.map((t, i) => (
              <Card key={i} variant="outlined">
                <CardContent sx={{ pb: '8px !important', display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">Testimonial {i + 1}</Typography>
                    <IconButton size="small" color="error" onClick={() => updateData('testimonials', testimonials.filter((_, j) => j !== i))}>
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                  <TextField size="small" fullWidth label="Quote" multiline minRows={2} value={t.quote} onChange={(e) => updateData('testimonials', testimonials.map((tt, j) => j === i ? { ...tt, quote: e.target.value } : tt))} />
                  <TextField size="small" fullWidth label="Author" value={t.author} onChange={(e) => updateData('testimonials', testimonials.map((tt, j) => j === i ? { ...tt, author: e.target.value } : tt))} />
                  <TextField size="small" fullWidth label="Company" value={t.company} onChange={(e) => updateData('testimonials', testimonials.map((tt, j) => j === i ? { ...tt, company: e.target.value } : tt))} />
                </CardContent>
              </Card>
            ))}
            <Button size="small" startIcon={<AddIcon />} onClick={() => updateData('testimonials', [...testimonials, { quote: '', author: '', company: '' }])}>
              Add Testimonial
            </Button>
          </Box>
        );
      }
      case 'cover_image':
        return (
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12 }}>
              <TextField size="small" fullWidth label="Background Image URL" value={editData.backgroundImageUrl || ''} onChange={(e) => updateData('backgroundImageUrl', e.target.value)} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField size="small" fullWidth label="Title" value={editData.title || ''} onChange={(e) => updateData('title', e.target.value)} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField size="small" fullWidth label="Subtitle" value={editData.subtitle || ''} onChange={(e) => updateData('subtitle', e.target.value)} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Overlay Opacity: {Math.round((editData.overlayOpacity as number ?? 0.5) * 100)}%
                </Typography>
                <Slider size="small" min={0} max={1} step={0.05} value={(editData.overlayOpacity as number) ?? 0.5} onChange={(_, v) => updateData('overlayOpacity', v)} />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">Overlay Color:</Typography>
                <input type="color" value={(editData.overlayColor as string) || '#000000'} onChange={(e) => updateData('overlayColor', e.target.value)} style={{ width: 36, height: 28, border: 'none', cursor: 'pointer', borderRadius: 4 }} />
              </Box>
            </Grid>
          </Grid>
        );
      case 'company_about': {
        const certs = (editData.certifications as string[]) || [];
        const diffs = (editData.differentiators as string[]) || [];
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField size="small" fullWidth label="Mission Statement" multiline minRows={2} value={editData.mission || ''} onChange={(e) => updateData('mission', e.target.value)} />
            <Box>
              <Typography variant="caption" color="text.secondary">Certifications</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.5, mt: 0.5 }}>
                {certs.map((c, i) => <Chip key={i} label={c} size="small" onDelete={() => updateData('certifications', certs.filter((_, j) => j !== i))} />)}
              </Box>
              <TextField size="small" fullWidth placeholder="Add certification..." value={certInput} onChange={(e) => setCertInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && certInput.trim()) { e.preventDefault(); updateData('certifications', [...certs, certInput.trim()]); setCertInput(''); } }} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Differentiators</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.5, mt: 0.5 }}>
                {diffs.map((d, i) => <Chip key={i} label={d} size="small" onDelete={() => updateData('differentiators', diffs.filter((_, j) => j !== i))} />)}
              </Box>
              <TextField size="small" fullWidth placeholder="Add differentiator..." value={diffInput} onChange={(e) => setDiffInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && diffInput.trim()) { e.preventDefault(); updateData('differentiators', [...diffs, diffInput.trim()]); setDiffInput(''); } }} />
            </Box>
          </Box>
        );
      }
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Content Presets</Typography>

      <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 2, minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5, textTransform: 'none', fontSize: '0.82rem' } }}>
        {PRESET_TYPES.map((pt) => <Tab key={pt.value} label={pt.label} />)}
      </Tabs>

      {/* Edit form */}
      {editing && (
        <Card variant="outlined" sx={{ mb: 2, borderColor: 'primary.main' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField size="small" fullWidth label="Preset Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            {renderEditForm()}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button size="small" onClick={() => setEditing(false)} startIcon={<CloseIcon />}>Cancel</Button>
              <Button size="small" variant="contained" onClick={handleSave} startIcon={<SaveIcon />} disabled={!editName.trim()}>Save</Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Preset list */}
      {filteredPresets.map((preset) => (
        <Card key={preset.id} variant="outlined" sx={{ mb: 1 }}>
          <CardContent sx={{ py: '10px !important', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{preset.name}</Typography>
              <Typography variant="caption" color="text.secondary">{PRESET_TYPES.find((t) => t.value === preset.type)?.label}</Typography>
            </Box>
            {defaultPresets[preset.type] === preset.id && (
              <Chip label="Default" size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem' }} />
            )}
            <IconButton size="small" color="error" onClick={() => deleteContentPreset(preset.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </CardContent>
        </Card>
      ))}

      {filteredPresets.length === 0 && !editing && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No {PRESET_TYPES[tabIndex].label.toLowerCase()} presets yet.
        </Typography>
      )}

      {!editing && (
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Button size="small" startIcon={<AddIcon />} onClick={startNew}>Add Preset</Button>
        </Box>
      )}

      {/* Global Defaults */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Global Defaults</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Set a default preset for each content type. These auto-populate modules when a template is applied.
        </Typography>
        <Grid container spacing={2}>
          {PRESET_TYPES.map((pt) => {
            const presets = contentPresets.filter((p) => p.type === pt.value);
            return (
              <Grid key={pt.value} size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{pt.label} Default</InputLabel>
                  <Select
                    value={defaultPresets[pt.value] || ''}
                    label={`${pt.label} Default`}
                    onChange={(e) => {
                      const val = e.target.value as string;
                      if (val) setDefaultPreset(pt.value, val);
                      else clearDefaultPreset(pt.value);
                    }}
                  >
                    <MenuItem value="">None</MenuItem>
                    {presets.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
}
