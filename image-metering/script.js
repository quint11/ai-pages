const imageLoader = document.getElementById('imageLoader');
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const clearButton = document.getElementById('clearAnnotations');
const undoButton = document.getElementById('undoAnnotation');
const saveImageButton = document.getElementById('saveImage');

const distanceModal = document.getElementById('distanceModal');
const distanceInput = document.getElementById('distanceInput');
const submitDistanceButton = document.getElementById('submitDistance');
const cancelDistanceButton = document.getElementById('cancelDistance');

let currentImage = null;
let annotations = [];
let drawing = false;
let startPoint = { x: 0, y: 0 };
let tempEndPoint = { x: 0, y: 0 };

let resolveDistancePromise = null;

// Define annotation color
const ANNOTATION_COLOR = '#FFC107'; // Darker Yellow (Amber)
const ANNOTATION_TEXT_OUTLINE_COLOR = 'rgba(0, 0, 0, 0.75)'; // Dark outline for text
const TEMP_ANNOTATION_COLOR = 'rgba(255, 100, 0, 0.8)'; // A slightly different orange for temp line

// --- Image Loading and Canvas Sizing --- (NO CHANGES from previous version)
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
        currentImage.src = event.target.result;
    }
    if (e.target.files[0]) {
        reader.readAsDataURL(e.target.files[0]);
    }
}

function setCanvasSize() {
    if (!currentImage) return;
    const wrapper = canvas.parentElement;
    const MAX_WIDTH = wrapper.clientWidth;
    const canvasStyle = window.getComputedStyle(canvas);
    const MAX_HEIGHT = parseFloat(canvasStyle.maxHeight) || (window.innerHeight * 0.80);
    let newWidth, newHeight;
    const aspectRatio = currentImage.naturalWidth / currentImage.naturalHeight;
    if (currentImage.naturalWidth <= MAX_WIDTH && currentImage.naturalHeight <= MAX_HEIGHT) {
        newWidth = currentImage.naturalWidth;
        newHeight = currentImage.naturalHeight;
    } else {
        if (MAX_WIDTH / aspectRatio <= MAX_HEIGHT) {
            newWidth = MAX_WIDTH;
            newHeight = MAX_WIDTH / aspectRatio;
        } else {
            newHeight = MAX_HEIGHT;
            newWidth = MAX_HEIGHT * aspectRatio;
        }
    }
    canvas.width = newWidth;
    canvas.height = newHeight;
}

// --- Drawing Logic --- (NO CHANGES to event listeners and coordinate functions from previous)
canvas.addEventListener('mousedown', handleDrawStart);
canvas.addEventListener('mousemove', handleDrawMove);
canvas.addEventListener('mouseup', handleDrawEnd);
canvas.addEventListener('mouseleave', handleDrawLeave);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleDrawStart(getTouchPos(e, canvas)); }, { passive: false });
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); handleDrawMove(getTouchPos(e, canvas)); }, { passive: false });
canvas.addEventListener('touchend', (e) => { e.preventDefault(); handleDrawEnd(getTouchPos(e, canvas)); }, { passive: false });

function getCanvasCoordinates(event, canvasElement) {
    const rect = canvasElement.getBoundingClientRect();
    let x, y;
    if (event.clientX !== undefined) {
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
    } else if (event.x !== undefined) {
        x = event.x;
        y = event.y;
    } else { return { x: 0, y: 0 }; }
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
    } else { return touchEvent; }
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
}

function handleDrawStart(event) {
    if (!currentImage || distanceModal.style.display === 'flex') return;
    drawing = true;
    startPoint = getCanvasCoordinates(event, canvas);
    tempEndPoint = { ...startPoint };
}

function handleDrawMove(event) {
    if (!drawing || !currentImage) return;
    tempEndPoint = getCanvasCoordinates(event, canvas);
    redrawCanvas(); // Redraws base image and existing annotations

    // Draw temporary feedback line
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(tempEndPoint.x, tempEndPoint.y);
    ctx.strokeStyle = TEMP_ANNOTATION_COLOR;
    ctx.lineWidth = 2.5; // Keep temp line width consistent
    ctx.setLineDash([5, 2]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw temporary arrowheads
    drawArrowhead(ctx, startPoint, tempEndPoint, TEMP_ANNOTATION_COLOR, 2.5, 8);
    drawArrowhead(ctx, tempEndPoint, startPoint, TEMP_ANNOTATION_COLOR, 2.5, 8);
}

function handleDrawLeave(event) {
    if (drawing) {
        drawing = false;
        redrawCanvas();
    }
}

async function handleDrawEnd(event) {
    if (!drawing || !currentImage) return;
    drawing = false;
    const endPoint = getCanvasCoordinates(event, canvas);
    const lineLength = Math.sqrt(Math.pow(startPoint.x - endPoint.x, 2) + Math.pow(startPoint.y - endPoint.y, 2));
    if (lineLength < 8) {
        redrawCanvas();
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
        console.log("Distance input aborted:", error);
    } finally {
        redrawCanvas();
    }
}

// --- Modal Logic --- (NO CHANGES from previous version)
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
window.addEventListener('click', (event) => {
    if (event.target === distanceModal) {
        if (resolveDistancePromise) {
            resolveDistancePromise.reject('clicked_outside');
            resolveDistancePromise = null;
        }
        distanceModal.style.display = 'none';
        if (drawing) {
           drawing = false;
           redrawCanvas();
        }
    }
});

// --- Redrawing Canvas and Annotations ---
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!currentImage) {
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
        ctx.strokeStyle = ANNOTATION_COLOR; // Use defined darker yellow
        ctx.lineWidth = lineAndArrowWidth;
        ctx.stroke();

        // Arrowheads
        drawArrowhead(ctx, ann.start, ann.end, ANNOTATION_COLOR, lineAndArrowWidth, 9 + lineAndArrowWidth);
        drawArrowhead(ctx, ann.end, ann.start, ANNOTATION_COLOR, lineAndArrowWidth, 9 + lineAndArrowWidth);

        // Text - calls the updated function
        drawAnnotationText(ann.text, ann.start, ann.end);
    });
}

