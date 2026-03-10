'use client';
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import type { Offer, Customer } from '@/types';

interface SendOfferModalProps {
  open: boolean;
  onClose: () => void;
  onSend: (recipient: string, subject: string, body: string) => void;
  offer: Offer;
  customer: Customer;
}

export default function SendOfferModal({ open, onClose, onSend, offer, customer }: SendOfferModalProps) {
  const [recipient, setRecipient] = useState(customer.email);
  const [subject, setSubject] = useState(`Offer: ${offer.name}`);
  const [body, setBody] = useState(
    `Dear ${customer.name},\n\nPlease find attached our offer "${offer.name}" for your review.\n\nWe look forward to your response.\n\nBest regards,\nVinmar International`
  );

  const handleSend = () => {
    onSend(recipient, subject, body);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Send Offer to Customer</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        <TextField
          label="To"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          fullWidth
          type="email"
        />
        <TextField
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          fullWidth
        />
        <TextField
          label="Message"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          multiline
          rows={6}
          fullWidth
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
          <AttachFileIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {offer.name}.pdf
          </Typography>
          <Chip label="PDF" size="small" variant="outlined" />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSend} disabled={!recipient}>
          Send Offer
        </Button>
      </DialogActions>
    </Dialog>
  );
}
