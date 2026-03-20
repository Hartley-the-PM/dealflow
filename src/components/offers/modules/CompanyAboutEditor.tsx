'use client';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import type { CompanyAboutModule, ContentPreset } from '@/types/offerBuilder';
import { useState } from 'react';

interface Props {
  module: CompanyAboutModule;
  onChange: (updated: CompanyAboutModule) => void;
  presets?: ContentPreset[];
}

export default function CompanyAboutEditor({ module, onChange, presets }: Props) {
  const [valueInput, setValueInput] = useState('');

  const addValue = () => {
    if (!valueInput.trim()) return;
    onChange({ ...module, values: [...(module.values || []), valueInput.trim()] });
    setValueInput('');
  };

  const removeValue = (index: number) => {
    onChange({ ...module, values: (module.values || []).filter((_, i) => i !== index) });
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = presets?.find((p) => p.id === presetId);
    if (preset) {
      onChange({ ...module, ...preset.data });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" color="text.secondary">
          Company About
        </Typography>
        {presets && presets.length > 0 && (
          <TextField
            select
            size="small"
            label="Load Preset"
            value=""
            onChange={(e) => handleLoadPreset(e.target.value)}
            sx={{ minWidth: 140 }}
          >
            {presets.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
        )}
      </Box>
      <TextField
        size="small"
        fullWidth
        label="Mission Statement"
        multiline
        minRows={2}
        value={module.mission}
        onChange={(e) => onChange({ ...module, mission: e.target.value })}
        placeholder="What is your company's mission?"
      />
      <TextField
        size="small"
        fullWidth
        label="Vision"
        multiline
        minRows={2}
        value={module.vision || ''}
        onChange={(e) => onChange({ ...module, vision: e.target.value })}
        placeholder="What is your company's vision for the future?"
      />
      <Box>
        <Typography variant="caption" color="text.secondary">Values</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1, mt: 0.5 }}>
          {(module.values || []).map((val, i) => (
            <Chip key={i} label={val} size="small" onDelete={() => removeValue(i)} />
          ))}
        </Box>
        <TextField
          size="small"
          fullWidth
          placeholder="Add a value (press Enter)..."
          value={valueInput}
          onChange={(e) => setValueInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addValue(); } }}
        />
      </Box>
    </Box>
  );
}
