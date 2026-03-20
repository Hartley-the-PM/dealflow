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
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Slider from '@mui/material/Slider';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import GavelIcon from '@mui/icons-material/Gavel';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import BusinessIcon from '@mui/icons-material/Business';
import VerifiedIcon from '@mui/icons-material/Verified';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import PanoramaIcon from '@mui/icons-material/Panorama';
import ImageIcon from '@mui/icons-material/Image';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import FileUploadZone from '@/components/shared/FileUploadZone';
import { useOfferBuilderSettingsStore } from '@/stores/offerBuilderSettingsStore';
import type { ContentPreset, ContentPresetType } from '@/types/offerBuilder';
import { v4 as uuidv4 } from 'uuid';

// This config mirrors the builder's module types 1:1
// When adding a new module to the builder, add it here too
const BLOCK_TYPE_CONFIG: Array<{ value: ContentPresetType; label: string; icon: React.ReactNode; description: string }> = [
  { value: 'hero', label: 'Hero / Cover', icon: <StarIcon sx={{ fontSize: 16 }} />, description: 'Title, customer name, intro text, logo' },
  { value: 'terms', label: 'Terms & Conditions', icon: <GavelIcon sx={{ fontSize: 16 }} />, description: 'Payment terms, incoterms, validity, delivery' },
  { value: 'custom_text', label: 'Custom Text', icon: <TextFieldsIcon sx={{ fontSize: 16 }} />, description: 'Reusable heading + body text blocks' },
  { value: 'company_about', label: 'Company About', icon: <BusinessIcon sx={{ fontSize: 16 }} />, description: 'Mission, vision, and values' },
  { value: 'certifications', label: 'Certifications', icon: <VerifiedIcon sx={{ fontSize: 16 }} />, description: 'Certification cards with name, issuer, description' },
  { value: 'testimonials', label: 'Testimonials', icon: <FormatQuoteIcon sx={{ fontSize: 16 }} />, description: 'Customer quotes and endorsements' },
  { value: 'cover_image', label: 'Cover Image', icon: <PanoramaIcon sx={{ fontSize: 16 }} />, description: 'Background image with title overlay' },
  { value: 'image', label: 'Image Block', icon: <ImageIcon sx={{ fontSize: 16 }} />, description: 'Single image with caption' },
  { value: 'products', label: 'Products & Pricing', icon: <Inventory2Icon sx={{ fontSize: 16 }} />, description: 'Column visibility defaults for product tables' },
];

const BLOCK_ICON_MAP: Record<string, React.ReactNode> = Object.fromEntries(
  BLOCK_TYPE_CONFIG.map((b) => [b.value, b.icon])
);
const BLOCK_LABEL_MAP: Record<string, string> = Object.fromEntries(
  BLOCK_TYPE_CONFIG.map((b) => [b.value, b.label])
);

function getDefaultData(type: ContentPresetType): Record<string, unknown> {
  switch (type) {
    case 'hero': return { title: '', customerName: '', intro: '', logoUrl: '' };
    case 'terms': return { paymentTerms: '', incoterms: '', validity: '', delivery: '', legalNotes: '' };
    case 'custom_text': return { heading: '', body: '' };
    case 'company_about': return { mission: '', vision: '', values: [], certifications: [], differentiators: [] };
    case 'certifications': return { title: 'Certifications & Compliance', certifications: [] };
    case 'testimonials': return { testimonials: [] };
    case 'cover_image': return { backgroundImageUrl: '', title: '', subtitle: '', overlayOpacity: 0.5, overlayColor: '#000000' };
    case 'image': return { imageUrl: '', caption: '', alt: '', width: 'full', alignment: 'center' };
    case 'products': return { showQuantity: true, showUnit: true, showUnitPrice: true, showTotal: true };
    default: return {};
  }
}

