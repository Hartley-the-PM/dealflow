'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';
import Slider from '@mui/material/Slider';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '@/components/shared/PageHeader';
import { useDealStore } from '@/stores/dealStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useOpportunityStore } from '@/stores/opportunityStore';
import { useProductStore } from '@/stores/productStore';
import { useActivityStore } from '@/stores/activityStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHydration } from '@/hooks/useHydration';
import type { OpportunityLine, OpportunitySource, OpportunityPriority } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const SOURCES: OpportunitySource[] = ['Email', 'Phone', 'Website', 'Referral', 'Trade Show', 'Other'];
const PRIORITIES: OpportunityPriority[] = ['High', 'Medium', 'Low'];

export default function NewOpportunityPage() {
  const hydrated = useHydration();
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;

  const getDealById = useDealStore((s) => s.getDealById);
  const getCustomerById = useCustomerStore((s) => s.getCustomerById);
  const addOpportunity = useOpportunityStore((s) => s.addOpportunity);
  const addActivity = useActivityStore((s) => s.addActivity);
  const products = useProductStore((s) => s.products);
  const settings = useSettingsStore((s) => s.settings);

  const deal = getDealById(dealId);
  const customer = deal ? getCustomerById(deal.customerId) : undefined;

  const [title, setTitle] = useState('');
  const [source, setSource] = useState<OpportunitySource>('Email');
  const [priority, setPriority] = useState<OpportunityPriority>('Medium');
  const [probability, setProbability] = useState(20);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [competitorInfo, setCompetitorInfo] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Array<{ id: string; productId: string; productName: string; estimatedQty: string; targetPrice: string; notes: string }>>([]);

  const addLine = () => {
    setLines([...lines, { id: uuidv4(), productId: '', productName: '', estimatedQty: '', targetPrice: '', notes: '' }]);
  };

  const removeLine = (id: string) => setLines(lines.filter((l) => l.id !== id));

  const updateLine = (id: string, field: string, value: string) => {
    setLines(lines.map((l) => l.id === id ? { ...l, [field]: value } : l));
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    const oppLines: OpportunityLine[] = lines.map((l) => ({
      id: l.id,
      productId: l.productId,
      productName: l.productName || (products.find((p) => p.id === l.productId)?.name ?? ''),
      estimatedQty: l.estimatedQty ? parseFloat(l.estimatedQty) : null,
      targetPrice: l.targetPrice ? parseFloat(l.targetPrice) : null,
      notes: l.notes,
    }));

    const estimatedValue = oppLines.reduce((sum, l) => {
      if (l.estimatedQty && l.targetPrice) return sum + l.estimatedQty * l.targetPrice;
      return sum;
    }, 0);

    const opp = {
      id: uuidv4(),
      dealId,
      title: title || 'Untitled Opportunity',
      status: 'Open' as const,
      source,
      priority,
      probability,
      lines: oppLines,
      contactName,
      contactEmail,
      estimatedValue: estimatedValue > 0 ? estimatedValue : null,
      expectedCloseDate: expectedCloseDate || null,
      competitorInfo,
      notes,
      createdBy: settings.currentUser,
      createdAt: now,
      updatedAt: now,
      convertedOfferId: null,
      convertedOrderId: null,
    };

    addOpportunity(opp);
    addActivity({
      id: uuidv4(),
      entityType: 'opportunity',
      entityId: opp.id,
      dealId,
      action: 'opportunity_created',
      details: `Opportunity "${opp.title}" created`,
      userId: settings.currentUser,
      timestamp: now,
    });
    router.push(`/deals/${dealId}`);
  };

  if (!hydrated) return null;
  if (!deal) return <Typography>Deal not found.</Typography>;

  return (
    <Box>
      <PageHeader
        title="New Opportunity"
        subtitle={`${deal.name} \u2013 ${customer?.name ?? ''}`}
        breadcrumbs={[
          { label: 'Pipeline', href: '/deals' },
          { label: deal.name, href: `/deals/${dealId}` },
          { label: 'New Opportunity' },
        ]}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Opportunity Details */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Opportunity Details</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth size="small" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. HDPE Containers Q2 Inquiry" />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField select fullWidth size="small" label="Source" value={source} onChange={(e) => setSource(e.target.value as OpportunitySource)}>
                    {SOURCES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField select fullWidth size="small" label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as OpportunityPriority)}>
                    {PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth size="small" label="Expected Close Date" type="date" value={expectedCloseDate} onChange={(e) => setExpectedCloseDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Probability: {probability}%</Typography>
                  <Slider size="small" min={0} max={100} step={5} value={probability} onChange={(_, v) => setProbability(v as number)} valueLabelDisplay="auto" />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField fullWidth size="small" label="Contact Name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField fullWidth size="small" label="Contact Email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth size="small" label="Competitor Info" value={competitorInfo} onChange={(e) => setCompetitorInfo(e.target.value)} placeholder="Known competitors for this opportunity..." />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth size="small" label="Notes" multiline minRows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Product Lines ({lines.length})</Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={addLine}>Add Line</Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {lines.length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No product lines yet. Add products the customer is interested in.
                </Typography>
              )}

              {lines.map((line) => {
                const selectedProduct = products.find((p) => p.id === line.productId) ?? null;
                return (
                  <Card key={line.id} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent sx={{ pb: '12px !important' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">Line Item</Typography>
                        <IconButton size="small" color="error" onClick={() => removeLine(line.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Autocomplete
                            size="small"
                            options={products}
                            value={selectedProduct}
                            onChange={(_, newVal) => updateLine(line.id, 'productId', newVal?.id ?? '')}
                            getOptionLabel={(o) => `${o.name} - ${o.code}`}
                            renderInput={(params) => <TextField {...params} label="Product (from catalog)" placeholder="Search..." />}
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField fullWidth size="small" label="Or free-text product name" value={line.productName} onChange={(e) => updateLine(line.id, 'productName', e.target.value)} placeholder="e.g. HDPE pellets (TBD)" />
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                          <TextField fullWidth size="small" label="Est. Qty (MT)" type="number" value={line.estimatedQty} onChange={(e) => updateLine(line.id, 'estimatedQty', e.target.value)} inputProps={{ min: 0 }} />
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                          <TextField fullWidth size="small" label="Target Price ($/MT)" type="number" value={line.targetPrice} onChange={(e) => updateLine(line.id, 'targetPrice', e.target.value)} inputProps={{ min: 0 }} />
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                          <TextField fullWidth size="small" label="Notes" value={line.notes} onChange={(e) => updateLine(line.id, 'notes', e.target.value)} />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ position: 'sticky', top: 24 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Summary</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Lines</Typography>
                  <Typography variant="body2" fontWeight={500}>{lines.length}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Probability</Typography>
                  <Typography variant="body2" fontWeight={500}>{probability}%</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Est. Value</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {lines.reduce((sum, l) => {
                      const q = parseFloat(l.estimatedQty);
                      const p = parseFloat(l.targetPrice);
                      return sum + (isNaN(q) || isNaN(p) ? 0 : q * p);
                    }, 0) > 0
                      ? `$${lines.reduce((sum, l) => sum + (parseFloat(l.estimatedQty) || 0) * (parseFloat(l.targetPrice) || 0), 0).toLocaleString()}`
                      : '\u2014'}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Button variant="contained" fullWidth startIcon={<SaveIcon />} onClick={handleSave}>
                  Create Opportunity
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
