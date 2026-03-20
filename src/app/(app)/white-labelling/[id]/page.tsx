'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LabelIcon from '@mui/icons-material/Label';
import InventoryIcon from '@mui/icons-material/Inventory';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { useWhiteLabelStore } from '@/stores/whiteLabelStore';
import { useProductStore } from '@/stores/productStore';
import { useHydration } from '@/hooks/useHydration';

const PRODUCT_TYPE_COLORS: Record<string, string> = {
  LDPE: '#2563EB', HDPE: '#059669', PP: '#D97706', PVC: '#7C3AED', PS: '#DC2626', PET: '#0891B2',
};

function TDSRangeRow({ label, min, max, unit }: { label: string; min?: number | string; max?: number | string; unit?: string }) {
  if (min == null && max == null) return null;
  const display =
    min != null && max != null
      ? `${min} - ${max}${unit ? ` ${unit}` : ''}`
      : `${min ?? max}${unit ? ` ${unit}` : ''}`;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid #F3F4F6' }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8rem', textAlign: 'right' }}>
        {display}
      </Typography>
    </Box>
  );
}

export default function WhiteLabelDetailPage() {
  const hydrated = useHydration();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const products = useWhiteLabelStore((s) => s.products);
  const getBrandById = useWhiteLabelStore((s) => s.getBrandById);
  const deleteProduct = useWhiteLabelStore((s) => s.deleteProduct);
  const getProductById = useProductStore((s) => s.getProductById);

  const wlProduct = products.find((p) => p.id === id);
  const brand = wlProduct ? getBrandById(wlProduct.brandId) : undefined;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (!hydrated) return null;

  if (!wlProduct) {
    return (
      <Box>
        <PageHeader
          title="Product Not Found"
          breadcrumbs={[
            { label: 'Product Management' },
            { label: 'White Labelling', href: '/white-labelling' },
          ]}
        />
        <EmptyState message="The requested white label product could not be found." />
      </Box>
    );
  }

  const catColor = PRODUCT_TYPE_COLORS[wlProduct.productType] || '#6B7280';
  const linkedProducts = wlProduct.linkedProductIds
    .map((pid) => getProductById(pid))
    .filter(Boolean);

  const handleDelete = () => {
    deleteProduct(id);
    router.push('/white-labelling');
  };

  return (
    <Box>
      <PageHeader
        title={wlProduct.name}
        breadcrumbs={[
          { label: 'Product Management' },
          { label: 'White Labelling', href: '/white-labelling' },
          { label: wlProduct.name },
        ]}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/white-labelling')}
            >
              Back
            </Button>
          </Box>
        }
      />

      {/* Brand logo prominently in header */}
      {brand && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box
            sx={{
              width: 80, height: 80, borderRadius: 2, bgcolor: '#FFFFFF',
              border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0, overflow: 'hidden', p: 1.5,
            }}
          >
            {brand.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brand.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <LabelIcon sx={{ fontSize: 36, color: '#9CA3AF' }} />
            )}
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>{brand.name}</Typography>
            <Typography variant="body2" color="text.secondary">{brand.prefix} Brand</Typography>
          </Box>
        </Box>
      )}

      {/* Header badges */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
          {wlProduct.code}
        </Typography>
        <Chip
          label={wlProduct.family}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.7rem' }}
        />
        <Chip
          label={wlProduct.productType}
          size="small"
          sx={{ bgcolor: `${catColor}15`, color: catColor, fontWeight: 600, fontSize: '0.7rem' }}
        />
        <Chip
          label="Generic Prime"
          size="small"
          sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 500, fontSize: '0.7rem' }}
        />
      </Box>

      <Grid container spacing={3}>
        {/* ===== Left Column (8/12) ===== */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Product Info Card */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, color: catColor }}>
                Product Information
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid #F3F4F6' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Name</Typography>
                  <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8rem' }}>{wlProduct.name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid #F3F4F6' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Code</Typography>
                  <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{wlProduct.code}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid #F3F4F6' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Family</Typography>
                  <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8rem' }}>{wlProduct.family}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid #F3F4F6' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Category</Typography>
                  <Chip label={wlProduct.productType} size="small" sx={{ bgcolor: `${catColor}15`, color: catColor, fontWeight: 600, fontSize: '0.7rem' }} />
                </Box>
                {wlProduct.notes && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Notes</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', maxWidth: '60%', textAlign: 'right' }}>{wlProduct.notes}</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* TDS Ranges Card */}
          {wlProduct.tdsRanges && (
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, color: catColor }}>
                  TDS Ranges
                </Typography>
                <TDSRangeRow label="Density" min={wlProduct.tdsRanges.densityMin} max={wlProduct.tdsRanges.densityMax} unit="g/cm3" />
                <TDSRangeRow label="Melt Flow Index" min={wlProduct.tdsRanges.mfiMin} max={wlProduct.tdsRanges.mfiMax} />
                <TDSRangeRow label="Tensile Strength" min={wlProduct.tdsRanges.tensileMin} max={wlProduct.tdsRanges.tensileMax} unit="MPa" />
                <TDSRangeRow label="Elongation at Break" min={wlProduct.tdsRanges.elongationMin} max={wlProduct.tdsRanges.elongationMax} unit="%" />
                <TDSRangeRow label="Flexural Modulus" min={wlProduct.tdsRanges.flexuralMin} max={wlProduct.tdsRanges.flexuralMax} unit="MPa" />
                <TDSRangeRow label="Melting Point" min={wlProduct.tdsRanges.meltingPointMin} max={wlProduct.tdsRanges.meltingPointMax} />
              </CardContent>
            </Card>
          )}

          {/* Linked Products Card */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, color: catColor }}>
                Linked Products ({linkedProducts.length})
              </Typography>
              {linkedProducts.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No linked products.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {linkedProducts.map((bp) => {
                    if (!bp) return null;
                    const supplierLogo = bp.tds?.supplierLogo;
                    return (
                      <Box
                        key={bp.id}
                        onClick={() => router.push(`/products/${bp.id}`)}
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 1.5,
                          p: 1.5, borderRadius: 1, border: '1px solid #E5E7EB',
                          cursor: 'pointer', transition: 'background 0.15s',
                          '&:hover': { bgcolor: '#F9FAFB' },
                        }}
                      >
                        <Box
                          sx={{
                            width: 40, height: 40, borderRadius: 1, bgcolor: '#FFFFFF',
                            border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', flexShrink: 0, overflow: 'hidden', p: 0.5,
                          }}
                        >
                          {supplierLogo ? (
                            <img
                              src={supplierLogo}
                              alt={bp.tds?.supplier || ''}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <InventoryIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                          )}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>{bp.name}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                            {bp.code}
                          </Typography>
                        </Box>
                        <Chip
                          label={bp.productType}
                          size="small"
                          sx={{
                            bgcolor: `${PRODUCT_TYPE_COLORS[bp.productType] || '#6B7280'}15`,
                            color: PRODUCT_TYPE_COLORS[bp.productType] || '#6B7280',
                            fontWeight: 600, fontSize: '0.65rem',
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ===== Right Column (4/12) ===== */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ position: 'sticky', top: 24, mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                Summary
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Brand</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                    {brand?.logoUrl && (
                      <Box
                        component="img"
                        src={brand.logoUrl}
                        alt={brand.name}
                        sx={{ width: 20, height: 20, objectFit: 'contain', borderRadius: '2px' }}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <Typography variant="body2" fontWeight={500}>{brand?.name || 'Unknown'}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Family</Typography>
                  <Typography variant="body2" fontWeight={500}>{wlProduct.family}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Category</Typography>
                  <Chip
                    label={wlProduct.productType}
                    size="small"
                    sx={{ bgcolor: `${catColor}15`, color: catColor, fontWeight: 600, fontSize: '0.7rem', mt: 0.25 }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Linked Products</Typography>
                  <Typography variant="body2" fontWeight={500}>{linkedProducts.length}</Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Delete Product
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Pricing Section */}
          <Card variant="outlined" sx={{ position: 'sticky', top: 300 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AttachMoneyIcon sx={{ fontSize: 20, color: '#6B7280' }} />
                <Typography variant="subtitle2" fontWeight={600}>
                  Pricing
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <AttachMoneyIcon sx={{ fontSize: 40, color: '#D1D5DB', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Pricing coming soon
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Configure pricing tiers, volume discounts, and margin targets for this white label product.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete White Label Product</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete &quot;{wlProduct.name}&quot;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
