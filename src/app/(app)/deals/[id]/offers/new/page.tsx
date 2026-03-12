'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PageHeader from '@/components/shared/PageHeader';
import OfferForm from '@/components/offers/OfferForm';
import TemplatePicker from '@/components/offers/TemplatePicker';
import { useDealStore } from '@/stores/dealStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useOfferStore } from '@/stores/offerStore';
import { useActivityStore } from '@/stores/activityStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHydration } from '@/hooks/useHydration';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import type { Offer } from '@/types';
import type { OfferTemplate } from '@/types/offerBuilder';

export default function NewOfferPage() {
  const hydrated = useHydration();
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;

  const getDealById = useDealStore((s) => s.getDealById);
  const updateDeal = useDealStore((s) => s.updateDeal);
  const getCustomerById = useCustomerStore((s) => s.getCustomerById);
  const getOffersByDeal = useOfferStore((s) => s.getOffersByDeal);
  const addOffer = useOfferStore((s) => s.addOffer);
  const addActivity = useActivityStore((s) => s.addActivity);
  const settings = useSettingsStore((s) => s.settings);

  const [selectedTemplate, setSelectedTemplate] = useState<OfferTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);

  const deal = getDealById(dealId);
  const customer = deal ? getCustomerById(deal.customerId) : undefined;

  const nextVersion = useMemo(() => {
    const existingOffers = getOffersByDeal(dealId);
    if (existingOffers.length === 0) return 1;
    return Math.max(...existingOffers.map((o) => o.version)) + 1;
  }, [getOffersByDeal, dealId]);

  const autoName = useMemo(() => {
    const customerName = customer?.name ?? 'Customer';
    const monthStr = format(new Date(), 'MMM yyyy');
    return `${customerName} \u2013 ${monthStr} \u2013 V${nextVersion}`;
  }, [customer, nextVersion]);

  const handleSave = (offer: Offer) => {
    addOffer(offer);
    const now = new Date().toISOString();
    addActivity({
      id: uuidv4(),
      entityType: 'offer',
      entityId: offer.id,
      dealId,
      action: 'offer_created',
      details: `Offer V${offer.version} "${offer.name}" created`,
      userId: settings.currentUser,
      timestamp: now,
    });
    if (deal && deal.status === 'Draft') {
      updateDeal(dealId, { updatedAt: now });
    }
    router.push(`/deals/${dealId}`);
  };

  const handleTemplateSelect = (template: OfferTemplate) => {
    setSelectedTemplate(template);
    setShowForm(true);
  };

  const handleSkipTemplate = () => {
    setSelectedTemplate(null);
    setShowForm(true);
  };

  if (!hydrated) return null;

  if (!deal) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Deal not found.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="New Offer"
        subtitle={`${deal.name} \u2013 ${customer?.name ?? ''}`}
        breadcrumbs={[
          { label: 'Deals', href: '/deals' },
          { label: deal.name, href: `/deals/${dealId}` },
          { label: 'New Offer' },
        ]}
      />
      {!showForm ? (
        <TemplatePicker onSelect={handleTemplateSelect} onSkip={handleSkipTemplate} />
      ) : (
        <OfferForm
          dealId={dealId}
          customerId={deal.customerId}
          defaultName={autoName}
          defaultVersion={nextVersion}
          onSave={handleSave}
        />
      )}
    </Box>
  );
}
