const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { spawn } = require('child_process');
const { OpenAI } = require('openai');



const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./srs.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});

db.run(`CREATE TABLE IF NOT EXISTS srs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id TEXT UNIQUE,
  incident_type TEXT,
  customer_name TEXT,
  customer_division TEXT,
  description TEXT,
  owned_by_team TEXT,
  created_date_time TEXT,
  rfs_additional_cost TEXT,
  on_behalf_of TEXT,
  pending_reason TEXT,
  status TEXT,
  location TEXT,
  archived INTEGER DEFAULT 0
)`);

db.run(`CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id TEXT,
  item_description TEXT,
  quantity INTEGER,
  status TEXT DEFAULT 'Not Here',
  FOREIGN KEY (incident_id) REFERENCES srs(incident_id)
)`);

db.run(`CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id TEXT,
  date TEXT,
  time TEXT,
  FOREIGN KEY (incident_id) REFERENCES srs(incident_id)
)`);

const upload = multer({ dest: 'uploads/' });
const openai = new OpenAI(api_key=process.env.OPENAI_API_KEY,);

app.post('/api/auto-populate-ai', async (req, res) => {
  const { requestId } = req.body;
  console.log('Generating AI Items For Request ID:', requestId);
  
  // Fetch the service request description from the database using the requestId
  db.get('SELECT description FROM srs WHERE incident_id = ?', [requestId], async (err, row) => {
    if (err) {
      return res.status(500).send('Error querying the database');
    }
    if (!row) {
      return res.status(404).send('Incident not found');
    }

    try {
      const prompt = `
      You are provided with a text description of a service request. The text contains details about the items or services requested and sometimes mentions the person on whose behalf the request is made.

      Your task:
      1. Extract the main items or services requested from the description.
      2. Extract the person on whose behalf the request is made, if mentioned.
      3. Output the information in a structured JSON format.

      Example Text:
      Ergotron Deep Keyboard Tray for Workfit (install item onto Workfit S Unit)\\nModel:97-897\\nEstimated price: $79.00\\nLink: Deep Keyboard Tray for WorkFit (ergotron.com)\\nErgotron Workfit S Dual Monitors\\nModel:33-349-200\\nEstimated price: $829.99\\nLink: Ergotron WorkFit-S Dual Monitor Stand, Up to 24" Monito

      Structured Format Output:
      {{
        "items": [
          "Ergotron Deep Keyboard Tray for Workfit (install item onto Workfit S Unit)",
          "Ergotron Workfit S Dual Monitors"
        ],
        "on_behalf_of": "Yin, Felicia"
      }}

      Process the following text:
      ${row.description}
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      if (response && response.choices && response.choices.length > 0) {
        const message = response.choices[0].message.content;
        const parsedResult = JSON.parse(message);

        // Save the parsed items to the database
        parsedResult.items.forEach(item => {
          db.run(`INSERT INTO items (incident_id, item_description, quantity) VALUES (?, ?, ?)`, [
            requestId, item, 1
          ], (err) => {
            if (err) {
              console.error('Error inserting item:', err.message, 'Item:', item);
            }
          });
        });
        // Update the "on behalf of" field if it exists
        if (parsedResult.on_behalf_of) {
          db.run(`UPDATE srs SET on_behalf_of = ? WHERE incident_id = ?`, [
            parsedResult.on_behalf_of, requestId
          ], (err) => {
            if (err) {
              console.error('Error updating on_behalf_of:', err.message);
            }
          });
        }

        return res.json(parsedResult);
      } else {
        throw new Error("Invalid response structure");
      }
    } catch (error) {
      console.error("Error parsing description:", error);
      res.status(500).send({ error: error.message });
    }
  });
});

app.post('/srs/:id/archive', (req, res) => {
  const { id } = req.params;
  db.run(`UPDATE srs SET archived = 1 WHERE incident_id = ?`, [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ archived: this.changes });
  });
});

app.post('/srs/:id/update', (req, res) => {
  const { id } = req.params;
  const { on_behalf_of, location } = req.body;

  const query = `
    UPDATE srs 
    SET 
      on_behalf_of = COALESCE(?, on_behalf_of),
      location = COALESCE(?, location)
    WHERE incident_id = ?
  `;
  const params = [on_behalf_of, location, id];

  db.run(query, params, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ updated: this.changes });
  });
});

app.delete('/items/:id', (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM items WHERE id = ?`, [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ deleted: this.changes });
  });
});

