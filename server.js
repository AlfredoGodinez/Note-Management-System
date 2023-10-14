const express = require("express");
const app = express();
const bodyParser = require("body-parser");

// Import and initialize Knex using knexfile.js
const knexConfig = require('./knexfile');
const knex = require('knex')(knexConfig.development);
const db = require('knex')(knexConfig.production);

async function initializeDatabase() {
  try {
    // Check if the "db_nms" database exists
    const databaseExists = await knex.schema.raw("SELECT datname FROM pg_database WHERE datname = 'db_nms'");

    if (!databaseExists.rows.length) {
      // If the database does not exist, create it.
      await knex.schema.raw('CREATE DATABASE db_nms');
      console.log("Successfully created database");
      
      // Run the migrations
      await db.migrate.latest();
      console.log("Migrations completed.");
    } else {
      console.log("Database (db_nms) already exists. Skipping database creation and migrations.");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

initializeDatabase();


// Middleware for parsing JSON requests
app.use(express.json());


// POST /notes - Create a new note.
app.post('/notes', (req, res) => {
    const { textTitle, textContent } = req.body;
    console.log(req.body);

    if (!textTitle || !textContent) {
      res.status(400).json({ message: "Title and content are required to create a note." });
      return;
    }

    db('note')
      .insert({
        title: textTitle,
        content: textContent
    })
      .returning("*")
      .then(_ => {
        res.redirect("/");
      })
      .catch(err => {
        console.error(err);
        res.status(400).json({ message: "Unable to create a new note" });
      });
});


// GET /notes - Retrieve a list of all notes.
app.get('/', (req, res) => {
    db.select("title", "content").from("note")
      .then(data => {
        res.json(data);
      })
      .catch(err => res.status(400).json(err));
});


// GET /notes/:id - Retrieve a specific note by its ID.
app.get('/notes/:uuid', (req, res) => {
    const noteUUID = req.params.uuid;
  
    // Query the database to get the note by its UUID
    db.select("title", "content").from('note')
      .where({ id: noteUUID })
      .then(data => {
        if (data.length === 0) {
          res.status(404).json({ message: "Note not found" });
        } else {
          res.json(data[0]);
        }
      })
      .catch(err => {
        res.status(500).json({ message: "Database error" });
      });
});
  
  

// PUT /notes/:id - Update a specific note by its ID.
app.put('/notes/:uuid', (req, res) => {
    const noteUUID = req.params.uuid;
    const { textTitle, textContent } = req.body;
  
    // Check if title and content are provided
    if (!textTitle || !textContent) {
      return res.status(400).json({ message: "Title and content are required to update the note." });
    }
  
    // Update the note in the database
    db('note')
      .where({ id: noteUUID })
      .update({
        title: textTitle,
        content: textContent,
        updated_at: db.raw('NOW()')
      })
      .returning("*")
      .then(updatedNote => {
        if (updatedNote.length === 0) {
          // If the note with the provided UUID was not found
          res.status(404).json({ message: "Note not found." });
        } else {
          res.status(200).json(updatedNote[0]);
        }
      })
      .catch(err => {
        res.status(500).json({ message: "Error updating note." });
      });
});
  

// DELETE /notes/:uuid - Delete a specific note by its ID
app.delete('/notes/:uuid', (req, res) => {
    
    // Get the UUID of the URL parameters note
    const noteUUID = req.params.uuid;
  
    // Delete in database
    db('note')
      .where({ id: noteUUID })
      .del()
      .then(deletedCount => {
        if (deletedCount === 0) {
          res.status(404).json({ message: "Note not found." });
        } else {
          res.json({ message: "Note successfully deleted." });
        }
      })
      .catch(err => {
        res.status(500).json({ message: "Database error." });
      });
});

app.listen(3000, () => console.log("Application is running on port 3000."));