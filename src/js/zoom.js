// ===============================================
// CONFIGURAÇÃO INICIAL
// ===============================================
const canvas = document.getElementById("canvas");
const connectionsSvg = document.getElementById("connections-svg");

let elements = [];
let selectedElement = null;
let isConnecting = false;
let connectingFrom = null;
let history = [];

const SVG_NS = "http://www.w3.org/2000/svg";

// ===============================================
// ZOOM E PAN
// ===============================================
let zoomLevel = 1;
let panX = 0;
let panY = 0;

function applyTransform() {
    canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
}

canvas.addEventListener("wheel", (e) => {
    if (!e.ctrlKey) return;

    e.preventDefault();

    const delta = -e.deltaY * 0.0015;
    const oldZoom = zoomLevel;

    zoomLevel = Math.min(3, Math.max(0.2, zoomLevel + delta));

    const mouseX = e.clientX - canvas.getBoundingClientRect().left;
    const mouseY = e.clientY - canvas.getBoundingClientRect().top;

    panX -= (mouseX / zoomLevel - mouseX / oldZoom);
    panY -= (mouseY / zoomLevel - mouseY / oldZoom);

    applyTransform();
});

// PAN segurando botão esquerdo
let isPanning = false;
let panStartX = 0;
let panStartY = 0;

canvas.addEventListener("mousedown", (e) => {
    if (e.target === canvas || e.target === connectionsSvg) {
        isPanning = true;
        panStartX = e.clientX - panX;
        panStartY = e.clientY - panY;
    }
});

window.addEventListener("mousemove", (e) => {
    if (isPanning) {
        panX = e.clientX - panStartX;
        panY = e.clientY - panStartY;
        applyTransform();
    }
});

window.addEventListener("mouseup", () => {
    isPanning = false;
});

// ===============================================
// CLASSE DO ELEMENTO
// ===============================================
class DiagramElement {
    constructor(type, x, y) {
        this.id = "el_" + Math.random().toString(36).substr(2, 9);
        this.type = type;
        this.x = x;
        this.y = y;
        this.label = type;
        this.connections = [];
        this.element = null;
    }

    getIconSVG() {
        return `<svg width="18" height="18"><circle cx="9" cy="9" r="7" stroke="#333" fill="none"/></svg>`;
    }

    render() {
        if (this.element) this.element.remove();

        const div = document.createElement("div");
        div.className = "diagram-element";
        div.id = this.id;
        div.style.left = `${this.x}px`;
        div.style.top = `${this.y}px`;
        div.draggable = true;

        const iconSvg = this.getIconSVG();

        div.innerHTML = `
            <div class="element-header">
                ${iconSvg}
                <span class="element-label">${this.label}</span>
            </div>

            <div class="connection-point top" data-point="top"></div>
            <div class="connection-point right" data-point="right"></div>
            <div class="connection-point bottom" data-point="bottom"></div>
            <div class="connection-point left" data-point="left"></div>

            <div class="connection-arrow top" data-point="top"></div>
            <div class="connection-arrow right" data-point="right"></div>
            <div class="connection-arrow bottom" data-point="bottom"></div>
            <div class="connection-arrow left" data-point="left"></div>
        `;

        div.addEventListener("mousedown", (e) => {
            if (e.target.closest(".connection-point") || e.target.closest(".connection-arrow")) return;
            this.onMouseDown(e);
        });

        div.addEventListener("click", (e) => {
            if (!e.target.closest(".connection-point") && !e.target.closest(".connection-arrow")) {
                selectElement(this);
            }
        });

        div.querySelectorAll(".connection-arrow").forEach((arrow) => {
            arrow.addEventListener("click", (e) => {
                e.stopPropagation();
                const point = arrow.dataset.point;

                if (isConnecting) {
                    finishConnection(this, point);
                } else {
                    startConnection(this, point);
                }
            });
        });

        div.querySelectorAll(".connection-point").forEach((point) => {
            point.addEventListener("click", (e) => {
                e.stopPropagation();
                const pt = point.dataset.point;

                if (isConnecting) {
                    finishConnection(this, pt);
                } else {
                    startConnection(this, pt);
                }
            });
        });

        this.element = div;
        canvas.appendChild(div);

        requestAnimationFrame(() => redrawConnections());
    }

    onMouseDown(e) {
        selectedElement = this;
        selectElement(this);

        const rect = this.element.getBoundingClientRect();
        const startX = e.clientX;
        const startY = e.clientY;
        const offsetX = startX - rect.left;
        const offsetY = startY - rect.top;

        const move = (ev) => {
            this.x = ev.clientX - offsetX;
            this.y = ev.clientY - offsetY;

            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;

            redrawConnections();
        };

        const up = () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
            saveHistory();
        };

        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
    }

    getConnectionPointCoords(point) {
        if (!this.element) return { x: this.x, y: this.y };

        const rect = this.element.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();

        const x = rect.left - canvasRect.left;
        const y = rect.top - canvasRect.top;
        const w = rect.width;
        const h = rect.height;

        const pts = {
            top: { x: x + w / 2, y },
            right: { x: x + w, y: y + h / 2 },
            bottom: { x: x + w / 2, y: y + h },
            left: { x, y: y + h / 2 },
        };

        return pts[point];
    }
}

// ===============================================
// CONEXÕES
// ===============================================
function startConnection(fromElement, point) {
    isConnecting = true;
    connectingFrom = { element: fromElement, point };
}

function finishConnection(toElement, toPoint) {
    if (!connectingFrom) return;

    if (connectingFrom.element.id === toElement.id) {
        isConnecting = false;
        connectingFrom = null;
        return;
    }

    connectingFrom.element.connections.push({
        to: toElement.id,
        fromPoint: connectingFrom.point,
        toPoint,
    });

    isConnecting = false;
    connectingFrom = null;

    requestAnimationFrame(() => {
        redrawConnections();
        saveHistory();
    });
}

function redrawConnections() {
    connectionsSvg.innerHTML = "";

    elements.forEach((el) => {
        el.connections.forEach((conn) => {
            const target = elements.find((e) => e.id === conn.to);
            if (!target) return;

            const p1 = el.getConnectionPointCoords(conn.fromPoint);
            const p2 = target.getConnectionPointCoords(conn.toPoint);

            const midX = (p1.x + p2.x) / 2;

            const path = document.createElementNS(SVG_NS, "path");
            path.setAttribute(
                "d",
                `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`
            );
            path.setAttribute("stroke", "#0f172a88");
            path.setAttribute("stroke-width", "1.6");
            path.setAttribute("fill", "none");

            connectionsSvg.appendChild(path);
        });
    });
}

// ===============================================
// SELEÇÃO E PROPRIEDADES
// ===============================================
function selectElement(el) {
    selectedElement = el;
}

// ===============================================
// HISTÓRICO (UNDO)
// ===============================================
function saveHistory() {
    history.push(JSON.stringify(elements));
}

// ===============================================
// CRIAÇÃO DE ELEMENTOS PELO DRAG
// ===============================================
document.querySelectorAll(".element-item").forEach((item) => {
    item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("type", item.dataset.type);
    });
});

canvas.addEventListener("dragover", (e) => e.preventDefault());

canvas.addEventListener("drop", (e) => {
    e.preventDefault();

    const type = e.dataTransfer.getData("type");
    const rect = canvas.getBoundingClientRect();

    const x = (e.clientX - rect.left - panX) / zoomLevel;
    const y = (e.clientY - rect.top - panY) / zoomLevel;

    const el = new DiagramElement(type, x, y);
    elements.push(el);
    el.render();
    saveHistory();
});
