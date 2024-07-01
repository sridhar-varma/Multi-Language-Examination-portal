const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { Pool } = require('pg');
const multer = require('multer');
const fs = require('fs');
const fetch = require('node-fetch');
const { LanguageServiceClient } = require('@google-cloud/language');
const bcrypt = require('bcrypt');



const vision = require('@google-cloud/vision');
const { Translate } = require('@google-cloud/translate').v2;
const natural = require('natural');

const path = require('path');

const app = express();
const port = 3000;

const textRazorApiKey = ''; //please use your Razor API KEY

// Setup middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Define storage for uploaded answer files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});


// Multer configuration for handling file uploads

const upload = multer({ storage: storage });

// Database configuration
const pool = new Pool({
 //postgres credentials
});

// Session middleware
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static('public'));





// Google Cloud Vision and Translate clients





const CREDENTIALS1 =JSON.parse(JSON.stringify(
  {
      //gcp translate api credentials
    }

)
);

const CREDENTIALS2 =JSON.parse(JSON.stringify({
  //gcp vision api credentials
));

// Load the service account credentials
const credentials = {
  //gcp natural language api credentials
};

// Create a client
const language2 = new LanguageServiceClient({ credentials });

const CONFIG ={
  credentials: {
      private_key: CREDENTIALS2.private_key,
      client_email: CREDENTIALS2.client_email
  }
};

const CONFIG1 ={
  credentials: {
      private_key: CREDENTIALS1.private_key,
      client_email: CREDENTIALS1.client_email
  }
};

const visionClient = new vision.ImageAnnotatorClient(CONFIG);


const translateClient = new Translate(CONFIG1);

// Google Cloud Vision and Translate clients


// Function to extract text from image using Google Cloud Vision API
const extractTextFromImage = async (imagePath) => {
try {
  const [result] = await visionClient.textDetection(imagePath);
  console.log(result.fullTextAnnotation.text);
  return result.fullTextAnnotation.text;
} catch (error) {
  console.error('Error extracting text from image:', error);
  throw error;
}
};

// Function to translate text from Tamil to English
// Function to translate text from Tamil to English
// Function to translate text from Tamil to English
const translateToEnglish = async (text, sourceLanguage) => {
  
    try {
      const maxChunkSize = 10200; // Maximum chunk size allowed by Google Translation API
      const translatedChunks = [];
    
      // Split the text into smaller chunks
      for (let i = 0; i < text.length; i += maxChunkSize) {
        const chunk = text.substring(i, i + maxChunkSize);
        console.log(`Chunk ${i / maxChunkSize + 1}: Length ${chunk.length}`);
    
        // Translate the current chunk and wait for the response
        const translation = await translateClient.translate(chunk, 'en');
        translatedChunks.push(translation);
      }
    
      // Concatenate the translated chunks into a single string
      const translatedText = translatedChunks.join('');
    
      console.log('Translated Text:', translatedText);
      return translatedText;
    } catch (error) {
      console.error('Error translating text:', error);
      throw error;
    }
  };


  const translateText = async (text,targetLanguage) => {
  
    try {
      const maxChunkSize = 10200; // Maximum chunk size allowed by Google Translation API
      const translatedChunks = [];
    
      // Split the text into smaller chunks
      for (let i = 0; i < text.length; i += maxChunkSize) {
        const chunk = text.substring(i, i + maxChunkSize);
        console.log(`Chunk ${i / maxChunkSize + 1}: Length ${chunk.length}`);
    
        // Translate the current chunk and wait for the response
        const translation =  await translateClient.translate(text,targetLanguage);
        
        translatedChunks.push(translation);
      }
    
      // Concatenate the translated chunks into a single string
      const translatedText = translatedChunks.join('');
    
      console.log('Translated Text:', translatedText);
      return translatedText;
    } catch (error) {
      console.error('Error translating text:', error);
      throw error;
    }
  };





// Function to calculate text similarity
// Function to calculate text similarity
const calculateSimilarity = async (text1, text2) => {
  try {
      // Analyze the syntax of text 1
      const [syntax1] = await language2.analyzeSyntax({ document: { content: text1, type: 'PLAIN_TEXT' } });
      const tokens1 = syntax1.tokens.map(token => token.text.content.toLowerCase());

      // Analyze the syntax of text 2
      const [syntax2] = await language2.analyzeSyntax({ document: { content: text2, type: 'PLAIN_TEXT' } });
      const tokens2 = syntax2.tokens.map(token => token.text.content.toLowerCase());

      // Calculate similarity
      const intersection = tokens1.filter(token => tokens2.includes(token));
      const cosineSimilarity = intersection.length / (Math.sqrt(tokens1.length) * Math.sqrt(tokens2.length));

      console.log(`Semantic similarity between the two texts: ${cosineSimilarity}`);
      return cosineSimilarity;
  } catch (error) {
      console.error('Error calculating semantic similarity:', error);
      return 0; // Or handle the error accordingly
  }
};


// Routes

// Define route handler for root URL
// Serve frontend HTML file
// Redirect root URL to login page
// Define route handler for root URL
// Redirect root URL to login page
app.get('/', (req, res) => {
  res.redirect('/home.html');
});


app.get('/home', (req, res) => {
  res.redirect('/home.html');
});

app.get('/login', (req, res) => {
  res.redirect('/login.html');
});

// Login route
// Login route
app.post('/login', (req, res) => {
  const { email, password, userType } = req.body;
  console.log('Received login request for email:', email, 'and userType:', userType);

  if (userType === 'Student') {
    // Check if the user exists in the student table
    pool.query('SELECT * FROM students WHERE email = $1', [email], (err, studentResult) => {
      if (err) {
        return console.error('Error executing query', err.stack);
      }

      if (studentResult.rows.length > 0) {
        // Compare hashed password
        bcrypt.compare(password, studentResult.rows[0].password, (bcryptErr, bcryptRes) => {
          if (bcryptErr) {
            return console.error('Error comparing passwords', bcryptErr);
          }
          if (bcryptRes) {
            req.session.email = email;
            req.session.userType = 'student';
            req.session.username = studentResult.rows[0].name; // Store username in session
            res.redirect(`/Student?username=${encodeURIComponent(req.session.username)}`);
          } else {
            res.redirect('./login.html');
          }
        });
      } else {
        res.redirect('./login.html');
      }
    });
  } else if (userType === 'Instructor') {
    // Check if the user exists in the teacher table
    pool.query('SELECT * FROM teachers WHERE email = $1', [email], (err, teacherResult) => {
      if (err) {
        return console.error('Error executing query', err.stack);
      }

      if (teacherResult.rows.length > 0) {
        // Compare hashed password
        bcrypt.compare(password, teacherResult.rows[0].password, (bcryptErr, bcryptRes) => {
          if (bcryptErr) {
            return console.error('Error comparing passwords', bcryptErr);
          }
          if (bcryptRes) {
            req.session.email = email;
            req.session.userType = 'teacher';
            req.session.username = teacherResult.rows[0].name; // Store username in session
            res.redirect(`/instructor?username=${encodeURIComponent(req.session.username)}`);
          } else {
            res.redirect('./login.html');
          }
        });
      } else {
        res.redirect('./login.html');
      }
    });
  } else {
    res.redirect('./login.html'); // Redirect to login page if userType is not provided or invalid
  }
});


// Redirect root URL to login page
app.get('/tp', (req, res) => {
  const { name } = req.query; // Assuming the name parameter is sent as a query parameter
  res.redirect(`/teacherprofile.html?name=${name}`);
});

// Redirect root URL to login page
app.get('/sp', (req, res) => {
  const { name } = req.query; // Assuming the name parameter is sent as a query parameter
  res.redirect(`/studentprofile.html?name=${name}`);
});


// Route for handling student profile form submission
app.post('/submit_teacher_profile', async (req, res) => {
const { name, specialization, highest_degree, organization, role, working_from_date, location} = req.body;

try {
  const client = await pool.connect();

  // Check if the student with the provided name exists
  const checkQuery = 'SELECT * FROM public.teachers WHERE name = $1';
  const { rows } = await client.query(checkQuery, [name]);

  if (rows.length === 0) {
    // If student does not exist, return an error
    return res.status(404).send('Instructor does not exist');
  }

  // Update the student's profile
  const updateQuery = `
    UPDATE public.teachers 
    SET  specialization = $2, highest_degree = $3, organization = $4, role = $5,  working_from_date = $6, location = $7 
    WHERE name = $1
  `;
  await client.query(updateQuery, [name, specialization, highest_degree, organization, role, working_from_date, location]);

  // Release the client back to the pool
  client.release();

  // Send a success response
  res.redirect(`/instructor?username=${encodeURIComponent(name)}`);
  

} catch (err) {
  console.error('Error executing query', err);
  
  return res.send('<script>alert("Please fill all the fields"); window.location.href="/instructor?username=${encodeURIComponent(name)}";</script>');
}
});

app.get('/tp', (req, res) => {
  const { name } = req.query; // Assuming the name parameter is sent as a query parameter
  res.redirect(`/teacherprofile.html?name=${name}`);
});



// Route to render Student page
app.get('/Student', (req, res) => {
  // Check if the user is logged in
  if (req.session.username) {
    const { username } = req.session;

    // Fetch additional data for the Student based on the username
    pool.query('SELECT student_id, specialization, institute, location, course, email FROM students WHERE name = $1', [username], (err, studentResult) => {
      if (err) {
        return console.error('Error executing query', err.stack);
      }

      if (studentResult.rows.length > 0) {
        const { student_id, specialization, institute, location, course, email} = studentResult.rows[0];

        // Now fetch tests written by this Student
        pool.query('SELECT test_id, answer_id FROM answer_sheets WHERE student_id = (SELECT student_id FROM students WHERE name = $1)', [username], (err, testResult) => {
          if (err) {
            return console.error('Error executing query', err.stack);
          }

          // Set the image path
          const imagePath = '/Google-Translate-Android-app-icon-removebg-preview.png'; // Adjust the path to match your image location

          // Pass both student details, tests data, and image path to the frontend
          res.render('Student', { 
            student_id, 
            specialization, 
            institute, 
            location, 
            course, 
            email, 
            tests: testResult.rows, 
            name: username, 
            imagePath: imagePath 
          });
        });
      } else {
        res.redirect('/login.html'); // Redirect if student not found
      }
    });
  } else {
    res.redirect('/login.html'); // Redirect if user is not logged in
  }
});

// Route for handling student profile form submission
app.post('/submit_student_profile', async (req, res) => {
  const { name, specialization, institute, course, location } = req.body;

  try {
    const client = await pool.connect();

    // Check if the student with the provided name exists
    const checkQuery = 'SELECT * FROM public.students WHERE name = $1';
    const { rows } = await client.query(checkQuery, [name]);

    if (rows.length === 0) {
      // If student does not exist, return an error
      return res.status(404).send('Student does not exist');
    }

    // Update the student's profile
    const updateQuery = `
      UPDATE public.students 
      SET specialization = $2, institute = $3, course = $4, location = $5 
      WHERE name = $1
    `;
    await client.query(updateQuery, [name, specialization, institute, course, location]);

    // Release the client back to the pool
    client.release();
    res.redirect(`/student?username=${encodeURIComponent(name)}`);
    // Send a success response
    //res.status(200).send('Student profile updated successfully!');
  } catch (err) {
    console.error('Error executing query', err);
    //return res.send('<script>alert("Please fill all the fields"); window.location.href="/student?username=${encodeURIComponent(name)}";</script>');
    //res.status(500).send('Internal Server Error');
  }
});

app.get('/test', (req, res) => {
  const teacher_id = req.query.teacher_id;
  res.sendFile(path.join(__dirname, 'public', 'test.html'));
});


// Route to render instructor page
// Route to render instructor page
app.get('/instructor', (req, res) => {
  // Check if the user is logged in
  if (req.session.username) {
    const { username } = req.session;

    // Fetch additional data for the instructor based on the username
    pool.query('SELECT teacher_id,specialization, organization, location, role, working_from_date FROM teachers WHERE name = $1', [username], (err, instructorResult) => {
      if (err) {
        return console.error('Error executing query', err.stack);
      }
      
      

      if (instructorResult.rows.length > 0) {
        const { teacher_id,specialization, organization, location, role, working_from_date } = instructorResult.rows[0];

        console.log("teacher_id: ",teacher_id);

        // Now fetch tests conducted by this instructor
        pool.query('SELECT test_id, start_date, end_date FROM tests WHERE teacher_id = (SELECT teacher_id FROM teachers WHERE name = $1)', [username], (err, testResult) => {
          if (err) {
            return console.error('Error executing query', err.stack);
          }

          // Set the image path
          const imagePath = '/Google-Translate-Android-app-icon-removebg-preview.png'; // Adjust the path to match your image location

          // Pass both instructor details, tests data, and image path to the frontend
          res.render('Instructor', { 
            teacher_id,
            specialization, 
            organization, 
            location, 
            role, 
            working_from_date, 
            tests: testResult.rows, 
            name: username,
            imagePath: imagePath // Pass the image path to the frontend
          });
        });
      } else {
        res.redirect('/login.html'); // Redirect if instructor not found
      }
    });
  } else {
    res.redirect('/login.html'); // Redirect if user is not logged in
  }
});

// Define a route to retrieve data from the database based on test ID
app.get('/api/results/:testId', async (req, res) => {
  const testId = req.params.testId;
  const name = req.params.name;
  console.log("name:",name);
  try {
    const query = `
      WITH ranked_answers AS (
        SELECT 
          student_id,
          score,
          ROW_NUMBER() OVER (ORDER BY score) AS rank
        FROM 
          answer_sheets
        WHERE
          test_id = $1
      )
      SELECT 
        ra.student_id,
        ra.score,
        CASE 
          WHEN ABS(ra.score - ra_prev.score) < 0.001 THEN 'Plagiarised-G' || ra_prev.rank
          ELSE 'Not Plagiarised'
        END AS status
      FROM 
        ranked_answers ra
      LEFT JOIN 
        ranked_answers ra_prev ON ra.rank = ra_prev.rank + 1;
    `;
    const { rows } = await pool.query(query, [testId]);

    // Assign group IDs to plagiarised students
    let groupCounter = 1;
    let prevStatus = rows[0].status;
    rows.forEach(row => {
      if (row.status === prevStatus) {
        row.status = `Plagiarised-G${groupCounter}`;
      } else {
        prevStatus = row.status;
        groupCounter++;
        row.status = `Plagiarised-G${groupCounter}`;
      }
    });

    const imagePath = '/Google-Translate-Android-app-icon-removebg-preview.png'; // Adjust the path to match your image location


    // Render the result.ejs template with the retrieved data
    res.render('result', { data: rows, testId: testId, imagePath: imagePath } );

  } catch (error) {
    console.error('Error retrieving data:', error);
   
    
   try {
    // Fetch question paper details including start date, end date, start time, and end time from the database
    return res.send('<script>alert("Test has not been attempted by anyone"); window.location.href="/instructor?username=${encodeURIComponent(name)}";</script>');
    }
    finally{}
  }
});

app.get('/test', (req, res) => {
  // Assuming imagePath is the path to your image
  const imagePath = '/Google-Translate-Android-app-icon-removebg-preview.png'; // Adjust the path to match your image location

  // Render the "test" view and pass the image path to it
  res.redirect('/test.html');
});

app.get('/write', (req,res) => {
  console.log("yes");

  const imagePath = '/Google-Translate-Android-app-icon-removebg-preview.png'; // Adjust the path to match your image location

  res.render('write',{ imagePath: imagePath });
});
// Handle POST request for uploading exam details
app.post('/upload', upload.fields([{ name: 'questionFile', maxCount: 1 }, { name: 'masterKeyFile', maxCount: 1 }]), (req, res) => {
  // Extract exam details from request body
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
      [new Date(), language, startDate, endDate, startTime, endTime, questionFile.buffer, masterKeyFile.buffer, 1], (error, results) => {
          if (error) {
              console.error('Error storing exam details:', error);
              res.status(500).json({ error: 'An error occurred while storing exam details' });
          } else {
              const testId = results.rows[0].test_id;
              res.status(200).json({ testId: testId });
          }
      });
});

