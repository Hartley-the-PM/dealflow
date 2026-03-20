'use client';

import { useState, useMemo } from 'react';
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
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '@/components/shared/PageHeader';
import { useDealStore } from '@/stores/dealStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useOrderStore } from '@/stores/orderStore';
import { useProductStore } from '@/stores/productStore';
import { usePricingStore } from '@/stores/pricingStore';
import { useActivityStore } from '@/stores/activityStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHydration } from '@/hooks/useHydration';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import type { OrderLine } from '@/types';

const INCOTERMS = ['FCA', 'FOB', 'CIF', 'CFR', 'EXW', 'DAP', 'DDP'];
const CURRENCIES = ['USD', 'EUR'];
const UNITS: Array<'MT' | 'KG'> = ['MT', 'KG'];

export default function NewOrderPage() {
  const hydrated = useHydration();
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;

  const getDealById = useDealStore((s) => s.getDealById);
  const getCustomerById = useCustomerStore((s) => s.getCustomerById);
  const addOrder = useOrderStore((s) => s.addOrder);
  const addActivity = useActivityStore((s) => s.addActivity);
  const products = useProductStore((s) => s.products);
  const getMSPForProduct = usePricingStore((s) => s.getMSPForProduct);
  const settings = useSettingsStore((s) => s.settings);
  const currentMonth = format(new Date(), 'yyyy-MM');

  const deal = getDealById(dealId);
  const customer = deal ? getCustomerById(deal.customerId) : undefined;

  const [name, setName] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [orderDate, setOrderDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [deliveryDate, setDeliveryDate] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [incoterms, setIncoterms] = useState('FOB');
  const [incotermsLocation, setIncotermsLocation] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [notes, setNotes] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [lines, setLines] = useState<Array<{ id: string; productId: string; quantity: string; unit: 'MT' | 'KG'; pricePerUnit: string; currency: string }>>([]);

  const addLine = () => {
    setLines([...lines, { id: uuidv4(), productId: '', quantity: '', unit: 'MT', pricePerUnit: '', currency }]);
  };
  const removeLine = (id: string) => setLines(lines.filter((l) => l.id !== id));
  const updateLine = (id: string, field: string, value: string) => {
    setLines(lines.map((l) => l.id === id ? { ...l, [field]: value } : l));
  };

  const totalValue = useMemo(() => {
    return lines.reduce((sum, l) => {
      const q = parseFloat(l.quantity);
      const p = parseFloat(l.pricePerUnit);
      return sum + (isNaN(q) || isNaN(p) ? 0 : q * p);
    }, 0);
  }, [lines]);

  const handleSave = () => {
    const now = new Date().toISOString();
    const orderLines: OrderLine[] = lines.filter((l) => l.productId).map((l) => ({
      id: l.id,
      productId: l.productId,
      quantity: l.quantity ? parseFloat(l.quantity) : null,
      unit: l.unit,
      pricePerUnit: parseFloat(l.pricePerUnit) || 0,
      currency: l.currency || currency,
    }));

    const order = {
      id: uuidv4(),
      orderNumber: `ORD-${format(new Date(), 'yyyy')}-${String(Math.floor(Math.random() * 900) + 100)}`,
      offerId: null,
      opportunityId: null,
      dealId,
      customerId: deal?.customerId ?? '',
      name: name || 'Untitled Order',
      status: 'Draft' as const,
      lines: orderLines,
      currency,
      incoterms,
      incotermsLocation,
      paymentTerms,
      poNumber,
      orderDate: orderDate || now,
      deliveryDate: deliveryDate || null,
      shippingAddress: { street, city, state, postalCode, country },
      carrier: '',
      trackingNumber: '',
      estimatedArrival: null,
      documents: [],
      notes,
      createdBy: settings.currentUser,
      createdAt: now,
      updatedAt: now,
    };

    addOrder(order);
    addActivity({
      id: uuidv4(),
      entityType: 'order',
      entityId: order.id,
      dealId,
      action: 'order_created',
      details: `Order "${order.name}" (${order.orderNumber}) created`,
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
        title="New Order"
        subtitle={`${deal.name} \u2013 ${customer?.name ?? ''}`}
        breadcrumbs={[
          { label: 'Pipeline', href: '/deals' },
          { label: deal.name, href: `/deals/${dealId}` },
          { label: 'New Order' },
        ]}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Order Details */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Order Details</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth size="small" label="Order Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q1 HDPE Supply" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth size="small" label="PO Number" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="e.g. PO-2026-0342" />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField fullWidth size="small" label="Order Date" type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField fullWidth size="small" label="Delivery Date" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField select fullWidth size="small" label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField select fullWidth size="small" label="Incoterms" value={incoterms} onChange={(e) => setIncoterms(e.target.value)}>
                    {INCOTERMS.map((i) => <MenuItem key={i} value={i}>{i}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField fullWidth size="small" label="Incoterms Location" value={incotermsLocation} onChange={(e) => setIncotermsLocation(e.target.value)} placeholder="e.g. Rotterdam" />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField fullWidth size="small" label="Payment Terms" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="e.g. Net 30" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth size="small" label="Notes" multiline minRows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Shipping Address</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth size="small" label="Street Address" value={street} onChange={(e) => setStreet(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField fullWidth size="small" label="City" value={city} onChange={(e) => setCity(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField fullWidth size="small" label="State / Province" value={state} onChange={(e) => setState(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField fullWidth size="small" label="Postal Code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField fullWidth size="small" label="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
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
                  No product lines yet. Click &quot;Add Line&quot; to start.
                </Typography>
              )}

              {lines.map((line) => {
                const selectedProduct = products.find((p) => p.id === line.productId) ?? null;
                const mspEntry = line.productId ? getMSPForProduct(line.productId, currentMonth) : undefined;
                const price = parseFloat(line.pricePerUnit);
                const margin = mspEntry && !isNaN(price) && price > 0 ? ((price - mspEntry.price) / price) * 100 : null;

                return (
                  <Card key={line.id} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent sx={{ pb: '12px !important' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">Line Item</Typography>
                        <IconButton size="small" color="error" onClick={() => removeLine(line.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                          <Autocomplete
                            size="small"
                            options={products}
                            value={selectedProduct}
                            onChange={(_, newVal) => updateLine(line.id, 'productId', newVal?.id ?? '')}
                            getOptionLabel={(o) => `${o.name} - ${o.code}`}
                            renderInput={(params) => <TextField {...params} label="Product" placeholder="Search catalog..." />}
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                          />
                        </Grid>
                        <Grid size={{ xs: 3 }}>
                          <TextField fullWidth size="small" label="Quantity" type="number" value={line.quantity} onChange={(e) => updateLine(line.id, 'quantity', e.target.value)} inputProps={{ min: 0 }} />
                        </Grid>
                        <Grid size={{ xs: 2 }}>
                          <TextField select fullWidth size="small" label="Unit" value={line.unit} onChange={(e) => updateLine(line.id, 'unit', e.target.value)}>
                            {UNITS.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                          </TextField>
                        </Grid>
                        <Grid size={{ xs: 3 }}>
                          <TextField fullWidth size="small" label="Price/Unit" type="number" value={line.pricePerUnit} onChange={(e) => updateLine(line.id, 'pricePerUnit', e.target.value)} inputProps={{ min: 0 }} />
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', pt: 0.5 }}>
                            {mspEntry && (
                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>MSP</Typography>
                                <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8rem' }}>{mspEntry.price.toFixed(2)}</Typography>
                              </Box>
                            )}
                            {margin !== null && (
                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Margin</Typography>
                                <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8rem', color: margin >= 0 ? 'success.main' : 'error.main' }}>{margin.toFixed(1)}%</Typography>
                              </Box>
                            )}
                          </Box>
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
                  <Typography variant="body2" color="text.secondary">Total Value</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {totalValue > 0 ? `${currency} ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '\u2014'}
                  </Typography>
                </Box>
                {poNumber && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">PO#</Typography>
                    <Typography variant="body2" fontWeight={500}>{poNumber}</Typography>
                  </Box>
                )}
                <Divider sx={{ my: 1 }} />
                <Button variant="contained" fullWidth startIcon={<SaveIcon />} onClick={handleSave}>
                  Create Order
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
