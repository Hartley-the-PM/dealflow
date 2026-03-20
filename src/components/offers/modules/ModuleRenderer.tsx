'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import type { OfferModule, BrandProfile } from '@/types/offerBuilder';
import type { OfferLine } from '@/types/offer';
import { useFormulationStore } from '@/stores/formulationStore';

interface ModuleRendererProps {
  module: OfferModule;
  offerLines?: OfferLine[];
  products?: Array<{ id: string; name: string; code: string }>;
  brandProfile?: BrandProfile;
}

// Default design tokens
const DEFAULTS = {
  heading: '#1A1A2E',
  body: '#6B7280',
  bodyDark: '#374151',
  accent: '#4F46E5',
  border: '#E5E7EB',
  bgSubtle: '#F9FAFB',
  bgAlt: '#FAFBFC',
  white: '#FFFFFF',
};

// Helper to create a light tint from a hex color (10% opacity equivalent)
function tint(hex: string, opacity: number = 0.08): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const tr = Math.round(r + (255 - r) * (1 - opacity));
  const tg = Math.round(g + (255 - g) * (1 - opacity));
  const tb = Math.round(b + (255 - b) * (1 - opacity));
  return `rgb(${tr},${tg},${tb})`;
}

const ROLE_COLORS: Record<string, string> = {
  'Base Polymer': '#2563EB', 'Additive': '#7C3AED', 'Colorant': '#D97706', 'Filler': '#6B7280', 'Stabilizer': '#059669',
};

