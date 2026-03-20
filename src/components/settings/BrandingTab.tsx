'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import BrandProfilesSection from './BrandProfilesSection';
import ContentBlocksSection from './ContentBlocksSection';
import OfferTemplatesSection from './OfferTemplatesSection';
import WhiteLabelBrandsSection from './WhiteLabelBrandsSection';

export default function BrandingTab() {
  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 0.5 }}>Branding</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your brand identity, reusable content blocks, and offer templates.
      </Typography>

      <BrandProfilesSection />

      <Divider sx={{ my: 4 }} />

      <ContentBlocksSection />

      <Divider sx={{ my: 4 }} />

      <OfferTemplatesSection />

      <Divider sx={{ my: 4 }} />

      <WhiteLabelBrandsSection />
    </Box>
  );
}
