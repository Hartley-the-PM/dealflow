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
import type { TestimonialsModule } from '@/types/offerBuilder';

interface Props {
  module: TestimonialsModule;
  onChange: (updated: TestimonialsModule) => void;
}

export default function TestimonialsEditor({ module, onChange }: Props) {
  const addTestimonial = () => {
    onChange({
      ...module,
      testimonials: [...module.testimonials, { quote: '', author: '', company: '' }],
    });
  };

  const removeTestimonial = (index: number) => {
    onChange({
      ...module,
      testimonials: module.testimonials.filter((_, i) => i !== index),
    });
  };

  const updateTestimonial = (index: number, field: string, value: string) => {
    onChange({
      ...module,
      testimonials: module.testimonials.map((t, i) =>
        i === index ? { ...t, [field]: value } : t
      ),
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" color="text.secondary">
          Testimonials ({module.testimonials.length})
        </Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={addTestimonial}>
          Add Testimonial
        </Button>
      </Box>
      {module.testimonials.map((testimonial, i) => (
        <Card key={i} variant="outlined">
          <CardContent sx={{ pb: '12px !important', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">Testimonial {i + 1}</Typography>
              <IconButton size="small" color="error" onClick={() => removeTestimonial(i)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
            <TextField size="small" fullWidth label="Quote" multiline minRows={2} value={testimonial.quote} onChange={(e) => updateTestimonial(i, 'quote', e.target.value)} />
            <TextField size="small" fullWidth label="Author" value={testimonial.author} onChange={(e) => updateTestimonial(i, 'author', e.target.value)} />
            <TextField size="small" fullWidth label="Company" value={testimonial.company} onChange={(e) => updateTestimonial(i, 'company', e.target.value)} />
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
