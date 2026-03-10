'use client';

import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChartBuilderChat from './ChartBuilderChat';
import ChartBuilderPreview from './ChartBuilderPreview';
import { useDashboardStore } from '@/stores/dashboardStore';

export default function ChartBuilderDialog() {
  const isOpen = useDashboardStore((s) => s.isBuilderOpen);
  const closeBuilder = useDashboardStore((s) => s.closeBuilder);

  return (
    <Dialog
      fullScreen
      open={isOpen}
      onClose={closeBuilder}
      sx={{ '& .MuiDialog-paper': { bgcolor: 'background.default' } }}
    >
      <AppBar sx={{ position: 'relative' }} elevation={0} color="default">
        <Toolbar variant="dense">
          <IconButton edge="start" onClick={closeBuilder} sx={{ mr: 1 }}>
            <CloseIcon />
          </IconButton>
          <AutoAwesomeIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
            AI Chart Builder
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Chat Panel (40%) */}
        <Box
          sx={{
            width: '40%',
            borderRight: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper',
          }}
        >
          <ChartBuilderChat />
        </Box>

        {/* Right: Preview Panel (60%) */}
        <Box sx={{ width: '60%', display: 'flex', flexDirection: 'column' }}>
          <ChartBuilderPreview />
        </Box>
      </Box>
    </Dialog>
  );
}
