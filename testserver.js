// Import required modules
const express = require('express');
const multer = require('multer');
const { Pool } = require('pg');

// Create an Express app
const app = express();
const port = 8008;

// Multer configuration for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// PostgreSQL database connection configuration
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'trail',
    password: 'sridhar@04',
    port: 5000, // Change port to default PostgreSQL port (5432)
});

app.use(express.static('public'));


// Handle POST request for uploading exam details
app.post('/upload', upload.fields([{ name: 'questionFile', maxCount: 1 }, { name: 'masterKeyFile', maxCount: 1 }]), (req, res) => {
    // Extract exam details from request body
    const teacher_id = req.body.teacher_id;
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const language = req.body.language;

    // Extract image data from uploaded files
    const questionFile = req.files['questionFile'][0];
    const masterKeyFile = req.files['masterKeyFile'][0];

    // Store exam details and image data in the database
    pool.query('INSERT INTO tests (upload_date, language, start_date, end_date, start_time, end_time, question_paper_image, answer_key_image, teacher_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING test_id',
        [new Date(), language, startDate, endDate, startTime, endTime, questionFile.buffer, masterKeyFile.buffer, teacher_id], (error, results) => {
            if (error) {
                console.error('Error storing exam details:', error);
                res.status(500).json({ error: 'An error occurred while storing exam details' });
            } else {
                const testId = results.rows[0].test_id;
                res.status(200).json({ testId: testId });
            }
        });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
