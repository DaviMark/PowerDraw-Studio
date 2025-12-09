/**
 * Extensão para PowerDraw Studio - Complexidade
 * Adiciona propriedade 'complexity' e um dropdown ao painel de propriedades.
 * Projetado para funcionar após 'update-time-extension.js'.
 * * Este script estende:
 * 1. A classe DiagramElement (adiciona 'complexity' e lógica de cor).
 * 2. As funções globais de persistência (saveHistory, restoreDiagramFromLocalStorage).
 * 3. A função global updatePropertiesPanel (adiciona o dropdown).
 */

const propertiesContent = document.getElementById('properties-content');

// =======================================================
// 1. EXTENDER A CLASSE DiagramElement
// Adiciona a propriedade 'complexity' e lógica de renderização de cor.
// =======================================================
if (typeof DiagramElement !== 'undefined') {
    // Guarda a referência ao construtor original (seja do script.js ou da extensão anterior)
    const OriginalDiagramElementConstructor = DiagramElement;

    // Redefine a classe DiagramElement como uma extensão da original
    DiagramElement = class extends OriginalDiagramElementConstructor {
        constructor(type, x, y) {
            super(type, x, y);
            // Adiciona a nova propriedade de estado, com um valor padrão
            this.complexity = this.complexity || 'Baixo'; 
        }

        // Sobrescreve o render para aplicar a classe de cor após a renderização
        render() {
            // Chama o render da classe base ou da extensão de update-time
            super.render(); 
            if (this.element) {
                this.updateComplexityClass();
            }
        }
        
        // Novo método: Define a complexidade e atualiza a classe CSS
        setComplexity(level) {
            if (['Baixo', 'Medio', 'Dificil'].includes(level)) {
                this.complexity = level;
                this.updateComplexityClass(); // Aplica a cor
            }
        }
        
        // Novo método: Remove e aplica a classe de complexidade correta
        updateComplexityClass(targetElement) {
            const elementToUpdate = targetElement || this.element;
            if (!elementToUpdate) return;
            
            // Remove classes existentes
            elementToUpdate.classList.remove('complexity-baixo', 'complexity-medio', 'complexity-dificil');
            
            // Adiciona a nova classe (que será estilizada pelo CSS)
            const complexityClass = `complexity-${this.complexity.toLowerCase()}`;
            elementToUpdate.classList.add(complexityClass);
        }
    };
} else {
    console.error("ERRO: DiagramElement não está definido. A extensão não pode ser aplicada.");
}

// =======================================================
// 2. AUMENTAR FUNÇÕES DE PERSISTÊNCIA (SAVE/LOAD)
// Sobrescreve as funções para adicionar 'complexity' no localStorage.
// =======================================================

