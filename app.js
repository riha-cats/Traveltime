require('dotenv').config();
const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const { constants } = require('crypto');
const helmet = require('helmet');
const DOMPurify = require('isomorphic-dompurify');

// 유틸쪽
const dongwon = require('./Utils/dongwon');
const { insertScore, getRankings } = require('./Utils/delayspeed');

// Env 세팅
const PORT = process.env.PORT || 443;
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || 'ssl/privkey.pem';
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || 'ssl/fullchain.pem';
const SSL_CA_PATH = process.env.SSL_CA_PATH || 'ssl/chain.pem';
const allowedIPs = process.env.ALLOWED_IPS?.split(',') || ['192.168.45.1', '127.0.0.1'];





// Express app 셋
const app = express();
app.set('trust proxy', true);


// 암호화 작업쪽
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));

// Body 파싱 & App use 부분
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));


// TLS 콘픽쪽
const sslOptions = {
  key: fs.readFileSync(SSL_KEY_PATH),
  cert: fs.readFileSync(SSL_CERT_PATH),
  ca: fs.readFileSync(SSL_CA_PATH),
  honorCipherOrder: true,
  secureOptions: 
    constants.SSL_OP_NO_SSLv2 |
    constants.SSL_OP_NO_SSLv3 |
    constants.SSL_OP_NO_TLSv1 |
    constants.SSL_OP_NO_TLSv1_1,
  ciphers: [
    'ECDHE-ECDSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-ECDSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'DHE-RSA-AES128-GCM-SHA256',
    'DHE-RSA-AES256-GCM-SHA384'
  ].join(':')
};

// 점검 미드웨어 
// 1/28/25 - 프록시 서버 문제 가능성 염두 + IPv6 형식만 처리하던 문제를 해결함.
const checkMaintenance = (req, res, next) => {
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
  const ipv4Address = clientIP.replace(/^::ffff:/, '');

  if(process.env.MAINTENANCE_MODE === 'true' && !allowedIPs.includes(ipv4Address)) {
    console.log(`[SECURITY] Maintenance access attempt from ${ipv4Address}`);
    return res.redirect('/maintenance');
  }
  next();
};


// 라우트
app.get('/', checkMaintenance, (req, res) => {
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
  console.log(`[ACCESS] Site accessed from ${clientIP}`);
  res.sendFile(path.resolve(__dirname, 'public', 'index', 'index.html'));
});

app.get('/maintenance', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'maintenance', 'maintenance.html'));
});

app.get('/dongwon', checkMaintenance, (req, res) => {
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
  console.log(`[ACCESS] Site accessed from ${clientIP}`);
  res.sendFile(path.resolve(__dirname, 'public', 'dongwon', 'dongwon.html'));
});

app.get('/delayspeed', checkMaintenance, (req, res) => {
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
  console.log(`[ACCESS] Site accessed from ${clientIP}`);
  res.sendFile(path.resolve(__dirname, 'public', 'delayspeed', 'delayspeed.html'));
});



// API
app.get('/api/delayrank', async (req, res) => {
  try {
      const rankings = await getRankings();
      res.json(rankings);
  } catch (error) {
      console.error(`[ERROR] /api/delayrank: ${error.message}`);
      res.status(500).json({ 
          success: false, 
          error: '랭킹을 불러올 수 없습니다.' 
      });
  }
});

app.get('/api/check-maintenance', (req, res) => {
  res.json({
    maintenance: process.env.MAINTENANCE_MODE === 'true',
    allowedIPs: process.env.ALLOWED_IPS?.split(',')
  });
});



// POST

// 동원
app.post('/comments', async (req, res) => {
  
  // Console log
  console.log(`[POST] Comment posted`);

  try {
    const sanitizedData = {
      nickname: DOMPurify.sanitize(req.body.nickname?.slice(0, 50)),
      comment: DOMPurify.sanitize(req.body.comment?.slice(0, 500))
    };

    if(!sanitizedData.nickname || !sanitizedData.comment) {
      return res.status(400).json({ success: false, error: 'Invalid input' });
    }

    const result = await dongwon.addComment(
      sanitizedData.nickname, 
      sanitizedData.comment
    );
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(`[ERROR] Comments: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: process.env.NODE_ENV === 'production' ? 'Server error' : error.message 
    });
  }
});

app.get('/comments', async (req, res) => {
  try {
    const comments = await dongwon.getComments();
    res.json(comments);
  } catch (error) {
    console.error(`[ERROR] Get Comments: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: process.env.NODE_ENV === 'production' ? 'Server error' : error.message 
    });
  }
});

// DelayTest
app.post('/upload/delayspeedtest', async (req, res) => {
  try {
      const sanitizedData = {
          nickname: DOMPurify.sanitize(req.body.nickname?.slice(0, 12)),
          average: parseFloat(req.body.average)
      };

      if (!sanitizedData.nickname || isNaN(sanitizedData.average)) {
          return res.status(400).json({ success: false, error: '잘못된 데이터 형식' });
      }

      await insertScore(sanitizedData.nickname, sanitizedData.average);
      res.json({ success: true });
  } catch (error) {
      console.error(`[ERROR] /upload/delayspeedtest: ${error.message}`);
      res.status(500).json({ 
          success: false, 
          error: '서버 오류 발생' 
      });
  }
});



// 에러 핸들링쪽 개선
// Prefix -> [CRITICAL]
app.use((err, req, res, next) => {
  console.error(`[CRITICAL] ${err.stack}`);
  res.status(500).sendFile(path.resolve(__dirname, 'public', '500', '500.html'));
});

app.use((req, res) => {
  res.status(404).sendFile(path.resolve(__dirname, 'public', '404', '404.html'));
});


// 서버 listen 쪽 (env 로 개선)
const server = https.createServer(sslOptions, app);
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Listening on https://${process.env.DOMAIN || 'localhost'}:${PORT}`);
});



// Dongwon.js 쪽 Socket.io 부분 (1/28/25)
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: "https://mcfriday.xyz",
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// 접속자 확인코드
let onlineUsers = 0;

io.on('connection', (socket) => {
  onlineUsers++;
  io.emit('userCount', onlineUsers);
  console.log(`[Socket] 연결: ${socket.id} (현재 사용자: ${onlineUsers})`);

  socket.on('disconnect', () => {
    onlineUsers--;
    io.emit('userCount', onlineUsers);
    console.log(`[Socket] 연결 해제: ${socket.id} (남은 사용자: ${onlineUsers})`);
  });
});







// App Moduel Export 쪽으로 변경.
// Server 쪽은 강의글 보다 실패 ㅎ;
module.exports = app;