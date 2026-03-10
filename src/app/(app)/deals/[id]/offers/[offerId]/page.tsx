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
import PageHeader from '@/components/shared/PageHeader';
import StatusChip from '@/components/shared/StatusChip';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useDealStore } from '@/stores/dealStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useOfferStore } from '@/stores/offerStore';
import { useProductStore } from '@/stores/productStore';
import { usePricingStore } from '@/stores/pricingStore';
import { useActivityStore } from '@/stores/activityStore';
import { useSettingsStore } from '@/stores/settingsStore';
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

  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'send' | null>(null);

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
          { label: 'Deals', href: '/deals' },
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
          </Box>
        }
      />

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
