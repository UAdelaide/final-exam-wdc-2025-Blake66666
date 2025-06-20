const express = require('express');
const path = require('path');
require('dotenv').config();
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

const app = express();
const db = require('./models/db');

app.use(session({
  secret: 'your-secret-key'
}));

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

app.get('/api/dogs', async (req, res) => {
  try {
    const [dogs] = await db.execute(`
    SELECT
    d.dog_id,
    d.name AS dog_name,
    d.size,
    u.username AS owner_username,
    u.user_id AS owner_id
    FROM
    Dogs d
    JOIN
    Users u ON d.owner_id = u.user_id
    ORDER BY
    u.username, d.name;
      `);
    res.json(dogs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

app.use(express.static(path.join(__dirname, '/public')));

// Export the app instead of listening here
module.exports = app;
