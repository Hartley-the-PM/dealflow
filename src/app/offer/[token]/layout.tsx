import Box from '@mui/material/Box';

export default function BuyerOfferLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      {children}
    </Box>
  );
}
