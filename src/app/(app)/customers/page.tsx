'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import MultiSelectFilter from '@/components/shared/MultiSelectFilter';
import { useCustomerStore } from '@/stores/customerStore';
import { useDealStore } from '@/stores/dealStore';
import { useHydration } from '@/hooks/useHydration';

export default function CustomersPage() {
  const hydrated = useHydration();
  const router = useRouter();
  const customers = useCustomerStore((s) => s.customers);
  const deals = useDealStore((s) => s.deals);

  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState<string[]>([]);
  const [segmentFilter, setSegmentFilter] = useState<string[]>([]);
  const [amFilter, setAmFilter] = useState<string[]>([]);

  const countries = useMemo(
    () => Array.from(new Set(customers.map((c) => c.country))).sort(),
    [customers]
  );
  const segments = useMemo(
    () => Array.from(new Set(customers.map((c) => c.segment))).sort(),
    [customers]
  );
  const accountManagers = useMemo(
    () => Array.from(new Set(customers.map((c) => c.assignedAM))).sort(),
    [customers]
  );

  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(lower));
    }
    if (countryFilter.length > 0) {
      result = result.filter((c) => countryFilter.includes(c.country));
    }
    if (segmentFilter.length > 0) {
      result = result.filter((c) => segmentFilter.includes(c.segment));
    }
    if (amFilter.length > 0) {
      result = result.filter((c) => amFilter.includes(c.assignedAM));
    }

    result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [customers, search, countryFilter, segmentFilter, amFilter]);

  const getDealCount = (customerId: string) =>
    deals.filter((d) => d.customerId === customerId).length;

  const getLastUpdated = (customerId: string) => {
    const customerDeals = deals.filter((d) => d.customerId === customerId);
    if (customerDeals.length === 0) return null;
    return customerDeals.reduce((latest, d) =>
      d.updatedAt > latest.updatedAt ? d : latest
    ).updatedAt;
  };

  if (!hydrated) return null;

  return (
    <Box>
      <PageHeader
        title="Customers"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} disabled>
            Add Customer
          </Button>
        }
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <TextField
          size="small"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 240 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <MultiSelectFilter
          label="Country"
          options={countries}
          selected={countryFilter}
          onChange={setCountryFilter}
          minWidth={160}
        />
        <MultiSelectFilter
          label="Segment"
          options={segments}
          selected={segmentFilter}
          onChange={setSegmentFilter}
          minWidth={160}
        />
        <MultiSelectFilter
          label="Assigned AM"
          options={accountManagers}
          selected={amFilter}
          onChange={setAmFilter}
          minWidth={180}
        />
      </Box>

      {filteredCustomers.length === 0 ? (
        <EmptyState message="No customers found." />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Customer Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Country</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Segment</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Assigned AM</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  # Deals
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Last Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers.map((customer) => {
                const dealCount = getDealCount(customer.id);
                const lastUpdated = getLastUpdated(customer.id);
                return (
                  <TableRow
                    key={customer.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/customers/${customer.id}`)}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>{customer.name}</TableCell>
                    <TableCell>{customer.country}</TableCell>
                    <TableCell>{customer.segment}</TableCell>
                    <TableCell>{customer.assignedAM}</TableCell>
                    <TableCell align="center">{dealCount}</TableCell>
                    <TableCell>
                      {lastUpdated
                        ? new Date(lastUpdated).toLocaleDateString()
                        : '\u2014'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
