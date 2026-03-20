'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import { useDealNoteStore } from '@/stores/dealNoteStore';
import { useSettingsStore } from '@/stores/settingsStore';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import type { DealNoteCategory, DealNotePriority } from '@/types';

const CATEGORIES: DealNoteCategory[] = ['Call Summary', 'Internal Note', 'Price Discussion', 'Customer Feedback'];
const PRIORITIES: DealNotePriority[] = ['Low', 'Medium', 'High'];

const priorityColors: Record<DealNotePriority, 'success' | 'warning' | 'error'> = {
  Low: 'success',
  Medium: 'warning',
  High: 'error',
};

const categoryColors: Record<DealNoteCategory, string> = {
  'Call Summary': '#1976d2',
  'Internal Note': '#6B7280',
  'Price Discussion': '#ed6c02',
  'Customer Feedback': '#2e7d32',
};

interface DealNotesProps {
  dealId: string;
}

export default function DealNotes({ dealId }: DealNotesProps) {
  const allNotes = useDealNoteStore((s) => s.notes);
  const notes = useMemo(
    () => allNotes.filter((n) => n.dealId === dealId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [allNotes, dealId]
  );
  const addNote = useDealNoteStore((s) => s.addNote);
  const updateNote = useDealNoteStore((s) => s.updateNote);
  const deleteNote = useDealNoteStore((s) => s.deleteNote);
  const currentUser = useSettingsStore((s) => s.settings.currentUser);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<DealNoteCategory>('Internal Note');
  const [priority, setPriority] = useState<DealNotePriority>('Medium');
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleDictation = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = body;

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + transcript;
          setBody(finalTranscript);
        } else {
          interim += transcript;
        }
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setBody('');
    setCategory('Internal Note');
    setPriority('Medium');
    setDialogOpen(true);
  };

  const openEdit = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    setEditingId(noteId);
    setBody(note.body);
    setCategory(note.category);
    setPriority(note.priority);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!body.trim()) return;

    if (editingId) {
      updateNote(editingId, { body: body.trim(), category, priority });
    } else {
      addNote({
        id: uuidv4(),
        dealId,
        body: body.trim(),
        category,
        priority,
        createdBy: currentUser,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    setDialogOpen(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      deleteNote(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, pb: 0.75, borderBottom: '1px solid #E5E7EB' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#111827' }}>Notes</Typography>
          <Box sx={{ height: 18, minWidth: 18, px: 0.5, borderRadius: '9px', bgcolor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#6B7280' }}>{notes.length}</Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={openCreate} sx={{ fontSize: '0.7rem' }}>
          Add Note
        </Button>
      </Box>

      {notes.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No notes yet. Click &quot;Add Note&quot; to create one.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {notes.map((note) => (
            <Card key={note.id} variant="outlined">
              <CardContent sx={{ pb: '12px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Chip
                      label={note.category}
                      size="small"
                      sx={{
                        bgcolor: categoryColors[note.category] + '14',
                        color: categoryColors[note.category],
                        fontWeight: 500,
                        fontSize: '0.75rem',
                      }}
                    />
                    <Chip
                      label={note.priority}
                      size="small"
                      color={priorityColors[note.priority]}
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 22 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(note.id)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setDeleteConfirmId(note.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
                  {note.body}
                </Typography>
                <Divider sx={{ mb: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    {note.createdBy}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                    {note.updatedAt !== note.createdAt && ' (edited)'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Note' : 'Add Note'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as DealNoteCategory)}
              size="small"
              sx={{ flex: 1 }}
            >
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as DealNotePriority)}
              size="small"
              sx={{ width: 130 }}
            >
              {PRIORITIES.map((p) => (
                <MenuItem key={p} value={p}>{p}</MenuItem>
              ))}
            </TextField>
          </Box>
          <Box sx={{ position: 'relative' }}>
            <TextField
              label="Note"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              multiline
              rows={5}
              fullWidth
              placeholder="Type or dictate your note..."
            />
            <Tooltip title={isListening ? 'Stop dictation' : 'Start dictation'}>
              <IconButton
                onClick={toggleDictation}
                sx={{
                  position: 'absolute',
                  right: 8,
                  bottom: 8,
                  bgcolor: isListening ? 'error.main' : 'action.hover',
                  color: isListening ? 'white' : 'text.secondary',
                  '&:hover': {
                    bgcolor: isListening ? 'error.dark' : 'action.selected',
                  },
                  animation: isListening ? 'pulse 1.5s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { boxShadow: '0 0 0 0 rgba(211, 47, 47, 0.4)' },
                    '70%': { boxShadow: '0 0 0 8px rgba(211, 47, 47, 0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(211, 47, 47, 0)' },
                  },
                }}
                size="small"
              >
                {isListening ? <MicOffIcon fontSize="small" /> : <MicIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
          {isListening && (
            <Typography variant="caption" color="error" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              Listening...
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!body.trim()}>
            {editingId ? 'Save Changes' : 'Add Note'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={Boolean(deleteConfirmId)}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </Box>
  );
}
