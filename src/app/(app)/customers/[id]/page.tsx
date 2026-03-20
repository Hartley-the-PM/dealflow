'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import PageHeader from '@/components/shared/PageHeader';
import CustomerOverview from '@/components/customers/CustomerOverview';
import CustomerProducts from '@/components/customers/CustomerProducts';
import CustomerDeals from '@/components/customers/CustomerDeals';
import CustomerContacts from '@/components/customers/CustomerContacts';
import CustomerDealNotes from '@/components/customers/CustomerDealNotes';
import CustomerDealActivity from '@/components/customers/CustomerDealActivity';
import { useCustomerStore } from '@/stores/customerStore';
import { useHydration } from '@/hooks/useHydration';

export default function CustomerDetailPage() {
  const hydrated = useHydration();
  const params = useParams();
  const id = params.id as string;
  const getCustomerById = useCustomerStore((s) => s.getCustomerById);
  const customer = getCustomerById(id);

  const [tab, setTab] = useState(0);

  if (!hydrated) return null;

  if (!customer) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography color="text.secondary">Customer not found.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={customer.name}
        breadcrumbs={[
          { label: 'Customers', href: '/customers' },
          { label: customer.name },
        ]}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Overview" />
          <Tab label="Products" />
          <Tab label="Deals" />
          <Tab label="Notes & Activity" />
          <Tab label="Contacts" />
        </Tabs>
      </Box>

      {tab === 0 && <CustomerOverview customer={customer} />}
      {tab === 1 && <CustomerProducts customerId={customer.id} />}
      {tab === 2 && <CustomerDeals customerId={customer.id} />}
      {tab === 3 && (
        <Box>
          <CustomerDealNotes customerId={customer.id} />
          <Box sx={{ mt: 4 }}>
            <CustomerDealActivity customerId={customer.id} />
          </Box>
        </Box>
      )}
      {tab === 4 && <CustomerContacts customerId={customer.id} />}
    </Box>
  );
}
