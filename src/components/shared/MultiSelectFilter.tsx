'use client';
import { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import type { SelectChangeEvent } from '@mui/material/Select';

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  minWidth?: number;
  size?: 'small' | 'medium';
  getOptionLabel?: (value: string) => string;
}

export default function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  minWidth = 180,
  size = 'small',
  getOptionLabel,
}: MultiSelectFilterProps) {
  const displayLabel = getOptionLabel ?? ((v: string) => v);

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    onChange(typeof value === 'string' ? value.split(',') : value);
  };

  const handleDelete = (valueToDelete: string) => {
    onChange(selected.filter((v) => v !== valueToDelete));
  };

  return (
    <FormControl size={size} sx={{ minWidth }}>
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={selected}
        onChange={handleChange}
        input={<OutlinedInput label={label} />}
        renderValue={(sel) => {
          if (sel.length === 0) return null;
          if (sel.length === 1) return displayLabel(sel[0]);
          return `${sel.length} selected`;
        }}
        MenuProps={{
          PaperProps: {
            sx: { maxHeight: 320 },
          },
        }}
      >
        {options.map((option) => (
          <MenuItem key={option} value={option} dense>
            <Checkbox checked={selected.includes(option)} size="small" />
            <ListItemText primary={displayLabel(option)} />
          </MenuItem>
        ))}
      </Select>
      {selected.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
          {selected.map((val) => (
            <Chip
              key={val}
              label={displayLabel(val)}
              size="small"
              onDelete={() => handleDelete(val)}
              sx={{ height: 24, fontSize: '0.75rem' }}
            />
          ))}
        </Box>
      )}
    </FormControl>
  );
}
