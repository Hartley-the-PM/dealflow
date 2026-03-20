'use client';

import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useProductStore } from '@/stores/productStore';
import { useOfferStore } from '@/stores/offerStore';
import { useOrderScheduleStore } from '@/stores/orderScheduleStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { ScheduleFrequency, ScheduledOrderEntry } from '@/types/orderSchedule';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

const FREQUENCIES: { value: ScheduleFrequency; label: string }[] = [
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Biweekly', label: 'Biweekly (every 2 weeks)' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Custom', label: 'Custom interval (days)' },
  { value: 'Specific Dates', label: 'Specific dates' },
];

interface Props {
  dealId: string;
  open: boolean;
  onClose: () => void;
}

export default function OrderScheduler({ dealId, open, onClose }: Props) {
  const products = useProductStore((s) => s.products);
  const offers = useOfferStore((s) => s.offers);
  const addSchedule = useOrderScheduleStore((s) => s.addSchedule);
  const settings = useSettingsStore((s) => s.settings);

  const [step, setStep] = useState(0);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [unit, setUnit] = useState<'MT' | 'KG'>('MT');
  const [pricePerUnit, setPricePerUnit] = useState<number>(0);
  const [currency, setCurrency] = useState('USD');
  const [frequency, setFrequency] = useState<ScheduleFrequency>('Monthly');
  const [customIntervalDays, setCustomIntervalDays] = useState(14);
  const [startDate, setStartDate] = useState('');
  const [totalOrders, setTotalOrders] = useState(6);
  const [isRecurring, setIsRecurring] = useState(false);
  const [scheduleName, setScheduleName] = useState('');
  const [specificDates, setSpecificDates] = useState<string[]>([]);
  const [newSpecificDate, setNewSpecificDate] = useState('');
  const [created, setCreated] = useState(false);

  // Products available on this deal
  const dealProductIds = useMemo(() => {
    const ids = new Set<string>();
    offers.filter((o) => o.dealId === dealId).forEach((o) => o.lines.forEach((l) => ids.add(l.productId)));
    return ids;
  }, [offers, dealId]);

  const dealProducts = useMemo(() =>
    products.filter((p) => dealProductIds.has(p.id)),
    [products, dealProductIds]
  );

  // Generate preview of delivery dates
  const previewEntries = useMemo((): ScheduledOrderEntry[] => {
    if (frequency === 'Specific Dates') {
      return specificDates.sort().map((date, i) => ({
        id: uuidv4(), sequenceNumber: i + 1, deliveryDate: date, status: 'Pending', orderId: null,
      }));
    }
    if (!startDate) return [];
    const count = isRecurring ? 12 : totalOrders;
    if (count <= 0) return [];
    const entries: ScheduledOrderEntry[] = [];
    let currentDate = new Date(startDate);
    for (let i = 0; i < count; i++) {
      entries.push({
        id: uuidv4(),
        sequenceNumber: i + 1,
        deliveryDate: currentDate.toISOString().split('T')[0],
        status: 'Pending',
        orderId: null,
      });
      if (frequency === 'Weekly') currentDate = addWeeks(currentDate, 1);
      else if (frequency === 'Biweekly') currentDate = addWeeks(currentDate, 2);
      else if (frequency === 'Monthly') currentDate = addMonths(currentDate, 1);
      else if (frequency === 'Custom') currentDate = addDays(currentDate, customIntervalDays);
    }
    return entries;
  }, [frequency, startDate, totalOrders, customIntervalDays, specificDates, isRecurring]);

  const selectedProduct = products.find((p) => p.id === productId);
  const totalValue = quantity * pricePerUnit * previewEntries.length;

  const handleCreate = () => {
    const now = new Date().toISOString();
    addSchedule({
      id: uuidv4(),
      dealId,
      name: scheduleName || `${selectedProduct?.name || 'Product'} — ${frequency} Schedule`,
      productId,
      quantity,
      unit,
      pricePerUnit,
      currency,
      frequency,
      customIntervalDays: frequency === 'Custom' ? customIntervalDays : null,
      startDate: frequency === 'Specific Dates' ? (specificDates[0] || '') : startDate,
      totalOrders: previewEntries.length,
      entries: previewEntries,
      status: 'Active',
      createdBy: settings.currentUser,
      createdAt: now,
      updatedAt: now,
    });
    setCreated(true);
    setStep(3);
  };

  const handleClose = () => {
    // Reset form
    setStep(0);
    setProductId('');
    setQuantity(0);
    setUnit('MT');
    setPricePerUnit(0);
    setIsRecurring(false);
    setCurrency('USD');
    setFrequency('Monthly');
    setCustomIntervalDays(14);
    setStartDate('');
    setTotalOrders(6);
    setScheduleName('');
    setSpecificDates([]);
    setNewSpecificDate('');
    setCreated(false);
    onClose();
  };

  const addSpecificDate = () => {
    if (newSpecificDate && !specificDates.includes(newSpecificDate)) {
      setSpecificDates([...specificDates, newSpecificDate]);
      setNewSpecificDate('');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Schedule Recurring Orders</DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} sx={{ mb: 3, mt: 1 }}>
          <Step><StepLabel>Product & Pricing</StepLabel></Step>
          <Step><StepLabel>Schedule</StepLabel></Step>
          <Step><StepLabel>Review</StepLabel></Step>
          <Step><StepLabel>Done</StepLabel></Step>
        </Stepper>

        {/* Step 0: Product & Pricing */}
        {step === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              select
              label="Product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              size="small"
              fullWidth
              required
              helperText={dealProducts.length === 0 ? 'Add products to the deal first (via offers)' : ''}
            >
              {dealProducts.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.name} ({p.code})</MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Quantity per Order"
                type="number"
                value={quantity || ''}
                onChange={(e) => setQuantity(Number(e.target.value))}
                size="small"
                fullWidth
                required
              />
              <TextField
                select
                label="Unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as 'MT' | 'KG')}
                size="small"
                sx={{ minWidth: 100 }}
              >
                <MenuItem value="MT">MT</MenuItem>
                <MenuItem value="KG">KG</MenuItem>
              </TextField>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Price per Unit"
                type="number"
                value={pricePerUnit || ''}
                onChange={(e) => setPricePerUnit(Number(e.target.value))}
                size="small"
                fullWidth
                required
              />
              <TextField
                select
                label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                size="small"
                sx={{ minWidth: 100 }}
              >
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="GBP">GBP</MenuItem>
              </TextField>
            </Box>
          </Box>
        )}

        {/* Step 1: Schedule */}
        {step === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Schedule Name"
              placeholder={`e.g. "${selectedProduct?.name || 'Product'} — Monthly Supply 2026"`}
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              size="small"
              fullWidth
            />
            <TextField
              select
              label="Frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as ScheduleFrequency)}
              size="small"
              fullWidth
            >
              {FREQUENCIES.map((f) => (
                <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
              ))}
            </TextField>

            {frequency === 'Custom' && (
              <TextField
                label="Interval (days)"
                type="number"
                value={customIntervalDays}
                onChange={(e) => setCustomIntervalDays(Number(e.target.value))}
                size="small"
                fullWidth
                helperText={`An order will be scheduled every ${customIntervalDays} days`}
              />
            )}

            {frequency !== 'Specific Dates' ? (
              <>
                <TextField
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  size="small"
                  fullWidth
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    select
                    label="Duration"
                    value={isRecurring ? 'recurring' : 'fixed'}
                    onChange={(e) => setIsRecurring(e.target.value === 'recurring')}
                    size="small"
                    sx={{ minWidth: 160 }}
                  >
                    <MenuItem value="fixed">Fixed number</MenuItem>
                    <MenuItem value="recurring">Recurring (indefinite)</MenuItem>
                  </TextField>
                  {!isRecurring && (
                    <TextField
                      label="Number of Orders"
                      type="number"
                      value={totalOrders}
                      onChange={(e) => setTotalOrders(Math.max(1, Math.min(52, Number(e.target.value))))}
                      size="small"
                      fullWidth
                      helperText="Max 52 orders per schedule"
                    />
                  )}
                  {isRecurring && (
                    <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                      Orders will be generated indefinitely until the schedule is paused or cancelled. The first 12 orders are previewed below.
                    </Typography>
                  )}
                </Box>
              </>
            ) : (
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Delivery Dates</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    type="date"
                    value={newSpecificDate}
                    onChange={(e) => setNewSpecificDate(e.target.value)}
                    size="small"
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <Button variant="outlined" size="small" onClick={addSpecificDate} disabled={!newSpecificDate}>
                    <AddIcon fontSize="small" />
                  </Button>
                </Box>
                {specificDates.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No dates added yet.</Typography>
                ) : (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {specificDates.sort().map((date) => (
                      <Chip
                        key={date}
                        label={format(new Date(date), 'MMM d, yyyy')}
                        size="small"
                        onDelete={() => setSpecificDates(specificDates.filter((d) => d !== date))}
                        sx={{ fontSize: '0.75rem' }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* Preview */}
            {previewEntries.length > 0 && (
              <Box sx={{ mt: 1, p: 2, bgcolor: '#F9FAFB', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {previewEntries.length} orders scheduled from{' '}
                  {format(new Date(previewEntries[0].deliveryDate), 'MMM d, yyyy')} to{' '}
                  {format(new Date(previewEntries[previewEntries.length - 1].deliveryDate), 'MMM d, yyyy')}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 180, p: 2, bgcolor: '#F9FAFB', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">Product</Typography>
                <Typography variant="body2" fontWeight={500}>{selectedProduct?.name || 'Unknown'}</Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 180, p: 2, bgcolor: '#F9FAFB', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">Quantity per Order</Typography>
                <Typography variant="body2" fontWeight={500}>{quantity.toLocaleString()} {unit}</Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 180, p: 2, bgcolor: '#F9FAFB', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">Price per Unit</Typography>
                <Typography variant="body2" fontWeight={500}>{currency === 'EUR' ? '\u20AC' : '$'}{pricePerUnit.toLocaleString(undefined, { minimumFractionDigits: 2 })}/{unit}</Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 180, p: 2, bgcolor: '#F9FAFB', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">Total Schedule Value</Typography>
                <Typography variant="body2" fontWeight={600} sx={{ color: '#059669' }}>{currency === 'EUR' ? '\u20AC' : '$'}{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
              </Box>
            </Box>

            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Delivery Schedule ({previewEntries.length} orders)
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Delivery Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Value</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{entry.sequenceNumber}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{format(new Date(entry.deliveryDate), 'EEE, MMM d, yyyy')}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{quantity.toLocaleString()} {unit}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{currency === 'EUR' ? '\u20AC' : '$'}{(quantity * pricePerUnit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell><Chip label="Pending" size="small" sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#6B7280', bgcolor: '#F3F4F6' }} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: '#059669', mb: 2 }} />
            <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Schedule Created</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {previewEntries.length} recurring orders have been scheduled for {selectedProduct?.name || 'this product'}.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You can view and manage schedules from the Pipeline tab on this deal.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {step < 3 && <Button onClick={handleClose}>Cancel</Button>}
        {step > 0 && step < 3 && <Button onClick={() => setStep((s) => s - 1)}>Back</Button>}
        {step === 0 && (
          <Button variant="contained" onClick={() => setStep(1)} disabled={!productId || quantity <= 0 || pricePerUnit <= 0}>
            Next
          </Button>
        )}
        {step === 1 && (
          <Button variant="contained" onClick={() => setStep(2)} disabled={previewEntries.length === 0}>
            Next
          </Button>
        )}
        {step === 2 && (
          <Button variant="contained" onClick={handleCreate}>
            Create Schedule
          </Button>
        )}
        {step === 3 && <Button variant="contained" onClick={handleClose}>Done</Button>}
      </DialogActions>
    </Dialog>
  );
}
