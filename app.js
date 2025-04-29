//Functional imports for chat
import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';

//Functional imports for doc upload
import fetch from 'node-fetch';
import axios from 'axios';

// Set up for LLM w/ API KEY
import OpenAI from "openai";
import dotenv from 'dotenv';
dotenv.config();
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Environment variable, don't paste the full key directly here
});

// Core chat components https://socket.io/docs/v4/tutorial
const app = express();
const server = createServer(app);
const io = new Server(server);
const __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'chat.html'));
});

//File display info
const DOC_API_KEY = "N0I50xLGdz9LmOpHw32th8aN0nLnhhxW1vKLG5Q5"
const DOC_API_URL = "https://67a08egpff.execute-api.us-east-2.amazonaws.com/test/upload?action=list"

app.get('/api/files', async (req, res) => {
  try {
    const response = await axios.post(DOC_API_URL, {}, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': DOC_API_KEY,
      },
    });

    const files = JSON.parse(response.data.body);
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
  }
});

// Chat functionality
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('chat message', async (msg) => {
    const API_URL = "https://rgo89zwyke.execute-api.us-east-2.amazonaws.com/dev/ask";
    const CHAT_API_KEY = "MqwABFGNhC4FF1Kqu2otv7ElRos1DbuS1FCkfuJx";
    console.log('message:' + msg);
    io.emit('chat message', "Me: " + msg);

    try {
      //Get chunked document from AWS
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CHAT_API_KEY
        },
        body: JSON.stringify({query: msg})
      });

      const data = await response.json();
      console.log('API Response',data.results);

      // NOTE: Send chunked text to LLM
      const llm_response = await client.responses.create({
        model: 'gpt-4o-mini',
        input: "Provide a short, simple answer to: " + msg + data.results
      });

        if (response) {
          io.emit('chat message', "Hoam: " + llm_response.output_text); // Emit LLM's response

        } else {
          io.emit('chat message', "The AI didn't provide a valid text response.");
        }

      io.emit('chat message', llm_response.text());
      console.log('LLM response', llm_response.text())
      } catch (error) {
      console.error("Error generating content" + error);
    }
  });
  socket.on('disconnect', () => {
    console.log('user disconnected');
  })
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