// Endpoint to fetch answer key image based on student ID and testID
// Endpoint to fetch answer key image based on student ID and testID
app.get('/api/answer/:studentId/:testId', async (req, res) => {
  const studentId = parseInt(req.params.studentId);
  const testId = parseInt(req.params.testId);
  try {
    console.log('Received studentId:', studentId);
    console.log('Received testId:', testId);

    if (isNaN(studentId) || isNaN(testId)) {
      throw new Error('Student ID or Test ID is not a number');
    }

    const query = 'SELECT answer_key_image FROM answer_sheets WHERE test_id = $1 AND student_id = $2';
    const { rows } = await pool.query(query, [testId, studentId]);
    if (rows.length === 0 || !rows[0].answer_key_image) {
      return res.status(404).send('Answer key image not found');
    }
    const answerKeyImage = rows[0].answer_key_image;
    res.setHeader('Content-Type', 'image/png'); // Set appropriate content type
    res.send(answerKeyImage);
  } catch (error) {
    console.error('Error fetching answer key image:', error);
    res.status(500).send('Error fetching answer key image');
  }
});




// Endpoint to fetch question paper based on test ID
app.get('/get-question-paper/:testId', async (req, res) => {
  const testId = req.params.testId;
  const language = req.query.language; // Get the desired language from the query parameters

  try {
    // Fetch question paper details including start date, end date, start time, and end time from the database
    const query = 'SELECT question_paper_image, start_date, end_date, start_time, end_time,language FROM tests WHERE test_id = $1';
    const { rows } = await pool.query(query, [testId]);
    
    if (rows.length === 0) {
      return res.status(404).send('Question paper not found');
    }
    
    const questionPaperImage = rows[0].question_paper_image;
    const startDate = new Date(rows[0].start_date);
    const endDate = new Date(rows[0].end_date);
    const startTime = new Date(rows[0].start_time);
    const endTime = new Date(rows[0].end_time);
    const testlanguage = rows[0].language;

    // Get the current date and time
    const currentDate = new Date();
    const currentTime = currentDate.getTime();

    // Check if the current date is within the date range
    if (currentDate < startDate || currentDate > endDate) {
      return res.status(403).send('The test is yet to start or already complete.');
    }

    // If the current date is equal to the start date, check if the current time is before the start time
    if (currentDate === startDate) {
      if (currentTime < startTime) {
        return res.status(403).send('The test is yet to start.');
      }
    }

    // If the current date is equal to the end date, check if the current time is after the end time
    if (currentDate === endDate) {
      if (currentTime > endTime) {
        return res.status(403).send('The test is already complete and cannot accept responses now.');
      }
    }

    // Extract text from the question paper image
    const questionPaperText = await extractTextFromImage(questionPaperImage);

    // Translate the extracted text to the desired language
    const translatedText = await translateText(questionPaperText,language);

    // Send the translated text as the response
    res.send(translatedText);
  } catch (err) {
    console.error('Error fetching question paper:', err);
    res.status(500).send('Error fetching question paper');
  }
});

