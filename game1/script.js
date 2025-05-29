// --- DOM Elements ---
const levelTitleEl = document.getElementById('level-title');
const timerEl = document.getElementById('timer');
const levelIntroEl = document.getElementById('level-intro');
const sceneTitleEl = document.getElementById('scene-title');
const characterPoolEl = document.getElementById('character-pool');
const selectedCharsEl = document.getElementById('selected-characters');
const charSlots = selectedCharsEl.querySelectorAll('.char-slot');
const submitButton = document.getElementById('submit-idiom'); // 如果使用提交按钮
const sceneImageContainer = document.getElementById('scene-image-container');
const sceneImageEl = document.getElementById('scene-image');
const messageAreaEl = document.getElementById('message-area');
const retryButton = document.getElementById('retry-button');
const nextLevelButton = document.getElementById('next-level-button');
const gameArea = document.getElementById('game-area'); // 主游戏区域，用于整体显隐控制

// --- Game State ---
let currentLevelIndex = 0;
let currentSceneIndex = 0;
let selectedChars = [];
let timeLeft = 0;
let timerInterval = null;
let currentLevelData = null;

// --- Game Logic Functions ---

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `时间剩余: ${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function startTimer(duration) {
    stopTimer(); // Clear any existing timer
    timeLeft = duration;
    timerEl.textContent = formatTime(timeLeft);
    timerEl.classList.remove('low-time');

    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = formatTime(timeLeft);
        if (timeLeft <= 30) { // 进入低时间警告
            timerEl.classList.add('low-time');
        }
        if (timeLeft <= 0) {
            handleTimeout();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function updateMessage(text, type = 'info') { // type: 'info', 'success', 'error'
    messageAreaEl.textContent = text;
    messageAreaEl.className = ''; // Reset class
    if (type) {
        messageAreaEl.classList.add(type);
    }
}

function renderCharacterPool(characters) {
    characterPoolEl.innerHTML = ''; // Clear previous characters
    characters.forEach(char => {
        const button = document.createElement('button');
        button.textContent = char;
        button.classList.add('char-button');
        button.dataset.char = char; // Store char in data attribute
        button.addEventListener('click', handleCharacterClick);
        characterPoolEl.appendChild(button);
    });
}

function updateSelectedDisplay() {
    charSlots.forEach((slot, index) => {
        if (selectedChars[index]) {
            slot.textContent = selectedChars[index];
            slot.classList.add('filled');
        } else {
            slot.textContent = '□';
            slot.classList.remove('filled');
        }
    });
    // 控制提交按钮状态（如果使用的话）
    // submitButton.disabled = selectedChars.length !== 4;
}

function handleCharacterClick(event) {
    const clickedButton = event.target;
    const char = clickedButton.dataset.char;

    if (selectedChars.length < 4 && !clickedButton.classList.contains('selected')) {
        // Select character
        selectedChars.push(char);
        clickedButton.classList.add('selected');
        updateSelectedDisplay();

        // Auto-submit when 4 characters are selected
        if (selectedChars.length === 4) {
             // Disable further clicks temporarily
            disableCharacterPool();
            setTimeout(checkIdiom, 300); // Short delay for visual feedback
        }
    }
    // Optional: Allow deselection by clicking again (more complex state management needed)
}

function disableCharacterPool(disabled = true) {
    const buttons = characterPoolEl.querySelectorAll('.char-button');
    buttons.forEach(button => {
        if(!button.classList.contains('disabled')) { // Don't re-enable already used chars
             button.disabled = disabled;
        }
    });
}

function checkIdiom() {
    const currentScene = currentLevelData.scenes[currentSceneIndex];
    const selectedIdiom = selectedChars.join('');

    if (selectedIdiom === currentScene.idiom) {
        // Correct Idiom
        updateMessage(`正确！"${currentScene.idiom}"，修复成功！`, 'success');
        sceneImageEl.src = currentScene.image;
        sceneImageEl.alt = currentScene.idiom;
        sceneImageEl.style.display = 'block';

        // Mark used characters as disabled permanently for this level
        markUsedCharacters(selectedChars);

        selectedChars = []; // Reset selection
        currentSceneIndex++;

        if (currentSceneIndex < currentLevelData.scenes.length) {
            // Move to next scene
             setTimeout(() => {
                 setupScene(currentSceneIndex);
                 enableCharacterPool(); // Re-enable for next selection
             }, 1500); // Delay to show image and message
        } else {
            // Level Complete
            handleLevelComplete();
        }
    } else {
        // Incorrect Idiom
        updateMessage('错误！历史时空错乱，请重试。', 'error');
        // Reset selection visuals and allow re-selection
        const buttons = characterPoolEl.querySelectorAll('.char-button');
        buttons.forEach(button => {
            if (button.classList.contains('selected')) {
                 button.classList.remove('selected');
            }
        });
        selectedChars = [];
        updateSelectedDisplay();
        enableCharacterPool(); // Re-enable pool for retry
    }
}

function markUsedCharacters(charsToMark) {
     const buttons = characterPoolEl.querySelectorAll('.char-button');
     buttons.forEach(button => {
         if (charsToMark.includes(button.dataset.char) && button.classList.contains('selected')) {
             button.classList.remove('selected'); // Remove temporary selection style
             button.classList.add('disabled'); // Add permanent disabled style
             button.disabled = true; // Disable the button
         }
     });
}

function enableCharacterPool() {
     const buttons = characterPoolEl.querySelectorAll('.char-button:not(.disabled)'); // Only enable non-used chars
     buttons.forEach(button => button.disabled = false);
}


function setupScene(sceneIndex) {
    const scene = currentLevelData.scenes[sceneIndex];
    sceneTitleEl.textContent = `场景 ${scene.id}`;
    updateMessage(scene.hint || `请从下方选择四个字组成场景 ${scene.id} 的成语。`, 'info'); // Show hint or default message
    sceneImageEl.style.display = 'none'; // Hide image for the new scene
    updateSelectedDisplay(); // Ensure selection slots are empty
}

function loadLevel(levelIndex) {
    if (levelIndex >= gameData.length) {
        // All levels completed
        gameArea.innerHTML = '<h1>恭喜！你已成功修复所有时空！</h1>';
        stopTimer();
        timerEl.style.display = 'none';
        retryButton.style.display = 'none';
        nextLevelButton.style.display = 'none';
        return;
    }

    currentLevelData = gameData[levelIndex];
    currentSceneIndex = 0;
    selectedChars = [];

    // Update UI for the new level
    levelTitleEl.textContent = currentLevelData.title;
    levelIntroEl.textContent = currentLevelData.intro;
    timerEl.style.display = 'block'; // Show timer
    renderCharacterPool(currentLevelData.characters);
    enableCharacterPool();
    setupScene(currentSceneIndex); // Setup the first scene

    // Reset buttons
    retryButton.style.display = 'none';
    nextLevelButton.style.display = 'none';
    gameArea.classList.remove('hidden'); // Ensure game area is visible

    // Start timer for the level
    startTimer(currentLevelData.timeLimit);
}

function handleTimeout() {
    stopTimer();
    updateMessage('时间耗尽，历史崩塌！', 'error');
    disableCharacterPool(); // Disable input
    retryButton.style.display = 'inline-block'; // Show retry button
    nextLevelButton.style.display = 'none';
    sceneImageEl.style.display = 'none'; // Hide any scene image
}

function handleLevelComplete() {
    stopTimer();
    updateMessage(`恭喜！${currentLevelData.title} 已成功修复！`, 'success');
    disableCharacterPool(); // Disable further interaction for this level
    retryButton.style.display = 'none';

    if (currentLevelIndex < gameData.length - 1) {
        nextLevelButton.style.display = 'inline-block'; // Show next level button
    } else {
        // Last level completed
        updateMessage('太棒了！你已修复所有成语时空！游戏通关！', 'success');
        // Optionally add a final congratulatory message or element
    }
}

function retryCurrentLevel() {
    loadLevel(currentLevelIndex); // Reload the current level
}

function loadNextLevel() {
     // Simulate "new page" by hiding current content briefly
    gameArea.classList.add('hidden');
    updateMessage(''); // Clear messages
    // Small delay to make the transition noticeable
    setTimeout(() => {
       currentLevelIndex++;
       loadLevel(currentLevelIndex);
       // No need to remove 'hidden' here, loadLevel shows the gameArea
    }, 300);
}

// --- Event Listeners ---
retryButton.addEventListener('click', retryCurrentLevel);
nextLevelButton.addEventListener('click', loadNextLevel);
// submitButton.addEventListener('click', checkIdiom); // If using manual submit

// --- Initial Game Load ---
loadLevel(currentLevelIndex); // Start the first level