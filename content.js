// content.js

let selectionBox = null;  // Variable para el cuadro de selección
let startX = 0, startY = 0;  // Coordenadas iniciales del mouse

document.addEventListener("mousedown", (event) => {
    // Solo permitir clic izquierdo
    if (event.button !== 0) return;

    // Crear el cuadro de selección
    selectionBox = document.createElement("div");
    selectionBox.style.position = "absolute";
    selectionBox.style.border = "2px dashed red";  // Borde del cuadro
    selectionBox.style.background = "rgba(255, 0, 0, 0.2)";  // Fondo semi-transparente
    selectionBox.style.pointerEvents = "none";  // Para que no interfiera con el texto
    selectionBox.style.zIndex = "9999";  // Para que esté por encima de todo

    // Guardar las coordenadas iniciales
    startX = event.pageX;
    startY = event.pageY;
    selectionBox.style.left = `${startX}px`;
    selectionBox.style.top = `${startY}px`;

    document.body.appendChild(selectionBox);

    // Detectar movimiento del mouse
    document.addEventListener("mousemove", resizeSelection);
    document.addEventListener("mouseup", endSelection);
});

// Función para redimensionar el cuadro de selección
function resizeSelection(event) {
    if (!selectionBox) return;

    let width = event.pageX - startX;
    let height = event.pageY - startY;

    // Ajustar dirección si el usuario arrastra en sentido contrario
    selectionBox.style.width = `${Math.abs(width)}px`;
    selectionBox.style.height = `${Math.abs(height)}px`;
    selectionBox.style.left = `${Math.min(event.pageX, startX)}px`;
    selectionBox.style.top = `${Math.min(event.pageY, startY)}px`;
}

// Función que se ejecuta cuando el usuario suelta el mouse
function endSelection(event) {
    document.removeEventListener("mousemove", resizeSelection);
    document.removeEventListener("mouseup", endSelection);

    // Aquí más adelante extraeremos el texto dentro del cuadro
    console.log("Área seleccionada:", selectionBox.getBoundingClientRect());

    // Si el usuario presiona 'Esc', eliminar el cuadro
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            selectionBox.remove();
            selectionBox = null;
        }
    });
}