// Endpoint to submit answer
app.post('/submit-answer', upload.single('answerFile'), async (req, res) => {
  const testId = req.body.testId;
  const studentId = req.body.studentId;
  const language = req.body.language;
  const answerFile = req.file;

  try {
      // Read the uploaded answer image file
      const answerImageData = fs.readFileSync(answerFile.path);
    
      // Extract text from the uploaded answer script
      const answerText = await extractTextFromImage(answerFile.path);
      // Translate text from Tamil to English if needed
      const translatedAnswer = language.toLowerCase() !== 'english' ? await translateToEnglish(answerText, language.toLowerCase()) : answerText;
    
      // Fetch the master answer key image data from the database based on test ID
      const query = 'SELECT answer_key_image FROM tests WHERE test_id = $1';
      const { rows } = await pool.query(query, [testId]);
      if (rows.length === 0 || !rows[0].answer_key_image) {
        return res.status(404).send('Master answer key not found');
      }
      const masterAnswerKeyImage = rows[0].answer_key_image;
    
      // Extract text from the master answer key image
      const masterAnswerText2 = await extractTextFromImage(masterAnswerKeyImage); // Assuming you have a function to extract text from an image
      const masterAnswerText = language.toLowerCase() !== 'english' ? await translateToEnglish(masterAnswerText2, language.toLowerCase()) : masterAnswerText2;

    
      // Calculate similarity between the uploaded answer and the master answer key
      const similarityScore = await calculateSimilarity(translatedAnswer, masterAnswerText); // Wait for the similarity score
    
      // Store the answer details in the database
      const insertQuery = 'INSERT INTO answer_sheets (test_id, language, answer_key_image, upload_date, student_id, score) VALUES ($1, $2, $3, $4, $5, $6)';
      await pool.query(insertQuery, [testId, language, answerImageData, new Date(), studentId, similarityScore]);
    
      // Send the similarity score to the client
      res.json({ similarityScore });
  } catch (error) {
      console.error('Error submitting answer:', error);
      res.status(500).send('Error submitting answer');
  }
});










