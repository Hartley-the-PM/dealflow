'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import type { FormulationModule } from '@/types/offerBuilder';
import { useFormulationStore } from '@/stores/formulationStore';

const ROLE_COLORS: Record<string, string> = {
  'Base Polymer': '#2563EB',
  'Additive': '#7C3AED',
  'Colorant': '#D97706',
  'Filler': '#6B7280',
  'Stabilizer': '#059669',
};

interface Props {
  module: FormulationModule;
  onChange: (updated: FormulationModule) => void;
}

export default function FormulationModuleEditor({ module: mod, onChange }: Props) {
  const formulations = useFormulationStore((s) => s.formulations);
  const selected = formulations.find((f) => f.id === mod.formulationId);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        select
        label="Select Formulation"
        value={mod.formulationId}
        onChange={(e) => onChange({ ...mod, formulationId: e.target.value, title: formulations.find((f) => f.id === e.target.value)?.name || mod.title })}
        size="small"
        fullWidth
      >
        {formulations.map((f) => (
          <MenuItem key={f.id} value={f.id}>
            {f.name} ({f.code}) — {f.productType}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label="Section Title"
        value={mod.title}
        onChange={(e) => onChange({ ...mod, title: e.target.value })}
        size="small"
        fullWidth
      />

      <Box sx={{ display: 'flex', gap: 2 }}>
        <FormControlLabel
          control={<Switch size="small" checked={mod.showPercentages} onChange={(e) => onChange({ ...mod, showPercentages: e.target.checked })} />}
          label={<Typography variant="body2">Show Composition</Typography>}
        />
        <FormControlLabel
          control={<Switch size="small" checked={mod.showTds} onChange={(e) => onChange({ ...mod, showTds: e.target.checked })} />}
          label={<Typography variant="body2">Show TDS</Typography>}
        />
        <FormControlLabel
          control={<Switch size="small" checked={mod.showRecycledContent} onChange={(e) => onChange({ ...mod, showRecycledContent: e.target.checked })} />}
          label={<Typography variant="body2">Show Recycled Content</Typography>}
        />
      </Box>

      {/* Preview of selected formulation */}
      {selected && (
        <Card variant="outlined" sx={{ bgcolor: '#FAFAFA' }}>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
              Preview: {selected.name}
            </Typography>

            {/* Composition Chart */}
            {mod.showPercentages && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Composition
                </Typography>
                {selected.ingredients.map((ing) => {
                  const color = ROLE_COLORS[ing.role || ''] || '#9CA3AF';
                  return (
                    <Box key={ing.id} sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{ing.productName}</Typography>
                          {ing.role && <Chip label={ing.role} size="small" sx={{ fontSize: '0.55rem', height: 16, bgcolor: `${color}15`, color }} />}
                        </Box>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>{ing.percentage}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={ing.percentage}
                        sx={{
                          height: 6,
                          borderRadius: 1,
                          bgcolor: '#E5E7EB',
                          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 1 },
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            )}

            {/* TDS */}
            {mod.showTds && selected.calculatedTds && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Technical Properties
                </Typography>
                <Grid container spacing={1}>
                  {selected.calculatedTds.density && (
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ p: 1, bgcolor: '#FFFFFF', borderRadius: 1, border: '1px solid #E5E7EB' }}>
                        <Typography variant="caption" color="text.secondary">Density</Typography>
                        <Typography variant="body2" fontWeight={500}>{selected.calculatedTds.density} g/cm³</Typography>
                      </Box>
                    </Grid>
                  )}
                  {selected.calculatedTds.meltFlowIndex && (
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ p: 1, bgcolor: '#FFFFFF', borderRadius: 1, border: '1px solid #E5E7EB' }}>
                        <Typography variant="caption" color="text.secondary">Melt Flow Index</Typography>
                        <Typography variant="body2" fontWeight={500}>{selected.calculatedTds.meltFlowIndex}</Typography>
                      </Box>
                    </Grid>
                  )}
                  {selected.calculatedTds.tensileStrength && (
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ p: 1, bgcolor: '#FFFFFF', borderRadius: 1, border: '1px solid #E5E7EB' }}>
                        <Typography variant="caption" color="text.secondary">Tensile Strength</Typography>
                        <Typography variant="body2" fontWeight={500}>{selected.calculatedTds.tensileStrength} MPa</Typography>
                      </Box>
                    </Grid>
                  )}
                  {selected.calculatedTds.elongationAtBreak && (
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ p: 1, bgcolor: '#FFFFFF', borderRadius: 1, border: '1px solid #E5E7EB' }}>
                        <Typography variant="caption" color="text.secondary">Elongation at Break</Typography>
                        <Typography variant="body2" fontWeight={500}>{selected.calculatedTds.elongationAtBreak}%</Typography>
                      </Box>
                    </Grid>
                  )}
                  {selected.calculatedTds.flexuralModulus && (
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ p: 1, bgcolor: '#FFFFFF', borderRadius: 1, border: '1px solid #E5E7EB' }}>
                        <Typography variant="caption" color="text.secondary">Flexural Modulus</Typography>
                        <Typography variant="body2" fontWeight={500}>{selected.calculatedTds.flexuralModulus} MPa</Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}

            {/* Recycled Content */}
            {mod.showRecycledContent && selected.recycledContent && selected.recycledContent.totalPercent > 0 && (
              <Box>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Recycled Content
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label={`${selected.recycledContent.totalPercent}% Total`} size="small" sx={{ fontSize: '0.7rem', bgcolor: '#D1FAE5', color: '#059669', fontWeight: 600 }} />
                  {selected.recycledContent.pcrPercent > 0 && (
                    <Chip label={`${selected.recycledContent.pcrPercent}% PCR`} size="small" sx={{ fontSize: '0.7rem', bgcolor: '#DBEAFE', color: '#2563EB' }} />
                  )}
                  {selected.recycledContent.pirPercent > 0 && (
                    <Chip label={`${selected.recycledContent.pirPercent}% PIR`} size="small" sx={{ fontSize: '0.7rem', bgcolor: '#EDE9FE', color: '#7C3AED' }} />
                  )}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {!selected && mod.formulationId === '' && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          Select a formulation above to preview its composition and properties.
        </Typography>
      )}
    </Box>
  );
}
