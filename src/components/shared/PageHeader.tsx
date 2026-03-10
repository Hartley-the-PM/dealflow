'use client';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import NextLink from 'next/link';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  subtitle?: string;
}

export default function PageHeader({ title, breadcrumbs, actions, subtitle }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1 }}>
          {breadcrumbs.map((bc, i) =>
            bc.href ? (
              <Link key={i} component={NextLink} href={bc.href} underline="hover" color="text.secondary" fontSize="0.875rem">
                {bc.label}
              </Link>
            ) : (
              <Typography key={i} color="text.primary" fontSize="0.875rem">
                {bc.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>{actions}</Box>}
      </Box>
    </Box>
  );
}
