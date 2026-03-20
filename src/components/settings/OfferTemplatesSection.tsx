'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import StarIcon from '@mui/icons-material/Star';
import GavelIcon from '@mui/icons-material/Gavel';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import BusinessIcon from '@mui/icons-material/Business';
import VerifiedIcon from '@mui/icons-material/Verified';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import PanoramaIcon from '@mui/icons-material/Panorama';
import ImageIcon from '@mui/icons-material/Image';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import { useOfferTemplateStore } from '@/stores/offerTemplateStore';
import { useOfferBuilderSettingsStore } from '@/stores/offerBuilderSettingsStore';
import type { OfferTemplate, TemplateSlot, OfferModuleType, ContentPresetType } from '@/types/offerBuilder';
import { v4 as uuidv4 } from 'uuid';

const MODULE_TYPE_CONFIG: Array<{ value: OfferModuleType; label: string; icon: React.ReactNode }> = [
  { value: 'hero', label: 'Hero / Cover', icon: <StarIcon sx={{ fontSize: 16 }} /> },
  { value: 'products', label: 'Products & Pricing', icon: <Inventory2Icon sx={{ fontSize: 16 }} /> },
  { value: 'terms', label: 'Terms & Conditions', icon: <GavelIcon sx={{ fontSize: 16 }} /> },
  { value: 'custom_text', label: 'Custom Text', icon: <TextFieldsIcon sx={{ fontSize: 16 }} /> },
  { value: 'company_about', label: 'Company About', icon: <BusinessIcon sx={{ fontSize: 16 }} /> },
  { value: 'certifications', label: 'Certifications', icon: <VerifiedIcon sx={{ fontSize: 16 }} /> },
  { value: 'testimonials', label: 'Testimonials', icon: <FormatQuoteIcon sx={{ fontSize: 16 }} /> },
  { value: 'cover_image', label: 'Cover Image', icon: <PanoramaIcon sx={{ fontSize: 16 }} /> },
  { value: 'divider', label: 'Divider / Spacer', icon: <HorizontalRuleIcon sx={{ fontSize: 16 }} /> },
  { value: 'image', label: 'Image Block', icon: <ImageIcon sx={{ fontSize: 16 }} /> },
];

const MODULE_ICON_MAP: Record<string, React.ReactNode> = Object.fromEntries(MODULE_TYPE_CONFIG.map((m) => [m.value, m.icon]));
const MODULE_LABEL_MAP: Record<string, string> = Object.fromEntries(MODULE_TYPE_CONFIG.map((m) => [m.value, m.label]));

