'use client';

import { useMemo } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { Offer } from '@/types';

interface MonthlyActivityProps {
  offers: Offer[];
}

interface MonthlyData {
  month: string;
  label: string;
  offersSent: number;
  approved: number;
}

export default function MonthlyActivity({ offers }: MonthlyActivityProps) {
  const data = useMemo(() => {
    const monthSentMap = new Map<string, number>();
    const monthApprovedMap = new Map<string, number>();

    for (const offer of offers) {
      // Count offers sent per month (based on sentAt)
      if (offer.sentAt) {
        const sentMonth = format(parseISO(offer.sentAt), 'yyyy-MM');
        monthSentMap.set(sentMonth, (monthSentMap.get(sentMonth) ?? 0) + 1);
      }

      // Count approved offers per month (based on updatedAt)
      if (offer.status === 'Approved') {
        const approvedMonth = format(parseISO(offer.updatedAt), 'yyyy-MM');
        monthApprovedMap.set(approvedMonth, (monthApprovedMap.get(approvedMonth) ?? 0) + 1);
      }
    }

    // Collect all unique months and sort them
    const allMonths = new Set<string>();
    for (const m of monthSentMap.keys()) allMonths.add(m);
    for (const m of monthApprovedMap.keys()) allMonths.add(m);

    const sortedMonths = Array.from(allMonths).sort();

    const results: MonthlyData[] = sortedMonths.map((month) => ({
      month,
      label: format(parseISO(`${month}-01`), 'MMM yyyy'),
      offersSent: monthSentMap.get(month) ?? 0,
      approved: monthApprovedMap.get(month) ?? 0,
    }));

    return results;
  }, [offers]);

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Monthly Activity
        </Typography>
        {data.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No activity data available</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="offersSent"
                stroke="#1976d2"
                strokeWidth={2}
                name="Offers Sent"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="approved"
                stroke="#2e7d32"
                strokeWidth={2}
                name="Approved"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
