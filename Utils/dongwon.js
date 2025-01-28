const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('comments.db');

// DB 초기화 쪽
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT NOT NULL,
    comment TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('[DB] 테이블 생성 오류:', err.message);
    } else {
      console.log('[DB] 테이블 준비 완료');
    }
  });
});

// 댓글 추가 (Promise 버전)
// 1/28/25 - 콜백방식에 변경 app.js 와 호환되지 않아 구조변경
const addComment = (nickname, comment) => {
  return new Promise((resolve, reject) => {
    if (!nickname?.trim() || !comment?.trim()) {
      reject(new Error('닉네임과 댓글을 입력해주세요'));
      return;
    }

    db.run(
      'INSERT INTO comments (nickname, comment) VALUES (?, ?)',
      [nickname.trim(), comment.trim()],
      function(err) {
        if (err) return reject(err);
        resolve({ id: this.lastID });
      }
    );
  });
};

// 댓글 조회 (Promise 버전)
const getComments = () => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM comments ORDER BY timestamp DESC',
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
};

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('[DB] 종료 오류:', err.message);
    } else {
      console.log('[DB] 안전하게 종료됨');
    }
    process.exit(0);
  });
});

module.exports = { addComment, getComments };


// 긴급 수정.
// Socket.io 부분을 app.js 로 이전 (1/28/25)