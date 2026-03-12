'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import type { ProductLinesModule } from '@/types/offerBuilder';

interface Props {
  module: ProductLinesModule;
  onChange: (updated: ProductLinesModule) => void;
}

export default function ProductLinesModuleEditor({ module, onChange }: Props) {
  const toggle = (field: keyof ProductLinesModule) => {
    onChange({ ...module, [field]: !module[field as keyof typeof module] });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Product Lines Table — Column Visibility
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Control which columns the buyer sees in the shared offer.
      </Typography>
      <FormControlLabel
        control={<Switch checked={module.showQuantity} onChange={() => toggle('showQuantity')} size="small" />}
        label="Show Quantity"
      />
      <FormControlLabel
        control={<Switch checked={module.showUnit} onChange={() => toggle('showUnit')} size="small" />}
        label="Show Unit"
      />
      <FormControlLabel
        control={<Switch checked={module.showUnitPrice} onChange={() => toggle('showUnitPrice')} size="small" />}
        label="Show Unit Price"
      />
      <FormControlLabel
        control={<Switch checked={module.showTotal} onChange={() => toggle('showTotal')} size="small" />}
        label="Show Line Total"
      />
      <FormControlLabel
        control={<Switch checked={module.showMSP} onChange={() => toggle('showMSP')} size="small" />}
        label="Show MSP (internal)"
      />
    </Box>
  );
}
