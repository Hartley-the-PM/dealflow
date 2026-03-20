'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PaletteIcon from '@mui/icons-material/Palette';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import StarIcon from '@mui/icons-material/Star';
import TableChartIcon from '@mui/icons-material/TableChart';
import GavelIcon from '@mui/icons-material/Gavel';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import BusinessIcon from '@mui/icons-material/Business';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import PanoramaIcon from '@mui/icons-material/Panorama';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import ImageIcon from '@mui/icons-material/Image';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import VerifiedIcon from '@mui/icons-material/Verified';
import ScienceIcon from '@mui/icons-material/Science';
import HeroModuleEditor from './modules/HeroModuleEditor';
import ProductLinesModuleEditor from './modules/ProductLinesModuleEditor';
import TermsModuleEditor from './modules/TermsModuleEditor';
import CustomTextModuleEditor from './modules/CustomTextModuleEditor';
import ProductShowcaseEditor from './modules/ProductShowcaseEditor';
import CompanyAboutEditor from './modules/CompanyAboutEditor';
import TestimonialsEditor from './modules/TestimonialsEditor';
import CoverImageModuleEditor from './modules/CoverImageModuleEditor';
import DividerModuleEditor from './modules/DividerModuleEditor';
import ImageModuleEditor from './modules/ImageModuleEditor';
import ProductsModuleEditor from './modules/ProductsModuleEditor';
import CertificationsModuleEditor from './modules/CertificationsModuleEditor';
import FormulationModuleEditor from './modules/FormulationModuleEditor';
import type { PricingContext } from './modules/ProductsModuleEditor';
import ModuleRenderer from './modules/ModuleRenderer';
import BrandedHeader from './modules/BrandedHeader';
import { useOfferTemplateStore } from '@/stores/offerTemplateStore';
import { useOfferBuilderSettingsStore } from '@/stores/offerBuilderSettingsStore';
import type { OfferModule, OfferModuleType, BrandProfile } from '@/types/offerBuilder';
import type { OfferLine } from '@/types/offer';
import type { ContentPreset } from '@/types/offerBuilder';
import { v4 as uuidv4 } from 'uuid';

interface OfferModuleBuilderProps {
  modules: OfferModule[];
  onChange: (modules: OfferModule[]) => void;
  offerLines?: OfferLine[];
  products?: Array<{ id: string; name: string; code: string }>;
  initialBrandProfileId?: string;
  pricingContext?: PricingContext;
}

// Labels shown in the "Add Module" menu (excludes deprecated types)
const MODULE_TYPE_LABELS: Record<string, string> = {
  hero: 'Hero / Cover',
  products: 'Products & Pricing',
  terms: 'Terms & Conditions',
  custom_text: 'Custom Text',
  company_about: 'Company About',
  certifications: 'Certifications',
  testimonials: 'Testimonials',
  cover_image: 'Cover Image',
  divider: 'Divider / Spacer',
  image: 'Image Block',
  formulation: 'Formulation',
};

// All labels including legacy types (for card display of existing modules)
const ALL_MODULE_TYPE_LABELS: Record<OfferModuleType, string> = {
  hero: 'Hero / Cover',
  product_lines: 'Product Lines Table',
  terms: 'Terms & Conditions',
  custom_text: 'Custom Text',
  product_showcase: 'Product Showcase',
  company_about: 'Company About',
  certifications: 'Certifications',
  testimonials: 'Testimonials',
  cover_image: 'Cover Image',
  divider: 'Divider / Spacer',
  image: 'Image Block',
  products: 'Products & Pricing',
  formulation: 'Formulation',
};

