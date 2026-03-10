'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import type { Customer } from '@/types';
import { format } from 'date-fns';

interface CustomerOverviewProps {
  customer: Customer;
}

export default function CustomerOverview({ customer }: CustomerOverviewProps) {
  const fields = [
    { label: 'Company Name', value: customer.name },
    { label: 'Country', value: customer.country },
    { label: 'Segment', value: customer.segment },
    { label: 'Assigned AM', value: customer.assignedAM },
    { label: 'Address', value: customer.address },
    { label: 'Email', value: customer.email },
    { label: 'Phone', value: customer.phone },
    {
      label: 'Member Since',
      value: customer.createdAt
        ? format(new Date(customer.createdAt), 'MMM d, yyyy')
        : '\u2014',
    },
  ];

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Customer Information
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          {fields.map((field) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={field.label}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {field.label}
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.25 }}>
                  {field.value || '\u2014'}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
