import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Box, Typography, Select, MenuItem, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert } from '@mui/material';
import 'moment/locale/ru';
import CalendarEvent from './CalendarEvent';

const localizer = momentLocalizer(moment);

moment.locale('ru', {
  week: {
    dow: 1, // Monday is the first day of the week
    doy: 7, // The week that contains Jan 1st is the first week of the year
  },
});
moment.locale('ru');

const calendarMessages = {
  allDay: 'Весь день',
  previous: 'Назад',
  next: 'Вперёд',
  today: 'Сегодня',
  month: 'Месяц',
  week: 'Неделя',
  day: 'День',
  agenda: 'Повестка',
  date: 'Дата',
  time: 'Время',
  event: 'Событие',
  noEventsInRange: 'Нет событий в этот период',
};

const calendarStyle = {
  borderRadius: 12,
  boxShadow: '0 2px 16px 0 rgba(0,0,0,0.08)',
  background: '#fff',
  padding: 16,
  marginBottom: 24,
};

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#ff7043' },
  },
  typography: {
    fontFamily: 'Segoe UI, Arial, sans-serif',
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    fontSize: 15,
  },
});

function AdminRoomForm({ onRoomAdded }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('http://localhost:5000/api/rooms', form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setOpen(false);
      setForm({ name: '', description: '' });
      onRoomAdded && onRoomAdded();
    } catch (e) {
      setError('Ошибка добавления кабинета');
    }
  };
  return (
    <Box mb={2}>
      <Button variant="outlined" onClick={() => setOpen(true)} sx={{ mb: 1 }}>
        Добавить кабинет (только для администратора)
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Добавить кабинет</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField label="Название" name="name" value={form.name} onChange={handleChange} fullWidth required margin="normal" />
            <TextField label="Описание" name="description" value={form.description} onChange={handleChange} fullWidth required margin="normal" />
            {error && <Alert severity="error">{error}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Отмена</Button>
            <Button type="submit" variant="contained">Добавить</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default function Booking() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [slot, setSlot] = useState(null);
  const [form, setForm] = useState({ date: '', timeStart: '', timeEnd: '', reason: '' });
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date()); // добавлено состояние даты

  useEffect(() => {
    axios.get("http://localhost:5000/api/rooms").then((res) => setRooms(res.data));
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      axios.get(`http://localhost:5000/api/bookings?roomId=${selectedRoom}`)
        .then(res => {
          setEvents(res.data.map(b => ({
            id: b._id,
            title: b.reason || 'Забронировано',
            start: moment(`${moment(b.date).format('YYYY-MM-DD')}T${b.timeStart}`).toDate(),
            end: moment(`${moment(b.date).format('YYYY-MM-DD')}T${b.timeEnd}`).toDate(),
            userId: b.userId,
          })));
        });
    } else {
      setEvents([]);
    }
  }, [selectedRoom, open, isAdmin]);

  useEffect(() => {
    // Проверка роли (допустим, если email admin@admin, то админ)
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Исправление: email не входит в payload, нужно получить email из localStorage
      const email = localStorage.getItem('userEmail');
      setIsAdmin(email === 'admin@admin');
    }
  }, []);

  const handleSelectSlot = (slotInfo) => {
    setSlot(slotInfo);
    setForm({
      date: moment(slotInfo.start).format('YYYY-MM-DD'),
      timeStart: moment(slotInfo.start).format('HH:mm'),
      timeEnd: moment(slotInfo.end).format('HH:mm'),
      reason: '',
    });
    setOpen(true);
  };

  const handleDeleteBooking = async (event) => {
    console.log('Попытка удалить:', event);
    if (!event.id) {
      alert('Некорректная бронь для удаления');
      return;
    }
    if (!window.confirm('Удалить бронь?')) return;
    try {
      const res = await axios.delete(`http://localhost:5000/api/bookings/${event.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      console.log('Ответ сервера на удаление:', res);
      setEvents(events.filter(e => e.id !== event.id));
    } catch (e) {
      console.error('Ошибка удаления:', e, e.response);
      let msg = 'Ошибка удаления';
      if (e.response?.data) {
        if (typeof e.response.data === 'string') {
          msg = e.response.data;
        } else {
          msg = e.response.data.error || e.response.data.details || msg;
        }
      }
      alert(msg);
    }
  };

  const handleBooking = async () => {
    if (!form.reason.trim()) {
      alert('Пожалуйста, укажите причину бронирования');
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/bookings', {
        userId: localStorage.getItem('userId'),
        roomId: selectedRoom,
        ...form,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setOpen(false);
    } catch (e) {
      alert('Ошибка бронирования');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', bgcolor: '#f7fafd', py: 4 }}>
        <Box sx={{ maxWidth: 820, mx: 'auto', bgcolor: 'white', p: { xs: 2, md: 3 }, borderRadius: 2, boxShadow: 2, mb: 3 }}>
          <Typography variant="h4" mb={2} fontWeight={600} color="primary.main" sx={{ textAlign: 'center', letterSpacing: 0 }}>
            Бронирование кабинетов
          </Typography>
          {isAdmin && <AdminRoomForm onRoomAdded={() => window.location.reload()} />}
          <Select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            displayEmpty
            fullWidth
            sx={{ mb: 2, bgcolor: '#f5f6fa', borderRadius: 1, fontWeight: 500, fontSize: 16, boxShadow: 0 }}
          >
            <MenuItem value="" disabled sx={{ color: '#b0b0b0' }}>Выберите кабинет</MenuItem>
            {rooms.map((room) => (
              <MenuItem key={room._id} value={room._id}>{room.name}</MenuItem>
            ))}
          </Select>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            selectable
            style={{ height: 700, width: '100%', maxWidth: 1200, margin: '0 auto', fontFamily: 'Segoe UI, Arial, sans-serif', background: '#fff', minWidth: 0, minHeight: 0, padding: 0, border: 'none', borderRadius: 18, boxShadow: '0 4px 32px 0 rgba(25,118,210,0.08)' }}
            date={currentDate} // управляемая дата
            onNavigate={date => setCurrentDate(date)} // обработчик смены недели
            onSelectSlot={slotInfo => {
              const now = moment();
              const slotStart = moment(slotInfo.start);
              const slotEnd = moment(slotInfo.end);
              if (slotStart.isBefore(now)) return;
              const overlap = events.some(ev =>
                (slotStart.isBefore(ev.end) && slotEnd.isAfter(ev.start))
              );
              if (overlap) {
                alert('В это время уже есть бронь!');
                return;
              }
              handleSelectSlot(slotInfo);
            }}
            eventPropGetter={event => ({
              style: {
                backgroundColor: '#1976d2',
                color: 'white',
                borderRadius: 0,
                fontWeight: 500,
                boxShadow: 'none',
                border: 'none',
                transition: 'box-shadow 0.2s',
                cursor: 'pointer',
                width: '100%',
                minHeight: 32,
                display: 'flex',
                alignItems: 'stretch', // stretch!
                justifyContent: 'flex-start',
                paddingLeft: 0, // убираем отступы
                paddingRight: 0,
                margin: 0, // убираем возможные внешние отступы
              }
            })}
            components={{
              event: ({ event }) => {
                const isOwn = isAdmin || event.userId === localStorage.getItem('userId');
                return (
                  <CalendarEvent event={event} isOwn={isOwn} onDelete={handleDeleteBooking} />
                );
              },
              toolbar: (props) => {
                // Исправлено: неделя с понедельника по воскресенье
                const currDate = props.date || new Date();
                const startOfWeek = moment(currDate).startOf('isoWeek'); // isoWeek — всегда понедельник
                const endOfWeek = moment(currDate).endOf('isoWeek');
                return (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2, gap: 2 }}>
                    <Button variant="outlined" size="small" sx={{ fontWeight: 500 }} onClick={() => props.onNavigate('PREV')}>← Неделя назад</Button>
                    <Typography variant="h6" sx={{ mx: 2, fontWeight: 500, letterSpacing: 0 }}>
                      {startOfWeek.format('DD MMMM YYYY')} — {endOfWeek.format('DD MMMM YYYY')}
                    </Typography>
                    <Button variant="outlined" size="small" sx={{ fontWeight: 500 }} onClick={() => props.onNavigate('NEXT')}>Неделя вперёд →</Button>
                  </Box>
                );
              },
              header: ({ label }) => (
                <Typography variant="subtitle2" align="center" sx={{ fontWeight: 600, fontSize: 15, color: '#1976d2', letterSpacing: 0 }}>{label}</Typography>
              )
            }}
            messages={calendarMessages}
            views={[Views.WEEK]}
            defaultView={Views.WEEK}
            culture="ru"
            dayLayoutAlgorithm="no-overlap"
            popup
            timeslots={2}
            step={30}
            min={new Date(0, 0, 0, 8, 0)}
            max={new Date(0, 0, 0, 21, 0)}
            defaultDate={new Date()}
            formats={{
              weekdayFormat: (date, culture, localizer) => moment(date).format('dd'), // всегда 2 буквы, корректно для ru
            }}
          />
          <Dialog open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { borderRadius: 2, p: 1 } }}>
            <DialogTitle sx={{ fontWeight: 600, fontSize: 20, color: 'primary.main', textAlign: 'center' }}>Забронировать</DialogTitle>
            <DialogContent sx={{ pb: 1 }}>
              <TextField
                margin="normal"
                label="Дата"
                type="date"
                fullWidth
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: moment().format('YYYY-MM-DD') }}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                label="Время начала"
                type="time"
                fullWidth
                value={form.timeStart}
                onChange={e => setForm({ ...form, timeStart: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                label="Время окончания"
                type="time"
                fullWidth
                value={form.timeEnd}
                onChange={e => setForm({ ...form, timeEnd: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                label="Причина бронирования"
                fullWidth
                required
                value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
              <Button onClick={() => setOpen(false)} variant="outlined" sx={{ borderRadius: 1, px: 3 }}>Отмена</Button>
              <Button variant="contained" onClick={handleBooking} sx={{ borderRadius: 1, px: 3 }}>Забронировать</Button>
            </DialogActions>
          </Dialog>
          <Box mt={3}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1976d2' }}>Существующие брони:</Typography>
            {events.length === 0 && <Typography color="text.secondary">Нет броней</Typography>}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {events.map((event, idx) => (
                <Box key={idx} sx={{ minWidth: 200, p: 1.5, bgcolor: '#f5f7fa', borderRadius: 2, boxShadow: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontSize: 18, color: '#1976d2' }}>📅</span>
                  <Box>
                    <Typography sx={{ fontWeight: 500 }}>{event.title}</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                      {moment(event.start).format('DD.MM.YYYY HH:mm')} - {moment(event.end).format('HH:mm')}
                    </Typography>
                  </Box>
                  {(isAdmin || event.userId === localStorage.getItem('userId')) && (
                    <Button size="small" color="error" sx={{ ml: 'auto', minWidth: 0, p: 0, fontSize: 16, borderRadius: 1 }} onClick={() => handleDeleteBooking(event)}>
                      <span role="img" aria-label="Удалить">🗑️</span>
                    </Button>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}