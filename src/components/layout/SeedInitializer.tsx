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
import { useOpportunityStore } from '@/stores/opportunityStore';
import { useAgentStore } from '@/stores/agentStore';
import { useSampleStore } from '@/stores/sampleStore';
import { useWhiteLabelStore } from '@/stores/whiteLabelStore';
import { useFormulationStore } from '@/stores/formulationStore';

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
import opportunitiesData from '@/data/opportunities.json';
import agentsData from '@/data/agents.json';
import samplesData from '@/data/samples.json';
import whiteLabelBrandsData from '@/data/whiteLabelBrands.json';
import whiteLabelProductsData from '@/data/whiteLabelProducts.json';
import formulationsData from '@/data/formulations.json';

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
  const opportunities = useOpportunityStore((s) => s.opportunities);
  const setOpportunities = useOpportunityStore((s) => s.setOpportunities);
  const agentAgents = useAgentStore((s) => s.agents);
  const setAgentAgents = useAgentStore((s) => s.setAgents);
  const agentActivities = useAgentStore((s) => s.activities);
  const setAgentActivities = useAgentStore((s) => s.setActivities);
  const agentDrafts = useAgentStore((s) => s.drafts);
  const setAgentDrafts = useAgentStore((s) => s.setDrafts);
  const samples = useSampleStore((s) => s.samples);
  const setSamples = useSampleStore((s) => s.setSamples);
  const wlBrands = useWhiteLabelStore((s) => s.brands);
  const setWlBrands = useWhiteLabelStore((s) => s.setBrands);
  const wlProducts = useWhiteLabelStore((s) => s.products);
  const setWlProducts = useWhiteLabelStore((s) => s.setProducts);
  const formulations = useFormulationStore((s) => s.formulations);
  const setFormulations = useFormulationStore((s) => s.setFormulations);

  useEffect(() => {
    // Only seed if stores are empty (first load)
    if (customers.length === 0) {
      setCustomers(customersData as any);
      setContacts([]);
      setNotes([]);
    }
    if (products.length === 0 || !(products[0] as any).materialType) setProducts(productsData as any);
    if (entries.length === 0 || entries.length < 200) setEntries(pricingData as any);
    if (deals.length === 0 || !(deals[0] as any).pipelineStage) setDeals(dealsData as any);
    if (offers.length === 0 || offers.length < 15) setOffers(offersData as any);
    if (orders.length === 0 || !(orders[0] as any).name) setOrders(ordersData as any);
    if (reminders.length === 0) setReminders(remindersData as any);
    if (activities.length === 0) setActivities(activitiesData as any);
    if (dealNotes.length === 0) setDealNotes(dealNotesData as any);
    if (basePrices.length === 0) setBasePrices(basePricesData as any);
    if (peCosts.length === 0) setCosts(costsData as any);
    if (peRules.length === 0 || peRules.length < 7) setRules(pricingRulesData as any);
    if (peOverrides.length === 0) setOverrides(customerOverridesData as any);
    if (peGuardrails.length === 0) setGuardrails(guardrailsData as any);
    if (opportunities.length === 0 || (opportunities[0] as any).probability === undefined) setOpportunities(opportunitiesData as any);
    if (agentAgents.length === 0) setAgentAgents(agentsData.agents as any);
    if (agentActivities.length === 0) setAgentActivities(agentsData.activities as any);
    if (agentDrafts.length === 0) setAgentDrafts(agentsData.drafts as any);
    if (samples.length === 0) setSamples(samplesData as any);
    if (wlBrands.length === 0) setWlBrands(whiteLabelBrandsData as any);
    if (wlProducts.length === 0) setWlProducts(whiteLabelProductsData as any);
    if (formulations.length === 0) setFormulations(formulationsData as any);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
