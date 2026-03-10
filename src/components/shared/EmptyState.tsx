'use client';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InboxIcon from '@mui/icons-material/Inbox';

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function EmptyState({ message, icon, action }: EmptyStateProps) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
      <Box sx={{ color: 'text.secondary', mb: 2 }}>
        {icon || <InboxIcon sx={{ fontSize: 48 }} />}
      </Box>
      <Typography color="text.secondary" gutterBottom>
        {message}
      </Typography>
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
}
