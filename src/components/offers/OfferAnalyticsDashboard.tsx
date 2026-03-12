'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useOfferAnalyticsStore } from '@/stores/offerAnalyticsStore';

interface OfferAnalyticsDashboardProps {
  offerId: string;
}

export default function OfferAnalyticsDashboard({ offerId }: OfferAnalyticsDashboardProps) {
  const getSummary = useOfferAnalyticsStore((s) => s.getSummary);
  const getByOffer = useOfferAnalyticsStore((s) => s.getByOffer);

  const summary = useMemo(() => getSummary(offerId), [getSummary, offerId]);
  const sessions = useMemo(() => getByOffer(offerId), [getByOffer, offerId]);

  if (summary.viewCount === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">
          No analytics data yet. Share the offer and track buyer engagement.
        </Typography>
      </Box>
    );
  }

  const sectionEntries = Object.entries(summary.sectionEngagement).sort((a, b) => b[1] - a[1]);
  const maxSectionViews = sectionEntries.length > 0 ? sectionEntries[0][1] : 1;
  const clickEntries = Object.entries(summary.clickBreakdown).sort((a, b) => b[1] - a[1]);

  return (
    <Box>
      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <VisibilityIcon sx={{ color: 'primary.main', mb: 0.5 }} />
              <Typography variant="h5" fontWeight={700}>
                {summary.viewCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Page Views
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <AccessTimeIcon sx={{ color: 'primary.main', mb: 0.5 }} />
              <Typography variant="h5" fontWeight={700}>
                {Math.round(summary.avgTimeOnPage)}s
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Time on Page
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <TouchAppIcon sx={{ color: 'primary.main', mb: 0.5 }} />
              <Typography variant="h5" fontWeight={700}>
                {clickEntries.reduce((sum, [, count]) => sum + count, 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Clicks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <TrendingUpIcon sx={{ color: 'primary.main', mb: 0.5 }} />
              <Typography variant="h5" fontWeight={700}>
                {sessions.length > 0 ? `${Math.max(...sessions.map((s) => s.maxScrollDepth))}%` : '0%'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Max Scroll Depth
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {summary.lastViewed && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Last viewed: {new Date(summary.lastViewed).toLocaleString()}
        </Typography>
      )}

      <Grid container spacing={3}>
        {/* Section Engagement Heatmap */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Section Engagement
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              {sectionEntries.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No section data.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {sectionEntries.map(([section, count]) => (
                    <Box key={section}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                        <Typography variant="caption">{section.replace(/_/g, ' ')}</Typography>
                        <Typography variant="caption" fontWeight={600}>{count} views</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(count / maxSectionViews) * 100}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Click Breakdown */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Click Breakdown
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              {clickEntries.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No click data.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {clickEntries.map(([target, count]) => (
                    <Box key={target} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{target.replace(/_/g, ' ')}</Typography>
                      <Chip label={count} size="small" variant="outlined" />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Session Timeline */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Session Timeline
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Session</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Started</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Duration</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Scroll Depth</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Events</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Device</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessions
                      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
                      .map((session, idx) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <Typography variant="caption" fontWeight={500}>
                              #{sessions.length - idx}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {new Date(session.startedAt).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="caption">
                              {session.timeOnPageSeconds}s
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="caption">
                              {session.maxScrollDepth}%
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="caption">
                              {session.events.length}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ maxWidth: 150, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {session.viewport}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
