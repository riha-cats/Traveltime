const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('comments.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the comments database.');
    db.run(
      `CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nickname TEXT NOT NULL,
        comment TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      (err) => {
        if (err) {
          console.error('[Dongwon.js] 코드 문제! -> ', err.message);
        } else {
          console.log('[Dongwon.js] 테이블이 이미 있거나 생성됨.');
        }
      }
    );
  }
});

// 댓글 추가 함수
const addComment = (nickname, comment, callback) => {
  if (!nickname || !comment) {
    return callback(new Error('[Dongwon.js] 옳지 않은 입력값: nickname, comment invaild'));
  }

  const stmt = db.prepare('INSERT INTO comments (nickname, comment) VALUES (?, ?)');
  stmt.run([nickname.trim(), comment.trim()], function (err) {
    if (err) {
      return callback(err);
    }
    console.log(`댓글이 추가되었습니다. comment ID: ${this.lastID}`);
    callback(null, { success: true, id: this.lastID });
  });
  stmt.finalize();
};

// 댓글 가져오기 함수
const getComments = (callback) => {
  db.all('SELECT * FROM comments ORDER BY timestamp DESC', [], (err, rows) => {
    if (err) {
      return callback(err);
    }
    callback(null, rows);
  });
};

// DB 종료 처리
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('[Dongwon.js] DB 종료 처리 (exit 0)');
    process.exit(0);
  });
});

// 접속자 관리 및 소켓 IO 설정
const io = require('socket.io')(require('../app'));
let onlineUsers = 0;

io.on('connection', (socket) => {
  onlineUsers++;
  io.emit('userCount', onlineUsers);
  console.log('[소켓] 유저가 접속했습니다 - ', onlineUsers);

  socket.on('disconnect', () => {
    onlineUsers--;
    io.emit('userCount', onlineUsers);
    console.log('[소켓] 유저가 접속 해제했습니다 - ', onlineUsers);
  });
});

module.exports = { addComment, getComments };
