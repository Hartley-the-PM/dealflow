'use client';

import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import FileUploadZone from '@/components/shared/FileUploadZone';
import type { ImageModule } from '@/types/offerBuilder';

interface ImageModuleEditorProps {
  module: ImageModule;
  onChange: (updated: ImageModule) => void;
}

export default function ImageModuleEditor({ module, onChange }: ImageModuleEditorProps) {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Image</Typography>
        <FileUploadZone
          value={module.imageUrl}
          onChange={(url) => onChange({ ...module, imageUrl: url })}
          label="image"
          previewHeight={80}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField fullWidth size="small" label="Caption" value={module.caption} onChange={(e) => onChange({ ...module, caption: e.target.value })} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField fullWidth size="small" label="Alt Text" value={module.alt} onChange={(e) => onChange({ ...module, alt: e.target.value })} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Width</Typography>
        <ToggleButtonGroup size="small" value={module.width} exclusive onChange={(_, v) => { if (v) onChange({ ...module, width: v }); }}>
          <ToggleButton value="full">Full</ToggleButton>
          <ToggleButton value="medium">Medium</ToggleButton>
          <ToggleButton value="small">Small</ToggleButton>
        </ToggleButtonGroup>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Alignment</Typography>
        <ToggleButtonGroup size="small" value={module.alignment} exclusive onChange={(_, v) => { if (v) onChange({ ...module, alignment: v }); }}>
          <ToggleButton value="left">Left</ToggleButton>
          <ToggleButton value="center">Center</ToggleButton>
          <ToggleButton value="right">Right</ToggleButton>
        </ToggleButtonGroup>
      </Grid>
    </Grid>
  );
}
