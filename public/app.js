// app.js

// ---------- Modal helpers ----------
function showModal(message) {
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modalContent');
    modalContent.textContent = message;
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
}

// ---------- Dark mode toggle ----------
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

// ---------- Upload file ----------
function handleUpload(event) {
    event.preventDefault();
    const formData = new FormData(event.target);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            showModal('Upload successful!');
            setTimeout(() => {
                window.location.href = '/documents.html';
            }, 2000);
        } else {
            throw new Error('Upload failed.');
        }
    })
    .catch(error => {
        showModal('Upload failed. Please try again.');
        console.error('Error:', error);
    });
}

// ---------- Register user ----------
function handleRegister(event) {
    event.preventDefault();
    const formData = new FormData(event.target);

    fetch('/register', {
        method: 'POST',
        body: new URLSearchParams(formData)
    })
    .then(response => {
        if (response.ok) {
            showModal('Registration successful!');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
        } else {
            return response.text().then(text => { throw new Error(text) });
        }
    })
    .catch(error => {
        showModal('Registration failed: ' + error.message);
    });
}

// ---------- Login user ----------
function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);

    fetch('/login', {
        method: 'POST',
        body: new URLSearchParams(formData)
    })
    .then(response => {
        if (response.ok) {
            formData.forEach((value, key) => {
                if (key === 'email') {
                    localStorage.setItem('userEmail', value);
                }
            });
            showModal('Login successful!');
            setTimeout(() => {
                window.location.href = '/documents.html';
            }, 2000);
        } else {
            return response.text().then(text => { throw new Error(text) });
        }
    })
    .catch(error => {
        showModal('Login failed: ' + error.message);
    });
}

// ---------- Chat (socket.io) ----------
let socket;
function initializeChat() {
    socket = io();
    socket.on('chat message', function(msg) {
        const chatBox = document.getElementById("chatBox");
        const msgElement = document.createElement("div");
        msgElement.textContent = msg;
        chatBox.appendChild(msgElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

function sendMessage() {
    const input = document.getElementById("chatInput");
    const message = input.value.trim();
    if (message && socket) {
        socket.emit('chat message', message);
        input.value = "";
    }
}
