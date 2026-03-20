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
import IconButton from '@mui/material/IconButton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import LinearProgress from '@mui/material/LinearProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Autocomplete from '@mui/material/Autocomplete';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Alert from '@mui/material/Alert';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import ScienceIcon from '@mui/icons-material/Science';
import BlenderIcon from '@mui/icons-material/Blender';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { useProductStore } from '@/stores/productStore';
import { useFormulationStore } from '@/stores/formulationStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHydration } from '@/hooks/useHydration';
import { v4 as uuidv4 } from 'uuid';
import type { FormulationIngredient, FormulationType } from '@/types/formulation';

const TYPE_COLORS = { blend: '#2563EB', recipe: '#7C3AED' };
const ROLES = ['Base Polymer', 'Additive', 'Colorant', 'Filler', 'Stabilizer', 'Other'];

const EMPTY_INGREDIENT: () => FormulationIngredient = () => ({
  id: uuidv4(),
  productId: '',
  productName: '',
  percentage: 0,
  role: '',
  notes: '',
});

const EMPTY_FORM = {
  name: '',
  code: '',
  type: 'blend' as FormulationType,
  family: '',
  productType: '',
  notes: '',
  ingredients: [EMPTY_INGREDIENT()] as FormulationIngredient[],
};

export default function FormulationsPage() {
  const hydrated = useHydration();
  const router = useRouter();
  const products = useProductStore((s) => s.products);
  const formulations = useFormulationStore((s) => s.formulations);
  const addFormulation = useFormulationStore((s) => s.addFormulation);
  const deleteFormulation = useFormulationStore((s) => s.deleteFormulation);
  const currentUser = useSettingsStore((s) => s.settings.currentUser);

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM, ingredients: [EMPTY_INGREDIENT()] });
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuFormulationId, setMenuFormulationId] = useState<string | null>(null);

  // Product lookup map
  const productMap = useMemo(() => {
    const map: Record<string, (typeof products)[0]> = {};
    products.forEach((p) => { map[p.id] = p; });
    return map;
  }, [products]);

  // Filter formulations by tab and search
  const filteredFormulations = useMemo(() => {
    let list = formulations;
    // Tab filter: 0=All, 1=Blends, 2=Recipes
    if (tab === 1) list = list.filter((f) => f.type === 'blend');
    if (tab === 2) list = list.filter((f) => f.type === 'recipe');
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.code.toLowerCase().includes(q) ||
          f.family.toLowerCase().includes(q)
      );
    }
    return list;
  }, [formulations, tab, search]);

  // Ingredient total percentage
  const totalPercent = useMemo(
    () => form.ingredients.reduce((sum, ing) => sum + (ing.percentage || 0), 0),
    [form.ingredients]
  );

  const handleOpenCreate = () => {
    setForm({ ...EMPTY_FORM, ingredients: [EMPTY_INGREDIENT()] });
    setCreateOpen(true);
  };

  const updateIngredient = (idx: number, updates: Partial<FormulationIngredient>) => {
    setForm((prev) => {
      const ingredients = [...prev.ingredients];
      ingredients[idx] = { ...ingredients[idx], ...updates };
      return { ...prev, ingredients };
    });
  };

  const addIngredientRow = () => {
    setForm((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, EMPTY_INGREDIENT()],
    }));
  };

  const removeIngredientRow = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== idx),
    }));
  };

  const handleCreate = () => {
    const now = new Date().toISOString();
    addFormulation({
      id: uuidv4(),
      name: form.name,
      code: form.code,
      type: form.type,
      family: form.family,
      productType: form.productType,
      ingredients: form.ingredients.filter((ing) => ing.productName.trim() && ing.percentage > 0),
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
    setMenuFormulationId(id);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuFormulationId(null);
  };

  const handleDelete = () => {
    if (menuFormulationId) {
      deleteFormulation(menuFormulationId);
    }
    handleMenuClose();
  };

  const handleDuplicate = () => {
    if (!menuFormulationId) return;
    const original = formulations.find((f) => f.id === menuFormulationId);
    if (!original) return;
    const now = new Date().toISOString();
    const newId = uuidv4();
    addFormulation({
      ...original,
      id: newId,
      name: `${original.name} (Copy)`,
      code: `${original.code}-COPY`,
      ingredients: original.ingredients.map((ing) => ({ ...ing, id: uuidv4() })),
      createdBy: currentUser,
      createdAt: now,
      updatedAt: now,
    });
    handleMenuClose();
    router.push(`/formulations/${newId}`);
  };

  if (!hydrated) return null;

  const canCreate =
    form.name.trim() &&
    form.code.trim() &&
    form.ingredients.some((ing) => ing.productName.trim() && ing.percentage > 0) &&
    Math.abs(totalPercent - 100) < 0.01;

  return (
    <Box>
      <PageHeader
        title="Formulations"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Create Formulation
          </Button>
        }
      />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create custom blends and recipes by combining products from your catalog. Formulations appear as products in offers and orders.
      </Typography>

      {/* Tabs: All | Blends | Recipes */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="All Formulations" sx={{ minHeight: 42 }} />
          <Tab icon={<BlenderIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Blends" sx={{ minHeight: 42 }} />
          <Tab icon={<ScienceIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Recipes" sx={{ minHeight: 42 }} />
        </Tabs>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search formulations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 300 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
      </Box>

      {filteredFormulations.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 2, borderStyle: 'dashed' }}>
          <ScienceIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151', mb: 1 }}>
            No formulations yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            Create your first formulation by blending products from your catalog or building a detailed recipe with additives.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Create Formulation
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', borderBottom: '2px solid #E5E7EB', py: 1.5 } }}>
                <TableCell>Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Family</TableCell>
                <TableCell>Ingredients</TableCell>
                <TableCell>Recycled Content</TableCell>
                <TableCell width={50} />
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredFormulations.map((f) => (
                <TableRow key={f.id} hover sx={{ cursor: 'pointer', '& td': { py: 1.75, borderBottom: '1px solid #F3F4F6' } }} onClick={() => router.push(`/formulations/${f.id}`)}>
                  <TableCell><Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>{f.name}</Typography></TableCell>
                  <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#6B7280' }}>{f.code}</Typography></TableCell>
                  <TableCell>
                    <Chip
                      label={f.type}
                      size="small"
                      sx={{
                        fontWeight: 600, fontSize: '0.65rem', height: 22,
                        color: TYPE_COLORS[f.type as keyof typeof TYPE_COLORS] || '#6B7280',
                        bgcolor: `${TYPE_COLORS[f.type as keyof typeof TYPE_COLORS] || '#6B7280'}12`,
                      }}
                    />
                  </TableCell>
                  <TableCell><Chip label={f.family} size="small" variant="outlined" /></TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {f.ingredients.map((ing) => {
                        const hasProduct = ing.productId && productMap[ing.productId];
                        return (
                          <Chip
                            key={ing.id}
                            label={`${ing.productName} (${ing.percentage}%)`}
                            size="small"
                            clickable={!!hasProduct}
                            onClick={hasProduct ? (e) => { e.stopPropagation(); router.push(`/products/${ing.productId}`); } : undefined}
                            sx={hasProduct ? {
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'primary.50', color: 'primary.main' },
                            } : {}}
                          />
                        );
                      })}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {f.recycledContent && f.recycledContent.totalPercent > 0 ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={f.recycledContent.totalPercent}
                          sx={{ width: 60, height: 6, borderRadius: 3, bgcolor: '#E5E7EB', '& .MuiLinearProgress-bar': { bgcolor: '#059669' } }}
                        />
                        <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>{f.recycledContent.totalPercent}%</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">&mdash;</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, f.id)}>
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
        <MenuItem onClick={handleDuplicate}>
          <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create Formulation</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Name"
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
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={form.type}
                label="Type"
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as FormulationType }))}
              >
                <MenuItem value="blend">Blend</MenuItem>
                <MenuItem value="recipe">Recipe</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Family"
              size="small"
              fullWidth
              value={form.family}
              onChange={(e) => setForm((prev) => ({ ...prev, family: e.target.value }))}
            />
            <TextField
              label="Product Type"
              size="small"
              fullWidth
              value={form.productType}
              onChange={(e) => setForm((prev) => ({ ...prev, productType: e.target.value }))}
            />
          </Box>

          {/* Ingredients */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#111827' }}>
                Ingredients
              </Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={addIngredientRow}>
                Add Ingredient
              </Button>
            </Box>

            {form.ingredients.map((ing, idx) => (
              <Box key={ing.id} sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'flex-start' }}>
                <Autocomplete
                  freeSolo
                  size="small"
                  sx={{ flex: 2 }}
                  options={products}
                  getOptionLabel={(opt) => typeof opt === 'string' ? opt : `${opt.name} (${opt.code})`}
                  inputValue={ing.productName}
                  onInputChange={(_, val) => updateIngredient(idx, { productName: val })}
                  onChange={(_, val) => {
                    if (val && typeof val !== 'string') {
                      updateIngredient(idx, { productId: val.id, productName: val.name });
                    }
                  }}
                  renderInput={(params) => <TextField {...params} label="Product / Additive" />}
                />
                <TextField
                  label="%"
                  size="small"
                  type="number"
                  sx={{ width: 90 }}
                  value={ing.percentage || ''}
                  onChange={(e) => updateIngredient(idx, { percentage: parseFloat(e.target.value) || 0 })}
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                />
                <FormControl size="small" sx={{ width: 150 }}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={ing.role || ''}
                    label="Role"
                    onChange={(e) => updateIngredient(idx, { role: e.target.value })}
                  >
                    {ROLES.map((r) => (
                      <MenuItem key={r} value={r}>{r}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Notes"
                  size="small"
                  sx={{ flex: 1 }}
                  value={ing.notes}
                  onChange={(e) => updateIngredient(idx, { notes: e.target.value })}
                />
                <IconButton
                  size="small"
                  onClick={() => removeIngredientRow(idx)}
                  disabled={form.ingredients.length <= 1}
                  sx={{ mt: 0.5 }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}

            {/* Percentage validation */}
            <Box sx={{ mt: 1 }}>
              {totalPercent !== 100 ? (
                <Alert severity={Math.abs(totalPercent - 100) < 0.01 ? 'success' : 'warning'} sx={{ py: 0 }}>
                  Total: {totalPercent.toFixed(1)}% &mdash; {totalPercent < 100 ? `${(100 - totalPercent).toFixed(1)}% remaining` : `${(totalPercent - 100).toFixed(1)}% over`}
                </Alert>
              ) : (
                <Alert severity="success" sx={{ py: 0 }}>
                  Total: 100.0% &mdash; Valid
                </Alert>
              )}
            </Box>
          </Box>

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
