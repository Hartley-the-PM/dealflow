'use client';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import type { CompanyAboutModule } from '@/types/offerBuilder';
import { useState } from 'react';

interface Props {
  module: CompanyAboutModule;
  onChange: (updated: CompanyAboutModule) => void;
}

export default function CompanyAboutEditor({ module, onChange }: Props) {
  const [certInput, setCertInput] = useState('');
  const [diffInput, setDiffInput] = useState('');

  const addCertification = () => {
    if (!certInput.trim()) return;
    onChange({ ...module, certifications: [...module.certifications, certInput.trim()] });
    setCertInput('');
  };

  const removeCertification = (index: number) => {
    onChange({ ...module, certifications: module.certifications.filter((_, i) => i !== index) });
  };

  const addDifferentiator = () => {
    if (!diffInput.trim()) return;
    onChange({ ...module, differentiators: [...module.differentiators, diffInput.trim()] });
    setDiffInput('');
  };

  const removeDifferentiator = (index: number) => {
    onChange({ ...module, differentiators: module.differentiators.filter((_, i) => i !== index) });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Company About
      </Typography>
      <TextField
        size="small"
        fullWidth
        label="Mission Statement"
        multiline
        minRows={2}
        value={module.mission}
        onChange={(e) => onChange({ ...module, mission: e.target.value })}
      />
      <Box>
        <Typography variant="caption" color="text.secondary">Certifications</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1, mt: 0.5 }}>
          {module.certifications.map((cert, i) => (
            <Chip key={i} label={cert} size="small" onDelete={() => removeCertification(i)} />
          ))}
        </Box>
        <TextField
          size="small"
          fullWidth
          placeholder="Add certification..."
          value={certInput}
          onChange={(e) => setCertInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCertification(); } }}
        />
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">Differentiators</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1, mt: 0.5 }}>
          {module.differentiators.map((diff, i) => (
            <Chip key={i} label={diff} size="small" onDelete={() => removeDifferentiator(i)} />
          ))}
        </Box>
        <TextField
          size="small"
          fullWidth
          placeholder="Add differentiator..."
          value={diffInput}
          onChange={(e) => setDiffInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDifferentiator(); } }}
        />
      </Box>
    </Box>
  );
}
