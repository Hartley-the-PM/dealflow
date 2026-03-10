'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import NextLink from 'next/link';
import EmptyState from '@/components/shared/EmptyState';
import { useOfferStore } from '@/stores/offerStore';
import { useProductStore } from '@/stores/productStore';
import { usePricingStore } from '@/stores/pricingStore';
import { format } from 'date-fns';

interface DealProductsProps {
  dealId: string;
}

interface ProductAggregate {
  productId: string;
  name: string;
  code: string;
  category: string;
  appearances: number;
  latestPrice: number;
  latestCurrency: string;
  msp: number | null;
  margin: number | null;
}

export default function DealProducts({ dealId }: DealProductsProps) {
  const getOffersByDeal = useOfferStore((s) => s.getOffersByDeal);
  const getProductById = useProductStore((s) => s.getProductById);
  const getMSPForProduct = usePricingStore((s) => s.getMSPForProduct);

  const currentMonth = format(new Date(), 'yyyy-MM');

  const products = useMemo(() => {
    const offers = getOffersByDeal(dealId);
    const productMap = new Map<
      string,
      { appearances: Set<number>; latestPrice: number; latestCurrency: string; latestVersion: number }
    >();

    offers.forEach((offer) => {
      offer.lines.forEach((line) => {
        const existing = productMap.get(line.productId);
        if (!existing) {
          productMap.set(line.productId, {
            appearances: new Set([offer.version]),
            latestPrice: line.pricePerUnit,
            latestCurrency: line.currency,
            latestVersion: offer.version,
          });
        } else {
          existing.appearances.add(offer.version);
          if (offer.version > existing.latestVersion) {
            existing.latestPrice = line.pricePerUnit;
            existing.latestCurrency = line.currency;
            existing.latestVersion = offer.version;
          }
        }
      });
    });

    const aggregated: ProductAggregate[] = [];
    productMap.forEach((data, productId) => {
      const product = getProductById(productId);
      if (!product) return;

      const mspEntry = getMSPForProduct(productId, currentMonth);
      const mspPrice = mspEntry ? mspEntry.price : null;
      let margin: number | null = null;
      if (mspPrice !== null && data.latestPrice > 0) {
        margin =
          ((data.latestPrice - mspPrice) / data.latestPrice) * 100;
      }

      aggregated.push({
        productId,
        name: product.name,
        code: product.code,
        category: product.category,
        appearances: data.appearances.size,
        latestPrice: data.latestPrice,
        latestCurrency: data.latestCurrency,
        msp: mspPrice,
        margin,
      });
    });

    return aggregated.sort((a, b) => a.name.localeCompare(b.name));
  }, [getOffersByDeal, dealId, getProductById, getMSPForProduct, currentMonth]);

  if (products.length === 0) {
    return <EmptyState message="No products in any offers for this deal." />;
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Product Name</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="center">
              Appearances
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">
              Latest Price
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">
              MSP
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">
              Margin
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.productId} hover>
              <TableCell>
                <Link
                  component={NextLink}
                  href={`/products/${p.productId}`}
                  underline="hover"
                  sx={{ fontWeight: 500 }}
                >
                  {p.name}
                </Link>
              </TableCell>
              <TableCell>{p.code}</TableCell>
              <TableCell>{p.category}</TableCell>
              <TableCell align="center">{p.appearances}</TableCell>
              <TableCell align="right">
                {p.latestCurrency}{' '}
                {p.latestPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell align="right">
                {p.msp !== null
                  ? p.msp.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : '\u2014'}
              </TableCell>
              <TableCell align="right">
                {p.margin !== null ? (
                  <Box
                    component="span"
                    sx={{
                      color: p.margin >= 0 ? 'success.main' : 'error.main',
                      fontWeight: 500,
                    }}
                  >
                    {p.margin.toFixed(1)}%
                  </Box>
                ) : (
                  '\u2014'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
