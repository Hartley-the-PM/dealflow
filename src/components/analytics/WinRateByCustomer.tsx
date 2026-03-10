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
} from 'recharts';
import type { Offer, Deal, Customer } from '@/types';

interface WinRateByCustomerProps {
  offers: Offer[];
  deals: Deal[];
  customers: Customer[];
}

interface CustomerWinRateData {
  name: string;
  winRate: number;
  total: number;
  approved: number;
}

export default function WinRateByCustomer({ offers, deals, customers }: WinRateByCustomerProps) {
  const data = useMemo(() => {
    // Build dealId -> customerId lookup
    const dealCustomerMap = new Map<string, string>();
    for (const deal of deals) {
      dealCustomerMap.set(deal.id, deal.customerId);
    }

    // Build customerId -> name lookup
    const customerNameMap = new Map<string, string>();
    for (const customer of customers) {
      customerNameMap.set(customer.id, customer.name);
    }

    // Group offers by customer
    const customerTotalMap = new Map<string, number>();
    const customerApprovedMap = new Map<string, number>();

    for (const offer of offers) {
      const customerId = dealCustomerMap.get(offer.dealId);
      if (!customerId) continue;

      customerTotalMap.set(customerId, (customerTotalMap.get(customerId) ?? 0) + 1);
      if (offer.status === 'Approved') {
        customerApprovedMap.set(customerId, (customerApprovedMap.get(customerId) ?? 0) + 1);
      }
    }

    const results: CustomerWinRateData[] = [];

    for (const [customerId, total] of customerTotalMap.entries()) {
      const approved = customerApprovedMap.get(customerId) ?? 0;
      const winRate = total > 0 ? (approved / total) * 100 : 0;
      results.push({
        name: customerNameMap.get(customerId) ?? 'Unknown',
        winRate: Math.round(winRate * 10) / 10,
        total,
        approved,
      });
    }

    // Sort by win rate descending
    results.sort((a, b) => b.winRate - a.winRate);

    return results;
  }, [offers, deals, customers]);

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Win Rate by Customer
        </Typography>
        {data.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No offer data available</Typography>
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
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, 'Win Rate']}
                labelFormatter={(label) => label}
              />
              <Bar dataKey="winRate" fill="#1976d2" radius={[4, 4, 0, 0]} name="Win Rate" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
