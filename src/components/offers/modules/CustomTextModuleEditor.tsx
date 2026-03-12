'use client';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { CustomTextModule } from '@/types/offerBuilder';

interface Props {
  module: CustomTextModule;
  onChange: (updated: CustomTextModule) => void;
}

export default function CustomTextModuleEditor({ module, onChange }: Props) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Custom Text Block
      </Typography>
      <TextField
        size="small"
        fullWidth
        label="Heading"
        value={module.heading}
        onChange={(e) => onChange({ ...module, heading: e.target.value })}
      />
      <TextField
        size="small"
        fullWidth
        label="Body"
        multiline
        minRows={3}
        value={module.body}
        onChange={(e) => onChange({ ...module, body: e.target.value })}
      />
    </Box>
  );
}