/**
 * Draws the annotation text with an outline.
 */
function drawAnnotationText(text, start, end) {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const angle = Math.atan2(end.y - start.y, end.x - start.x);

    ctx.save(); // Save context state before transformations and style changes
    ctx.translate(midX, midY);
    ctx.rotate(angle);

    const fontSize = 14; // Annotation text font size
    ctx.font = `bold ${fontSize}px Arial`;
    
    let textOffsetY = -8; // Default Y offset for text (above the line)
    let textRotationAdjustment = 0;

    // Attempt to keep text upright
    if (angle > Math.PI / 2 || angle < -Math.PI / 2) { // If text would be upside down
        textRotationAdjustment = Math.PI; // Rotate text 180 degrees
        textOffsetY = 8 + fontSize * 0.5; // Position below the line, adjust for baseline
    }
    ctx.rotate(textRotationAdjustment);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle'; // Align text vertically to the middle

    // 1. Draw the outline (stroke)
    ctx.strokeStyle = ANNOTATION_TEXT_OUTLINE_COLOR;
    ctx.lineWidth = 3; // Thickness of the outline - adjust for desired effect
                      // This lineWidth is specific to strokeText and won't affect the main lines
                      // because of ctx.save() / ctx.restore()
    ctx.strokeText(text, 0, textOffsetY);

    // 2. Draw the fill text on top
    ctx.fillStyle = ANNOTATION_COLOR; // The new darker yellow for the text fill
    ctx.fillText(text, 0, textOffsetY);

    ctx.restore(); // Restore context state
}


/**
 * Draws a filled arrowhead.
 */
function drawArrowhead(context, from, to, color, lineWidth, headLength) {
    headLength = headLength || (8 + lineWidth);
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    
    context.save(); // Save context specific to arrowhead drawing
    // No need to set context.lineWidth here if the arrowhead is purely filled
    // and doesn't have its own stroke distinct from the fill.
    // If you wanted an outlined arrowhead, you'd set strokeStyle and lineWidth here too.
    context.fillStyle = color; // Fill arrowhead with the main annotation color

    context.beginPath();
    context.moveTo(to.x, to.y);
    // Define the two points of the arrowhead base
    context.lineTo(to.x - headLength * Math.cos(angle - Math.PI / 7), to.y - headLength * Math.sin(angle - Math.PI / 7));
    context.lineTo(to.x - headLength * Math.cos(angle + Math.PI / 7), to.y - headLength * Math.sin(angle + Math.PI / 7));
    context.closePath(); // Close the path to form a triangle
    context.fill();      // Fill the triangle
    context.restore();   // Restore context
}


// --- Control Buttons --- (NO CHANGES from previous version)
clearButton.addEventListener('click', () => {
    if (currentImage) {
        if (confirm("确定要清除所有标注吗？")) {
            annotations = [];
            redrawCanvas();
        }
    }
});
undoButton.addEventListener('click', () => {
    if (annotations.length > 0) {
        annotations.pop();
        redrawCanvas();
    }
});
saveImageButton.addEventListener('click', () => {
    if (!currentImage) {
        alert("请先加载一张图片。"); return;
    }
    if (annotations.length === 0 && !confirm("图片上没有标注。您确定要保存原始图片吗？")) {
        return;
    }
    const originalCursor = canvas.style.cursor;
    canvas.style.cursor = 'default';
    redrawCanvas();
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
            alert("保存图片失败。");
        } finally {
            canvas.style.cursor = originalCursor;
        }
    }, 100);
});

// --- Initial State and Resize Handling --- (NO CHANGES from previous version)
function drawInitialMessage() {
    if (!currentImage) {
        const hasDimensions = canvas.width > 0 && canvas.height > 0;
        if (!hasDimensions) {
            canvas.width = canvas.parentElement.clientWidth || 300;
            canvas.height = 200;
        }
        ctx.clearRect(0,0,canvas.width, canvas.height);
        ctx.fillStyle = "#999";
        ctx.font = "15px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("选择图片或拍照开始标注", canvas.width / 2, canvas.height / 2);
    }
}
window.addEventListener('resize', () => {
    setCanvasSize();
    redrawCanvas();
});
drawInitialMessage();