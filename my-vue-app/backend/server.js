const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

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
  status TEXT
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

      for (const row of fileRows) {
        if (!row['Incident ID']) {
          console.error('Missing Incident ID in row:', row);
          continue;
        }

        db.run(`INSERT OR IGNORE INTO srs (
          incident_id, incident_type, customer_name, customer_division, description, owned_by_team, created_date_time, rfs_additional_cost, on_behalf_of, pending_reason, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
          row['Incident ID'],
          row['Incident Type'],
          row['Customer Display Name'],
          row['Customer Division'],
          row['Description'],
          row['Owned By Team'],
          row['Created Date Time'],
          row['RFS Additional Cost'],
          row['On Behalf of'] || '',
          row['Pending Reason'] || '',
          row['Status'] || ''
        ], (err) => {
          if (err) {
            console.error('Error inserting data:', err.message, 'Row:', row);
          } else {
            console.log('Successfully inserted row:', row['Incident ID']);
          }
        });
      }

      res.send('File uploaded and processed successfully');
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
      const itemCount = items.length;
      const hasHereItems = items.some(item => item.status === 'Here');

      const appointments = await new Promise((resolve, reject) => {
        db.all("SELECT * FROM appointments WHERE incident_id = ?", [sr.incident_id], (err, appointments) => {
          if (err) {
            reject(err);
          } else {
            resolve(appointments);
          }
        });
      });
      return { ...sr, items, appointments, itemCount, hasHereItems };
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

  db.run(`UPDATE items SET status = ? WHERE id = ?`, [status, id], function(err) {
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
  ], function(err) {
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
    res.json({ id: this.lastID });
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
        incident_id, incident_type, customer_name, customer_division, description, owned_by_team, created_date_time, rfs_additional_cost, on_behalf_of, pending_reason, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        sr.incident_id, sr.incident_type, sr.customer_name, sr.customer_division, sr.description,
        sr.owned_by_team, sr.created_date_time, sr.rfs_additional_cost, sr.on_behalf_of || '', sr.pending_reason || '', sr.status || ''
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