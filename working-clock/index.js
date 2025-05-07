let timerInterval;
let isTimerRunning = false;
let startTime;
let elapsedSeconds = 0;
let salaryPerSecond = 0;
let coinInterval;

function calculate() {
    // 获取输入值
    const monthlySalary = parseFloat(document.getElementById('monthlySalary').value);
    const workDays = parseInt(document.getElementById('workDays').value);
    const hoursPerDay = parseFloat(document.getElementById('hoursPerDay').value);
    
    // 验证输入
    if (isNaN(monthlySalary) || isNaN(workDays) || isNaN(hoursPerDay)) {
        alert('请填写所有必填字段！');
        return;
    }
    
    if (monthlySalary <= 0 || workDays <= 0 || hoursPerDay <= 0) {
        alert('所有输入值必须大于零！');
        return;
    }
    
    // 计算每分钟工资
    const totalWorkHours = workDays * hoursPerDay;
    const totalWorkMinutes = totalWorkHours * 60;
    const salaryPerMinute = monthlySalary / totalWorkMinutes;
    salaryPerSecond = salaryPerMinute / 60;
    
    // 计算喝一杯奶茶需要工作的分钟数
    const milkTeaPrice = 15; // 奶茶价格15元
    const minutesForMilkTea = milkTeaPrice / salaryPerMinute;
    
    // 显示结果
    document.getElementById('salaryPerMinute').textContent = salaryPerMinute.toFixed(2);
    document.getElementById('milkTeaTime').textContent = Math.ceil(minutesForMilkTea);
    document.getElementById('resultDisplay').style.display = 'block';
    document.getElementById('realTimeDisplay').style.display = 'block';
    document.getElementById('timer').style.display = 'flex';
    
    // 添加脉冲动画
    document.getElementById('realTimeDisplay').classList.add('pulse');
    
    // 重置并启动计时器
    resetTimer();
    startTimer();
    
    // 启动金币动画
    startCoinAnimation();
}

function startTimer() {
    if (!isTimerRunning) {
        startTime = new Date().getTime() - (elapsedSeconds * 1000);
        timerInterval = setInterval(updateTimer, 100); // 每0.1秒更新一次
        isTimerRunning = true;
        document.getElementById('timerButton').innerHTML = '<i class="fas fa-pause"></i> 暂停计时';
    }
}

function pauseTimer() {
    if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        document.getElementById('timerButton').innerHTML = '<i class="fas fa-play"></i> 继续计时';
    }
}

function resetTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    if (coinInterval) {
        clearInterval(coinInterval);
    }
    elapsedSeconds = 0;
    document.getElementById('currentSalary').textContent = '0.00';
    isTimerRunning = false;
    
    // 清除所有金币
    const coinContainer = document.getElementById('coinContainer');
    while (coinContainer.firstChild) {
        coinContainer.removeChild(coinContainer.firstChild);
    }
}

function resetTimerAndCalculate() {
    resetTimer();
    document.getElementById('timerButton').innerHTML = '<i class="fas fa-pause"></i> 暂停计时';
    startTimer();
    startCoinAnimation();
}

function toggleTimer() {
    if (isTimerRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function updateTimer() {
    const currentTime = new Date().getTime();
    elapsedSeconds = (currentTime - startTime) / 1000;
    const earnedSalary = elapsedSeconds * salaryPerSecond;
    document.getElementById('currentSalary').textContent = earnedSalary.toFixed(2);
}

function startCoinAnimation() {
    const coinContainer = document.getElementById('coinContainer');
    
    // 创建金币下落动画
    coinInterval = setInterval(() => {
        if (isTimerRunning) {
            createCoin(coinContainer);
        }
    }, 800);
}

function createCoin(container) {
    const coin = document.createElement('div');
    coin.className = 'coin';
    
    // 随机位置
    const left = Math.random() * 100;
    const size = Math.random() * 8 + 12; // 12-20px
    const duration = Math.random() * 2 + 3; // 3-5秒
    const delay = Math.random() * 2;
    
    coin.style.left = `${left}%`;
    coin.style.width = `${size}px`;
    coin.style.height = `${size}px`;
    coin.style.animationDuration = `${duration}s`;
    coin.style.animationDelay = `${delay}s`;
    
    container.appendChild(coin);
    
    // 动画结束后移除金币
    setTimeout(() => {
        if (container.contains(coin)) {
            container.removeChild(coin);
        }
    }, (duration + delay) * 1000);
}

// 添加金币下落动画
document.styleSheets[0].insertRule(`
    @keyframes fallCoin {
        0% {
            top: -20px;
            opacity: 0;
            transform: translateY(0) rotate(0deg);
        }
        10% {
            opacity: 1;
        }
        90% {
            opacity: 1;
        }
        100% {
            top: 100%;
            opacity: 0;
            transform: translateY(0) rotate(360deg);
        }
    }
`, document.styleSheets[0].cssRules.length);

// 为输入框添加焦点效果
const inputs = document.querySelectorAll('input');
inputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.parentNode.querySelector('.input-icon').style.color = 'var(--primary-dark)';
    });
    
    input.addEventListener('blur', function() {
        this.parentNode.querySelector('.input-icon').style.color = 'var(--primary)';
    });
});