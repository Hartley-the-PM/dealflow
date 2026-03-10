'use client';
import { useEffect } from 'react';
import { useCustomerStore } from '@/stores/customerStore';
import { useDealStore } from '@/stores/dealStore';
import { useOfferStore } from '@/stores/offerStore';
import { useProductStore } from '@/stores/productStore';
import { usePricingStore } from '@/stores/pricingStore';
import { useOrderStore } from '@/stores/orderStore';
import { useReminderStore } from '@/stores/reminderStore';
import { useActivityStore } from '@/stores/activityStore';
import { useDealNoteStore } from '@/stores/dealNoteStore';
import { usePricingEngineStore } from '@/stores/pricingEngineStore';

import customersData from '@/data/customers.json';
import productsData from '@/data/products.json';
import pricingData from '@/data/pricing.json';
import dealsData from '@/data/deals.json';
import offersData from '@/data/offers.json';
import ordersData from '@/data/orders.json';
import remindersData from '@/data/reminders.json';
import activitiesData from '@/data/activities.json';
import dealNotesData from '@/data/dealNotes.json';
import basePricesData from '@/data/basePrices.json';
import costsData from '@/data/costs.json';
import pricingRulesData from '@/data/pricingRules.json';
import customerOverridesData from '@/data/customerOverrides.json';
import guardrailsData from '@/data/guardrails.json';

export default function SeedInitializer() {
  const customers = useCustomerStore((s) => s.customers);
  const setCustomers = useCustomerStore((s) => s.setCustomers);
  const setContacts = useCustomerStore((s) => s.setContacts);
  const setNotes = useCustomerStore((s) => s.setNotes);
  const products = useProductStore((s) => s.products);
  const setProducts = useProductStore((s) => s.setProducts);
  const entries = usePricingStore((s) => s.entries);
  const setEntries = usePricingStore((s) => s.setEntries);
  const deals = useDealStore((s) => s.deals);
  const setDeals = useDealStore((s) => s.setDeals);
  const offers = useOfferStore((s) => s.offers);
  const setOffers = useOfferStore((s) => s.setOffers);
  const orders = useOrderStore((s) => s.orders);
  const setOrders = useOrderStore((s) => s.setOrders);
  const reminders = useReminderStore((s) => s.reminders);
  const setReminders = useReminderStore((s) => s.setReminders);
  const activities = useActivityStore((s) => s.activities);
  const setActivities = useActivityStore((s) => s.setActivities);
  const dealNotes = useDealNoteStore((s) => s.notes);
  const setDealNotes = useDealNoteStore((s) => s.setNotes);
  const basePrices = usePricingEngineStore((s) => s.basePrices);
  const setBasePrices = usePricingEngineStore((s) => s.setBasePrices);
  const peCosts = usePricingEngineStore((s) => s.costs);
  const setCosts = usePricingEngineStore((s) => s.setCosts);
  const peRules = usePricingEngineStore((s) => s.rules);
  const setRules = usePricingEngineStore((s) => s.setRules);
  const peOverrides = usePricingEngineStore((s) => s.overrides);
  const setOverrides = usePricingEngineStore((s) => s.setOverrides);
  const peGuardrails = usePricingEngineStore((s) => s.guardrails);
  const setGuardrails = usePricingEngineStore((s) => s.setGuardrails);

  useEffect(() => {
    // Only seed if stores are empty (first load)
    if (customers.length === 0) {
      setCustomers(customersData as any);
      setContacts([]);
      setNotes([]);
    }
    if (products.length === 0) setProducts(productsData as any);
    if (entries.length === 0 || entries.length < 200) setEntries(pricingData as any);
    if (deals.length === 0) setDeals(dealsData as any);
    if (offers.length === 0 || offers.length < 15) setOffers(offersData as any);
    if (orders.length === 0 || orders.length < 5) setOrders(ordersData as any);
    if (reminders.length === 0) setReminders(remindersData as any);
    if (activities.length === 0) setActivities(activitiesData as any);
    if (dealNotes.length === 0) setDealNotes(dealNotesData as any);
    if (basePrices.length === 0) setBasePrices(basePricesData as any);
    if (peCosts.length === 0) setCosts(costsData as any);
    if (peRules.length === 0 || peRules.length < 7) setRules(pricingRulesData as any);
    if (peOverrides.length === 0) setOverrides(customerOverridesData as any);
    if (peGuardrails.length === 0) setGuardrails(guardrailsData as any);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
