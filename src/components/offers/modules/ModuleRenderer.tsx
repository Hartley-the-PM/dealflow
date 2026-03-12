'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import type { OfferModule } from '@/types/offerBuilder';
import type { OfferLine } from '@/types/offer';

interface ModuleRendererProps {
  module: OfferModule;
  offerLines?: OfferLine[];
  products?: Array<{ id: string; name: string; code: string }>;
}

export default function ModuleRenderer({ module, offerLines, products }: ModuleRendererProps) {
  if (!module.visible) return null;

  const getProductName = (productId: string) => {
    const p = products?.find((pr) => pr.id === productId);
    return p ? `${p.name} (${p.code})` : 'Unknown Product';
  };

  switch (module.type) {
    case 'hero':
      return (
        <Box sx={{ textAlign: 'center', py: 4, px: 3 }} data-section="hero">
          {module.logoUrl && (
            <Box
              component="img"
              src={module.logoUrl}
              alt="Logo"
              sx={{ maxHeight: 60, mb: 2, mx: 'auto', display: 'block' }}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {module.title || 'Offer Proposal'}
          </Typography>
          {module.customerName && (
            <Typography variant="h6" color="text.secondary">
              Prepared for {module.customerName}
            </Typography>
          )}
          {module.date && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {new Date(module.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
          )}
          {module.intro && (
            <Typography variant="body1" sx={{ mt: 3, maxWidth: 600, mx: 'auto', color: 'text.secondary' }}>
              {module.intro}
            </Typography>
          )}
        </Box>
      );

    case 'product_lines':
      if (!offerLines || offerLines.length === 0) {
        return (
          <Box sx={{ py: 2 }} data-section="product_lines">
            <Typography color="text.secondary">No product lines.</Typography>
          </Box>
        );
      }
      return (
        <Box sx={{ py: 2 }} data-section="product_lines">
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Pricing
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                  {module.showQuantity && <TableCell sx={{ fontWeight: 600 }} align="right">Qty</TableCell>}
                  {module.showUnit && <TableCell sx={{ fontWeight: 600 }}>Unit</TableCell>}
                  {module.showUnitPrice && <TableCell sx={{ fontWeight: 600 }} align="right">Price/Unit</TableCell>}
                  {module.showTotal && <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {offerLines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{getProductName(line.productId)}</TableCell>
                    {module.showQuantity && (
                      <TableCell align="right">{line.quantity !== null ? line.quantity.toLocaleString() : '\u2014'}</TableCell>
                    )}
                    {module.showUnit && <TableCell>{line.unit}</TableCell>}
                    {module.showUnitPrice && (
                      <TableCell align="right">
                        {line.currency} {line.pricePerUnit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    )}
                    {module.showTotal && (
                      <TableCell align="right">
                        {line.quantity !== null
                          ? `${line.currency} ${(line.pricePerUnit * line.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          : '\u2014'}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      );

    case 'terms':
      return (
        <Box sx={{ py: 2 }} data-section="terms">
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Terms & Conditions
          </Typography>
          <Grid container spacing={2}>
            {module.paymentTerms && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">Payment Terms</Typography>
                <Typography variant="body2">{module.paymentTerms}</Typography>
              </Grid>
            )}
            {module.incoterms && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">Incoterms</Typography>
                <Typography variant="body2">{module.incoterms}</Typography>
              </Grid>
            )}
            {module.validity && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">Validity</Typography>
                <Typography variant="body2">{module.validity}</Typography>
              </Grid>
            )}
            {module.delivery && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">Delivery</Typography>
                <Typography variant="body2">{module.delivery}</Typography>
              </Grid>
            )}
            {module.legalNotes && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">Legal Notes</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{module.legalNotes}</Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      );

    case 'custom_text':
      return (
        <Box sx={{ py: 2 }} data-section="custom_text">
          {module.heading && (
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {module.heading}
            </Typography>
          )}
          {module.body && (
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {module.body}
            </Typography>
          )}
        </Box>
      );

    case 'product_showcase':
      return (
        <Box sx={{ py: 2 }} data-section="product_showcase">
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Products
          </Typography>
          <Grid container spacing={2}>
            {module.products.map((product, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card variant="outlined">
                  <CardContent>
                    {product.imageUrl && (
                      <Box
                        component="img"
                        src={product.imageUrl}
                        alt={product.name}
                        sx={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 1, mb: 1 }}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <Typography variant="subtitle2" fontWeight={600}>{product.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{product.description}</Typography>
                    {product.specs && (
                      <Typography variant="caption" color="text.secondary">{product.specs}</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      );

    case 'company_about':
      return (
        <Box sx={{ py: 2 }} data-section="company_about">
          <Typography variant="h6" fontWeight={600} gutterBottom>
            About Us
          </Typography>
          {module.mission && (
            <Typography variant="body1" sx={{ mb: 2 }}>{module.mission}</Typography>
          )}
          {module.certifications.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Certifications</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {module.certifications.map((cert, i) => (
                  <Box key={i} sx={{ px: 1.5, py: 0.5, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
                    <Typography variant="caption">{cert}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          {module.differentiators.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>What Sets Us Apart</Typography>
              {module.differentiators.map((diff, i) => (
                <Typography key={i} variant="body2" sx={{ pl: 2, mb: 0.5 }}>
                  • {diff}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      );

    case 'testimonials':
      return (
        <Box sx={{ py: 2 }} data-section="testimonials">
          <Typography variant="h6" fontWeight={600} gutterBottom>
            What Our Clients Say
          </Typography>
          <Grid container spacing={2}>
            {module.testimonials.map((t, i) => (
              <Grid key={i} size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <FormatQuoteIcon sx={{ color: 'primary.light', fontSize: 28, mb: 1 }} />
                    <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 1.5 }}>
                      &ldquo;{t.quote}&rdquo;
                    </Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {t.author}
                    </Typography>
                    {t.company && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {t.company}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      );

    default:
      return null;
  }
}
