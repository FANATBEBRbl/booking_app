import React, { useState } from 'react';
import AuthModal from './AuthModal';
import Booking from './Booking';
import { Button, Box, Typography, Fade, Paper } from '@mui/material';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';

function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuth(false);
  };

  return (
    <Box className="App" sx={{ minHeight: '100vh', bgcolor: 'linear-gradient(135deg, #e3f0ff 0%, #f7fafd 100%)', position: 'relative' }}>
      {!isAuth && (
        <Fade in={!isAuth} timeout={700}>
          <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
            <Paper elevation={4} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 5, bgcolor: 'white', minWidth: { xs: 320, sm: 400 }, maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 8px 32px 0 rgba(25,118,210,0.10)' }}>
              <Box sx={{ bgcolor: 'primary.main', borderRadius: '50%', p: 2, mb: 2, boxShadow: 2 }}>
                <MeetingRoomIcon sx={{ color: 'white', fontSize: 48 }} />
              </Box>
              <Typography variant="h4" fontWeight={700} color="primary.main" mb={1}>
                Booking App
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" mb={3} align="center">
                Прозводственная практика разработанная студентами КПК РТУ МИРЭА<br />Леонов Никита<br />Тимохина Анастасия
              </Typography>
              <Button variant="contained" size="large" sx={{ borderRadius: 2, fontWeight: 600, fontSize: 18, px: 5, py: 1.5, boxShadow: 1, textTransform: 'none', letterSpacing: 0 }} onClick={() => setAuthOpen(true)}>
                Войти / Регистрация
              </Button>
            </Paper>
          </Box>
        </Fade>
      )}
      {isAuth && (
        <Box sx={{ position: 'absolute', top: 0, right: 0, p: 2, zIndex: 10 }}>
          <Button variant="outlined" onClick={handleLogout} sx={{ borderRadius: 2, fontWeight: 500 }}>
            Выйти
          </Button>
        </Box>
      )}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onAuth={() => setIsAuth(true)} />
      {isAuth && <Booking />}
    </Box>
  );
}

export default App;