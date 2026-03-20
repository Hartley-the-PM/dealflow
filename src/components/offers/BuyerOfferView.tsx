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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import Grow from '@mui/material/Grow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ModuleRenderer from './modules/ModuleRenderer';
import BrandedHeader from './modules/BrandedHeader';
import { useOfferBuilderSettingsStore } from '@/stores/offerBuilderSettingsStore';
import { migrateModules } from '@/lib/migrateModules';
import { useOfferTracking } from '@/hooks/useOfferTracking';
import { useOfferShareStore } from '@/stores/offerShareStore';
import { useOfferStore } from '@/stores/offerStore';
import { useProductStore } from '@/stores/productStore';
import { useWhiteLabelStore } from '@/stores/whiteLabelStore';
import { useFormulationStore } from '@/stores/formulationStore';
import { useActivityStore } from '@/stores/activityStore';
import type { Offer } from '@/types/offer';
import type { OfferShareLink, BuyerResponse } from '@/types/offerBuilder';
import { v4 as uuidv4 } from 'uuid';

interface BuyerOfferViewProps {
  offer: Offer;
  token: string;
  shareLink: OfferShareLink;
}

const COLORS = {
  heading: '#1A1A2E',
  body: '#6B7280',
  bodyDark: '#374151',
  border: '#E5E7EB',
  bgSubtle: '#F9FAFB',
  bgAlt: '#FAFBFC',
};

type ResponseType = 'accept' | 'reject' | 'request_changes';

