'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import PageHeader from '@/components/shared/PageHeader';
import PipelineSankey from '@/components/dashboard/PipelineSankey';
import MonthlySummary from '@/components/dashboard/MonthlySummary';
import UpcomingReminders from '@/components/dashboard/UpcomingReminders';
import PricingSimulator from '@/components/dashboard/PricingSimulator';
import PendingApprovals from '@/components/dashboard/PendingApprovals';
import RecentActivity from '@/components/dashboard/RecentActivity';

export default function DashboardPage() {
  return (
    <Box>
      <PageHeader title="Dashboard" />

      {/* Row 1: Pipeline Sankey */}
      <Box sx={{ mb: 3 }}>
        <PipelineSankey />
      </Box>

      {/* Row 2: Monthly Summary + Upcoming Reminders */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <MonthlySummary />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <UpcomingReminders />
        </Grid>
      </Grid>

      {/* Row 3: Pricing Simulator + Pending Approvals */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <PricingSimulator />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <PendingApprovals />
        </Grid>
      </Grid>

      {/* Row 4: Recent Activity */}
      <RecentActivity />
    </Box>
  );
}
