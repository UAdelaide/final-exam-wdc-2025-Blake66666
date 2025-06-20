const express = require('express');
const path = require('path');
require('dotenv').config();
var session = require('express-session');

const app = express();

// app.use(session({
//   secret: 'your-secret-key',
// }));

// Middleware
app.use(express.json());


// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

app.use(express.static(path.join(__dirname, '/public')));

// Export the app instead of listening here
module.exports = app;
