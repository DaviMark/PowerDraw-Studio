// ===== CONFIGURAÇÃO E ESTADO =====
const canvas = document.getElementById('canvas');
const connectionsSvg = document.getElementById('connections-svg');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const deleteBtn = document.getElementById('deleteBtn');
const undoBtn = document.getElementById('undoBtn');
const propertiesContent = document.getElementById('properties-content');
const leftSidebar = document.getElementById('leftSidebar');
const rightSidebar = document.getElementById('rightSidebar');
const toggleLeftBtn = document.getElementById('toggleLeftSidebar');
const toggleRightBtn = document.getElementById('toggleRightSidebar');

let elements = [];
let selectedElement = null;
let isConnecting = false;
let connectingFrom = null;
let history = [];
let dragOffset = { x: 0, y: 0 };

const SVG_NS = 'http://www.w3.org/2000/svg';

// Labels de tipos
const typeLabels = {
    // Shapes padrão
    'shape-rect': 'Bloco quadriculado',
    'shape-circle': 'Círculo',
    'shape-line-straight': 'Linha reta',
    'shape-line-orthogonal': 'Linha quadriculada',
    'shape-text': 'Texto',
    'shape-button': 'Botão',

    // Power BI
    'power-bi-desktop': 'Power BI Desktop',
    'power-bi-service': 'Power BI Service',
    'power-bi-report': 'Power BI Report',
    'power-bi-dashboard': 'Power BI Dashboard',
    'power-bi-dataset': 'Power BI Dataset',
    'power-bi-dataflow': 'Power BI Dataflow',
    'power-bi-gateway': 'Power BI Gateway',
    'power-bi-paginated': 'Paginated Reports',
    'power-bi-workspace': 'Power BI Workspace',
    'power-bi-datamart': 'Power BI Datamart',

    // Fabric
    'fabric-lakehouse': 'Fabric Lakehouse',
    'fabric-warehouse': 'Fabric Warehouse',
    'fabric-pipeline': 'Fabric Pipeline',
    'fabric-datamart': 'Fabric Datamart',
    'fabric-notebooks': 'Fabric Notebooks',
    'fabric-spark': 'Fabric Spark Job',
    'fabric-eventstream': 'Fabric Eventstream',
    'fabric-kql-db': 'Fabric KQL Database',
    'fabric-realtime': 'Fabric Real-Time Analytics',
    'fabric-ml-model': 'Fabric ML Model',
    'fabric-capacity': 'Fabric Capacity',

    // Azure
    'azure-sql': 'Azure SQL Database',
    'azure-cosmos': 'Azure Cosmos DB',
    'azure-storage': 'Azure Storage',
    'azure-datalake': 'Azure Data Lake',
    'azure-synapse': 'Azure Synapse',
    'azure-databricks': 'Azure Databricks',
    'azure-functions': 'Azure Functions',
    'azure-eventhub': 'Azure Event Hub',
    'azure-apim': 'Azure API Management',
    'azure-keyvault': 'Azure Key Vault',
    'azure-aks': 'Azure Kubernetes Service',
    'azure-vm': 'Azure Virtual Machine',
    'azure-vnet': 'Azure Virtual Network',
    'azure-datafactory': 'Azure Data Factory',
    'azure-logicapps': 'Azure Logic Apps',

    // AWS
    'aws-s3': 'AWS S3',
    'aws-redshift': 'AWS Redshift',
    'aws-glue': 'AWS Glue',
    'aws-lambda': 'AWS Lambda',
    'aws-rds': 'AWS RDS',
    'aws-dynamodb': 'AWS DynamoDB',
    'aws-emr': 'AWS EMR',
    'aws-kinesis': 'AWS Kinesis',
    'aws-sqs': 'AWS SQS',
    'aws-sns': 'AWS SNS',
    'aws-athena': 'AWS Athena',
    'aws-ec2': 'AWS EC2',
    'aws-vpc': 'AWS VPC',
    'aws-apigateway': 'AWS API Gateway',
    'aws-cloudwatch': 'AWS CloudWatch',

    // GCP
    'gcp-bigquery': 'GCP BigQuery',
    'gcp-storage': 'GCP Cloud Storage',
    'gcp-dataflow': 'GCP Dataflow',
    'gcp-functions': 'GCP Cloud Functions',
    'gcp-sql': 'GCP Cloud SQL',
    'gcp-dataproc': 'GCP Dataproc',
    'gcp-pubsub': 'GCP Pub/Sub',
    'gcp-firestore': 'GCP Firestore',
    'gcp-vertexai': 'GCP Vertex AI',
    'gcp-cloudrun': 'GCP Cloud Run',
    'gcp-gke': 'GCP Kubernetes Engine',
    'gcp-vpc': 'GCP Virtual Private Cloud',
    'gcp-memorystore': 'GCP Memorystore',
    'gcp-secretmanager': 'GCP Secret Manager'
};

