const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken'); // Import JWT library

const app = express();
const PORT = 3000

// Connect to MongoDB
mongoose.connect('mongodb+srv://satyamsahil:satyamsahilmongodb@satyammongo0.ii9zwcn.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// Define User Schema
const userSchema = new mongoose.Schema({
    name: String,
    username: { type: String, unique: true, minlength: 3, maxlength: 25 },
    email: String,
    password: { type: String, minlength: 8 }, // Adding minimum length requirement for password
    timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Middleware to handle JSON parsing
app.use(bodyParser.json());

// Authentication Middleware
const authenticateUser = (req, res, next) => {
    // Get token from request headers
    const token = req.headers.authorization;

    // Check if token is provided
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    // Verify token
    jwt.verify(token, 'your-secret-key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        } else {
            // Attach user information to request object
            req.user = decoded.user;
            next();
        }
    });
};

app.get('/', (req, res) => {
    res.send('Hey this is my API running 🥳')
})

// Register a user
app.post('/register', async (req, res) => {
    try {
        const { name, username, email, password } = req.body;

        // Check if any of the required fields are null
        if (!name || !username || !email || !password) {
            throw new Error('All fields are required');
        }

        const user = new User({ name, username, email, password });
        await user.save();
        res.status(201).send('User registered successfully');
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Login
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });
        if (!user || !password) throw new Error('Invalid credentials');
        // Create JWT token and send it in response
        const token = jwt.sign({ user }, 'your-secret-key');
        res.status(200).json({ token });
    } catch (err) {
        res.status(401).send(err.message);
    }
});

// Get user info
app.get('/user/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const user = await User.findOne({ username });
        if (!user) {
            throw new Error('User not found');
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Logout
app.post('/logout', async (req, res) => {
    // Assuming authentication is implemented, so no action is required here
    res.status(200).send('Logged out successfully. BYE ');
});

// Update user info
app.put('/user/:username', async (req, res) => {
  try {
    const username = req.params.username;

    // Find the user by their username
    const user = await User.findOne({ username });

    // If user not found, throw an error
    if (!user) {
      throw new Error('User not found');
    }

    // Update user information with the data from the request body
    Object.assign(user, req.body);

    // Save the updated user information
    await user.save();

    res.status(200).send('User info updated successfully');
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.listen(PORT, () => {
    console.log(`API listening on PORT ${PORT} `)
})

module.exports = app