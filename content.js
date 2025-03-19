let isSelecting = false;
let startX, startY, selectionBox;

document.addEventListener("mousedown", (event) => {
    if (!event.target || typeof event.target.getAttribute !== "function") return;
    if (event.button !== 0) return; // Solo clic izquierdo

    isSelecting = true;

    selectionBox = document.createElement("div");
    selectionBox.style.position = "absolute";
    selectionBox.style.border = "2px dashed red";
    selectionBox.style.backgroundColor = "rgba(255, 0, 0, 0.2)";
    selectionBox.style.pointerEvents = "none";
    selectionBox.style.zIndex = "9999";

    startX = event.pageX;
    startY = event.pageY;
    selectionBox.style.left = `${startX}px`;
    selectionBox.style.top = `${startY}px`;
    document.body.appendChild(selectionBox);
});

document.addEventListener("mousemove", (event) => {
    if (!isSelecting || !selectionBox) return;

    let width = event.pageX - startX;
    let height = event.pageY - startY;

    selectionBox.style.width = `${Math.abs(width)}px`;
    selectionBox.style.height = `${Math.abs(height)}px`;
    selectionBox.style.left = `${Math.min(startX, event.pageX)}px`;
    selectionBox.style.top = `${Math.min(startY, event.pageY)}px`;
});

document.addEventListener("mouseup", async () => {
    if (!isSelecting || !selectionBox) return;
    isSelecting = false;

    let width = parseInt(selectionBox.style.width);
    let height = parseInt(selectionBox.style.height);

    if (width <= 5 || height <= 5) {
        document.body.removeChild(selectionBox);
        selectionBox = null;
        return;
    }

    let bounds = {
        x: parseInt(selectionBox.style.left),
        y: parseInt(selectionBox.style.top),
        width,
        height,
    };

    try {
        chrome.runtime.sendMessage({ action: "processSelection", payload: { type: "image", bounds } }, (response) => {
            if (response?.success && response.translatedText) {
                console.log("Texto traducido recibido en content.js:", response.translatedText);
                displayText(response.translatedText, bounds);
            } else {
                console.error("Error en procesamiento:", response?.error || "Respuesta inválida");
                displayText("Error en la traducción", bounds);
            }
        });
    } catch (error) {
        console.error("Error al enviar mensaje a background:", error);
    } finally {
        document.body.removeChild(selectionBox);
        selectionBox = null;
    }
});

// Cancelar selección con ESC
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && selectionBox) {
        document.body.removeChild(selectionBox);
        selectionBox = null;
        isSelecting = false;
    }
});

function displayText(text, bounds) {
    let textElement = document.createElement("div");
    textElement.style.position = "absolute";
    textElement.style.left = `${bounds.x}px`;
    textElement.style.top = `${bounds.y + bounds.height + 5}px`;
    textElement.style.backgroundColor = "white";
    textElement.style.color = "black";
    textElement.style.padding = "5px";
    textElement.style.border = "1px solid black";
    textElement.style.zIndex = "10000";
    textElement.innerText = text;

    document.body.appendChild(textElement);
}
