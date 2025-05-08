// --- DOM Element References (Keep as is) ---
const imageLoader = document.getElementById('imageLoader');
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const undoButton = document.getElementById('undoAnnotation');
const clearButton = document.getElementById('clearAnnotations');
const saveImageButton = document.getElementById('saveImage');
const fullscreenViewButton = document.getElementById('fullscreenView');

const distanceModal = document.getElementById('distanceModal');
const distanceInput = document.getElementById('distanceInput');
const submitDistanceButton = document.getElementById('submitDistance');
const cancelDistanceButton = document.getElementById('cancelDistance');

const fullscreenOverlay = document.getElementById('fullscreenOverlay');
const fullscreenImage = document.getElementById('fullscreenImage');
const closeFullscreenButton = document.getElementById('closeFullscreen');

// --- Global State Variables (Keep as is) ---
let currentImage = null;
let annotations = [];
let drawing = false;
let startPoint = { x: 0, y: 0 };
let tempEndPoint = { x: 0, y: 0 };
let resolveDistancePromise = null;

// --- Annotation Style Constants (Keep as is) ---
const ANNOTATION_COLOR = '#FFC107';
const ANNOTATION_TEXT_OUTLINE_COLOR = 'rgba(0, 0, 0, 0.75)';
const TEMP_ANNOTATION_COLOR = 'rgba(255, 100, 0, 0.8)';

// --- Image Loading and Canvas Sizing ---
imageLoader.addEventListener('change', handleImage);
function handleImage(e) {
    const reader = new FileReader();
    reader.onload = function(event) {
        currentImage = new Image();
        currentImage.onload = function() {
            setCanvasSize();
            annotations = [];
            redrawCanvas();
        }
        currentImage.onerror = function() {
            alert("图片加载失败，请检查文件格式或路径。");
            currentImage = null;
            drawInitialMessage();
        }
        currentImage.src = event.target.result;
    }
    if (e.target.files[0]) {
        reader.readAsDataURL(e.target.files[0]);
    } else {
        currentImage = null;
        drawInitialMessage();
    }
}

function setCanvasSize() {
    if (!currentImage || !currentImage.complete || currentImage.naturalWidth === 0) {
        canvas.width = canvas.parentElement.clientWidth || 300;
        canvas.height = 200;
        drawInitialMessage();
        return;
    }

    const wrapper = canvas.parentElement;
    const MAX_WIDTH = wrapper.clientWidth;

    const headerHeight = document.querySelector('.app-header')?.offsetHeight || 50;
    const infoBarHeight = document.querySelector('.info-bar')?.offsetHeight || 30;
    const containerVPadding = 20; // Combined body/app-container top/bottom padding
    const buffer = 20; // Extra buffer
    const MAX_CANVAS_HEIGHT = Math.max(100, window.innerHeight - headerHeight - infoBarHeight - containerVPadding - buffer);

    let newWidth, newHeight;
    const aspectRatio = currentImage.naturalWidth / currentImage.naturalHeight;

    if (currentImage.naturalWidth <= MAX_WIDTH && currentImage.naturalHeight <= MAX_CANVAS_HEIGHT) {
        newWidth = currentImage.naturalWidth;
        newHeight = currentImage.naturalHeight;
    } else {
        if (MAX_WIDTH / aspectRatio <= MAX_CANVAS_HEIGHT) {
            newWidth = MAX_WIDTH;
            newHeight = MAX_WIDTH / aspectRatio;
        } else {
            newHeight = MAX_CANVAS_HEIGHT;
            newWidth = MAX_CANVAS_HEIGHT * aspectRatio;
        }
    }
    canvas.width = newWidth;
    canvas.height = newHeight;
}

// --- Drawing Logic ---
canvas.addEventListener('mousedown', handleDrawStart);
canvas.addEventListener('mousemove', handleDrawMove);
canvas.addEventListener('mouseup', handleDrawEnd);
canvas.addEventListener('mouseleave', handleDrawLeave);

canvas.addEventListener('touchstart', (e) => {
    if (fullscreenOverlay.style.display === 'flex') return;
    e.preventDefault();
    handleDrawStart(getTouchPos(e, canvas));
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    if (fullscreenOverlay.style.display === 'flex') return;
    e.preventDefault();
    handleDrawMove(getTouchPos(e, canvas));
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    if (fullscreenOverlay.style.display === 'flex') return;
    e.preventDefault();
    handleDrawEnd(getTouchPos(e, canvas));
}, { passive: false });


function getCanvasCoordinates(event, canvasElement) {
    const rect = canvasElement.getBoundingClientRect();
    let x, y;
    if (event.clientX !== undefined) {
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
    } else if (event.x !== undefined && event.y !== undefined) {
        x = event.x;
        y = event.y;
    } else {
        return { x: 0, y: 0 };
    }
    return {
        x: Math.max(0, Math.min(x, canvasElement.width)),
        y: Math.max(0, Math.min(y, canvasElement.height))
    };
}

