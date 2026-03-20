'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import StarIcon from '@mui/icons-material/Star';
import { useTeamStore } from '@/stores/teamStore';
import { useHydration } from '@/hooks/useHydration';
import type { UserRole, TeamMember } from '@/types/team';
import { PERMISSION_LABELS } from '@/types/team';
import { v4 as uuidv4 } from 'uuid';

const ROLE_COLORS: Record<UserRole, string> = {
  Admin: '#7C3AED',
  'Sales Manager': '#2563EB',
  'Account Manager': '#059669',
  Viewer: '#6B7280',
};

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function TeamRolesTab() {
  const hydrated = useHydration();
  const members = useTeamStore((s) => s.members);
  const currentUserId = useTeamStore((s) => s.currentUserId);
  const setCurrentUser = useTeamStore((s) => s.setCurrentUser);
  const addMember = useTeamStore((s) => s.addMember);
  const updateMember = useTeamStore((s) => s.updateMember);
  const removeMember = useTeamStore((s) => s.removeMember);
  const rolePermissions = useTeamStore((s) => s.rolePermissions);
  const updateRolePermission = useTeamStore((s) => s.updateRolePermission);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Account Manager');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('Account Manager');

  if (!hydrated) return null;

  const handleInvite = () => {
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    addMember({
      id: uuidv4(),
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      status: 'invited',
      joinedAt: new Date().toISOString(),
    });
    setInviteName('');
    setInviteEmail('');
    setInviteRole('Account Manager');
    setInviteOpen(false);
  };

  const startEditRole = (member: TeamMember) => {
    setEditingMemberId(member.id);
    setEditRole(member.role);
  };

  const saveRole = () => {
    if (editingMemberId) {
      updateMember(editingMemberId, { role: editRole });
      setEditingMemberId(null);
    }
  };

  const currentUser = members.find((m) => m.id === currentUserId);

  return (
    <Box>
      {/* Active User Switcher */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem', mb: 1, display: 'block' }}>
          Signed in as
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            select
            size="small"
            value={currentUserId}
            onChange={(e) => setCurrentUser(e.target.value)}
            sx={{ minWidth: 260 }}
          >
            {members.filter((m) => m.status === 'active').map((m) => (
              <MenuItem key={m.id} value={m.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.65rem', bgcolor: ROLE_COLORS[m.role] }}>{getInitials(m.name)}</Avatar>
                  {m.name}
                  <Chip label={m.role} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: `${ROLE_COLORS[m.role]}15`, color: ROLE_COLORS[m.role], fontWeight: 600 }} />
                </Box>
              </MenuItem>
            ))}
          </TextField>
          {currentUser && (
            <Typography variant="body2" color="text.secondary">
              {currentUser.role} · {currentUser.email}
            </Typography>
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Team Roster */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Team Members</Typography>
          <Typography variant="body2" color="text.secondary">{members.length} members</Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAddIcon />} size="small" onClick={() => setInviteOpen(true)} sx={{ textTransform: 'none' }}>
          Invite User
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 4 }}>
        {members.map((member) => {
          const isCurrent = member.id === currentUserId;
          return (
            <Card
              key={member.id}
              variant="outlined"
              sx={{
                borderColor: isCurrent ? '#EA580C' : undefined,
                borderWidth: isCurrent ? 2 : 1,
              }}
            >
              <CardContent sx={{ py: '10px !important', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 36, height: 36, fontSize: '0.8rem', bgcolor: ROLE_COLORS[member.role] }}>
                  {getInitials(member.name)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{member.name}</Typography>
                    {isCurrent && <Chip label="You" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#FFF7ED', color: '#EA580C' }} />}
                    {member.status === 'invited' && <Chip label="Invited" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: '#FEF3C7', color: '#92400E' }} />}
                  </Box>
                  <Typography variant="caption" color="text.secondary">{member.email}</Typography>
                </Box>

                {editingMemberId === member.id ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField select size="small" value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)} sx={{ minWidth: 160 }}>
                      <MenuItem value="Admin">Admin</MenuItem>
                      <MenuItem value="Sales Manager">Sales Manager</MenuItem>
                      <MenuItem value="Account Manager">Account Manager</MenuItem>
                      <MenuItem value="Viewer">Viewer</MenuItem>
                    </TextField>
                    <Button size="small" variant="contained" onClick={saveRole} sx={{ minWidth: 0, px: 1.5, textTransform: 'none' }}>Save</Button>
                    <Button size="small" onClick={() => setEditingMemberId(null)} sx={{ minWidth: 0, textTransform: 'none' }}>Cancel</Button>
                  </Box>
                ) : (
                  <>
                    <Chip
                      label={member.role}
                      size="small"
                      sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600, bgcolor: `${ROLE_COLORS[member.role]}15`, color: ROLE_COLORS[member.role] }}
                    />
                    <IconButton size="small" onClick={() => startEditRole(member)} sx={{ color: 'text.secondary' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Role Permissions Matrix */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 0.5 }}>Role Permissions</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Configure what each role can access. Changes apply immediately.</Typography>
      </Box>

      <TableContainer sx={{ borderRadius: 2, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#F9FAFB' }}>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' }}>Permission</TableCell>
              {rolePermissions.map((rp) => (
                <TableCell key={rp.role} align="center" sx={{ fontWeight: 600, fontSize: '0.75rem', color: ROLE_COLORS[rp.role] }}>
                  {rp.role}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(PERMISSION_LABELS).map(([field, label]) => (
              <TableRow key={field} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                <TableCell sx={{ fontSize: '0.8rem', color: '#374151' }}>{label}</TableCell>
                {rolePermissions.map((rp) => {
                  const checked = (rp.permissions as any)[field];
                  const isAdmin = rp.role === 'Admin';
                  return (
                    <TableCell key={rp.role} align="center">
                      <Switch
                        size="small"
                        checked={checked}
                        disabled={isAdmin}
                        onChange={(e) => updateRolePermission(rp.role, field, e.target.checked)}
                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: ROLE_COLORS[rp.role] }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: ROLE_COLORS[rp.role] } }}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField autoFocus size="small" fullWidth label="Full Name" value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
          <TextField size="small" fullWidth label="Email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
          <TextField select size="small" fullWidth label="Role" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as UserRole)}>
            <MenuItem value="Admin">Admin</MenuItem>
            <MenuItem value="Sales Manager">Sales Manager</MenuItem>
            <MenuItem value="Account Manager">Account Manager</MenuItem>
            <MenuItem value="Viewer">Viewer</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleInvite} disabled={!inviteName.trim() || !inviteEmail.trim()}>Send Invite</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
