'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ScienceIcon from '@mui/icons-material/Science';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { useFormulationStore } from '@/stores/formulationStore';
import { useProductStore } from '@/stores/productStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHydration } from '@/hooks/useHydration';
import { v4 as uuidv4 } from 'uuid';

const TYPE_COLORS: Record<string, string> = {
  blend: '#2563EB',
  recipe: '#7C3AED',
};

const PRODUCT_TYPE_COLORS: Record<string, string> = {
  LDPE: '#2563EB', HDPE: '#059669', PP: '#D97706', PVC: '#7C3AED', PS: '#DC2626', PET: '#0891B2',
};

// Distinct colors for ingredient bar segments
const INGREDIENT_COLORS = [
  '#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED',
  '#0891B2', '#DB2777', '#65A30D', '#EA580C', '#4F46E5',
];

function TDSValueRow({ label, value, unit }: { label: string; value?: number | string; unit?: string }) {
  if (value == null) return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid #F3F4F6' }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8rem', textAlign: 'right' }}>
        {value}{unit ? ` ${unit}` : ''}
      </Typography>
    </Box>
  );
}

function RecycledContentBar({ label, value }: { label: string; value: number }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>{label}</Typography>
        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>{value}%</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(value, 100)}
        sx={{
          height: 8, borderRadius: 4,
          bgcolor: '#F3F4F6',
          '& .MuiLinearProgress-bar': { bgcolor: '#059669', borderRadius: 4 },
        }}
      />
    </Box>
  );
}

