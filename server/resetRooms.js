// Скрипт для удаления всех кабинетов и добавления новых с кириллицей
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/booking-app');

const Room = mongoose.model('Room', {
  name: String,
  description: String,
});

async function resetRooms() {
  await Room.deleteMany({});
  await Room.insertMany([]);
  console.log('Кабинеты пересозданы!');
  mongoose.disconnect();
}

resetRooms();
