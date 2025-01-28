let reactionTimes = [];
let testCount = 0;
let isTesting = false;
let isReady = false;
let startTime;
let chart;
let timeoutId;


function updateCount() {
    document.getElementById('count').textContent = `[ ${testCount}/5 ]`;
}

document.addEventListener('DOMContentLoaded', () => {
    initializeTest();
    setupChart();
    updateCount();
});

function initializeTest() {
    const clickBox = document.querySelector('.click-box');
    clickBox.addEventListener('click', handleBoxClick);
    startCountdown();
    updateCount();
}

// 그래프는 나중에 추가
function setupChart() {
    const ctx = document.getElementById('responseChart').getContext('2d');
    
    if(chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '반응속도 (ms)',
                data: [],
                borderColor: '#2ed573',
                tension: 0.3,
                pointBackgroundColor: '#2ed573',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '밀리초(ms)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '시도 횟수'
                    }
                }
            }
        }
    });
    updateCount();
}

function startCountdown() {
    isTesting = true;
    isReady = false;
    const statusText = document.querySelector('.status-text');
    let count = 3;
    
    const countdownInterval = setInterval(() => {
        statusText.textContent = count > 0 
            ? `테스트 시작까지 ${count}초` 
            : "준비하세요!";
        count--;
        
        if (count < -1) {
            clearInterval(countdownInterval);
            prepareTest();
        }
    }, 1000);
}

function prepareTest() {
    const clickBox = document.querySelector('.click-box');
    const statusText = document.querySelector('.status-text');
    
    clickBox.classList.remove('ready', 'waiting');
    statusText.textContent = "준비 중...";
    isReady = false;

    if(timeoutId) clearTimeout(timeoutId);

    const delayTime = Math.random() * 3000 + 1000; 
    
    timeoutId = setTimeout(() => {
        isReady = true;
        clickBox.classList.add('ready', 'waiting');
        statusText.textContent = "클릭하세요!";
        startTime = Date.now();
    }, delayTime);
}

function handleBoxClick() {
    if (!isTesting) return;

    const clickBox = document.querySelector('.click-box');
    const statusText = document.querySelector('.status-text');

    if (!isReady) {
        statusText.textContent = "조기 클릭! 2초 후 재시작";
        clickBox.classList.add('error');
        resetTest();
        return;
    }

    // 정상 클릭 처리
    const reactionTime = Date.now() - startTime - 80;
    reactionTimes.push(reactionTime);
    testCount++;
    
    updateChart(reactionTime);
    clickBox.classList.remove('ready', 'waiting');
    statusText.textContent = `${reactionTime}ms`;

    if (testCount === 5) {
        showAverage();
        isTesting = false;
        testCount = 0;
    } else {
        setTimeout(prepareTest, 1500);
    }
    updateCount();
}

function updateChart(time) {
    if(chart && chart.data) {
        chart.data.labels.push(`시도 ${chart.data.labels.length + 1}`);
        chart.data.datasets[0].data.push(time);
        chart.update();
    }
    updateCount();
}

function showAverage() {
    const average = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
    const averageDisplay = average.toFixed(1);
    document.querySelector('.average-result').textContent = `평균 반응속도: ${averageDisplay}ms`;
    document.querySelector('.result-form').style.display = 'block';
    document.getElementById('submitScore').addEventListener('click', async () => {
        const nickname = document.getElementById('nicknameInput').value.trim();
        if (!nickname || nickname.length > 12) {
            alert('닉네임을 1~12자로 입력해주세요');
            return;
        }

        try {
            // 서버 결과 제출
            const response = await fetch('/upload/delayspeedtest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nickname: nickname,
                    average: averageDisplay
                })
            });

            if (!response.ok) throw new Error('제출 실패');
            
            // 랭킹 불러오기
            loadRankings();
        } catch (error) {
            console.error('제출 오류:', error);
            alert('기록 제출에 실패했습니다.');
        }
    });
}

// 랭크 로드쪽
async function loadRankings() {
    try {
        const response = await fetch('/api/delayrank');
        const rankings = await response.json();
        
        const rankingsHTML = rankings.map((entry, index) => 
            `<div class="rank-item">
                <span class="rank">${index + 1}위</span>
                <span class="nickname">${entry.nickname}</span>
                <span class="score">${entry.average}ms</span>
            </div>`
        ).join('');
        
        document.getElementById('rankings').innerHTML = rankingsHTML;
        document.getElementById('nicknameInput').style.display = `none`;
        document.getElementById('submitScore').style.display = `none`;
    } catch (error) {
        console.error('랭킹 로드 오류:', error);
    }
}


function resetTest() {
    isTesting = false;
    isReady = false;
    testCount = 0;
    reactionTimes = [];
    
    if(timeoutId) clearTimeout(timeoutId);
    
    setTimeout(() => {
        const clickBox = document.querySelector('.click-box');
        const statusText = document.querySelector('.status-text');
        
        document.querySelector('.average-result').textContent = '';
        statusText.textContent = "재시작 중...";
        clickBox.classList.remove('error');
        
        if(chart) {
            chart.data.labels = [];
            chart.data.datasets[0].data = [];
            chart.update();
        }
        
        startCountdown();
    }, 2000);
}

updateCount();