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
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SecurityIcon from '@mui/icons-material/Security';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import MultiSelectFilter from '@/components/shared/MultiSelectFilter';
import PricingMatrixTab from '@/components/catalog/PricingMatrixTab';
import GuardrailsTab from '@/components/catalog/GuardrailsTab';
import { useProductStore } from '@/stores/productStore';
import { usePricingStore } from '@/stores/pricingStore';
import { useHydration } from '@/hooks/useHydration';

const CATEGORIES = ['LDPE', 'HDPE', 'PP', 'PVC', 'PS', 'PET'];

const TAB_MAP: Record<string, number> = { products: 0, pricing: 1, guardrails: 2 };
const TAB_KEYS = ['products', 'pricing', 'guardrails'];

function CatalogContent() {
  const hydrated = useHydration();
  const router = useRouter();
  const searchParams = useSearchParams();
  const products = useProductStore((s) => s.products);
  const entries = usePricingStore((s) => s.entries);

  const tabParam = searchParams.get('tab') ?? 'products';
  const currentTab = TAB_MAP[tabParam] ?? 0;

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);

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
          p.legacyName.toLowerCase().includes(lower) ||
          p.code.toLowerCase().includes(lower)
      );
    }
    if (categoryFilter.length > 0) {
      result = result.filter((p) => categoryFilter.includes(p.category));
    }
    result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [products, search, categoryFilter]);

  if (!hydrated) return null;

  return (
    <Box>
      <PageHeader title="Catalog" />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab icon={<InventoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Products" sx={{ minHeight: 48 }} />
          <Tab icon={<AttachMoneyIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Pricing Matrix" sx={{ minHeight: 48 }} />
          <Tab icon={<SecurityIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Guardrails" sx={{ minHeight: 48 }} />
        </Tabs>
      </Box>

      {/* Products Tab */}
      {currentTab === 0 && (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <TextField
              size="small"
              placeholder="Search by name, legacy name, or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <MultiSelectFilter
              label="Category"
              options={CATEGORIES}
              selected={categoryFilter}
              onChange={setCategoryFilter}
              minWidth={160}
            />
          </Box>

          {filteredProducts.length === 0 ? (
            <EmptyState message="No products found." />
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Product Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Legacy Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Current MSP</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const latestMSP = getLatestMSP(product.id);
                    return (
                      <TableRow
                        key={product.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => router.push(`/products/${product.id}`)}
                      >
                        <TableCell sx={{ fontWeight: 500 }}>{product.name}</TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>{product.legacyName}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{product.code}</TableCell>
                        <TableCell>
                          <Chip label={product.category} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">
                          {latestMSP
                            ? `${latestMSP.currency === 'EUR' ? '\u20AC' : '$'}${latestMSP.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : '\u2014'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Pricing Matrix Tab */}
      {currentTab === 1 && <PricingMatrixTab />}

      {/* Guardrails Tab */}
      {currentTab === 2 && <GuardrailsTab />}
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