export default function BuyerOfferView({ offer, token, shareLink }: BuyerOfferViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { trackClick, observeSections } = useOfferTracking({ offerId: offer.id, token });

  const products = useProductStore((s) => s.products);
  const wlProducts = useWhiteLabelStore((s) => s.products);
  const wlBrands = useWhiteLabelStore((s) => s.brands);
  const formulations = useFormulationStore((s) => s.formulations);
  const addBuyerResponse = useOfferShareStore((s) => s.addBuyerResponse);
  const updateOffer = useOfferStore((s) => s.updateOffer);
  const addActivity = useActivityStore((s) => s.addActivity);
  const brandProfiles = useOfferBuilderSettingsStore((s) => s.brandProfiles);

  // Find the brand profile linked to this offer's template
  const brandProfile = brandProfiles.length > 0 ? brandProfiles[0] : undefined; // Use first brand as default for buyer view

  const [submitted, setSubmitted] = useState(false);
  const [submittedType, setSubmittedType] = useState<ResponseType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<ResponseType>('accept');
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [generalComment, setGeneralComment] = useState('');

  const getProductName = (line: import('@/types/offer').OfferLine) => {
    // White label: show WL product name only — never reveal source products
    if (line.lineType === 'white_label' && line.whiteLabelId) {
      const wl = wlProducts.find((w) => w.id === line.whiteLabelId);
      if (wl) {
        const brand = wlBrands.find((b) => b.id === wl.brandId);
        return brand ? `${brand.name} ${wl.name}` : wl.name;
      }
      return 'White Label Product';
    }
    // Formulation: show formulation name
    if (line.lineType === 'formulation' && line.formulationId) {
      const fm = formulations.find((f) => f.id === line.formulationId);
      return fm ? `${fm.name} (${fm.code})` : 'Formulation';
    }
    // Standard product
    const p = products.find((pr) => pr.id === line.productId);
    return p ? `${p.name} (${p.code})` : 'Product';
  };

  // Setup section observer
  useEffect(() => {
    const cleanup = observeSections(containerRef.current);
    return () => { if (cleanup) cleanup(); };
  }, [observeSections]);

  const openAction = (action: ResponseType) => {
    setDialogAction(action);
    setDialogOpen(true);
    trackClick(`${action}_button`);
  };

  const handleSubmit = useCallback(() => {
    if (!buyerName.trim() || !buyerEmail.trim()) return;
    if (dialogAction === 'request_changes' && !generalComment.trim()) return;

    const response: BuyerResponse = {
      id: uuidv4(),
      offerId: offer.id,
      shareToken: token,
      type: dialogAction,
      buyerName: buyerName.trim(),
      buyerEmail: buyerEmail.trim(),
      lineActions: [],
      generalComment: generalComment.trim(),
      createdAt: new Date().toISOString(),
    };

    addBuyerResponse(response);
    trackClick(`submit_${dialogAction}`);

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
        details: `${buyerName} declined offer "${offer.name}"`,
        userId: buyerName,
        timestamp: now,
      });
    } else if (dialogAction === 'request_changes') {
      addActivity({
        id: uuidv4(),
        entityType: 'offer',
        entityId: offer.id,
        dealId: shareLink.dealId,
        action: 'buyer_requested_changes',
        details: `${buyerName} requested changes on "${offer.name}": ${generalComment.trim()}`,
        userId: buyerName,
        timestamp: now,
      });
    }

    setSubmitted(true);
    setSubmittedType(dialogAction);
    setDialogOpen(false);
  }, [offer, token, shareLink, buyerName, buyerEmail, generalComment, dialogAction, addBuyerResponse, updateOffer, addActivity, trackClick]);

  // Thank-you screen
  if (submitted) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          px: 2,
          background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 100%)',
        }}
      >
        <Grow in={true} timeout={500}>
          <Card sx={{ maxWidth: 500, textAlign: 'center', p: 4, borderRadius: 3, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <CardContent>
              {submittedType === 'accept' && <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />}
              {submittedType === 'reject' && <CancelIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />}
              {submittedType === 'request_changes' && <EditNoteIcon sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />}
              <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: COLORS.heading, mb: 1 }}>
                {submittedType === 'accept' && 'Offer Accepted'}
                {submittedType === 'reject' && 'Offer Declined'}
                {submittedType === 'request_changes' && 'Changes Requested'}
              </Typography>
              <Typography sx={{ color: COLORS.body, lineHeight: 1.7 }}>
                {submittedType === 'accept' && 'Thank you for accepting this offer. The seller has been notified and will follow up shortly.'}
                {submittedType === 'reject' && 'Your response has been recorded. The seller has been notified.'}
                {submittedType === 'request_changes' && 'Your feedback has been submitted. The seller will review your requested changes and get back to you soon.'}
              </Typography>
            </CardContent>
          </Card>
        </Grow>
      </Box>
    );
  }

  const migratedModules = offer.modules ? migrateModules(offer.modules) : undefined;
  const hasModules = migratedModules && migratedModules.length > 0;
  const productList = products.map((p) => ({ id: p.id, name: p.name, code: p.code }));

  const isExpired = offer.validityDate && new Date(offer.validityDate) < new Date();

  return (
    <Box ref={containerRef} sx={{ maxWidth: 780, mx: 'auto', py: 4, px: 2 }}>
      {isExpired && (
        <Box sx={{ bgcolor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 2, p: 2, mb: 3, textAlign: 'center' }}>
          <Typography variant="subtitle2" sx={{ color: '#DC2626', fontWeight: 600 }}>
            This offer has expired
          </Typography>
          <Typography variant="body2" sx={{ color: '#991B1B', mt: 0.5 }}>
            This offer was valid until {new Date(offer.validityDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}. Please contact your sales representative for updated pricing.
          </Typography>
        </Box>
      )}
      {/* White paper container for modules */}
      {hasModules ? (
        <Box
          sx={{
            bgcolor: '#FFFFFF',
            borderRadius: 3,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            mb: 4,
          }}
        >
          {migratedModules!
            .filter((m) => m.visible)
            .map((mod) => (
              <ModuleRenderer key={mod.id} module={mod} offerLines={offer.lines} products={productList} brandProfile={brandProfile} />
            ))}
        </Box>
      ) : (
        <Box
          sx={{
            bgcolor: '#FFFFFF',
            borderRadius: 3,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            mb: 4,
            py: 5,
            textAlign: 'center',
          }}
          data-section="hero"
        >
          <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: COLORS.heading, mb: 0.5 }}>
            {offer.name}
          </Typography>
          <Chip label={`Version ${offer.version}`} size="small" sx={{ mb: 1 }} />
          {offer.validityDate && (
            <Typography variant="body2" sx={{ color: COLORS.body }}>
              Valid until {new Date(offer.validityDate).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      )}

      {/* Pricing Table — only shown for classic (non-builder) offers */}
      {!hasModules && <Box
        data-section="product_lines"
        sx={{
          bgcolor: '#FFFFFF',
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          mb: 3,
          p: 4,
        }}
      >
        <Typography sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: COLORS.heading, fontSize: '1.25rem', mb: 0.5 }}>
          Pricing
        </Typography>
        <Typography variant="body2" sx={{ color: COLORS.body, mb: 3 }}>
          Review the pricing below
        </Typography>
        <TableContainer sx={{ borderRadius: 2, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: COLORS.bgSubtle }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: COLORS.body }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: COLORS.body }} align="right">Qty</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: COLORS.body }}>Unit</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: COLORS.body }} align="right">Price/Unit</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: COLORS.body }} align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {offer.lines.map((line, idx) => (
                <TableRow key={line.id} sx={{ bgcolor: idx % 2 === 1 ? COLORS.bgAlt : 'transparent', '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ color: COLORS.bodyDark, fontWeight: 500 }}>{getProductName(line)}</TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', color: COLORS.bodyDark }}>
                    {line.quantity !== null ? line.quantity.toLocaleString() : '\u2014'}
                  </TableCell>
                  <TableCell sx={{ color: COLORS.body }}>{line.unit}</TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', color: COLORS.bodyDark, fontWeight: 500 }}>
                    {line.currency} {line.pricePerUnit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', color: COLORS.heading, fontWeight: 600 }}>
                    {line.quantity !== null
                      ? `${line.currency} ${(line.pricePerUnit * line.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      : '\u2014'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>}

      {/* Offer Terms — only for classic offers */}
      {!hasModules && <Box
        data-section="terms"
        sx={{
          bgcolor: '#FFFFFF',
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          mb: 3,
          p: 4,
        }}
      >
        <Typography sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: COLORS.heading, fontSize: '1rem', mb: 2 }}>
          Offer Terms
        </Typography>
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" sx={{ color: COLORS.body, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.65rem' }}>Currency</Typography>
            <Typography variant="body2" sx={{ color: COLORS.bodyDark, fontWeight: 500 }}>{offer.currency}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: COLORS.body, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.65rem' }}>Incoterms</Typography>
            <Typography variant="body2" sx={{ color: COLORS.bodyDark, fontWeight: 500 }}>{offer.incoterms}{offer.incotermsLocation ? ` - ${offer.incotermsLocation}` : ''}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: COLORS.body, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.65rem' }}>Payment Terms</Typography>
            <Typography variant="body2" sx={{ color: COLORS.bodyDark, fontWeight: 500 }}>{offer.paymentTerms || '\u2014'}</Typography>
          </Box>
        </Box>
        {offer.notes && (
          <Box sx={{ mt: 2, pl: 2, borderLeft: '3px solid #E5E7EB' }}>
            <Typography variant="caption" sx={{ color: COLORS.body, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.65rem' }}>Notes</Typography>
            <Typography variant="body2" sx={{ color: COLORS.body, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{offer.notes}</Typography>
          </Box>
        )}
      </Box>}

      {/* Actions */}
      <Box
        data-section="actions"
        sx={{
          bgcolor: '#FFFFFF',
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          p: 4,
          mb: 4,
          textAlign: 'center',
        }}
      >
        <Typography sx={{ fontWeight: 600, color: COLORS.heading, mb: 0.5 }}>
          Ready to respond?
        </Typography>
        <Typography variant="body2" sx={{ color: COLORS.body, mb: 3 }}>
          Accept this offer, request changes, or decline
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<CheckCircleIcon />}
            onClick={() => openAction('accept')}
            sx={{ textTransform: 'none', px: 3 }}
          >
            Accept Offer
          </Button>
          <Button
            variant="outlined"
            color="warning"
            size="large"
            startIcon={<EditNoteIcon />}
            onClick={() => openAction('request_changes')}
            sx={{ textTransform: 'none', px: 3 }}
          >
            Request Changes
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="large"
            startIcon={<CancelIcon />}
            onClick={() => openAction('reject')}
            sx={{ textTransform: 'none', px: 3 }}
          >
            Decline
          </Button>
        </Box>
      </Box>

      {/* Submit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogAction === 'accept' && 'Accept Offer'}
          {dialogAction === 'reject' && 'Decline Offer'}
          {dialogAction === 'request_changes' && 'Request Changes'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
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
            label={dialogAction === 'request_changes' ? 'What changes would you like?' : 'Comment (optional)'}
            multiline
            minRows={dialogAction === 'request_changes' ? 3 : 2}
            value={generalComment}
            onChange={(e) => setGeneralComment(e.target.value)}
            required={dialogAction === 'request_changes'}
            placeholder={dialogAction === 'request_changes' ? 'Describe the changes you need — pricing adjustments, quantity changes, different terms, etc.' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={dialogAction === 'reject' ? 'error' : dialogAction === 'accept' ? 'success' : 'warning'}
            onClick={handleSubmit}
            disabled={!buyerName.trim() || !buyerEmail.trim() || (dialogAction === 'request_changes' && !generalComment.trim())}
          >
            {dialogAction === 'accept' && 'Accept'}
            {dialogAction === 'reject' && 'Decline'}
            {dialogAction === 'request_changes' && 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
