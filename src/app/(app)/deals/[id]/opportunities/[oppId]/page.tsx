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
import Tooltip from '@mui/material/Tooltip';
import LinearProgress from '@mui/material/LinearProgress';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LanguageIcon from '@mui/icons-material/Language';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/EventNote';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PageHeader from '@/components/shared/PageHeader';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useDealStore } from '@/stores/dealStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useOpportunityStore } from '@/stores/opportunityStore';
import { useProductStore } from '@/stores/productStore';
import { useOfferStore } from '@/stores/offerStore';
import { useOrderStore } from '@/stores/orderStore';
import { useActivityStore } from '@/stores/activityStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHydration } from '@/hooks/useHydration';
import { v4 as uuidv4 } from 'uuid';
import type { OpportunityStatus, OpportunityLine } from '@/types';

const statusColors: Record<OpportunityStatus, string> = {
  Open: '#2563EB',
  Qualified: '#7C3AED',
  Converted: '#059669',
  Lost: '#DC2626',
};

const statusBgColors: Record<OpportunityStatus, string> = {
  Open: '#DBEAFE',
  Qualified: '#EDE9FE',
  Converted: '#D1FAE5',
  Lost: '#FEE2E2',
};

const priorityColors: Record<string, string> = {
  High: '#DC2626',
  Medium: '#F59E0B',
  Low: '#6B7280',
};

const priorityBgColors: Record<string, string> = {
  High: '#FEE2E2',
  Medium: '#FEF3C7',
  Low: '#F3F4F6',
};

const sourceIcons: Record<string, React.ReactNode> = {
  Email: <EmailIcon sx={{ fontSize: 14 }} />,
  Phone: <PhoneIcon sx={{ fontSize: 14 }} />,
  Website: <LanguageIcon sx={{ fontSize: 14 }} />,
  Referral: <PersonIcon sx={{ fontSize: 14 }} />,
  'Trade Show': <EventIcon sx={{ fontSize: 14 }} />,
  Other: <LocalOfferIcon sx={{ fontSize: 14 }} />,
};

const ALL_STATUSES: OpportunityStatus[] = ['Open', 'Qualified', 'Converted', 'Lost'];

