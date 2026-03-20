'use client';

import { useCallback } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { CertificationsModule } from '@/types/offerBuilder';

interface Props {
  module: CertificationsModule;
  onChange: (updated: CertificationsModule) => void;
}

export default function CertificationsModuleEditor({ module, onChange }: Props) {
  const addCert = useCallback(() => {
    onChange({
      ...module,
      certifications: [...module.certifications, { name: '', description: '', issuer: '' }],
    });
  }, [module, onChange]);

  const removeCert = useCallback((index: number) => {
    onChange({
      ...module,
      certifications: module.certifications.filter((_, i) => i !== index),
    });
  }, [module, onChange]);

  const updateCert = useCallback((index: number, field: string, value: string) => {
    onChange({
      ...module,
      certifications: module.certifications.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      ),
    });
  }, [module, onChange]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Certifications & Compliance
      </Typography>
      <TextField
        size="small"
        fullWidth
        label="Section Title"
        value={module.title}
        onChange={(e) => onChange({ ...module, title: e.target.value })}
        placeholder="Certifications & Compliance"
      />

      {module.certifications.map((cert, i) => (
        <Card key={i} variant="outlined">
          <CardContent sx={{ pb: '10px !important', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">Certification {i + 1}</Typography>
              <IconButton size="small" color="error" onClick={() => removeCert(i)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
            <TextField
              size="small"
              fullWidth
              label="Name"
              value={cert.name}
              onChange={(e) => updateCert(i, 'name', e.target.value)}
              placeholder="e.g. ISO 9001:2015"
            />
            <TextField
              size="small"
              fullWidth
              label="Issuer"
              value={cert.issuer}
              onChange={(e) => updateCert(i, 'issuer', e.target.value)}
              placeholder="e.g. Bureau Veritas"
            />
            <TextField
              size="small"
              fullWidth
              label="Description"
              value={cert.description}
              onChange={(e) => updateCert(i, 'description', e.target.value)}
              placeholder="Brief description of the certification..."
            />
          </CardContent>
        </Card>
      ))}

      <Button size="small" startIcon={<AddIcon />} onClick={addCert}>
        Add Certification
      </Button>

      {module.certifications.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
          No certifications yet. Click &quot;Add Certification&quot; to start.
        </Typography>
      )}
    </Box>
  );
}
