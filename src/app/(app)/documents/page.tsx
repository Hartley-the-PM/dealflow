'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import BlockIcon from '@mui/icons-material/Block';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionIcon from '@mui/icons-material/Description';
import MoreTimeIcon from '@mui/icons-material/MoreTime';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { useDocumentStore } from '@/stores/documentStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHydration } from '@/hooks/useHydration';
import { CompanyDocument, DocumentPackage, DocumentType, PackageTemplate } from '@/types/document';
import { format, isPast, differenceInDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

interface TabPanelProps { children: React.ReactNode; value: number; index: number; }
function TabPanel({ children, value, index }: TabPanelProps) {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

const DOC_TYPES: DocumentType[] = ['TDS', 'SDS', 'CoA', 'Certification', 'Company Document', 'Custom'];

function getExpiryStatus(expiryDate: string) {
  if (!expiryDate) return { label: 'No Expiry', color: '#6B7280', bgColor: '#F3F4F6' };
  const d = differenceInDays(new Date(expiryDate), new Date());
  if (d < 0) return { label: 'Expired', color: '#DC2626', bgColor: '#FEE2E2' };
  if (d <= 30) return { label: 'Expiring Soon', color: '#DC2626', bgColor: '#FEE2E2' };
  if (d <= 90) return { label: 'Expiring Soon', color: '#D97706', bgColor: '#FEF3C7' };
  return { label: 'Active', color: '#059669', bgColor: '#D1FAE5' };
}

function getPackageStatus(pkg: DocumentPackage) {
  if (pkg.status === 'Revoked') return { label: 'Revoked', color: '#DC2626', bgColor: '#FEE2E2' };
  if (isPast(new Date(pkg.expiryDate))) return { label: 'Expired', color: '#DC2626', bgColor: '#FEE2E2' };
  return { label: 'Active', color: '#059669', bgColor: '#D1FAE5' };
}

const emptyCompanyDoc = {
  name: '', documentType: 'Company Document' as DocumentType, issueDate: '', expiryDate: '',
  fileName: '', fileUrl: '', notes: '',
};

export default function DocumentManagerPage() {
  const hydrated = useHydration();
  const [tab, setTab] = useState(0);
  const settings = useSettingsStore((s) => s.settings);

  // Stores
  const companyDocuments = useDocumentStore((s) => s.companyDocuments);
  const addCompanyDocument = useDocumentStore((s) => s.addCompanyDocument);
  const updateCompanyDocument = useDocumentStore((s) => s.updateCompanyDocument);
  const deleteCompanyDocument = useDocumentStore((s) => s.deleteCompanyDocument);
  const packages = useDocumentStore((s) => s.packages);
  const updatePackage = useDocumentStore((s) => s.updatePackage);
  const addPackage = useDocumentStore((s) => s.addPackage);
  const templates = useDocumentStore((s) => s.templates);
  const addTemplate = useDocumentStore((s) => s.addTemplate);
  const updateTemplate = useDocumentStore((s) => s.updateTemplate);
  const deleteTemplate = useDocumentStore((s) => s.deleteTemplate);

  // Company Document dialog
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docForm, setDocForm] = useState(emptyCompanyDoc);
  const [deleteDocDialog, setDeleteDocDialog] = useState<string | null>(null);

  // Template dialog
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '', description: '',
    includeProductTDS: true, includeProductSDS: true,
    includeProductCertifications: true, includeProductCoA: false,
    companyDocumentIds: [] as string[],
  });
  const [deleteTemplateDialog, setDeleteTemplateDialog] = useState<string | null>(null);

  // Extend Expiry dialog
  const [extendDialog, setExtendDialog] = useState<string | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState('');

  // Package detail view
  const [viewingPackageId, setViewingPackageId] = useState<string | null>(null);
  const viewingPackage = viewingPackageId ? packages.find((p) => p.id === viewingPackageId) : null;

  // Company doc handlers
  const handleOpenCompanyDoc = (doc?: CompanyDocument) => {
    if (doc) {
      setEditingDocId(doc.id);
      setDocForm({ name: doc.name, documentType: doc.documentType, issueDate: doc.issueDate, expiryDate: doc.expiryDate, fileName: doc.fileName, fileUrl: doc.fileUrl, notes: doc.notes });
    } else {
      setEditingDocId(null);
      setDocForm(emptyCompanyDoc);
    }
    setDocDialogOpen(true);
  };

  const handleSaveCompanyDoc = () => {
    const now = new Date().toISOString();
    if (editingDocId) {
      updateCompanyDocument(editingDocId, docForm);
    } else {
      addCompanyDocument({
        id: uuidv4(), ...docForm,
        currentVersion: 1,
        versions: [{ id: uuidv4(), versionNumber: 1, fileName: docForm.fileName || `${docForm.name}.pdf`, fileUrl: '#', uploadedAt: now, uploadedBy: settings.currentUser, changeNote: 'Initial upload' }],
        fileName: docForm.fileName || `${docForm.name}.pdf`, fileUrl: '#',
        createdAt: now, updatedAt: now,
      });
    }
    setDocDialogOpen(false);
    setDocForm(emptyCompanyDoc);
    setEditingDocId(null);
  };

  // Template handlers
  const handleOpenTemplate = (tmpl?: PackageTemplate) => {
    if (tmpl) {
      setEditingTemplateId(tmpl.id);
      setTemplateForm({
        name: tmpl.name, description: tmpl.description,
        includeProductTDS: tmpl.includeProductTDS, includeProductSDS: tmpl.includeProductSDS,
        includeProductCertifications: tmpl.includeProductCertifications, includeProductCoA: tmpl.includeProductCoA,
        companyDocumentIds: tmpl.companyDocumentIds,
      });
    } else {
      setEditingTemplateId(null);
      setTemplateForm({ name: '', description: '', includeProductTDS: true, includeProductSDS: true, includeProductCertifications: true, includeProductCoA: false, companyDocumentIds: [] });
    }
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    const now = new Date().toISOString();
    if (editingTemplateId) {
      updateTemplate(editingTemplateId, templateForm);
    } else {
      addTemplate({
        id: uuidv4(), ...templateForm,
        createdBy: settings.currentUser, createdAt: now, updatedAt: now,
      });
    }
    setTemplateDialogOpen(false);
    setEditingTemplateId(null);
  };

  const toggleCompanyDocInTemplate = (docId: string) => {
    setTemplateForm((prev) => {
      const ids = prev.companyDocumentIds.includes(docId)
        ? prev.companyDocumentIds.filter((id) => id !== docId)
        : [...prev.companyDocumentIds, docId];
      return { ...prev, companyDocumentIds: ids };
    });
  };

  if (!hydrated) return null;

  return (
    <Box>
      <PageHeader title="Document Manager" />

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Company Documents" />
          <Tab label="Templates" />
          <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>Package History <Chip label={packages.length} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#F3F4F6', color: '#6B7280' }} /></Box>} />
        </Tabs>
      </Box>

      {/* ===== Company Documents Tab ===== */}
      <TabPanel value={tab} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => handleOpenCompanyDoc()}>
            Add Company Document
          </Button>
        </Box>
        {companyDocuments.length === 0 ? (
          <Paper variant="outlined">
            <EmptyState message="No company documents yet. Upload insurance certificates, accreditations, and more." action={
              <Button size="small" startIcon={<AddIcon />} onClick={() => handleOpenCompanyDoc()}>Add Document</Button>
            } />
          </Paper>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Version</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Issue Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Expiry Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {companyDocuments.map((doc) => {
                  const status = getExpiryStatus(doc.expiryDate);
                  return (
                    <TableRow key={doc.id} hover>
                      <TableCell sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{doc.name}</TableCell>
                      <TableCell><Chip label={doc.documentType} size="small" sx={{ fontSize: '0.65rem' }} /></TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>v{doc.currentVersion}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{doc.issueDate ? format(new Date(doc.issueDate), 'MMM d, yyyy') : '\u2014'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{doc.expiryDate ? format(new Date(doc.expiryDate), 'MMM d, yyyy') : '\u2014'}</TableCell>
                      <TableCell><Chip label={status.label} size="small" sx={{ fontSize: '0.65rem', fontWeight: 600, color: status.color, bgcolor: status.bgColor }} /></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleOpenCompanyDoc(doc)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => setDeleteDocDialog(doc.id)}><DeleteIcon fontSize="small" color="error" /></IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* ===== Templates Tab ===== */}
      <TabPanel value={tab} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => handleOpenTemplate()}>
            Create Template
          </Button>
        </Box>
        {templates.length === 0 ? (
          <Paper variant="outlined">
            <EmptyState message="No package templates yet. Create a template to define which documents are included in a package." action={
              <Button size="small" startIcon={<AddIcon />} onClick={() => handleOpenTemplate()}>Create Template</Button>
            } />
          </Paper>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Template Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Includes</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Created By</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.map((tmpl) => {
                  const includes: string[] = [];
                  if (tmpl.includeProductTDS) includes.push('TDS');
                  if (tmpl.includeProductSDS) includes.push('SDS');
                  if (tmpl.includeProductCertifications) includes.push('Certs');
                  if (tmpl.includeProductCoA) includes.push('CoA');
                  if (tmpl.companyDocumentIds.length > 0) includes.push(`${tmpl.companyDocumentIds.length} Company`);
                  return (
                    <TableRow key={tmpl.id} hover>
                      <TableCell sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{tmpl.name}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#6B7280' }}>{tmpl.description || '\u2014'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {includes.map((t) => <Chip key={t} label={t} size="small" sx={{ fontSize: '0.6rem' }} />)}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{tmpl.createdBy}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{format(new Date(tmpl.createdAt), 'MMM d, yyyy')}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleOpenTemplate(tmpl)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => setDeleteTemplateDialog(tmpl.id)}><DeleteIcon fontSize="small" color="error" /></IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* ===== Package History Tab ===== */}
      <TabPanel value={tab} index={2}>
        {packages.length === 0 ? (
          <Paper variant="outlined">
            <EmptyState message="No document packages created yet. Create packages from the Document Manager tab on any deal." />
          </Paper>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Package Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Created By</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Expiry</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }} align="center">Views</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...packages].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((pkg) => {
                  const status = getPackageStatus(pkg);
                  return (
                    <TableRow key={pkg.id} hover sx={{ cursor: 'pointer' }} onClick={() => setViewingPackageId(pkg.id)}>
                      <TableCell sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                        {pkg.name}
                        {pkg.viewCount > 0 && (
                          <Chip label="Viewed" size="small" icon={<VisibilityIcon sx={{ fontSize: '0.7rem !important' }} />} sx={{ ml: 1, height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: '#DBEAFE', color: '#2563EB' }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{pkg.createdBy}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{format(new Date(pkg.createdAt), 'MMM d, yyyy')}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{format(new Date(pkg.expiryDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell><Chip label={status.label} size="small" sx={{ fontSize: '0.65rem', fontWeight: 600, color: status.color, bgcolor: status.bgColor }} /></TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.8rem' }}>{pkg.viewCount}</TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Copy Link">
                          <IconButton size="small" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/package/${pkg.token}`)}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Extend Expiry">
                          <IconButton size="small" onClick={() => { setExtendDialog(pkg.id); setNewExpiryDate(pkg.expiryDate); }}>
                            <MoreTimeIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Duplicate">
                          <IconButton size="small" onClick={() => {
                            const now = new Date().toISOString();
                            addPackage({ ...pkg, id: uuidv4(), token: uuidv4().split('-')[0], name: `${pkg.name} (Copy)`, viewCount: 0, views: [], createdAt: now, updatedAt: now });
                          }}>
                            <FileCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Revoke">
                          <IconButton size="small" onClick={() => updatePackage(pkg.id, { status: 'Revoked' })} disabled={pkg.status === 'Revoked'}>
                            <BlockIcon fontSize="small" color={pkg.status === 'Revoked' ? 'disabled' : 'error'} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* ===== Company Document Add/Edit Dialog ===== */}
      <Dialog open={docDialogOpen} onClose={() => setDocDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingDocId ? 'Edit Company Document' : 'Add Company Document'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Document Name" value={docForm.name} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })} size="small" fullWidth required />
          <TextField select label="Document Type" value={docForm.documentType} onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value as DocumentType })} size="small" fullWidth>
            {DOC_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Issue Date" type="date" value={docForm.issueDate} onChange={(e) => setDocForm({ ...docForm, issueDate: e.target.value })} size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Expiry Date" type="date" value={docForm.expiryDate} onChange={(e) => setDocForm({ ...docForm, expiryDate: e.target.value })} size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }} />
          </Box>
          <TextField label="File Name" placeholder="e.g. insurance_certificate.pdf" value={docForm.fileName} onChange={(e) => setDocForm({ ...docForm, fileName: e.target.value })} size="small" fullWidth helperText="Simulated file reference" />
          <TextField label="Notes" value={docForm.notes} onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })} size="small" fullWidth multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCompanyDoc} disabled={!docForm.name}>{editingDocId ? 'Save' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      {/* ===== Template Add/Edit Dialog ===== */}
      <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTemplateId ? 'Edit Template' : 'Create Template'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Template Name" placeholder='e.g. "Standard Compliance Pack"' value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} size="small" fullWidth required />
          <TextField label="Description" placeholder="What is this template for?" value={templateForm.description} onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })} size="small" fullWidth />

          <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 1 }}>Product Documents</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5 }}>
            When applied to a deal, these will be pulled automatically from the deal&apos;s products.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <FormControlLabel control={<Checkbox checked={templateForm.includeProductTDS} onChange={(e) => setTemplateForm({ ...templateForm, includeProductTDS: e.target.checked })} size="small" />} label={<Typography variant="body2">TDS (Technical Data Sheet)</Typography>} />
            <FormControlLabel control={<Checkbox checked={templateForm.includeProductSDS} onChange={(e) => setTemplateForm({ ...templateForm, includeProductSDS: e.target.checked })} size="small" />} label={<Typography variant="body2">SDS (Safety Data Sheet)</Typography>} />
            <FormControlLabel control={<Checkbox checked={templateForm.includeProductCertifications} onChange={(e) => setTemplateForm({ ...templateForm, includeProductCertifications: e.target.checked })} size="small" />} label={<Typography variant="body2">Certifications</Typography>} />
            <FormControlLabel control={<Checkbox checked={templateForm.includeProductCoA} onChange={(e) => setTemplateForm({ ...templateForm, includeProductCoA: e.target.checked })} size="small" />} label={<Typography variant="body2">CoA (Certificate of Analysis)</Typography>} />
          </Box>

          {companyDocuments.length > 0 && (
            <>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 1 }}>Company Documents</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5 }}>
                Select company-level documents to always include in this template.
              </Typography>
              <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                {companyDocuments.map((doc) => (
                  <ListItem key={doc.id} sx={{ cursor: 'pointer', borderRadius: 1, '&:hover': { bgcolor: '#F9FAFB' } }} onClick={() => toggleCompanyDocInTemplate(doc.id)}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Checkbox checked={templateForm.companyDocumentIds.includes(doc.id)} size="small" />
                    </ListItemIcon>
                    <ListItemText primary={doc.name} secondary={doc.documentType} primaryTypographyProps={{ fontSize: '0.85rem' }} secondaryTypographyProps={{ fontSize: '0.7rem' }} />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveTemplate} disabled={!templateForm.name}>{editingTemplateId ? 'Save' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Company Doc Confirm */}
      <Dialog open={!!deleteDocDialog} onClose={() => setDeleteDocDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent><Typography>Are you sure? This cannot be undone.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDocDialog(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => { if (deleteDocDialog) deleteCompanyDocument(deleteDocDialog); setDeleteDocDialog(null); }}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Template Confirm */}
      <Dialog open={!!deleteTemplateDialog} onClose={() => setDeleteTemplateDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Template</DialogTitle>
        <DialogContent><Typography>Are you sure? This cannot be undone.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTemplateDialog(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => { if (deleteTemplateDialog) deleteTemplate(deleteTemplateDialog); setDeleteTemplateDialog(null); }}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Extend Expiry Dialog */}
      <Dialog open={!!extendDialog} onClose={() => setExtendDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Extend Package Expiry</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <TextField label="New Expiry Date" type="date" value={newExpiryDate} onChange={(e) => setNewExpiryDate(e.target.value)} size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExtendDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => { if (extendDialog) updatePackage(extendDialog, { expiryDate: newExpiryDate, status: 'Active' }); setExtendDialog(null); }}>Extend</Button>
        </DialogActions>
      </Dialog>

      {/* Package Detail Dialog */}
      <Dialog open={!!viewingPackage} onClose={() => setViewingPackageId(null)} maxWidth="md" fullWidth>
        {viewingPackage && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {viewingPackage.name}
                {viewingPackage.viewCount > 0 && (
                  <Chip label="Viewed" size="small" icon={<VisibilityIcon sx={{ fontSize: '0.7rem !important' }} />} sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: '#DBEAFE', color: '#2563EB' }} />
                )}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Documents ({viewingPackage.documents.length})</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Source</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Version</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewingPackage.documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{doc.name}</TableCell>
                        <TableCell><Chip label={doc.type} size="small" sx={{ fontSize: '0.6rem' }} /></TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{doc.productName}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>v{doc.version}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Views ({viewingPackage.views.length})</Typography>
              {viewingPackage.views.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No views yet.</Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Viewed At</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>IP Address</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Email</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {viewingPackage.views.map((v) => (
                        <TableRow key={v.id}>
                          <TableCell sx={{ fontSize: '0.8rem' }}>{format(new Date(v.viewedAt), 'MMM d, yyyy HH:mm')}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{v.ipAddress}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem' }}>{v.email || '\u2014'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <Box sx={{ mt: 2, p: 2, bgcolor: '#F9FAFB', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Share Link: {typeof window !== 'undefined' ? `${window.location.origin}/package/${viewingPackage.token}` : ''}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewingPackageId(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