export default function ModuleRenderer({ module, offerLines, products, brandProfile }: ModuleRendererProps) {
  const formulations = useFormulationStore((s) => s.formulations);
  // Build themed colors from brand profile
  const accent = brandProfile?.accentColor || DEFAULTS.accent;
  const primary = brandProfile?.primaryColor || DEFAULTS.heading;
  const logo = brandProfile?.logoUrl;
  const companyName = brandProfile?.companyName;

  // Derived themed colors
  const accentLight = tint(accent, 0.08);
  const accentMedium = tint(accent, 0.15);
  const primaryLight = tint(primary, 0.06);

  if (!module.visible) return null;

  const getProductName = (productId: string) => {
    const p = products?.find((pr) => pr.id === productId);
    return p ? `${p.name} (${p.code})` : 'Unknown Product';
  };

  // Themed accent line
  const themedAccentLine = (
    <Box
      sx={{
        width: 60,
        height: 3,
        borderRadius: 2,
        background: `linear-gradient(90deg, ${accent}, ${primary})`,
        mx: 'auto',
        mt: 2,
      }}
    />
  );

  // Themed table header cell style
  const thCellSx = {
    fontWeight: 600,
    fontSize: '0.7rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: DEFAULTS.body,
    borderBottom: `1px solid ${DEFAULTS.border}`,
  };

  switch (module.type) {
    case 'cover_image':
      return (
        <Box
          data-section="cover_image"
          sx={{
            position: 'relative',
            width: '100%',
            minHeight: 320,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2,
            overflow: 'hidden',
            backgroundImage: module.backgroundImageUrl ? `url(${module.backgroundImageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            bgcolor: module.backgroundImageUrl ? undefined : primary,
          }}
        >
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: module.overlayColor, opacity: module.overlayOpacity }} />
          <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', px: 4, py: 6 }}>
            {module.title && (
              <Typography variant="h3" sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: module.fontColor || DEFAULTS.white, fontSize: { xs: '2rem', sm: '2.5rem' }, mb: 1, textShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
                {module.title}
              </Typography>
            )}
            {module.subtitle && (
              <Typography variant="h6" sx={{ color: module.fontColor ? `${module.fontColor}d9` : 'rgba(255,255,255,0.85)', fontWeight: 400, letterSpacing: '0.01em', textShadow: '0 1px 8px rgba(0,0,0,0.15)' }}>
                {module.subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      );

    case 'divider':
      if (module.style === 'space') return <Box data-section="divider" sx={{ height: module.height }} />;
      if (module.style === 'dots') {
        return (
          <Box data-section="divider" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, py: `${module.height / 2}px` }}>
            {[0, 1, 2].map((i) => (
              <Box key={i} sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: accent, opacity: 0.3 }} />
            ))}
          </Box>
        );
      }
      return (
        <Box data-section="divider" sx={{ py: `${module.height / 2}px` }}>
          <Box sx={{ height: 1, bgcolor: DEFAULTS.border }} />
        </Box>
      );

    case 'image': {
      const widthMap = { full: '100%', medium: '66%', small: '40%' };
      return (
        <Box data-section="image" sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: module.alignment === 'left' ? 'flex-start' : module.alignment === 'right' ? 'flex-end' : 'center' }}>
          {module.imageUrl && (
            <Box component="img" src={module.imageUrl} alt={module.alt || module.caption || 'Image'} sx={{ width: widthMap[module.width], maxWidth: '100%', height: 'auto', borderRadius: 2, display: 'block' }} onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }} />
          )}
          {module.caption && <Typography variant="caption" sx={{ color: DEFAULTS.body, mt: 1, fontStyle: 'italic' }}>{module.caption}</Typography>}
        </Box>
      );
    }

    case 'hero':
      return (
        <Box sx={{ textAlign: 'center', py: 5, px: 4, bgcolor: primaryLight }} data-section="hero">
          {/* Show brand logo if available, fallback to module logo */}
          {(logo || module.logoUrl) && (
            <Box
              component="img"
              src={logo || module.logoUrl}
              alt="Logo"
              sx={{ maxHeight: 52, mb: 3, mx: 'auto', display: 'block', objectFit: 'contain' }}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: primary, fontSize: '1.75rem', mb: 0.5 }}>
            {module.title || 'Offer Proposal'}
          </Typography>
          {module.customerName && (
            <Typography variant="h6" sx={{ color: DEFAULTS.body, fontWeight: 400, letterSpacing: '0.01em' }}>
              Prepared for {module.customerName}
            </Typography>
          )}
          {themedAccentLine}
          {module.date && (
            <Typography variant="body2" sx={{ color: DEFAULTS.body, mt: 2 }}>
              {new Date(module.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
          )}
          {module.intro && (
            <Typography variant="body1" sx={{ color: DEFAULTS.body, lineHeight: 1.7, mt: 3, maxWidth: 560, mx: 'auto' }}>
              {module.intro}
            </Typography>
          )}
        </Box>
      );

    case 'product_lines':
      if (!offerLines || offerLines.length === 0) {
        return <Box sx={{ py: 4, px: 4 }} data-section="product_lines"><Typography sx={{ color: DEFAULTS.body }}>No product lines.</Typography></Box>;
      }
      return (
        <Box sx={{ py: 5, px: 4 }} data-section="product_lines">
          <Typography sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: primary, fontSize: '1.25rem', mb: 0.5 }}>Pricing</Typography>
          <Typography variant="body2" sx={{ color: DEFAULTS.body, mb: 3 }}>Detailed pricing breakdown for this proposal</Typography>
          <TableContainer sx={{ borderRadius: 2, border: `1px solid ${DEFAULTS.border}`, overflow: 'hidden' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: accentLight }}>
                  <TableCell sx={thCellSx}>Product</TableCell>
                  {module.showQuantity && <TableCell align="right" sx={thCellSx}>Qty</TableCell>}
                  {module.showUnit && <TableCell sx={thCellSx}>Unit</TableCell>}
                  {module.showUnitPrice && <TableCell align="right" sx={thCellSx}>Price/Unit</TableCell>}
                  {module.showTotal && <TableCell align="right" sx={thCellSx}>Total</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {offerLines.map((line, idx) => (
                  <TableRow key={line.id} sx={{ bgcolor: idx % 2 === 1 ? DEFAULTS.bgAlt : 'transparent', '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ color: DEFAULTS.bodyDark, fontWeight: 500 }}>{getProductName(line.productId)}</TableCell>
                    {module.showQuantity && <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', color: DEFAULTS.bodyDark }}>{line.quantity !== null ? line.quantity.toLocaleString() : '\u2014'}</TableCell>}
                    {module.showUnit && <TableCell sx={{ color: DEFAULTS.body }}>{line.unit}</TableCell>}
                    {module.showUnitPrice && <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', color: DEFAULTS.bodyDark, fontWeight: 500 }}>{line.currency} {line.pricePerUnit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>}
                    {module.showTotal && <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', color: primary, fontWeight: 600 }}>{line.quantity !== null ? `${line.currency} ${(line.pricePerUnit * line.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '\u2014'}</TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      );

    case 'terms':
      return (
        <Box sx={{ py: 5, px: 4 }} data-section="terms">
          <Typography sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: primary, fontSize: '1.25rem', mb: 0.5 }}>Terms & Conditions</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {module.paymentTerms && (
              <Box sx={{ pl: 2, borderLeft: `3px solid ${accent}` }}>
                <Typography variant="caption" sx={{ color: DEFAULTS.body, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.65rem' }}>Payment Terms</Typography>
                <Typography variant="body2" sx={{ color: DEFAULTS.bodyDark, fontWeight: 500 }}>{module.paymentTerms}</Typography>
              </Box>
            )}
            {module.incoterms && (
              <Box sx={{ pl: 2, borderLeft: `3px solid ${accent}` }}>
                <Typography variant="caption" sx={{ color: DEFAULTS.body, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.65rem' }}>Incoterms</Typography>
                <Typography variant="body2" sx={{ color: DEFAULTS.bodyDark, fontWeight: 500 }}>{module.incoterms}</Typography>
              </Box>
            )}
            {module.validity && (
              <Box sx={{ pl: 2, borderLeft: `3px solid ${accent}` }}>
                <Typography variant="caption" sx={{ color: DEFAULTS.body, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.65rem' }}>Validity</Typography>
                <Typography variant="body2" sx={{ color: DEFAULTS.bodyDark, fontWeight: 500 }}>{module.validity}</Typography>
              </Box>
            )}
            {module.delivery && (
              <Box sx={{ pl: 2, borderLeft: `3px solid ${accent}` }}>
                <Typography variant="caption" sx={{ color: DEFAULTS.body, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.65rem' }}>Delivery</Typography>
                <Typography variant="body2" sx={{ color: DEFAULTS.bodyDark, fontWeight: 500 }}>{module.delivery}</Typography>
              </Box>
            )}
            {module.legalNotes && (
              <Box sx={{ pl: 2, borderLeft: `3px solid ${DEFAULTS.border}`, mt: 1 }}>
                <Typography variant="caption" sx={{ color: DEFAULTS.body, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.65rem' }}>Legal Notes</Typography>
                <Typography variant="body2" sx={{ color: DEFAULTS.body, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{module.legalNotes}</Typography>
              </Box>
            )}
          </Box>
        </Box>
      );

    case 'custom_text':
      return (
        <Box sx={{ py: 5, px: 4 }} data-section="custom_text">
          {module.heading && <Typography sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: primary, fontSize: '1.25rem', mb: 1.5 }}>{module.heading}</Typography>}
          {module.body && <Typography variant="body1" sx={{ color: DEFAULTS.body, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{module.body}</Typography>}
        </Box>
      );

    case 'product_showcase':
      return (
        <Box sx={{ py: 5, px: 4 }} data-section="product_showcase">
          <Typography sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: primary, fontSize: '1.25rem', mb: 0.5 }}>Products</Typography>
          <Typography variant="body2" sx={{ color: DEFAULTS.body, mb: 3 }}>Featured products included in this proposal</Typography>
          <Grid container spacing={2.5}>
            {module.products.map((product, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card elevation={0} sx={{ borderRadius: '12px', border: `1px solid ${DEFAULTS.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.2s ease', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderColor: accent }, height: '100%' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    {product.imageUrl && <Box component="img" src={product.imageUrl} alt={product.name} sx={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: '8px', mb: 2 }} onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }} />}
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: primary, fontSize: '0.9rem' }}>{product.name}</Typography>
                    <Typography variant="body2" sx={{ color: DEFAULTS.body, lineHeight: 1.7, mb: 0.5 }}>{product.description}</Typography>
                    {product.specs && <Typography variant="caption" sx={{ color: DEFAULTS.body, fontSize: '0.7rem' }}>{product.specs}</Typography>}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      );

    case 'company_about':
      return (
        <Box sx={{ py: 5, px: 4, bgcolor: primaryLight }} data-section="company_about">
          {logo && (
            <Box component="img" src={logo} alt={companyName || 'Company'} sx={{ maxHeight: 36, mb: 2, objectFit: 'contain', display: 'block' }} onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }} />
          )}
          <Typography sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: primary, fontSize: '1.25rem', mb: 0.5 }}>About Us</Typography>
          {module.mission && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="overline" sx={{ color: DEFAULTS.body, letterSpacing: '0.08em', fontSize: '0.65rem' }}>Mission</Typography>
              <Typography variant="body1" sx={{ color: DEFAULTS.body, lineHeight: 1.7, maxWidth: 600 }}>{module.mission}</Typography>
            </Box>
          )}
          {module.vision && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="overline" sx={{ color: DEFAULTS.body, letterSpacing: '0.08em', fontSize: '0.65rem' }}>Vision</Typography>
              <Typography variant="body1" sx={{ color: DEFAULTS.body, lineHeight: 1.7, maxWidth: 600 }}>{module.vision}</Typography>
            </Box>
          )}
          {(module.values || []).length > 0 && (
            <Box>
              <Typography variant="overline" sx={{ color: DEFAULTS.body, letterSpacing: '0.08em', fontSize: '0.65rem' }}>Our Values</Typography>
              <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {(module.values || []).map((val, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutlineIcon sx={{ fontSize: 16, color: accent }} />
                    <Typography variant="body2" sx={{ color: DEFAULTS.bodyDark }}>{val}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      );

    case 'certifications':
      return (
        <Box sx={{ py: 5, px: 4 }} data-section="certifications">
          <Typography sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: primary, fontSize: '1.25rem', mb: 2 }}>
            {module.title || 'Certifications & Compliance'}
          </Typography>
          <Grid container spacing={2}>
            {module.certifications.map((cert, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6 }}>
                <Box sx={{ p: 2.5, borderRadius: '12px', border: `1px solid ${DEFAULTS.border}`, bgcolor: accentLight, height: '100%' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: primary, mb: 0.5 }}>{cert.name}</Typography>
                  {cert.issuer && <Typography variant="caption" sx={{ color: accent, fontWeight: 500, display: 'block', mb: 0.5 }}>{cert.issuer}</Typography>}
                  {cert.description && <Typography variant="body2" sx={{ color: DEFAULTS.body, lineHeight: 1.6, fontSize: '0.8rem' }}>{cert.description}</Typography>}
                </Box>
              </Grid>
            ))}
          </Grid>
          {module.certifications.length === 0 && (
            <Typography variant="body2" sx={{ color: DEFAULTS.body, textAlign: 'center', py: 3 }}>No certifications added yet.</Typography>
          )}
        </Box>
      );

    case 'testimonials':
      return (
        <Box sx={{ py: 5, px: 4 }} data-section="testimonials">
          <Typography sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: primary, fontSize: '1.25rem', mb: 0.5 }}>What Our Clients Say</Typography>
          <Grid container spacing={2.5} sx={{ mt: 1 }}>
            {module.testimonials.map((t, i) => (
              <Grid key={i} size={{ xs: 12, md: 6 }}>
                <Box sx={{ p: 3, borderRadius: '12px', border: `1px solid ${DEFAULTS.border}`, height: '100%', display: 'flex', flexDirection: 'column', transition: 'border-color 0.2s', '&:hover': { borderColor: accent } }}>
                  <Typography sx={{ fontSize: '2rem', lineHeight: 1, color: accent, fontFamily: 'Georgia, serif', mb: 1, opacity: 0.5 }}>&ldquo;</Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic', color: DEFAULTS.bodyDark, lineHeight: 1.7, mb: 2, flex: 1 }}>{t.quote}</Typography>
                  <Box sx={{ borderTop: `1px solid ${DEFAULTS.border}`, pt: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: primary }}>{t.author}</Typography>
                    {t.company && <Typography variant="caption" sx={{ color: DEFAULTS.body, display: 'block' }}>{t.company}</Typography>}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      );

    case 'products': {
      const entriesWithImages = module.entries.filter((e) => e.imageUrl || e.description);
      return (
        <Box data-section="products">
          {entriesWithImages.length > 0 && (
            <Box sx={{ py: 5, px: 4 }}>
              <Typography sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: primary, fontSize: '1.25rem', mb: 0.5 }}>Products</Typography>
              <Typography variant="body2" sx={{ color: DEFAULTS.body, mb: 3 }}>Featured products included in this proposal</Typography>
              <Grid container spacing={2.5}>
                {entriesWithImages.map((entry) => {
                  const productInfo = products?.find((p) => p.id === entry.productId);
                  return (
                    <Grid key={entry.id} size={{ xs: 12, sm: 6, md: 4 }}>
                      <Card elevation={0} sx={{ borderRadius: '12px', border: `1px solid ${DEFAULTS.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.2s ease', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderColor: accent }, height: '100%' }}>
                        <CardContent sx={{ p: 2.5 }}>
                          {entry.imageUrl && <Box component="img" src={entry.imageUrl} alt={productInfo?.name || 'Product'} sx={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: '8px', mb: 2 }} onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }} />}
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: primary, fontSize: '0.9rem' }}>{productInfo ? `${productInfo.name} (${productInfo.code})` : 'Product'}</Typography>
                          {entry.description && <Typography variant="body2" sx={{ color: DEFAULTS.body, lineHeight: 1.7, mb: 0.5 }}>{entry.description}</Typography>}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}
          {module.entries.length > 0 && (
            <Box sx={{ py: 5, px: 4 }}>
              <Typography sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: primary, fontSize: '1.25rem', mb: 0.5 }}>Pricing</Typography>
              <Typography variant="body2" sx={{ color: DEFAULTS.body, mb: 3 }}>Detailed pricing breakdown for this proposal</Typography>
              <TableContainer sx={{ borderRadius: 2, border: `1px solid ${DEFAULTS.border}`, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: accentLight }}>
                      <TableCell sx={thCellSx}>Product</TableCell>
                      {module.showQuantity && <TableCell align="right" sx={thCellSx}>Qty</TableCell>}
                      {module.showUnit && <TableCell sx={thCellSx}>Unit</TableCell>}
                      {module.showUnitPrice && <TableCell align="right" sx={thCellSx}>Price/Unit</TableCell>}
                      {module.showTotal && <TableCell align="right" sx={thCellSx}>Total</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {module.entries.map((entry, idx) => {
                      const productInfo = products?.find((p) => p.id === entry.productId);
                      const productName = productInfo ? `${productInfo.name} (${productInfo.code})` : 'Product';
                      return (
                        <TableRow key={entry.id} sx={{ bgcolor: idx % 2 === 1 ? DEFAULTS.bgAlt : 'transparent', '&:last-child td': { borderBottom: 0 } }}>
                          <TableCell sx={{ color: DEFAULTS.bodyDark, fontWeight: 500 }}>{productName}</TableCell>
                          {module.showQuantity && <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', color: DEFAULTS.bodyDark }}>{entry.quantity !== null ? entry.quantity.toLocaleString() : '\u2014'}</TableCell>}
                          {module.showUnit && <TableCell sx={{ color: DEFAULTS.body }}>{entry.unit}</TableCell>}
                          {module.showUnitPrice && <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', color: DEFAULTS.bodyDark, fontWeight: 500 }}>${entry.pricePerUnit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>}
                          {module.showTotal && <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', color: primary, fontWeight: 600 }}>{entry.quantity !== null ? `$${(entry.pricePerUnit * entry.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '\u2014'}</TableCell>}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      );
    }

    case 'formulation': {
      const fm = formulations.find((f) => f.id === module.formulationId);
      return (
        <Box data-section="formulation" sx={{ py: 4, px: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: primary, mb: 0.5, fontSize: '1.1rem' }}>
            {module.title || 'Formulation Details'}
          </Typography>
          {themedAccentLine}
          {!fm ? (
            <Box sx={{ mt: 3, p: 2.5, bgcolor: DEFAULTS.bgSubtle, borderRadius: 2, border: `1px solid ${DEFAULTS.border}` }}>
              <Typography variant="body2" sx={{ color: DEFAULTS.body, fontStyle: 'italic' }}>
                No formulation selected.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ mt: 3 }}>
              {/* Composition chart */}
              {module.showPercentages && (
                <Box sx={{ mb: 3, p: 2.5, bgcolor: DEFAULTS.bgSubtle, borderRadius: 2, border: `1px solid ${DEFAULTS.border}` }}>
                  <Typography variant="caption" sx={{ color: DEFAULTS.body, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1.5 }}>
                    Composition
                  </Typography>
                  {fm.ingredients.map((ing) => {
                    const color = ROLE_COLORS[ing.role || ''] || '#9CA3AF';
                    return (
                      <Box key={ing.id} sx={{ mb: 1.25 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.85rem', color: DEFAULTS.bodyDark }}>{ing.productName}</Typography>
                            {ing.role && <Chip label={ing.role} size="small" sx={{ fontSize: '0.55rem', height: 16, bgcolor: `${color}15`, color }} />}
                          </Box>
                          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem', color: DEFAULTS.bodyDark }}>{ing.percentage}%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={ing.percentage} sx={{ height: 8, borderRadius: 1, bgcolor: '#E5E7EB', '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 1 } }} />
                      </Box>
                    );
                  })}
                </Box>
              )}
              {/* TDS */}
              {module.showTds && fm.calculatedTds && (
                <Box sx={{ mb: 3, p: 2.5, bgcolor: DEFAULTS.bgSubtle, borderRadius: 2, border: `1px solid ${DEFAULTS.border}` }}>
                  <Typography variant="caption" sx={{ color: DEFAULTS.body, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1.5 }}>
                    Technical Properties
                  </Typography>
                  <Grid container spacing={1.5}>
                    {fm.calculatedTds.density && (
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <Box sx={{ p: 1.5, bgcolor: '#FFFFFF', borderRadius: 1, border: `1px solid ${DEFAULTS.border}` }}>
                          <Typography variant="caption" sx={{ color: DEFAULTS.body }}>Density</Typography>
                          <Typography variant="body2" fontWeight={500} sx={{ color: DEFAULTS.bodyDark }}>{fm.calculatedTds.density} g/cm³</Typography>
                        </Box>
                      </Grid>
                    )}
                    {fm.calculatedTds.meltFlowIndex && (
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <Box sx={{ p: 1.5, bgcolor: '#FFFFFF', borderRadius: 1, border: `1px solid ${DEFAULTS.border}` }}>
                          <Typography variant="caption" sx={{ color: DEFAULTS.body }}>Melt Flow Index</Typography>
                          <Typography variant="body2" fontWeight={500} sx={{ color: DEFAULTS.bodyDark }}>{fm.calculatedTds.meltFlowIndex}</Typography>
                        </Box>
                      </Grid>
                    )}
                    {fm.calculatedTds.tensileStrength && (
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <Box sx={{ p: 1.5, bgcolor: '#FFFFFF', borderRadius: 1, border: `1px solid ${DEFAULTS.border}` }}>
                          <Typography variant="caption" sx={{ color: DEFAULTS.body }}>Tensile Strength</Typography>
                          <Typography variant="body2" fontWeight={500} sx={{ color: DEFAULTS.bodyDark }}>{fm.calculatedTds.tensileStrength} MPa</Typography>
                        </Box>
                      </Grid>
                    )}
                    {fm.calculatedTds.elongationAtBreak && (
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <Box sx={{ p: 1.5, bgcolor: '#FFFFFF', borderRadius: 1, border: `1px solid ${DEFAULTS.border}` }}>
                          <Typography variant="caption" sx={{ color: DEFAULTS.body }}>Elongation</Typography>
                          <Typography variant="body2" fontWeight={500} sx={{ color: DEFAULTS.bodyDark }}>{fm.calculatedTds.elongationAtBreak}%</Typography>
                        </Box>
                      </Grid>
                    )}
                    {fm.calculatedTds.flexuralModulus && (
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <Box sx={{ p: 1.5, bgcolor: '#FFFFFF', borderRadius: 1, border: `1px solid ${DEFAULTS.border}` }}>
                          <Typography variant="caption" sx={{ color: DEFAULTS.body }}>Flexural Modulus</Typography>
                          <Typography variant="body2" fontWeight={500} sx={{ color: DEFAULTS.bodyDark }}>{fm.calculatedTds.flexuralModulus} MPa</Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
              {/* Recycled content */}
              {module.showRecycledContent && fm.recycledContent && fm.recycledContent.totalPercent > 0 && (
                <Box sx={{ p: 2.5, bgcolor: DEFAULTS.bgSubtle, borderRadius: 2, border: `1px solid ${DEFAULTS.border}` }}>
                  <Typography variant="caption" sx={{ color: DEFAULTS.body, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>
                    Recycled Content
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label={`${fm.recycledContent.totalPercent}% Total`} size="small" sx={{ fontSize: '0.75rem', bgcolor: '#D1FAE5', color: '#059669', fontWeight: 600 }} />
                    {fm.recycledContent.pcrPercent > 0 && <Chip label={`${fm.recycledContent.pcrPercent}% PCR`} size="small" sx={{ fontSize: '0.75rem', bgcolor: '#DBEAFE', color: '#2563EB' }} />}
                    {fm.recycledContent.pirPercent > 0 && <Chip label={`${fm.recycledContent.pirPercent}% PIR`} size="small" sx={{ fontSize: '0.75rem', bgcolor: '#EDE9FE', color: '#7C3AED' }} />}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
      );
    }

    default:
      return null;
  }
}
