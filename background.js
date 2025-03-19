const AZURE_VISION_ENDPOINT = "";
const AZURE_VISION_KEY = "";
const AZURE_TRANSLATOR_KEY = "";
const AZURE_TRANSLATOR_ENDPOINT = "";
const TRANSLATOR_REGION = "";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "processSelection") {
        if (message.payload.type === "text") {
            translateText(message.payload.data).then(translatedText => {
                sendResponse({ success: true, translatedText });
            }).catch(error => {
                console.error("Error en traducción:", error);
                sendResponse({ success: false, error: error.message });
            });
        } else if (message.payload.type === "image") {
            processImageWithAzure(message.payload.data).then(text => {
                translateText(text).then(translatedText => {
                    sendResponse({ success: true, translatedText });
                });
            }).catch(error => {
                console.error("Error al procesar imagen:", error);
                sendResponse({ success: false, error: error.message });
            });
        }
    }
    return true;
});

async function processImageWithAzure(imageBase64) {
    let imageBuffer = Buffer.from(imageBase64.split(",")[1], "base64");

    let response = await fetch(`${AZURE_VISION_ENDPOINT}vision/v3.2/ocr?language=unk&detectOrientation=true`, {
        method: "POST",
        headers: {
            "Ocp-Apim-Subscription-Key": AZURE_VISION_KEY,
            "Content-Type": "application/octet-stream"
        },
        body: imageBuffer
    });

    let result = await response.json();
    return extractTextFromAzureResult(result);
}

function extractTextFromAzureResult(result) {
    return result.regions
        .map(region => region.lines.map(line => line.words.map(word => word.text).join(" ")).join("\n"))
        .join("\n");
}

async function translateText(text) {
    let response = await fetch(`${AZURE_TRANSLATOR_ENDPOINT}translate?api-version=3.0&to=es`, {
        method: "POST",
        headers: {
            "Ocp-Apim-Subscription-Key": AZURE_TRANSLATOR_KEY,
            "Ocp-Apim-Subscription-Region": TRANSLATOR_REGION,
            "Content-Type": "application/json"
        },
        body: JSON.stringify([{ Text: text }])
    });

    let result = await response.json();
    return result[0].translations[0].text;
}
