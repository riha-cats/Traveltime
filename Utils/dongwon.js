// 동원이 카운트 다운 코드
const sqlite3 = require('sqlite3').verbose();
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
            console.log('테이블 추가 실패');
        }
    });
  }
});

const addComment = (nickname, comment, callback) => {
  const stmt = db.prepare('INSERT INTO comments (nickname, comment) VALUES (?, ?)');
  stmt.run(nickname, comment, function(err) {
    if (err) {
      return callback(err);
    }
    console.log(`댓글이 추가되었습니다. comment ID:  ${this.lastID}`);
    callback(null, { success: true });
  });
  stmt.finalize();
};


const getComments = (callback) => {
  db.all('SELECT * FROM comments ORDER BY timestamp DESC', [], (err, rows) => {
    callback(err, rows);
  });
};

// DB SIGINT
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('DB Connection 종료');
    process.exit(0);
  });
});

// 접속자 쪽 Socket IO
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