export default function FormulationDetailPage() {
  const hydrated = useHydration();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const getFormulationById = useFormulationStore((s) => s.getFormulationById);
  const updateFormulation = useFormulationStore((s) => s.updateFormulation);
  const addFormulation = useFormulationStore((s) => s.addFormulation);
  const deleteFormulation = useFormulationStore((s) => s.deleteFormulation);
  const getProductById = useProductStore((s) => s.getProductById);
  const currentUser = useSettingsStore((s) => s.settings.currentUser);

  const formulation = getFormulationById(id);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newBenefit, setNewBenefit] = useState('');

  const totalPercentage = useMemo(() => {
    if (!formulation) return 0;
    return formulation.ingredients.reduce((sum, ing) => sum + ing.percentage, 0);
  }, [formulation]);

  if (!hydrated) return null;

  if (!formulation) {
    return (
      <Box>
        <PageHeader
          title="Formulation Not Found"
          breadcrumbs={[
            { label: 'Product Management' },
            { label: 'Formulations', href: '/formulations' },
          ]}
        />
        <EmptyState message="The requested formulation could not be found." />
      </Box>
    );
  }

  const typeColor = TYPE_COLORS[formulation.type] || '#6B7280';
  const catColor = PRODUCT_TYPE_COLORS[formulation.productType] || '#6B7280';

  const handleFieldUpdate = (field: string, value: string | string[]) => {
    updateFormulation(id, { [field]: value, updatedAt: new Date().toISOString() });
  };

  const handleDuplicate = () => {
    const now = new Date().toISOString();
    const newId = uuidv4();
    addFormulation({
      ...formulation,
      id: newId,
      name: `${formulation.name} (Copy)`,
      code: `${formulation.code}-COPY`,
      ingredients: formulation.ingredients.map((ing) => ({ ...ing, id: uuidv4() })),
      createdBy: currentUser,
      createdAt: now,
      updatedAt: now,
    });
    router.push(`/formulations/${newId}`);
  };

  const handleDelete = () => {
    deleteFormulation(id);
    router.push('/formulations');
  };

  const handleAddBenefit = () => {
    if (!newBenefit.trim()) return;
    const current = formulation.benefits || [];
    handleFieldUpdate('benefits', [...current, newBenefit.trim()]);
    setNewBenefit('');
  };

  const handleRemoveBenefit = (idx: number) => {
    const current = formulation.benefits || [];
    handleFieldUpdate('benefits', current.filter((_, i) => i !== idx));
  };

  return (
    <Box>
      <PageHeader
        title={formulation.name}
        breadcrumbs={[
          { label: 'Product Management' },
          { label: 'Formulations', href: '/formulations' },
          { label: formulation.name },
        ]}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={handleDuplicate}
            >
              Duplicate
            </Button>
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
              onClick={() => router.push('/formulations')}
            >
              Back
            </Button>
          </Box>
        }
      />

      {/* Header badges */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <Chip
          label={formulation.type.charAt(0).toUpperCase() + formulation.type.slice(1)}
          size="small"
          sx={{ bgcolor: `${typeColor}15`, color: typeColor, fontWeight: 600, fontSize: '0.75rem' }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
          {formulation.code}
        </Typography>
        <Chip
          label={formulation.family}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.7rem' }}
        />
      </Box>

      <Grid container spacing={3}>
        {/* ===== Left Column (8/12) ===== */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Description Card */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, color: typeColor }}>
                Description
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={2}
                size="small"
                placeholder="Add a description for this formulation..."
                value={formulation.description || ''}
                onChange={(e) => handleFieldUpdate('description', e.target.value)}
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }}
              />
            </CardContent>
          </Card>

          {/* Benefits Card */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, color: typeColor }}>
                Benefits
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1.5 }}>
                {(formulation.benefits || []).map((benefit, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ flex: 1, fontSize: '0.85rem' }}>
                      {benefit}
                    </Typography>
                    <IconButton size="small" onClick={() => handleRemoveBenefit(idx)}>
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Add a benefit..."
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddBenefit(); } }}
                  sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }}
                />
                <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={handleAddBenefit} disabled={!newBenefit.trim()}>
                  Add
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Technical Notes Card */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, color: typeColor }}>
                Technical Notes
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={3}
                size="small"
                placeholder="Add technical notes..."
                value={formulation.technicalNotes || ''}
                onChange={(e) => handleFieldUpdate('technicalNotes', e.target.value)}
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }}
              />
            </CardContent>
          </Card>

          {/* Recipe Breakdown Card */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, color: typeColor }}>
                Recipe Breakdown
              </Typography>

              {/* Horizontal stacked bar */}
              {formulation.ingredients.length > 0 && (
                <Box sx={{ display: 'flex', borderRadius: 1, overflow: 'hidden', height: 28, mb: 2 }}>
                  {formulation.ingredients.map((ing, idx) => {
                    const pct = totalPercentage > 0 ? (ing.percentage / totalPercentage) * 100 : 0;
                    return (
                      <Box
                        key={ing.id}
                        sx={{
                          width: `${pct}%`,
                          bgcolor: INGREDIENT_COLORS[idx % INGREDIENT_COLORS.length],
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          minWidth: pct > 5 ? 'auto' : 0,
                          transition: 'width 0.3s',
                        }}
                      >
                        {pct > 8 && (
                          <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.65rem' }}>
                            {ing.percentage}%
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              )}

              {/* Ingredient table */}
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Percentage</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formulation.ingredients.map((ing, idx) => (
                      <TableRow key={ing.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                                bgcolor: INGREDIENT_COLORS[idx % INGREDIENT_COLORS.length],
                              }}
                            />
                            {ing.productId ? (
                              <Chip
                                label={ing.productName}
                                size="small"
                                clickable
                                onClick={() => router.push(`/products/${ing.productId}`)}
                                sx={{ fontSize: '0.75rem', fontWeight: 500 }}
                              />
                            ) : (
                              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                {ing.productName}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                            {ing.percentage}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {ing.role && (
                            <Chip label={ing.role} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {ing.notes || '\u2014'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Calculated TDS Card */}
          {formulation.calculatedTds && (
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: typeColor }}>
                    Calculated TDS
                  </Typography>
                  <Chip label="Weighted average from ingredients" size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                </Box>
                <TDSValueRow label="Density" value={formulation.calculatedTds.density} unit="g/cm3" />
                <TDSValueRow label="Melt Flow Index" value={formulation.calculatedTds.meltFlowIndex} />
                <TDSValueRow label="Tensile Strength" value={formulation.calculatedTds.tensileStrength} unit="MPa" />
                <TDSValueRow label="Elongation at Break" value={formulation.calculatedTds.elongationAtBreak} unit="%" />
                <TDSValueRow label="Flexural Modulus" value={formulation.calculatedTds.flexuralModulus} unit="MPa" />
              </CardContent>
            </Card>
          )}

          {/* Recycled Content Card */}
          {formulation.recycledContent && (
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, color: typeColor }}>
                  Recycled Content
                </Typography>
                <RecycledContentBar label="Total Recycled" value={formulation.recycledContent.totalPercent} />
                <RecycledContentBar label="Post-Consumer Recycled (PCR)" value={formulation.recycledContent.pcrPercent} />
                <RecycledContentBar label="Post-Industrial Recycled (PIR)" value={formulation.recycledContent.pirPercent} />
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: typeColor }}>
                Notes
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={2}
                size="small"
                placeholder="Add notes..."
                value={formulation.notes || ''}
                onChange={(e) => handleFieldUpdate('notes', e.target.value)}
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* ===== Right Column (4/12) ===== */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ position: 'sticky', top: 24 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                Summary
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Type</Typography>
                  <Box sx={{ mt: 0.25 }}>
                    <Chip
                      label={formulation.type.charAt(0).toUpperCase() + formulation.type.slice(1)}
                      size="small"
                      sx={{ bgcolor: `${typeColor}15`, color: typeColor, fontWeight: 600, fontSize: '0.7rem' }}
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Family</Typography>
                  <Typography variant="body2" fontWeight={500}>{formulation.family}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Category</Typography>
                  <Chip
                    label={formulation.productType}
                    size="small"
                    sx={{ bgcolor: `${catColor}15`, color: catColor, fontWeight: 600, fontSize: '0.7rem', mt: 0.25 }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Ingredients</Typography>
                  <Typography variant="body2" fontWeight={500}>{formulation.ingredients.length}</Typography>
                </Box>
                {formulation.recycledContent && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Recycled Content</Typography>
                    <Typography variant="body2" fontWeight={500}>{formulation.recycledContent.totalPercent}%</Typography>
                  </Box>
                )}
              </Box>

              <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  startIcon={<ContentCopyIcon />}
                  onClick={handleDuplicate}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Duplicate Formulation
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Delete Formulation
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Formulation</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete &quot;{formulation.name}&quot;? This action cannot be undone.
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
