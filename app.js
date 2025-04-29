//Functional imports for chat
import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import fs from "fs";

//Functional imports for doc upload
import fileUpload from "express-fileupload";
import fetch from 'node-fetch';
import axios from 'axios';


// Set up for LLM w/ API KEY
//import { Document } from "@langchain/core/documents";
//import { ChatOpenAI } from "@langchain/openai";
//import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
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
  res.sendFile(join(__dirname, 'my_documents.html'));
});

//Document Upload functionality
app.use(fileUpload());

app.post('/upload', function(req, res) {
  let sampleFile;
  let uploadPath;

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

// The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  sampleFile = req.files.sampleFile;
  uploadPath = __dirname + '/uploads/' + sampleFile.name;

  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv(uploadPath, function(err) {
    if (err)
      return res.status(500).send(err);

    res.send('File uploaded!');
  });
});

let uploadPath;
console.log(uploadPath)

//Trying the file upload info -- move and generalize later https://platform.openai.com/docs/guides/pdf-file

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

    // Send the response back to the frontend
    const files = JSON.parse(response.data.body);
    res.json(files);  // Respond with the list of files
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

async function uploadFile(file) {
  const upload = await axios.post("https://67a08egpff.execute-api.us-east-2.amazonaws.com/test/upload?action=upload", {
    method: 'POST',
    headers: {
      'Content-Type': file.type,
      'x-api-key': DOC_API_KEY,
      'filename': file.name
    },
    body: file
  })
}


//NOTE: Client side implementation
//const file = await client.files.create({
    //file: fs.createReadStream("SSR_TSRPT.pdf"),
    //file: fs.createReadStream(uploadPath.toString()),
    //purpose: "user_data",
//});

// Chat functionality
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('chat message', async (msg) => {
    const API_URL = "https://rgo89zwyke.execute-api.us-east-2.amazonaws.com/dev/ask";
    const CHAT_API_KEY = "MqwABFGNhC4FF1Kqu2otv7ElRos1DbuS1FCkfuJx";
    console.log('message:' + msg);
    io.emit('chat message', "Me: " + msg);

    try {
      //NOTE: Server-side implementation
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CHAT_API_KEY
        },
        body: JSON.stringify({query: msg})
      });

      const data = await response.json();
      console.log('API Response',data);
      // NOTE: Client-side implementation with general LLM chat
      //const response = await client.responses.create({
        //model: 'gpt-4.1',
        //input: msg
      //});

      // NOTE: Client-side implementation w/ file as input
      //const response = await client.responses.create({
        //model: 'gpt-4o-mini',
        //input : [
          //{
            //role: 'user',
            //content: [
              //{
                //type: 'input_file',
                //file_id: file.id,
              //},
              //{
               // type: 'input_text',
                //text: msg,
              //},
            //],
          //},
        //],
      //console.log(response.output_text);

      //console.log('Full LLM Response:', JSON.stringify(response, null, 2));

        if (response) {
          //io.emit('chat message', "Hoam: " + response.output_text); // Emit LLM's response
          io.emit('chat message', "Hoam: " + data.results); // sending back the response

          //console.log('LLM response sent:', response.output_text);

        } else {
          io.emit('chat message', "The AI didn't provide a valid text response.");
        }

      //io.emit('chat message', response.text());
      //console.log('LLM response', response.text())
      } catch (error) {
      console.error("Error generating content" + error);
      io.emit('chat message',"Error processing your request.")
    }
  });
  socket.on('disconnect', () => {
    console.log('user disconnected');
  })
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
