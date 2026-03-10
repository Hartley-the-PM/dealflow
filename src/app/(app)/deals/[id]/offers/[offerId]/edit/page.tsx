'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PageHeader from '@/components/shared/PageHeader';
import OfferForm from '@/components/offers/OfferForm';
import { useDealStore } from '@/stores/dealStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useOfferStore } from '@/stores/offerStore';
import { useActivityStore } from '@/stores/activityStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHydration } from '@/hooks/useHydration';
import { v4 as uuidv4 } from 'uuid';
import type { Offer } from '@/types';

export default function EditOfferPage() {
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
  const addActivity = useActivityStore((s) => s.addActivity);
  const settings = useSettingsStore((s) => s.settings);

  const deal = getDealById(dealId);
  const customer = deal ? getCustomerById(deal.customerId) : undefined;
  const offer = getOfferById(offerId);

  // Redirect to view page if offer is not in Draft status
  useEffect(() => {
    if (hydrated && offer && offer.status !== 'Draft') {
      router.replace(`/deals/${dealId}/offers/${offerId}`);
    }
  }, [hydrated, offer, dealId, offerId, router]);

  const handleSave = (updatedOffer: Offer) => {
    const now = new Date().toISOString();
    updateOffer(offerId, {
      name: updatedOffer.name,
      currency: updatedOffer.currency,
      incoterms: updatedOffer.incoterms,
      incotermsLocation: updatedOffer.incotermsLocation,
      paymentTerms: updatedOffer.paymentTerms,
      validityDate: updatedOffer.validityDate,
      notes: updatedOffer.notes,
      lines: updatedOffer.lines,
      updatedAt: now,
    });
    updateDeal(dealId, { updatedAt: now });
    addActivity({
      id: uuidv4(),
      entityType: 'offer',
      entityId: offerId,
      dealId,
      action: 'status_changed',
      details: `Offer V${updatedOffer.version} "${updatedOffer.name}" updated`,
      userId: settings.currentUser,
      timestamp: now,
    });
    router.push(`/deals/${dealId}`);
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

  if (offer.status !== 'Draft') {
    return null; // Will redirect via useEffect
  }

  return (
    <Box>
      <PageHeader
        title={`Edit: ${offer.name}`}
        subtitle={`${deal.name} \u2013 ${customer?.name ?? ''}`}
        breadcrumbs={[
          { label: 'Deals', href: '/deals' },
          { label: deal.name, href: `/deals/${dealId}` },
          { label: offer.name, href: `/deals/${dealId}/offers/${offerId}` },
          { label: 'Edit' },
        ]}
      />
      <OfferForm
        dealId={dealId}
        customerId={deal.customerId}
        offer={offer}
        onSave={handleSave}
      />
    </Box>
  );
}
