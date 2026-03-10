'use client';

import { useMemo } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Box from '@mui/material/Box';
import { useProductStore } from '@/stores/productStore';
import type { Offer } from '@/types';

interface WinRateByProductProps {
  offers: Offer[];
}

interface ProductWinRate {
  productId: string;
  productName: string;
  productCode: string;
  totalOffers: number;
  approvedOffers: number;
  winRate: number;
}

export default function WinRateByProduct({ offers }: WinRateByProductProps) {
  const getProductById = useProductStore((s) => s.getProductById);

  const rows = useMemo(() => {
    // Map productId -> Set of offer IDs that contain it (total and approved)
    const productTotalMap = new Map<string, Set<string>>();
    const productApprovedMap = new Map<string, Set<string>>();

    for (const offer of offers) {
      for (const line of offer.lines) {
        // Track total offers containing this product
        if (!productTotalMap.has(line.productId)) {
          productTotalMap.set(line.productId, new Set());
        }
        productTotalMap.get(line.productId)!.add(offer.id);

        // Track approved offers containing this product
        if (offer.status === 'Approved') {
          if (!productApprovedMap.has(line.productId)) {
            productApprovedMap.set(line.productId, new Set());
          }
          productApprovedMap.get(line.productId)!.add(offer.id);
        }
      }
    }

    const results: ProductWinRate[] = [];

    for (const [productId, offerIds] of productTotalMap.entries()) {
      const product = getProductById(productId);
      const totalOffers = offerIds.size;
      const approvedOffers = productApprovedMap.get(productId)?.size ?? 0;
      const winRate = totalOffers > 0 ? (approvedOffers / totalOffers) * 100 : 0;

      results.push({
        productId,
        productName: product?.name ?? 'Unknown',
        productCode: product?.code ?? '--',
        totalOffers,
        approvedOffers,
        winRate,
      });
    }

    // Sort by win rate descending
    results.sort((a, b) => b.winRate - a.winRate);

    return results;
  }, [offers, getProductById]);

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Win Rate by Product
        </Typography>
        {rows.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No offer data available</Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 340 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Product Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right"># Offers</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right"># Approved</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Win Rate %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.productId} hover>
                    <TableCell>{row.productName}</TableCell>
                    <TableCell>{row.productCode}</TableCell>
                    <TableCell align="right">{row.totalOffers}</TableCell>
                    <TableCell align="right">{row.approvedOffers}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {row.winRate.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