export default function OpportunityDetailPage() {
  const hydrated = useHydration();
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  const oppId = params.oppId as string;

  // Stores
  const getDealById = useDealStore((s) => s.getDealById);
  const getCustomerById = useCustomerStore((s) => s.getCustomerById);
  const getOpportunityById = useOpportunityStore((s) => s.getOpportunityById);
  const updateOpportunity = useOpportunityStore((s) => s.updateOpportunity);
  const deleteOpportunity = useOpportunityStore((s) => s.deleteOpportunity);
  const products = useProductStore((s) => s.products);
  const getOfferById = useOfferStore((s) => s.getOfferById);
  const getOrderById = useOrderStore((s) => s.getOrderById);
  const getActivitiesByEntity = useActivityStore((s) => s.getActivitiesByEntity);
  const getActivitiesByDeal = useActivityStore((s) => s.getActivitiesByDeal);
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
  const opportunity = getOpportunityById(oppId);
  const customer = deal ? getCustomerById(deal.customerId) : undefined;

  // Linked items
  const linkedOffer = opportunity?.convertedOfferId ? getOfferById(opportunity.convertedOfferId) : undefined;
  const linkedOrder = opportunity?.convertedOrderId ? getOrderById(opportunity.convertedOrderId) : undefined;

  // Activities for this opportunity
  const activities = useMemo(() => {
    const oppActivities = getActivitiesByEntity('opportunity', oppId);
    return [...oppActivities].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [getActivitiesByEntity, oppId]);

  // Summary
  const summary = useMemo(() => {
    if (!opportunity) return { estimatedValue: null, probability: 0, expectedClose: null, lineCount: 0 };
    return {
      estimatedValue: opportunity.estimatedValue,
      probability: opportunity.probability,
      expectedClose: opportunity.expectedCloseDate,
      lineCount: opportunity.lines.length,
    };
  }, [opportunity]);

  // Helpers
  const handleUpdate = (updates: Partial<typeof opportunity>) => {
    if (!opportunity) return;
    updateOpportunity(oppId, { ...updates, updatedAt: new Date().toISOString() });
  };

  const handleStatusChange = (newStatus: OpportunityStatus) => {
    if (!opportunity) return;
    const now = new Date().toISOString();
    updateOpportunity(oppId, { status: newStatus, updatedAt: now });
    addActivity({
      id: uuidv4(),
      entityType: 'opportunity',
      entityId: oppId,
      dealId,
      action: 'status_changed',
      details: `Opportunity status changed to ${newStatus}`,
      userId: settings.currentUser,
      timestamp: now,
    });
    setSnackbar(`Status updated to ${newStatus}`);
  };

  const handleTitleSave = () => {
    if (titleDraft.trim() && titleDraft.trim() !== opportunity?.title) {
      handleUpdate({ title: titleDraft.trim() });
      setSnackbar('Title updated');
    }
    setEditingTitle(false);
  };

  const handleDelete = () => {
    deleteOpportunity(oppId);
    addActivity({
      id: uuidv4(),
      entityType: 'opportunity',
      entityId: oppId,
      dealId,
      action: 'opportunity_deleted',
      details: `Opportunity "${opportunity?.title}" deleted`,
      userId: settings.currentUser,
      timestamp: new Date().toISOString(),
    });
    router.push(`/deals/${dealId}`);
  };

  // Line item management
  const handleAddLine = () => {
    if (!opportunity) return;
    const newLine: OpportunityLine = {
      id: uuidv4(),
      productId: '',
      productName: '',
      estimatedQty: null,
      targetPrice: null,
      notes: '',
    };
    handleUpdate({ lines: [...opportunity.lines, newLine] });
  };

  const handleUpdateLine = (lineId: string, updates: Partial<OpportunityLine>) => {
    if (!opportunity) return;
    const newLines = opportunity.lines.map((l) =>
      l.id === lineId ? { ...l, ...updates } : l
    );
    // Recalculate estimated value
    let estimatedValue: number | null = null;
    const hasValues = newLines.some((l) => l.estimatedQty !== null && l.targetPrice !== null);
    if (hasValues) {
      estimatedValue = newLines.reduce((sum, l) => {
        if (l.estimatedQty !== null && l.targetPrice !== null) {
          return sum + l.estimatedQty * l.targetPrice;
        }
        return sum;
      }, 0);
    }
    handleUpdate({ lines: newLines, estimatedValue });
  };

  const handleRemoveLine = (lineId: string) => {
    if (!opportunity) return;
    const newLines = opportunity.lines.filter((l) => l.id !== lineId);
    let estimatedValue: number | null = null;
    const hasValues = newLines.some((l) => l.estimatedQty !== null && l.targetPrice !== null);
    if (hasValues) {
      estimatedValue = newLines.reduce((sum, l) => {
        if (l.estimatedQty !== null && l.targetPrice !== null) {
          return sum + l.estimatedQty * l.targetPrice;
        }
        return sum;
      }, 0);
    }
    handleUpdate({ lines: newLines, estimatedValue });
  };

  if (!hydrated) return null;

  if (!deal || !opportunity) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          {!deal ? 'Deal not found.' : 'Opportunity not found.'}
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
                setTitleDraft(opportunity.title);
                setEditingTitle(true);
              }}
            >
              {opportunity.title}
            </Box>
          )
        }
        breadcrumbs={[
          { label: 'Pipeline', href: '/deals' },
          { label: deal.name, href: `/deals/${dealId}` },
          { label: opportunity.title },
        ]}
        actions={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select
                value={opportunity.status}
                onChange={(e) => handleStatusChange(e.target.value as OpportunityStatus)}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  bgcolor: statusBgColors[opportunity.status],
                  color: statusColors[opportunity.status],
                  '& .MuiSelect-icon': { color: statusColors[opportunity.status] },
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
                Delete Opportunity
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
            {/* Opportunity Info Card */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="h6">Opportunity Info</Typography>
                  <Chip
                    icon={sourceIcons[opportunity.source]}
                    label={opportunity.source}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={opportunity.priority}
                    size="small"
                    sx={{
                      bgcolor: priorityBgColors[opportunity.priority],
                      color: priorityColors[opportunity.priority],
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="caption" color="text.secondary">
                      Probability
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={opportunity.probability}
                        sx={{
                          flex: 1,
                          height: 8,
                          borderRadius: 4,
                          bgcolor: '#F3F4F6',
                          '& .MuiLinearProgress-bar': {
                            bgcolor:
                              opportunity.probability >= 70
                                ? '#059669'
                                : opportunity.probability >= 40
                                ? '#F59E0B'
                                : '#DC2626',
                          },
                        }}
                      />
                      <Typography variant="body2" fontWeight={600}>
                        {opportunity.probability}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="caption" color="text.secondary">
                      Expected Close Date
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {opportunity.expectedCloseDate
                        ? new Date(opportunity.expectedCloseDate).toLocaleDateString()
                        : '\u2014'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="caption" color="text.secondary">
                      Estimated Value
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {opportunity.estimatedValue !== null
                        ? `$${opportunity.estimatedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '\u2014'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="caption" color="text.secondary">
                      Contact Name
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {opportunity.contactName || '\u2014'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="caption" color="text.secondary">
                      Contact Email
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {opportunity.contactEmail || '\u2014'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="caption" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {new Date(opportunity.createdAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  {opportunity.competitorInfo && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary">
                        Competitor Info
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {opportunity.competitorInfo}
                      </Typography>
                    </Grid>
                  )}
                  {opportunity.notes && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary">
                        Notes
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {opportunity.notes}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Line Items Card */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    Line Items ({opportunity.lines.length})
                  </Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={handleAddLine}>
                    Add Line
                  </Button>
                </Box>
                {opportunity.lines.length === 0 ? (
                  <Typography color="text.secondary">No line items yet. Click Add Line to start.</Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Product</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Est. Qty</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Target Price</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                          <TableCell sx={{ fontWeight: 600, width: 48 }} />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {opportunity.lines.map((line) => (
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
                                value={line.estimatedQty ?? ''}
                                onChange={(e) =>
                                  handleUpdateLine(line.id, {
                                    estimatedQty: e.target.value ? Number(e.target.value) : null,
                                  })
                                }
                                inputProps={{ style: { textAlign: 'right' }, min: 0 }}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                size="small"
                                variant="standard"
                                type="number"
                                value={line.targetPrice ?? ''}
                                onChange={(e) =>
                                  handleUpdateLine(line.id, {
                                    targetPrice: e.target.value ? Number(e.target.value) : null,
                                  })
                                }
                                inputProps={{ style: { textAlign: 'right' }, min: 0 }}
                                sx={{ width: 90 }}
                              />
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

            {/* Related Items Card */}
            {(linkedOffer || linkedOrder) && (
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Related Items
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {linkedOffer && (
                      <Chip
                        icon={<LocalOfferIcon />}
                        label={`Offer: ${linkedOffer.name}`}
                        color="primary"
                        variant="outlined"
                        clickable
                        onClick={() =>
                          router.push(`/deals/${dealId}/offers/${linkedOffer.id}`)
                        }
                      />
                    )}
                    {linkedOrder && (
                      <Chip
                        icon={<ShoppingCartIcon />}
                        label={`Order: ${linkedOrder.orderNumber}`}
                        color="success"
                        variant="outlined"
                        clickable
                        onClick={() =>
                          router.push(`/deals/${dealId}`)
                        }
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Right Column */}
          <Grid size={{ xs: 12, md: 4 }}>
            {/* Summary Card */}
            <Card variant="outlined" sx={{ position: 'sticky', top: 24, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Summary
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Estimated Value
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {summary.estimatedValue !== null
                        ? `$${summary.estimatedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '\u2014'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Probability
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {summary.probability}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Expected Close
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {summary.expectedClose
                        ? new Date(summary.expectedClose).toLocaleDateString()
                        : '\u2014'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Line Items
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {summary.lineCount}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Convert Actions Card */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Convert
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Tooltip
                    title={
                      opportunity.status === 'Converted'
                        ? 'Already converted'
                        : opportunity.status === 'Lost'
                        ? 'Cannot convert a lost opportunity'
                        : ''
                    }
                  >
                    <span>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<LocalOfferIcon />}
                        disabled={opportunity.status === 'Converted' || opportunity.status === 'Lost'}
                        onClick={() => {
                          router.push(`/deals/${dealId}/offers/new`);
                        }}
                      >
                        Convert to Offer
                      </Button>
                    </span>
                  </Tooltip>
                  <Tooltip
                    title={
                      opportunity.status === 'Converted'
                        ? 'Already converted'
                        : opportunity.status === 'Lost'
                        ? 'Cannot convert a lost opportunity'
                        : ''
                    }
                  >
                    <span>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<ShoppingCartIcon />}
                        disabled={opportunity.status === 'Converted' || opportunity.status === 'Lost'}
                        onClick={() => {
                          setSnackbar('Order conversion coming soon');
                        }}
                      >
                        Convert to Order
                      </Button>
                    </span>
                  </Tooltip>
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
            <Typography variant="h6" sx={{ mb: 2 }}>
              Activity Log
            </Typography>
            {activities.length === 0 ? (
              <Typography color="text.secondary">No activity recorded for this opportunity yet.</Typography>
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
        title="Delete Opportunity"
        message={`Are you sure you want to delete "${opportunity.title}"? This action cannot be undone.`}
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
