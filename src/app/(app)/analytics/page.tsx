'use client';

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import PageHeader from '@/components/shared/PageHeader';
import MultiSelectFilter from '@/components/shared/MultiSelectFilter';
import DateRangeFilter from '@/components/shared/DateRangeFilter';
import dynamic from 'next/dynamic';
import DashboardToolbar from '@/components/analytics/DashboardToolbar';
import ChartBuilderDialog from '@/components/analytics/ChartBuilderDialog';

const DashboardGrid = dynamic(() => import('@/components/analytics/DashboardGrid'), { ssr: false });
import { useOfferStore } from '@/stores/offerStore';
import { useDealStore } from '@/stores/dealStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useProductStore } from '@/stores/productStore';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useHydration } from '@/hooks/useHydration';
import { isWithinInterval, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import type { OfferStatus } from '@/types';

const STATUS_OPTIONS: OfferStatus[] = ['Draft', 'Sent', 'Pending', 'Approved', 'Rejected', 'Expired'];

export default function AnalyticsPage() {
  const hydrated = useHydration();
  const offers = useOfferStore((s) => s.offers);
  const deals = useDealStore((s) => s.deals);
  const customers = useCustomerStore((s) => s.customers);
  const products = useProductStore((s) => s.products);
  const getActiveDashboard = useDashboardStore((s) => s.getActiveDashboard);
  const isBuilderOpen = useDashboardStore((s) => s.isBuilderOpen);

  const [startDate, setStartDate] = useState<Date | null>(new Date(2025, 0, 1));
  const [endDate, setEndDate] = useState<Date | null>(new Date(2026, 2, 31));
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const customerOptions = useMemo(
    () => customers.map((c) => c.name).sort(),
    [customers]
  );

  const customerNameToId = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach((c) => map.set(c.name, c.id));
    return map;
  }, [customers]);

  const productOptions = useMemo(
    () => products.map((p) => p.name).sort(),
    [products]
  );

  const productNameToId = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => map.set(p.name, p.id));
    return map;
  }, [products]);

  const dealCustomerMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const deal of deals) {
      map.set(deal.id, deal.customerId);
    }
    return map;
  }, [deals]);

  const filteredOffers = useMemo(() => {
    const rangeStart = startDate ? startOfMonth(startDate) : new Date(2000, 0, 1);
    const rangeEnd = endDate ? endOfMonth(endDate) : new Date(2099, 11, 31);

    return offers.filter((offer) => {
      const createdDate = parseISO(offer.createdAt);
      if (!isWithinInterval(createdDate, { start: rangeStart, end: rangeEnd })) {
        return false;
      }

      if (selectedStatuses.length > 0 && !selectedStatuses.includes(offer.status)) {
        return false;
      }

      if (selectedCustomers.length > 0) {
        const customerIds = selectedCustomers.map((name) => customerNameToId.get(name)).filter(Boolean);
        const customerId = dealCustomerMap.get(offer.dealId);
        if (!customerId || !customerIds.includes(customerId)) {
          return false;
        }
      }

      if (selectedProducts.length > 0) {
        const productIds = selectedProducts.map((name) => productNameToId.get(name)).filter(Boolean);
        const hasProduct = offer.lines.some((line) => productIds.includes(line.productId));
        if (!hasProduct) {
          return false;
        }
      }

      return true;
    });
  }, [offers, startDate, endDate, selectedStatuses, selectedCustomers, selectedProducts, dealCustomerMap, customerNameToId, productNameToId]);

  if (!hydrated) {
    return (
      <Box>
        <PageHeader title="Analytics" />
        <Skeleton variant="rounded" height={80} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={48} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={600} />
      </Box>
    );
  }

  const activeDashboard = getActiveDashboard();

  return (
    <Box>
      <PageHeader title="Analytics" />

      {/* Filters */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartChange={setStartDate}
              onEndChange={setEndDate}
            />
            <MultiSelectFilter
              label="Customer"
              options={customerOptions}
              selected={selectedCustomers}
              onChange={setSelectedCustomers}
              minWidth={200}
            />
            <MultiSelectFilter
              label="Product"
              options={productOptions}
              selected={selectedProducts}
              onChange={setSelectedProducts}
              minWidth={200}
            />
            <MultiSelectFilter
              label="Status"
              options={STATUS_OPTIONS}
              selected={selectedStatuses}
              onChange={setSelectedStatuses}
              minWidth={140}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Dashboard Toolbar */}
      <DashboardToolbar />

      {/* Dashboard Grid */}
      <DashboardGrid
        dashboard={activeDashboard}
        filteredOffers={filteredOffers}
        deals={deals}
        customers={customers}
      />

      {/* AI Chart Builder Dialog */}
      {isBuilderOpen && <ChartBuilderDialog />}
    </Box>
  );
}
