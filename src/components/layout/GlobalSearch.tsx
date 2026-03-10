'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import HandshakeIcon from '@mui/icons-material/Handshake';
import InventoryIcon from '@mui/icons-material/Inventory';
import DescriptionIcon from '@mui/icons-material/Description';
import { useCustomerStore } from '@/stores/customerStore';
import { useDealStore } from '@/stores/dealStore';
import { useProductStore } from '@/stores/productStore';
import { useOfferStore } from '@/stores/offerStore';

interface SearchResult {
  type: 'customer' | 'deal' | 'product' | 'offer';
  id: string;
  label: string;
  secondary: string;
  href: string;
}

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const customers = useCustomerStore((s) => s.customers);
  const deals = useDealStore((s) => s.deals);
  const products = useProductStore((s) => s.products);
  const offers = useOfferStore((s) => s.offers);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const items: SearchResult[] = [];

    customers.filter((c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach((c) => items.push({ type: 'customer', id: c.id, label: c.name, secondary: c.country, href: `/customers/${c.id}` }));

    deals.filter((d) => d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach((d) => items.push({ type: 'deal', id: d.id, label: d.name, secondary: d.status, href: `/deals/${d.id}` }));

    products.filter((p) => p.name.toLowerCase().includes(q) || p.legacyName.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach((p) => items.push({ type: 'product', id: p.id, label: p.name, secondary: p.code, href: `/products/${p.id}` }));

    offers.filter((o) => o.name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((o) => items.push({ type: 'offer', id: o.id, label: o.name, secondary: `V${o.version} – ${o.status}`, href: `/deals/${o.dealId}` }));

    return items;
  }, [query, customers, deals, products, offers]);

  const handleSelect = (result: SearchResult) => {
    router.push(result.href);
    onClose();
  };

  const iconMap = {
    customer: <PeopleIcon fontSize="small" />,
    deal: <HandshakeIcon fontSize="small" />,
    product: <InventoryIcon fontSize="small" />,
    offer: <DescriptionIcon fontSize="small" />,
  };

  const colorMap = {
    customer: 'primary',
    deal: 'success',
    product: 'warning',
    offer: 'info',
  } as const;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { mt: '10vh', verticalAlign: 'top' } }}
      slotProps={{ backdrop: { sx: { bgcolor: 'rgba(0,0,0,0.3)' } } }}
    >
      <DialogContent sx={{ p: 0 }}>
        <TextField
          autoFocus
          fullWidth
          placeholder="Search customers, deals, products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          variant="outlined"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              sx: { fontSize: '1.1rem' },
            },
          }}
          sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, px: 1, pt: 1 }}
        />
        {results.length > 0 && (
          <List sx={{ px: 1, pb: 1, maxHeight: 400, overflow: 'auto' }}>
            {results.map((r) => (
              <ListItemButton key={`${r.type}-${r.id}`} onClick={() => handleSelect(r)} sx={{ borderRadius: 1, mb: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>{iconMap[r.type]}</ListItemIcon>
                <ListItemText primary={r.label} secondary={r.secondary} />
                <Chip label={r.type} size="small" color={colorMap[r.type]} variant="outlined" sx={{ textTransform: 'capitalize' }} />
              </ListItemButton>
            ))}
          </List>
        )}
        {query.trim() && results.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No results found</Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
