'use client';

import Box from '@mui/material/Box';
import type { BrandProfile } from '@/types/offerBuilder';

interface BrandedHeaderProps {
  brandProfile?: BrandProfile;
}

export default function BrandedHeader({ brandProfile }: BrandedHeaderProps) {
  if (!brandProfile?.logoUrl) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 4,
        py: 2,
        borderBottom: `2px solid ${brandProfile.accentColor || '#E5E7EB'}`,
      }}
    >
      <Box
        component="img"
        src={brandProfile.logoUrl}
        alt={brandProfile.companyName || 'Company logo'}
        sx={{
          height: 32,
          maxWidth: 160,
          objectFit: 'contain',
        }}
        onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }}
      />
      {brandProfile.companyName && (
        <Box
          sx={{
            fontSize: '0.7rem',
            color: brandProfile.primaryColor || '#6B7280',
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}
        >
          {brandProfile.companyName}
        </Box>
      )}
    </Box>
  );
}
