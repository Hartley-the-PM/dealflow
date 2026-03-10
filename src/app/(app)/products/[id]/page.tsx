'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import PageHeader from '@/components/shared/PageHeader';
import ProductCard from '@/components/products/ProductCard';
import StatusChip from '@/components/shared/StatusChip';
import EmptyState from '@/components/shared/EmptyState';
import MSPPriceChart from '@/components/catalog/MSPPriceChart';
import { useProductStore } from '@/stores/productStore';
import { usePricingStore } from '@/stores/pricingStore';
import { useDealStore } from '@/stores/dealStore';
import { useOfferStore } from '@/stores/offerStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useHydration } from '@/hooks/useHydration';
import { format } from 'date-fns';

interface DealUsageRow {
  dealId: string;
  customerName: string;
  dealName: string;
  offerVersion: number;
  price: number;
  currency: string;
  offerStatus: string;
  margin: number | null;
  date: string;
}

export default function ProductDetailPage() {
  const hydrated = useHydration();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const getProductById = useProductStore((s) => s.getProductById);
  const entries = usePricingStore((s) => s.entries);
  const deals = useDealStore((s) => s.deals);
  const offers = useOfferStore((s) => s.offers);
  const getCustomerById = useCustomerStore((s) => s.getCustomerById);

  const product = getProductById(id);

  const getLatestMSP = useMemo(() => {
    const productEntries = entries
      .filter((e) => e.productId === id)
      .sort((a, b) => b.month.localeCompare(a.month));
    return productEntries.length > 0 ? productEntries[0].price : null;
  }, [entries, id]);

  const dealUsageRows = useMemo((): DealUsageRow[] => {
    const rows: DealUsageRow[] = [];

    for (const offer of offers) {
      const matchingLines = offer.lines.filter((line) => line.productId === id);
      if (matchingLines.length === 0) continue;

      const deal = deals.find((d) => d.id === offer.dealId);
      if (!deal) continue;

      const customer = getCustomerById(deal.customerId);
      const customerName = customer?.name || 'Unknown';

      for (const line of matchingLines) {
        const margin =
          getLatestMSP !== null && line.pricePerUnit > 0
            ? ((line.pricePerUnit - getLatestMSP) / line.pricePerUnit) * 100
            : null;

        rows.push({
          dealId: deal.id,
          customerName,
          dealName: deal.name,
          offerVersion: offer.version,
          price: line.pricePerUnit,
          currency: line.currency,
          offerStatus: offer.status,
          margin,
          date: offer.updatedAt,
        });
      }
    }

    rows.sort((a, b) => b.date.localeCompare(a.date));
    return rows;
  }, [offers, deals, id, getCustomerById, getLatestMSP]);

  if (!hydrated) return null;

  if (!product) {
    return (
      <Box>
        <PageHeader
          title="Product Not Found"
          breadcrumbs={[{ label: 'Products', href: '/products' }]}
        />
        <EmptyState message="The requested product could not be found." />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={product.name}
        breadcrumbs={[
          { label: 'Products', href: '/products' },
          { label: product.name },
        ]}
      />

      <Box sx={{ mb: 4, maxWidth: 400 }}>
        <ProductCard product={product} />
      </Box>

      {/* MSP Price History Chart */}
      <MSPPriceChart productId={id} />

      {/* Deals Using This Product */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Deals Using This Product
      </Typography>

      {dealUsageRows.length === 0 ? (
        <Paper variant="outlined">
          <EmptyState message="No deals currently use this product." />
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Deal Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  Offer Version
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">
                  Price
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">
                  Margin vs MSP
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dealUsageRows.map((row, index) => (
                <TableRow
                  key={`${row.dealId}-${row.offerVersion}-${index}`}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/deals/${row.dealId}`)}
                >
                  <TableCell>{row.customerName}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{row.dealName}</TableCell>
                  <TableCell align="center">v{row.offerVersion}</TableCell>
                  <TableCell align="right">
                    {row.currency === 'EUR' ? '\u20AC' : '$'}
                    {row.price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={row.offerStatus as any} type="offer" />
                  </TableCell>
                  <TableCell align="right">
                    {row.margin !== null ? (
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{
                          color: row.margin >= 0 ? 'success.main' : 'error.main',
                          fontWeight: 600,
                        }}
                      >
                        {row.margin >= 0 ? '+' : ''}
                        {row.margin.toFixed(1)}%
                      </Typography>
                    ) : (
                      '\u2014'
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(row.date), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
