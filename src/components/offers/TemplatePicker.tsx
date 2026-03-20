'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import DescriptionIcon from '@mui/icons-material/Description';
import StarIcon from '@mui/icons-material/Star';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import AddIcon from '@mui/icons-material/Add';
import { useOfferTemplateStore } from '@/stores/offerTemplateStore';
import type { OfferTemplate } from '@/types/offerBuilder';

interface TemplatePickerProps {
  onSelect: (template: OfferTemplate) => void;
  onSkip: () => void;
}

const presetIcons: Record<string, { icon: React.ReactNode; bg: string }> = {
  'preset-standard': {
    icon: <DescriptionIcon sx={{ fontSize: 28, color: '#4F46E5' }} />,
    bg: '#EEF2FF',
  },
  'preset-premium': {
    icon: <StarIcon sx={{ fontSize: 28, color: '#D97706' }} />,
    bg: '#FFFBEB',
  },
  'preset-quick': {
    icon: <FlashOnIcon sx={{ fontSize: 28, color: '#059669' }} />,
    bg: '#ECFDF5',
  },
};

const MODULE_TYPE_SHORTNAMES: Record<string, string> = {
  hero: 'Hero',
  products: 'Products & Pricing',
  product_lines: 'Pricing',
  terms: 'Terms',
  custom_text: 'Text',
  product_showcase: 'Showcase',
  company_about: 'About',
  testimonials: 'Testimonials',
  cover_image: 'Cover',
  divider: 'Divider',
  image: 'Image',
};

const cardHoverSx = {
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  },
};

export default function TemplatePicker({ onSelect, onSkip }: TemplatePickerProps) {
  const templates = useOfferTemplateStore((s) => s.templates);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: '#1A1A2E', mb: 0.5 }}>
        Choose a Template
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Start from a preset template or create from scratch. You can customize modules after selecting.
      </Typography>
      <Grid container spacing={2.5}>
        {templates.map((template) => {
          const preset = presetIcons[template.id];
          const moduleList = template.modules
            .filter((m) => m.type !== 'divider')
            .map((m) => MODULE_TYPE_SHORTNAMES[m.type] || m.type)
            .join(' \u2022 ');

          return (
            <Grid key={template.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined" sx={{ height: '100%', ...cardHoverSx }}>
                <CardActionArea onClick={() => onSelect(template)} sx={{ height: '100%', p: 0 }}>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: 3.5 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        bgcolor: preset?.bg || '#F3F4F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                      }}
                    >
                      {preset?.icon || <BookmarkIcon sx={{ fontSize: 28, color: 'text.secondary' }} />}
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1A1A2E' }}>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.82rem' }}>
                      {template.description}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.7rem' }}>
                      {moduleList}
                    </Typography>
                    {!template.isPreset && (
                      <Box
                        sx={{
                          mt: 1,
                          px: 1,
                          py: 0.25,
                          borderRadius: '4px',
                          bgcolor: '#EEF2FF',
                          border: '1px solid #C7D2FE',
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#4F46E5', fontWeight: 500, fontSize: '0.65rem' }}>
                          Custom
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              borderStyle: 'dashed',
              borderColor: '#D1D5DB',
              ...cardHoverSx,
            }}
          >
            <CardActionArea onClick={onSkip} sx={{ height: '100%', p: 0 }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: 3.5 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: '#F9FAFB',
                    border: '2px dashed #D1D5DB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <AddIcon sx={{ fontSize: 28, color: '#9CA3AF' }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#6B7280' }}>
                  Start from Scratch
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
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
