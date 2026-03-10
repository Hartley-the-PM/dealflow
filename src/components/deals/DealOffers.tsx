'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SendIcon from '@mui/icons-material/Send';
import StatusChip from '@/components/shared/StatusChip';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useOfferStore } from '@/stores/offerStore';
import { useDealStore } from '@/stores/dealStore';
import { usePricingStore } from '@/stores/pricingStore';
import { useActivityStore } from '@/stores/activityStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

interface DealOffersProps {
  dealId: string;
}

export default function DealOffers({ dealId }: DealOffersProps) {
  const router = useRouter();
  const getOffersByDeal = useOfferStore((s) => s.getOffersByDeal);
  const updateOffer = useOfferStore((s) => s.updateOffer);
  const duplicateAsNewVersion = useOfferStore((s) => s.duplicateAsNewVersion);
  const updateDeal = useDealStore((s) => s.updateDeal);
  const getMSPForProduct = usePricingStore((s) => s.getMSPForProduct);
  const addActivity = useActivityStore((s) => s.addActivity);
  const settings = useSettingsStore((s) => s.settings);

  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject' | 'send';
    offerId: string;
    version: number;
  } | null>(null);

  const offers = useMemo(() => {
    return getOffersByDeal(dealId).sort((a, b) => b.version - a.version);
  }, [getOffersByDeal, dealId]);

  const currentMonth = format(new Date(), 'yyyy-MM');

  const computeTotalValue = (lines: typeof offers[0]['lines']) => {
    return lines.reduce((sum, line) => {
      if (line.quantity !== null && line.quantity > 0) {
        return sum + line.pricePerUnit * line.quantity;
      }
      return sum;
    }, 0);
  };

  const computeAvgMargin = (lines: typeof offers[0]['lines']) => {
    const margins: number[] = [];
    lines.forEach((line) => {
      const mspEntry = getMSPForProduct(line.productId, currentMonth);
      if (mspEntry && line.pricePerUnit > 0) {
        const margin = ((line.pricePerUnit - mspEntry.price) / line.pricePerUnit) * 100;
        margins.push(margin);
      }
    });
    if (margins.length === 0) return null;
    return margins.reduce((a, b) => a + b, 0) / margins.length;
  };

  const handleApprove = (offerId: string) => {
    const now = new Date().toISOString();
    updateOffer(offerId, { status: 'Approved', updatedAt: now });
    updateDeal(dealId, { status: 'Won', updatedAt: now });
    addActivity({
      id: uuidv4(),
      entityType: 'offer',
      entityId: offerId,
      dealId,
      action: 'offer_approved',
      details: 'Offer approved by sales manager',
      userId: settings.currentUser,
      timestamp: now,
    });
    setConfirmAction(null);
  };

  const handleReject = (offerId: string) => {
    const now = new Date().toISOString();
    updateOffer(offerId, { status: 'Rejected', updatedAt: now });
    addActivity({
      id: uuidv4(),
      entityType: 'offer',
      entityId: offerId,
      dealId,
      action: 'offer_rejected',
      details: 'Offer rejected by sales manager',
      userId: settings.currentUser,
      timestamp: now,
    });
    setConfirmAction(null);
  };

  const handleSend = (offerId: string) => {
    const now = new Date().toISOString();
    updateOffer(offerId, { status: 'Sent', sentAt: now, updatedAt: now });
    addActivity({
      id: uuidv4(),
      entityType: 'offer',
      entityId: offerId,
      dealId,
      action: 'offer_sent',
      details: 'Offer sent to customer',
      userId: settings.currentUser,
      timestamp: now,
    });
    updateDeal(dealId, { status: 'Active', updatedAt: now });
    setConfirmAction(null);
  };

  const handleDuplicate = (offerId: string) => {
    const newId = uuidv4();
    const newOffer = duplicateAsNewVersion(offerId, newId);
    if (newOffer) {
      addActivity({
        id: uuidv4(),
        entityType: 'offer',
        entityId: newId,
        dealId,
        action: 'offer_created',
        details: `Offer V${newOffer.version} created as duplicate`,
        userId: settings.currentUser,
        timestamp: new Date().toISOString(),
      });
      router.push(`/deals/${dealId}/offers/${newId}/edit`);
    }
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    switch (confirmAction.type) {
      case 'approve':
        handleApprove(confirmAction.offerId);
        break;
      case 'reject':
        handleReject(confirmAction.offerId);
        break;
      case 'send':
        handleSend(confirmAction.offerId);
        break;
    }
  };

  const getConfirmMessage = () => {
    if (!confirmAction) return { title: '', message: '', color: 'primary' as const };
    switch (confirmAction.type) {
      case 'approve':
        return {
          title: 'Approve Offer',
          message: `Are you sure you want to approve offer V${confirmAction.version}? This will mark the deal as Won.`,
          color: 'primary' as const,
        };
      case 'reject':
        return {
          title: 'Reject Offer',
          message: `Are you sure you want to reject offer V${confirmAction.version}?`,
          color: 'error' as const,
        };
      case 'send':
        return {
          title: 'Send Offer',
          message: `Are you sure you want to send offer V${confirmAction.version} to the customer?`,
          color: 'primary' as const,
        };
    }
  };

  if (offers.length === 0) {
    return <EmptyState message="No offers yet. Create the first offer for this deal." />;
  }

  const confirmProps = getConfirmMessage();

  return (
    <>
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Version</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Sent Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Total Value
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Avg Margin vs MSP
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {offers.map((offer) => {
              const totalValue = computeTotalValue(offer.lines);
              const avgMargin = computeAvgMargin(offer.lines);
              const isSalesManager = settings.currentRole === 'sales_manager';
              const canApproveReject =
                isSalesManager &&
                (offer.status === 'Sent' || offer.status === 'Pending');
              const canDuplicate =
                offer.status === 'Sent' ||
                offer.status === 'Rejected' ||
                offer.status === 'Approved';
              const canEdit = offer.status === 'Draft';
              const canSend = offer.status === 'Draft';

              return (
                <TableRow key={offer.id} hover>
                  <TableCell>V{offer.version}</TableCell>
                  <TableCell>{offer.name}</TableCell>
                  <TableCell>
                    <StatusChip status={offer.status} type="offer" />
                  </TableCell>
                  <TableCell>
                    {offer.sentAt
                      ? new Date(offer.sentAt).toLocaleDateString()
                      : '\u2014'}
                  </TableCell>
                  <TableCell align="right">
                    {totalValue > 0
                      ? `${offer.currency} ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '\u2014'}
                  </TableCell>
                  <TableCell align="right">
                    {avgMargin !== null ? (
                      <Box
                        component="span"
                        sx={{ color: avgMargin >= 0 ? 'success.main' : 'error.main', fontWeight: 500 }}
                      >
                        {avgMargin.toFixed(1)}%
                      </Box>
                    ) : (
                      '\u2014'
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip title="View">
                        <IconButton
                          size="small"
                          onClick={() =>
                            router.push(`/deals/${dealId}/offers/${offer.id}`)
                          }
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canEdit && (
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() =>
                              router.push(
                                `/deals/${dealId}/offers/${offer.id}/edit`
                              )
                            }
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canSend && (
                        <Tooltip title="Send">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() =>
                              setConfirmAction({
                                type: 'send',
                                offerId: offer.id,
                                version: offer.version,
                              })
                            }
                          >
                            <SendIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canApproveReject && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() =>
                                setConfirmAction({
                                  type: 'approve',
                                  offerId: offer.id,
                                  version: offer.version,
                                })
                              }
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                setConfirmAction({
                                  type: 'reject',
                                  offerId: offer.id,
                                  version: offer.version,
                                })
                              }
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {canDuplicate && (
                        <Tooltip title="Duplicate as New Version">
                          <IconButton
                            size="small"
                            onClick={() => handleDuplicate(offer.id)}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmProps.title}
        message={confirmProps.message}
        confirmLabel={confirmAction?.type === 'reject' ? 'Reject' : confirmAction?.type === 'approve' ? 'Approve' : 'Send'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
        color={confirmProps.color}
      />
    </>
  );
}
