'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ModuleRenderer from './modules/ModuleRenderer';
import { useOfferTracking } from '@/hooks/useOfferTracking';
import { useOfferShareStore } from '@/stores/offerShareStore';
import { useOfferStore } from '@/stores/offerStore';
import { useProductStore } from '@/stores/productStore';
import { useActivityStore } from '@/stores/activityStore';
import type { Offer } from '@/types/offer';
import type { OfferShareLink, BuyerLineAction, BuyerResponse } from '@/types/offerBuilder';
import { v4 as uuidv4 } from 'uuid';

interface BuyerOfferViewProps {
  offer: Offer;
  token: string;
  shareLink: OfferShareLink;
}

export default function BuyerOfferView({ offer, token, shareLink }: BuyerOfferViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { trackClick, observeSections } = useOfferTracking({ offerId: offer.id, token });

  const products = useProductStore((s) => s.products);
  const addBuyerResponse = useOfferShareStore((s) => s.addBuyerResponse);
  const duplicateAsNewVersion = useOfferStore((s) => s.duplicateAsNewVersion);
  const updateOffer = useOfferStore((s) => s.updateOffer);
  const addActivity = useActivityStore((s) => s.addActivity);

  const [submitted, setSubmitted] = useState(false);
  const [submittedType, setSubmittedType] = useState<'accept' | 'reject' | 'counter_proposal' | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'accept' | 'reject' | 'counter_proposal'>('accept');
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [generalComment, setGeneralComment] = useState('');
  const [lineActions, setLineActions] = useState<Record<string, { counterPrice: string; comment: string }>>(
    () => {
      const map: Record<string, { counterPrice: string; comment: string }> = {};
      offer.lines.forEach((line) => {
        map[line.id] = { counterPrice: '', comment: '' };
      });
      return map;
    }
  );

  const getProductName = (productId: string) => {
    const p = products.find((pr) => pr.id === productId);
    return p ? `${p.name} (${p.code})` : 'Product';
  };

  // Setup section observer
  useEffect(() => {
    const cleanup = observeSections(containerRef.current);
    return () => { if (cleanup) cleanup(); };
  }, [observeSections]);

  const openAction = (action: 'accept' | 'reject' | 'counter_proposal') => {
    setDialogAction(action);
    setDialogOpen(true);
    trackClick(action === 'accept' ? 'accept_button' : action === 'reject' ? 'reject_button' : 'counter_propose_button');
  };

  const handleSubmit = useCallback(() => {
    if (!buyerName.trim() || !buyerEmail.trim()) return;

    const actions: BuyerLineAction[] = offer.lines.map((line) => {
      const la = lineActions[line.id];
      return {
        lineId: line.id,
        productId: line.productId,
        counterPrice: la?.counterPrice ? parseFloat(la.counterPrice) : null,
        comment: la?.comment || '',
      };
    });

    const response: BuyerResponse = {
      id: uuidv4(),
      offerId: offer.id,
      shareToken: token,
      type: dialogAction,
      buyerName: buyerName.trim(),
      buyerEmail: buyerEmail.trim(),
      lineActions: actions,
      generalComment: generalComment.trim(),
      createdAt: new Date().toISOString(),
    };

    addBuyerResponse(response);
    trackClick(`submit_${dialogAction}`);

    // Handle offer status updates
    const now = new Date().toISOString();
    if (dialogAction === 'accept') {
      updateOffer(offer.id, { status: 'Approved', updatedAt: now });
      addActivity({
        id: uuidv4(),
        entityType: 'offer',
        entityId: offer.id,
        dealId: shareLink.dealId,
        action: 'buyer_accepted',
        details: `${buyerName} accepted offer "${offer.name}"`,
        userId: buyerName,
        timestamp: now,
      });
    } else if (dialogAction === 'reject') {
      updateOffer(offer.id, { status: 'Rejected', updatedAt: now });
      addActivity({
        id: uuidv4(),
        entityType: 'offer',
        entityId: offer.id,
        dealId: shareLink.dealId,
        action: 'buyer_rejected',
        details: `${buyerName} rejected offer "${offer.name}"`,
        userId: buyerName,
        timestamp: now,
      });
    } else if (dialogAction === 'counter_proposal') {
      // Create a new version with counter-proposed prices
      const newId = uuidv4();
      const newOffer = duplicateAsNewVersion(offer.id, newId);
      if (newOffer) {
        // Update lines with counter-proposed prices
        const updatedLines = newOffer.lines.map((line) => {
          const la = lineActions[line.id];
          if (la?.counterPrice) {
            const cp = parseFloat(la.counterPrice);
            if (!isNaN(cp) && cp > 0) {
              return { ...line, pricePerUnit: cp };
            }
          }
          return line;
        });
        updateOffer(newId, { lines: updatedLines, notes: `Counter-proposal from ${buyerName}: ${generalComment}` });
      }
      addActivity({
        id: uuidv4(),
        entityType: 'offer',
        entityId: offer.id,
        dealId: shareLink.dealId,
        action: 'buyer_counter_proposed',
        details: `${buyerName} submitted a counter-proposal on "${offer.name}"`,
        userId: buyerName,
        timestamp: now,
      });
    }

    setSubmitted(true);
    setSubmittedType(dialogAction);
    setDialogOpen(false);
  }, [offer, token, shareLink, buyerName, buyerEmail, generalComment, lineActions, dialogAction, addBuyerResponse, updateOffer, duplicateAsNewVersion, addActivity, trackClick]);

  // Thank-you screen
  if (submitted) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', px: 2 }}>
        <Card sx={{ maxWidth: 500, textAlign: 'center', p: 3 }}>
          <CardContent>
            {submittedType === 'accept' && <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />}
            {submittedType === 'reject' && <CancelIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />}
            {submittedType === 'counter_proposal' && <SwapHorizIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />}
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {submittedType === 'accept' && 'Offer Accepted'}
              {submittedType === 'reject' && 'Offer Declined'}
              {submittedType === 'counter_proposal' && 'Counter-Proposal Submitted'}
            </Typography>
            <Typography color="text.secondary">
              {submittedType === 'accept' && 'Thank you for accepting this offer. The seller has been notified.'}
              {submittedType === 'reject' && 'Your response has been recorded. The seller has been notified.'}
              {submittedType === 'counter_proposal' && 'Your counter-proposal has been submitted. The seller will review and respond.'}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const hasModules = offer.modules && offer.modules.length > 0;
  const productList = products.map((p) => ({ id: p.id, name: p.name, code: p.code }));

  return (
    <Box ref={containerRef} sx={{ maxWidth: 900, mx: 'auto', py: 4, px: 2 }}>
      {/* Render modules if present */}
      {hasModules ? (
        <>
          {offer.modules!
            .filter((m) => m.visible)
            .map((mod) => (
              <Box key={mod.id}>
                <ModuleRenderer module={mod} offerLines={offer.lines} products={productList} />
                <Divider sx={{ my: 2 }} />
              </Box>
            ))}
        </>
      ) : (
        <>
          {/* Default buyer view without modules */}
          <Box sx={{ textAlign: 'center', mb: 4 }} data-section="hero">
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {offer.name}
            </Typography>
            <Chip label={`Version ${offer.version}`} size="small" sx={{ mb: 1 }} />
            {offer.validityDate && (
              <Typography variant="body2" color="text.secondary">
                Valid until {new Date(offer.validityDate).toLocaleDateString()}
              </Typography>
            )}
          </Box>
          <Divider sx={{ mb: 3 }} />
        </>
      )}

      {/* Product Lines with Negotiation */}
      <Box data-section="product_lines" sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Pricing
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Qty</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Unit</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Price/Unit</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Counter Price</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 140 }}>Comment</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {offer.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>{getProductName(line.productId)}</TableCell>
                  <TableCell align="right">{line.quantity !== null ? line.quantity.toLocaleString() : '\u2014'}</TableCell>
                  <TableCell>{line.unit}</TableCell>
                  <TableCell align="right">
                    {line.currency} {line.pricePerUnit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell align="right">
                    {line.quantity !== null
                      ? `${line.currency} ${(line.pricePerUnit * line.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      : '\u2014'}
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      placeholder="Your price"
                      value={lineActions[line.id]?.counterPrice || ''}
                      onChange={(e) => {
                        setLineActions((prev) => ({
                          ...prev,
                          [line.id]: { ...prev[line.id], counterPrice: e.target.value },
                        }));
                        trackClick('counter_price_input');
                      }}
                      inputProps={{ min: 0, step: 'any' }}
                      sx={{ minWidth: 100 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      placeholder="Note..."
                      value={lineActions[line.id]?.comment || ''}
                      onChange={(e) =>
                        setLineActions((prev) => ({
                          ...prev,
                          [line.id]: { ...prev[line.id], comment: e.target.value },
                        }))
                      }
                      sx={{ minWidth: 120 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Offer Terms */}
      <Box data-section="terms" sx={{ mb: 3 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Offer Terms</Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Currency</Typography>
                <Typography variant="body2">{offer.currency}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Incoterms</Typography>
                <Typography variant="body2">{offer.incoterms}{offer.incotermsLocation ? ` - ${offer.incotermsLocation}` : ''}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Payment Terms</Typography>
                <Typography variant="body2">{offer.paymentTerms || '\u2014'}</Typography>
              </Box>
            </Box>
            {offer.notes && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">Notes</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{offer.notes}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Actions */}
      <Box data-section="actions" sx={{ display: 'flex', gap: 2, justifyContent: 'center', pt: 2, pb: 4 }}>
        <Button
          variant="contained"
          color="success"
          size="large"
          startIcon={<CheckCircleIcon />}
          onClick={() => openAction('accept')}
        >
          Accept Offer
        </Button>
        <Button
          variant="outlined"
          size="large"
          startIcon={<SwapHorizIcon />}
          onClick={() => openAction('counter_proposal')}
        >
          Counter-Propose
        </Button>
        <Button
          variant="outlined"
          color="error"
          size="large"
          startIcon={<CancelIcon />}
          onClick={() => openAction('reject')}
        >
          Decline
        </Button>
      </Box>

      {/* Submit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogAction === 'accept' && 'Accept Offer'}
          {dialogAction === 'reject' && 'Decline Offer'}
          {dialogAction === 'counter_proposal' && 'Submit Counter-Proposal'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {dialogAction === 'counter_proposal' && (
            <Alert severity="info" sx={{ mb: 1 }}>
              Enter your counter-prices in the table above before submitting.
            </Alert>
          )}
          <TextField
            autoFocus
            size="small"
            fullWidth
            label="Your Name"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            required
          />
          <TextField
            size="small"
            fullWidth
            label="Your Email"
            type="email"
            value={buyerEmail}
            onChange={(e) => setBuyerEmail(e.target.value)}
            required
          />
          <TextField
            size="small"
            fullWidth
            label="Comment (optional)"
            multiline
            minRows={2}
            value={generalComment}
            onChange={(e) => setGeneralComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={dialogAction === 'reject' ? 'error' : dialogAction === 'accept' ? 'success' : 'primary'}
            onClick={handleSubmit}
            disabled={!buyerName.trim() || !buyerEmail.trim()}
          >
            {dialogAction === 'accept' && 'Accept'}
            {dialogAction === 'reject' && 'Decline'}
            {dialogAction === 'counter_proposal' && 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
