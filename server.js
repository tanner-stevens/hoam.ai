import express from 'express';
import multer from 'multer';
import cors from 'cors';
const path = require('path');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
app.use(express.json()); // Parse application/json
app.use(express.urlencoded({ extended: true })); // Parse application/x-www-form-urlencoded

const server = http.createServer(app);
const io = new Server(server);

// Connect to MongoDB
mongoose.connect('mongodb+srv://hoamuser:test@cluster0.48rowfg.mongodb.net/hoam?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB Atlas!'))
.catch(err => console.error('MongoDB Atlas connection error:', err));

// User schema (password plain text for now)
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    address: String,
    password: String
});

const User = mongoose.model('User', userSchema);

// In-memory users storage
const users = [];

// Multer config
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Middleware
app.use(express.static('public')); // public folder for static files
app.use(express.urlencoded({ extended: true })); // for form parsing
app.use(express.json());

// Pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Upload
app.post('/upload', upload.single('document'), (req, res) => {
    console.log('Uploaded:', req.file);
    res.send('Success');
});

const fs = require('fs');

app.get('/api/files', (req, res) => {
    fs.readdir('uploads', (err, files) => {
        if (err) {
            console.error('Failed to list uploaded files:', err);
            return res.status(500).json({ error: 'Failed to list files' });
        }

        // Wrap filenames into objects to match frontend expectations
        const formattedFiles = files.map(filename => ({ filename }));
        res.json(formattedFiles);
    });
});

//register
app.post('/register', async (req, res) => {
    console.log('Incoming Registration Data:', req.body); // DEBUG LOGGING

    const { name, email, address, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).send('User already exists.');
        }

        const newUser = new User({
            name,
            email,
            address,
            password
        });

        await newUser.save(); // Save new user

        console.log('New User Saved:', email); // DEBUG LOGGING
        res.send('Success');
    } catch (error) {
        console.error('Registration error:', error); // ✅ PROPER ERROR LOGGING
        res.status(500).send('Registration failed.');
    }
});

// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send('User not found.');
        }

        if (user.password !== password) {
            return res.status(400).send('Incorrect password.');
        }

        res.send('Success');
    } catch (error) {
        console.error(error);
        res.status(500).send('Login failed.');
    }
});

// Chat
io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(Server running on port ${PORT});
});
