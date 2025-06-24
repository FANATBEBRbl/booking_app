const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json({ type: '*/*' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Подключение к MongoDB
mongoose.connect("mongodb://localhost:27017/booking-app");

// Установка кодировки для mongoose
mongoose.set('toJSON', { virtuals: true });

// Модели
const User = mongoose.model("User", {
  email: String,
  password: String,
  name: String,
});

const Room = mongoose.model("Room", {
  name: String,
  description: String,
});

const Booking = mongoose.model("Booking", {
  userId: String,
  roomId: String,
  date: Date,
  timeStart: String,
  timeEnd: String,
  reason: String,
});

// Регистрация
app.post("/api/auth/register", async (req, res) => {
  const { email, password, name } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashedPassword, name });
  await user.save();
  res.status(201).send("User created");
});

// Логин
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).send("User not found");

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) return res.status(401).send("Invalid password");

  const token = jwt.sign({ userId: user._id }, "secret-key");
  res.json({ token });
});

// Получить список кабинетов
app.get("/api/rooms", async (req, res) => {
  const rooms = await Room.find();
  res.json(rooms);
});

// Добавить кабинет (только для администратора)
app.post("/api/rooms", async (req, res) => {
  // Проверка авторизации и роли
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).send('Нет авторизации');
  try {
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, "secret-key");
    // Пример: только email admin@admin может добавлять кабинеты
    const user = await User.findById(payload.userId);
    if (!user || user.email !== 'admin@admin') return res.status(403).send('Нет прав');
  } catch {
    return res.status(401).send('Неверный токен');
  }
  const { name, description } = req.body;
  const room = new Room({ name, description });
  await room.save();
  res.status(201).json(room);
});

// Получить бронирования по кабинету
app.get("/api/bookings", async (req, res) => {
  const { roomId } = req.query;
  const filter = roomId ? { roomId } : {};
  const bookings = await Booking.find(filter);
  res.json(bookings);
});

// Удалить бронь (только свою или админ)
app.delete('/api/bookings/:id', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Нет авторизации' });
  let userId = null;
  let isAdmin = false;
  try {
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, "secret-key");
    userId = payload.userId;
    const user = await User.findById(userId);
    isAdmin = user && user.email === 'admin@admin';
  } catch (e) {
    return res.status(401).json({ error: 'Неверный токен', details: e.message });
  }
  try {
    const booking = await Booking.findById(req.params.id);
    console.log('Удаление брони:', {
      bookingId: req.params.id,
      userId,
      isAdmin,
      booking
    });
    if (!booking) return res.status(404).json({ error: 'Бронь не найдена' });
    if (!isAdmin && booking.userId !== userId) return res.status(403).json({ error: 'Нет прав' });
    await Booking.deleteOne({ _id: req.params.id });
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера', details: e.message });
  }
});

// Создать бронь (с проверкой пересечений)
app.post("/api/bookings", async (req, res) => {
  const { userId, roomId, date, timeStart, timeEnd, reason } = req.body;
  const start = new Date(`${date}T${timeStart}`);
  const end = new Date(`${date}T${timeEnd}`);
  if (start < new Date()) return res.status(400).send('Нельзя бронировать на прошедшее время!');
  if (!reason || !reason.trim()) return res.status(400).send('Причина бронирования обязательна!');
  const overlap = await Booking.findOne({
    roomId,
    date: new Date(date),
    $or: [
      { $and: [ { timeStart: { $lt: timeEnd } }, { timeEnd: { $gt: timeStart } } ] }
    ]
  });
  if (overlap) return res.status(400).send('В это время уже есть бронь!');
  const booking = new Booking({ userId, roomId, date, timeStart, timeEnd, reason });
  await booking.save();
  res.status(201).send("Booking created");
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));