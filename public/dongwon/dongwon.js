// Timer
const timerElement = document.querySelector('#timer');
const millisecondsElement = document.querySelector('#millseconds');
const priceElement = document.querySelector('#timer-money');
const remainingPercentageElement = document.querySelector('#timer-percent'); 

// 푸룬 (4,050)
const pruneCountElement = document.querySelector('#timer-poru');

const initialPrice = 14000.00;
const initialDate = new Date(2025, 0, 12, 18, 0, 0, 0);
const targetDate = new Date(2025, 0, 31, 14, 00, 0, 0);

function updateTimer() {
    const now = new Date();
    const timeDiff = targetDate - now;

    if (timeDiff <= 0) {
        timerElement.textContent = "D-Day!";
        millisecondsElement.textContent = "";
        remainingPercentageElement.textContent = "0%";
        return;
    }

    const totalMilliseconds = targetDate - initialDate;
    const remainingPercentage = (timeDiff / totalMilliseconds) * 100;

    const totalHours = Math.floor(timeDiff / (1000 * 60 * 60));
    const hours = totalHours;
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    const milliseconds = timeDiff % 1000;

    const formattedTime = `${hours}시간 ${minutes}분 ${seconds}초`;
    timerElement.textContent = formattedTime;
    millisecondsElement.textContent = `.${String(milliseconds).padStart(3, '0')}`;
    remainingPercentageElement.textContent = remainingPercentage.toFixed(6) + "%";
    applyAnimation(timerElement);
}

// 애니메이션 적용쪽
// 근데 거의 사용하진 않을듯
function applyAnimation(element) {
    element.style.animation = 'fade-in-out 0.5s ease';
    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

// Unit
function formatPrice(price) {
    const priceStr = String(price);
    const decimalIndex = priceStr.indexOf('.');
    let integerPart = priceStr;
    let decimalPart = '';

    if (decimalIndex !== -1) {
        integerPart = priceStr.substring(0, decimalIndex);
        decimalPart = priceStr.substring(decimalIndex);
    }

    const len = integerPart.length;
    let formattedPrice = '';

    if (len <= 4) {
        formattedPrice = integerPart;
    } else if (len <= 8) {
        formattedPrice = integerPart.substring(0, len - 4) + '만 ' + integerPart.substring(len - 4);
    } else {
        formattedPrice = integerPart.substring(0, len - 8) + '억 ' + integerPart.substring(len - 8, len - 4) + '만 ' + integerPart.substring(len - 4);
    }

    return formattedPrice + decimalPart + '원';
}

// Unit 2 (기타용)
function formatNumberWithUnits(number) {
    const priceStr = String(number);
    const decimalIndex = priceStr.indexOf('.');
    let integerPart = priceStr;
    let decimalPart = '';

    if (decimalIndex !== -1) {
        integerPart = priceStr.substring(0, decimalIndex);
        decimalPart = priceStr.substring(decimalIndex);
    }

    const len = integerPart.length;
    let formattedPrice = '';

    if (len <= 4) {
        formattedPrice = integerPart;
    } else if (len <= 8) {
        formattedPrice = integerPart.substring(0, len - 4) + '만 ' + integerPart.substring(len - 4);
    } else {
        formattedPrice = integerPart.substring(0, len - 8) + '억 ' + integerPart.substring(len - 8, len - 4) + '만 ' + integerPart.substring(len - 4);
    }

    return formattedPrice + decimalPart;
}

// Price 부분 (4050 기준)
function updatePrice() {
    const now = new Date();
    const timeDiff = now - initialDate;
    const secondsDiff = Math.floor(timeDiff / 1000);
    const ratePerSecond = (initialPrice * (initialPrice * 0.00152) + (initialPrice * 1));
    const currentPrice = initialPrice + (ratePerSecond * secondsDiff);

    priceElement.textContent = formatPrice(currentPrice.toFixed(0));
    applyAnimation(priceElement);

    const pruneCount = Math.floor(currentPrice / 4050); // 푸룬주스 가격 (딥워터 기준)
    pruneCountElement.textContent = `${formatNumberWithUnits(pruneCount)}개`;
}

setInterval(() => {
    updateTimer();
    updatePrice();
}, 10);









// 댓글
const commentsContainer = document.getElementById('comments');
const nicknameInput = document.getElementById('nickname');
const commentInput = document.getElementById('comment');
const nicknameCounter = document.getElementById('nickname-counter');
const commentCounter = document.getElementById('comment-counter');

document.getElementById('add-comment-btn').addEventListener('click', addComment);


function addComment(){
    const nickname = nicknameInput.value;
    const comment = commentInput.value;

    if(nickname.trim() === "" || comment.trim() === ""){
        alert("닉네임과 댓글을 입력하세요");
        return;
    }

    console.log("addComment 함수 작동");
    fetch('/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nickname: nickname.trim().substring(0, 7),
            comment: comment.trim().substring(0, 125)
        })
    })    
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP 오류: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if(!data.success) throw new Error(data.error);
        getComments();
        commentInput.value = '';
    })
    .catch(error => {
        console.error('[!] 오류가 발생했습니다:', error);
        alert(`오류! 개발자에게 문의하세요: ${error.message}`);
    });

}

// Get Comments 부분.
function getComments(){
    console.log('%c비활성화 된 함수를 실행하셨습니다.', 'font-size: 16px; color: red; font-weight: 100;');
}



function displayComments(comments) {
    const commentsContainer = document.getElementById('comments');
    commentsContainer.innerHTML = '';

    comments.slice(0, 5).reverse().forEach(comment => {
        const commentDiv = document.createElement('div');
        commentDiv.classList.add('comment-box'); 

        const safeNickname = escapeHtml(comment.nickname);
        const safeComment = escapeHtml(comment.comment);


        commentDiv.innerHTML = `<strong>${safeNickname}:</strong> ${safeComment} <span class="comment-timestamp">(${comment.timestamp})</span>`;
        commentsContainer.appendChild(commentDiv);
    });
}



function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&")
         .replace(/</g, "<")
         .replace(/>/g, ">")
         .replace(/'/g, "'");
}

setInterval(() => {
    fetch('/comments')
        .then(response => response.json())
        .then(data => {
            displayComments(data);
        })
        .catch(error => {
            console.error('댓글 가져오기 오류:', error);
        });
}, 1000);

// 최초 실행쪽
getComments();


// 동원이가 자기가 귀엽다는데 조금 개가타용. 
const connectPlayerSpan = document.getElementById('connection');
const socket = io();

socket.on('userCount', (count) => {
    connectPlayerSpan.textContent = `접속자 ${count}명`;
});