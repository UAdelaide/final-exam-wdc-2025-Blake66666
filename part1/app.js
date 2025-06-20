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

    // Insert records into the database on startup to allow for testing.
    await db.execute(`
INSERT INTO Users (username, email, password_hash, role) VALUES
('alice123', 'alice@example.com', 'hashed123', 'owner'),
('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
('carol123', 'carol@example.com', 'hashed789', 'owner'),
('davidwalker', 'david@example.com', 'hashedabc', 'walker'),
('emmaowner', 'emma@example.com', 'hasheddef', 'owner');
    `);
    await db.execute(`
INSERT INTO Dogs (owner_id, name, size) VALUES
((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'),
((SELECT user_id FROM Users WHERE username = 'alice123'), 'Rocky', 'large'),
((SELECT user_id FROM Users WHERE username = 'emmaowner'), 'Lucy', 'small'),
((SELECT user_id FROM Users WHERE username = 'carol123'), 'Charlie', 'medium');
    `);
    await db.execute(`
INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
(
(SELECT dog_id FROM Dogs AS d JOIN Users AS u ON d.owner_id = u.user_id WHERE d.name = 'Max' AND u.username = 'alice123'),
'2025-06-10 08:00:00',
30,
'Parklands',
'open'
),
(
(SELECT dog_id FROM Dogs AS d JOIN Users AS u ON d.owner_id = u.user_id WHERE d.name = 'Bella' AND u.username = 'carol123'),
'2025-06-10 09:30:00',
45,
'Beachside Ave',
'accepted'
),
(
(SELECT dog_id FROM Dogs AS d JOIN Users AS u ON d.owner_id = u.user_id WHERE d.name = 'Rocky' AND u.username = 'alice123'),
'2025-06-11 14:00:00',
60,
'City Botanic Gardens',
'open'
),
(
(SELECT dog_id FROM Dogs AS d JOIN Users AS u ON d.owner_id = u.user_id WHERE d.name = 'Lucy' AND u.username = 'emmaowner'),
'2025-06-11 17:00:00',
20,
'Suburbia Streets',
'completed'
),
(
(SELECT dog_id FROM Dogs AS d JOIN Users AS u ON d.owner_id = u.user_id WHERE d.name = 'Charlie' AND u.username = 'carol123'),
'2025-06-12 10:00:00',
45,
'Riverfront Path',
'cancelled'
);
    `);

  } catch (err) {
    console.log('duplicated insert');
  }
})();


app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/dogs', async (req, res) => {
  try {
    const [dogs] = await db.execute(`
    SELECT
    d.name AS dog_name,
    d.size,
    u.username AS owner_username
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

app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [requests] = await db.execute(`
SELECT
    wr.request_id,
    d.name AS dog_name,
    wr.requested_time,
    wr.duration_minutes,
    wr.location,
    u.username AS owner_username
FROM
    WalkRequests wr
JOIN
    Dogs d ON wr.dog_id = d.dog_id
JOIN
    Users u ON d.owner_id = u.user_id
WHERE
    wr.status = 'open'
ORDER BY
    wr.requested_time;
      `);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [requests] = await db.execute(`
SELECT
    wr.request_id,
    d.name AS dog_name,
    wr.requested_time,
    wr.duration_minutes,
    wr.location,
    u.username AS owner_username
FROM
    WalkRequests wr
JOIN
    Dogs d ON wr.dog_id = d.dog_id
JOIN
    Users u ON d.owner_id = u.user_id
WHERE
    wr.status = 'open'
ORDER BY
    wr.requested_time;
      `);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
