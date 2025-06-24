import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Modal, IconButton, InputAdornment } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import axios from 'axios';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 380,
  maxWidth: '95vw',
  bgcolor: 'background.paper',
  borderRadius: 4,
  boxShadow: '0 8px 32px 0 rgba(25,118,210,0.18)',
  p: { xs: 2, sm: 4 },
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

export default function AuthModal({ open, onClose, onAuth }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await axios.post('/api/auth/register', form);
        setIsRegister(false);
      } else {
        const res = await axios.post('/api/auth/login', form);
        localStorage.setItem('token', res.data.token);
        const payload = JSON.parse(atob(res.data.token.split('.')[1]));
        localStorage.setItem('userId', payload.userId);
        localStorage.setItem('userEmail', form.email);
        onAuth();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data || 'Ошибка');
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{ bgcolor: 'primary.main', borderRadius: '50%', p: 1.5, mb: 1, boxShadow: 2 }}>
            {isRegister ? <PersonAddAlt1Icon sx={{ color: 'white', fontSize: 36 }} /> : <LockOutlinedIcon sx={{ color: 'white', fontSize: 36 }} />}
          </Box>
          <Typography variant="h5" fontWeight={700} color="primary.main" mb={0.5}>
            {isRegister ? 'Регистрация' : 'Вход'}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={1}>
            {isRegister ? 'Создайте новый аккаунт для бронирования' : 'Войдите в свой аккаунт'}
          </Typography>
        </Box>
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {isRegister && (
            <TextField
              margin="normal"
              fullWidth
              label="Имя"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              autoFocus
              InputProps={{ sx: { borderRadius: 2 } }}
            />
          )}
          <TextField
            margin="normal"
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            InputProps={{ sx: { borderRadius: 2 } }}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Пароль"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={handleChange}
            required
            InputProps={{
              sx: { borderRadius: 2 },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {error && (
            <Typography color="error" variant="body2" align="center" mt={1}>{error}</Typography>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2, borderRadius: 2, fontWeight: 600, fontSize: 17, py: 1.2, boxShadow: 1, textTransform: 'none', letterSpacing: 0 }}
          >
            {isRegister ? 'Зарегистрироваться' : 'Войти'}
          </Button>
        </form>
        <Button
          color="secondary"
          fullWidth
          sx={{ mt: 2, borderRadius: 2, fontWeight: 500, textTransform: 'none', fontSize: 15 }}
          onClick={() => setIsRegister((v) => !v)}
        >
          {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </Button>
      </Box>
    </Modal>
  );
}
