'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LabelIcon from '@mui/icons-material/Label';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { useProductStore } from '@/stores/productStore';
import { useWhiteLabelStore } from '@/stores/whiteLabelStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHydration } from '@/hooks/useHydration';
import { v4 as uuidv4 } from 'uuid';

// Families and their categories
const FAMILIES: Record<string, string[]> = {
  PE: ['LDPE', 'HDPE', 'LLDPE'],
  PP: ['PP'],
  PVC: ['PVC'],
  PS: ['PS'],
  PET: ['PET'],
};

const EMPTY_FORM = {
  brandId: '',
  name: '',
  code: '',
  linkedProductIds: [] as string[],
  family: '',
  productType: '',
  notes: '',
};

export default function WhiteLabellingPage() {
  const hydrated = useHydration();
  const router = useRouter();
  const products = useProductStore((s) => s.products);
  const whiteLabelProducts = useWhiteLabelStore((s) => s.products);
  const whiteLabelBrands = useWhiteLabelStore((s) => s.brands);
  const addProduct = useWhiteLabelStore((s) => s.addProduct);
  const deleteProduct = useWhiteLabelStore((s) => s.deleteProduct);
  const currentUser = useSettingsStore((s) => s.settings.currentUser);

  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuProductId, setMenuProductId] = useState<string | null>(null);

  // Build a map of product id -> product for quick lookup
  const productMap = useMemo(() => {
    const map: Record<string, (typeof products)[0]> = {};
    products.forEach((p) => { map[p.id] = p; });
    return map;
  }, [products]);

  // Build a map of brand id -> brand
  const brandMap = useMemo(() => {
    const map: Record<string, (typeof whiteLabelBrands)[0]> = {};
    whiteLabelBrands.forEach((b) => { map[b.id] = b; });
    return map;
  }, [whiteLabelBrands]);

  // Filter products available for selection based on family
  const filteredCatalogProducts = useMemo(() => {
    if (!form.family) return products;
    return products.filter((p) => p.family === form.family);
  }, [products, form.family]);

  // Filtered WL products by search
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return whiteLabelProducts;
    const q = search.toLowerCase();
    return whiteLabelProducts.filter(
      (wl) =>
        wl.name.toLowerCase().includes(q) ||
        wl.code.toLowerCase().includes(q) ||
        (brandMap[wl.brandId]?.name || '').toLowerCase().includes(q)
    );
  }, [whiteLabelProducts, search, brandMap]);

  const handleOpenCreate = () => {
    setForm({ ...EMPTY_FORM });
    setCreateOpen(true);
  };

  const handleSelectProducts = (selectedIds: string[]) => {
    setForm((prev) => {
      const updated = { ...prev, linkedProductIds: selectedIds };
      // Auto-set family from first selected product
      if (selectedIds.length > 0) {
        const firstProduct = productMap[selectedIds[0]];
        if (firstProduct?.family) {
          updated.family = firstProduct.family;
          updated.productType = firstProduct.productType || '';
        }
      } else {
        updated.family = '';
        updated.productType = '';
      }
      return updated;
    });
  };

  const handleCreate = () => {
    const now = new Date().toISOString();
    addProduct({
      id: uuidv4(),
      brandId: form.brandId,
      name: form.name,
      code: form.code,
      linkedProductIds: form.linkedProductIds,
      family: form.family,
      productType: form.productType,
      notes: form.notes,
      createdBy: currentUser,
      createdAt: now,
      updatedAt: now,
    });
    setCreateOpen(false);
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, id: string) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setMenuProductId(id);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuProductId(null);
  };

  const handleDelete = () => {
    if (menuProductId) {
      deleteProduct(menuProductId);
    }
    handleMenuClose();
  };

  if (!hydrated) return null;

  const canCreate = form.brandId && form.name.trim() && form.code.trim() && form.linkedProductIds.length > 0;

  return (
    <Box>
      <PageHeader
        title="White Labelling"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Create White Label
          </Button>
        }
      />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create and manage white-labelled products by grouping branded prime products under your own brand identity.
      </Typography>

      {/* WL Brands overview */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#111827', mb: 1.5 }}>
          White Label Brands
        </Typography>
        <Grid container spacing={2}>
          {whiteLabelBrands.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2, borderStyle: 'dashed' }}>
                <LabelIcon sx={{ fontSize: 40, color: '#D1D5DB', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No white label brands configured yet. Add brands in Settings &gt; Branding.
                </Typography>
              </Paper>
            </Grid>
          ) : (
            whiteLabelBrands.map((brand) => (
              <Grid key={brand.id} size={{ xs: 12, sm: 6, md: 3 }}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {brand.logoUrl ? (
                      <Box component="img" src={brand.logoUrl} alt={brand.name} sx={{ height: 32, objectFit: 'contain' }} />
                    ) : (
                      <LabelIcon sx={{ fontSize: 32, color: '#9CA3AF' }} />
                    )}
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>{brand.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{brand.prefix}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Box>

      {/* Search + WL Products table */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search white label products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 300 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
      </Box>

      {filteredProducts.length === 0 ? (
        <EmptyState message="No white label products created yet. Click 'Create White Label' to get started." />
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', borderBottom: '2px solid #E5E7EB', py: 1.5 } }}>
                <TableCell>Product Name</TableCell>
                <TableCell>Brand</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Family</TableCell>
                <TableCell>Linked Products</TableCell>
                <TableCell width={50} />
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.map((wl) => (
                <TableRow key={wl.id} hover sx={{ cursor: 'pointer', '& td': { py: 1.75, borderBottom: '1px solid #F3F4F6' } }} onClick={() => router.push(`/white-labelling/${wl.id}`)}>
                  <TableCell><Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>{wl.name}</Typography></TableCell>
                  <TableCell>
                    <Chip
                      label={brandMap[wl.brandId]?.name || wl.brandId}
                      size="small"
                    />
                  </TableCell>
                  <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#6B7280' }}>{wl.code}</Typography></TableCell>
                  <TableCell><Chip label={wl.family} size="small" variant="outlined" /></TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {wl.linkedProductIds.map((pid) => {
                        const p = productMap[pid];
                        return (
                          <Chip
                            key={pid}
                            label={p?.name || pid}
                            size="small"
                            clickable
                            onClick={(e) => { e.stopPropagation(); router.push(`/products/${pid}`); }}
                            sx={{
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'primary.50', color: 'primary.main' },
                            }}
                          />
                        );
                      })}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, wl.id)}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Kebab Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create White Label Product</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <FormControl fullWidth size="small">
            <InputLabel>Brand</InputLabel>
            <Select
              value={form.brandId}
              label="Brand"
              onChange={(e) => setForm((prev) => ({ ...prev, brandId: e.target.value }))}
            >
              {whiteLabelBrands.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Product Name"
            size="small"
            fullWidth
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />

          <TextField
            label="Code"
            size="small"
            fullWidth
            value={form.code}
            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
          />

          <Autocomplete
            multiple
            size="small"
            options={filteredCatalogProducts}
            getOptionLabel={(opt) => `${opt.name} (${opt.code})`}
            value={products.filter((p) => form.linkedProductIds.includes(p.id))}
            onChange={(_, vals) => handleSelectProducts(vals.map((v) => v.id))}
            renderInput={(params) => <TextField {...params} label="Linked Products" />}
            renderTags={(value, getTagProps) =>
              value.map((opt, idx) => (
                <Chip {...getTagProps({ index: idx })} key={opt.id} label={opt.name} size="small" />
              ))
            }
          />

          <TextField
            label="Family"
            size="small"
            fullWidth
            value={form.family}
            InputProps={{ readOnly: true }}
            helperText="Auto-set from selected products"
          />

          <TextField
            label="Notes"
            size="small"
            fullWidth
            multiline
            minRows={2}
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!canCreate}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
