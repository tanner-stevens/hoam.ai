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
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
    } else {
        localStorage.setItem('darkMode', 'disabled');
    }
}

async function handleUpload(event) {
  event.preventDefault();
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];

  if (!file) {
    showModal("Please select a file to upload.");
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch("https://67a08egpff.execute-api.us-east-2.amazonaws.com/test/upload", {
      method: "POST",
      headers: {
        'x-api-key': "N0I50xLGdz9LmOpHw32th8aN0nLnhhxW1vKLG5Q5"
      },
      body: formData
    });

    if (response.ok) {
      showModal("Upload successful!");
      fileInput.value = "";
      loadFileList(); // Refresh list from AWS
    } else {
      const text = await response.text();
      showModal("Upload failed: " + text);
    }
  } catch (err) {
    console.error("Upload error:", err);
    showModal("Upload failed.");
  }
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

window.addEventListener('load', () => {
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
    }
});