// Signup route
app.post('/signup', (req, res) => {
  const { username, email, password, userType } = req.body;

  // Hash the password
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      return res.status(500).send('Error hashing password');
    }

    // Check if the username already exists in the corresponding table
    let query = '';
    if (userType === 'Student') {
      query = 'SELECT * FROM students WHERE name = $1';
    } else if (userType === 'Instructor') {
      query = 'SELECT * FROM teachers WHERE name = $1';
    } else {
      // Invalid user type
      return res.status(400).send('Invalid user type');
    }

    pool.query(query, [username], (err, result) => {
      if (err) {
        return console.error('Error executing query', err.stack);
      }

      if (result.rows.length > 0) {
        return res.status(409).send('Username already exists');
      } else {
        // Insert user into the appropriate table
        let insertQuery = '';
        if (userType === 'Student') {
          insertQuery = 'INSERT INTO students (name, email, password) VALUES ($1, $2, $3)';
        } else if (userType === 'Instructor') {
          insertQuery = 'INSERT INTO teachers (name, email, password) VALUES ($1, $2, $3)';
        }

        pool.query(insertQuery, [username, email, hash], (err, result) => {
          if (err) {
            return console.error('Error executing query', err.stack);
          }

          req.session.username = username;
          req.session.userType = userType;
          res.redirect('/profile');
        });
      }
    });
  });
});

