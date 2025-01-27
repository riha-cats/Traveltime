const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const bodyParser = require('body-parser');

// SSL 부분
const sslOptions = {
  key: fs.readFileSync('ssl/privkey.pem'),
  cert: fs.readFileSync('ssl/fullchain.pem'),
  ca: fs.readFileSync('ssl/chain.pem'),
  honorCipherOrder: true,
  secureOptions: require('constants').SSL_OP_NO_SSLv2 | require('constants').SSL_OP_NO_SSLv3 | require('constants').SSL_OP_NO_TLSv1 | require('constants').SSL_OP_NO_TLSv1_1,
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
  // DB 처리, Dongwon.js 로 옮겼
  require('./Utils/dongwon').addComment(req.body.nickname, req.body.comment, (err, result) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json({ success: true });
    }
  });
});

// API Comments Get 부분 (댓글 불러오기)
app.get('/comments', (req, res) => {
  require('./Utils/dongwon').getComments((err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json(rows);
    }
  });
});


// 서버 Listen 부분
server.listen(443, () => {
  console.log('Server running on https://mcfriday.xyz:443');
});

module.exports = server;