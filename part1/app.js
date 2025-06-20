var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');

// run the following command first
// mysql < ./dogwalks.sql

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let db;

(async () => {
  try {

    // Now connect to the created database
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'DogWalkService'
    });

    // Create a table if it doesn't exist
    await db.execute(`
      INSERT INTO Users (username, email, password_hash, role) VALUES
      ('alice123', 'alice@example.com', 'hashed123', 'owner'),
      ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
      ('carol123', 'carol@example.com', 'hashed789', 'owner'),
      ('davidwalker', 'david@example.com', 'hashedabc', 'walker'),
      ('emmaowner', 'emma@example.com', 'hasheddef', 'owner');

      SET @alice_id = (SELECT user_id FROM Users WHERE username = 'alice123');
SET @carol_id = (SELECT user_id FROM Users WHERE username = 'carol123');
SET @emma_id  = (SELECT user_id FROM Users WHERE username = 'emmaowner');
      INSERT INTO Dogs (owner_id, name, size) VALUES
(@alice_id, 'Max', 'medium'),
(@carol_id, 'Bella', 'small'),
(@alice_id, 'Rocky', 'large'),
(@emma_id, 'Lucy', 'small'),
(@carol_id, 'Charlie', 'medium');

SET @max_id = (SELECT dog_id FROM Dogs WHERE name = 'Max' AND owner_id = @alice_id);
SET @bella_id = (SELECT dog_id FROM Dogs WHERE name = 'Bella' AND owner_id = @carol_id);
SET @rocky_id = (SELECT dog_id FROM Dogs WHERE name = 'Rocky' AND owner_id = @alice_id);
SET @lucy_id = (SELECT dog_id FROM Dogs WHERE name = 'Lucy' AND owner_id = @emma_id);
SET @charlie_id = (SELECT dog_id FROM Dogs WHERE name = 'Charlie' AND owner_id = @carol_id);

INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
(
    @max_id,
    '2025-06-10 08:00:00',
    30,
    'Parklands',
    'open'
),
(
    @bella_id,
    '2025-06-10 09:30:00',
    45,
    'Beachside Ave',
    'accepted'
),
(
    @rocky_id,
    '2025-06-11 14:00:00',
    60,
    'City Botanic Gardens',
    'open'
),
(
    @lucy_id,
    '2025-06-11 17:00:00',
    20,
    'Suburbia Streets',
    'completed'
),
(
    @charlie_id,
    '2025-06-12 10:00:00',
    45,
    'Riverfront Path',
    'cancelled'
);
    `);

  } catch (err) {
    console.error('Error setting up database. Ensure Mysql is running: service mysql start', err);
  }
})();


app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