// Profile route
app.get('/profile', (req, res) => {
  const { username, userType, imagePath } = req; // Assuming username, userType, and imagePath are extracted from the request

  if (userType === 'student') {
      res.redirect(`/studentprofile?username=${username}&imagePath=${imagePath}`);
  } else if (userType === 'instructor') {
      res.redirect(`/teacherprofile?username=${username}&imagePath=${imagePath}`);
  } else {
      // Handle other user types or invalid cases
      res.status(404).send('User type not recognized');
  }
});

// Redirect root URL to login page
app.get('/sp', (req, res) => {
  res.redirect('/studentprofile.html');
});


// Route for handling student profile form submission
app.post('/submit_student_profile', async (req, res) => {
const { name, specialization, institute, course, location } = req.body;

try {
  const client = await pool.connect();

  // Check if the student with the provided name exists
  const checkQuery = 'SELECT * FROM public.students WHERE name = $1';
  const { rows } = await client.query(checkQuery, [name]);

  if (rows.length === 0) {
    // If student does not exist, return an error
    return res.status(404).send('Student does not exist');
  }

  // Update the student's profile
  const updateQuery = `
    UPDATE public.students 
    SET specialization = $2, institute = $3, course = $4, location = $5 
    WHERE name = $1
  `;
  await client.query(updateQuery, [name, specialization, institute, course, location]);

  // Release the client back to the pool
  client.release();

  // Send a success response
  res.status(200).send('Student profile updated successfully!');
} catch (err) {
  console.error('Error executing query', err);
  res.status(500).send('Internal Server Error');
}
});


app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
