'use client';

import { useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Collapse from '@mui/material/Collapse';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SaveIcon from '@mui/icons-material/Save';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import BlockIcon from '@mui/icons-material/Block';
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ViewListIcon from '@mui/icons-material/ViewList';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TuneIcon from '@mui/icons-material/Tune';
import PricingPanel from './PricingPanel';
import OfferModuleBuilder from './OfferModuleBuilder';
import type { OfferModule, ProductsModule, OfferModuleType } from '@/types/offerBuilder';
import { useOfferTemplateStore } from '@/stores/offerTemplateStore';
import { useOfferBuilderSettingsStore } from '@/stores/offerBuilderSettingsStore';
import type { PricingContext } from './modules/ProductsModuleEditor';
import { migrateModules } from '@/lib/migrateModules';
import { useProductStore } from '@/stores/productStore';
import { usePricingStore } from '@/stores/pricingStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWhiteLabelStore } from '@/stores/whiteLabelStore';
import { useFormulationStore } from '@/stores/formulationStore';
import { usePricingEngine } from '@/hooks/usePricingEngine';
import { usePricingEngineStore } from '@/stores/pricingEngineStore';
import { checkGuardrails } from '@/lib/pricingEngine';
import type { PricingResult, GuardrailViolation, Guardrail } from '@/types/pricingEngine';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import type {
  Offer,
  OfferLine,
  Currency,
  Incoterms,
  UnitOfMeasure,
  BelowMSPReason,
  Product,
} from '@/types';

// ------ Constants ------

const CURRENCIES: Currency[] = ['USD', 'EUR'];
const INCOTERMS_OPTIONS: Incoterms[] = ['FCA', 'FOB', 'CIF', 'CFR', 'EXW', 'DAP', 'DDP'];
const UNITS: UnitOfMeasure[] = ['MT', 'KG'];
const BELOW_MSP_REASONS: BelowMSPReason[] = [
  'Volume commitment',
  'Strategic account',
  'Market conditions',
  'Competitive pressure',
  'Other',
];

// ------ Types ------

interface OfferFormProps {
  dealId: string;
  customerId?: string;
  offer?: Offer;
  defaultName?: string;
  defaultVersion?: number;
  onSave: (offer: Offer) => void;
  initialModules?: OfferModule[];
}

interface FormLine {
  id: string;
  lineType: 'product' | 'white_label' | 'formulation';
  productId: string;
  whiteLabelId: string;
  formulationId: string;
  quantity: string; // kept as string for form input
  unit: UnitOfMeasure;
  pricePerUnit: string; // kept as string for form input
  currency: Currency;
  incoterms: Incoterms;
  paymentTerms: string;
  belowMSPReason: BelowMSPReason | '';
  belowMSPNote: string;
}

// ------ Component ------

export default function OfferForm({ dealId, customerId, offer, defaultName, defaultVersion, onSave, initialModules }: OfferFormProps) {
  const products = useProductStore((s) => s.products);
  const getProductById = useProductStore((s) => s.getProductById);
  const getMSPForProduct = usePricingStore((s) => s.getMSPForProduct);
  const settings = useSettingsStore((s) => s.settings);
  const wlProducts = useWhiteLabelStore((s) => s.products);
  const wlBrands = useWhiteLabelStore((s) => s.brands);
  const formulations = useFormulationStore((s) => s.formulations);
  const { computePrice } = usePricingEngine();
  const guardrails = usePricingEngineStore((s) => s.guardrails);
  const allTemplates = useOfferTemplateStore((s) => s.templates);
  const contentPresets = useOfferBuilderSettingsStore((s) => s.contentPresets);
  const brandProfiles = useOfferBuilderSettingsStore((s) => s.brandProfiles);

  const currentMonth = format(new Date(), 'yyyy-MM');

  // ------ Form State ------

  const [name, setName] = useState(offer?.name ?? defaultName ?? '');
  const [currency, setCurrency] = useState<Currency>(offer?.currency ?? 'USD');
  const [incoterms, setIncoterms] = useState<Incoterms>(offer?.incoterms ?? 'FCA');
  const [incotermsLocation, setIncotermsLocation] = useState(offer?.incotermsLocation ?? '');
  const [paymentTerms, setPaymentTerms] = useState(offer?.paymentTerms ?? '');
  const [validityDate, setValidityDate] = useState(offer?.validityDate ?? '');
  const [notes, setNotes] = useState(offer?.notes ?? '');

  const initialLines: FormLine[] = useMemo(() => {
    if (offer && offer.lines.length > 0) {
      return offer.lines.map((line) => ({
        id: line.id,
        lineType: line.lineType || 'product',
        productId: line.productId,
        whiteLabelId: line.whiteLabelId || '',
        formulationId: line.formulationId || '',
        quantity: line.quantity !== null ? String(line.quantity) : '',
        unit: line.unit,
        pricePerUnit: String(line.pricePerUnit),
        currency: line.currency,
        incoterms: line.incoterms,
        paymentTerms: line.paymentTerms,
        belowMSPReason: line.belowMSPReason ?? '',
        belowMSPNote: line.belowMSPNote ?? '',
      }));
    }
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [lines, setLines] = useState<FormLine[]>(initialLines);

  // Auto-detect builder mode if modules present
  const hasExistingModules = (offer?.modules && offer.modules.length > 0) || (initialModules && initialModules.length > 0);
  const [mode, setMode] = useState<'classic' | 'builder'>(hasExistingModules ? 'builder' : 'classic');
  const [builderModules, setBuilderModules] = useState<OfferModule[]>(() =>
    migrateModules(offer?.modules ?? initialModules ?? [])
  );
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Build modules from a template's slots + content blocks
  const applyTemplate = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    const template = allTemplates.find((t) => t.id === templateId);
    if (!template) return;

    // Helper to create a default module for a type
    const createModule = (type: OfferModuleType): OfferModule => {
      const id = uuidv4();
      switch (type) {
        case 'hero': return { type, id, visible: true, title: '', customerName: '', date: '', intro: '', logoUrl: '' };
        case 'products': return { type, id, visible: true, showQuantity: true, showUnit: true, showUnitPrice: true, showTotal: true, entries: [] };
        case 'terms': return { type, id, visible: true, paymentTerms: '', incoterms: '', validity: '', delivery: '', legalNotes: '' };
        case 'custom_text': return { type, id, visible: true, heading: '', body: '' };
        case 'company_about': return { type, id, visible: true, mission: '', vision: '', values: [], certifications: [], differentiators: [] };
        case 'certifications': return { type, id, visible: true, title: 'Certifications & Compliance', certifications: [] };
        case 'testimonials': return { type, id, visible: true, testimonials: [] };
        case 'cover_image': return { type, id, visible: true, backgroundImageUrl: '', title: '', subtitle: '', overlayOpacity: 0.5, overlayColor: '#000000' };
        case 'divider': return { type, id, visible: true, style: 'line' as const, height: 32 };
        case 'image': return { type, id, visible: true, imageUrl: '', caption: '', alt: '', width: 'full' as const, alignment: 'center' as const };
        default: return { type: 'custom_text' as const, id, visible: true, heading: '', body: '' };
      }
    };

    if (template.slots && template.slots.length > 0) {
      // Build from slots + blocks
      const newModules = template.slots.map((slot) => {
        const baseModule = createModule(slot.moduleType);
        if (slot.contentBlockId) {
          const block = contentPresets.find((p) => p.id === slot.contentBlockId);
          if (block) {
            return { ...baseModule, ...block.data, id: baseModule.id, type: baseModule.type, visible: true };
          }
        }
        return baseModule;
      });
      setBuilderModules(newModules as OfferModule[]);
    } else if (template.modules.length > 0) {
      // Legacy: use pre-built modules
      setBuilderModules(template.modules.map((m) => ({ ...m, id: uuidv4() })));
    }
  }, [allTemplates, contentPresets]);

  // ------ Line Operations ------

  const addLine = useCallback((lineType: 'product' | 'white_label' | 'formulation' = 'product') => {
    setLines((prev) => [
      ...prev,
      {
        id: uuidv4(),
        lineType,
        productId: '',
        whiteLabelId: '',
        formulationId: '',
        quantity: '',
        unit: 'MT',
        pricePerUnit: '',
        currency,
        incoterms,
        paymentTerms,
        belowMSPReason: '',
        belowMSPNote: '',
      },
    ]);
  }, [currency, incoterms, paymentTerms]);

  const removeLine = useCallback((lineId: string) => {
    setLines((prev) => prev.filter((l) => l.id !== lineId));
  }, []);

  const updateLine = useCallback((lineId: string, field: keyof FormLine, value: string) => {
    setLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, [field]: value } : l))
    );
  }, []);

  const updateLineProduct = useCallback((lineId: string, product: Product | null) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l;
        const newProductId = product?.id ?? '';
        let newPrice = l.pricePerUnit;
        if (newProductId && customerId) {
          try {
            const qty = parseFloat(l.quantity) || 50;
            const result = computePrice(newProductId, qty, customerId, incoterms, paymentTerms);
            if (result.finalPrice > 0) {
              newPrice = String(result.finalPrice);
            }
          } catch {
            // fallback: keep existing price
          }
        }
        if (!newProductId) newPrice = '';
        return { ...l, productId: newProductId, pricePerUnit: newPrice };
      })
    );
  }, [customerId, computePrice, incoterms, paymentTerms]);

  const applyPrice = useCallback((lineId: string, price: number) => {
    setLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, pricePerUnit: String(price) } : l))
    );
  }, []);

  // ------ MSP Helpers ------

  const getMSPPrice = useCallback(
    (productId: string): number | null => {
      if (!productId) return null;
      const entry = getMSPForProduct(productId, currentMonth);
      return entry ? entry.price : null;
    },
    [getMSPForProduct, currentMonth]
  );

  const getMargin = useCallback(
    (priceStr: string, productId: string): { abs: number; pct: number } | null => {
      const price = parseFloat(priceStr);
      if (isNaN(price) || price <= 0) return null;
      const msp = getMSPPrice(productId);
      if (msp === null) return null;
      const abs = price - msp;
      const pct = (abs / price) * 100;
      return { abs, pct };
    },
    [getMSPPrice]
  );

  const isBelowMSP = useCallback(
    (priceStr: string, productId: string): boolean => {
      const price = parseFloat(priceStr);
      if (isNaN(price)) return false;
      const msp = getMSPPrice(productId);
      if (msp === null) return false;
      return price < msp;
    },
    [getMSPPrice]
  );

  // ------ Summary Calculations ------

  const summary = useMemo(() => {
    let totalLines = lines.length;
    let totalValue = 0;
    const margins: number[] = [];
    let belowMSPCount = 0;
    let missingQtyCount = 0;

    lines.forEach((line) => {
      const price = parseFloat(line.pricePerUnit);
      const qty = parseFloat(line.quantity);

      if (!isNaN(qty) && qty > 0 && !isNaN(price) && price > 0) {
        totalValue += price * qty;
      }

      if (line.quantity === '' || isNaN(qty)) {
        missingQtyCount++;
      }

      if (!isNaN(price) && price > 0 && line.productId) {
        const msp = getMSPPrice(line.productId);
        if (msp !== null) {
          if (price < msp) belowMSPCount++;
          margins.push(((price - msp) / price) * 100);
        }
      }
    });

    const avgMargin =
      margins.length > 0
        ? margins.reduce((a, b) => a + b, 0) / margins.length
        : null;

    return { totalLines, totalValue, avgMargin, belowMSPCount, missingQtyCount };
  }, [lines, getMSPPrice]);

  // ------ Save Handler ------

  const handleSave = () => {
    const now = new Date().toISOString();

    // Extract lines from ProductsModule if in builder mode
    const productsModule = mode === 'builder'
      ? builderModules.find((m): m is ProductsModule => m.type === 'products')
      : undefined;

    const offerLines: OfferLine[] = productsModule
      ? productsModule.entries
          .filter((e) => e.productId)
          .map((e) => ({
            id: e.id,
            lineType: 'product' as const,
            productId: e.productId,
            whiteLabelId: '',
            formulationId: '',
            formulationParts: [],
            quantity: e.quantity,
            unit: e.unit,
            pricePerUnit: e.pricePerUnit,
            currency,
            incoterms,
            paymentTerms,
            belowMSPReason: null,
            belowMSPNote: '',
          }))
      : lines
          .filter((l) => l.productId || l.whiteLabelId || l.formulationId)
          .map((l) => ({
            id: l.id,
            lineType: l.lineType || 'product' as const,
            productId: l.productId,
            whiteLabelId: l.whiteLabelId || '',
            formulationId: l.formulationId || '',
            formulationParts: [],
            quantity: l.quantity !== '' ? parseFloat(l.quantity) : null,
            unit: l.unit,
            pricePerUnit: parseFloat(l.pricePerUnit) || 0,
            currency: l.currency || currency,
            incoterms: l.incoterms || incoterms,
            paymentTerms: l.paymentTerms || paymentTerms,
            belowMSPReason: l.belowMSPReason === '' ? null : l.belowMSPReason,
            belowMSPNote: l.belowMSPNote,
          }));

    const offerData: Offer = {
      id: offer?.id ?? uuidv4(),
      dealId,
      version: offer?.version ?? defaultVersion ?? 1,
      name: name || 'Untitled Offer',
      status: offer?.status ?? 'Draft',
      currency,
      incoterms,
      incotermsLocation,
      paymentTerms,
      validityDate,
      notes,
      lines: offerLines,
      createdBy: offer?.createdBy ?? settings.currentUser,
      createdAt: offer?.createdAt ?? now,
      updatedAt: now,
      sentAt: offer?.sentAt ?? null,
      modules: mode === 'builder' && builderModules.length > 0 ? builderModules : undefined,
      shareToken: offer?.shareToken,
      templateId: offer?.templateId,
    };

    onSave(offerData);
  };

  // ------ Product info for builder ------
  const builderProducts = products.map((p) => ({ id: p.id, name: p.name, code: p.code }));
  const builderOfferLines: import('@/types').OfferLine[] = lines
    .filter((l) => l.productId || l.whiteLabelId || l.formulationId)
    .map((l) => ({
      id: l.id,
      lineType: l.lineType || 'product' as const,
      productId: l.productId,
      whiteLabelId: l.whiteLabelId || '',
      formulationId: l.formulationId || '',
      formulationParts: [],
      quantity: l.quantity !== '' ? parseFloat(l.quantity) : null,
      unit: l.unit,
      pricePerUnit: parseFloat(l.pricePerUnit) || 0,
      currency: l.currency || currency,
      incoterms: l.incoterms || incoterms,
      paymentTerms: l.paymentTerms || paymentTerms,
      belowMSPReason: l.belowMSPReason === '' ? null : l.belowMSPReason,
      belowMSPNote: l.belowMSPNote,
    }));

  // ------ Builder Mode Layout ------

  if (mode === 'builder') {
    return (
      <Box>
        {/* Top Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 2,
            flexWrap: 'wrap',
          }}
        >
          <ToggleButtonGroup
            size="small"
            value={mode}
            exclusive
            onChange={(_, v) => { if (v) setMode(v); }}
          >
            <ToggleButton value="classic">
              <ViewListIcon sx={{ fontSize: 18, mr: 0.5 }} />
              Classic
            </ToggleButton>
            <ToggleButton value="builder">
              <DashboardCustomizeIcon sx={{ fontSize: 18, mr: 0.5 }} />
              Builder
            </ToggleButton>
          </ToggleButtonGroup>
          <TextField
            select
            size="small"
            value={selectedTemplateId}
            onChange={(e) => applyTemplate(e.target.value)}
            label="Template"
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Start from scratch</MenuItem>
            {allTemplates.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Offer name"
            sx={{ flex: 1, minWidth: 200 }}
          />
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{ textTransform: 'none' }}
          >
            {offer ? 'Save Changes' : 'Save as Draft'}
          </Button>
        </Box>

        {/* Collapsible Metadata */}
        <Box sx={{ mb: 2 }}>
          <Button
            size="small"
            variant="text"
            startIcon={<TuneIcon />}
            endIcon={metadataOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setMetadataOpen(!metadataOpen)}
            sx={{ textTransform: 'none', color: 'text.secondary', fontSize: '0.82rem' }}
          >
            {metadataOpen ? 'Hide' : 'Show'} Offer Details (currency, incoterms, payment terms...)
          </Button>
          <Collapse in={metadataOpen}>
            <Card variant="outlined" sx={{ mt: 1, mb: 1 }}>
              <CardContent sx={{ py: '12px !important' }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as Currency)}
                    >
                      {CURRENCIES.map((c) => (
                        <MenuItem key={c} value={c}>{c}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Incoterms"
                      value={incoterms}
                      onChange={(e) => setIncoterms(e.target.value as Incoterms)}
                    >
                      {INCOTERMS_OPTIONS.map((i) => (
                        <MenuItem key={i} value={i}>{i}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Payment Terms"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      placeholder="e.g. Net 30"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Validity Date"
                      type="date"
                      value={validityDate}
                      onChange={(e) => setValidityDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Incoterms Location"
                      value={incotermsLocation}
                      onChange={(e) => setIncotermsLocation(e.target.value)}
                      placeholder="e.g. Rotterdam"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional notes..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Collapse>
        </Box>

        {/* Split-View Builder */}
        <OfferModuleBuilder
          modules={builderModules}
          onChange={setBuilderModules}
          offerLines={builderOfferLines}
          products={builderProducts}
          pricingContext={customerId ? {
            customerId,
            incoterms,
            paymentTerms,
            currency,
            computePrice,
            allProducts: products,
          } as PricingContext : undefined}
          initialBrandProfileId={allTemplates.find((t) => t.id === selectedTemplateId)?.brandProfileId}
        />
      </Box>
    );
  }

  // ------ Classic Mode (unchanged) ------

  return (
    <Grid container spacing={3}>
      {/* Mode Toggle */}
      <Grid size={{ xs: 12 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: -1 }}>
          <ToggleButtonGroup
            size="small"
            value={mode}
            exclusive
            onChange={(_, v) => { if (v) setMode(v); }}
          >
            <ToggleButton value="classic">
              <ViewListIcon sx={{ fontSize: 18, mr: 0.5 }} />
              Classic Form
            </ToggleButton>
            <ToggleButton value="builder">
              <DashboardCustomizeIcon sx={{ fontSize: 18, mr: 0.5 }} />
              Builder Mode
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Grid>

      {/* Left Column: Metadata + Lines */}
      <Grid size={{ xs: 12, md: 8 }}>
        {/* Metadata Section */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Offer Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Offer Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                >
                  {CURRENCIES.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Incoterms"
                  value={incoterms}
                  onChange={(e) => setIncoterms(e.target.value as Incoterms)}
                >
                  {INCOTERMS_OPTIONS.map((i) => (
                    <MenuItem key={i} value={i}>
                      {i}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Incoterms Location"
                  value={incotermsLocation}
                  onChange={(e) => setIncotermsLocation(e.target.value)}
                  placeholder="e.g. Rotterdam"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Payment Terms"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="e.g. Net 30"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Validity Date"
                  type="date"
                  value={validityDate}
                  onChange={(e) => setValidityDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Notes"
                  multiline
                  minRows={2}
                  maxRows={6}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes for this offer..."
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Offer Lines Section */}
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Offer Lines ({lines.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => addLine('product')}>
                  Product
                </Button>
                <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => addLine('white_label')} sx={{ borderColor: '#7C3AED', color: '#7C3AED' }}>
                  White Label
                </Button>
                <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => addLine('formulation')} sx={{ borderColor: '#0891B2', color: '#0891B2' }}>
                  Formulation
                </Button>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {lines.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No product lines yet. Click &quot;Add Product Line&quot; to start.
                </Typography>
              </Box>
            )}

            {lines.map((line, index) => (
              <OfferLineItem
                key={line.id}
                line={line}
                index={index}
                products={products}
                wlProducts={wlProducts}
                wlBrands={wlBrands}
                formulations={formulations}
                getProductById={getProductById}
                getMSPPrice={getMSPPrice}
                getMargin={getMargin}
                isBelowMSP={isBelowMSP}
                onUpdate={updateLine}
                onUpdateProduct={updateLineProduct}
                onRemove={removeLine}
                onApplyPrice={applyPrice}
                computePrice={customerId ? computePrice : undefined}
                customerId={customerId}
                incoterms={incoterms}
                paymentTerms={paymentTerms}
                guardrails={guardrails}
              />
            ))}
          </CardContent>
        </Card>
      </Grid>

      {/* Right Column: Summary Panel */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card variant="outlined" sx={{ position: 'sticky', top: 24 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Total Lines
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {summary.totalLines}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Estimated Total Value
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {summary.totalValue > 0
                    ? `${currency} ${summary.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '\u2014'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Avg Margin vs MSP
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  sx={{
                    color:
                      summary.avgMargin !== null
                        ? summary.avgMargin >= 0
                          ? 'success.main'
                          : 'error.main'
                        : 'text.primary',
                  }}
                >
                  {summary.avgMargin !== null ? `${summary.avgMargin.toFixed(1)}%` : '\u2014'}
                </Typography>
              </Box>

              {summary.belowMSPCount > 0 && (
                <Alert severity="warning" sx={{ py: 0 }}>
                  {summary.belowMSPCount} line{summary.belowMSPCount > 1 ? 's' : ''} below MSP
                </Alert>
              )}
              {summary.missingQtyCount > 0 && (
                <Alert severity="info" sx={{ py: 0 }}>
                  {summary.missingQtyCount} line{summary.missingQtyCount > 1 ? 's' : ''} missing quantity
                </Alert>
              )}

              <Divider sx={{ my: 1 }} />

              <Button
                variant="contained"
                fullWidth
                startIcon={<SaveIcon />}
                onClick={handleSave}
                sx={{ mb: 1 }}
              >
                {offer ? 'Save Changes' : 'Save as Draft'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Pricing Intelligence Panel */}
        {customerId && (
          <Box sx={{ mt: 2 }}>
            <PricingPanel
              lines={lines.map((l) => ({
                id: l.id,
                productId: l.productId,
                quantity: l.quantity,
                pricePerUnit: l.pricePerUnit,
              }))}
              customerId={customerId}
              incoterms={incoterms}
              paymentTerms={paymentTerms}
              onApplyPrice={applyPrice}
            />
          </Box>
        )}
      </Grid>
    </Grid>
  );
}

// ====================================================
// OfferLineItem Sub-Component
// ====================================================

interface OfferLineItemProps {
  line: FormLine;
  index: number;
  products: Product[];
  wlProducts: import('@/types/whiteLabel').WhiteLabelProduct[];
  wlBrands: import('@/types/whiteLabel').WhiteLabelBrand[];
  formulations: import('@/types/formulation').Formulation[];
  getProductById: (id: string) => Product | undefined;
  getMSPPrice: (productId: string) => number | null;
  getMargin: (priceStr: string, productId: string) => { abs: number; pct: number } | null;
  isBelowMSP: (priceStr: string, productId: string) => boolean;
  onUpdate: (lineId: string, field: keyof FormLine, value: string) => void;
  onUpdateProduct: (lineId: string, product: Product | null) => void;
  onRemove: (lineId: string) => void;
  onApplyPrice: (lineId: string, price: number) => void;
  computePrice?: (productId: string, qty: number, customerId: string, incoterms: Incoterms, paymentTerms: string) => PricingResult;
  customerId?: string;
  incoterms: Incoterms;
  paymentTerms: string;
  guardrails: Guardrail[];
}

function OfferLineItem({
  line,
  index,
  products,
  wlProducts,
  wlBrands,
  formulations,
  getProductById,
  getMSPPrice,
  getMargin,
  isBelowMSP,
  onUpdate,
  onUpdateProduct,
  onRemove,
  onApplyPrice,
  computePrice,
  customerId,
  incoterms: offerIncoterms,
  paymentTerms: offerPaymentTerms,
  guardrails,
}: OfferLineItemProps) {
  const selectedProduct = line.productId ? getProductById(line.productId) ?? null : null;
  const mspPrice = getMSPPrice(line.productId);
  const margin = getMargin(line.pricePerUnit, line.productId);
  const belowMSP = isBelowMSP(line.pricePerUnit, line.productId);
  const missingQty = belowMSP && (line.quantity === '' || isNaN(parseFloat(line.quantity)));

  // Compute recommended price from the price book
  const recommended = useMemo((): PricingResult | null => {
    if (!computePrice || !customerId || !line.productId) return null;
    const qty = parseFloat(line.quantity) || 50;
    return computePrice(line.productId, qty, customerId, offerIncoterms, offerPaymentTerms);
  }, [computePrice, customerId, line.productId, line.quantity, offerIncoterms, offerPaymentTerms]);

  const currentPrice = parseFloat(line.pricePerUnit);
  const isUsingRecommended = recommended && !isNaN(currentPrice) && Math.abs(currentPrice - recommended.finalPrice) < 0.01;

  // Check guardrails against the user's entered price
  const priceViolations = useMemo((): GuardrailViolation[] => {
    if (!recommended || isNaN(currentPrice) || currentPrice <= 0) return [];
    const activeGuardrails = guardrails.filter((g) => g.active);
    return checkGuardrails(currentPrice, recommended.basePrice, recommended.cost, recommended.msp, activeGuardrails);
  }, [recommended, currentPrice, guardrails]);

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        borderColor: belowMSP ? 'warning.main' : undefined,
        borderWidth: belowMSP ? 2 : 1,
      }}
    >
      <CardContent sx={{ pb: '16px !important' }}>
        {/* Header row */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Line {index + 1}
            </Typography>
            {line.lineType === 'white_label' && (
              <Chip label="White Label" size="small" sx={{ fontSize: '0.6rem', fontWeight: 600, bgcolor: '#EDE9FE', color: '#7C3AED' }} />
            )}
            {line.lineType === 'formulation' && (
              <Chip label="Formulation" size="small" sx={{ fontSize: '0.6rem', fontWeight: 600, bgcolor: '#ECFEFF', color: '#0891B2' }} />
            )}
          </Box>
          <IconButton size="small" color="error" onClick={() => onRemove(line.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Product picker + basic fields */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            {line.lineType === 'white_label' ? (
              <Autocomplete
                size="small"
                options={wlProducts}
                value={wlProducts.find((w) => w.id === line.whiteLabelId) || null}
                onChange={(_, newValue) => {
                  onUpdate(line.id, 'whiteLabelId', newValue?.id || '');
                  if (newValue) onUpdate(line.id, 'productId', '');
                }}
                getOptionLabel={(option) => {
                  const brand = wlBrands.find((b) => b.id === option.brandId);
                  return `${brand?.name || ''} ${option.name} (${option.code})`;
                }}
                renderInput={(params) => (
                  <TextField {...params} label="White Label Product" placeholder="Search white label products..." />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            ) : line.lineType === 'formulation' ? (
              <Autocomplete
                size="small"
                options={formulations}
                value={formulations.find((f) => f.id === line.formulationId) || null}
                onChange={(_, newValue) => {
                  onUpdate(line.id, 'formulationId', newValue?.id || '');
                  if (newValue) onUpdate(line.id, 'productId', '');
                }}
                getOptionLabel={(option) => `${option.name} (${option.code})`}
                renderInput={(params) => (
                  <TextField {...params} label="Formulation" placeholder="Search formulations..." />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            ) : (
              <Autocomplete
                size="small"
                options={products}
                value={selectedProduct}
                onChange={(_, newValue) => onUpdateProduct(line.id, newValue)}
                getOptionLabel={(option) => {
                  const legacy = option.legacyName ? ` (${option.legacyName})` : '';
                  return `${option.name}${legacy} - ${option.code}`;
                }}
                filterOptions={(options, { inputValue }) => {
                  const lower = inputValue.toLowerCase();
                  return options.filter(
                    (o) =>
                      o.name.toLowerCase().includes(lower) ||
                      o.legacyName.toLowerCase().includes(lower) ||
                      o.code.toLowerCase().includes(lower)
                  );
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Product" placeholder="Search by name, legacy name, or code..." />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            )}
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="Quantity"
              type="number"
              value={line.quantity}
              onChange={(e) => onUpdate(line.id, 'quantity', e.target.value)}
              placeholder="Optional"
              error={missingQty}
              helperText={missingQty ? 'Add volume/quantity when below MSP' : undefined}
              inputProps={{ min: 0, step: 'any' }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 2 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Unit"
              value={line.unit}
              onChange={(e) => onUpdate(line.id, 'unit', e.target.value)}
            >
              {UNITS.map((u) => (
                <MenuItem key={u} value={u}>
                  {u}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="Price per Unit"
              type="number"
              value={line.pricePerUnit}
              onChange={(e) => onUpdate(line.id, 'pricePerUnit', e.target.value)}
              inputProps={{ min: 0, step: 'any' }}
              required
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            {/* MSP + Margin Display */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', height: '100%', pt: 0.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  MSP
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {mspPrice !== null
                    ? mspPrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : '\u2014'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Margin
                </Typography>
                {margin !== null ? (
                  <Typography
                    variant="body2"
                    fontWeight={500}
                    sx={{ color: margin.pct >= 0 ? 'success.main' : 'error.main' }}
                  >
                    {margin.abs >= 0 ? '+' : ''}
                    {margin.abs.toFixed(2)} ({margin.pct.toFixed(1)}%)
                  </Typography>
                ) : (
                  <Typography variant="body2">{'\u2014'}</Typography>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Recommended Price from Price Book */}
        {recommended && recommended.finalPrice > 0 && (
          <Box
            sx={{
              mt: 1.5,
              p: 1.5,
              bgcolor: isUsingRecommended ? '#F0FDF4' : '#F8FAFC',
              borderRadius: 1,
              border: '1px solid',
              borderColor: isUsingRecommended ? '#BBF7D0' : '#E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoFixHighIcon sx={{ fontSize: 16, color: isUsingRecommended ? '#059669' : '#6366F1' }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Price Book Recommended
                </Typography>
                <Typography variant="body2" fontWeight={700} color={isUsingRecommended ? 'success.main' : 'primary'}>
                  ${recommended.finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}/{line.unit}
                </Typography>
              </Box>
              {recommended.hasOverride && (
                <Chip label="Customer Override" size="small" sx={{ height: 18, fontSize: 10, fontWeight: 600, bgcolor: '#DBEAFE', color: '#1D4ED8' }} />
              )}
              {recommended.adjustments.length > 0 && !recommended.hasOverride && (
                <Tooltip
                  title={
                    <Box>
                      <Typography variant="caption">Base: ${recommended.basePrice.toLocaleString()}/MT</Typography>
                      {recommended.adjustments.map((adj, j) => (
                        <Typography key={j} variant="caption" display="block">
                          {adj.ruleName}: {adj.impact > 0 ? '+' : ''}{adj.adjustmentType === 'percentage' ? `${adj.adjustmentValue}%` : `$${adj.impact}`}
                        </Typography>
                      ))}
                    </Box>
                  }
                >
                  <Chip
                    label={`${recommended.adjustments.length} rule${recommended.adjustments.length > 1 ? 's' : ''} applied`}
                    size="small"
                    sx={{ height: 18, fontSize: 10, fontWeight: 500, bgcolor: '#F1F5F9', color: '#64748B' }}
                  />
                </Tooltip>
              )}
            </Box>
            {isUsingRecommended ? (
              <Chip label="Using recommended" size="small" color="success" sx={{ height: 22, fontSize: 11, fontWeight: 600 }} />
            ) : (
              <Button
                size="small"
                variant="outlined"
                color="primary"
                sx={{ fontSize: 11, px: 1.5, py: 0.25, minHeight: 0 }}
                onClick={() => onApplyPrice(line.id, recommended.finalPrice)}
              >
                Use Price
              </Button>
            )}
          </Box>
        )}

        {/* Guardrail Violations */}
        {priceViolations.length > 0 && (
          <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {priceViolations.map((v, j) => (
              <Alert
                key={j}
                severity={v.action === 'block' ? 'error' : 'warning'}
                icon={v.action === 'block' ? <BlockIcon fontSize="small" /> : v.action === 'require_approval' ? <GppMaybeIcon fontSize="small" /> : <WarningAmberIcon fontSize="small" />}
                sx={{ py: 0, '& .MuiAlert-message': { fontSize: 12 } }}
              >
                <strong>{v.guardrailName}</strong>
                {v.action === 'block' && ' — Blocked'}
                {v.action === 'require_approval' && ' — Requires Approval'}
                {' '}({v.actualValue.toFixed(1)}% vs {v.threshold}% threshold)
              </Alert>
            ))}
          </Box>
        )}

        {/* Below MSP Warning and Fields */}
        {belowMSP && (
          <Box sx={{ mt: 2 }}>
            <Alert
              severity="warning"
              icon={<WarningAmberIcon fontSize="small" />}
              sx={{ mb: 1.5 }}
            >
              Price is below MSP. A reason is required.
            </Alert>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Below MSP Reason"
                  value={line.belowMSPReason}
                  onChange={(e) => onUpdate(line.id, 'belowMSPReason', e.target.value)}
                  required
                >
                  <MenuItem value="" disabled>
                    Select a reason...
                  </MenuItem>
                  {BELOW_MSP_REASONS.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Additional Note"
                  value={line.belowMSPNote}
                  onChange={(e) => onUpdate(line.id, 'belowMSPNote', e.target.value)}
                  placeholder="Explain the reason..."
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