export default function OfferTemplatesSection() {
  const templates = useOfferTemplateStore((s) => s.templates);
  const addTemplate = useOfferTemplateStore((s) => s.addTemplate);
  const updateTemplate = useOfferTemplateStore((s) => s.updateTemplate);
  const deleteTemplate = useOfferTemplateStore((s) => s.deleteTemplate);
  const brandProfiles = useOfferBuilderSettingsStore((s) => s.brandProfiles);
  const contentPresets = useOfferBuilderSettingsStore((s) => s.contentPresets);

  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [brandProfileId, setBrandProfileId] = useState('');
  const [slots, setSlots] = useState<TemplateSlot[]>([]);

  const startCreate = () => {
    setEditing(true);
    setEditingId(null);
    setName('');
    setDescription('');
    setBrandProfileId('');
    setSlots([
      { moduleType: 'hero', contentBlockId: null, contentBlockName: '' },
      { moduleType: 'products', contentBlockId: null, contentBlockName: '' },
      { moduleType: 'terms', contentBlockId: null, contentBlockName: '' },
    ]);
  };

  const startEdit = (template: OfferTemplate) => {
    setEditing(true);
    setEditingId(template.id);
    setName(template.name);
    setDescription(template.description);
    setBrandProfileId(template.brandProfileId || '');
    setSlots(template.slots || template.modules.map((m) => ({
      moduleType: m.type,
      contentBlockId: null,
      contentBlockName: '',
    })));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const templateData: OfferTemplate = {
      id: editingId || uuidv4(),
      name: name.trim(),
      description: description.trim(),
      modules: [], // modules will be built from slots at offer-creation time
      isPreset: false,
      createdAt: editingId ? (templates.find((t) => t.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      brandProfileId: brandProfileId || undefined,
      slots,
    };

    if (editingId) {
      updateTemplate(editingId, templateData);
    } else {
      addTemplate(templateData);
    }
    setEditing(false);
    setEditingId(null);
  };

  const addSlot = (moduleType: OfferModuleType) => {
    setSlots([...slots, { moduleType, contentBlockId: null, contentBlockName: '' }]);
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const moveSlot = (index: number, direction: 'up' | 'down') => {
    const newSlots = [...slots];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newSlots.length) return;
    [newSlots[index], newSlots[swapIdx]] = [newSlots[swapIdx], newSlots[index]];
    setSlots(newSlots);
  };

  const assignBlock = (slotIndex: number, blockId: string) => {
    const block = contentPresets.find((p) => p.id === blockId);
    setSlots(slots.map((s, i) =>
      i === slotIndex ? { ...s, contentBlockId: blockId || null, contentBlockName: block?.name || '' } : s
    ));
  };

  const getBlocksForType = (moduleType: string) => {
    // Map module types to content preset types (they're the same now)
    return contentPresets.filter((p) => p.type === moduleType);
  };

  const handleCancel = () => { setEditing(false); setEditingId(null); };
  const selectedBrand = brandProfiles.find((b) => b.id === brandProfileId);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Offer Templates</Typography>
          <Typography variant="body2" color="text.secondary">Pre-built templates that combine brand + content blocks</Typography>
        </Box>
        <Button size="small" startIcon={<AddIcon />} onClick={startCreate} disabled={editing}>New Template</Button>
      </Box>

      {editing && (
        <Card variant="outlined" sx={{ mb: 3, borderColor: 'primary.main' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Typography variant="subtitle2" color="text.secondary">{editingId ? 'Edit Template' : 'New Offer Template'}</Typography>

            {/* Name + Brand */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField size="small" label="Template Name" value={name} onChange={(e) => setName(e.target.value)} sx={{ flex: 1 }} placeholder="e.g. Standard Proposal" />
              <TextField select size="small" label="Brand Profile" value={brandProfileId} onChange={(e) => setBrandProfileId(e.target.value)} sx={{ minWidth: 200 }}>
                <MenuItem value="">None</MenuItem>
                {brandProfiles.map((bp) => (
                  <MenuItem key={bp.id} value={bp.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: bp.primaryColor, border: '1px solid #E5E7EB' }} />
                      {bp.name}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <TextField size="small" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this template for?" fullWidth />

            {/* Brand preview */}
            {selectedBrand && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5, border: '1px solid #E5E7EB' }}>
                {selectedBrand.logoUrl && <img src={selectedBrand.logoUrl} alt="" style={{ height: 24, objectFit: 'contain' }} />}
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedBrand.companyName}</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
                  <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: selectedBrand.primaryColor, border: '1px solid #E5E7EB' }} />
                  <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: selectedBrand.accentColor, border: '1px solid #E5E7EB' }} />
                </Box>
              </Box>
            )}

            {/* Module Slots */}
            <Box>
              <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.6rem', mb: 1, display: 'block' }}>
                Modules (in order)
              </Typography>

              {slots.map((slot, index) => {
                const availableBlocks = getBlocksForType(slot.moduleType);
                return (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1, py: 1,
                      borderBottom: index < slots.length - 1 ? '1px solid #F3F4F6' : undefined,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#9CA3AF', minWidth: 16 }}>{index + 1}</Typography>
                    <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                      {MODULE_ICON_MAP[slot.moduleType]}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem', minWidth: 120 }}>
                      {MODULE_LABEL_MAP[slot.moduleType]}
                    </Typography>

                    {availableBlocks.length > 0 ? (
                      <TextField
                        select size="small"
                        label="Content block"
                        value={slot.contentBlockId || ''}
                        onChange={(e) => assignBlock(index, e.target.value)}
                        sx={{ flex: 1, '& .MuiInputBase-root': { fontSize: '0.8rem' } }}
                      >
                        <MenuItem value="">
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>None (user fills)</Typography>
                        </MenuItem>
                        {availableBlocks.map((b) => (
                          <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      <Typography variant="caption" color="text.disabled" sx={{ flex: 1, fontSize: '0.75rem' }}>
                        {slot.moduleType === 'products' || slot.moduleType === 'divider' ? 'User fills' : 'No saved blocks for this type'}
                      </Typography>
                    )}

                    <IconButton size="small" disabled={index === 0} onClick={() => moveSlot(index, 'up')} sx={{ p: 0.25 }}>
                      <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                    <IconButton size="small" disabled={index === slots.length - 1} onClick={() => moveSlot(index, 'down')} sx={{ p: 0.25 }}>
                      <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => removeSlot(index)} sx={{ p: 0.25 }}>
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                );
              })}

              {/* Add module slot */}
              <Box sx={{ mt: 1.5 }}>
                <TextField
                  select size="small" label="+ Add module" value=""
                  onChange={(e) => addSlot(e.target.value as OfferModuleType)}
                  sx={{ minWidth: 200, '& .MuiInputBase-root': { fontSize: '0.8rem' } }}
                >
                  {MODULE_TYPE_CONFIG.map((m) => (
                    <MenuItem key={m.value} value={m.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{m.icon} {m.label}</Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button size="small" onClick={handleCancel} startIcon={<CloseIcon />}>Cancel</Button>
              <Button size="small" variant="contained" onClick={handleSave} startIcon={<SaveIcon />} disabled={!name.trim() || slots.length === 0}>Save Template</Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Existing templates */}
      {templates.map((template) => {
        const brand = brandProfiles.find((b) => b.id === template.brandProfileId);
        const slotCount = template.slots?.length || template.modules.length;
        return (
          <Card key={template.id} variant="outlined" sx={{ mb: 1 }}>
            <CardContent sx={{ py: '10px !important', display: 'flex', alignItems: 'center', gap: 2 }}>
              {brand && brand.logoUrl ? (
                <img src={brand.logoUrl} alt="" style={{ height: 24, objectFit: 'contain' }} />
              ) : (
                <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <StarIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />
                </Box>
              )}
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{template.name}</Typography>
                  {template.isPreset && <Chip label="Preset" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#DBEAFE', color: '#1D4ED8' }} />}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {slotCount} modules{brand ? ` · ${brand.name}` : ''}{template.description ? ` · ${template.description}` : ''}
                </Typography>
              </Box>
              {/* Show module type chips */}
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {(template.slots || template.modules.map((m) => ({ moduleType: m.type }))).slice(0, 4).map((slot: any, i: number) => (
                  <Box key={i} sx={{ color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
                    {MODULE_ICON_MAP[slot.moduleType] || MODULE_ICON_MAP[slot.type]}
                  </Box>
                ))}
                {slotCount > 4 && <Typography variant="caption" color="text.disabled">+{slotCount - 4}</Typography>}
              </Box>
              <IconButton size="small" onClick={() => startEdit(template)} disabled={editing}><EditIcon fontSize="small" /></IconButton>
              {!template.isPreset && (
                <IconButton size="small" color="error" onClick={() => deleteTemplate(template.id)} disabled={editing}><DeleteIcon fontSize="small" /></IconButton>
              )}
            </CardContent>
          </Card>
        );
      })}

      {templates.length === 0 && !editing && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
          No templates yet. Create one to speed up offer creation for your team.
        </Typography>
      )}
    </Box>
  );
}
