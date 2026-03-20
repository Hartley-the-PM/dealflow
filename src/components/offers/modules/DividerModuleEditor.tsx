'use client';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import type { DividerModule } from '@/types/offerBuilder';

interface DividerModuleEditorProps {
  module: DividerModule;
  onChange: (updated: DividerModule) => void;
}

export default function DividerModuleEditor({ module, onChange }: DividerModuleEditorProps) {
  return (
    <Grid container spacing={2} alignItems="center">
      <Grid size={{ xs: 12, sm: 6 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          Style
        </Typography>
        <ToggleButtonGroup
          size="small"
          value={module.style}
          exclusive
          onChange={(_, v) => { if (v) onChange({ ...module, style: v }); }}
        >
          <ToggleButton value="line">Line</ToggleButton>
          <ToggleButton value="dots">Dots</ToggleButton>
          <ToggleButton value="space">Space</ToggleButton>
        </ToggleButtonGroup>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          size="small"
          label="Height (px)"
          type="number"
          value={module.height}
          onChange={(e) => onChange({ ...module, height: Math.max(4, parseInt(e.target.value) || 4) })}
          inputProps={{ min: 4, max: 120 }}
        />
      </Grid>
    </Grid>
  );
}
