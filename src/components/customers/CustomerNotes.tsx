'use client';

import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import EmptyState from '@/components/shared/EmptyState';
import { useCustomerStore } from '@/stores/customerStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

interface CustomerNotesProps {
  customerId: string;
}

export default function CustomerNotes({ customerId }: CustomerNotesProps) {
  const getNotesByCustomer = useCustomerStore((s) => s.getNotesByCustomer);
  const addNote = useCustomerStore((s) => s.addNote);
  const currentUser = useSettingsStore((s) => s.settings.currentUser);

  const notes = getNotesByCustomer(customerId);

  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notes]
  );

  const [content, setContent] = useState('');

  const handleAddNote = () => {
    if (!content.trim()) return;

    addNote({
      id: uuidv4(),
      customerId,
      content: content.trim(),
      createdBy: currentUser,
      createdAt: new Date().toISOString(),
    });

    setContent('');
  };

  return (
    <Box>
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <TextField
              multiline
              minRows={2}
              maxRows={4}
              fullWidth
              placeholder="Add a note..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={handleAddNote}
              disabled={!content.trim()}
              sx={{ flexShrink: 0 }}
            >
              Add Note
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {sortedNotes.length === 0 ? (
        <EmptyState message="No notes for this customer yet." />
      ) : (
        <Stack spacing={2}>
          {sortedNotes.map((note) => (
            <Card variant="outlined" key={note.id}>
              <CardContent>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 1.5 }}>
                  {note.content}
                </Typography>
                <Divider sx={{ mb: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    {note.createdBy}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}
