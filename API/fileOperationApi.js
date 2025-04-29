const fs = require('fs');
const axios = require('axios');

// API 1 test cases
// for file upload, query, download, delete
const FILE_API_URL = "https://67a08egpff.execute-api.us-east-2.amazonaws.com/test/upload";
const FILE_API_KEY = "N0I50xLGdz9LmOpHw32th8aN0nLnhhxW1vKLG5Q5";

const headersBase = {
    'x-api-key': FILE_API_KEY
};

async function uploadFile(filename) {
    try {
        const pdfBinary = fs.readFileSync(filename);

        const headers = {
            ...headersBase,
            'Content-Type': 'application/pdf',
            'filename': filename
        };

        const response = await axios.post(`${FILE_API_URL}?action=upload`,
            pdfBinary,
            { headers });
        console.log("Upload Response:", response.status, response.data);
    } catch (error) {
        console.error("Upload Error:", error.response?.status || error.message);
    }
}

async function listFiles() {
    try {
        // Add empty object as data and specify the content type
        const response = await axios.post(`${FILE_API_URL}?action=list`,
            {}, // Empty object as data
            {
                headers: {
                    ...headersBase,
                    'Content-Type': 'application/json' // Explicitly set content type
                }
            });
        console.log("List Response:", response.status);
        console.log("Files:", response.data);
    } catch (error) {
        console.error("List Error:", error.response?.status || error.message);
        if (error.response?.data) {
            console.error("Error details:", error.response.data);
        }
    }
}

async function deleteFile(filename) {
    try {
        const headers = {
            ...headersBase,
            'filename': filename,
            'Content-Type': 'application/json'
        };

        const response = await axios.post(`${FILE_API_URL}?action=delete`,
            {}, // Empty object as data
            { headers });
        console.log("Delete Response:", response.status, response.data);
    } catch (error) {
        console.error("Delete Error:", error.response?.status || error.message);
        if (error.response?.data) {
            console.error("Error details:", error.response.data);
        }
    }
}

async function downloadFile(filename, saveAs) {
    try {
        const headers = {
            ...headersBase,
            'filename': filename,
            'Content-Type': 'application/json'
        };

        const response = await axios.post(`${FILE_API_URL}?action=download`,
            {}, // Empty object as data
            { headers });

        if (response.status === 200) {
            const encodedData = response.data.body || "";
            fs.writeFileSync(saveAs, Buffer.from(encodedData, 'base64'));
            console.log(`Downloaded and saved as ${saveAs}`);
        }
    } catch (error) {
        console.error("Download Error:", error.response?.status || error.message);
        if (error.response?.data) {
            console.error("Error details:", error.response.data);
        }
    }
}

// Uncomment these to test various file operations
// uploadFile("1.png");
listFiles();
// downloadFile("1.png", "downloaded.png");
// deleteFile("1.png");

// uploadFile("cs120.pdf");
// listFiles();
// downloadFile("test.pdf", "downloaded.pdf");
// deleteFile("test.pdf");

// API 2 test cases
// for getting user's questions and returning answers
async function askQuestion() {
    const QUERY_API_URL = "https://rgo89zwyke.execute-api.us-east-2.amazonaws.com/dev/ask";
    const QUERY_API_KEY = "MqwABFGNhC4FF1Kqu2otv7ElRos1DbuS1FCkfuJx";

    const headers = {
        'x-api-key': QUERY_API_KEY,
        'Content-Type': 'application/json'
    };

    const data = {
        "query": "OpenSearch setup"
    };

    try {
        const response = await axios.post(QUERY_API_URL, data, { headers });
        console.log("Status Code:", response.status);
        console.log("Response:", response.data);
    } catch (error) {
        console.error("Query Error:", error.response?.status || error.message);
        if (error.response?.data) {
            console.error("Error details:", error.response.data);
        }
    }
}

// Run the question API test
askQuestion();