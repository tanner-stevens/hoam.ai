import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Setup __dirname manually for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// MongoDB connection
mongoose.connect('mongodb+srv://hoamuser:test@cluster0.48rowfg.mongodb.net/hoam?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB Atlas!'))
.catch(err => console.error('MongoDB Atlas connection error:', err));

// User schema
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    address: String,
    password: String
});

const User = mongoose.model('User', userSchema);

// Multer config
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.static('public')); 
app.use(express.urlencoded({ extended: true }));
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

// List uploaded files
app.get('/api/files', (req, res) => {
    fs.readdir('uploads', (err, files) => {
        if (err) {
            console.error('Failed to list uploaded files:', err);
            return res.status(500).json({ error: 'Failed to list files' });
        }
        const formattedFiles = files.map(filename => ({ filename }));
        res.json(formattedFiles);
    });
});

// Register
app.post('/register', async (req, res) => {
    const { name, email, address, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('User already exists.');
        }

        const newUser = new User({ name, email, address, password });
        await newUser.save();

        console.log('New User Saved:', email);
        res.send('Success');
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).send('Registration failed.');
    }
});

// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).send('User not found.');
        if (user.password !== password) return res.status(400).send('Incorrect password.');

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
    console.log(`Server running on http://localhost:${PORT}`);
});
