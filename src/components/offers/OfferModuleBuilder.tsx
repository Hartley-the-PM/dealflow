'use client';

import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
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
import MenuItem from '@mui/material/MenuItem';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PreviewIcon from '@mui/icons-material/Preview';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import HeroModuleEditor from './modules/HeroModuleEditor';
import ProductLinesModuleEditor from './modules/ProductLinesModuleEditor';
import TermsModuleEditor from './modules/TermsModuleEditor';
import CustomTextModuleEditor from './modules/CustomTextModuleEditor';
import ProductShowcaseEditor from './modules/ProductShowcaseEditor';
import CompanyAboutEditor from './modules/CompanyAboutEditor';
import TestimonialsEditor from './modules/TestimonialsEditor';
import ModuleRenderer from './modules/ModuleRenderer';
import { useOfferTemplateStore } from '@/stores/offerTemplateStore';
import type { OfferModule, OfferModuleType } from '@/types/offerBuilder';
import type { OfferLine } from '@/types/offer';
import { v4 as uuidv4 } from 'uuid';

interface OfferModuleBuilderProps {
  modules: OfferModule[];
  onChange: (modules: OfferModule[]) => void;
  offerLines?: OfferLine[];
  products?: Array<{ id: string; name: string; code: string }>;
}

const MODULE_TYPE_LABELS: Record<OfferModuleType, string> = {
  hero: 'Hero / Cover',
  product_lines: 'Product Lines Table',
  terms: 'Terms & Conditions',
  custom_text: 'Custom Text',
  product_showcase: 'Product Showcase',
  company_about: 'Company About',
  testimonials: 'Testimonials',
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
      return { type, id, visible: true, mission: '', certifications: [], differentiators: [] };
    case 'testimonials':
      return { type, id, visible: true, testimonials: [] };
  }
}

export default function OfferModuleBuilder({ modules, onChange, offerLines, products }: OfferModuleBuilderProps) {
  const [expandedId, setExpandedId] = useState<string | null>(modules[0]?.id ?? null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [addMenuAnchor, setAddMenuAnchor] = useState<HTMLElement | null>(null);

  const addTemplate = useOfferTemplateStore((s) => s.addTemplate);

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
    },
    [modules, onChange]
  );

  const addModule = useCallback(
    (type: OfferModuleType) => {
      onChange([...modules, createDefaultModule(type)]);
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

  const renderEditor = (mod: OfferModule) => {
    switch (mod.type) {
      case 'hero':
        return <HeroModuleEditor module={mod} onChange={updateModule} />;
      case 'product_lines':
        return <ProductLinesModuleEditor module={mod} onChange={updateModule} />;
      case 'terms':
        return <TermsModuleEditor module={mod} onChange={updateModule} />;
      case 'custom_text':
        return <CustomTextModuleEditor module={mod} onChange={updateModule} />;
      case 'product_showcase':
        return <ProductShowcaseEditor module={mod} onChange={updateModule} />;
      case 'company_about':
        return <CompanyAboutEditor module={mod} onChange={updateModule} />;
      case 'testimonials':
        return <TestimonialsEditor module={mod} onChange={updateModule} />;
      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={(e) => setAddMenuAnchor(e.currentTarget)}
        >
          Add Module
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<PreviewIcon />}
          onClick={() => setPreviewOpen(true)}
        >
          Preview
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<SaveIcon />}
          onClick={() => setSaveTemplateOpen(true)}
        >
          Save as Template
        </Button>
        <Chip label={`${modules.length} modules`} size="small" variant="outlined" />
      </Box>

      {/* Module List */}
      {modules.map((mod, index) => {
        const isExpanded = expandedId === mod.id;
        return (
          <Card
            key={mod.id}
            variant="outlined"
            sx={{
              mb: 1,
              opacity: mod.visible ? 1 : 0.5,
              borderColor: isExpanded ? 'primary.main' : undefined,
            }}
          >
            <CardContent sx={{ pb: isExpanded ? undefined : '12px !important' }}>
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <DragIndicatorIcon sx={{ color: 'text.disabled', fontSize: 20, cursor: 'grab' }} />
                <Typography
                  variant="subtitle2"
                  sx={{ flex: 1, cursor: 'pointer' }}
                  onClick={() => setExpandedId(isExpanded ? null : mod.id)}
                >
                  {MODULE_TYPE_LABELS[mod.type]}
                </Typography>
                <Tooltip title="Move up">
                  <span>
                    <IconButton size="small" disabled={index === 0} onClick={() => moveModule(mod.id, 'up')}>
                      <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Move down">
                  <span>
                    <IconButton size="small" disabled={index === modules.length - 1} onClick={() => moveModule(mod.id, 'down')}>
                      <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={mod.visible ? 'Hide' : 'Show'}>
                  <IconButton size="small" onClick={() => toggleVisibility(mod.id)}>
                    {mod.visible ? <VisibilityIcon sx={{ fontSize: 16 }} /> : <VisibilityOffIcon sx={{ fontSize: 16 }} />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Remove">
                  <IconButton size="small" color="error" onClick={() => removeModule(mod.id)}>
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <IconButton size="small" onClick={() => setExpandedId(isExpanded ? null : mod.id)}>
                  {isExpanded ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
                </IconButton>
              </Box>

              {/* Editor */}
              <Collapse in={isExpanded}>
                <Divider sx={{ my: 1.5 }} />
                {renderEditor(mod)}
              </Collapse>
            </CardContent>
          </Card>
        );
      })}

      {modules.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">No modules. Click &quot;Add Module&quot; to start building.</Typography>
        </Box>
      )}

      {/* Add Module Menu */}
      <Menu anchorEl={addMenuAnchor} open={Boolean(addMenuAnchor)} onClose={() => setAddMenuAnchor(null)}>
        {(Object.keys(MODULE_TYPE_LABELS) as OfferModuleType[]).map((type) => (
          <MenuItem key={type} onClick={() => addModule(type)}>
            {MODULE_TYPE_LABELS[type]}
          </MenuItem>
        ))}
      </Menu>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Buyer View Preview</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            {modules
              .filter((m) => m.visible)
              .map((mod) => (
                <Box key={mod.id}>
                  <ModuleRenderer module={mod} offerLines={offerLines} products={products} />
                  <Divider sx={{ my: 1 }} />
                </Box>
              ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

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
    </Box>
  );
}