function getTouchPos(touchEvent, canvasElement) {
    const rect = canvasElement.getBoundingClientRect();
    let touch;
    if (touchEvent.touches && touchEvent.touches.length > 0) {
        touch = touchEvent.touches[0];
    } else if (touchEvent.changedTouches && touchEvent.changedTouches.length > 0) {
        touch = touchEvent.changedTouches[0];
    } else {
        return touchEvent;
    }
    return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    };
}


function handleDrawStart(event) {
    if (!currentImage || distanceModal.style.display === 'flex' || fullscreenOverlay.style.display === 'flex') return;
    drawing = true;
    startPoint = getCanvasCoordinates(event, canvas);
    tempEndPoint = { ...startPoint };
}

function handleDrawMove(event) {
    if (!drawing || !currentImage || fullscreenOverlay.style.display === 'flex') return;
    tempEndPoint = getCanvasCoordinates(event, canvas);
    redrawCanvas(); // Redraws base image and existing annotations

    // Draw temporary feedback line
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(tempEndPoint.x, tempEndPoint.y);
    ctx.strokeStyle = TEMP_ANNOTATION_COLOR;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 2]);
    ctx.stroke();
    ctx.setLineDash([]);

    drawArrowhead(ctx, startPoint, tempEndPoint, TEMP_ANNOTATION_COLOR, 2.5, 8);
    drawArrowhead(ctx, tempEndPoint, startPoint, TEMP_ANNOTATION_COLOR, 2.5, 8);
}

function handleDrawLeave(event) {
    if (drawing && fullscreenOverlay.style.display !== 'flex') {
        drawing = false;
        redrawCanvas(); // Clear temporary line
    }
}

async function handleDrawEnd(event) {
    if (!drawing || !currentImage || fullscreenOverlay.style.display === 'flex') return;
    drawing = false;
    const endPoint = getCanvasCoordinates(event, canvas);

    const lineLength = Math.sqrt(Math.pow(startPoint.x - endPoint.x, 2) + Math.pow(startPoint.y - endPoint.y, 2));
    if (lineLength < 8) { // Minimum distance threshold
        redrawCanvas(); // Clear any temporary line
        return;
    }

    try {
        const distanceText = await getDistanceViaModal();
        if (distanceText && distanceText.trim() !== "") {
            annotations.push({
                start: { ...startPoint },
                end: { ...endPoint },
                text: distanceText.trim()
            });
        }
    } catch (error) {
        // Modal was cancelled or closed
        console.log("Distance input aborted:", error);
    } finally {
        redrawCanvas();
    }
}

// --- Modal Logic for Distance Input ---
function getDistanceViaModal() {
    distanceModal.style.display = 'flex';
    distanceInput.value = '';
    distanceInput.focus();

    return new Promise((resolve, reject) => {
        resolveDistancePromise = { resolve, reject };
    });
}

submitDistanceButton.addEventListener('click', () => {
    if (resolveDistancePromise) {
        resolveDistancePromise.resolve(distanceInput.value);
        resolveDistancePromise = null;
    }
    distanceModal.style.display = 'none';
});

cancelDistanceButton.addEventListener('click', () => {
    if (resolveDistancePromise) {
        resolveDistancePromise.reject('cancelled');
        resolveDistancePromise = null;
    }
    distanceModal.style.display = 'none';
});

// Close modal if user clicks outside of modal-content
window.addEventListener('click', (event) => {
    if (event.target === distanceModal) {
        if (resolveDistancePromise) {
            resolveDistancePromise.reject('clicked_outside');
            resolveDistancePromise = null;
        }
        distanceModal.style.display = 'none';
        if (drawing) { // If a drawing was in progress and modal was cancelled
           drawing = false;
           redrawCanvas(); // Clear temp line
        }
    }
});


// --- Redrawing Canvas and Annotations ---
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!currentImage || !currentImage.complete || currentImage.naturalWidth === 0) {
        drawInitialMessage();
        return;
    }
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);

    annotations.forEach(ann => {
        const lineAndArrowWidth = 2.5;

        // Line
        ctx.beginPath();
        ctx.moveTo(ann.start.x, ann.start.y);
        ctx.lineTo(ann.end.x, ann.end.y);
        ctx.strokeStyle = ANNOTATION_COLOR;
        ctx.lineWidth = lineAndArrowWidth;
        ctx.stroke();

        // Arrowheads
        drawArrowhead(ctx, ann.start, ann.end, ANNOTATION_COLOR, lineAndArrowWidth, 9 + lineAndArrowWidth);
        drawArrowhead(ctx, ann.end, ann.start, ANNOTATION_COLOR, lineAndArrowWidth, 9 + lineAndArrowWidth);

        // Text
        drawAnnotationText(ann.text, ann.start, ann.end);
    });
}

