'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import DownloadIcon from '@mui/icons-material/Download';
import InventoryIcon from '@mui/icons-material/Inventory';
// FolderZipIcon removed — packages created from deals only
import PageHeader from '@/components/shared/PageHeader';
import StatusChip from '@/components/shared/StatusChip';
import EmptyState from '@/components/shared/EmptyState';
import MSPPriceChart from '@/components/catalog/MSPPriceChart';
import ProductCertifications from '@/components/catalog/ProductCertifications';
import { useProductStore } from '@/stores/productStore';
import { usePricingStore } from '@/stores/pricingStore';
import { useDealStore } from '@/stores/dealStore';
import { useOfferStore } from '@/stores/offerStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useHydration } from '@/hooks/useHydration';
import { format } from 'date-fns';

const PRODUCT_TYPE_COLORS: Record<string, string> = {
  LDPE: '#2563EB', HDPE: '#059669', PP: '#D97706', PVC: '#7C3AED', PS: '#DC2626', PET: '#0891B2',
};

interface DealUsageRow {
  dealId: string;
  customerName: string;
  dealName: string;
  offerVersion: number;
  price: number;
  currency: string;
  offerStatus: string;
  margin: number | null;
  date: string;
}

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

function TDSRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid #F3F4F6' }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8rem', textAlign: 'right' }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function ProductDetailPage() {
  const hydrated = useHydration();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [tab, setTab] = useState(0);

  const getProductById = useProductStore((s) => s.getProductById);
  const entries = usePricingStore((s) => s.entries);
  const deals = useDealStore((s) => s.deals);
  const offers = useOfferStore((s) => s.offers);
  const getCustomerById = useCustomerStore((s) => s.getCustomerById);

  const product = getProductById(id);

  const getLatestMSP = useMemo(() => {
    const productEntries = entries
      .filter((e) => e.productId === id)
      .sort((a, b) => b.month.localeCompare(a.month));
    return productEntries.length > 0 ? productEntries[0].price : null;
  }, [entries, id]);

  const dealUsageRows = useMemo((): DealUsageRow[] => {
    const rows: DealUsageRow[] = [];
    for (const offer of offers) {
      const matchingLines = offer.lines.filter((line) => line.productId === id);
      if (matchingLines.length === 0) continue;
      const deal = deals.find((d) => d.id === offer.dealId);
      if (!deal) continue;
      const customer = getCustomerById(deal.customerId);
      const customerName = customer?.name || 'Unknown';
      for (const line of matchingLines) {
        const margin =
          getLatestMSP !== null && line.pricePerUnit > 0
            ? ((line.pricePerUnit - getLatestMSP) / line.pricePerUnit) * 100
            : null;
        rows.push({
          dealId: deal.id, customerName, dealName: deal.name,
          offerVersion: offer.version, price: line.pricePerUnit,
          currency: line.currency, offerStatus: offer.status,
          margin, date: offer.updatedAt,
        });
      }
    }
    rows.sort((a, b) => b.date.localeCompare(a.date));
    return rows;
  }, [offers, deals, id, getCustomerById, getLatestMSP]);

  if (!hydrated) return null;

  if (!product) {
    return (
      <Box>
        <PageHeader
          title="Product Not Found"
          breadcrumbs={[{ label: 'Catalog', href: '/products' }]}
        />
        <EmptyState message="The requested product could not be found." />
      </Box>
    );
  }

  const tds = product.tds;
  const catColor = PRODUCT_TYPE_COLORS[product.productType] || '#6B7280';

  return (
    <Box>
      <PageHeader
        title={product.name}
        breadcrumbs={[
          { label: 'Catalog', href: '/products' },
          { label: product.name },
        ]}
      />

      {/* Product Identity Card */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          {/* Supplier logo + name */}
          {tds?.supplier && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 96, height: 96, borderRadius: 2, bgcolor: '#FFFFFF',
                  border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0, overflow: 'hidden', p: 1,
                }}
              >
                {tds.supplierLogo ? (
                  <img
                    src={tds.supplierLogo}
                    alt={tds.supplier}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ fontSize: '0.6rem', textAlign: 'center' }}>
                    {tds.supplier.split(' ')[0]}
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={600}>{tds.supplier}</Typography>
                <Typography variant="caption" color="text.secondary">Supplier</Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip
              label={product.productType}
              size="small"
              sx={{ bgcolor: `${catColor}15`, color: catColor, fontWeight: 600, fontSize: '0.7rem' }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
              {product.code}
            </Typography>
          </Box>

          {product.legacyName && (
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1 }}>
              Legacy: {product.legacyName}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              sx={{ fontSize: '0.7rem', py: 0.5, px: 1.5 }}
            >
              TDS
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              sx={{ fontSize: '0.7rem', py: 0.5, px: 1.5 }}
            >
              SDS
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Technical Data" />
          <Tab label="Certifications" />
          <Tab label="Deals" />
        </Tabs>
      </Box>

      {/* Tab: Technical Data */}
      <TabPanel value={tab} index={0}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            {tds ? (
              <>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: catColor }}>
                      General Properties
                    </Typography>
                    <TDSRow label="Grade" value={tds.grade} />
                    <TDSRow label="Form" value={tds.form} />
                    <TDSRow label="Color" value={tds.color} />
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: catColor }}>
                      Mechanical Properties
                    </Typography>
                    <TDSRow label="Density" value={tds.density} />
                    <TDSRow label="Melt Flow Index" value={tds.meltFlowIndex} />
                    <TDSRow label="Tensile Strength" value={tds.tensileStrength} />
                    <TDSRow label="Elongation at Break" value={tds.elongationAtBreak} />
                    <TDSRow label="Flexural Modulus" value={tds.flexuralModulus} />
                    <TDSRow label="Impact Strength" value={tds.impactStrength} />
                    <TDSRow label="Shore Hardness" value={tds.shoreHardness} />
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: catColor }}>
                      Thermal Properties
                    </Typography>
                    <TDSRow label="Vicat Softening Temp" value={tds.vicatSofteningTemp} />
                    <TDSRow label="Heat Deflection Temp" value={tds.heatDeflectionTemp} />
                    <TDSRow label="Melting Point" value={tds.meltingPoint} />
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: catColor }}>
                      Applications
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                      {tds.applications.map((app) => (
                        <Chip key={app} label={app} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                      ))}
                    </Box>

                    {tds.processingMethods && tds.processingMethods.length > 0 && (
                      <>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: catColor }}>
                          Processing Methods
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                          {tds.processingMethods.map((m) => (
                            <Chip key={m} label={m} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                          ))}
                        </Box>
                      </>
                    )}

                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: catColor }}>
                      Compliance
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {tds.compliance.map((cert) => (
                        <Chip
                          key={cert}
                          label={cert}
                          size="small"
                          sx={{ fontSize: '0.7rem', bgcolor: '#ECFDF5', color: '#059669', fontWeight: 500 }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <InventoryIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">
                    No TDS data available for this product.
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card variant="outlined">
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <MSPPriceChart productId={id} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab: Certifications */}
      <TabPanel value={tab} index={1}>
        <ProductCertifications productId={id} />
      </TabPanel>

      {/* Tab: Deals */}
      <TabPanel value={tab} index={2}>
        <Card variant="outlined">
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
              Deals Using This Product
            </Typography>

            {dealUsageRows.length === 0 ? (
              <Paper variant="outlined">
                <EmptyState message="No deals currently use this product." />
              </Paper>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Deal</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Ver</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Price</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Margin</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dealUsageRows.map((row, index) => (
                      <TableRow
                        key={`${row.dealId}-${row.offerVersion}-${index}`}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => router.push(`/deals/${row.dealId}`)}
                      >
                        <TableCell sx={{ fontSize: '0.8rem' }}>{row.customerName}</TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: '0.8rem' }}>{row.dealName}</TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.8rem' }}>v{row.offerVersion}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem' }}>
                          {row.currency === 'EUR' ? '\u20AC' : '$'}
                          {row.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <StatusChip status={row.offerStatus as any} type="offer" />
                        </TableCell>
                        <TableCell align="right">
                          {row.margin !== null ? (
                            <Typography
                              variant="body2"
                              component="span"
                              sx={{
                                color: row.margin >= 0 ? 'success.main' : 'error.main',
                                fontWeight: 600, fontSize: '0.8rem',
                              }}
                            >
                              {row.margin >= 0 ? '+' : ''}{row.margin.toFixed(1)}%
                            </Typography>
                          ) : '\u2014'}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>
                          {format(new Date(row.date), 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
}