app.post('/upload', upload.single('file'), (req, res) => {
  const fileRows = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => {
      const trimmedRow = {};
      for (const key in row) {
        if (row.hasOwnProperty(key)) {
          const trimmedKey = key.trim().replace(/['"]/g, '');
          trimmedRow[trimmedKey] = row[key];
        }
      }
      fileRows.push(trimmedRow);
    })
    .on('end', () => {
      fs.unlinkSync(req.file.path);

      let pendingRequests = fileRows.length;

      fileRows.forEach(row => {
        if (!row['Incident ID']) {
          console.error('Missing Incident ID in row:', row);
          pendingRequests--;
          return;
        }

        db.run(`INSERT OR IGNORE INTO srs (
          incident_id, incident_type, customer_name, customer_division, description, owned_by_team, created_date_time, rfs_additional_cost, on_behalf_of, pending_reason, status, location
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
          row['Incident ID'],
          row['Incident Type'],
          row['Customer Display Name'],
          row['Customer Division'],
          row['Description'],
          row['Owned By Team'],
          row['Created Date Time'],
          row['RFS Additional Cost'],
          row['On Behalf Of'] || '',
          row['Pending Reason'] || '',
          row['Status'] || '',
          row['Location'] || ''
        ], function (err) {
          if (err) {
            console.error('Error inserting data:', err.message, 'Row:', row);
          } else {
            console.log('Successfully inserted row:', row['Incident ID']);
          }
          pendingRequests--;
          if (pendingRequests === 0) {
            res.send('File uploaded and processed successfully');
          }
        });
      });
    });
});

app.get('/srs', async (req, res) => {
  try {
    const srs = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM srs", [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    const srsWithItems = await Promise.all(srs.map(async (sr) => {
      const items = await new Promise((resolve, reject) => {
        db.all("SELECT * FROM items WHERE incident_id = ?", [sr.incident_id], (err, items) => {
          if (err) {
            reject(err);
          } else {
            resolve(items);
          }
        });
      });
      const appointments = await new Promise((resolve, reject) => {
        db.all("SELECT * FROM appointments WHERE incident_id = ?", [sr.incident_id], (err, appointments) => {
          if (err) {
            reject(err);
          } else {
            resolve(appointments);
          }
        });
      });
      return { ...sr, items, appointments };
    }));

    res.json(srsWithItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/items', (req, res) => {
  db.all(`SELECT * FROM items`, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/items/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.run(`UPDATE items SET status = ? WHERE id = ?`, [status, id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ updated: this.changes });
  });
});

app.post('/items', (req, res) => {
  const { incident_id, item_description, quantity } = req.body;

  db.run(`INSERT INTO items (incident_id, item_description, quantity) VALUES (?, ?, ?)`, [
    incident_id, item_description, quantity
  ], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID });
  });
});

app.get('/appointments', (req, res) => {
  db.all(`SELECT * FROM appointments`, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});


app.post('/appointments', (req, res) => {
  const { incident_id, date, time } = req.body;

  db.run(`INSERT INTO appointments (incident_id, date, time) VALUES (?, ?, ?)`, [
    incident_id, date, time
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id     : this.lastID });
  });
});

app.get('/export', (req, res) => {
  db.all(`SELECT * FROM srs`, [], (err, srsRows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    db.all(`SELECT * FROM items`, [], (err, itemRows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      db.all(`SELECT * FROM appointments`, [], (err, appointmentRows) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ srs: srsRows, items: itemRows, appointments: appointmentRows });
      });
    });
  });
});

app.post('/import', (req, res) => {
  const { srs, items, appointments } = req.body;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    srs.forEach(sr => {
      db.run(`INSERT OR IGNORE INTO srs (
        incident_id, incident_type, customer_name, customer_division, description, owned_by_team, created_date_time, rfs_additional_cost, on_behalf_of, pending_reason, status, location, archived
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        sr.incident_id, sr.incident_type, sr.customer_name, sr.customer_division, sr.description,
        sr.owned_by_team, sr.created_date_time, sr.rfs_additional_cost, sr.on_behalf_of || '', sr.pending_reason || '', sr.status || '', sr.location || '', sr.archived || 0
      ]);
    });
    items.forEach(item => {
      db.run(`INSERT OR IGNORE INTO items (
        incident_id, item_description, quantity, status
      ) VALUES (?, ?, ?, ?)`, [
        item.incident_id, item.item_description, item.quantity, item.status
      ]);
    });
    appointments.forEach(appointment => {
      db.run(`INSERT OR IGNORE INTO appointments (
        incident_id, date, time
      ) VALUES (?, ?, ?)`, [
        appointment.incident_id, appointment.date, appointment.time
      ]);
    });
    db.run('COMMIT', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.send('Data imported successfully');
      }
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
