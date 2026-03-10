'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import DraftsIcon from '@mui/icons-material/Drafts';
import SendIcon from '@mui/icons-material/Send';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TimerOffIcon from '@mui/icons-material/TimerOff';
import NextLink from 'next/link';
import { useOfferStore } from '@/stores/offerStore';
import { useHydration } from '@/hooks/useHydration';
import type { OfferStatus } from '@/types';

interface StatusCardConfig {
  status: OfferStatus;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

const statusCards: StatusCardConfig[] = [
  { status: 'Draft', icon: <DraftsIcon />, color: '#374151', bg: '#F3F4F6' },
  { status: 'Sent', icon: <SendIcon />, color: '#1D4ED8', bg: '#DBEAFE' },
  { status: 'Pending', icon: <HourglassEmptyIcon />, color: '#D97706', bg: '#FEF3C7' },
  { status: 'Approved', icon: <CheckCircleIcon />, color: '#059669', bg: '#D1FAE5' },
  { status: 'Rejected', icon: <CancelIcon />, color: '#DC2626', bg: '#FEE2E2' },
  { status: 'Expired', icon: <TimerOffIcon />, color: '#9CA3AF', bg: '#F3F4F6' },
];

export default function StatusCards() {
  const hydrated = useHydration();
  const offers = useOfferStore((s) => s.offers);

  if (!hydrated) {
    return (
      <Grid container spacing={2}>
        {statusCards.map((cfg) => (
          <Grid size={{ xs: 6, sm: 4, md: 2 }} key={cfg.status}>
            <Skeleton variant="rounded" height={100} />
          </Grid>
        ))}
      </Grid>
    );
  }

  const countByStatus = (status: OfferStatus) =>
    offers.filter((o) => o.status === status).length;

  return (
    <Grid container spacing={2}>
      {statusCards.map((cfg) => (
        <Grid size={{ xs: 6, sm: 4, md: 2 }} key={cfg.status}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              borderColor: cfg.bg,
              transition: 'box-shadow 0.2s',
              '&:hover': { boxShadow: 3 },
            }}
          >
            <CardActionArea
              component={NextLink}
              href={`/deals?status=${cfg.status}`}
              sx={{ p: 2, height: '100%' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 1,
                    bgcolor: cfg.bg,
                    color: cfg.color,
                  }}
                >
                  {cfg.icon}
                </Box>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  {cfg.status}
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ color: cfg.color }}>
                {countByStatus(cfg.status)}
              </Typography>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
