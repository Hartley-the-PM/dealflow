'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { useOfferStore } from '@/stores/offerStore';
import { usePricingStore } from '@/stores/pricingStore';
import { useHydration } from '@/hooks/useHydration';

interface SummaryItemProps {
  label: string;
  value: string;
}

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <Box sx={{ textAlign: 'center', flex: 1, py: 1 }}>
      <Typography variant="h5" fontWeight={700}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

export default function MonthlySummary() {
  const hydrated = useHydration();
  const offers = useOfferStore((s) => s.offers);
  const getMSPForProduct = usePricingStore((s) => s.getMSPForProduct);

  if (!hydrated) {
    return (
      <Card variant="outlined" sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton width={120} height={28} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={80} />
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const currentMonth = format(now, 'yyyy-MM');

  // Offers sent this month
  const offersSentThisMonth = offers.filter((o) => {
    if (!o.sentAt) return false;
    const sentDate = new Date(o.sentAt);
    return isWithinInterval(sentDate, { start: monthStart, end: monthEnd });
  });

  // Offers resolved this month (approved or rejected, based on updatedAt)
  const approvedThisMonth = offers.filter((o) => {
    if (o.status !== 'Approved') return false;
    const updated = new Date(o.updatedAt);
    return isWithinInterval(updated, { start: monthStart, end: monthEnd });
  });

  const rejectedThisMonth = offers.filter((o) => {
    if (o.status !== 'Rejected') return false;
    const updated = new Date(o.updatedAt);
    return isWithinInterval(updated, { start: monthStart, end: monthEnd });
  });

  const totalResolved = approvedThisMonth.length + rejectedThisMonth.length;
  const winRate = totalResolved > 0
    ? Math.round((approvedThisMonth.length / totalResolved) * 100)
    : 0;

  // Avg margin vs MSP for approved offers this month
  const margins: number[] = [];
  for (const offer of approvedThisMonth) {
    for (const line of offer.lines) {
      const mspEntry = getMSPForProduct(line.productId, currentMonth);
      if (mspEntry && mspEntry.price > 0 && line.pricePerUnit > 0) {
        const margin = ((line.pricePerUnit - mspEntry.price) / line.pricePerUnit) * 100;
        margins.push(margin);
      }
    }
  }
  const avgMargin = margins.length > 0
    ? (margins.reduce((sum, m) => sum + m, 0) / margins.length).toFixed(1)
    : '--';

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          This Month
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          {format(now, 'MMMM yyyy')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
          <SummaryItem label="Offers Sent" value={String(offersSentThisMonth.length)} />
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <SummaryItem
            label="Win Rate"
            value={totalResolved > 0 ? `${winRate}%` : '--'}
          />
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <SummaryItem
            label="Avg Margin vs MSP"
            value={avgMargin !== '--' ? `${avgMargin}%` : '--'}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
