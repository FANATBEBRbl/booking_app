// Красивый компонент для события в календаре
import React from 'react';
import { Box, Typography, Avatar, Tooltip, IconButton } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import DeleteIcon from '@mui/icons-material/Delete';

export default function CalendarEvent({ event, isOwn, onDelete }) {
  // Генерируем инициалы для аватарки
  const initials = event.title
    ? event.title.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'Б';

  return (
    <Tooltip
      title={
        <Box>
          <Typography fontWeight={600}>{event.title}</Typography>
          <Typography fontSize={13} color="text.secondary">
            {event.start && event.end
              ? `${event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : ''}
          </Typography>
        </Box>
      }
      arrow
      placement="top"
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          width: '100%',
          px: 1,
          py: 0.5,
          bgcolor: isOwn ? '#1976d2' : '#2196f3',
          color: 'white',
          borderRadius: 2,
          boxShadow: isOwn ? 2 : 0,
          cursor: isOwn ? 'pointer' : 'default',
          minHeight: 38,
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={isOwn ? () => onDelete(event) : undefined}
      >
        <Avatar sx={{ width: 28, height: 28, fontSize: 15, bgcolor: 'rgba(255,255,255,0.18)', color: 'white', mr: 1 }}>
          {initials}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {event.title}
          </Typography>
          <Typography sx={{ fontSize: 12, opacity: 0.95, fontWeight: 400 }}>
            {event.start && event.end
              ? `${event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : ''}
          </Typography>
        </Box>
        <LockIcon sx={{ fontSize: 18, opacity: 0.8, ml: 0.5 }} />
        {isOwn && (
          <IconButton size="small" color="error" sx={{ ml: 0.5, p: 0.5 }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Tooltip>
  );
}
