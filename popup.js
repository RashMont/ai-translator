document.addEventListener("DOMContentLoaded", () => {
    let toggleButton = document.getElementById("toggleSelection");

    chrome.storage.local.get(["selectionEnabled"], (data) => {
        let enabled = data.selectionEnabled ?? true;
        updateButtonState(enabled);
    });

    toggleButton.addEventListener("click", () => {
        chrome.storage.local.get(["selectionEnabled"], (data) => {
            let enabled = !(data.selectionEnabled ?? true);
            chrome.storage.local.set({ selectionEnabled: enabled });
            updateButtonState(enabled);

            // Enviar mensaje a content.js para actualizar estado
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    function: updateSelectionState,
                    args: [enabled]
                });
            });
        });
    });

    function updateButtonState(enabled) {
        toggleButton.innerText = enabled ? "Desactivar Selección" : "Activar Selección";
        toggleButton.classList.toggle("off", !enabled);
    }
});

// Función que se ejecutará en content.js
function updateSelectionState(enabled) {
    window.selectionEnabled = enabled;
}
