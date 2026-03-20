'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import Snackbar from '@mui/material/Snackbar';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbsUpDownIcon from '@mui/icons-material/ThumbsUpDown';
import PageHeader from '@/components/shared/PageHeader';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useDealStore } from '@/stores/dealStore';
import { useSampleStore } from '@/stores/sampleStore';
import { useProductStore } from '@/stores/productStore';
import { useActivityStore } from '@/stores/activityStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHydration } from '@/hooks/useHydration';
import { v4 as uuidv4 } from 'uuid';
import type { SampleStatus, SampleLine } from '@/types';

const statusColors: Record<SampleStatus, string> = {
  Requested: '#2563EB',
  Sent: '#F59E0B',
  Received: '#7C3AED',
  Approved: '#059669',
  Rejected: '#DC2626',
};

const statusBgColors: Record<SampleStatus, string> = {
  Requested: '#EFF6FF',
  Sent: '#FFFBEB',
  Received: '#F5F3FF',
  Approved: '#ECFDF5',
  Rejected: '#FEF2F2',
};

const ALL_STATUSES: SampleStatus[] = ['Requested', 'Sent', 'Received', 'Approved', 'Rejected'];
const UNITS: SampleLine['unit'][] = ['MT', 'KG', 'g', 'pcs'];

