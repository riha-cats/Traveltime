const express = require('express');
const path = require('path');
const https = require('https');
const constants = require('constants');
const fs = require('fs');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

// SSL 부분
const sslOptions = {
  key: fs.readFileSync('ssl/privkey.pem'),
  cert: fs.readFileSync('ssl/fullchain.pem'),
  ca: fs.readFileSync('ssl/chain.pem'),
  honorCipherOrder: true,
  secureOptions: constants.SSL_OP_NO_SSLv2 | constants.SSL_OP_NO_SSLv3 | constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1,
  ciphers: [
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-ECDSA-AES256-GCM-SHA384',
      'ECDHE-ECDSA-AES128-GCM-SHA256',
      'DHE-RSA-AES256-GCM-SHA384',
      'DHE-RSA-AES128-GCM-SHA256',
      'AES128-GCM-SHA256',
      'AES256-GCM-SHA384'
  ].join(':')
};

// 댓글 DB
const db = new sqlite3.Database('comments.db', (err) => {
  if (err) {
      console.error(err.message);
  } else {
      console.log('Connected to the comments database.');
      db.run(`CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nickname TEXT NOT NULL,
          comment TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
          if (err) {
              console.error(err.message);
          } else {
              console.log('Table comments created or already exists.');
          }
      });
  }
});



// Express 부분
const app = express();
const server = https.createServer(sslOptions, app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));
  

// Get
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index/index.html');
});


// API Comments 부분
app.post('/comments', (req, res) => {
  const stmt = db.prepare('INSERT INTO comments (nickname, comment) VALUES (?, ?)');
  stmt.run(req.body.nickname, req.body.comment, function(err) {
      if (err) {
          console.error(err.message);
          res.status(500).json({ success: false, error: err.message });
      } else {
          console.log(`A row has been inserted with rowid ${this.lastID}`);
          res.json({ success: true });
      }
  });
  stmt.finalize();
});

// API Comments Get 부분 (댓글 불러오기)
// 클라 쪽에서 불러오기 제한 할꺼임.
app.get('/comments', (req, res) => {
  db.all('SELECT * FROM comments ORDER BY timestamp DESC', [], (err, rows) => {
      if (err) {
          console.error(err.message);
          res.status(500).json({ success: false, error: err.message });
      } else {
          res.json(rows);
      }
  });
});


// DB SIGINT
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Close the database connection.');
    process.exit(0);
  });
});


// 접속자 쪽 Socket IO
const io = require('socket.io')(server);
let onlineUsers = 0;

io.on('connection', (socket) => {
  onlineUsers++;
  io.emit('userCount', onlineUsers);
  console.log('user connected:', onlineUsers);

  socket.on('disconnect', () => {
    onlineUsers--;
    io.emit('userCount', onlineUsers);
    console.log('user disconnected:', onlineUsers);
  });
});



// 서버 Listen 부분
server.listen(443, () => {
  console.log('Server running on https://mcfriday.xyz:443');
});