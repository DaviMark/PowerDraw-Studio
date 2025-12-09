/**
 * Extensão para PowerDraw Studio - Integrada
 * Funcionalidade: Horário de Atualização com Persistência em LocalStorage
 */

// ===== FUNÇÃO PARA SALVAR NO LOCALSTORAGE =====

/**
 * Estende a função saveHistory para também salvar no LocalStorage
 */
const originalSaveHistory = window.saveHistory;

window.saveHistory = function() {
    // Chamar função original
    if (originalSaveHistory) {
        originalSaveHistory.call(this);
    }
    
    // Salvar no LocalStorage
    const diagramState = {
        elements: elements.map(el => ({
            id: el.id,
            type: el.type,
            x: el.x,
            y: el.y,
            label: el.label,
            updateTime: el.updateTime || null,
            connections: el.connections
        })),
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('powerdraw-diagram-state', JSON.stringify(diagramState));
    console.log('✓ Estado salvo no LocalStorage');
};

// ===== FUNÇÃO PARA CARREGAR DO LOCALSTORAGE =====

/**
 * Carrega o estado do diagrama do LocalStorage
 */
function loadFromLocalStorage() {
    const saved = localStorage.getItem('powerdraw-diagram-state');
    
    if (!saved) {
        console.log('Nenhum estado anterior encontrado no LocalStorage');
        return null;
    }
    
    try {
        const diagramState = JSON.parse(saved);
        console.log('✓ Estado carregado do LocalStorage');
        return diagramState;
    } catch (error) {
        console.error('Erro ao carregar estado do LocalStorage:', error);
        return null;
    }
}

/**
 * Restaura o diagrama a partir do estado salvo
 */
function restoreDiagramFromLocalStorage() {
    const saved = loadFromLocalStorage();
    
    if (!saved || !saved.elements) {
        return;
    }
    
    // Limpar canvas
    elements.forEach(el => el.remove());
    elements = [];
    
    // Restaurar elementos
    saved.elements.forEach(savedEl => {
        const newElement = new DiagramElement(savedEl.type, savedEl.x, savedEl.y);
        newElement.id = savedEl.id;
        newElement.label = savedEl.label;
        newElement.updateTime = savedEl.updateTime;
        newElement.connections = savedEl.connections;
        newElement.render();
        elements.push(newElement);
    });
    
    // Redesenhar conexões
    redrawConnections();
    
    console.log(`✓ Diagrama restaurado com ${elements.length} elemento(s)`);
}

// ===== EXTENSÃO DA CLASSE DiagramElement =====

/**
 * Estende o método render para incluir informação de horário de atualização
 */
const originalRender = DiagramElement.prototype.render;

DiagramElement.prototype.render = function() {
    // Chamar render original
    originalRender.call(this);
    
    // Adicionar informação de horário de atualização ao card
    if (this.element) {
        const updateTimeInfo = document.createElement('div');
        updateTimeInfo.className = 'update-time-info';
        
        if (this.updateTime) {
            updateTimeInfo.innerHTML = `
                <span class="update-time-label">Horário de atualização:</span>
                <span class="update-time-value">${this.updateTime}</span>
            `;
        } else {
            updateTimeInfo.innerHTML = `
                <span class="update-time-label">Sem horário definido</span>
            `;
        }
        
        this.element.appendChild(updateTimeInfo);
    }
};

// ===== EXTENSÃO DO PAINEL DE PROPRIEDADES =====

/**
 * Estende a função updatePropertiesPanel para incluir campo de horário
 */
const originalUpdatePropertiesPanel = window.updatePropertiesPanel;

window.updatePropertiesPanel = function(element) {
    // Chamar função original
    originalUpdatePropertiesPanel.call(this, element);
    
    if (!element) return;
    
    // Adicionar campo de horário de atualização
    const propertiesContent = document.getElementById('properties-content');
    
    // Criar grupo de propriedade para horário
    const updateTimeGroup = document.createElement('div');
    updateTimeGroup.className = 'property-group';
    updateTimeGroup.innerHTML = `
        <label class="property-label">Horário de Atualização</label>
        <input type="time" class="property-input" id="updateTimeInput" value="${element.updateTime || ''}">
        <small style="color: #999; display: block; margin-top: 4px;">
            Defina o horário em que este elemento será atualizado
        </small>
    `;
    
    propertiesContent.appendChild(updateTimeGroup);
    
    // Adicionar listener para o campo de horário
    const updateTimeInput = document.getElementById('updateTimeInput');
    updateTimeInput.addEventListener('change', () => {
        element.updateTime = updateTimeInput.value;
        element.render();
        selectElement(element);
        saveHistory();
    });
};

// ===== INICIALIZAÇÃO =====

/**
 * Inicializa a extensão quando o DOM estiver pronto
 */
document.addEventListener('DOMContentLoaded', () => {
    // Restaurar diagrama do LocalStorage se existir
    setTimeout(() => {
        restoreDiagramFromLocalStorage();
    }, 500);
});

/**
 * Salvar estado antes de sair da página
 */
window.addEventListener('beforeunload', () => {
    const diagramState = {
        elements: elements.map(el => ({
            id: el.id,
            type: el.type,
            x: el.x,
            y: el.y,
            label: el.label,
            updateTime: el.updateTime || null,
            connections: el.connections
        })),
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('powerdraw-diagram-state', JSON.stringify(diagramState));
});

console.log('✓ Extensão de Horário de Atualização carregada com sucesso!');