export default function SampleDetailPage() {
  const hydrated = useHydration();
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  const sampleId = params.sampleId as string;

  // Stores
  const getDealById = useDealStore((s) => s.getDealById);
  const getSampleById = useSampleStore((s) => s.getSampleById);
  const updateSample = useSampleStore((s) => s.updateSample);
  const deleteSample = useSampleStore((s) => s.deleteSample);
  const products = useProductStore((s) => s.products);
  const getActivitiesByEntity = useActivityStore((s) => s.getActivitiesByEntity);
  const addActivity = useActivityStore((s) => s.addActivity);
  const settings = useSettingsStore((s) => s.settings);

  // Local state
  const [viewTab, setViewTab] = useState(0);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const deal = getDealById(dealId);
  const sample = getSampleById(sampleId);

  // Activities for this sample
  const activities = useMemo(() => {
    const sampleActivities = getActivitiesByEntity('sample', sampleId);
    return [...sampleActivities].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [getActivitiesByEntity, sampleId]);

  // Helpers
  const handleUpdate = (updates: Partial<typeof sample>) => {
    if (!sample) return;
    updateSample(sampleId, { ...updates, updatedAt: new Date().toISOString() } as any);
  };

  const handleStatusChange = (newStatus: SampleStatus) => {
    if (!sample) return;
    const now = new Date().toISOString();
    const dateUpdates: any = {};
    if (newStatus === 'Sent' && !sample.sentDate) dateUpdates.sentDate = now;
    if (newStatus === 'Received' && !sample.receivedDate) dateUpdates.receivedDate = now;
    updateSample(sampleId, { status: newStatus, ...dateUpdates, updatedAt: now });
    addActivity({
      id: uuidv4(),
      entityType: 'sample',
      entityId: sampleId,
      dealId,
      action: 'status_changed',
      details: `Sample status changed to ${newStatus}`,
      userId: settings.currentUser,
      timestamp: now,
    });
    setSnackbar(`Status updated to ${newStatus}`);
  };

  const handleTitleSave = () => {
    if (titleDraft.trim() && titleDraft.trim() !== sample?.name) {
      handleUpdate({ name: titleDraft.trim() });
      setSnackbar('Name updated');
    }
    setEditingTitle(false);
  };

  const handleDelete = () => {
    deleteSample(sampleId);
    addActivity({
      id: uuidv4(),
      entityType: 'sample',
      entityId: sampleId,
      dealId,
      action: 'sample_deleted',
      details: `Sample "${sample?.name}" deleted`,
      userId: settings.currentUser,
      timestamp: new Date().toISOString(),
    });
    router.push(`/deals/${dealId}`);
  };

  // Line item management
  const handleAddLine = () => {
    if (!sample) return;
    const newLine: SampleLine = {
      id: uuidv4(),
      productId: '',
      productName: '',
      quantity: null,
      unit: 'KG',
      notes: '',
    };
    handleUpdate({ lines: [...sample.lines, newLine] });
  };

  const handleUpdateLine = (lineId: string, updates: Partial<SampleLine>) => {
    if (!sample) return;
    const newLines = sample.lines.map((l) =>
      l.id === lineId ? { ...l, ...updates } : l
    );
    handleUpdate({ lines: newLines });
  };

  const handleRemoveLine = (lineId: string) => {
    if (!sample) return;
    const newLines = sample.lines.filter((l) => l.id !== lineId);
    handleUpdate({ lines: newLines });
  };

  if (!hydrated) return null;

  if (!deal || !sample) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          {!deal ? 'Deal not found.' : 'Sample not found.'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={
          editingTitle ? (
            <TextField
              autoFocus
              size="small"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') setEditingTitle(false);
              }}
              sx={{ minWidth: 300 }}
            />
          ) : (
            <Box
              sx={{ cursor: 'pointer', '&:hover': { opacity: 0.7 } }}
              onClick={() => {
                setTitleDraft(sample.name);
                setEditingTitle(true);
              }}
            >
              {sample.name}
            </Box>
          )
        }
        breadcrumbs={[
          { label: 'Pipeline', href: '/deals' },
          { label: deal.name, href: `/deals/${dealId}` },
          { label: sample.name },
        ]}
        actions={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select
                value={sample.status}
                onChange={(e) => handleStatusChange(e.target.value as SampleStatus)}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  bgcolor: statusBgColors[sample.status],
                  color: statusColors[sample.status],
                  '& .MuiSelect-icon': { color: statusColors[sample.status] },
                }}
              >
                {ALL_STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: statusColors[s] }} />
                      {s}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
              <MoreVertIcon />
            </IconButton>
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  setConfirmDelete(true);
                }}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                Delete Sample
              </MenuItem>
            </Menu>
          </Box>
        }
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={viewTab} onChange={(_, v) => setViewTab(v)}>
          <Tab label="Details" sx={{ minHeight: 48 }} />
          <Tab label="Activity" sx={{ minHeight: 48 }} />
        </Tabs>
      </Box>

      {/* ========== Details Tab ========== */}
      {viewTab === 0 && (
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Sample Info Card */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Sample Info</Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">Status</Typography>
                    <Box>
                      <Chip
                        label={sample.status}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          color: statusColors[sample.status],
                          bgcolor: statusBgColors[sample.status],
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">Requested Date</Typography>
                    <TextField
                      size="small"
                      type="date"
                      fullWidth
                      variant="standard"
                      value={sample.requestedDate ? sample.requestedDate.slice(0, 10) : ''}
                      onChange={(e) => handleUpdate({ requestedDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">Sent Date</Typography>
                    <TextField
                      size="small"
                      type="date"
                      fullWidth
                      variant="standard"
                      value={sample.sentDate ? sample.sentDate.slice(0, 10) : ''}
                      onChange={(e) => handleUpdate({ sentDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">Received Date</Typography>
                    <TextField
                      size="small"
                      type="date"
                      fullWidth
                      variant="standard"
                      value={sample.receivedDate ? sample.receivedDate.slice(0, 10) : ''}
                      onChange={(e) => handleUpdate({ receivedDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">Notes</Typography>
                    <TextField
                      size="small"
                      fullWidth
                      variant="standard"
                      multiline
                      minRows={2}
                      value={sample.notes}
                      onChange={(e) => handleUpdate({ notes: e.target.value })}
                      placeholder="Add notes..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Products Card */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    Products ({sample.lines.length})
                  </Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={handleAddLine}>
                    Add Line
                  </Button>
                </Box>
                {sample.lines.length === 0 ? (
                  <Typography color="text.secondary">No products yet. Click Add Line to start.</Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Product</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Qty</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Unit</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                          <TableCell sx={{ fontWeight: 600, width: 48 }} />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sample.lines.map((line) => (
                          <TableRow key={line.id}>
                            <TableCell>
                              <Autocomplete
                                size="small"
                                freeSolo
                                options={products}
                                getOptionLabel={(option) =>
                                  typeof option === 'string'
                                    ? option
                                    : `${option.name} (${option.code})`
                                }
                                value={
                                  line.productId
                                    ? products.find((p) => p.id === line.productId) || line.productName
                                    : line.productName || ''
                                }
                                onChange={(_, newValue) => {
                                  if (newValue && typeof newValue !== 'string') {
                                    handleUpdateLine(line.id, {
                                      productId: newValue.id,
                                      productName: newValue.name,
                                    });
                                  }
                                }}
                                onInputChange={(_, inputValue, reason) => {
                                  if (reason === 'input') {
                                    handleUpdateLine(line.id, {
                                      productId: '',
                                      productName: inputValue,
                                    });
                                  }
                                }}
                                renderInput={(params) => (
                                  <TextField {...params} placeholder="Search or type..." variant="standard" />
                                )}
                                sx={{ minWidth: 180 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                size="small"
                                variant="standard"
                                type="number"
                                value={line.quantity ?? ''}
                                onChange={(e) =>
                                  handleUpdateLine(line.id, {
                                    quantity: e.target.value ? Number(e.target.value) : null,
                                  })
                                }
                                inputProps={{ style: { textAlign: 'right' }, min: 0 }}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                size="small"
                                variant="standard"
                                value={line.unit}
                                onChange={(e) => handleUpdateLine(line.id, { unit: e.target.value as SampleLine['unit'] })}
                                sx={{ minWidth: 60 }}
                              >
                                {UNITS.map((u) => (
                                  <MenuItem key={u} value={u}>{u}</MenuItem>
                                ))}
                              </Select>
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                variant="standard"
                                value={line.notes}
                                onChange={(e) => handleUpdateLine(line.id, { notes: e.target.value })}
                                placeholder="Notes..."
                                fullWidth
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton size="small" onClick={() => handleRemoveLine(line.id)} color="error">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>

            {/* Shipping Card */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Shipping</Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">Street</Typography>
                    <TextField
                      size="small"
                      fullWidth
                      variant="standard"
                      value={sample.shippingAddress.street}
                      onChange={(e) => handleUpdate({ shippingAddress: { ...sample.shippingAddress, street: e.target.value } })}
                      placeholder="Street address..."
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">City</Typography>
                    <TextField
                      size="small"
                      fullWidth
                      variant="standard"
                      value={sample.shippingAddress.city}
                      onChange={(e) => handleUpdate({ shippingAddress: { ...sample.shippingAddress, city: e.target.value } })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">State</Typography>
                    <TextField
                      size="small"
                      fullWidth
                      variant="standard"
                      value={sample.shippingAddress.state}
                      onChange={(e) => handleUpdate({ shippingAddress: { ...sample.shippingAddress, state: e.target.value } })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">Postal Code</Typography>
                    <TextField
                      size="small"
                      fullWidth
                      variant="standard"
                      value={sample.shippingAddress.postalCode}
                      onChange={(e) => handleUpdate({ shippingAddress: { ...sample.shippingAddress, postalCode: e.target.value } })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">Country</Typography>
                    <TextField
                      size="small"
                      fullWidth
                      variant="standard"
                      value={sample.shippingAddress.country}
                      onChange={(e) => handleUpdate({ shippingAddress: { ...sample.shippingAddress, country: e.target.value } })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">Carrier</Typography>
                    <TextField
                      size="small"
                      fullWidth
                      variant="standard"
                      value={sample.carrier}
                      onChange={(e) => handleUpdate({ carrier: e.target.value })}
                      placeholder="e.g. FedEx, UPS..."
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">Tracking Number</Typography>
                    <TextField
                      size="small"
                      fullWidth
                      variant="standard"
                      value={sample.trackingNumber}
                      onChange={(e) => handleUpdate({ trackingNumber: e.target.value })}
                      placeholder="Tracking number..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Feedback Card */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Feedback</Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">Feedback Rating</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      {([
                        { value: 'positive' as const, icon: <ThumbUpIcon />, color: '#059669', bg: '#ECFDF5', label: 'Positive' },
                        { value: 'neutral' as const, icon: <ThumbsUpDownIcon />, color: '#F59E0B', bg: '#FFFBEB', label: 'Neutral' },
                        { value: 'negative' as const, icon: <ThumbDownIcon />, color: '#DC2626', bg: '#FEF2F2', label: 'Negative' },
                      ]).map((opt) => (
                        <Button
                          key={opt.value}
                          variant={sample.feedbackRating === opt.value ? 'contained' : 'outlined'}
                          size="small"
                          startIcon={opt.icon}
                          onClick={() => handleUpdate({ feedbackRating: sample.feedbackRating === opt.value ? null : opt.value })}
                          sx={{
                            bgcolor: sample.feedbackRating === opt.value ? opt.bg : undefined,
                            color: sample.feedbackRating === opt.value ? opt.color : 'text.secondary',
                            borderColor: sample.feedbackRating === opt.value ? opt.color : 'divider',
                            '&:hover': {
                              bgcolor: opt.bg,
                              borderColor: opt.color,
                            },
                          }}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">Feedback</Typography>
                    <TextField
                      size="small"
                      fullWidth
                      variant="standard"
                      multiline
                      minRows={3}
                      value={sample.feedback}
                      onChange={(e) => handleUpdate({ feedback: e.target.value })}
                      placeholder="Customer feedback on the sample..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column */}
          <Grid size={{ xs: 12, md: 4 }}>
            {/* Summary Card */}
            <Card variant="outlined" sx={{ position: 'sticky', top: 24, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Summary</Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip
                      label={sample.status}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: 22,
                        color: statusColors[sample.status],
                        bgcolor: statusBgColors[sample.status],
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Products</Typography>
                    <Typography variant="body2" fontWeight={600}>{sample.lines.length}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Requested Date</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {sample.requestedDate ? new Date(sample.requestedDate).toLocaleDateString() : '\u2014'}
                    </Typography>
                  </Box>
                  {sample.carrier && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Carrier</Typography>
                      <Typography variant="body2" fontWeight={500}>{sample.carrier}</Typography>
                    </Box>
                  )}
                  {sample.trackingNumber && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Tracking</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {sample.trackingNumber}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ========== Activity Tab ========== */}
      {viewTab === 1 && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Activity Log</Typography>
            {activities.length === 0 ? (
              <Typography color="text.secondary">No activity recorded for this sample yet.</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {activities.map((activity) => (
                  <Box
                    key={activity.id}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: '#FAFBFC',
                      border: '1px solid #F3F4F6',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {activity.details}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {activity.userId}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {new Date(activity.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip label={activity.action.replace(/_/g, ' ')} size="small" variant="outlined" />
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        open={confirmDelete}
        title="Delete Sample"
        message={`Are you sure you want to delete "${sample.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        color="error"
      />

      <Snackbar
        open={!!snackbar}
        autoHideDuration={2000}
        onClose={() => setSnackbar('')}
        message={snackbar}
      />
    </Box>
  );
}
