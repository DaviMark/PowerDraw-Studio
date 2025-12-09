// ===== LÓGICA DE PESQUISA DE ELEMENTOS =====
const elementSearchInput = document.getElementById('elementSearchInput');

function filterElements() {
    const filterText = elementSearchInput.value.toLowerCase().trim();
    const categories = document.querySelectorAll('.dropdown-category');

    categories.forEach(category => {
        const content = category.querySelector('.dropdown-content');
        if (!content) return; 

        const elementItems = content.querySelectorAll('.element-item');
        let categoryHasVisibleElements = false;

        // 1. Filtrar elementos individuais
        elementItems.forEach(item => {
            // Assume que o nome do elemento está no <span>
            const elementNameSpan = item.querySelector('span');
            
            if (elementNameSpan) {
                const elementName = elementNameSpan.textContent.toLowerCase();
                
                if (elementName.includes(filterText)) {
                    item.style.display = 'flex'; // Mostrar elemento
                    categoryHasVisibleElements = true;
                } else {
                    item.style.display = 'none'; // Esconder elemento
                }
            }
        });

        // 2. Controlar a visibilidade da categoria
        if (filterText === '') {
            // Se a barra estiver vazia, garantir que todas as categorias voltem ao estado normal
            category.style.display = 'block'; 
        } else {
            // Se houver pesquisa, esconder a categoria se não houver resultados
            if (categoryHasVisibleElements) {
                category.style.display = 'block';
                // Opcional: Abrir a categoria se ela contiver resultados e estiver fechada
                category.classList.add('open'); 
            } else {
                category.style.display = 'none';
            }
        }
    });
}

// Anexa a função ao evento 'input' para filtragem em tempo real
if (elementSearchInput) {
    elementSearchInput.addEventListener('input', filterElements);
}
// ===== FIM DA LÓGICA DE PESQUISA =====