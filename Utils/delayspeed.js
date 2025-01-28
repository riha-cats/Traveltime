const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('delay.db');

// DB 초기화
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS delay_rank (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nickname TEXT NOT NULL,
        average REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('[DB] 테이블 생성 오류:', err.message);
        else console.log('[DB] 딜레이 랭킹 테이블 준비 완료');
    });
});

// 점수 저장 함수
const insertScore = (nickname, average) => {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO delay_rank (nickname, average) VALUES (?, ?)');
        stmt.run([nickname, average], function(err) {
            if (err) return reject(err);
            resolve(this.lastID);
        });
    });
};

// 랭킹 조회 함수
const getRankings = () => {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT nickname, average 
             FROM delay_rank 
             ORDER BY average ASC 
             LIMIT 10`,
            (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            }
        );
    });
};

process.on('SIGINT', () => {
    db.close();
});

module.exports = { insertScore, getRankings };