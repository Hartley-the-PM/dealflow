'use client';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import FileUploadZone from '@/components/shared/FileUploadZone';
import type { CoverImageModule, ContentPreset } from '@/types/offerBuilder';

interface CoverImageModuleEditorProps {
  module: CoverImageModule;
  onChange: (updated: CoverImageModule) => void;
  presets?: ContentPreset[];
}

export default function CoverImageModuleEditor({ module, onChange, presets }: CoverImageModuleEditorProps) {
  const update = (field: keyof CoverImageModule, value: string | number) => {
    onChange({ ...module, [field]: value });
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = presets?.find((p) => p.id === presetId);
    if (preset) {
      onChange({ ...module, ...preset.data });
    }
  };

  return (
    <Grid container spacing={2}>
      {presets && presets.length > 0 && (
        <Grid size={{ xs: 12 }}>
          <TextField select size="small" fullWidth label="Load Preset" value="" onChange={(e) => handleLoadPreset(e.target.value)}>
            {presets.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
        </Grid>
      )}
      <Grid size={{ xs: 12 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Background Image</Typography>
        <FileUploadZone
          value={module.backgroundImageUrl}
          onChange={(url) => update('backgroundImageUrl', url)}
          label="background image"
          previewHeight={80}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField fullWidth size="small" label="Title" value={module.title} onChange={(e) => update('title', e.target.value)} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField fullWidth size="small" label="Subtitle" value={module.subtitle} onChange={(e) => update('subtitle', e.target.value)} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">Overlay Opacity: {Math.round(module.overlayOpacity * 100)}%</Typography>
          <Slider size="small" min={0} max={1} step={0.05} value={module.overlayOpacity} onChange={(_, v) => update('overlayOpacity', v as number)} />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <input type="color" value={module.overlayColor} onChange={(e) => update('overlayColor', e.target.value)} style={{ width: 36, height: 36, border: '1px solid #E5E7EB', cursor: 'pointer', borderRadius: 6, padding: 0 }} />
          <TextField size="small" label="Overlay Color" value={module.overlayColor} onChange={(e) => { let val = e.target.value; if (!val.startsWith('#')) val = '#' + val; if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) update('overlayColor', val); }} inputProps={{ maxLength: 7 }} sx={{ flex: 1, '& .MuiInputBase-root': { fontSize: '0.8rem' } }} />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <input type="color" value={module.fontColor || '#FFFFFF'} onChange={(e) => update('fontColor', e.target.value)} style={{ width: 36, height: 36, border: '1px solid #E5E7EB', cursor: 'pointer', borderRadius: 6, padding: 0 }} />
          <TextField size="small" label="Font Color" value={module.fontColor || '#FFFFFF'} onChange={(e) => { let val = e.target.value; if (!val.startsWith('#')) val = '#' + val; if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) update('fontColor', val); }} inputProps={{ maxLength: 7 }} sx={{ flex: 1, '& .MuiInputBase-root': { fontSize: '0.8rem' } }} />
        </Box>
      </Grid>
    </Grid>
  );
}
