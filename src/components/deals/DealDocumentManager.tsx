'use client';

import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
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
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import DescriptionIcon from '@mui/icons-material/Description';
import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import EmptyState from '@/components/shared/EmptyState';
import { useProductStore } from '@/stores/productStore';
import { useOfferStore } from '@/stores/offerStore';
import { useOrderStore } from '@/stores/orderStore';
import { useCertificationStore } from '@/stores/certificationStore';
import { useDocumentStore } from '@/stores/documentStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { DocumentType, PackageDocument, DocumentPackage } from '@/types/document';
import { format, differenceInDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

const DOC_TYPES: DocumentType[] = ['TDS', 'SDS', 'CoA', 'Certification', 'Company Document', 'Custom'];

function getExpiryBadge(expiryDate: string) {
  if (!expiryDate) return null;
  const d = differenceInDays(new Date(expiryDate), new Date());
  if (d < 0) return { label: 'Expired', color: '#DC2626', bgColor: '#FEE2E2' };
  if (d <= 30) return { label: 'Expiring', color: '#DC2626', bgColor: '#FEE2E2' };
  if (d <= 90) return { label: 'Expiring', color: '#D97706', bgColor: '#FEF3C7' };
  return null;
}

interface ProductDoc {
  id: string;
  name: string;
  type: DocumentType;
  source: string;
  fileName: string;
  version: number;
  expiryDate: string;
  date: string;
}

interface Props {
  dealId: string;
}

export default function DealDocumentManager({ dealId }: Props) {
  const products = useProductStore((s) => s.products);
  const offers = useOfferStore((s) => s.offers);
  const orders = useOrderStore((s) => s.orders);
  const certifications = useCertificationStore((s) => s.certifications);
  const companyDocuments = useDocumentStore((s) => s.companyDocuments);
  const allDealDocuments = useDocumentStore((s) => s.dealDocuments);
  const dealDocuments = useMemo(() => allDealDocuments.filter((d) => d.dealId === dealId), [allDealDocuments, dealId]);
  const addDealDocument = useDocumentStore((s) => s.addDealDocument);
  const deleteDealDocument = useDocumentStore((s) => s.deleteDealDocument);
  const templates = useDocumentStore((s) => s.templates);
  const addPackage = useDocumentStore((s) => s.addPackage);
  const settings = useSettingsStore((s) => s.settings);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({ name: '', type: 'Custom' as DocumentType, fileName: '', expiryDate: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Package builder state
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderStep, setBuilderStep] = useState(0);
  const [selectedDocs, setSelectedDocs] = useState<PackageDocument[]>([]);
  const [packageName, setPackageName] = useState('');
  const [packageExpiry, setPackageExpiry] = useState('');
  const [packageEmail, setPackageEmail] = useState('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  // Create Package menu anchor
  const [packageMenuAnchor, setPackageMenuAnchor] = useState<null | HTMLElement>(null);

  // Collect product IDs from all offers and orders on this deal
  const dealProductIds = useMemo(() => {
    const ids = new Set<string>();
    offers.filter((o) => o.dealId === dealId).forEach((o) => o.lines.forEach((l) => ids.add(l.productId)));
    orders.filter((o) => o.dealId === dealId).forEach((o) => o.lines.forEach((l) => ids.add(l.productId)));
    return ids;
  }, [offers, orders, dealId]);

  // Build auto-populated document list from deal products
  const autoPopulatedDocs = useMemo((): ProductDoc[] => {
    const docs: ProductDoc[] = [];
    dealProductIds.forEach((pid) => {
      const product = products.find((p) => p.id === pid);
      if (!product) return;
      if (product.tds) {
        docs.push({ id: `tds-${pid}`, name: `${product.name} - TDS`, type: 'TDS', source: product.name, fileName: `${product.name}_TDS.pdf`, version: 1, expiryDate: '', date: '' });
      }
      docs.push({ id: `sds-${pid}`, name: `${product.name} - SDS`, type: 'SDS', source: product.name, fileName: `${product.name}_SDS.pdf`, version: 1, expiryDate: '', date: '' });
      certifications.filter((c) => c.productId === pid).forEach((c) => {
        docs.push({ id: `cert-${c.id}`, name: c.certificationName, type: 'Certification', source: product.name, fileName: c.documentName, version: 1, expiryDate: c.expiryDate, date: c.issueDate });
      });
    });
    return docs;
  }, [dealProductIds, products, certifications]);

  const adHocDocs = dealDocuments.map((d): ProductDoc => ({
    id: d.id, name: d.name, type: d.type, source: 'Ad Hoc Upload', fileName: d.fileName, version: d.currentVersion, expiryDate: d.expiryDate, date: d.uploadedAt,
  }));

  const allDocs = [...autoPopulatedDocs, ...adHocDocs];
  const docCount = allDocs.length;

  // Convert ProductDoc to PackageDocument
  const toPackageDoc = (doc: ProductDoc): PackageDocument => ({
    id: doc.id, name: doc.name, type: doc.type, productName: doc.source,
    fileName: doc.fileName, fileUrl: '#', date: doc.date, version: doc.version, expiryDate: doc.expiryDate,
  });

  // Build doc list from a template
  const buildDocsFromTemplate = (templateId: string): PackageDocument[] => {
    const tmpl = templates.find((t) => t.id === templateId);
    if (!tmpl) return [];
    const docs: PackageDocument[] = [];
    // Product docs
    autoPopulatedDocs.forEach((d) => {
      if (d.type === 'TDS' && tmpl.includeProductTDS) docs.push(toPackageDoc(d));
      if (d.type === 'SDS' && tmpl.includeProductSDS) docs.push(toPackageDoc(d));
      if (d.type === 'Certification' && tmpl.includeProductCertifications) docs.push(toPackageDoc(d));
      if (d.type === 'CoA' && tmpl.includeProductCoA) docs.push(toPackageDoc(d));
    });
    // Company docs
    tmpl.companyDocumentIds.forEach((cdId) => {
      const cd = companyDocuments.find((c) => c.id === cdId);
      if (cd) {
        docs.push({ id: `company-${cd.id}`, name: cd.name, type: cd.documentType, productName: 'Company', fileName: cd.fileName, fileUrl: '#', date: cd.issueDate, version: cd.currentVersion, expiryDate: cd.expiryDate });
      }
    });
    // Ad-hoc deal docs
    adHocDocs.forEach((d) => docs.push(toPackageDoc(d)));
    return docs;
  };

  const openBuilderFromTemplate = (templateId: string) => {
    const docs = buildDocsFromTemplate(templateId);
    setSelectedDocs(docs);
    const tmpl = templates.find((t) => t.id === templateId);
    setPackageName(tmpl ? `${tmpl.name}` : '');
    setPackageExpiry('');
    setPackageEmail('');
    setCreatedToken(null);
    setBuilderStep(0); // review step
    setPackageMenuAnchor(null);
    setBuilderOpen(true);
  };

  const openBuilderManual = () => {
    // Pre-select all docs
    setSelectedDocs(allDocs.map(toPackageDoc));
    setPackageName('');
    setPackageExpiry('');
    setPackageEmail('');
    setCreatedToken(null);
    setBuilderStep(0);
    setPackageMenuAnchor(null);
    setBuilderOpen(true);
  };

  const toggleDoc = (doc: PackageDocument) => {
    setSelectedDocs((prev) => {
      const exists = prev.find((d) => d.id === doc.id);
      if (exists) return prev.filter((d) => d.id !== doc.id);
      return [...prev, doc];
    });
  };

  const handleCreatePackage = () => {
    const token = uuidv4().split('-')[0];
    const now = new Date().toISOString();
    const pkg: DocumentPackage = {
      id: uuidv4(), name: packageName, token, dealId, expiryDate: packageExpiry,
      recipientEmail: packageEmail, status: 'Active', documents: selectedDocs,
      viewCount: 0, views: [], createdBy: settings.currentUser, createdAt: now, updatedAt: now,
    };
    addPackage(pkg);
    setCreatedToken(token);
    setBuilderStep(3);
  };

  const handleUpload = () => {
    const now = new Date().toISOString();
    addDealDocument({
      id: uuidv4(), dealId, name: uploadForm.name, type: uploadForm.type,
      fileName: uploadForm.fileName || `${uploadForm.name}.pdf`, fileUrl: '#',
      expiryDate: uploadForm.expiryDate, currentVersion: 1,
      versions: [{ id: uuidv4(), versionNumber: 1, fileName: uploadForm.fileName || `${uploadForm.name}.pdf`, fileUrl: '#', uploadedAt: now, uploadedBy: settings.currentUser, changeNote: 'Initial upload' }],
      source: 'ad-hoc', sourceLabel: 'Ad Hoc Upload', uploadedAt: now, uploadedBy: settings.currentUser,
    });
    setUploadDialogOpen(false);
    setUploadForm({ name: '', type: 'Custom', fileName: '', expiryDate: '' });
  };

  // All available docs for manual selection
  const allAvailablePackageDocs = useMemo((): PackageDocument[] => {
    const docs = allDocs.map(toPackageDoc);
    companyDocuments.forEach((cd) => {
      docs.push({ id: `company-${cd.id}`, name: cd.name, type: cd.documentType, productName: 'Company', fileName: cd.fileName, fileUrl: '#', date: cd.issueDate, version: cd.currentVersion, expiryDate: cd.expiryDate });
    });
    return docs;
  }, [allDocs, companyDocuments]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, pb: 0.75, borderBottom: '1px solid #E5E7EB' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#111827' }}>Document Manager</Typography>
          <Chip label={docCount} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#F3F4F6', color: '#6B7280' }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<UploadFileIcon />} size="small" sx={{ fontSize: '0.7rem' }} onClick={() => setUploadDialogOpen(true)}>
            Upload
          </Button>
          <Button variant="outlined" startIcon={<FolderZipIcon />} endIcon={<ArrowDropDownIcon />} size="small" sx={{ fontSize: '0.7rem' }} onClick={(e) => setPackageMenuAnchor(e.currentTarget)}>
            Create Package
          </Button>
          <Menu anchorEl={packageMenuAnchor} open={Boolean(packageMenuAnchor)} onClose={() => setPackageMenuAnchor(null)}>
            {templates.length > 0 && templates.map((tmpl) => (
              <MenuItem key={tmpl.id} onClick={() => openBuilderFromTemplate(tmpl.id)} sx={{ fontSize: '0.85rem' }}>
                <ListItemIcon><DescriptionIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary={tmpl.name} secondary={tmpl.description} primaryTypographyProps={{ fontSize: '0.85rem' }} secondaryTypographyProps={{ fontSize: '0.7rem' }} />
              </MenuItem>
            ))}
            {templates.length > 0 && <Box sx={{ borderTop: '1px solid #E5E7EB', my: 0.5 }} />}
            <MenuItem onClick={openBuilderManual} sx={{ fontSize: '0.85rem' }}>
              <ListItemIcon><FolderZipIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Manual Package" secondary="Select documents manually" primaryTypographyProps={{ fontSize: '0.85rem' }} secondaryTypographyProps={{ fontSize: '0.7rem' }} />
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {allDocs.length === 0 ? (
        <Paper variant="outlined" sx={{ py: 5, textAlign: 'center', border: '2px dashed', borderColor: 'divider', borderRadius: 2, bgcolor: '#FAFAFA' }}>
          <UploadFileIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No documents yet. Add products to this deal or upload files directly.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Document</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Source</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Version</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Expiry</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allDocs.map((doc) => {
                const expiryBadge = doc.expiryDate ? getExpiryBadge(doc.expiryDate) : null;
                const isAdHoc = doc.source === 'Ad Hoc Upload';
                return (
                  <TableRow key={doc.id} hover>
                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <DescriptionIcon fontSize="small" sx={{ color: '#6B7280' }} />
                        {doc.name}
                      </Box>
                    </TableCell>
                    <TableCell><Chip label={doc.type} size="small" sx={{ fontSize: '0.65rem' }} /></TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{doc.source}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>v{doc.version}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>
                      {doc.expiryDate ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {format(new Date(doc.expiryDate), 'MMM d, yyyy')}
                          {expiryBadge && (
                            <Chip label={expiryBadge.label} size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 600, color: expiryBadge.color, bgcolor: expiryBadge.bgColor }} />
                          )}
                        </Box>
                      ) : '\u2014'}
                    </TableCell>
                    <TableCell align="right">
                      {isAdHoc && (
                        <IconButton size="small" onClick={() => setDeleteId(doc.id)}>
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Document Name" value={uploadForm.name} onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })} size="small" fullWidth required />
          <TextField select label="Document Type" value={uploadForm.type} onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value as DocumentType })} size="small" fullWidth>
            {DOC_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField label="File Name" placeholder="e.g. compliance_report.pdf" value={uploadForm.fileName} onChange={(e) => setUploadForm({ ...uploadForm, fileName: e.target.value })} size="small" fullWidth helperText="Simulated file reference" />
          <TextField label="Expiry Date" type="date" value={uploadForm.expiryDate} onChange={(e) => setUploadForm({ ...uploadForm, expiryDate: e.target.value })} size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpload} disabled={!uploadForm.name}>Upload</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent><Typography>Are you sure? This cannot be undone.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => { if (deleteId) deleteDealDocument(deleteId); setDeleteId(null); }}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* ===== Package Builder Dialog ===== */}
      <Dialog open={builderOpen} onClose={() => setBuilderOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Document Package</DialogTitle>
        <DialogContent>
          <Stepper activeStep={builderStep} sx={{ mb: 3, mt: 1 }}>
            <Step><StepLabel>Review Documents</StepLabel></Step>
            <Step><StepLabel>Package Details</StepLabel></Step>
            <Step><StepLabel>Confirm</StepLabel></Step>
            <Step><StepLabel>Done</StepLabel></Step>
          </Stepper>

          {/* Step 0: Review documents */}
          {builderStep === 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Review and adjust the documents to include. {selectedDocs.length} selected.
              </Typography>
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                <List dense>
                  {allAvailablePackageDocs.map((doc) => {
                    const isSelected = selectedDocs.some((d) => d.id === doc.id);
                    return (
                      <ListItem key={doc.id} sx={{ cursor: 'pointer', borderRadius: 1, '&:hover': { bgcolor: '#F9FAFB' } }} onClick={() => toggleDoc(doc)}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Checkbox checked={isSelected} size="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={doc.name}
                          secondary={`${doc.type} · ${doc.productName}${doc.version > 1 ? ` · v${doc.version}` : ''}${doc.expiryDate ? ` · Expires ${format(new Date(doc.expiryDate), 'MMM yyyy')}` : ''}`}
                          primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }}
                          secondaryTypographyProps={{ fontSize: '0.75rem' }}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            </Box>
          )}

          {/* Step 1: Package details */}
          {builderStep === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Package Name" placeholder='e.g. "Compliance Pack — ACME Corp — March 2026"' value={packageName} onChange={(e) => setPackageName(e.target.value)} fullWidth required />
              <TextField label="Recipient Email (optional)" placeholder="recipient@company.com" value={packageEmail} onChange={(e) => setPackageEmail(e.target.value)} fullWidth helperText="If known, will be logged with view tracking" />
              <TextField label="Package Expiry Date" type="date" value={packageExpiry} onChange={(e) => setPackageExpiry(e.target.value)} fullWidth required slotProps={{ inputLabel: { shrink: true } }} helperText="The shareable link will stop working after this date" />
            </Box>
          )}

          {/* Step 2: Confirm */}
          {builderStep === 2 && (
            <Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1, p: 2, bgcolor: '#F9FAFB', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Package Name</Typography>
                  <Typography variant="body2" fontWeight={500}>{packageName}</Typography>
                </Box>
                <Box sx={{ flex: 1, p: 2, bgcolor: '#F9FAFB', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Expiry Date</Typography>
                  <Typography variant="body2" fontWeight={500}>{packageExpiry ? format(new Date(packageExpiry), 'MMMM d, yyyy') : '\u2014'}</Typography>
                </Box>
              </Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Documents ({selectedDocs.length})</Typography>
              {selectedDocs.map((doc) => (
                <Box key={doc.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                  <DescriptionIcon fontSize="small" sx={{ color: '#6B7280' }} />
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{doc.name}</Typography>
                  <Chip label={doc.type} size="small" sx={{ fontSize: '0.6rem' }} />
                  <Typography variant="caption" color="text.secondary">{doc.productName}</Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Step 3: Done */}
          {builderStep === 3 && createdToken && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <LinkIcon sx={{ fontSize: 48, color: '#059669', mb: 2 }} />
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Package Created</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Your document package is ready. Share the link below with your recipient.
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#F9FAFB', mb: 2 }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {typeof window !== 'undefined' ? `${window.location.origin}/package/${createdToken}` : ''}
                </Typography>
              </Paper>
              <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => navigator.clipboard.writeText(`${window.location.origin}/package/${createdToken}`)}>
                Copy Link
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {builderStep < 3 && <Button onClick={() => setBuilderOpen(false)}>Cancel</Button>}
          {builderStep > 0 && builderStep < 3 && <Button onClick={() => setBuilderStep((s) => s - 1)}>Back</Button>}
          {builderStep === 0 && <Button variant="contained" onClick={() => setBuilderStep(1)} disabled={selectedDocs.length === 0}>Next</Button>}
          {builderStep === 1 && <Button variant="contained" onClick={() => setBuilderStep(2)} disabled={!packageName || !packageExpiry}>Next</Button>}
          {builderStep === 2 && <Button variant="contained" onClick={handleCreatePackage}>Generate Link</Button>}
          {builderStep === 3 && <Button variant="contained" onClick={() => setBuilderOpen(false)}>Done</Button>}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
