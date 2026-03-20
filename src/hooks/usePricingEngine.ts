'use client';

import { useCallback } from 'react';
import { usePricingEngineStore } from '@/stores/pricingEngineStore';
import { usePricingStore } from '@/stores/pricingStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useProductStore } from '@/stores/productStore';
import { computePrice } from '@/lib/pricingEngine';
import type { Incoterms } from '@/types';
import type { PricingResult } from '@/types/pricingEngine';

export function usePricingEngine() {
  const basePrices = usePricingEngineStore((s) => s.basePrices);
  const costs = usePricingEngineStore((s) => s.costs);
  const rules = usePricingEngineStore((s) => s.rules);
  const overrides = usePricingEngineStore((s) => s.overrides);
  const guardrails = usePricingEngineStore((s) => s.guardrails);
  const mspEntries = usePricingStore((s) => s.entries);
  const customers = useCustomerStore((s) => s.customers);
  const products = useProductStore((s) => s.products);

  const calculate = useCallback(
    (
      productId: string,
      quantity: number,
      customerId: string,
      incoterms: Incoterms,
      paymentTerms: string
    ): PricingResult => {
      const customer = customers.find((c) => c.id === customerId);
      const product = products.find((p) => p.id === productId);

      return computePrice(
        {
          productId,
          quantity,
          customerId,
          customerTier: customer?.tier ?? 'C',
          incoterms,
          paymentTerms,
          productCategory: product?.productType ?? '',
        },
        {
          basePrices,
          costs,
          rules: rules.filter((r) => r.active),
          overrides,
          guardrails: guardrails.filter((g) => g.active),
          mspEntries,
        }
      );
    },
    [basePrices, costs, rules, overrides, guardrails, mspEntries, customers, products]
  );

  return { computePrice: calculate };
}
