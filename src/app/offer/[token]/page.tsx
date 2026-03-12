'use client';

import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import BuyerOfferView from '@/components/offers/BuyerOfferView';
import { useOfferShareStore } from '@/stores/offerShareStore';
import { useOfferStore } from '@/stores/offerStore';
import { useHydration } from '@/hooks/useHydration';

export default function BuyerOfferPage() {
  const hydrated = useHydration();
  const params = useParams();
  const token = params.token as string;

  const getShareLinkByToken = useOfferShareStore((s) => s.getShareLinkByToken);
  const getOfferById = useOfferStore((s) => s.getOfferById);

  if (!hydrated) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const shareLink = getShareLinkByToken(token);
  if (!shareLink) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Offer Not Found
          </Typography>
          <Typography color="text.secondary">
            This offer link is invalid or has expired.
          </Typography>
        </Box>
      </Box>
    );
  }

  const offer = getOfferById(shareLink.offerId);
  if (!offer) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Offer Not Available
          </Typography>
          <Typography color="text.secondary">
            This offer is no longer available.
          </Typography>
        </Box>
      </Box>
    );
  }

  return <BuyerOfferView offer={offer} token={token} shareLink={shareLink} />;
}
