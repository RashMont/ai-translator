document.getElementById("startSelection").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: startSelection
        });
    });
});

function startSelection() {
    document.dispatchEvent(new Event("mousedown"));
}
