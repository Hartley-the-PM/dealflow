'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface FileUploadZoneProps {
  value: string;
  onChange: (dataUrl: string) => void;
  label?: string;
  accept?: string;
  acceptLabel?: string;
  previewHeight?: number;
}

const DEFAULT_ACCEPT = 'image/png,image/jpeg,image/svg+xml,image/webp,application/pdf,.svg,.png,.jpg,.jpeg,.webp,.pdf';
const DEFAULT_ACCEPT_LABEL = 'PNG, SVG, JPG, WebP, or PDF';

export default function FileUploadZone({
  value,
  onChange,
  label = 'Image',
  accept = DEFAULT_ACCEPT,
  acceptLabel = DEFAULT_ACCEPT_LABEL,
  previewHeight = 48,
}: FileUploadZoneProps) {
  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
        const reader = new FileReader();
        reader.onload = () => {
          const svgText = reader.result as string;
          const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgText)))}`;
          onChange(dataUrl);
        };
        reader.readAsText(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          onChange(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  if (value) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, border: '1px solid #E5E7EB', borderRadius: 1.5, bgcolor: '#FAFBFC' }}>
        <Box
          component="img"
          src={value}
          alt={`${label} preview`}
          sx={{ height: previewHeight, maxWidth: 160, objectFit: 'contain' }}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180, fontSize: '0.7rem' }}>
            {value.startsWith('data:') ? 'Uploaded file' : value}
          </Typography>
        </Box>
        <Button size="small" color="error" variant="text" onClick={() => onChange('')} sx={{ textTransform: 'none', fontSize: '0.7rem', minWidth: 0 }}>
          Remove
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        border: '2px dashed #D1D5DB',
        borderRadius: 2,
        p: 2.5,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        '&:hover': { borderColor: 'primary.main', bgcolor: '#F8FAFC' },
      }}
      onClick={handleUpload}
    >
      <CloudUploadIcon sx={{ fontSize: 28, color: '#9CA3AF', mb: 0.5 }} />
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.8rem', mb: 0.25 }}>
        Click to upload {label.toLowerCase()}
      </Typography>
      <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
        {acceptLabel}
      </Typography>
    </Box>
  );
}
