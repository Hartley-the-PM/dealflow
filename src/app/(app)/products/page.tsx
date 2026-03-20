'use client';

import { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridViewIcon from '@mui/icons-material/GridView';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import MultiSelectFilter from '@/components/shared/MultiSelectFilter';
import PricingMatrixTab from '@/components/catalog/PricingMatrixTab';
import { useProductStore } from '@/stores/productStore';
import { useWhiteLabelStore } from '@/stores/whiteLabelStore';
import { usePricingStore } from '@/stores/pricingStore';
import { useHydration } from '@/hooks/useHydration';
import type { Product } from '@/types';

const PRODUCT_TYPES = ['LDPE', 'HDPE', 'PP', 'PVC', 'PS', 'PET'];
const PRODUCT_TYPE_COLORS: Record<string, string> = {
  LDPE: '#2563EB', HDPE: '#059669', PP: '#7C3AED', PVC: '#DC2626', PS: '#F59E0B', PET: '#0891B2',
};

const TAB_MAP: Record<string, number> = { products: 0, pricing: 1 };
const TAB_KEYS = ['products', 'pricing'];

function CatalogContent() {
  const hydrated = useHydration();
  const router = useRouter();
  const searchParams = useSearchParams();
  const brandedProducts = useProductStore((s) => s.products);
  const whiteLabelProducts = useWhiteLabelStore((s) => s.products);
  const whiteLabelBrands = useWhiteLabelStore((s) => s.brands);
  const entries = usePricingStore((s) => s.entries);

  // Build a map of brand id -> brand for quick lookup
  const brandMap = useMemo(() => {
    const map: Record<string, (typeof whiteLabelBrands)[0]> = {};
    whiteLabelBrands.forEach((b) => { map[b.id] = b; });
    return map;
  }, [whiteLabelBrands]);

  // Combined product list: branded + white label mapped to Product shape
  const products: (Product & { _wlId?: string })[] = useMemo(() => {
    const branded: (Product & { _wlId?: string })[] = brandedProducts.map((p) => ({
      ...p,
      sourceType: p.sourceType ?? 'Branded Prime',
    }));

    const wlMapped: (Product & { _wlId?: string })[] = whiteLabelProducts.map((wl) => {
      const brand = brandMap[wl.brandId];
      const brandName = brand?.name ?? wl.brandId;
      const tdsRanges = wl.tdsRanges;
      return {
        id: `wl-${wl.id}`,
        _wlId: wl.id,
        name: wl.name,
        legacyName: '',
        code: wl.code,
        productType: wl.productType,
        family: wl.family,
        materialType: 'Polymer' as const,
        sourceType: 'Generic Prime' as const,
        tds: {
          grade: wl.code,
          form: 'Pellets',
          color: 'Natural/Translucent',
          supplier: brandName,
          supplierLogo: brand?.logoUrl ?? '',
          density: tdsRanges?.densityMin != null ? `${tdsRanges.densityMin}–${tdsRanges.densityMax} g/cm³` : '',
          meltFlowIndex: tdsRanges?.mfiMin ? `${tdsRanges.mfiMin} – ${tdsRanges.mfiMax}` : '',
          tensileStrength: tdsRanges?.tensileMin != null ? `${tdsRanges.tensileMin}–${tdsRanges.tensileMax} MPa` : '',
          elongationAtBreak: tdsRanges?.elongationMin != null ? `${tdsRanges.elongationMin}–${tdsRanges.elongationMax}%` : '',
          flexuralModulus: tdsRanges?.flexuralMin != null ? `${tdsRanges.flexuralMin}–${tdsRanges.flexuralMax} MPa` : '',
          vicatSofteningTemp: '',
          applications: [],
          compliance: [],
        },
      };
    });

    return [...branded, ...wlMapped];
  }, [brandedProducts, whiteLabelProducts, brandMap]);

  const tabParam = searchParams.get('tab') ?? 'products';
  const currentTab = TAB_MAP[tabParam] ?? 0;

  const [search, setSearch] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [familyFilter, setFamilyFilter] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', TAB_KEYS[newValue]);
    router.replace(`/products?${params.toString()}`);
  };

  const getLatestMSP = (productId: string): { price: number; currency: string } | null => {
    const productEntries = entries
      .filter((e) => e.productId === productId)
      .sort((a, b) => b.month.localeCompare(a.month));
    if (productEntries.length === 0) return null;
    return { price: productEntries[0].price, currency: productEntries[0].currency };
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          (p.legacyName && p.legacyName.toLowerCase().includes(lower)) ||
          p.code.toLowerCase().includes(lower) ||
          (p.tds?.supplier && p.tds.supplier.toLowerCase().includes(lower))
      );
    }
    if (productTypeFilter.length > 0) {
      result = result.filter((p) => productTypeFilter.includes(p.productType));
    }
    if (sourceFilter.length > 0) {
      result = result.filter((p) => p.sourceType && sourceFilter.includes(p.sourceType));
    }
    if (familyFilter.length > 0) {
      result = result.filter((p) => p.family && familyFilter.includes(p.family));
    }
    result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [products, search, productTypeFilter, sourceFilter, familyFilter]);

  if (!hydrated) return null;

  return (
    <Box>
      <PageHeader title="Catalog" />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab icon={<InventoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Products" sx={{ minHeight: 48 }} />
          <Tab icon={<AttachMoneyIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Pricing Matrix" sx={{ minHeight: 48 }} />
        </Tabs>
      </Box>

      {currentTab === 0 && (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search by name, code, or supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
              }}
            />
            <MultiSelectFilter label="Product Type" options={PRODUCT_TYPES} selected={productTypeFilter} onChange={setProductTypeFilter} minWidth={140} />
            <MultiSelectFilter label="Source" options={['Branded Prime', 'Generic Prime', 'Recycled']} selected={sourceFilter} onChange={setSourceFilter} minWidth={140} />
            <MultiSelectFilter label="Family" options={['PE', 'PP', 'PVC', 'PS', 'PET']} selected={familyFilter} onChange={setFamilyFilter} minWidth={120} />
            <Box sx={{ flexGrow: 1 }} />
            <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => { if (v) setViewMode(v); }} size="small">
              <ToggleButton value="list" sx={{ px: 1.5 }}><ViewListIcon fontSize="small" /></ToggleButton>
              <ToggleButton value="card" sx={{ px: 1.5 }}><GridViewIcon fontSize="small" /></ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {filteredProducts.length === 0 ? (
            <EmptyState message="No products found." />
          ) : viewMode === 'list' ? (
            /* ─── LIST VIEW ─── */
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', borderBottom: '2px solid #E5E7EB', py: 1.5 } }}>
                    <TableCell>Product Name</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Product Type</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell align="right">Current MSP</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const latestMSP = getLatestMSP(product.id);
                    const catColor = PRODUCT_TYPE_COLORS[product.productType] || '#6B7280';
                    return (
                      <TableRow
                        key={product.id}
                        hover
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#FAFBFC' },
                          '& td': { py: 1.75, borderBottom: '1px solid #F3F4F6' },
                        }}
                        onClick={() => router.push(product._wlId ? `/white-labelling/${product._wlId}` : `/products/${product.id}`)}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {product.tds?.supplierLogo && (
                              <Box
                                component="img"
                                src={product.tds.supplierLogo}
                                alt={product.tds?.supplier || ''}
                                sx={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 0.5, flexShrink: 0 }}
                                onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }}
                              />
                            )}
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>{product.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#6B7280' }}>{product.tds?.supplier || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#6B7280' }}>{product.code}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={product.productType} size="small" sx={{ fontWeight: 600, fontSize: '0.65rem', height: 22, color: catColor, bgcolor: `${catColor}10`, border: `1px solid ${catColor}20` }} />
                        </TableCell>
                        <TableCell>
                          {product.sourceType && (
                            <Chip label={product.sourceType} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 20 }} />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                            {latestMSP
                              ? `${latestMSP.currency === 'EUR' ? '\u20AC' : '$'}${latestMSP.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : '\u2014'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            /* ─── CARD VIEW ─── */
            <Grid container spacing={2}>
              {filteredProducts.map((product) => {
                const latestMSP = getLatestMSP(product.id);
                const catColor = PRODUCT_TYPE_COLORS[product.productType] || '#6B7280';
                const tds = product.tds;

                return (
                  <Grid key={product.id} size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 2.5, border: '1px solid #E5E7EB', height: '100%',
                        transition: 'all 0.15s ease',
                        '&:hover': { borderColor: catColor, boxShadow: `0 2px 12px ${catColor}12`, transform: 'translateY(-1px)' },
                      }}
                    >
                      <CardActionArea
                        onClick={() => router.push(product._wlId ? `/white-labelling/${product._wlId}` : `/products/${product.id}`)}
                        sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                      >
                        <Box sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                          {/* Supplier logo + category */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                            <Box sx={{ height: 28, display: 'flex', alignItems: 'center' }}>
                              {tds?.supplierLogo ? (
                                <Box
                                  component="img"
                                  src={tds.supplierLogo}
                                  alt={tds?.supplier || 'Supplier'}
                                  sx={{ height: 24, maxWidth: 90, objectFit: 'contain' }}
                                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }}
                                />
                              ) : (
                                <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 500 }}>
                                  {tds?.supplier || ''}
                                </Typography>
                              )}
                            </Box>
                            <Chip
                              label={product.productType}
                              size="small"
                              sx={{
                                fontWeight: 700, fontSize: '0.55rem', height: 20,
                                color: catColor, bgcolor: `${catColor}10`, border: `1px solid ${catColor}20`,
                                flexShrink: 0,
                              }}
                            />
                          </Box>

                          {/* Product name */}
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#111827', lineHeight: 1.3, mb: 0.25 }}>
                            {product.name}
                          </Typography>

                          {/* Code */}
                          <Typography variant="caption" sx={{ color: '#9CA3AF', fontFamily: 'monospace', fontSize: '0.65rem', mb: 'auto' }}>
                            {product.code}
                          </Typography>

                          <Divider sx={{ my: 1.5 }} />

                          {/* TDS specs + price */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              {tds?.density && (
                                <Box>
                                  <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.55rem', display: 'block' }}>Density</Typography>
                                  <Typography variant="caption" sx={{ color: '#374151', fontWeight: 600, fontSize: '0.7rem' }}>{tds.density}</Typography>
                                </Box>
                              )}
                              {tds?.meltFlowIndex && (
                                <Box>
                                  <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.55rem', display: 'block' }}>MFI</Typography>
                                  <Typography variant="caption" sx={{ color: '#374151', fontWeight: 600, fontSize: '0.7rem' }}>{tds.meltFlowIndex}</Typography>
                                </Box>
                              )}
                            </Box>
                            {latestMSP && (
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669', fontSize: '0.8rem' }}>
                                {latestMSP.currency === 'EUR' ? '\u20AC' : '$'}{latestMSP.price.toLocaleString()}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </>
      )}

      {currentTab === 1 && <PricingMatrixTab />}
    </Box>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <CatalogContent />
    </Suspense>
  );
}
