const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const cors = require('cors');
const axios = require('axios');
const emailjs = require('emailjs-com');


const app = express();
app.use(express.json());
app.use(cors());

// Environment Variables
const MONGO_URI = "mongodb+srv://sajalgarg2006:sajal123@cluster0.urmyxu4.mongodb.net/?retryWrites=true&w=majority";
const JWT_SECRET = 'secret';
const EMAILJS_SERVICE_ID = "service_zg1d4gv";
const EMAILJS_TEMPLATE_ID = "template_egzjkgm";
const EMAILJS_USER_ID = "ShFkAn-KbgUjwd-k9";
const EMAILJS_ACCESS_TOKEN = "WqKxy5KKM85ewYprMu8IY"
// JWT Authentication Middleware
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = decoded;
        next();
    });
};

// Generate JWT Token
const generateToken = (userId) => jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '24h' });

// MongoDB Connection
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Connected to MongoDB");
        app.listen(8000, () => {
            console.log("Server is running on port 3000");
        });
    })
    .catch(err => console.error("Error connecting to MongoDB:", err));

// User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Routes
app.get('/getdata', authenticateJWT, async (req, res) => {
    try {
        const data = await User.find().select('-password');
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving data", error: error.message });
    }
});

app.get('/', (req, res) => {
    res.send("Hello World");
});

app.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        res.status(400).json({ message: "Error creating user", error: error.message });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(404).json({ message: "Invalid email or password" });
        }
        const token = generateToken(user._id);
        res.status(200).json({ message: "Login successful", token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: "Error during login", error: error.message });
    }
});

app.get('/api/dashboard', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Error accessing dashboard', error: error.message });
    }
});
// Forgot Password Route
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Generate reset token
        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Create the reset link
        const resetLink = `http://localhost:3000/reset-password/${token}`;

        // Prepare the payload for EmailJS
        const templateParams = {
            resetLink,
            user_email: user.email,
        };

        // Send the email using EmailJS REST API
        const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
            service_id: EMAILJS_SERVICE_ID,
            template_id: EMAILJS_TEMPLATE_ID,
            user_id: EMAILJS_USER_ID,
            template_params: templateParams,
        });

        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

app.get('/api/users', authenticateJWT, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving users', error: error.message });
    }
});

module.exports = app;
