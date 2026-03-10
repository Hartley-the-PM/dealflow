'use client';
import Chip from '@mui/material/Chip';
import type { OfferStatus } from '@/types';
import type { DealStatus } from '@/types';

const offerStatusColors: Record<OfferStatus, { bg: string; color: string }> = {
  Draft: { bg: '#F3F4F6', color: '#374151' },
  Sent: { bg: '#DBEAFE', color: '#1D4ED8' },
  Pending: { bg: '#FEF3C7', color: '#D97706' },
  Approved: { bg: '#D1FAE5', color: '#059669' },
  Rejected: { bg: '#FEE2E2', color: '#DC2626' },
  Expired: { bg: '#F3F4F6', color: '#9CA3AF' },
};

const dealStatusColors: Record<DealStatus, { bg: string; color: string }> = {
  Draft: { bg: '#F3F4F6', color: '#374151' },
  Active: { bg: '#DBEAFE', color: '#1D4ED8' },
  Won: { bg: '#D1FAE5', color: '#059669' },
  Lost: { bg: '#FEE2E2', color: '#DC2626' },
  Expired: { bg: '#F3F4F6', color: '#9CA3AF' },
};

interface StatusChipProps {
  status: OfferStatus | DealStatus;
  type?: 'offer' | 'deal';
  size?: 'small' | 'medium';
}

export default function StatusChip({ status, type = 'offer', size = 'small' }: StatusChipProps) {
  const colors = type === 'deal'
    ? dealStatusColors[status as DealStatus] || { bg: '#F3F4F6', color: '#374151' }
    : offerStatusColors[status as OfferStatus] || { bg: '#F3F4F6', color: '#374151' };

  return (
    <Chip
      label={status}
      size={size}
      sx={{
        bgcolor: colors.bg,
        color: colors.color,
        fontWeight: 600,
        fontSize: size === 'small' ? '0.75rem' : '0.8125rem',
      }}
    />
  );
}
