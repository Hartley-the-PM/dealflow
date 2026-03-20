'use client';

import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
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
import Autocomplete from '@mui/material/Autocomplete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import EmptyState from '@/components/shared/EmptyState';
import { useCertificationStore } from '@/stores/certificationStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Certification, CertificationType } from '@/types/certification';
import { format, differenceInDays, isPast } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

const CERT_TYPES: CertificationType[] = [
  'ISO',
  'Regulatory / Compliance',
  'Industry',
  'Customer-Specific Approval',
];

const CERT_NAME_PRESETS: Record<CertificationType, string[]> = {
  'ISO': [
    'ISO 9001:2015 (Quality Management)',
    'ISO 14001:2015 (Environmental Management)',
    'ISO 45001:2018 (OH&S Management)',
    'ISO 22000:2018 (Food Safety Management)',
    'ISO 50001:2018 (Energy Management)',
    'ISO 13485:2016 (Medical Devices QMS)',
    'ISO/TS 16949 (Automotive QMS)',
    'IATF 16949:2016 (Automotive QMS)',
    'ISO 17025 (Testing & Calibration Labs)',
    'ISO 22716 (Cosmetics GMP)',
  ],
  'Regulatory / Compliance': [
    'REACH Registration',
    'REACH SVHC Compliant',
    'RoHS Compliant',
    'FDA 21 CFR 177 (Food Contact)',
    'FDA 21 CFR 178 (Indirect Additives)',
    'EU 10/2011 (Food Contact Materials)',
    'EU 1907/2006 (REACH)',
    'TSCA (US Toxic Substances)',
    'K-REACH (Korea)',
    'China REACH (MEE Order 12)',
    'OSHA SDS Compliant',
    'CLP / GHS Compliant',
    'California Prop 65 Compliant',
    'WEEE Compliant',
    'CPSIA Compliant',
    'EN 71 (Toy Safety)',
    'EC 1935/2004 (Food Contact)',
    'BPR (Biocidal Products)',
    'PIC Regulation (EU 649/2012)',
    'GADSL Compliant (Automotive)',
  ],
  'Industry': [
    'Kosher Certified',
    'Halal Certified',
    'NSF International',
    'NSF/ANSI 61 (Drinking Water)',
    'UL Listed',
    'UL Recognized',
    'RSPO (Sustainable Palm Oil)',
    'ISCC PLUS',
    'GRS (Global Recycled Standard)',
    'RCS (Recycled Claim Standard)',
    'Cradle to Cradle',
    'EcoVadis Rating',
    'Responsible Care',
    'ACC Plastics Division',
    'BRC Global Standard',
    'SQF (Safe Quality Food)',
    'FSSC 22000',
    'FAMI-QS (Feed Additives)',
    'GMP+ (Feed Safety)',
    'EuCertPlast',
    'RAL Quality Mark',
    'Blue Angel (Blauer Engel)',
    'Nordic Swan Ecolabel',
    'EU Ecolabel',
    'PEFC Chain of Custody',
    'FSC Chain of Custody',
    'Organic Certified (USDA/EU)',
    'Bonsucro Certified',
    'REDcert',
    'TÜV Rheinland Certified',
  ],
  'Customer-Specific Approval': [
    'Customer Qualification Approval',
    'Vendor Approval Certificate',
    'Product Specification Approval',
    'First Article Inspection (FAI)',
    'PPAP (Production Part Approval)',
    'Customer CoA Approval',
  ],
};

function getCertStatus(expiryDate: string): { label: string; color: string; bgColor: string } {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const daysUntilExpiry = differenceInDays(expiry, today);

  if (isPast(expiry) || daysUntilExpiry < 0) {
    return { label: 'Expired', color: '#DC2626', bgColor: '#FEE2E2' };
  }
  if (daysUntilExpiry <= 30) {
    return { label: 'Expiring Soon', color: '#DC2626', bgColor: '#FEE2E2' };
  }
  if (daysUntilExpiry <= 90) {
    return { label: 'Expiring Soon', color: '#D97706', bgColor: '#FEF3C7' };
  }
  return { label: 'Active', color: '#059669', bgColor: '#D1FAE5' };
}

const emptyCert = {
  certificationType: 'ISO' as CertificationType,
  certificationName: '',
  issuingBody: '',
  certificateNumber: '',
  issueDate: '',
  expiryDate: '',
  documentName: '',
  documentUrl: '',
  notes: '',
};

interface Props {
  productId: string;
}