// 2a. Re-sobrescrever saveHistory para adicionar 'complexity' no localStorage
if (typeof window.saveHistory === 'function') {
    const OriginalSaveHistoryForExtension = window.saveHistory;

    // A nova saveHistory irá chamar a original (que lida com o array history)
    // e depois salva no localStorage com o campo 'complexity'.
    window.saveHistory = function() {
        // 1. Chama a função do usuário (que já chama o histórico original e salva 'updateTime' se existir)
        OriginalSaveHistoryForExtension.call(this);

        // 2. Re-salvamos o estado no localStorage com AMBAS as propriedades (assumindo updateTime existe)
        const diagramState = {
            elements: elements.map(el => ({
                id: el.id,
                type: el.type,
                x: el.x,
                y: el.y,
                label: el.label,
                updateTime: el.updateTime || null, 
                complexity: el.complexity || 'Baixo', // INCLUSÃO CRUCIAL
                connections: el.connections
            })),
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('powerdraw-diagram-state', JSON.stringify(diagramState));
    };
}

// 2b. Sobrescrever restoreDiagramFromLocalStorage para carregar 'complexity'
if (typeof window.restoreDiagramFromLocalStorage === 'function' && typeof window.loadFromLocalStorage === 'function') {
    // Guarda a função que busca no localStorage, assumida do update-time-extension
    const loadFromLocalStorage = window.loadFromLocalStorage; 

    window.restoreDiagramFromLocalStorage = function() {
        const saved = loadFromLocalStorage(); 
        
        if (!saved || !saved.elements) {
            return;
        }
        
        // Limpar canvas
        elements.forEach(el => el.remove());
        elements = [];
        
        // Restaurar elementos
        saved.elements.forEach(savedEl => {
            // Usa o novo construtor estendido
            const newElement = new DiagramElement(savedEl.type, savedEl.x, savedEl.y); 
            newElement.id = savedEl.id;
            newElement.label = savedEl.label;
            newElement.updateTime = savedEl.updateTime;
            newElement.complexity = savedEl.complexity; // INCLUSÃO CRUCIAL
            newElement.connections = savedEl.connections;
            newElement.render();
            elements.push(newElement);
        });
        
        // Redesenhar conexões (função global assumida)
        if (typeof window.redrawConnections === 'function') {
            window.redrawConnections();
        }
    };
}


// =======================================================
// 3. EXTENDER updatePropertiesPanel (INJEÇÃO DO DROPDOWN)
// Garante a injeção no local correto e a religação dos listeners.
// =======================================================
if (typeof window.updatePropertiesPanel === 'function') {
    // A função já modificada pelo seu update-time-extension.js
    const OriginalUpdatePropertiesPanelForExtension = window.updatePropertiesPanel; 

    window.updatePropertiesPanel = function(element) {
        
        // 3a. Executa a função do usuário (gera todo o HTML existente: Header, Rótulo, Posição e Horário de Atualização)
        OriginalUpdatePropertiesPanelForExtension.call(this, element); 

        if (!element) return;
        
        // 3b. O HTML a ser injetado (o dropdown, incluindo um separador)
        const complexityHtml = `
            <hr> <div class="property-group complexity-group">
                <label for="complexity-select">Nível de Complexidade:</label>
                <select id="complexity-select" data-id="${element.id}">
                    <option value="Baixo" ${element.complexity === 'Baixo' ? 'selected' : ''}>Baixo (🔵)</option>
                    <option value="Medio" ${element.complexity === 'Medio' ? 'selected' : ''}>Médio (🟡)</option>
                    <option value="Dificil" ${element.complexity === 'Dificil' ? 'selected' : ''}>Difícil (🔴)</option>
                </select>
            </div>
        `;

        // 3c. Estratégia de Injeção: Insere antes do primeiro grupo de propriedades.
        // Isto coloca o dropdown de Complexidade imediatamente abaixo do cabeçalho (Tipo/ID).
        const firstPropertyGroup = propertiesContent.querySelector('.property-group');

        if (firstPropertyGroup) {
            // Injeta o HTML da complexidade antes do grupo do Rótulo/Posição
            firstPropertyGroup.insertAdjacentHTML('beforebegin', complexityHtml);
        } else {
            // Fallback: anexa no final
            propertiesContent.insertAdjacentHTML('beforeend', complexityHtml);
        }
        
        // 3d. Adiciona o Event Listener (Religação)
        const complexitySelect = document.getElementById('complexity-select');
        if (complexitySelect) {
            complexitySelect.addEventListener('change', (e) => {
                const newComplexity = e.target.value;
                element.setComplexity(newComplexity); 
                window.saveHistory(); // Salva o estado
            });
        }

        // 3e. Religação do Event Listener do Rótulo (CRUCIAL)
        // O DOM do painel foi recriado, então o listener do input 'labelInput' foi quebrado.
        const labelInput = document.getElementById('labelInput'); // Corrigido para 'labelInput' do script.js
        if (labelInput) {
             labelInput.addEventListener('change', (e) => { // Use 'change' ou 'input' como no original
                element.label = e.target.value;
                // Atualiza o rótulo no elemento visual e no painel
                const elementLabel = element.element.querySelector('.element-label');
                if (elementLabel) elementLabel.textContent = element.label;
                
                if (element.type === 'shape-text') {
                    const textPreview = element.element.querySelector('.shape-text-preview');
                    if (textPreview) textPreview.textContent = element.label;
                }
                
                // Força a re-seleção para atualizar as propriedades e salvar
                selectElement(element); 
                window.saveHistory();
            });
        }

        // 3f. Religação do Event Listener de Posição X (CRUCIAL)
        const xInput = document.getElementById('xInput');
        if (xInput) {
            xInput.addEventListener('change', () => {
                element.updatePosition(parseInt(xInput.value, 10), element.y);
                window.saveHistory();
            });
        }

        // 3g. Religação do Event Listener de Posição Y (CRUCIAL)
        const yInput = document.getElementById('yInput');
        if (yInput) {
            yInput.addEventListener('change', () => {
                element.updatePosition(element.x, parseInt(yInput.value, 10));
                window.saveHistory();
            });
        }
    };
} else {
     console.error("ERRO: updatePropertiesPanel não está definido. A injeção do dropdown falhou.");
}

console.log('✓ Extensão de Complexidade carregada com sucesso e corrigida.');