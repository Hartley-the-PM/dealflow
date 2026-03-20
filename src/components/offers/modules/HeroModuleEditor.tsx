'use client';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import FileUploadZone from '@/components/shared/FileUploadZone';
import type { HeroModule } from '@/types/offerBuilder';

interface Props {
  module: HeroModule;
  onChange: (updated: HeroModule) => void;
}

export default function HeroModuleEditor({ module, onChange }: Props) {
  const update = (field: keyof HeroModule, value: string) => {
    onChange({ ...module, [field]: value });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Cover / Hero Section
      </Typography>
      <TextField size="small" fullWidth label="Title" value={module.title} onChange={(e) => update('title', e.target.value)} />
      <TextField size="small" fullWidth label="Customer Name" value={module.customerName} onChange={(e) => update('customerName', e.target.value)} />
      <TextField size="small" fullWidth label="Date" type="date" value={module.date} onChange={(e) => update('date', e.target.value)} InputLabelProps={{ shrink: true }} />
      <TextField size="small" fullWidth label="Personalized Intro" multiline minRows={2} value={module.intro} onChange={(e) => update('intro', e.target.value)} />
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Logo</Typography>
        <FileUploadZone value={module.logoUrl} onChange={(url) => update('logoUrl', url)} label="logo" previewHeight={40} />
      </Box>
    </Box>
  );
}
