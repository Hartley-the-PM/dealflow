'use client';

import { useMemo, useEffect, useState } from 'react';
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
import { useOfferTemplateStore } from '@/stores/offerTemplateStore';
import { useHydration } from '@/hooks/useHydration';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import type { Offer } from '@/types';
import type { OfferModule, ContentPresetType } from '@/types/offerBuilder';
import { useOfferBuilderSettingsStore } from '@/stores/offerBuilderSettingsStore';

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

  const templates = useOfferTemplateStore((s) => s.templates);
  const defaultPresets = useOfferBuilderSettingsStore((s) => s.defaultPresets);
  const contentPresets = useOfferBuilderSettingsStore((s) => s.contentPresets);

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

  // Auto-apply the Standard template (first preset) with default presets
  const initialModules = useMemo(() => {
    const standardTemplate = templates.find((t) => t.name === 'Standard') ?? templates[0];
    if (!standardTemplate) return undefined;

    const freshModules = standardTemplate.modules.map((m) => ({ ...m, id: uuidv4() }));

    const presetTypeMap: Record<string, ContentPresetType> = {
      terms: 'terms',
      testimonials: 'testimonials',
      cover_image: 'cover_image',
      company_about: 'company_about',
    };

    return freshModules.map((mod) => {
      const presetType = presetTypeMap[mod.type];
      if (!presetType) return mod;
      const defaultPresetId = defaultPresets[presetType];
      if (!defaultPresetId) return mod;
      const preset = contentPresets.find((p) => p.id === defaultPresetId);
      if (!preset) return mod;
      return { ...mod, ...preset.data };
    });
  }, [templates, defaultPresets, contentPresets]);

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
          { label: 'Pipeline', href: '/deals' },
          { label: deal.name, href: `/deals/${dealId}` },
          { label: 'New Offer' },
        ]}
      />
      <OfferForm
        dealId={dealId}
        customerId={deal.customerId}
        defaultName={autoName}
        defaultVersion={nextVersion}
        onSave={handleSave}
        initialModules={initialModules}
      />
    </Box>
  );
}
