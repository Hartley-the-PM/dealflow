'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import DescriptionIcon from '@mui/icons-material/Description';
import StarIcon from '@mui/icons-material/Star';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { useOfferTemplateStore } from '@/stores/offerTemplateStore';
import type { OfferTemplate } from '@/types/offerBuilder';

interface TemplatePickerProps {
  onSelect: (template: OfferTemplate) => void;
  onSkip: () => void;
}

const presetIcons: Record<string, React.ReactNode> = {
  'preset-standard': <DescriptionIcon sx={{ fontSize: 32, color: 'primary.main' }} />,
  'preset-premium': <StarIcon sx={{ fontSize: 32, color: '#D97706' }} />,
  'preset-quick': <FlashOnIcon sx={{ fontSize: 32, color: '#059669' }} />,
};

export default function TemplatePicker({ onSelect, onSkip }: TemplatePickerProps) {
  const templates = useOfferTemplateStore((s) => s.templates);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Choose a Template
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Start from a preset template or create from scratch. You can customize modules after selecting.
      </Typography>
      <Grid container spacing={2}>
        {templates.map((template) => (
          <Grid key={template.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardActionArea onClick={() => onSelect(template)} sx={{ height: '100%', p: 0 }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: 3 }}>
                  {presetIcons[template.id] || <BookmarkIcon sx={{ fontSize: 32, color: 'text.secondary' }} />}
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1.5 }}>
                    {template.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                    {template.description}
                  </Typography>
                  <Chip
                    label={`${template.modules.length} modules`}
                    size="small"
                    sx={{ fontSize: '0.7rem' }}
                  />
                  {!template.isPreset && (
                    <Chip label="Custom" size="small" color="primary" variant="outlined" sx={{ mt: 0.5, fontSize: '0.7rem' }} />
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              borderStyle: 'dashed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CardActionArea onClick={onSkip} sx={{ height: '100%', p: 0 }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                  Start from Scratch
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  No template — use classic form
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
