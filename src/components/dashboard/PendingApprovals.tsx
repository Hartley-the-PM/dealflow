'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Badge from '@mui/material/Badge';
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { usePricingEngineStore } from '@/stores/pricingEngineStore';
import { useDealStore } from '@/stores/dealStore';
import { useProductStore } from '@/stores/productStore';
import { useSettingsStore } from '@/stores/settingsStore';

export default function PendingApprovals() {
  const approvals = usePricingEngineStore((s) => s.approvals);
  const updateApproval = usePricingEngineStore((s) => s.updateApproval);
  const guardrails = usePricingEngineStore((s) => s.guardrails);
  const deals = useDealStore((s) => s.deals);
  const products = useProductStore((s) => s.products);
  const settings = useSettingsStore((s) => s.settings);

  const pendingApprovals = useMemo(
    () => approvals.filter((a) => a.status === 'pending'),
    [approvals]
  );

  const handleApprove = (id: string) => {
    updateApproval(id, {
      status: 'approved',
      reviewedBy: settings.currentUser,
      reviewedAt: new Date().toISOString(),
    });
  };

  const handleReject = (id: string) => {
    updateApproval(id, {
      status: 'rejected',
      reviewedBy: settings.currentUser,
      reviewedAt: new Date().toISOString(),
    });
  };

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Badge badgeContent={pendingApprovals.length} color="error">
            <GppMaybeIcon color="primary" />
          </Badge>
          <Typography variant="h6" fontWeight={600} fontSize="1rem">
            Pending Approvals
          </Typography>
        </Box>

        {pendingApprovals.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary" variant="body2">
              No pending pricing approvals
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {pendingApprovals.map((approval, i) => {
              const deal = deals.find((d) => d.id === approval.dealId);
              const product = products.find((p) => p.id === approval.lineProductId);
              const guardrail = guardrails.find((g) => g.id === approval.guardrailId);

              return (
                <Box key={approval.id}>
                  {i > 0 && <Divider sx={{ mb: 1.5 }} />}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {deal?.name ?? 'Unknown Deal'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {product?.name ?? 'Unknown Product'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                        <Chip
                          label={`$${approval.requestedPrice.toLocaleString()}/MT`}
                          size="small"
                          sx={{ fontSize: '0.7rem', fontWeight: 600, bgcolor: '#FEE2E2', color: '#DC2626' }}
                        />
                        <Chip
                          label={`Floor: $${approval.computedFloor.toLocaleString()}/MT`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Box>
                      {guardrail && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          Violated: {guardrail.name}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        By: {approval.requestedBy}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 1, flexShrink: 0 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        sx={{ minWidth: 32, p: 0.5 }}
                        onClick={() => handleApprove(approval.id)}
                      >
                        <CheckIcon fontSize="small" />
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        sx={{ minWidth: 32, p: 0.5 }}
                        onClick={() => handleReject(approval.id)}
                      >
                        <CloseIcon fontSize="small" />
                      </Button>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