export default function ContentBlocksSection() {
  const contentPresets = useOfferBuilderSettingsStore((s) => s.contentPresets);
  const addContentPreset = useOfferBuilderSettingsStore((s) => s.addContentPreset);
  const updateContentPreset = useOfferBuilderSettingsStore((s) => s.updateContentPreset);
  const deleteContentPreset = useOfferBuilderSettingsStore((s) => s.deleteContentPreset);

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<ContentPresetType>('terms');
  const [data, setData] = useState<Record<string, any>>({});

  const startCreate = () => {
    setCreating(true);
    setEditingId(null);
    setName('');
    setType('terms');
    setData(getDefaultData('terms'));
  };

  const startEdit = (preset: ContentPreset) => {
    setCreating(false);
    setEditingId(preset.id);
    setName(preset.name);
    setType(preset.type);
    setData({ ...getDefaultData(preset.type), ...preset.data });
  };

  const handleTypeChange = (newType: ContentPresetType) => {
    setType(newType);
    setData(getDefaultData(newType));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editingId) {
      updateContentPreset(editingId, { name: name.trim(), data });
    } else {
      addContentPreset({ id: uuidv4(), name: name.trim(), type, data });
    }
    setCreating(false);
    setEditingId(null);
  };

  const handleCancel = () => { setCreating(false); setEditingId(null); };
  const isEditing = creating || editingId !== null;
  const updateField = (field: string, value: any) => setData((prev) => ({ ...prev, [field]: value }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Content Blocks</Typography>
          <Typography variant="body2" color="text.secondary">Reusable templates for every module in the offer builder</Typography>
        </Box>
        <Button size="small" startIcon={<AddIcon />} onClick={startCreate} disabled={isEditing}>New Block</Button>
      </Box>

      {isEditing && (
        <Card variant="outlined" sx={{ mb: 2, borderColor: 'primary.main' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">{editingId ? 'Edit Content Block' : 'New Content Block'}</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField size="small" label="Block Name" value={name} onChange={(e) => setName(e.target.value)} sx={{ flex: 1 }} />
              {!editingId && (
                <TextField select size="small" label="Module Type" value={type} onChange={(e) => handleTypeChange(e.target.value as ContentPresetType)} sx={{ minWidth: 200 }}>
                  {BLOCK_TYPE_CONFIG.map((bt) => (
                    <MenuItem key={bt.value} value={bt.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{bt.icon} {bt.label}</Box>
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Box>

            {/* Type-specific editor */}
            <Box sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: 1.5, border: '1px solid #E5E7EB' }}>
              <ContentBlockEditor type={type} data={data} updateField={updateField} setData={setData} />
            </Box>

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button size="small" onClick={handleCancel} startIcon={<CloseIcon />}>Cancel</Button>
              <Button size="small" variant="contained" onClick={handleSave} startIcon={<SaveIcon />} disabled={!name.trim()}>Save</Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Existing blocks grouped by type */}
      {contentPresets.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {contentPresets.map((preset) => (
            <Card key={preset.id} variant="outlined">
              <CardContent sx={{ py: '10px !important', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                  {BLOCK_ICON_MAP[preset.type] || <TextFieldsIcon sx={{ fontSize: 18 }} />}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{preset.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{BLOCK_LABEL_MAP[preset.type] || preset.type}</Typography>
                </Box>
                <Chip label={BLOCK_LABEL_MAP[preset.type] || preset.type} size="small" sx={{ height: 20, fontSize: '0.6rem' }} />
                <IconButton size="small" onClick={() => startEdit(preset)} disabled={isEditing}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" color="error" onClick={() => deleteContentPreset(preset.id)} disabled={isEditing}><DeleteIcon fontSize="small" /></IconButton>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : !isEditing ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
          No content blocks yet. Create reusable templates for any module type.
        </Typography>
      ) : null}
    </Box>
  );
}

// --- Content Block Editor (renders fields based on module type) ---

function ContentBlockEditor({ type, data, updateField, setData }: {
  type: ContentPresetType;
  data: Record<string, any>;
  updateField: (field: string, value: any) => void;
  setData: (fn: (prev: Record<string, any>) => Record<string, any>) => void;
}) {
  const [chipInput, setChipInput] = useState('');

  const addChipItem = (field: string) => {
    if (!chipInput.trim()) return;
    updateField(field, [...(data[field] || []), chipInput.trim()]);
    setChipInput('');
  };

  const removeChipItem = (field: string, index: number) => {
    updateField(field, (data[field] || []).filter((_: any, i: number) => i !== index));
  };

  switch (type) {
    case 'hero':
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField size="small" fullWidth label="Default Title" value={data.title || ''} onChange={(e) => updateField('title', e.target.value)} placeholder="e.g. Offer Proposal" />
          <TextField size="small" fullWidth label="Default Intro Text" multiline minRows={2} value={data.intro || ''} onChange={(e) => updateField('intro', e.target.value)} />
          <FileUploadZone value={data.logoUrl || ''} onChange={(url) => updateField('logoUrl', url)} label="default logo" previewHeight={36} />
        </Box>
      );

    case 'terms':
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField size="small" fullWidth label="Payment Terms" value={data.paymentTerms || ''} onChange={(e) => updateField('paymentTerms', e.target.value)} placeholder="e.g. Net 30" />
          <TextField size="small" fullWidth label="Incoterms" value={data.incoterms || ''} onChange={(e) => updateField('incoterms', e.target.value)} placeholder="e.g. FOB Rotterdam" />
          <TextField size="small" fullWidth label="Validity" value={data.validity || ''} onChange={(e) => updateField('validity', e.target.value)} placeholder="e.g. 30 days from date of offer" />
          <TextField size="small" fullWidth label="Delivery" value={data.delivery || ''} onChange={(e) => updateField('delivery', e.target.value)} placeholder="e.g. 4-6 weeks from order confirmation" />
          <TextField size="small" fullWidth label="Legal Notes" multiline minRows={2} value={data.legalNotes || ''} onChange={(e) => updateField('legalNotes', e.target.value)} />
        </Box>
      );

    case 'custom_text':
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField size="small" fullWidth label="Heading" value={data.heading || ''} onChange={(e) => updateField('heading', e.target.value)} />
          <TextField size="small" fullWidth label="Body Text" multiline minRows={3} value={data.body || ''} onChange={(e) => updateField('body', e.target.value)} placeholder="The reusable text content..." />
        </Box>
      );

    case 'company_about':
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField size="small" fullWidth label="Mission" multiline minRows={2} value={data.mission || ''} onChange={(e) => updateField('mission', e.target.value)} />
          <TextField size="small" fullWidth label="Vision" multiline minRows={2} value={data.vision || ''} onChange={(e) => updateField('vision', e.target.value)} />
          <Box>
            <Typography variant="caption" color="text.secondary">Values</Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1, mt: 0.5 }}>
              {(data.values || []).map((v: string, i: number) => (
                <Chip key={i} label={v} size="small" onDelete={() => removeChipItem('values', i)} />
              ))}
            </Box>
            <TextField size="small" fullWidth placeholder="Add a value (press Enter)..." value={chipInput} onChange={(e) => setChipInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChipItem('values'); } }} />
          </Box>
        </Box>
      );

    case 'certifications':
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField size="small" fullWidth label="Section Title" value={data.title || ''} onChange={(e) => updateField('title', e.target.value)} placeholder="Certifications & Compliance" />
          {(data.certifications || []).map((cert: any, i: number) => (
            <Card key={i} variant="outlined" sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">Cert {i + 1}</Typography>
                <IconButton size="small" color="error" onClick={() => updateField('certifications', (data.certifications || []).filter((_: any, j: number) => j !== i))}><DeleteIcon sx={{ fontSize: 14 }} /></IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <TextField size="small" fullWidth label="Name" value={cert.name} onChange={(e) => { const certs = [...(data.certifications || [])]; certs[i] = { ...certs[i], name: e.target.value }; updateField('certifications', certs); }} />
                <TextField size="small" fullWidth label="Issuer" value={cert.issuer} onChange={(e) => { const certs = [...(data.certifications || [])]; certs[i] = { ...certs[i], issuer: e.target.value }; updateField('certifications', certs); }} />
                <TextField size="small" fullWidth label="Description" value={cert.description} onChange={(e) => { const certs = [...(data.certifications || [])]; certs[i] = { ...certs[i], description: e.target.value }; updateField('certifications', certs); }} />
              </Box>
            </Card>
          ))}
          <Button size="small" startIcon={<AddIcon />} onClick={() => updateField('certifications', [...(data.certifications || []), { name: '', description: '', issuer: '' }])}>Add Certification</Button>
        </Box>
      );

    case 'testimonials':
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {(data.testimonials || []).map((t: any, i: number) => (
            <Card key={i} variant="outlined" sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">Testimonial {i + 1}</Typography>
                <IconButton size="small" color="error" onClick={() => updateField('testimonials', (data.testimonials || []).filter((_: any, j: number) => j !== i))}><DeleteIcon sx={{ fontSize: 14 }} /></IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <TextField size="small" fullWidth label="Quote" multiline minRows={2} value={t.quote} onChange={(e) => { const ts = [...(data.testimonials || [])]; ts[i] = { ...ts[i], quote: e.target.value }; updateField('testimonials', ts); }} />
                <Grid container spacing={1}>
                  <Grid size={{ xs: 6 }}><TextField size="small" fullWidth label="Author" value={t.author} onChange={(e) => { const ts = [...(data.testimonials || [])]; ts[i] = { ...ts[i], author: e.target.value }; updateField('testimonials', ts); }} /></Grid>
                  <Grid size={{ xs: 6 }}><TextField size="small" fullWidth label="Company" value={t.company} onChange={(e) => { const ts = [...(data.testimonials || [])]; ts[i] = { ...ts[i], company: e.target.value }; updateField('testimonials', ts); }} /></Grid>
                </Grid>
              </Box>
            </Card>
          ))}
          <Button size="small" startIcon={<AddIcon />} onClick={() => updateField('testimonials', [...(data.testimonials || []), { quote: '', author: '', company: '' }])}>Add Testimonial</Button>
        </Box>
      );

    case 'cover_image':
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <FileUploadZone value={data.backgroundImageUrl || ''} onChange={(url) => updateField('backgroundImageUrl', url)} label="background image" previewHeight={80} />
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6 }}><TextField size="small" fullWidth label="Title" value={data.title || ''} onChange={(e) => updateField('title', e.target.value)} /></Grid>
            <Grid size={{ xs: 6 }}><TextField size="small" fullWidth label="Subtitle" value={data.subtitle || ''} onChange={(e) => updateField('subtitle', e.target.value)} /></Grid>
          </Grid>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">Overlay: {Math.round((data.overlayOpacity || 0.5) * 100)}%</Typography>
              <Slider size="small" min={0} max={1} step={0.05} value={data.overlayOpacity ?? 0.5} onChange={(_, v) => updateField('overlayOpacity', v)} />
            </Box>
            <input type="color" value={data.overlayColor || '#000000'} onChange={(e) => updateField('overlayColor', e.target.value)} style={{ width: 32, height: 32, border: '1px solid #E5E7EB', borderRadius: 4, cursor: 'pointer', padding: 0 }} />
          </Box>
        </Box>
      );

    case 'image':
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <FileUploadZone value={data.imageUrl || ''} onChange={(url) => updateField('imageUrl', url)} label="image" previewHeight={80} />
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6 }}><TextField size="small" fullWidth label="Caption" value={data.caption || ''} onChange={(e) => updateField('caption', e.target.value)} /></Grid>
            <Grid size={{ xs: 6 }}><TextField size="small" fullWidth label="Alt Text" value={data.alt || ''} onChange={(e) => updateField('alt', e.target.value)} /></Grid>
          </Grid>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6 }}>
              <TextField select size="small" fullWidth label="Width" value={data.width || 'full'} onChange={(e) => updateField('width', e.target.value)}>
                <MenuItem value="full">Full</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="small">Small</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField select size="small" fullWidth label="Alignment" value={data.alignment || 'center'} onChange={(e) => updateField('alignment', e.target.value)}>
                <MenuItem value="left">Left</MenuItem>
                <MenuItem value="center">Center</MenuItem>
                <MenuItem value="right">Right</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Box>
      );

    case 'products':
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">Default column visibility for product tables</Typography>
          <FormControlLabel control={<Switch size="small" checked={data.showQuantity ?? true} onChange={(e) => updateField('showQuantity', e.target.checked)} />} label="Show Quantity" />
          <FormControlLabel control={<Switch size="small" checked={data.showUnit ?? true} onChange={(e) => updateField('showUnit', e.target.checked)} />} label="Show Unit" />
          <FormControlLabel control={<Switch size="small" checked={data.showUnitPrice ?? true} onChange={(e) => updateField('showUnitPrice', e.target.checked)} />} label="Show Unit Price" />
          <FormControlLabel control={<Switch size="small" checked={data.showTotal ?? true} onChange={(e) => updateField('showTotal', e.target.checked)} />} label="Show Total" />
        </Box>
      );

    default:
      return <Typography variant="body2" color="text.secondary">No editor available for this type.</Typography>;
  }
}
