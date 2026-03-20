import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function PackageViewerLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* Top accent gradient bar — Vailent branded orange */}
      <Box
        sx={{
          height: 3,
          flexShrink: 0,
          background: 'linear-gradient(90deg, #FAEC8C 0%, #E97A2B 50%, #FD6437 100%)',
        }}
      />

      {/* Content */}
      <Box sx={{ flex: 1 }}>
        {children}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          py: 3,
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.7rem', letterSpacing: '0.04em' }}>
          Powered by Vailent
        </Typography>
      </Box>
    </Box>
  );
}
