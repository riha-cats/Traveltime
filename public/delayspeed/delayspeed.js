let reactionTimes = [];
let testCount = 0;
let isTesting = false;
let isReady = false;
let startTime;
let chart;

document.addEventListener('DOMContentLoaded', () => {
    initializeTest();
    setupChart();
});

function initializeTest() {
    const clickBox = document.querySelector('.click-box');
    clickBox.addEventListener('click', handleBoxClick);
    startCountdown();
}

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
}

function startCountdown() {
    isTesting = true;
    const statusText = document.querySelector('.status-text');
    let count = 3;
    
    const countdownInterval = setInterval(() => {
        statusText.textContent = `테스트 시작까지 ${count}초`;
        count--;
        
        if (count < 0) {
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

    const delayTime = Math.random() * 2000 + 1000;
    
    setTimeout(() => {
        isReady = true;
        clickBox.classList.add('ready', 'waiting');
        statusText.textContent = "클릭하세요!";
        startTime = Date.now();
    }, delayTime);
}

function handleBoxClick() {
    if (!isTesting || !isReady) return;

    const clickBox = document.querySelector('.click-box');
    const statusText = document.querySelector('.status-text');
    
    if (clickBox.classList.contains('ready') && isReady) {
        const reactionTime = Date.now() - startTime - 75;
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
    } else {
        statusText.textContent = "조기 클릭! 다시 시작";
        resetTest();
    }
}

function updateChart(time) {
    if(chart && chart.data) {
        chart.data.labels.push(`시도 ${chart.data.labels.length + 1}`);
        chart.data.datasets[0].data.push(time);
        chart.update();
    }
}

function showAverage() {
    const average = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
    document.querySelector('.average-result').textContent = 
        `평균 반응속도: ${average.toFixed(1)}ms`;
    reactionTimes = [];
}

function resetTest() {
    isTesting = false;
    testCount = 0;
    reactionTimes = [];
    setTimeout(() => {
        document.querySelector('.average-result').textContent = '';
        chart.data.labels = [];
        chart.data.datasets[0].data = [];
        chart.update();
        startCountdown();
    }, 2000);
}