// ===== CLASSE DE ELEMENTO =====
class DiagramElement {
    constructor(type, x, y) {
        this.id = `elem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.type = type;
        this.x = x;
        this.y = y;
        this.label = typeLabels[type] || type;
        this.connections = [];
        this.element = null;
    }

    render() {
        if (this.element) {
            this.element.remove();
        }

        const div = document.createElement('div');
        div.className = 'diagram-element';
        div.id = this.id;
        div.style.left = `${this.x}px`;
        div.style.top = `${this.y}px`;
        div.draggable = true;

        if (this.type.startsWith('shape-')) {
            div.classList.add('shape-element', this.type);
        }

        const iconSvg = this.getIconSVG();
        let extraContent = '';

        if (this.type === 'shape-button') {
            extraContent = `
                <button class="shape-button-preview">Botão</button>
            `;
        } else if (this.type === 'shape-text') {
            extraContent = `
                <div class="shape-text-preview">Texto livre</div>
            `;
        }

        div.innerHTML = `
            <div class="element-header">
                ${iconSvg}
                <span class="element-label">${this.label}</span>
            </div>
            <div class="element-type">${this.type}</div>
            ${extraContent}
            <div class="connection-point top" data-point="top"></div>
            <div class="connection-point right" data-point="right"></div>
            <div class="connection-point bottom" data-point="bottom"></div>
            <div class="connection-point left" data-point="left"></div>
        `;

        div.addEventListener('mousedown', (e) => this.onMouseDown(e));

        div.addEventListener('click', (e) => {
            if (!e.target.closest('.connection-point')) {
                selectElement(this);
            }
        });

        if (this.type === 'shape-text') {
            div.addEventListener('dblclick', () => {
                const labelSpan = div.querySelector('.shape-text-preview');
                if (!labelSpan) return;
                const novoTexto = prompt('Texto do bloco', this.label);
                if (novoTexto !== null) {
                    this.label = novoTexto;
                    labelSpan.textContent = novoTexto;
                    const headerLabel = div.querySelector('.element-label');
                    if (headerLabel) headerLabel.textContent = novoTexto;
                    updatePropertiesPanel(this);
                    saveHistory();
                }
            });
        }

        const connectionPoints = div.querySelectorAll('.connection-point');
        connectionPoints.forEach(point => {
            point.addEventListener('click', (e) => {
                e.stopPropagation();
                if (isConnecting) {
                    finishConnection(this, point.dataset.point);
                } else {
                    startConnection(this, point.dataset.point);
                }
            });
        });

        this.element = div;
        canvas.appendChild(div);
    }

    getIconSVG() {
        const icons = {
            // Shapes padrão
            'shape-rect': `<svg viewBox="0 0 24 24" class="element-icon-small"><rect x="4" y="4" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 8H20M4 12H20M4 16H20" stroke="currentColor" stroke-width="1" opacity="0.5"/></svg>`,
            'shape-circle': `<svg viewBox="0 0 24 24" class="element-icon-small"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.5"/></svg>`,
            'shape-line-straight': `<svg viewBox="0 0 24 24" class="element-icon-small"><line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2"/></svg>`,
            'shape-line-orthogonal': `<svg viewBox="0 0 24 24" class="element-icon-small"><path d="M4 6H14V18H20" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
            'shape-text': `<svg viewBox="0 0 24 24" class="element-icon-small"><path d="M4 6H20M8 6V18" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
            'shape-button': `<svg viewBox="0 0 24 24" class="element-icon-small"><rect x="4" y="9" width="16" height="6" rx="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,

            // Power BI
            'power-bi-desktop': `<img style="max-width: 40px;" src="/icones/PowerBI_Desktop.png" alt="">`,
            'power-bi-service': `<svg viewBox="0 0 24 24" class="element-icon-small"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="6" fill="currentColor" opacity="0.6"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>`,
            'power-bi-report': `<svg viewBox="0 0 24 24" class="element-icon-small"><path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14 2V8H20" fill="none" stroke="currentColor" stroke-width="2"/><line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2"/></svg>`,
            'power-bi-dashboard': `<img style="max-width: 40px;" src="/icones/PowerBI_Relatorio.png" alt="">`,
            'power-bi-dataset': `<img style="max-width: 40px;" src="/icones/PowerBI_Dataset.png" alt="">`,
            'power-bi-dataflow': `<img style="max-width: 40px;" src="/icones/PowerBI_Dataflow.png" alt="">`,
            'power-bi-gateway': `<img style="max-width: 40px;" src="/icones/Gateway_PowerBI.png" alt="">`,
            'power-bi-paginated': `<svg viewBox="0 0 24 24" class="element-icon-small"><path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14 2V8H20" fill="none" stroke="currentColor" stroke-width="2"/><line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2"/><line x1="8" y1="16" x2="16" y2="16" stroke="currentColor" stroke-width="2"/><line x1="8" y1="20" x2="12" y2="20" stroke="currentColor" stroke-width="2"/></svg>`,
            'power-bi-workspace': `
                <svg viewBox="0 0 24 24" class="element-icon-small">
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" fill="none" stroke-width="2"/>
                    <circle cx="8" cy="12" r="2" fill="currentColor"/>
                    <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.6"/>
                    <circle cx="16" cy="12" r="2" fill="currentColor" opacity="0.3"/>
                </svg>`,
            'power-bi-datamart': `
                <svg viewBox="0 0 24 24" class="element-icon-small">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" fill="none" stroke-width="2"/>
                    <circle cx="12" cy="14" r="4" fill="currentColor"/>
                </svg>`,

            // Fabric
            'fabric-lakehouse': `<img style="max-width: 40px;" src="/icones/Lakehouse.png" alt="">`,
            'fabric-warehouse': `<img style="max-width: 40px;" src="/icones/warehouse.png" alt="">`,
            'fabric-pipeline': `<svg viewBox="0 0 24 24" class="element-icon-small"><rect x="2" y="6" width="4" height="12" fill="none" stroke="currentColor" stroke-width="2" rx="1"/><rect x="10" y="6" width="4" height="12" fill="none" stroke="currentColor" stroke-width="2" rx="1"/><rect x="18" y="6" width="4" height="12" fill="none" stroke="currentColor" stroke-width="2" rx="1"/><line x1="6" y1="12" x2="10" y2="12" stroke="currentColor" stroke-width="2"/><line x1="14" y1="12" x2="18" y2="12" stroke="currentColor" stroke-width="2"/></svg>`,
            'fabric-datamart': `<svg viewBox="0 0 24 24" class="element-icon-small"><rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" rx="2"/><line x1="3" y1="8" x2="21" y2="8" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="14" r="4" fill="currentColor" opacity="0.8"/></svg>`,
            'fabric-notebooks': `<svg viewBox="0 0 24 24" class="element-icon-small"><path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="1.5"/><line x1="8" y1="16" x2="16" y2="16" stroke="currentColor" stroke-width="1.5"/></svg>`,
            'fabric-spark': `<svg viewBox="0 0 24 24" class="element-icon-small"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" stroke-width="2"/><line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2"/></svg>`,
            'fabric-eventstream': `<svg viewBox="0 0 24 24" class="element-icon-small"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
            'fabric-kql-db': `
                <svg viewBox="0 0 24 24" class="element-icon-small">
                    <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" fill="none" stroke-width="2"/>
                    <path d="M8 10H16M8 14H13" stroke="currentColor" stroke-width="2"/>
                </svg>`,
            'fabric-realtime': `
                <svg viewBox="0 0 24 24" class="element-icon-small">
                    <polyline points="4,14 8,10 12,14 16,10 20,14" fill="none" stroke="currentColor" stroke-width="2"/>
                </svg>`,
            'fabric-ml-model': `
                <svg viewBox="0 0 24 24" class="element-icon-small">
                    <circle cx="6" cy="12" r="3" fill="currentColor"/>
                    <circle cx="18" cy="12" r="3" fill="currentColor"/>
                    <line x1="9" y1="12" x2="15" y2="12" stroke="currentColor" stroke-width="2"/>
                </svg>`,
            'fabric-capacity': `
                <svg viewBox="0 0 24 24" class="element-icon-small">
                    <rect x="5" y="5" width="14" height="14" rx="3" stroke="currentColor" fill="none" stroke-width="2"/>
                    <rect x="8" y="8" width="8" height="8" fill="currentColor" opacity="0.7"/>
                </svg>`,

            // Azure
            'azure-sql': `<img style="max-width: 40px;" src="/icones/sql_db.png" alt="">`,
            'azure-cosmos': `<svg viewBox="0 0 24 24" class="element-icon-small"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>`,
            'azure-storage': `<svg viewBox="0 0 24 24" class="element-icon-small"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
            'azure-datalake': `<svg viewBox="0 0 24 24" class="element-icon-small"><path d="M12 2L22 8V20C22 21.1 21.1 22 20 22H4C2.9 22 2 21.1 2 20V8L12 2Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 22V12" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 12H17" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
            'azure-synapse': `<svg viewBox="0 0 24 24" class="element-icon-small"><rect x="2" y="6" width="4" height="12" fill="none" stroke="currentColor" stroke-width="2" rx="1"/><rect x="10" y="6" width="4" height="12" fill="none" stroke="currentColor" stroke-width="2" rx="1"/><rect x="18" y="6" width="4" height="12" fill="none" stroke="currentColor" stroke-width="2" rx="1"/><line x1="6" y1="12" x2="10" y2="12" stroke="currentColor" stroke-width="2"/><line x1="14" y1="12" x2="18" y2="12" stroke="currentColor" stroke-width="2"/></svg>`,
            'azure-databricks': `<img style="max-width: 40px" src="/icones/databricks.png" alt="">`,
            'azure-functions': `<svg viewBox="0 0 24 24" class="element-icon-small"><path d="M12 2L22 8V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V8L12 2Z" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="18" stroke="currentColor" stroke-width="2"/><line x1="6" y1="13" x2="18" y2="13" stroke="currentColor" stroke-width="2"/></svg>`,
            'azure-eventhub': `
                    <svg viewBox="0 0 24 24" class="element-icon-small">
                        <circle cx="7" cy="12" r="3" fill="currentColor"/>
                        <circle cx="17" cy="12" r="3" fill="currentColor" opacity="0.5"/>
                        <line x1="10" y1="12" x2="14" y2="12" stroke="currentColor" stroke-width="2"/>
                    </svg>`,
            'azure-apim': `
                    <svg viewBox="0 0 24 24" class="element-icon-small">
                        <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" fill="none" stroke-width="2"/>
                        <path d="M8 12H16" stroke="currentColor" stroke-width="2"/>
                    </svg>`,
            'azure-keyvault': `
                    <svg viewBox="0 0 24 24" class="element-icon-small">
                        <circle cx="12" cy="10" r="4" stroke="currentColor" fill="none" stroke-width="2"/>
                        <rect x="8" y="12" width="8" height="8" rx="2" fill="currentColor"/>
                    </svg>`,
            'azure-aks': `
                    <svg viewBox="0 0 24 24" class="element-icon-small">
                        <polygon points="12,3 21,8 21,16 12,21 3,16 3,8" fill="none" stroke="currentColor" stroke-width="2"/>
                        <circle cx="12" cy="12" r="3" fill="currentColor"/>
                    </svg>`,
            'azure-vm': `
                    <svg viewBox="0 0 24 24" class="element-icon-small">
                        <rect x="5" y="5" width="14" height="10" stroke="currentColor" fill="none" stroke-width="2"/>
                        <rect x="9" y="17" width="6" height="2" fill="currentColor"/>
                    </svg>`,
            'azure-vnet': `
                    <svg viewBox="0 0 24 24" class="element-icon-small">
                        <circle cx="6" cy="12" r="3" fill="currentColor"/>
                        <circle cx="18" cy="12" r="3" fill="currentColor"/>
                        <line x1="9" y1="12" x2="15" y2="12" stroke="currentColor" stroke-width="2"/>
                    </svg>`,
            'azure-datafactory': `
                    <svg viewBox="0 0 24 24" class="element-icon-small">
                        <rect x="3" y="7" width="6" height="10" fill="currentColor"/>
                        <rect x="9" y="5" width="12" height="14" fill="none" stroke="currentColor" stroke-width="2"/>
                    </svg>`,
            'azure-logicapps': `
                    <svg viewBox="0 0 24 24" class="element-icon-small">
                        <rect x="4" y="4" width="6" height="6" fill="currentColor"/>
                        <rect x="14" y="14" width="6" height="6" fill="currentColor" opacity="0.6"/>
                        <line x1="10" y1="7" x2="14" y2="17" stroke="currentColor" stroke-width="2"/>
                    </svg>`,

            // AWS
            'aws-s3': `<svg viewBox="0 0 24 24" class="element-icon-small"><rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" rx="2"/><line x1="3" y1="8" x2="21" y2="8" stroke="currentColor" stroke-width="2"/><line x1="3" y1="16" x2="21" y2="16" stroke="currentColor" stroke-width="2"/><line x1="8" y1="3" x2="8" y2="21" stroke="currentColor" stroke-width="2"/><line x1="16" y1="3" x2="16" y2="21" stroke="currentColor" stroke-width="2"/></svg>`,
            'aws-redshift': `<svg viewBox="0 0 24 24" class="element-icon-small"><rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" rx="2"/><line x1="3" y1="8" x2="21" y2="8" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="14" r="4" fill="currentColor" opacity="0.8"/></svg>`,
            'aws-glue': `<svg viewBox="0 0 24 24" class="element-icon-small"><rect x="2" y="6" width="4" height="12" fill="none" stroke="currentColor" stroke-width="2" rx="1"/><rect x="10" y="6" width="4" height="12" fill="none" stroke="currentColor" stroke-width="2" rx="1"/><rect x="18" y="6" width="4" height="12" fill="none" stroke="currentColor" stroke-width="2" rx="1"/><line x1="6" y1="12" x2="10" y2="12" stroke="currentColor" stroke-width="2"/><line x1="14" y1="12" x2="18" y2="12" stroke="currentColor" stroke-width="2"/></svg>`,
            'aws-lambda': `<svg viewBox="0 0 24 24" class="element-icon-small"><path d="M12 2L22 8V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V8L12 2Z" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="18" stroke="currentColor" stroke-width="2"/><line x1="6" y1="13" x2="18" y2="13" stroke="currentColor" stroke-width="2"/></svg>`,
            'aws-rds': `<svg viewBox="0 0 24 24" class="element-icon-small"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>`,
            'aws-dynamodb': `<svg viewBox="0 0 24 24" class="element-icon-small"><path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="1.5"/><line x1="8" y1="16" x2="16" y2="16" stroke="currentColor" stroke-width="1.5"/></svg>`,
            'aws-emr': `<svg viewBox="0 0 24 24" class="element-icon-small"><rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" rx="2"/><line x1="3" y1="8" x2="21" y2="8" stroke="currentColor" stroke-width="2"/><line x1="3" y1="16" x2="21" y2="16" stroke="currentColor" stroke-width="2"/><line x1="8" y1="3" x2="8" y2="21" stroke="currentColor" stroke-width="2"/><line x1="16" y1="3" x2="16" y2="21" stroke="currentColor" stroke-width="2"/></svg>`,
            'aws-kinesis': `
                    <svg viewBox="0 0 24 24" class="element-icon-small">
                        <path d="M4 12H20" stroke="currentColor" stroke-width="2"/>
                        <path d="M4 8H16" stroke="currentColor" stroke-width="2"/>
                        <path d="M4 16H14" stroke="currentColor" stroke-width="2"/>
                    </svg>`,
            'aws-sqs': `
                    <svg viewBox="0 0 24 24" class="element-icon-small">
                        <rect x="4" y="6" width="16" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
                        <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2"/>
                    </svg>`,
            'aws-sns': `
                    <svg viewBox="0 0 24 24" class="element-icon-small">
                        <circle cx="12" cy="8" r="3" fill="currentColor"/>
                        <circle cx="6" cy="16" r="3" fill="currentColor" opacity="0.6"/>
                        <circle cx="18" cy="16" r="3" fill="currentColor" opacity="0.6"/>
                    </svg>`,
            'aws-athena': `
                    <svg viewBox="0 0 24 24" class="element-icon-small">
                        <polyline points="4,14 8,10 12,14 16,10 20,14" stroke="currentColor" fill="none" stroke-width="2"/>
                        <rect x="6" y="4" width="12" height="4" fill="currentColor"/>
                    </svg>`,
            'aws-ec2': `
                    <svg viewBox="0 0 24 24" class="element-icon-small">
                        <rect x="6" y="6" width="12" height="12" stroke="currentColor" fill="none" stroke-width="2"/>
                    </svg>`,
            'aws-vpc': `
                    <svg viewBox="0 0 24 24" class="element-icon-small">
                        <polygon points="12,3 21,12 12,21 3,12" stroke="currentColor" fill="none" stroke-width="2"/>
                    </svg>`,
            'aws-apigateway': `
                    <svg viewBox="0 0 24 24" class="element-icon-small">
                        <rect x="3" y="5" width="6" height="14" fill="currentColor"/>
                        <rect x="15" y="5" width="6" height="14" fill="currentColor"/>
                    </svg>`,
            'aws-cloudwatch': `
                    <svg viewBox="0 0 24 24" class="element-icon-small">
                        <circle cx="12" cy="12" r="8" stroke="currentColor" fill="none" stroke-width="2"/>
                        <polyline points="8,12 11,15 16,9" stroke="currentColor" fill="none" stroke-width="2"/>
                    </svg>`,

            // GCP
            'gcp-bigquery': `<svg viewBox="0 0 24 24" class="element-icon-small"><rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" rx="2"/><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2"/><line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" stroke-width="2"/></svg>`,
            'gcp-storage': `<svg viewBox="0 0 24 24" class="element-icon-small"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
            'gcp-dataflow': `<svg viewBox="0 0 24 24" class="element-icon-small"><rect x="2" y="6" width="4" height="12" fill="none" stroke="currentColor" stroke-width="2" rx="1"/><rect x="10" y="6" width="4" height="12" fill="none" stroke="currentColor" stroke-width="2" rx="1"/><rect x="18" y="6" width="4" height="12" fill="none" stroke="currentColor" stroke-width="2" rx="1"/><line x1="6" y1="12" x2="10" y2="12" stroke="currentColor" stroke-width="2"/><line x1="14" y1="12" x2="18" y2="12" stroke="currentColor" stroke-width="2"/></svg>`,
            'gcp-functions': `<svg viewBox="0 0 24 24" class="element-icon-small"><path d="M12 2L22 8V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V8L12 2Z" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="18" stroke="currentColor" stroke-width="2"/><line x1="6" y1="13" x2="18" y2="13" stroke="currentColor" stroke-width="2"/></svg>`,
            'gcp-sql': `<svg viewBox="0 0 24 24" class="element-icon-small"><rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" rx="2"/><line x1="3" y1="8" x2="21" y2="8" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="14" r="4" fill="currentColor" opacity="0.8"/></svg>`,
            'gcp-dataproc': `<svg viewBox="0 0 24 24" class="element-icon-small"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" stroke-width="2"/><line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2"/></svg>`,
            'gcp-pubsub': `<svg viewBox="0 0 24 24" class="element-icon-small"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
            'gcp-firestore': `
                <svg viewBox="0 0 24 24" class="element-icon-small">
                    <rect x="6" y="4" width="12" height="16" rx="2" stroke="currentColor" fill="none" stroke-width="2"/>
                    <line x1="10" y1="10" x2="14" y2="10" stroke="currentColor" stroke-width="2"/>
                </svg>`,
            'gcp-vertexai': `
                <svg viewBox="0 0 24 24" class="element-icon-small">
                    <polygon points="12,3 21,12 12,21 3,12" fill="none" stroke="currentColor" stroke-width="2"/>
                    <circle cx="12" cy="12" r="3" fill="currentColor"/>
                </svg>`,
            'gcp-cloudrun': `
                <svg viewBox="0 0 24 24" class="element-icon-small">
                    <polygon points="4,6 20,6 16,18 8,18" stroke="currentColor" fill="none" stroke-width="2"/>
                </svg>`,
            'gcp-gke': `
                <svg viewBox="0 0 24 24" class="element-icon-small">
                    <polygon points="12,3 21,8 21,16 12,21 3,16 3,8" stroke="currentColor" fill="none" stroke-width="2"/>
                    <circle cx="12" cy="12" r="3" fill="currentColor"/>
                </svg>`,
            'gcp-vpc': `
                <svg viewBox="0 0 24 24" class="element-icon-small">
                    <circle cx="6" cy="12" r="3" fill="currentColor"/>
                    <circle cx="18" cy="12" r="3" fill="currentColor"/>
                    <line x1="9" y1="12" x2="15" y2="12" stroke="currentColor" stroke-width="2"/>
                </svg>`,
            'gcp-memorystore': `
                <svg viewBox="0 0 24 24" class="element-icon-small">
                    <rect x="5" y="8" width="14" height="10" fill="currentColor"/>
                    <rect x="5" y="5" width="14" height="3" fill="currentColor" opacity="0.6"/>
                </svg>`,
            'gcp-secretmanager': `
                <svg viewBox="0 0 24 24" class="element-icon-small">
                    <rect x="7" y="5" width="10" height="14" rx="2" stroke="currentColor" fill="none" stroke-width="2"/>
                    <circle cx="12" cy="13" r="2" fill="currentColor"/>
                </svg>`
        };
        return icons[this.type] || '';
    }

    onMouseDown(e) {
        if (e.target.closest('.connection-point')) return;

        selectedElement = this;
        selectElement(this);

        const rect = this.element.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();

        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;

        const onMouseMove = (moveEvent) => {
            let newX = moveEvent.clientX - canvasRect.left + canvas.scrollLeft - dragOffset.x;
            let newY = moveEvent.clientY - canvasRect.top + canvas.scrollTop - dragOffset.y;

            newX = Math.max(0, newX);
            newY = Math.max(0, newY);

            this.x = newX;
            this.y = newY;
            this.element.style.left = `${newX}px`;
            this.element.style.top = `${newY}px`;
            redrawConnections();
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            saveHistory();
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    updatePosition(x, y) {
        this.x = Math.max(0, x);
        this.y = Math.max(0, y);
        if (this.element) {
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;
        }
        redrawConnections();
    }

    remove() {
        if (this.element) {
            this.element.remove();
        }
        this.connections.forEach(conn => {
            const otherElement = elements.find(el => el.id === conn.to);
            if (otherElement) {
                otherElement.connections = otherElement.connections.filter(c => c.from !== this.id);
            }
        });
        elements = elements.filter(el => el.id !== this.id);
        redrawConnections();
    }

    getConnectionPointCoords(point) {
        if (!this.element) return { x: this.x, y: this.y };

        const rect = this.element.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        const x = rect.left - canvasRect.left + canvas.scrollLeft;
        const y = rect.top - canvasRect.top + canvas.scrollTop;
        const width = rect.width;
        const height = rect.height;

        switch (point) {
            case 'top': return { x: x + width / 2, y };
            case 'right': return { x: x + width, y: y + height / 2 };
            case 'bottom': return { x: x + width / 2, y: y + height };
            case 'left': return { x, y: y + height / 2 };
            default: return { x: x + width / 2, y: y + height / 2 };
        }
    }
}

// ===== TOGGLE SIDEBARS =====
toggleLeftBtn.addEventListener('click', () => {
    leftSidebar.classList.toggle('collapsed');
    toggleLeftBtn.textContent = leftSidebar.classList.contains('collapsed') ? '☰' : '✕';
});

toggleRightBtn.addEventListener('click', () => {
    rightSidebar.classList.toggle('collapsed');
    toggleRightBtn.textContent = rightSidebar.classList.contains('collapsed') ? '◀' : '▶';
});

// ===== DROPDOWN DAS SEÇÕES DO SIDEBAR =====
document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', () => {
        const section = header.dataset.section;
        const content = document.querySelector(`.section-content[data-section-content="${section}"]`);
        if (!content) return;

        const caret = header.querySelector('.section-caret');

        content.classList.toggle('collapsed');
        header.classList.toggle('collapsed');

        if (caret) {
            caret.textContent = content.classList.contains('collapsed') ? '▶' : '▼';
        }
    });
});

// ===== DRAG AND DROP DO CANVAS =====
canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
});

canvas.addEventListener('drop', (e) => {
    e.preventDefault();

    const type = e.dataTransfer.getData('type');

    if (type && typeLabels[type]) {
        const canvasRect = canvas.getBoundingClientRect();
        const x = e.clientX - canvasRect.left + canvas.scrollLeft - 60;
        const y = e.clientY - canvasRect.top + canvas.scrollTop - 40;

        const newElement = new DiagramElement(type, x, y);
        elements.push(newElement);
        newElement.render();
        saveHistory();
    }
});

// ===== SIDEBAR DRAG SOURCE =====
const elementItems = document.querySelectorAll('.element-item');

elementItems.forEach(item => {
    item.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('type', item.dataset.type);
    });
});

// ===== SELEÇÃO =====
function selectElement(element) {
    if (selectedElement && selectedElement.element) {
        selectedElement.element.classList.remove('selected');
    }
    selectedElement = element;
    if (element.element) {
        element.element.classList.add('selected');
    }
    updatePropertiesPanel(element);
}

function updatePropertiesPanel(element) {
    if (!element) {
        propertiesContent.innerHTML = '<p class="empty-state">Selecione um elemento para editar</p>';
        return;
    }

    propertiesContent.innerHTML = `
        <div class="property-group">
            <label class="property-label">Tipo</label>
            <input type="text" class="property-input" value="${element.type}" disabled>
        </div>
        <div class="property-group">
            <label class="property-label">Descrição</label>
            <input type="text" class="property-input" id="labelInput" value="${element.label}">
        </div>
        <div class="property-group">
            <label class="property-label">Posição X</label>
            <input type="number" class="property-input" id="xInput" value="${Math.round(element.x)}">
        </div>
        <div class="property-group">
            <label class="property-label">Posição Y</label>
            <input type="number" class="property-input" id="yInput" value="${Math.round(element.y)}">
        </div>
        <div class="property-group">
            <label class="property-label">Conexão</label>
            <p style="font-size: 11px; color: #666; margin: 6px 0;">${element.connections.length} connection(s)</p>
        </div>
    `;

    const labelInput = document.getElementById('labelInput');
    const xInput = document.getElementById('xInput');
    const yInput = document.getElementById('yInput');

    labelInput.addEventListener('change', () => {
        element.label = labelInput.value;
        element.render();
        selectElement(element);
        saveHistory();
    });

    xInput.addEventListener('change', () => {
        element.updatePosition(parseInt(xInput.value, 10), element.y);
        saveHistory();
    });

    yInput.addEventListener('change', () => {
        element.updatePosition(element.x, parseInt(yInput.value, 10));
        saveHistory();
    });
}

canvas.addEventListener('click', (e) => {
    if (e.target === canvas || e.target === connectionsSvg) {
        if (selectedElement && selectedElement.element) {
            selectedElement.element.classList.remove('selected');
        }
        selectedElement = null;
        updatePropertiesPanel(null);
    }
});

// ===== CONEXÕES =====
function startConnection(fromElement, point) {
    isConnecting = true;
    connectingFrom = { element: fromElement, point };
    fromElement.element?.classList.add('connecting');
}

function cancelConnection() {
    if (connectingFrom && connectingFrom.element && connectingFrom.element.element) {
        connectingFrom.element.element.classList.remove('connecting');
    }
    isConnecting = false;
    connectingFrom = null;
    removeTemporaryConnection();
}

function finishConnection(toElement, toPoint) {
    if (!connectingFrom || connectingFrom.element.id === toElement.id) {
        cancelConnection();
        return;
    }

    const from = connectingFrom.element;
    const to = toElement;

    const exists = from.connections.some(conn => conn.to === to.id);
    if (exists) {
        cancelConnection();
        return;
    }

    from.connections.push({ to: to.id, fromPoint: connectingFrom.point, toPoint });

    cancelConnection();
    redrawConnections();
    saveHistory();
}

function drawTemporaryConnection(e) {
    if (!isConnecting || !connectingFrom) return;

    const fromElement = connectingFrom.element;
    const fromPoint = fromElement.getConnectionPointCoords(connectingFrom.point);
    const canvasRect = canvas.getBoundingClientRect();
    const toX = e.clientX - canvasRect.left + canvas.scrollLeft;
    const toY = e.clientY - canvasRect.top + canvas.scrollTop;

    removeTemporaryConnection();

    const midX = (fromPoint.x + toX) / 2;

    const path = document.createElementNS(SVG_NS, 'path');
    const d = `M ${fromPoint.x} ${fromPoint.y} L ${midX} ${fromPoint.y} L ${midX} ${toY} L ${toX} ${toY}`;

    path.setAttribute('d', d);
    path.setAttribute('stroke', 'rgba(15, 23, 42, 0.55)');
    path.setAttribute('stroke-width', '1.6');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-dasharray', '4,4');
    path.setAttribute('fill', 'none');
    path.setAttribute('id', 'temp-connection');

    connectionsSvg.appendChild(path);
}

function removeTemporaryConnection() {
    const temp = document.getElementById('temp-connection');
    if (temp) temp.remove();
}

canvas.addEventListener('mousemove', (e) => {
    if (isConnecting) {
        drawTemporaryConnection(e);
    }
});

canvas.addEventListener('click', (e) => {
    if (isConnecting && !e.target.closest('.diagram-element')) {
        cancelConnection();
    }
});

// ===== DESENHAR CONEXÕES ORTOGONAIS DISCRETAS =====
function redrawConnections() {
    connectionsSvg.innerHTML = '';

    elements.forEach(element => {
        element.connections.forEach(conn => {
            const toElement = elements.find(el => el.id === conn.to);
            if (!toElement) return;

            const fromCoords = element.getConnectionPointCoords(conn.fromPoint);
            const toCoords = toElement.getConnectionPointCoords(conn.toPoint);

            const midX = (fromCoords.x + toCoords.x) / 2;

            const path = document.createElementNS(SVG_NS, 'path');
            const d = `M ${fromCoords.x} ${fromCoords.y} L ${midX} ${fromCoords.y} L ${midX} ${toCoords.y} L ${toCoords.x} ${toCoords.y}`;

            path.setAttribute('d', d);
            path.setAttribute('stroke', 'rgba(15, 23, 42, 0.35)');
            path.setAttribute('stroke-width', '1.6');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            path.setAttribute('fill', 'none');

            connectionsSvg.appendChild(path);
        });
    });
}

// ===== HISTÓRICO =====
function saveHistory() {
    const state = elements.map(el => ({
        id: el.id,
        type: el.type,
        x: el.x,
        y: el.y,
        label: el.label,
        connections: el.connections
    }));
    history.push(JSON.stringify(state));
    if (history.length > 50) history.shift();
}

function undo() {
    if (history.length <= 1) return;
    history.pop();
    const state = JSON.parse(history[history.length - 1]);

    elements = [];
    while (canvas.firstChild) {
        canvas.removeChild(canvas.firstChild);
    }

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.id = 'connections-svg';
    svg.classList.add('connections-svg');
    canvas.appendChild(svg);

    const newSvg = document.getElementById('connections-svg');
    if (newSvg) {
        newSvg.innerHTML = '';
    }

    state.forEach(data => {
        const element = new DiagramElement(data.type, data.x, data.y);
        element.id = data.id;
        element.label = data.label;
        element.connections = data.connections || [];
        elements.push(element);
        element.render();
    });

    redrawConnections();
    selectedElement = null;
    updatePropertiesPanel(null);
}

// ===== BOTÕES =====
clearBtn.addEventListener('click', () => {
    if (confirm('Clear all elements?')) {
        elements = [];
        history = [];
        selectedElement = null;
        updatePropertiesPanel(null);

        while (canvas.firstChild) {
            canvas.removeChild(canvas.firstChild);
        }

        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.id = 'connections-svg';
        svg.classList.add('connections-svg');
        canvas.appendChild(svg);
        saveHistory();
    }
});

deleteBtn.addEventListener('click', () => {
    if (selectedElement) {
        selectedElement.remove();
        selectedElement = null;
        updatePropertiesPanel(null);
        saveHistory();
    }
});

undoBtn.addEventListener('click', undo);

exportBtn.addEventListener("click", async () => {
    const notyf = new Notyf();

    notyf.success("Exportando imagem...");

    const canvasArea = document.querySelector(".canvas");

    html2canvas(canvasArea, {
        backgroundColor: null,
        scale: 2, // PNG mais nítido
        logging: false
    }).then((canvasRendered) => {
        const img = canvasRendered.toDataURL("image/png");

        const downloadLink = document.createElement("a");
        downloadLink.href = img;
        downloadLink.download = "diagrama.png";
        downloadLink.click();

        notyf.success("PNG exportado com sucesso!");
    });
});


// Dropdown moderno lateral
document.querySelectorAll('.dropdown-category').forEach(category => {
    const toggle = category.querySelector('.dropdown-toggle');
    const content = category.querySelector('.dropdown-content');

    category.classList.remove('open');

    toggle.addEventListener('click', () => {
        const isOpen = category.classList.contains('open');

        if (isOpen) {
            category.classList.remove('open');
        } else {
            category.classList.add('open');
        }
    });
});

// Google Analytics

window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-RY77B4ZVWP'); 

// ===== INICIALIZAÇÃO =====
saveHistory();