function drawAnnotationText(text, start, end) {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const angle = Math.atan2(end.y - start.y, end.x - start.x);

    ctx.save();
    ctx.translate(midX, midY);
    ctx.rotate(angle);

    const fontSize = 14;
    ctx.font = `bold ${fontSize}px Arial`;

    let textOffsetY = -8;
    let textRotationAdjustment = 0;

    if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
        textRotationAdjustment = Math.PI;
        textOffsetY = 8 + fontSize * 0.5;
    }
    ctx.rotate(textRotationAdjustment);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.strokeStyle = ANNOTATION_TEXT_OUTLINE_COLOR;
    ctx.lineWidth = 3; // Outline thickness
    ctx.strokeText(text, 0, textOffsetY);

    ctx.fillStyle = ANNOTATION_COLOR;
    ctx.fillText(text, 0, textOffsetY);

    ctx.restore();
}

function drawArrowhead(context, from, to, color, lineWidth, headLength) {
    headLength = headLength || (8 + lineWidth);
    const angle = Math.atan2(to.y - from.y, to.x - from.x);

    context.save();
    context.fillStyle = color;

    context.beginPath();
    context.moveTo(to.x, to.y);
    context.lineTo(to.x - headLength * Math.cos(angle - Math.PI / 7), to.y - headLength * Math.sin(angle - Math.PI / 7));
    context.lineTo(to.x - headLength * Math.cos(angle + Math.PI / 7), to.y - headLength * Math.sin(angle + Math.PI / 7));
    context.closePath();
    context.fill();
    context.restore();
}

// --- Control Buttons ---
clearButton.addEventListener('click', () => {
    if (currentImage) {
        if (confirm("确定要清除所有标注吗？")) {
            annotations = [];
            redrawCanvas();
        }
    } else {
        alert("没有图片可以清除标注。");
    }
});

undoButton.addEventListener('click', () => {
    if (annotations.length > 0) {
        annotations.pop();
        redrawCanvas();
    } else {
        alert("没有标注可以撤销。");
    }
});

saveImageButton.addEventListener('click', () => {
    if (!currentImage || !currentImage.complete || currentImage.naturalWidth === 0) {
        alert("请先加载一张有效的图片。");
        return;
    }
    if (annotations.length === 0) {
        if (!confirm("图片上没有标注。您确定要保存原始图片吗？")) {
            return;
        }
    }

    const originalCursor = canvas.style.cursor;
    canvas.style.cursor = 'wait';
    redrawCanvas(); // Ensure final draw before generating data URL
    setTimeout(() => {
        try {
            const dataURL = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.-]/g, '').slice(0, -4);
            link.download = `量尺标注_${timestamp}.png`;
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("Error saving image:", e);
            alert("保存图片失败。可能是图片过大或浏览器安全限制。");
        } finally {
            canvas.style.cursor = 'crosshair';
        }
    }, 100);
});

// --- Fullscreen View Logic ---
fullscreenViewButton.addEventListener('click', () => {
    if (!currentImage || !currentImage.complete || currentImage.naturalWidth === 0) {
        alert("请先加载一张有效的图片才能全屏查看。");
        return;
    }
    if (canvas.width === 0 || canvas.height === 0) { // Check if canvas has valid dimensions
        alert("画布尚未准备好，请稍后再试。");
        return;
    }

    // Ensure canvas is fully drawn before getting data URL
    redrawCanvas();

    // Use a short timeout to ensure the redraw has completed rendering
    setTimeout(() => {
        try {
            const dataURL = canvas.toDataURL('image/png');
            fullscreenImage.src = dataURL;
            fullscreenOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        } catch (e) {
            console.error("Error generating image for fullscreen:", e);
            alert("无法生成全屏图像。可能是画布内容问题或浏览器限制。");
            // Fallback to original image if canvas export fails for some reason
            // fullscreenImage.src = currentImage.src;
            // fullscreenOverlay.style.display = 'flex';
            // document.body.style.overflow = 'hidden';
        }
    }, 50); // Small delay
});

closeFullscreenButton.addEventListener('click', () => {
    fullscreenOverlay.style.display = 'none';
    fullscreenImage.src = ""; // Important to clear to free up memory
    document.body.style.overflow = 'auto';
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && fullscreenOverlay.style.display === 'flex') {
        closeFullscreenButton.click();
    }
});


// --- Initial State and Resize Handling ---
function drawInitialMessage(){
    if (!canvas.width || !canvas.height) {
        canvas.width = canvas.parentElement.clientWidth || 300;
        canvas.height = 200;
    }
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.fillStyle = "#888";
    ctx.font = "15px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("点击图片图标选择图片开始标注", canvas.width / 2, canvas.height / 2);
}
window.addEventListener('resize', () => {
    if (fullscreenOverlay.style.display !== 'flex') {
        setCanvasSize();
        redrawCanvas();
    }
});
drawInitialMessage(); // Initial call