export default function ProductCertifications({ productId }: Props) {
  const allCertifications = useCertificationStore((s) => s.certifications);
  const addCertification = useCertificationStore((s) => s.addCertification);
  const updateCertification = useCertificationStore((s) => s.updateCertification);
  const deleteCertification = useCertificationStore((s) => s.deleteCertification);
  const certifications = useMemo(() => allCertifications.filter((c) => c.productId === productId), [allCertifications, productId]);
  const settings = useSettingsStore((s) => s.settings);
  const canEdit = settings.currentRole === 'sales_manager' || settings.currentRole === 'account_manager';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyCert);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleOpen = (cert?: Certification) => {
    if (cert) {
      setEditingId(cert.id);
      setForm({
        certificationType: cert.certificationType,
        certificationName: cert.certificationName,
        issuingBody: cert.issuingBody,
        certificateNumber: cert.certificateNumber,
        issueDate: cert.issueDate,
        expiryDate: cert.expiryDate,
        documentName: cert.documentName,
        documentUrl: cert.documentUrl,
        notes: cert.notes,
      });
    } else {
      setEditingId(null);
      setForm(emptyCert);
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    if (editingId) {
      updateCertification(editingId, form);
    } else {
      addCertification({
        id: uuidv4(),
        productId,
        ...form,
        documentName: form.documentName || `${form.certificationName}.pdf`,
        documentUrl: form.documentUrl || '#',
        createdAt: now,
        updatedAt: now,
      });
    }
    setDialogOpen(false);
    setForm(emptyCert);
    setEditingId(null);
  };

  const handleDelete = () => {
    if (deletingId) {
      deleteCertification(deletingId);
    }
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const sorted = [...certifications].sort((a, b) => {
    const sa = getCertStatus(a.expiryDate);
    const sb = getCertStatus(b.expiryDate);
    const order = { Expired: 0, 'Expiring Soon': 1, Active: 2 };
    return (order[sa.label as keyof typeof order] ?? 2) - (order[sb.label as keyof typeof order] ?? 2);
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#111827' }}>
            Certifications
          </Typography>
          <Chip
            label={certifications.length}
            size="small"
            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#F3F4F6', color: '#6B7280' }}
          />
        </Box>
        {canEdit && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            sx={{ fontSize: '0.7rem' }}
          >
            Add Certification
          </Button>
        )}
      </Box>

      {sorted.length === 0 ? (
        <Paper variant="outlined">
          <EmptyState
            message="No certifications added yet."
            action={
              canEdit ? (
                <Button size="small" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                  Add Certification
                </Button>
              ) : undefined
            }
          />
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Issuing Body</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Certificate #</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Issue Date</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Expiry Date</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Document</TableCell>
                {canEdit && <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }} align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((cert) => {
                const status = getCertStatus(cert.expiryDate);
                return (
                  <TableRow key={cert.id} hover>
                    <TableCell sx={{ fontSize: '0.8rem' }}>
                      <Chip
                        label={cert.certificationType}
                        size="small"
                        sx={{ fontSize: '0.65rem', fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{cert.certificationName}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{cert.issuingBody}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                      {cert.certificateNumber || '\u2014'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>
                      {cert.issueDate ? format(new Date(cert.issueDate), 'MMM d, yyyy') : '\u2014'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>
                      {cert.expiryDate ? format(new Date(cert.expiryDate), 'MMM d, yyyy') : '\u2014'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={status.label}
                        size="small"
                        sx={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          color: status.color,
                          bgcolor: status.bgColor,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" title={cert.documentName}>
                        <DescriptionIcon fontSize="small" sx={{ color: '#6B7280' }} />
                      </IconButton>
                    </TableCell>
                    {canEdit && (
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleOpen(cert)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setDeletingId(cert.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Certification' : 'Add Certification'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            select
            label="Certification Type"
            value={form.certificationType}
            onChange={(e) => setForm({ ...form, certificationType: e.target.value as CertificationType })}
            size="small"
            fullWidth
          >
            {CERT_TYPES.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </TextField>
          <Autocomplete
            freeSolo
            options={CERT_NAME_PRESETS[form.certificationType] || []}
            value={form.certificationName}
            onChange={(_, newValue) => setForm({ ...form, certificationName: newValue || '' })}
            onInputChange={(_, newValue) => setForm({ ...form, certificationName: newValue })}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Certification Name"
                placeholder="Select or type a certification name"
                size="small"
                required
              />
            )}
          />
          <TextField
            label="Issuing Body"
            value={form.issuingBody}
            onChange={(e) => setForm({ ...form, issuingBody: e.target.value })}
            size="small"
            fullWidth
            required
          />
          <TextField
            label="Certificate Number"
            value={form.certificateNumber}
            onChange={(e) => setForm({ ...form, certificateNumber: e.target.value })}
            size="small"
            fullWidth
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Issue Date"
              type="date"
              value={form.issueDate}
              onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              required
            />
            <TextField
              label="Expiry Date"
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              required
            />
          </Box>
          <TextField
            label="Document Name"
            placeholder="e.g. ISO_9001_Certificate.pdf"
            value={form.documentName}
            onChange={(e) => setForm({ ...form, documentName: e.target.value })}
            size="small"
            fullWidth
            helperText="Simulated file reference"
          />
          <TextField
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            size="small"
            fullWidth
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.certificationName || !form.issuingBody || !form.issueDate || !form.expiryDate}
          >
            {editingId ? 'Save Changes' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Certification</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this certification? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
