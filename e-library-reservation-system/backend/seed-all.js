const path = require('path');
const fs = require('fs');

const files = [
  path.join(__dirname, 'data/auth.db'),
  path.join(__dirname, 'data/catalog.db'),
  path.join(__dirname, 'data/reservation.db'),
];

for (const file of files) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`Deleted ${file}`);
  }
}

console.log('Database files reset. Start backend services to auto-seed sample data.');