const MODULE_TYPE_ICONS: Record<OfferModuleType, React.ReactNode> = {
  hero: <StarIcon sx={{ fontSize: 18 }} />,
  product_lines: <TableChartIcon sx={{ fontSize: 18 }} />,
  terms: <GavelIcon sx={{ fontSize: 18 }} />,
  custom_text: <TextFieldsIcon sx={{ fontSize: 18 }} />,
  product_showcase: <ViewCarouselIcon sx={{ fontSize: 18 }} />,
  company_about: <BusinessIcon sx={{ fontSize: 18 }} />,
  certifications: <VerifiedIcon sx={{ fontSize: 18 }} />,
  testimonials: <FormatQuoteIcon sx={{ fontSize: 18 }} />,
  cover_image: <PanoramaIcon sx={{ fontSize: 18 }} />,
  divider: <HorizontalRuleIcon sx={{ fontSize: 18 }} />,
  image: <ImageIcon sx={{ fontSize: 18 }} />,
  products: <Inventory2Icon sx={{ fontSize: 18 }} />,
  formulation: <ScienceIcon sx={{ fontSize: 18 }} />,
};

function createDefaultModule(type: OfferModuleType): OfferModule {
  const id = uuidv4();
  switch (type) {
    case 'hero':
      return { type, id, visible: true, title: '', customerName: '', date: '', intro: '', logoUrl: '' };
    case 'product_lines':
      return { type, id, visible: true, showQuantity: true, showUnit: true, showUnitPrice: true, showTotal: true, showMSP: false };
    case 'terms':
      return { type, id, visible: true, paymentTerms: '', incoterms: '', validity: '', delivery: '', legalNotes: '' };
    case 'custom_text':
      return { type, id, visible: true, heading: '', body: '' };
    case 'product_showcase':
      return { type, id, visible: true, products: [] };
    case 'company_about':
      return { type, id, visible: true, mission: '', vision: '', values: [], certifications: [], differentiators: [] };
    case 'certifications':
      return { type, id, visible: true, title: 'Certifications & Compliance', certifications: [] };
    case 'testimonials':
      return { type, id, visible: true, testimonials: [] };
    case 'cover_image':
      return { type, id, visible: true, backgroundImageUrl: '', title: '', subtitle: '', overlayOpacity: 0.5, overlayColor: '#000000' };
    case 'divider':
      return { type, id, visible: true, style: 'line', height: 32 };
    case 'image':
      return { type, id, visible: true, imageUrl: '', caption: '', alt: '', width: 'full', alignment: 'center' };
    case 'products':
      return { type, id, visible: true, showQuantity: true, showUnit: true, showUnitPrice: true, showTotal: true, entries: [] };
    case 'formulation':
      return { type, id, visible: true, formulationId: '', title: 'Formulation', showPercentages: true, showRecycledContent: true, showTds: true };
  }
}

