const AZURE_VISION_ENDPOINT = "https://my-ai-vision-nlp.cognitiveservices.azure.com/";
const AZURE_VISION_KEY = "Jvu0smb4I4pS4CKr2LPMdjzTn8VBuam4hpKERpjFLjSiiu1M7o07JQQJ99BCACYeBjFXJ3w3AAAFACOGXYEi";
const AZURE_TRANSLATOR_KEY = "8xpdpqXL9qCwr0dnO8EK5I84gOthsbKoCgl4MlNVLPYuk0NdQKTxJQQJ99BCACYeBjFXJ3w3AAAbACOGF7zp";
const AZURE_TRANSLATOR_ENDPOINT = "https://api.cognitive.microsofttranslator.com/";
const TRANSLATOR_REGION = "eastus";
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "processSelection") {
        if (message.payload.type === "text") {
            translateText(message.payload.data)
                .then(translatedText => sendResponse({ success: true, translatedText }))
                .catch(error => {
                    console.error("Error en traducción:", error);
                    sendResponse({ success: false, error: error.message });
                });
        } else if (message.payload.type === "image") {
            captureScreenAndProcessImage(message.payload.bounds)
                .then(translatedText => sendResponse({ success: true, translatedText }))
                .catch(error => {
                    console.error("Error al procesar imagen:", error);
                    sendResponse({ success: false, error: error.message });
                });
        }
    }
    return true; // Necesario para que `sendResponse` funcione de forma asíncrona
});

async function captureScreenAndProcessImage(bounds) {
    return new Promise((resolve, reject) => {
        chrome.tabs.captureVisibleTab(null, { format: "png" }, async (image) => {
            if (!image) {
                return reject(new Error("No se pudo capturar la pantalla."));
            }

            try {
                let extractedText = await processImageWithAzure(image, bounds);
                console.log("Texto extraído de la imagen:", extractedText);

                if (!extractedText || extractedText.trim() === "") {
                    return reject(new Error("No se detectó texto en la imagen."));
                }

                let translatedText = await translateText(extractedText);
                console.log("Texto traducido:", translatedText);
                resolve(translatedText);
            } catch (error) {
                reject(error);
            }
        });
    });
}

async function processImageWithAzure(imageBase64, bounds) {
    let binaryString = atob(imageBase64.split(",")[1]);
    let imageBuffer = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
        imageBuffer[i] = binaryString.charCodeAt(i);
    }

    let response = await fetch(`${AZURE_VISION_ENDPOINT}/vision/v3.2/ocr?language=unk&detectOrientation=true`, {
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
    if (!result || !result.regions) {
        console.error("Respuesta de Azure OCR inválida:", result);
        return "";
    }

    let extractedText = result.regions
        .map(region => region.lines.map(line => line.words.map(word => word.text).join(" ")).join("\n"))
        .join("\n");

    return extractedText.trim();
}

async function translateText(text) {
    let response = await fetch(`${AZURE_TRANSLATOR_ENDPOINT}/translate?api-version=3.0&to=es`, {
        method: "POST",
        headers: {
            "Ocp-Apim-Subscription-Key": AZURE_TRANSLATOR_KEY,
            "Ocp-Apim-Subscription-Region": TRANSLATOR_REGION,
            "Content-Type": "application/json"
        },
        body: JSON.stringify([{ Text: text }])
    });

    let result = await response.json();
    console.log("Respuesta de Azure Translator:", result);

    if (!result || !result[0]?.translations || !result[0].translations[0]?.text) {
        console.error("Error en la respuesta de Azure Translator:", result);
        return "Error en la traducción.";
    }

    return result[0].translations[0].text;
}
