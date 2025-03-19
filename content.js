let selectionBoxes = []; // Almacenar los cuadros de selección
let isSelecting = false;
let startX = 0, startY = 0;

// Obtener el estado de activación de la selección
chrome.storage.local.get(["selectionEnabled"], (data) => {
    window.selectionEnabled = data.selectionEnabled ?? true;
});

// Escuchar mensajes para activar/desactivar la selección
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "updateSelectionState") {
        window.selectionEnabled = message.enabled;
    }
});

document.addEventListener("mousedown", (event) => {
    if (!window.selectionEnabled || event.button !== 0) return;

    isSelecting = true;
    startX = event.pageX;
    startY = event.pageY;

    let selectionBox = document.createElement("div");
    selectionBox.style.position = "absolute";
    selectionBox.style.border = "2px dashed #0078D4";
    selectionBox.style.backgroundColor = "rgba(0, 120, 212, 0.2)";
    selectionBox.style.pointerEvents = "none";
    selectionBox.style.zIndex = "9999";

    selectionBox.style.left = `${startX}px`;
    selectionBox.style.top = `${startY}px`;
    document.body.appendChild(selectionBox);

    selectionBoxes.push(selectionBox); // Guardamos la nueva selección
});

document.addEventListener("mousemove", (event) => {
    if (!isSelecting || selectionBoxes.length === 0) return;

    let selectionBox = selectionBoxes[selectionBoxes.length - 1]; // Último cuadro creado
    let width = event.pageX - startX;
    let height = event.pageY - startY;

    selectionBox.style.width = `${Math.abs(width)}px`;
    selectionBox.style.height = `${Math.abs(height)}px`;

    if (width < 0) selectionBox.style.left = `${event.pageX}px`;
    if (height < 0) selectionBox.style.top = `${event.pageY}px`;
});

document.addEventListener("mouseup", () => {
    if (!isSelecting || selectionBoxes.length === 0) return;
    isSelecting = false;

    let selectionBox = selectionBoxes[selectionBoxes.length - 1]; // Último cuadro
    let selectedText = getTextInsideSelection(selectionBox);
    
    if (selectedText) sendTextToBackground({ type: "text", data: selectedText });
});

// ✅ Eliminar el último cuadro creado al presionar "Escape"
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && selectionBoxes.length > 0) {
        let lastBox = selectionBoxes.pop(); // Sacar el último cuadro del array
        lastBox.remove(); // Eliminarlo del DOM
        console.log("Cuadro de selección eliminado");
    }
});

function getTextInsideSelection(box) {
    let range = document.caretRangeFromPoint(startX, startY);
    let endRange = document.caretRangeFromPoint(startX + parseInt(box.style.width), startY + parseInt(box.style.height));

    if (range && endRange) {
        let selection = document.createRange();
        selection.setStart(range.startContainer, range.startOffset);
        selection.setEnd(endRange.endContainer, endRange.endOffset);
        return selection.toString();
    }
    return "";
}

function sendTextToBackground(payload) {
    chrome.runtime.sendMessage({ action: "processSelection", payload }, (response) => {
        if (response && response.success) {
            showTranslationPopup(response.translatedText);
        } else {
            console.error("Error al obtener traducción:", response.error);
        }
    });
}

function showTranslationPopup(text) {
    let popup = document.createElement("div");
    popup.innerText = text;
    popup.style.position = "fixed";
    popup.style.bottom = "20px";
    popup.style.right = "20px";
    popup.style.backgroundColor = "#0078D4";
    popup.style.color = "#fff";
    popup.style.padding = "10px";
    popup.style.borderRadius = "5px";
    popup.style.zIndex = "9999";
    popup.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.3)";

    document.body.appendChild(popup);

    setTimeout(() => {
        popup.remove();
    }, 5000);
}