export default function OfferModuleBuilder({ modules, onChange, offerLines, products, pricingContext, initialBrandProfileId }: OfferModuleBuilderProps) {
  const [expandedId, setExpandedId] = useState<string | null>(modules[0]?.id ?? null);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [addMenuAnchor, setAddMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedBrandProfileId, setSelectedBrandProfileId] = useState<string>(initialBrandProfileId || '');
  const [themeOpen, setThemeOpen] = useState(false);
  const [fullscreenPreview, setFullscreenPreview] = useState(false);

  // Sync brand profile when template changes
  useEffect(() => {
    if (initialBrandProfileId) setSelectedBrandProfileId(initialBrandProfileId);
  }, [initialBrandProfileId]);

  const previewRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const previewScrollRef = useRef<HTMLDivElement | null>(null);

  const addTemplate = useOfferTemplateStore((s) => s.addTemplate);
  const brandProfiles = useOfferBuilderSettingsStore((s) => s.brandProfiles);
  const updateBrandProfile = useOfferBuilderSettingsStore((s) => s.updateBrandProfile);
  const contentPresets = useOfferBuilderSettingsStore((s) => s.contentPresets);

  const selectedBrandProfile: BrandProfile | undefined = brandProfiles.find((p) => p.id === selectedBrandProfileId);

  // Helper to get presets for a module type
  const getPresetsForType = (moduleType: string): ContentPreset[] => {
    const presetTypeMap: Record<string, string> = {
      terms: 'terms',
      testimonials: 'testimonials',
      cover_image: 'cover_image',
      company_about: 'company_about',
    };
    const presetType = presetTypeMap[moduleType];
    if (!presetType) return [];
    return contentPresets.filter((p) => p.type === presetType);
  };

  // Scroll preview into view when a module is expanded
  useEffect(() => {
    if (expandedId && previewRefs.current[expandedId] && previewScrollRef.current) {
      const el = previewRefs.current[expandedId];
      const container = previewScrollRef.current;
      if (el && container) {
        const elRect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const scrollTop = container.scrollTop + elRect.top - containerRect.top - 20;
        container.scrollTo({ top: scrollTop, behavior: 'smooth' });
      }
    }
  }, [expandedId]);

  const updateModule = useCallback(
    (updated: OfferModule) => {
      onChange(modules.map((m) => (m.id === updated.id ? updated : m)));
    },
    [modules, onChange]
  );

  const toggleVisibility = useCallback(
    (id: string) => {
      onChange(modules.map((m) => (m.id === id ? { ...m, visible: !m.visible } : m)));
    },
    [modules, onChange]
  );

  const moveModule = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const index = modules.findIndex((m) => m.id === id);
      if (index === -1) return;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= modules.length) return;
      const newModules = [...modules];
      [newModules[index], newModules[newIndex]] = [newModules[newIndex], newModules[index]];
      onChange(newModules);
    },
    [modules, onChange]
  );

  const removeModule = useCallback(
    (id: string) => {
      onChange(modules.filter((m) => m.id !== id));
      if (expandedId === id) setExpandedId(null);
    },
    [modules, onChange, expandedId]
  );

  const addModule = useCallback(
    (type: OfferModuleType) => {
      const newMod = createDefaultModule(type);
      onChange([...modules, newMod]);
      setExpandedId(newMod.id);
      setAddMenuAnchor(null);
    },
    [modules, onChange]
  );

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    addTemplate({
      id: uuidv4(),
      name: templateName.trim(),
      description: templateDesc.trim(),
      modules: modules.map((m) => ({ ...m, id: uuidv4() })),
      isPreset: false,
      createdAt: new Date().toISOString(),
    });
    setTemplateName('');
    setTemplateDesc('');
    setSaveTemplateOpen(false);
  };

  // Load saved content block into a module
  const loadBlockIntoModule = (mod: OfferModule, blockId: string) => {
    const block = contentPresets.find((p) => p.id === blockId);
    if (!block) return;
    const updated = { ...mod, ...block.data, id: mod.id, type: mod.type, visible: mod.visible };
    updateModule(updated as OfferModule);
  };

  const renderEditor = (mod: OfferModule) => {
    const presets = getPresetsForType(mod.type);
    // Get matching content blocks for this module type
    const matchingBlocks = contentPresets.filter((p) => p.type === mod.type);

    const blockSelector = matchingBlocks.length > 0 ? (
      <Box sx={{ mb: 1.5 }}>
        <TextField
          select size="small" label="Load from saved block" value=""
          onChange={(e) => loadBlockIntoModule(mod, e.target.value)}
          sx={{ minWidth: 200, '& .MuiInputBase-root': { fontSize: '0.8rem' } }}
          fullWidth
        >
          {matchingBlocks.map((b) => (
            <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
          ))}
        </TextField>
      </Box>
    ) : null;

    const editor = (() => { switch (mod.type) {
      case 'hero':
        return <HeroModuleEditor module={mod} onChange={updateModule} />;
      case 'product_lines':
        return <ProductLinesModuleEditor module={mod} onChange={updateModule} />;
      case 'terms':
        return <TermsModuleEditor module={mod} onChange={updateModule} presets={presets} />;
      case 'custom_text':
        return <CustomTextModuleEditor module={mod} onChange={updateModule} />;
      case 'product_showcase':
        return <ProductShowcaseEditor module={mod} onChange={updateModule} />;
      case 'company_about':
        return <CompanyAboutEditor module={mod} onChange={updateModule} presets={presets} />;
      case 'certifications':
        return <CertificationsModuleEditor module={mod} onChange={updateModule} />;
      case 'testimonials':
        return <TestimonialsEditor module={mod} onChange={updateModule} presets={presets} />;
      case 'cover_image':
        return <CoverImageModuleEditor module={mod} onChange={updateModule} presets={presets} />;
      case 'divider':
        return <DividerModuleEditor module={mod} onChange={updateModule} />;
      case 'image':
        return <ImageModuleEditor module={mod} onChange={updateModule} />;
      case 'products':
        return <ProductsModuleEditor module={mod} onChange={updateModule} pricingContext={pricingContext} />;
      case 'formulation':
        return <FormulationModuleEditor module={mod} onChange={updateModule} />;
      default:
        return null;
    } })();

    return (
      <Box>
        {blockSelector}
        {editor}
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 200px)', minHeight: 500 }}>
      {/* LEFT PANEL - Editor */}
      <Box
        sx={{
          width: '45%',
          minWidth: 320,
          overflowY: 'auto',
          bgcolor: '#FAFBFC',
          borderRight: '1px solid #E5E7EB',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Compact Toolbar */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            p: 1.5,
            borderBottom: '1px solid #E5E7EB',
            bgcolor: '#FFFFFF',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={(e) => setAddMenuAnchor(e.currentTarget)}
            sx={{ textTransform: 'none', fontSize: '0.8rem' }}
          >
            Add Module
          </Button>
          {brandProfiles.length > 0 && (
            <TextField
              select
              size="small"
              label="Brand"
              value={selectedBrandProfileId}
              onChange={(e) => setSelectedBrandProfileId(e.target.value)}
              sx={{ minWidth: 140, ml: 'auto' }}
            >
              <MenuItem value="">None</MenuItem>
              {brandProfiles.map((bp) => (
                <MenuItem key={bp.id} value={bp.id}>{bp.name}</MenuItem>
              ))}
            </TextField>
          )}
          <Button
            size="small"
            variant={themeOpen ? 'contained' : 'outlined'}
            color={themeOpen ? 'primary' : 'inherit'}
            startIcon={<PaletteIcon />}
            onClick={() => setThemeOpen(!themeOpen)}
            sx={{ textTransform: 'none', fontSize: '0.8rem', ml: brandProfiles.length > 0 ? 0 : 'auto' }}
          >
            Theme
          </Button>
          <Chip label={`${modules.length} modules`} size="small" variant="outlined" />
        </Box>

        {/* Theme Panel */}
        <Collapse in={themeOpen}>
          <Box sx={{ p: 1.5, borderBottom: '1px solid #E5E7EB', bgcolor: '#FAFBFC' }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.65rem', mb: 1.5, display: 'block' }}>
              Brand & Theme
            </Typography>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12 }}>
                {brandProfiles.length > 0 ? (
                  <TextField
                    select
                    size="small"
                    fullWidth
                    label="Brand Profile"
                    value={selectedBrandProfileId}
                    onChange={(e) => setSelectedBrandProfileId(e.target.value)}
                  >
                    <MenuItem value="">None (default)</MenuItem>
                    {brandProfiles.map((bp) => (
                      <MenuItem key={bp.id} value={bp.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: bp.primaryColor, border: '1px solid #E5E7EB' }} />
                          {bp.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    No brand profiles configured. Go to Settings &rarr; Offer Builder to create one.
                  </Typography>
                )}
              </Grid>
              {selectedBrandProfile && (
                <>
                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <input
                        type="color"
                        value={selectedBrandProfile.primaryColor}
                        onChange={(e) => updateBrandProfile(selectedBrandProfile.id, { primaryColor: e.target.value })}
                        style={{ width: 28, height: 28, border: '1px solid #E5E7EB', borderRadius: 4, cursor: 'pointer', padding: 0, flexShrink: 0 }}
                      />
                      <TextField
                        size="small"
                        label="Primary"
                        value={selectedBrandProfile.primaryColor}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (!val.startsWith('#')) val = '#' + val;
                          if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) updateBrandProfile(selectedBrandProfile.id, { primaryColor: val });
                        }}
                        inputProps={{ maxLength: 7 }}
                        sx={{ flex: 1, '& .MuiInputBase-root': { fontSize: '0.75rem' } }}
                      />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <input
                        type="color"
                        value={selectedBrandProfile.accentColor}
                        onChange={(e) => updateBrandProfile(selectedBrandProfile.id, { accentColor: e.target.value })}
                        style={{ width: 28, height: 28, border: '1px solid #E5E7EB', borderRadius: 4, cursor: 'pointer', padding: 0, flexShrink: 0 }}
                      />
                      <TextField
                        size="small"
                        label="Accent"
                        value={selectedBrandProfile.accentColor}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (!val.startsWith('#')) val = '#' + val;
                          if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) updateBrandProfile(selectedBrandProfile.id, { accentColor: val });
                        }}
                        inputProps={{ maxLength: 7 }}
                        sx={{ flex: 1, '& .MuiInputBase-root': { fontSize: '0.75rem' } }}
                      />
                    </Box>
                  </Grid>
                  {selectedBrandProfile.logoUrl && (
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <img src={selectedBrandProfile.logoUrl} alt="Logo" style={{ height: 24, objectFit: 'contain' }} />
                        <Typography variant="caption" color="text.secondary">{selectedBrandProfile.companyName}</Typography>
                      </Box>
                    </Grid>
                  )}
                </>
              )}
            </Grid>
          </Box>
        </Collapse>

        {/* Module Cards */}
        <Box sx={{ p: 1.5, flex: 1, overflowY: 'auto' }}>
          {modules.map((mod, index) => {
            const isExpanded = expandedId === mod.id;
            return (
              <Collapse key={mod.id} in={true} appear>
                <Card
                  variant="outlined"
                  sx={{
                    mb: 1,
                    opacity: mod.visible ? 1 : 0.5,
                    borderColor: isExpanded ? 'primary.main' : '#E5E7EB',
                    borderWidth: isExpanded ? 2 : 1,
                    transition: 'all 0.2s ease',
                    '&:hover': { borderColor: isExpanded ? 'primary.main' : '#D1D5DB' },
                  }}
                >
                  <CardContent sx={{ p: '10px !important' }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <DragIndicatorIcon sx={{ color: 'text.disabled', fontSize: 18, cursor: 'grab' }} />
                      <Box sx={{ color: isExpanded ? 'primary.main' : 'text.secondary', display: 'flex', alignItems: 'center' }}>
                        {MODULE_TYPE_ICONS[mod.type]}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ flex: 1, cursor: 'pointer', fontWeight: isExpanded ? 600 : 500, fontSize: '0.82rem' }}
                        onClick={() => setExpandedId(isExpanded ? null : mod.id)}
                      >
                        {ALL_MODULE_TYPE_LABELS[mod.type]}
                      </Typography>
                      <Tooltip title="Move up">
                        <span>
                          <IconButton size="small" disabled={index === 0} onClick={() => moveModule(mod.id, 'up')} sx={{ p: 0.25 }}>
                            <ArrowUpwardIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Move down">
                        <span>
                          <IconButton size="small" disabled={index === modules.length - 1} onClick={() => moveModule(mod.id, 'down')} sx={{ p: 0.25 }}>
                            <ArrowDownwardIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={mod.visible ? 'Hide' : 'Show'}>
                        <IconButton size="small" onClick={() => toggleVisibility(mod.id)} sx={{ p: 0.25 }}>
                          {mod.visible ? <VisibilityIcon sx={{ fontSize: 15 }} /> : <VisibilityOffIcon sx={{ fontSize: 15 }} />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove">
                        <IconButton size="small" color="error" onClick={() => removeModule(mod.id)} sx={{ p: 0.25 }}>
                          <DeleteIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                      <IconButton size="small" onClick={() => setExpandedId(isExpanded ? null : mod.id)} sx={{ p: 0.25 }}>
                        {isExpanded ? <ExpandLessIcon sx={{ fontSize: 15 }} /> : <ExpandMoreIcon sx={{ fontSize: 15 }} />}
                      </IconButton>
                    </Box>

                    {/* Editor */}
                    <Collapse in={isExpanded}>
                      <Divider sx={{ my: 1 }} />
                      {renderEditor(mod)}
                    </Collapse>
                  </CardContent>
                </Card>
              </Collapse>
            );
          })}

          {modules.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <AddIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary" variant="body2">
                No modules yet. Click &quot;Add Module&quot; to start building.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* RIGHT PANEL - Live Preview */}
      <Box
        ref={previewScrollRef}
        sx={{
          width: '55%',
          overflowY: 'auto',
          bgcolor: '#F8FAFC',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Full-screen preview button */}
        <Box sx={{ width: '100%', maxWidth: 680, display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<FullscreenIcon />}
            onClick={() => setFullscreenPreview(true)}
            sx={{ textTransform: 'none', fontSize: '0.75rem', color: '#6B7280', borderColor: '#D1D5DB' }}
          >
            Full Preview
          </Button>
        </Box>
        <Box
          sx={{
            width: '100%',
            maxWidth: 680,
            bgcolor: '#FFFFFF',
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {modules.filter((m) => m.visible).length === 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
              <Typography color="text.secondary" variant="body2">
                Preview will appear here as you add visible modules
              </Typography>
            </Box>
          ) : (
            modules
              .filter((m) => m.visible)
              .map((mod) => (
                <Box
                  key={mod.id}
                  ref={(el: HTMLDivElement | null) => { previewRefs.current[mod.id] = el; }}
                  sx={{
                    transition: 'outline-color 0.2s ease',
                    outline: expandedId === mod.id ? '2px solid' : '2px solid transparent',
                    outlineColor: expandedId === mod.id ? 'primary.main' : 'transparent',
                    outlineOffset: -2,
                    borderRadius: 1,
                  }}
                >
                  <ModuleRenderer module={mod} offerLines={offerLines} products={products} brandProfile={selectedBrandProfile} />
                </Box>
              ))
          )}
        </Box>
      </Box>

      {/* Add Module Menu */}
      <Menu anchorEl={addMenuAnchor} open={Boolean(addMenuAnchor)} onClose={() => setAddMenuAnchor(null)}>
        {(Object.keys(MODULE_TYPE_LABELS) as OfferModuleType[]).map((type) => (
          <MenuItem key={type} onClick={() => addModule(type)} sx={{ gap: 1.5 }}>
            <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
              {MODULE_TYPE_ICONS[type]}
            </Box>
            {ALL_MODULE_TYPE_LABELS[type]}
          </MenuItem>
        ))}
      </Menu>

      {/* Save Template Dialog */}
      <Dialog open={saveTemplateOpen} onClose={() => setSaveTemplateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save as Template</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            autoFocus
            size="small"
            fullWidth
            label="Template Name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
          <TextField
            size="small"
            fullWidth
            label="Description"
            value={templateDesc}
            onChange={(e) => setTemplateDesc(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveTemplateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveTemplate} disabled={!templateName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Full-Screen Preview Dialog */}
      <Dialog
        open={fullscreenPreview}
        onClose={() => setFullscreenPreview(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid #E5E7EB' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Buyer Preview</Typography>
          <Button size="small" onClick={() => setFullscreenPreview(false)} sx={{ textTransform: 'none' }}>Close</Button>
        </DialogTitle>
        <DialogContent sx={{ flex: 1, overflowY: 'auto', bgcolor: '#F8FAFC', p: 0 }}>
          <Box sx={{ maxWidth: 780, mx: 'auto', py: 4, px: 2 }}>
            <Box
              sx={{
                bgcolor: '#FFFFFF',
                borderRadius: 3,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
                overflow: 'hidden',
              }}
            >
              {modules.filter((m) => m.visible).length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                  <Typography color="text.secondary" variant="body2">No visible modules to preview</Typography>
                </Box>
              ) : (
                modules
                  .filter((m) => m.visible)
                  .map((mod) => (
                    <ModuleRenderer key={mod.id} module={mod} offerLines={offerLines} products={products} brandProfile={selectedBrandProfile} />
                  ))
              )}
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
