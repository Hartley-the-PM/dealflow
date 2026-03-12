'use client';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { TermsModule } from '@/types/offerBuilder';

interface Props {
  module: TermsModule;
  onChange: (updated: TermsModule) => void;
}

export default function TermsModuleEditor({ module, onChange }: Props) {
  const update = (field: keyof TermsModule, value: string) => {
    onChange({ ...module, [field]: value });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Terms & Conditions
      </Typography>
      <TextField
        size="small"
        fullWidth
        label="Payment Terms"
        value={module.paymentTerms}
        onChange={(e) => update('paymentTerms', e.target.value)}
        placeholder="e.g. Net 30, 50% upfront"
      />
      <TextField
        size="small"
        fullWidth
        label="Incoterms"
        value={module.incoterms}
        onChange={(e) => update('incoterms', e.target.value)}
        placeholder="e.g. FCA Rotterdam"
      />
      <TextField
        size="small"
        fullWidth
        label="Validity"
        value={module.validity}
        onChange={(e) => update('validity', e.target.value)}
        placeholder="e.g. 30 days from date of issue"
      />
      <TextField
        size="small"
        fullWidth
        label="Delivery"
        value={module.delivery}
        onChange={(e) => update('delivery', e.target.value)}
        placeholder="e.g. 4-6 weeks from order confirmation"
      />
      <TextField
        size="small"
        fullWidth
        label="Legal Notes"
        multiline
        minRows={2}
        value={module.legalNotes}
        onChange={(e) => update('legalNotes', e.target.value)}
      />
    </Box>
  );
}
