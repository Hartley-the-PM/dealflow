'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import AddIcon from '@mui/icons-material/Add';
import StatusChip from '@/components/shared/StatusChip';
import EmptyState from '@/components/shared/EmptyState';
import { useDealStore } from '@/stores/dealStore';
import { useOfferStore } from '@/stores/offerStore';
import { useActivityStore } from '@/stores/activityStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { v4 as uuidv4 } from 'uuid';

interface CustomerDealsProps {
  customerId: string;
}

export default function CustomerDeals({ customerId }: CustomerDealsProps) {
  const router = useRouter();
  const getDealsByCustomer = useDealStore((s) => s.getDealsByCustomer);
  const addDeal = useDealStore((s) => s.addDeal);
  const getOffersByDeal = useOfferStore((s) => s.getOffersByDeal);
  const addActivity = useActivityStore((s) => s.addActivity);
  const currentUser = useSettingsStore((s) => s.settings.currentUser);

  const deals = getDealsByCustomer(customerId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dealName, setDealName] = useState('');

  const handleCreateDeal = () => {
    if (!dealName.trim()) return;

    const now = new Date().toISOString();
    const dealId = uuidv4();

    addDeal({
      id: dealId,
      customerId,
      name: dealName.trim(),
      status: 'Draft',
      createdBy: currentUser,
      createdAt: now,
      updatedAt: now,
    });

    addActivity({
      id: uuidv4(),
      entityType: 'deal',
      entityId: dealId,
      dealId,
      action: 'deal_created',
      details: `Deal "${dealName.trim()}" created`,
      userId: currentUser,
      timestamp: now,
    });

    setDealName('');
    setDialogOpen(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Create Deal
        </Button>
      </Box>

      {deals.length === 0 ? (
        <EmptyState message="No deals for this customer yet." />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Deal Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">
                  # Offers
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Last Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deals.map((deal) => {
                const offerCount = getOffersByDeal(deal.id).length;
                return (
                  <TableRow
                    key={deal.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/deals/${deal.id}`)}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>{deal.name}</TableCell>
                    <TableCell>
                      <StatusChip status={deal.status} type="deal" />
                    </TableCell>
                    <TableCell align="center">{offerCount}</TableCell>
                    <TableCell>
                      {new Date(deal.updatedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Deal</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Deal Name"
            fullWidth
            value={dealName}
            onChange={(e) => setDealName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateDeal();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateDeal}
            disabled={!dealName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
