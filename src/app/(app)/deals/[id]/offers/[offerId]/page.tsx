'use client';

import { useMemo } from 'react';
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
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ShareIcon from '@mui/icons-material/Share';
import LinkIcon from '@mui/icons-material/Link';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import PageHeader from '@/components/shared/PageHeader';
import StatusChip from '@/components/shared/StatusChip';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import OfferAnalyticsDashboard from '@/components/offers/OfferAnalyticsDashboard';
import ModuleRenderer from '@/components/offers/modules/ModuleRenderer';
import BrandedHeader from '@/components/offers/modules/BrandedHeader';
import { migrateModules } from '@/lib/migrateModules';
import { useOfferBuilderSettingsStore } from '@/stores/offerBuilderSettingsStore';
import { useOfferTemplateStore } from '@/stores/offerTemplateStore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useDealStore } from '@/stores/dealStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useOfferStore } from '@/stores/offerStore';
import { useOrderStore } from '@/stores/orderStore';
import { useProductStore } from '@/stores/productStore';
import { usePricingStore } from '@/stores/pricingStore';
import { useActivityStore } from '@/stores/activityStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useOfferShareStore } from '@/stores/offerShareStore';
import { useHydration } from '@/hooks/useHydration';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { useState } from 'react';

export default function ViewOfferPage() {
  const hydrated = useHydration();
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  const offerId = params.offerId as string;

  const getDealById = useDealStore((s) => s.getDealById);
  const updateDeal = useDealStore((s) => s.updateDeal);
  const getCustomerById = useCustomerStore((s) => s.getCustomerById);
  const getOfferById = useOfferStore((s) => s.getOfferById);
  const updateOffer = useOfferStore((s) => s.updateOffer);
  const duplicateAsNewVersion = useOfferStore((s) => s.duplicateAsNewVersion);
  const getProductById = useProductStore((s) => s.getProductById);
  const getMSPForProduct = usePricingStore((s) => s.getMSPForProduct);
  const addActivity = useActivityStore((s) => s.addActivity);
  const settings = useSettingsStore((s) => s.settings);

  const addOrder = useOrderStore((s) => s.addOrder);
  const getOrderByOffer = useOrderStore((s) => s.getOrderByOffer);

  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'send' | null>(null);
  const [viewTab, setViewTab] = useState(0);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [snackbar, setSnackbar] = useState('');

  const brandProfiles = useOfferBuilderSettingsStore((s) => s.brandProfiles);
  const allTemplates = useOfferTemplateStore((s) => s.templates);
  const createShareLink = useOfferShareStore((s) => s.createShareLink);
  const getShareLinksByOffer = useOfferShareStore((s) => s.getShareLinksByOffer);
  const getBuyerResponsesByOffer = useOfferShareStore((s) => s.getBuyerResponsesByOffer);

  const deal = getDealById(dealId);
  const customer = deal ? getCustomerById(deal.customerId) : undefined;
  const offer = getOfferById(offerId);

  const currentMonth = format(new Date(), 'yyyy-MM');

  const isSalesManager = settings.currentRole === 'sales_manager';
  const canApproveReject = isSalesManager && offer && (offer.status === 'Sent' || offer.status === 'Pending');
  const canEdit = offer?.status === 'Draft';
  const canSend = offer?.status === 'Draft';
  const canDuplicate = offer && (offer.status === 'Sent' || offer.status === 'Rejected' || offer.status === 'Approved');

  const summary = useMemo(() => {
    if (!offer) return { totalLines: 0, totalValue: 0, avgMargin: null as number | null, belowMSPCount: 0, missingQtyCount: 0 };
    const totalLines = offer.lines.length;
    let totalValue = 0;
    const margins: number[] = [];
    let belowMSPCount = 0;
    let missingQtyCount = 0;

    offer.lines.forEach((line) => {
      if (line.quantity !== null && line.quantity > 0) {
        totalValue += line.pricePerUnit * line.quantity;
      } else {
        missingQtyCount++;
      }
      const mspEntry = getMSPForProduct(line.productId, currentMonth);
      if (mspEntry) {
        if (line.pricePerUnit < mspEntry.price) belowMSPCount++;
        if (line.pricePerUnit > 0) {
          margins.push(((line.pricePerUnit - mspEntry.price) / line.pricePerUnit) * 100);
        }
      }
    });

    const avgMargin = margins.length > 0 ? margins.reduce((a, b) => a + b, 0) / margins.length : null;
    return { totalLines, totalValue, avgMargin, belowMSPCount, missingQtyCount };
  }, [offer, getMSPForProduct, currentMonth]);

  const handleApprove = () => {
    if (!offer) return;
    const now = new Date().toISOString();
    updateOffer(offerId, { status: 'Approved', updatedAt: now });
    updateDeal(dealId, { status: 'Won', updatedAt: now });
    addActivity({
      id: uuidv4(), entityType: 'offer', entityId: offerId, dealId,
      action: 'offer_approved', details: 'Offer approved by sales manager',
      userId: settings.currentUser, timestamp: now,
    });
    setConfirmAction(null);
  };

  const handleReject = () => {
    if (!offer) return;
    const now = new Date().toISOString();
    updateOffer(offerId, { status: 'Rejected', updatedAt: now });
    addActivity({
      id: uuidv4(), entityType: 'offer', entityId: offerId, dealId,
      action: 'offer_rejected', details: 'Offer rejected by sales manager',
      userId: settings.currentUser, timestamp: now,
    });
    setConfirmAction(null);
  };

  const handleSend = () => {
    if (!offer) return;
    const now = new Date().toISOString();
    updateOffer(offerId, { status: 'Sent', sentAt: now, updatedAt: now });
    updateDeal(dealId, { status: 'Active', updatedAt: now });
    addActivity({
      id: uuidv4(), entityType: 'offer', entityId: offerId, dealId,
      action: 'offer_sent', details: 'Offer sent to customer',
      userId: settings.currentUser, timestamp: now,
    });
    setConfirmAction(null);
  };

  const handleDuplicate = () => {
    if (!offer) return;
    const newId = uuidv4();
    const newOffer = duplicateAsNewVersion(offerId, newId);
    if (newOffer) {
      addActivity({
        id: uuidv4(), entityType: 'offer', entityId: newId, dealId,
        action: 'offer_created', details: `Offer V${newOffer.version} created as duplicate`,
        userId: settings.currentUser, timestamp: new Date().toISOString(),
      });
      router.push(`/deals/${dealId}/offers/${newId}/edit`);
    }
  };

  const handleConfirm = () => {
    if (confirmAction === 'approve') handleApprove();
    else if (confirmAction === 'reject') handleReject();
    else if (confirmAction === 'send') handleSend();
  };

  const handleShare = () => {
    if (!offer) return;
    const existingLinks = getShareLinksByOffer(offerId);
    let token: string;
    if (existingLinks.length > 0) {
      token = existingLinks[0].token;
    } else {
      const link = createShareLink(offerId, dealId, settings.currentUser);
      token = link.token;
      addActivity({
        id: uuidv4(), entityType: 'offer', entityId: offerId, dealId,
        action: 'offer_shared', details: `Share link created for "${offer.name}"`,
        userId: settings.currentUser, timestamp: new Date().toISOString(),
      });
    }
    const url = `${window.location.origin}/offer/${token}`;
    setShareUrl(url);
    setShareDialogOpen(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setSnackbar('Link copied to clipboard');
  };

  const existingOrder = offer ? getOrderByOffer(offerId) : undefined;
  const canConvertToOrder = offer?.status === 'Approved' && !existingOrder;

  const handleConvertToOrder = () => {
    if (!offer || !deal) return;
    const orderId = uuidv4();
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
    addOrder({
      id: orderId,
      orderNumber,
      offerId: offer.id,
      dealId: deal.id,
      customerId: deal.customerId,
      status: 'Created',
      createdAt: new Date().toISOString(),
    });
    addActivity({
      id: uuidv4(),
      entityType: 'order',
      entityId: orderId,
      dealId: deal.id,
      action: 'order_created',
      details: `Order ${orderNumber} created from offer V${offer.version}`,
      userId: settings.currentUser,
      timestamp: new Date().toISOString(),
    });
    setSnackbar(`Order ${orderNumber} created`);
  };

  const buyerResponses = offer ? getBuyerResponsesByOffer(offerId) : [];

  if (!hydrated) return null;

  if (!deal || !offer) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          {!deal ? 'Deal not found.' : 'Offer not found.'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={offer.name}
        breadcrumbs={[
          { label: 'Pipeline', href: '/deals' },
          { label: deal.name, href: `/deals/${dealId}` },
          { label: offer.name },
        ]}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {canEdit && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => router.push(`/deals/${dealId}/offers/${offerId}/edit`)}
              >
                Edit
              </Button>
            )}
            {canSend && (
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={() => setConfirmAction('send')}
              >
                Send
              </Button>
            )}
            {canApproveReject && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => setConfirmAction('approve')}
                >
                  Approve
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => setConfirmAction('reject')}
                >
                  Reject
                </Button>
              </>
            )}
            {canDuplicate && (
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={handleDuplicate}
              >
                Duplicate
              </Button>
            )}
            {canConvertToOrder && (
              <Button
                variant="contained"
                color="success"
                startIcon={<ShoppingCartIcon />}
                onClick={handleConvertToOrder}
              >
                Convert to Order
              </Button>
            )}
            {existingOrder && (
              <Chip
                icon={<ShoppingCartIcon />}
                label={`Order: ${existingOrder.orderNumber}`}
                color="success"
                variant="outlined"
              />
            )}
            {offer && (offer.status === 'Sent' || offer.status === 'Approved' || offer.status === 'Pending') && (
              <Button
                variant="outlined"
                startIcon={<ShareIcon />}
                onClick={handleShare}
              >
                Share
              </Button>
            )}
          </Box>
        }
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={viewTab} onChange={(_, v) => setViewTab(v)}>
          <Tab icon={<VisibilityIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Preview" sx={{ minHeight: 48 }} />
          <Tab label="Details" />
          <Tab label={`Buyer Responses${buyerResponses.length > 0 ? ` (${buyerResponses.length})` : ''}`} />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      {/* Preview Tab */}
      {viewTab === 0 && offer && (() => {
        const hasModules = offer.modules && offer.modules.length > 0;
        const migratedMods = hasModules ? migrateModules(offer.modules!) : [];
        const productList = (getProductById ? offer.lines.map(() => null) : []);
        const allProducts = offer.lines.map((l) => {
          const p = getProductById(l.productId);
          return p ? { id: p.id, name: p.name, code: p.code } : { id: l.productId, name: 'Unknown', code: '' };
        });
        // Find brand profile from template
        const template = offer.templateId ? allTemplates.find((t) => t.id === offer.templateId) : undefined;
        const brandProfile = template?.brandProfileId
          ? brandProfiles.find((b) => b.id === template.brandProfileId)
          : brandProfiles.length > 0 ? brandProfiles[0] : undefined;

        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', bgcolor: '#F8FAFC', borderRadius: 2, p: 3 }}>
            <Box
              sx={{
                width: '100%',
                maxWidth: 780,
                bgcolor: '#FFFFFF',
                borderRadius: 3,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
                overflow: 'hidden',
              }}
            >
              {hasModules ? (
                migratedMods
                  .filter((m) => m.visible)
                  .map((mod) => (
                    <ModuleRenderer key={mod.id} module={mod} offerLines={offer.lines} products={allProducts} brandProfile={brandProfile} />
                  ))
              ) : (
                /* Classic offer — show a clean formatted view */
                <Box sx={{ py: 5, px: 4 }}>
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    {brandProfile?.logoUrl && (
                      <Box component="img" src={brandProfile.logoUrl} alt="" sx={{ maxHeight: 48, mb: 2, mx: 'auto', display: 'block', objectFit: 'contain' }} />
                    )}
                    <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: '#1A1A2E', mb: 0.5 }}>
                      {offer.name}
                    </Typography>
                    {customer && (
                      <Typography variant="h6" sx={{ color: '#6B7280', fontWeight: 400 }}>
                        Prepared for {customer.name}
                      </Typography>
                    )}
                    <Box sx={{ width: 60, height: 3, borderRadius: 2, background: 'linear-gradient(90deg, #4F46E5, #7C3AED)', mx: 'auto', mt: 2 }} />
                  </Box>

                  {/* Pricing table */}
                  <Typography sx={{ fontWeight: 700, color: '#1A1A2E', fontSize: '1.25rem', mb: 2 }}>Pricing</Typography>
                  <TableContainer sx={{ borderRadius: 2, border: '1px solid #E5E7EB', overflow: 'hidden', mb: 4 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280' }}>Product</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280' }}>Qty</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280' }}>Unit</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280' }}>Price/Unit</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280' }}>Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {offer.lines.map((line, idx) => {
                          const product = getProductById(line.productId);
                          return (
                            <TableRow key={line.id} sx={{ bgcolor: idx % 2 === 1 ? '#FAFBFC' : 'transparent', '&:last-child td': { borderBottom: 0 } }}>
                              <TableCell sx={{ fontWeight: 500, color: '#374151' }}>{product ? `${product.name} (${product.code})` : 'Unknown'}</TableCell>
                              <TableCell align="right" sx={{ color: '#374151' }}>{line.quantity !== null ? line.quantity.toLocaleString() : '\u2014'}</TableCell>
                              <TableCell sx={{ color: '#6B7280' }}>{line.unit}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 500, color: '#374151' }}>{line.currency} {line.pricePerUnit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, color: '#1A1A2E' }}>
                                {line.quantity !== null ? `${line.currency} ${(line.pricePerUnit * line.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '\u2014'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Terms */}
                  <Typography sx={{ fontWeight: 700, color: '#1A1A2E', fontSize: '1.25rem', mb: 2 }}>Terms</Typography>
                  <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mb: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#6B7280', textTransform: 'uppercase', fontSize: '0.65rem' }}>Currency</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{offer.currency}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#6B7280', textTransform: 'uppercase', fontSize: '0.65rem' }}>Incoterms</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{offer.incoterms}{offer.incotermsLocation ? ` - ${offer.incotermsLocation}` : ''}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#6B7280', textTransform: 'uppercase', fontSize: '0.65rem' }}>Payment Terms</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{offer.paymentTerms || '\u2014'}</Typography>
                    </Box>
                    {offer.validityDate && (
                      <Box>
                        <Typography variant="caption" sx={{ color: '#6B7280', textTransform: 'uppercase', fontSize: '0.65rem' }}>Valid Until</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{new Date(offer.validityDate).toLocaleDateString()}</Typography>
                      </Box>
                    )}
                  </Box>
                  {offer.notes && (
                    <Box sx={{ pl: 2, borderLeft: '3px solid #E5E7EB', mt: 2 }}>
                      <Typography variant="caption" sx={{ color: '#6B7280', textTransform: 'uppercase', fontSize: '0.65rem' }}>Notes</Typography>
                      <Typography variant="body2" sx={{ color: '#6B7280', whiteSpace: 'pre-wrap' }}>{offer.notes}</Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        );
      })()}

      {viewTab === 1 && (
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Offer Metadata */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h6">Offer Details</Typography>
                <StatusChip status={offer.status} type="offer" />
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Currency
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {offer.currency}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Incoterms
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {offer.incoterms}
                    {offer.incotermsLocation ? ` \u2013 ${offer.incotermsLocation}` : ''}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Payment Terms
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {offer.paymentTerms || '\u2014'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Validity Date
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {offer.validityDate
                      ? new Date(offer.validityDate).toLocaleDateString()
                      : '\u2014'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Sent At
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {offer.sentAt
                      ? new Date(offer.sentAt).toLocaleDateString()
                      : '\u2014'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Version
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    V{offer.version}
                  </Typography>
                </Grid>
                {offer.notes && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {offer.notes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Offer Lines */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Product Lines ({offer.lines.length})
              </Typography>
              {offer.lines.length === 0 ? (
                <Typography color="text.secondary">No product lines.</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">
                          Qty
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Unit</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">
                          Price/Unit
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">
                          MSP
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">
                          Margin
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Below MSP</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {offer.lines.map((line) => {
                        const product = getProductById(line.productId);
                        const mspEntry = getMSPForProduct(line.productId, currentMonth);
                        const mspPrice = mspEntry?.price ?? null;
                        let marginAbs: number | null = null;
                        let marginPct: number | null = null;
                        if (mspPrice !== null) {
                          marginAbs = line.pricePerUnit - mspPrice;
                          if (line.pricePerUnit > 0) {
                            marginPct = (marginAbs / line.pricePerUnit) * 100;
                          }
                        }
                        const isBelowMSP = mspPrice !== null && line.pricePerUnit < mspPrice;

                        return (
                          <TableRow key={line.id}>
                            <TableCell>
                              {product?.name ?? 'Unknown Product'}
                              {product?.code ? ` (${product.code})` : ''}
                            </TableCell>
                            <TableCell align="right">
                              {line.quantity !== null ? line.quantity.toLocaleString() : '\u2014'}
                            </TableCell>
                            <TableCell>{line.unit}</TableCell>
                            <TableCell align="right">
                              {line.currency}{' '}
                              {line.pricePerUnit.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell align="right">
                              {mspPrice !== null
                                ? mspPrice.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : '\u2014'}
                            </TableCell>
                            <TableCell align="right">
                              {marginPct !== null ? (
                                <Box
                                  component="span"
                                  sx={{
                                    color: marginPct >= 0 ? 'success.main' : 'error.main',
                                    fontWeight: 500,
                                  }}
                                >
                                  {marginPct.toFixed(1)}%
                                </Box>
                              ) : (
                                '\u2014'
                              )}
                            </TableCell>
                            <TableCell>
                              {isBelowMSP ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <WarningAmberIcon fontSize="small" color="warning" />
                                  <Typography variant="caption">
                                    {line.belowMSPReason ?? 'No reason'}
                                  </Typography>
                                </Box>
                              ) : (
                                '\u2014'
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Summary Panel */}
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
                      ? `${offer.currency} ${summary.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      )}

      {viewTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>Buyer Responses</Typography>
          {buyerResponses.length === 0 ? (
            <Typography color="text.secondary">No buyer responses yet. Share the offer to receive buyer feedback.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {buyerResponses.map((response) => (
                <Card key={response.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip
                        label={response.type === 'accept' ? 'Accepted' : response.type === 'reject' ? 'Declined' : response.type === 'request_changes' ? 'Changes Requested' : 'Counter-Proposal'}
                        size="small"
                        color={response.type === 'accept' ? 'success' : response.type === 'reject' ? 'error' : response.type === 'request_changes' ? 'warning' : 'primary'}
                      />
                      <Typography variant="subtitle2">{response.buyerName}</Typography>
                      <Typography variant="caption" color="text.secondary">{response.buyerEmail}</Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                        {new Date(response.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                    {response.generalComment && (
                      <Typography variant="body2" sx={{ mb: 1.5, fontStyle: 'italic' }}>
                        &ldquo;{response.generalComment}&rdquo;
                      </Typography>
                    )}
                    {response.type === 'counter_proposal' && response.lineActions.some((la) => la.counterPrice !== null) && (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                              <TableCell sx={{ fontWeight: 600 }} align="right">Original Price</TableCell>
                              <TableCell sx={{ fontWeight: 600 }} align="right">Counter Price</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Comment</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {response.lineActions
                              .filter((la) => la.counterPrice !== null || la.comment)
                              .map((la) => {
                                const origLine = offer?.lines.find((l) => l.id === la.lineId);
                                const product = getProductById(la.productId);
                                return (
                                  <TableRow key={la.lineId}>
                                    <TableCell>{product?.name ?? 'Unknown'}</TableCell>
                                    <TableCell align="right">
                                      {origLine ? origLine.pricePerUnit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '\u2014'}
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: 'primary.main', fontWeight: 600 }}>
                                      {la.counterPrice !== null ? la.counterPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '\u2014'}
                                    </TableCell>
                                    <TableCell>{la.comment || '\u2014'}</TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}

      {viewTab === 3 && (
        <OfferAnalyticsDashboard offerId={offerId} />
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share Offer Link</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Share this link with the buyer. They can view the offer and respond — accept, request changes, or decline.
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={shareUrl}
            InputProps={{
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">
                  <LinkIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleCopyLink}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            Note: In this prototype, the link only works in the same browser where the app data lives in localStorage.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
          <Button variant="contained" onClick={handleCopyLink}>Copy Link</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={2000}
        onClose={() => setSnackbar('')}
        message={snackbar}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmAction !== null}
        title={
          confirmAction === 'approve'
            ? 'Approve Offer'
            : confirmAction === 'reject'
            ? 'Reject Offer'
            : 'Send Offer'
        }
        message={
          confirmAction === 'approve'
            ? `Approve offer V${offer.version}? This will mark the deal as Won.`
            : confirmAction === 'reject'
            ? `Reject offer V${offer.version}?`
            : `Send offer V${offer.version} to the customer?`
        }
        confirmLabel={
          confirmAction === 'approve' ? 'Approve' : confirmAction === 'reject' ? 'Reject' : 'Send'
        }
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
        color={confirmAction === 'reject' ? 'error' : 'primary'}
      />
    </Box>
  );
}
