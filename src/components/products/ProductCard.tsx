'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

const categoryColors: Record<string, { bg: string; color: string }> = {
  LDPE: { bg: '#DBEAFE', color: '#1D4ED8' },
  HDPE: { bg: '#D1FAE5', color: '#059669' },
  PP: { bg: '#FEF3C7', color: '#D97706' },
  PVC: { bg: '#FCE7F3', color: '#DB2777' },
  PS: { bg: '#EDE9FE', color: '#7C3AED' },
  PET: { bg: '#FFEDD5', color: '#EA580C' },
};

export default function ProductCard({ product }: ProductCardProps) {
  const chipColor = categoryColors[product.category] || { bg: '#F3F4F6', color: '#374151' };

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {product.name}
          </Typography>
          <Chip
            label={product.category}
            size="small"
            sx={{
              bgcolor: chipColor.bg,
              color: chipColor.color,
              fontWeight: 600,
              fontSize: '0.75rem',
              flexShrink: 0,
            }}
          />
        </Box>
        {product.legacyName && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {product.legacyName}
          </Typography>
        )}
        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
          Code: {product.code}
        </Typography>
      </CardContent>
    </Card>
  );
}
