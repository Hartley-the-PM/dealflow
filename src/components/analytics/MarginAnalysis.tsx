'use client';

import { useMemo } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { useProductStore } from '@/stores/productStore';
import { usePricingStore } from '@/stores/pricingStore';
import type { Offer } from '@/types';

interface MarginAnalysisProps {
  offers: Offer[];
}

interface MarginData {
  productId: string;
  name: string;
  margin: number;
}

export default function MarginAnalysis({ offers }: MarginAnalysisProps) {
  const getProductById = useProductStore((s) => s.getProductById);
  const getMSPForProduct = usePricingStore((s) => s.getMSPForProduct);

  const data = useMemo(() => {
    // Only consider approved offers
    const approvedOffers = offers.filter((o) => o.status === 'Approved');

    // Collect margins per product
    const productMargins = new Map<string, number[]>();

    for (const offer of approvedOffers) {
      const offerMonth = format(parseISO(offer.createdAt), 'yyyy-MM');

      for (const line of offer.lines) {
        const mspEntry = getMSPForProduct(line.productId, offerMonth);
        if (!mspEntry || mspEntry.price <= 0 || line.pricePerUnit <= 0) continue;

        const margin = ((line.pricePerUnit - mspEntry.price) / line.pricePerUnit) * 100;

        if (!productMargins.has(line.productId)) {
          productMargins.set(line.productId, []);
        }
        productMargins.get(line.productId)!.push(margin);
      }
    }

    const results: MarginData[] = [];

    for (const [productId, margins] of productMargins.entries()) {
      const product = getProductById(productId);
      const avgMargin = margins.reduce((sum, m) => sum + m, 0) / margins.length;
      const productName = product?.name ?? 'Unknown';

      results.push({
        productId,
        name: productName.length > 20 ? productName.slice(0, 18) + '...' : productName,
        margin: Math.round(avgMargin * 10) / 10,
      });
    }

    // Sort by margin descending
    results.sort((a, b) => b.margin - a.margin);

    return results;
  }, [offers, getProductById, getMSPForProduct]);

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Avg Margin % by Product
        </Typography>
        {data.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No margin data available</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis
                unit="%"
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, 'Avg Margin']}
              />
              <Bar dataKey="margin" radius={[4, 4, 0, 0]} name="Avg Margin">
                {data.map((entry) => (
                  <Cell
                    key={entry.productId}
                    fill={entry.margin >= 0 ? '#2e7d32' : '#d32f2f'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
