const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const bodyParser = require('body-parser');

// IP 변수부분
const allowedIPs = ['192.168.45.1', '127.0.0.1', '::ffff:127.0.0.1', '::1'];

// 점검 변수 부분
const maintenance = false;

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
  const clientIP = req.ip;
  const ipv4Address = clientIP.match(/::ffff:(\d+\.\d+\.\d+\.\d+)/);
  const ipAddress = ipv4Address ? ipv4Address[1] : clientIP;

  if (maintenance !== true) {
    console.log("[!] 사이트 접속! : IP : " + clientIP);
    res.sendFile(__dirname + '/public/index/index.html');
  } else {
    if (!allowedIPs.includes(ipAddress)) {
      console.log("[!] 사이트 점검으로 Maintenance 로 이동 : " + clientIP);
      res.redirect('/maintenance');
    } else {
      console.log("[!] 사이트 점검이나 내부 IP : " + clientIP);
      res.sendFile(__dirname + '/public/index/index.html');
    }
  }
});

app.get('/maintenance', (req, res) => {
  res.sendFile(__dirname + '/public/maintenance/maintenance.html');
});

app.get('/dongwon', (req, res) => {
  res.sendFile(__dirname + '/public/dongwon/dongwon.html');
});













// API Post
// 댓글 업로드 부분
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
// 댓글 불러오기
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