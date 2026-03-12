'use client';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { ProductShowcaseModule } from '@/types/offerBuilder';

interface Props {
  module: ProductShowcaseModule;
  onChange: (updated: ProductShowcaseModule) => void;
}

export default function ProductShowcaseEditor({ module, onChange }: Props) {
  const addProduct = () => {
    onChange({
      ...module,
      products: [...module.products, { name: '', description: '', specs: '', imageUrl: '' }],
    });
  };

  const removeProduct = (index: number) => {
    onChange({
      ...module,
      products: module.products.filter((_, i) => i !== index),
    });
  };

  const updateProduct = (index: number, field: string, value: string) => {
    onChange({
      ...module,
      products: module.products.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      ),
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" color="text.secondary">
          Product Showcase ({module.products.length})
        </Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={addProduct}>
          Add Product
        </Button>
      </Box>
      {module.products.map((product, i) => (
        <Card key={i} variant="outlined">
          <CardContent sx={{ pb: '12px !important', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">Product {i + 1}</Typography>
              <IconButton size="small" color="error" onClick={() => removeProduct(i)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
            <TextField size="small" fullWidth label="Name" value={product.name} onChange={(e) => updateProduct(i, 'name', e.target.value)} />
            <TextField size="small" fullWidth label="Description" multiline minRows={2} value={product.description} onChange={(e) => updateProduct(i, 'description', e.target.value)} />
            <TextField size="small" fullWidth label="Specs" value={product.specs} onChange={(e) => updateProduct(i, 'specs', e.target.value)} />
            <TextField size="small" fullWidth label="Image URL" value={product.imageUrl} onChange={(e) => updateProduct(i, 'imageUrl', e.target.value)} />
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
