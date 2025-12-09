// ===== CONFIGURAÇÃO E ESTADO =====
const canvas = document.getElementById('canvas');
let connectionsSvg = document.getElementById('connections-svg');
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

        if (this.type.startsWith('shape-')) {
            div.classList.add('shape-element', this.type);
        }

        const iconSvg = this.getIconSVG();
        let extraContent = '';

        if (this.type === 'shape-button') {
            extraContent = `<button class="shape-button-preview">Botão</button>`;
        } else if (this.type === 'shape-text') {
            extraContent = `<div class="shape-text-preview">${this.label}</div>`;
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

            <div class="connection-arrow top" data-point="top">
                <svg viewBox="0 0 24 24">
                    <path d="M12 4L6 12H10V20H14V12H18Z"/>
                </svg>
            </div>

            <div class="connection-arrow right" data-point="right">
                <svg viewBox="0 0 24 24">
                    <path d="M20 12L12 6V10H4V14H12V18Z"/>
                </svg>
            </div>

            <div class="connection-arrow bottom" data-point="bottom">
                <svg viewBox="0 0 24 24">
                    <path d="M12 20L6 12H10V4H14V12H18Z"/>
                </svg>
            </div>

            <div class="connection-arrow left" data-point="left">
                <svg viewBox="0 0 24 24">
                    <path d="M4 12L12 6V10H20V14H12V18Z"/>
                </svg>
            </div>
        `;

        // drag do bloco. ignora clique em seta e bolinha
        div.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.connection-point') || e.target.closest('.connection-arrow')) {
                return;
            }
            this.onPointerDown(e);
        });

        // seleção do bloco
        div.addEventListener('click', (e) => {
            if (!e.target.closest('.connection-point') && !e.target.closest('.connection-arrow')) {
                selectElement(this);
            }
        });

        // setas
        const arrows = div.querySelectorAll('.connection-arrow');
        arrows.forEach(arrow => {
            arrow.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const side = arrow.dataset.point;
                if (isConnecting) {
                    finishConnection(this, side);
                } else {
                    startConnection(this, side);
                }
            });
        });

        // bolinhas
        const points = div.querySelectorAll('.connection-point');
        points.forEach(point => {
            point.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const side = point.dataset.point;
                if (isConnecting) {
                    finishConnection(this, side);
                } else {
                    startConnection(this, side);
                }
            });
        });

        // texto editável
        if (this.type === 'shape-text') {
            div.addEventListener('dblclick', () => {
                const span = div.querySelector('.shape-text-preview');
                if (!span) return;
                const novo = prompt('Texto do bloco:', this.label);
                if (novo !== null) {
                    this.label = novo;
                    span.textContent = novo;
                    const headerLabel = div.querySelector('.element-label');
                    if (headerLabel) headerLabel.textContent = novo;
                    updatePropertiesPanel(this);
                    saveHistory();
                }
            });
        }

        this.element = div;
        canvas.appendChild(div);

        // seleciona depois de renderizar
        requestAnimationFrame(() => {
            selectElement(this);
            redrawConnections();
        });
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
            'power-bi-service': `<img style="max-width: 40px; border-radius: 10px;" src="/icones/service.png" alt="">`,
            'power-bi-report': `<img style="max-width: 40px;" src="/icones/report.png" alt="">`,
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
                <img style="max-width: 40px;" src="/icones/datamart.png" alt="">`,

            // Fabric
            'fabric-lakehouse': `
            <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 64 64" fill="none" x="385" y="64">
                        <path d="M10 11C10 7.13401 13.134 4 17 4H47C50.866 4 54 7.13401 54 11V53C54 56.866 50.866 60 47 60H17C13.134 60 10 56.866 10 53V11Z" fill="url(#iupaint0_linear_41743_63362)"/>
                        <path d="M10 11C10 7.13401 13.134 4 17 4H47C50.866 4 54 7.13401 54 11V53C54 56.866 50.866 60 47 60H17C13.134 60 10 56.866 10 53V11Z" fill="url(#iupaint1_radial_41743_63362)" fill-opacity="0.2"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M47 5H17C13.6863 5 11 7.68629 11 11V53C11 56.3137 13.6863 59 17 59H47C50.3137 59 53 56.3137 53 53V11C53 7.68629 50.3137 5 47 5ZM17 4C13.134 4 10 7.13401 10 11V53C10 56.866 13.134 60 17 60H47C50.866 60 54 56.866 54 53V11C54 7.13401 50.866 4 47 4H17Z" fill="url(#iupaint2_linear_41743_63362)"/>
                        <path d="M32.8374 45.9999H21C19.8954 45.9999 19 45.1045 19 43.9999V30.8881C19 30.3226 19.2394 29.7835 19.659 29.4043L30.6599 19.462C31.4215 18.7737 32.5805 18.7737 33.342 19.4621L44.3411 29.4044C44.7606 29.7835 45 30.3226 45 30.888V40.0038C44.843 39.9493 44.6746 39.9201 44.5001 39.9201C43.8801 39.9201 43.3401 40.2801 43.1101 40.8501C43.1001 40.8901 43.0501 40.9401 43.0001 40.9801C42.9501 40.9401 42.9101 40.8901 42.8901 40.8501C42.8509 40.7521 42.8012 40.6601 42.7425 40.5751C42.4703 40.1705 42.0115 39.9201 41.5001 39.9201C41.058 39.9201 40.6566 40.1031 40.3792 40.4148C40.2659 40.5372 40.174 40.6802 40.1101 40.8401C40.1001 40.8801 40.0501 40.9301 40.0001 40.9701C39.9501 40.9301 39.9101 40.8801 39.8901 40.8401C39.6601 40.2801 39.1301 39.9101 38.4901 39.9101C38.0833 39.9166 37.7109 40.0782 37.4408 40.3524C37.2989 40.4876 37.1852 40.6522 37.1101 40.8401C37.1001 40.8801 37.0501 40.9301 37.0001 40.9701C36.9501 40.9301 36.9101 40.8801 36.8901 40.8401C36.6601 40.2801 36.1301 39.9101 35.4901 39.9101C34.8701 39.9201 34.3301 40.2901 34.1101 40.8701C34.0701 40.9601 34.0501 41.0001 34.0501 41.0001C34.0301 41.0101 34.0001 41.0201 33.9201 41.0401C33.1201 41.2201 32.6101 42.0301 32.7901 42.8301C32.9257 43.4539 33.4291 43.906 34.0564 43.9871L34.0501 44.0001C34.0301 44.0101 34.0001 44.0201 33.9201 44.0401C33.1201 44.2201 32.6101 45.0301 32.7901 45.8301C32.8027 45.8882 32.8185 45.9449 32.8374 45.9999Z" fill="url(#iupaint3_linear_41743_63362)"/>
                        <path d="M35.7594 42.5443C35.6783 42.4801 35.6014 42.4106 35.5295 42.3371C35.4716 42.4027 35.4092 42.4644 35.3421 42.522C35.0607 42.7637 34.7286 42.9047 34.3599 42.9877C34.0905 43.0483 33.8229 42.8791 33.7623 42.6096C33.7017 42.3402 33.8709 42.0727 34.1404 42.0121C34.3966 41.9544 34.5654 41.871 34.6907 41.7634C34.8161 41.6557 34.9312 41.4952 35.034 41.2304C35.1048 41.0479 35.271 40.9306 35.4534 40.9133C35.4687 40.9119 35.4839 40.9112 35.4991 40.9111C35.6968 40.9107 35.8842 41.0283 35.9634 41.2226C36.0361 41.401 36.1834 41.6045 36.3804 41.7605C36.5759 41.9154 36.7893 41.9999 36.9926 41.9999C37.1969 41.9999 37.4151 41.9146 37.6154 41.7583C37.8127 41.6043 37.9597 41.4062 38.0327 41.2338C38.0803 41.1086 38.1777 41.0027 38.3115 40.9482C38.3733 40.923 38.4373 40.9111 38.5003 40.9111C38.5632 40.9111 38.6272 40.923 38.689 40.9482C38.8229 41.0028 38.9203 41.1087 38.9679 41.2339C39.0421 41.4096 39.1873 41.6078 39.3801 41.7605C39.5756 41.9154 39.789 41.9999 39.9923 41.9999C40.1966 41.9999 40.4149 41.9146 40.6152 41.7583C40.8159 41.6016 40.9646 41.3993 41.0362 41.2248L41.0382 41.2199C41.091 41.0925 41.1905 40.9983 41.3088 40.9493L41.3201 40.9448C41.4321 40.9016 41.5598 40.8983 41.6801 40.9448L41.6915 40.9493C41.8106 40.9987 41.9107 41.0938 41.9632 41.2226C42.0359 41.401 42.1832 41.6045 42.3801 41.7605C42.5756 41.9154 42.789 41.9999 42.9923 41.9999C43.1966 41.9999 43.4149 41.9146 43.6152 41.7583C43.8167 41.6009 43.9658 41.3976 44.0371 41.2226C44.0895 41.0939 44.1894 40.9989 44.3084 40.9495C44.3209 40.9443 44.3336 40.9396 44.3465 40.9354C44.3977 40.9189 44.4499 40.911 44.5013 40.9111C44.5638 40.9113 44.6273 40.9232 44.6888 40.9482C44.7539 40.9748 44.8104 41.0134 44.8567 41.0606C44.9031 41.1077 44.9408 41.1648 44.9663 41.2304C45.069 41.4952 45.1842 41.6557 45.3096 41.7634C45.4349 41.871 45.6037 41.9544 45.8599 42.0121C46.1293 42.0727 46.2986 42.3402 46.2379 42.6096C46.1773 42.8791 45.9098 43.0483 45.6404 42.9877C45.2716 42.9047 44.9395 42.7637 44.6581 42.522C44.5902 42.4637 44.5271 42.4011 44.4685 42.3345C44.394 42.41 44.3144 42.4811 44.2305 42.5466C43.9015 42.8033 43.4728 42.9999 42.9923 42.9999C42.5109 42.9999 42.0851 42.8025 41.7592 42.5443C41.6661 42.4706 41.5786 42.39 41.4979 42.3043C41.4151 42.391 41.3255 42.4724 41.2305 42.5466C40.9015 42.8033 40.4728 42.9999 39.9923 42.9999C39.5109 42.9999 39.0851 42.8025 38.7592 42.5443C38.6661 42.4706 38.5787 42.3901 38.498 42.3044C38.4153 42.3911 38.3257 42.4724 38.2307 42.5466C37.9017 42.8033 37.473 42.9999 36.9926 42.9999C36.5111 42.9999 36.0853 42.8025 35.7594 42.5443Z" fill="url(#iupaint4_linear_41743_63362)"/>
                        <path d="M35.7594 45.5443C35.6783 45.4801 35.6014 45.4106 35.5295 45.3371C35.4716 45.4027 35.4092 45.4644 35.3421 45.522C35.0607 45.7637 34.7286 45.9047 34.3599 45.9877C34.0905 46.0483 33.8229 45.8791 33.7623 45.6096C33.7017 45.3402 33.8709 45.0727 34.1404 45.0121C34.3966 44.9544 34.5654 44.871 34.6907 44.7634C34.8161 44.6557 34.9312 44.4952 35.034 44.2304C35.1048 44.0479 35.271 43.9306 35.4534 43.9133C35.4687 43.9119 35.4839 43.9112 35.4991 43.9111C35.6968 43.9107 35.8842 44.0283 35.9634 44.2226C36.0361 44.401 36.1834 44.6045 36.3804 44.7605C36.5759 44.9154 36.7893 44.9999 36.9926 44.9999C37.1969 44.9999 37.4151 44.9146 37.6154 44.7583C37.8127 44.6043 37.9597 44.4062 38.0327 44.2338C38.0803 44.1086 38.1777 44.0027 38.3115 43.9482C38.3733 43.923 38.4373 43.9111 38.5003 43.9111C38.5632 43.9111 38.6272 43.923 38.689 43.9482C38.8229 44.0028 38.9203 44.1087 38.9679 44.2339C39.0421 44.4096 39.1873 44.6078 39.3801 44.7605C39.5756 44.9154 39.789 44.9999 39.9923 44.9999C40.1966 44.9999 40.4149 44.9146 40.6152 44.7583C40.8159 44.6016 40.9646 44.3993 41.0362 44.2248L41.0382 44.2199C41.091 44.0925 41.1905 43.9983 41.3088 43.9493C41.3126 43.9478 41.3163 43.9463 41.3201 43.9448C41.4321 43.9016 41.5598 43.8983 41.6801 43.9448C41.6839 43.9463 41.6877 43.9478 41.6915 43.9493C41.8106 43.9987 41.9107 44.0938 41.9632 44.2226C42.0359 44.401 42.1832 44.6045 42.3801 44.7605C42.5756 44.9154 42.789 44.9999 42.9923 44.9999C43.1966 44.9999 43.4149 44.9146 43.6152 44.7583C43.8167 44.6009 43.9658 44.3976 44.0371 44.2226C44.0895 44.0939 44.1894 43.9989 44.3084 43.9495C44.3209 43.9443 44.3336 43.9396 44.3465 43.9354C44.3977 43.9189 44.4499 43.911 44.5013 43.9111C44.5638 43.9113 44.6273 43.9232 44.6888 43.9482C44.7539 43.9748 44.8104 44.0134 44.8567 44.0606C44.9031 44.1077 44.9408 44.1648 44.9663 44.2304C45.069 44.4952 45.1842 44.6557 45.3096 44.7634C45.4349 44.871 45.6037 44.9544 45.8599 45.0121C46.1293 45.0727 46.2986 45.3402 46.2379 45.6096C46.1773 45.8791 45.9098 46.0483 45.6404 45.9877C45.2716 45.9047 44.9395 45.7637 44.6581 45.522C44.5902 45.4637 44.5271 45.4011 44.4685 45.3345C44.394 45.41 44.3144 45.4811 44.2305 45.5466C43.9015 45.8033 43.4728 45.9999 42.9923 45.9999C42.5109 45.9999 42.0851 45.8025 41.7592 45.5443C41.6661 45.4706 41.5786 45.39 41.4979 45.3043C41.4151 45.391 41.3255 45.4724 41.2305 45.5466C40.9015 45.8033 40.4728 45.9999 39.9923 45.9999C39.5109 45.9999 39.0851 45.8025 38.7592 45.5443C38.6661 45.4706 38.5787 45.3901 38.498 45.3044C38.4153 45.3911 38.3257 45.4724 38.2307 45.5466C37.9017 45.8033 37.473 45.9999 36.9926 45.9999C36.5111 45.9999 36.0853 45.8025 35.7594 45.5443Z" fill="url(#iupaint5_linear_41743_63362)"/>
                        <defs>
                        <linearGradient id="iupaint0_linear_41743_63362" x1="22.2222" y1="4" x2="31.1528" y2="60.1348" gradientUnits="userSpaceOnUse">
                        <stop stop-color="white"/>
                        <stop offset="1" stop-color="#EBEBEB"/>
                        </linearGradient>
                        <radialGradient id="iupaint1_radial_41743_63362" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(24.0556 18.5833) rotate(62.354) scale(50.0471 38.5706)">
                        <stop offset="0.177083" stop-color="white"/>
                        <stop offset="1" stop-color="#B8B8B8"/>
                        </radialGradient>
                        <linearGradient id="iupaint2_linear_41743_63362" x1="24.2083" y1="4" x2="33.7019" y2="59.9445" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#BBBBBB"/>
                        <stop offset="1" stop-color="#888888"/>
                        </linearGradient>
                        <linearGradient id="iupaint3_linear_41743_63362" x1="19" y1="18.9458" x2="46.0535" y2="46.1953" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#3477EA"/>
                        <stop offset="1" stop-color="#1D53A4"/>
                        </linearGradient>
                        <linearGradient id="iupaint4_linear_41743_63362" x1="19" y1="18.9458" x2="46.0535" y2="46.1953" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#3477EA"/>
                        <stop offset="1" stop-color="#1D53A4"/>
                        </linearGradient>
                        <linearGradient id="iupaint5_linear_41743_63362" x1="19" y1="18.9458" x2="46.0535" y2="46.1953" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#3477EA"/>
                        <stop offset="1" stop-color="#1D53A4"/>
                        </linearGradient>
                        </defs>
                    </svg>
            `,
            
            'fabric-warehouse': `
            <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 64 64" fill="none" x="193" y="64">
                        <path d="M10 11C10 7.13401 13.134 4 17 4H47C50.866 4 54 7.13401 54 11V53C54 56.866 50.866 60 47 60H17C13.134 60 10 56.866 10 53V11Z" fill="url(#dbpaint0_linear_41743_62523)"/>
                        <path d="M10 11C10 7.13401 13.134 4 17 4H47C50.866 4 54 7.13401 54 11V53C54 56.866 50.866 60 47 60H17C13.134 60 10 56.866 10 53V11Z" fill="url(#dbpaint1_radial_41743_62523)" fill-opacity="0.2"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M47 5H17C13.6863 5 11 7.68629 11 11V53C11 56.3137 13.6863 59 17 59H47C50.3137 59 53 56.3137 53 53V11C53 7.68629 50.3137 5 47 5ZM17 4C13.134 4 10 7.13401 10 11V53C10 56.866 13.134 60 17 60H47C50.866 60 54 56.866 54 53V11C54 7.13401 50.866 4 47 4H17Z" fill="url(#dbpaint2_linear_41743_62523)"/>
                        <path d="M30.9 46H43C44.1046 46 45 45.1046 45 44V30.8881C45 30.3227 44.7606 29.7836 44.3411 29.4044L33.342 19.4622C32.5805 18.7738 31.4215 18.7738 30.6599 19.4621L19.659 29.4044C19.2394 29.7836 19 30.3227 19 30.8882V44C19 45.1046 19.8954 46 21 46H33.1" fill="url(#dbpaint3_linear_41743_62523)"/>
                        <path d="M26.5 33.5C26.5 34.3284 25.8284 35 25 35C24.1716 35 23.5 34.3284 23.5 33.5C23.5 32.6716 24.1716 32 25 32C25.8284 32 26.5 32.6716 26.5 33.5Z" fill="#B4CDF8"/>
                        <path d="M33.5 33.5C33.5 34.3284 32.8284 35 32 35C31.1716 35 30.5 34.3284 30.5 33.5C30.5 32.6716 31.1716 32 32 32C32.8284 32 33.5 32.6716 33.5 33.5Z" fill="#B4CDF8"/>
                        <path d="M39 35C39.8284 35 40.5 34.3284 40.5 33.5C40.5 32.6716 39.8284 32 39 32C38.1716 32 37.5 32.6716 37.5 33.5C37.5 34.3284 38.1716 35 39 35Z" fill="#B4CDF8"/>
                        <path d="M33.5 39.5C33.5 40.3284 32.8284 41 32 41C31.1716 41 30.5 40.3284 30.5 39.5C30.5 38.6716 31.1716 38 32 38C32.8284 38 33.5 38.6716 33.5 39.5Z" fill="#B4CDF8"/>
                        <path d="M25 41C25.8284 41 26.5 40.3284 26.5 39.5C26.5 38.6716 25.8284 38 25 38C24.1716 38 23.5 38.6716 23.5 39.5C23.5 40.3284 24.1716 41 25 41Z" fill="#B4CDF8"/>
                        <path d="M40.5 39.5C40.5 40.3284 39.8284 41 39 41C38.1716 41 37.5 40.3284 37.5 39.5C37.5 38.6716 38.1716 38 39 38C39.8284 38 40.5 38.6716 40.5 39.5Z" fill="#B4CDF8"/>
                        <defs>
                        <linearGradient id="dbpaint0_linear_41743_62523" x1="22.2222" y1="4" x2="31.1528" y2="60.1348" gradientUnits="userSpaceOnUse">
                        <stop stop-color="white"/>
                        <stop offset="1" stop-color="#EBEBEB"/>
                        </linearGradient>
                        <radialGradient id="dbpaint1_radial_41743_62523" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(24.0556 18.5833) rotate(62.354) scale(50.0471 38.5706)">
                        <stop offset="0.177083" stop-color="white"/>
                        <stop offset="1" stop-color="#B8B8B8"/>
                        </radialGradient>
                        <linearGradient id="dbpaint2_linear_41743_62523" x1="24.2083" y1="4" x2="33.7019" y2="59.9445" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#BBBBBB"/>
                        <stop offset="1" stop-color="#888888"/>
                        </linearGradient>
                        <linearGradient id="dbpaint3_linear_41743_62523" x1="19" y1="18.25" x2="46.6912" y2="44.195" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#3477EA"/>
                        <stop offset="1" stop-color="#1D53A4"/>
                        </linearGradient>
                        </defs>
                    </svg>
            `,
            
            'fabric-pipeline': `
            <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" x="672" y="720">
                <path d="M2 5C2 3.34315 3.34315 2 5 2H19C20.6569 2 22 3.34315 22 5V19C22 20.6569 20.6569 22 19 22H5C3.34315 22 2 20.6569 2 19V5Z" fill="url(#lgpaint0_linear_41743_63178)"/>
                <path d="M2 5C2 3.34315 3.34315 2 5 2H19C20.6569 2 22 3.34315 22 5V19C22 20.6569 20.6569 22 19 22H5C3.34315 22 2 20.6569 2 19V5Z" fill="url(#lgpaint1_radial_41743_63178)" fill-opacity="0.2"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3ZM5 2C3.34315 2 2 3.34315 2 5V19C2 20.6569 3.34315 22 5 22H19C20.6569 22 22 20.6569 22 19V5C22 3.34315 20.6569 2 19 2H5Z" fill="url(#lgpaint2_linear_41743_63178)"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 6.75C6.67157 6.75 6 7.42157 6 8.25V16.25C6 17.0784 6.67157 17.75 7.5 17.75C8.32843 17.75 9 17.0784 9 16.25V15H15V16.25C15 17.0784 15.6716 17.75 16.5 17.75C17.3284 17.75 18 17.0784 18 16.25V8.25C18 7.42157 17.3284 6.75 16.5 6.75C15.6716 6.75 15 7.42157 15 8.25V9H9V8.25C9 7.42157 8.32843 6.75 7.5 6.75ZM8 16.25V8.25C8 7.97386 7.77614 7.75 7.5 7.75C7.22386 7.75 7 7.97386 7 8.25V16.25C7 16.5261 7.22386 16.75 7.5 16.75C7.77614 16.75 8 16.5261 8 16.25ZM17 8.25V16.25C17 16.5261 16.7761 16.75 16.5 16.75C16.2239 16.75 16 16.5261 16 16.25V8.25C16 7.97386 16.2239 7.75 16.5 7.75C16.7761 7.75 17 7.97386 17 8.25Z" fill="url(#lgpaint3_linear_41743_63178)"/>
                <defs>
                <linearGradient id="lgpaint0_linear_41743_63178" x1="7.55556" y1="2" x2="10.0855" y2="22.2393" gradientUnits="userSpaceOnUse">
                <stop stop-color="white"/>
                <stop offset="1" stop-color="#EBEBEB"/>
                </linearGradient>
                <radialGradient id="lgpaint1_radial_41743_63178" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(8.38889 7.20833) rotate(56.3099) scale(19.0293 16.4677)">
                <stop offset="0.177083" stop-color="white"/>
                <stop offset="1" stop-color="#B8B8B8"/>
                </radialGradient>
                <linearGradient id="lgpaint2_linear_41743_63178" x1="8.45833" y1="2" x2="11.1512" y2="22.1965" gradientUnits="userSpaceOnUse">
                <stop stop-color="#BBBBBB"/>
                <stop offset="1" stop-color="#888888"/>
                </linearGradient>
                <linearGradient id="lgpaint3_linear_41743_63178" x1="6" y1="6.75" x2="16.9585" y2="18.7047" gradientUnits="userSpaceOnUse">
                <stop stop-color="#4BA446"/>
                <stop offset="1" stop-color="#3F7D35"/>
                </linearGradient>
                </defs>
            </svg>
            `,
            'fabric-datamart': `<svg viewBox="0 0 24 24" class="element-icon-small"><rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" rx="2"/><line x1="3" y1="8" x2="21" y2="8" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="14" r="4" fill="currentColor" opacity="0.8"/></svg>`,
            
            'fabric-notebooks': `
            <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 32 32" fill="none" x="698" y="608">
                        <path d="M5 5.5C5 3.567 6.567 2 8.5 2H23.5C25.433 2 27 3.567 27 5.5V26.5C27 28.433 25.433 30 23.5 30H8.5C6.567 30 5 28.433 5 26.5V5.5Z" fill="url(#kbpaint0_linear_41743_63240)"/>
                        <path d="M5 5.5C5 3.567 6.567 2 8.5 2H23.5C25.433 2 27 3.567 27 5.5V26.5C27 28.433 25.433 30 23.5 30H8.5C6.567 30 5 28.433 5 26.5V5.5Z" fill="url(#kbpaint1_radial_41743_63240)" fill-opacity="0.2"/>
                        <path d="M17.4942 8.52122C17.7587 8.60057 17.9088 8.87931 17.8294 9.14381L15.1294 18.1438C15.0501 18.4083 14.7714 18.5584 14.5069 18.479C14.2424 18.3997 14.0923 18.121 14.1716 17.8565L16.8716 8.85646C16.951 8.59196 17.2297 8.44187 17.4942 8.52122Z" fill="url(#kbpaint2_linear_41743_63240)"/>
                        <path d="M18.7968 10.4463C18.9921 10.251 19.3087 10.251 19.504 10.4463L22.1332 13.0755C22.3676 13.3099 22.3676 13.6898 22.1332 13.9241L19.504 16.5534C19.3087 16.7486 18.9921 16.7486 18.7968 16.5534C18.6016 16.3581 18.6016 16.0415 18.7968 15.8463L21.1433 13.4998L18.7968 11.1534C18.6016 10.9581 18.6016 10.6415 18.7968 10.4463Z" fill="url(#kbpaint3_linear_41743_63240)"/>
                        <path d="M12.4961 10.4463C12.6913 10.251 13.0079 10.251 13.2032 10.4463C13.3984 10.6415 13.3984 10.9581 13.2032 11.1534L10.8567 13.4998L13.2032 15.8463C13.3984 16.0415 13.3984 16.3581 13.2032 16.5534C13.0079 16.7486 12.6913 16.7486 12.4961 16.5534L9.86678 13.9241C9.63246 13.6898 9.63246 13.3099 9.86678 13.0755L12.4961 10.4463Z" fill="url(#kbpaint4_linear_41743_63240)"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M5 26.5V5.5C5 3.567 6.567 2 8.5 2H23.5C25.433 2 27 3.567 27 5.5V26.5C27 28.433 25.433 30 23.5 30H8.5C6.567 30 5 28.433 5 26.5ZM8.5 3H23.5C24.8807 3 26 4.11929 26 5.5V20C26 21.6569 24.6569 23 23 23H8.5C7.52066 23 6.63526 23.4022 6 24.0505V5.5C6 4.11929 7.11929 3 8.5 3ZM26 25.6458V26.5C26 27.8807 24.8807 29 23.5 29H8.5C7.11929 29 6 27.8807 6 26.5C6 25.1193 7.11929 24 8.5 24H23C24.1947 24 25.2671 23.4762 26 22.6458V23C26 24.6569 24.6569 26 23 26H8C7.72386 26 7.5 26.2239 7.5 26.5C7.5 26.7761 7.72386 27 8 27H23C24.1947 27 25.2671 26.4762 26 25.6458Z" fill="url(#kbpaint5_linear_41743_63240)"/>
                        <defs>
                        <linearGradient id="kbpaint0_linear_41743_63240" x1="11.1111" y1="2" x2="15.5764" y2="30.0674" gradientUnits="userSpaceOnUse">
                        <stop stop-color="white"/>
                        <stop offset="1" stop-color="#EBEBEB"/>
                        </linearGradient>
                        <radialGradient id="kbpaint1_radial_41743_63240" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(12.0278 9.29167) rotate(62.354) scale(25.0236 19.2853)">
                        <stop offset="0.177083" stop-color="white"/>
                        <stop offset="1" stop-color="#B8B8B8"/>
                        </radialGradient>
                        <linearGradient id="kbpaint2_linear_41743_63240" x1="9.69104" y1="8.5" x2="19.427" y2="20.7844" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#4BA446"/>
                        <stop offset="1" stop-color="#3F7D35"/>
                        </linearGradient>
                        <linearGradient id="kbpaint3_linear_41743_63240" x1="9.69104" y1="8.5" x2="19.427" y2="20.7844" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#4BA446"/>
                        <stop offset="1" stop-color="#3F7D35"/>
                        </linearGradient>
                        <linearGradient id="kbpaint4_linear_41743_63240" x1="9.69104" y1="8.5" x2="19.427" y2="20.7844" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#4BA446"/>
                        <stop offset="1" stop-color="#3F7D35"/>
                        </linearGradient>
                        <linearGradient id="kbpaint5_linear_41743_63240" x1="12.1042" y1="2" x2="16.851" y2="29.9723" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#BBBBBB"/>
                        <stop offset="1" stop-color="#888888"/>
                        </linearGradient>
                        </defs>
                    </svg>
            `,

            'fabric-spark': `
            <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 64 64" fill="none" x="64" y="448">
                <path d="M6 13C6 9.13401 9.13401 6 13 6H51C54.866 6 58 9.13401 58 13V51C58 54.866 54.866 58 51 58H13C9.13401 58 6 54.866 6 51V13Z" fill="url(#nhpaint0_linear_41743_63031)"/>
                <path d="M6 13C6 9.13401 9.13401 6 13 6H51C54.866 6 58 9.13401 58 13V51C58 54.866 54.866 58 51 58H13C9.13401 58 6 54.866 6 51V13Z" fill="url(#nhpaint1_radial_41743_63031)" fill-opacity="0.2"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M51 7H13C9.68629 7 7 9.68629 7 13V51C7 54.3137 9.68629 57 13 57H51C54.3137 57 57 54.3137 57 51V13C57 9.68629 54.3137 7 51 7ZM13 6C9.13401 6 6 9.13401 6 13V51C6 54.866 9.13401 58 13 58H51C54.866 58 58 54.866 58 51V13C58 9.13401 54.866 6 51 6H13Z" fill="url(#nhpaint2_linear_41743_63031)"/>
                <path d="M32.0049 18C32.4191 18 32.7549 18.3358 32.7549 18.75V30.7007L43.1044 24.7254C43.4631 24.5183 43.9218 24.6412 44.1289 24.9999C44.336 25.3586 44.2131 25.8173 43.8544 26.0244L33.5047 31.9998L43.855 37.9756C44.2138 38.1827 44.3367 38.6414 44.1296 39.0001C43.9225 39.3588 43.4638 39.4817 43.105 39.2746L32.7549 33.299V45.25C32.7549 45.6642 32.4191 46 32.0049 46C31.5907 46 31.2549 45.6642 31.2549 45.25V33.2987L20.9047 39.2744C20.546 39.4815 20.0873 39.3586 19.8802 38.9999C19.6731 38.6412 19.796 38.1825 20.1547 37.9754L30.5047 31.9998L20.1554 26.0246C19.7967 25.8175 19.6737 25.3588 19.8809 25.0001C20.088 24.6414 20.5467 24.5185 20.9054 24.7256L31.2549 30.7009V18.75C31.2549 18.3358 31.5907 18 32.0049 18Z" fill="url(#nhpaint3_linear_41743_63031)"/>
                <defs>
                <linearGradient id="nhpaint0_linear_41743_63031" x1="20.4444" y1="6" x2="27.0222" y2="58.6222" gradientUnits="userSpaceOnUse">
                <stop stop-color="white"/>
                <stop offset="1" stop-color="#EBEBEB"/>
                </linearGradient>
                <radialGradient id="nhpaint1_radial_41743_63031" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(22.6111 19.5417) rotate(56.3099) scale(49.4762 42.8159)">
                <stop offset="0.177083" stop-color="white"/>
                <stop offset="1" stop-color="#B8B8B8"/>
                </radialGradient>
                <linearGradient id="nhpaint2_linear_41743_63031" x1="22.7917" y1="6" x2="29.7931" y2="58.5109" gradientUnits="userSpaceOnUse">
                <stop stop-color="#BBBBBB"/>
                <stop offset="1" stop-color="#888888"/>
                </linearGradient>
                <linearGradient id="nhpaint3_linear_41743_63031" x1="19.7796" y1="18" x2="47.5243" y2="42.2277" gradientUnits="userSpaceOnUse">
                <stop stop-color="#4BA446"/>
                <stop offset="1" stop-color="#3F7D35"/>
                </linearGradient>
                </defs>
            </svg>
            `,

            'fabric-eventstream': `
            <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 20 20" fill="none" x="280" y="744">
                        <path d="M2 3.5C2 2.11929 3.11929 1 4.5 1H15.5C16.8807 1 18 2.11929 18 3.5V16.5C18 17.8807 16.8807 19 15.5 19H4.5C3.11929 19 2 17.8807 2 16.5V3.5Z" fill="url(#fnpaint0_linear_41743_62639)"/>
                        <path d="M2 3.5C2 2.11929 3.11929 1 4.5 1H15.5C16.8807 1 18 2.11929 18 3.5V16.5C18 17.8807 16.8807 19 15.5 19H4.5C3.11929 19 2 17.8807 2 16.5V3.5Z" fill="url(#fnpaint1_radial_41743_62639)" fill-opacity="0.2"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M15.5 2H4.5C3.67157 2 3 2.67157 3 3.5V16.5C3 17.3284 3.67157 18 4.5 18H15.5C16.3284 18 17 17.3284 17 16.5V3.5C17 2.67157 16.3284 2 15.5 2ZM4.5 1C3.11929 1 2 2.11929 2 3.5V16.5C2 17.8807 3.11929 19 4.5 19H15.5C16.8807 19 18 17.8807 18 16.5V3.5C18 2.11929 16.8807 1 15.5 1H4.5Z" fill="url(#fnpaint2_linear_41743_62639)"/>
                        <path d="M12.375 5C9.9901 5 8.05088 6.90829 8.001 9.28125C8.001 9.68252 7.67472 10.0078 7.27345 10.0078L5.53126 10.0078C5.25512 10.0078 5.03126 10.2317 5.03126 10.5078C5.03126 10.784 5.25512 11.0078 5.53126 11.0078L7.27345 11.0078C8.19555 11.0078 8.94882 10.285 8.99751 9.375H9.00001C9.00001 7.51104 10.5111 6 12.375 6H13.5C13.7762 6 14 5.77614 14 5.5C14 5.22386 13.7762 5 13.5 5H12.375Z" fill="url(#fnpaint3_linear_41743_62639)"/>
                        <path d="M8.58597 15.0078C9.03537 15.0078 9.46942 14.942 9.879 14.8196C9.64608 14.5566 9.45214 14.2584 9.30622 13.9338C9.07375 13.9823 8.83284 14.0078 8.58597 14.0078H6.53128C6.25514 14.0078 6.03128 14.2317 6.03128 14.5078C6.03128 14.784 6.25514 15.0078 6.53128 15.0078H8.58597Z" fill="url(#fnpaint4_linear_41743_62639)"/>
                        <path d="M9.02235 12.8978C9.00759 12.7672 9 12.6345 9 12.5C9 12.2637 9.02341 12.0329 9.06805 11.8097C8.8323 11.9313 8.5648 12 8.28126 12L5.5 12C5.22386 12 5 12.2239 5 12.5C5 12.7761 5.22386 13 5.5 13H8.28126C8.53817 13 8.78676 12.9644 9.02235 12.8978Z" fill="url(#fnpaint5_linear_41743_62639)"/>
                        <path d="M12.5 8.03125C11.7397 8.03125 11.1114 8.597 11.0133 9.33052C10.6332 9.50912 10.2905 9.7541 10 10.0505L10 9.53125C10 8.15054 11.1193 7.03125 12.5 7.03125H13.6563C13.9324 7.03125 14.1563 7.25511 14.1563 7.53125C14.1563 7.80739 13.9324 8.03125 13.6563 8.03125H12.5Z" fill="url(#fnpaint6_linear_41743_62639)"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M9.81701 12.2316C10.6399 12.0068 11.1276 11.1614 10.9113 10.3362L10.9043 10.3113C11.0957 10.1721 11.3065 10.0577 11.5312 9.97217C12.1013 10.4583 12.9421 10.4653 13.5208 9.99239C13.7572 10.0888 13.9773 10.2164 14.1749 10.3712C14.0559 11.1085 14.4821 11.8326 15.1876 12.0831C15.2101 12.2246 15.2218 12.3693 15.2218 12.5171C15.2218 12.6112 15.2171 12.7037 15.2078 12.7955L15.1821 12.8025C14.36 13.0273 13.8716 13.8727 14.0878 14.6979L14.0948 14.7236C13.9035 14.8621 13.6927 14.9764 13.4679 15.0619C12.8978 14.5758 12.057 14.5688 11.4791 15.0417C11.2419 14.9453 11.0218 14.8177 10.8242 14.6622C10.9432 13.9256 10.517 13.2023 9.81157 12.9511C9.78901 12.8095 9.77734 12.6648 9.77734 12.5171C9.77734 12.4229 9.78201 12.3304 9.79134 12.2386L9.81701 12.2316ZM11.9162 12.5171C11.9162 12.8391 12.1776 13.1004 12.4996 13.1004C12.8216 13.1004 13.0829 12.8391 13.0829 12.5171C13.0829 12.1951 12.8216 11.9337 12.4996 11.9337C12.1776 11.9337 11.9162 12.1951 11.9162 12.5171Z" fill="url(#fnpaint7_linear_41743_62639)"/>
                        <defs>
                        <linearGradient id="fnpaint0_linear_41743_62639" x1="6.44444" y1="1" x2="8.99556" y2="19.1412" gradientUnits="userSpaceOnUse">
                        <stop stop-color="white"/>
                        <stop offset="1" stop-color="#EBEBEB"/>
                        </linearGradient>
                        <radialGradient id="fnpaint1_radial_41743_62639" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(7.11111 5.6875) rotate(59.3493) scale(16.5642 13.6213)">
                        <stop offset="0.177083" stop-color="white"/>
                        <stop offset="1" stop-color="#B8B8B8"/>
                        </radialGradient>
                        <linearGradient id="fnpaint2_linear_41743_62639" x1="7.16667" y1="1" x2="9.8806" y2="19.0929" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#BBBBBB"/>
                        <stop offset="1" stop-color="#888888"/>
                        </linearGradient>
                        <linearGradient id="fnpaint3_linear_41743_62639" x1="5" y1="5" x2="15.0607" y2="15.2205" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#E03F8F"/>
                        <stop offset="1" stop-color="#BD1E7B"/>
                        </linearGradient>
                        <linearGradient id="fnpaint4_linear_41743_62639" x1="5" y1="5" x2="15.0607" y2="15.2205" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#E03F8F"/>
                        <stop offset="1" stop-color="#BD1E7B"/>
                        </linearGradient>
                        <linearGradient id="fnpaint5_linear_41743_62639" x1="5" y1="5" x2="15.0607" y2="15.2205" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#E03F8F"/>
                        <stop offset="1" stop-color="#BD1E7B"/>
                        </linearGradient>
                        <linearGradient id="fnpaint6_linear_41743_62639" x1="5" y1="5" x2="15.0607" y2="15.2205" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#E03F8F"/>
                        <stop offset="1" stop-color="#BD1E7B"/>
                        </linearGradient>
                        <linearGradient id="fnpaint7_linear_41743_62639" x1="5" y1="5" x2="15.0607" y2="15.2205" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#E03F8F"/>
                        <stop offset="1" stop-color="#BD1E7B"/>
                        </linearGradient>
                        </defs>
                    </svg>
            `,

            'fabric-kql-db': `
            <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 64 64" fill="none" x="385">
                <path d="M12 13C12 9.13401 15.134 6 19 6H49C52.866 6 56 9.13401 56 13V51C56 57.0751 51.0751 62 45 62H19C15.134 62 12 58.866 12 55V13Z" fill="url(#ippaint0_linear_41743_63439)"/>
                <path d="M12 13C12 9.13401 15.134 6 19 6H49C52.866 6 56 9.13401 56 13V51C56 57.0751 51.0751 62 45 62H19C15.134 62 12 58.866 12 55V13Z" fill="url(#ippaint1_radial_41743_63439)" fill-opacity="0.2"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M49 7H19C15.6863 7 13 9.68629 13 13V55C13 58.3137 15.6863 61 19 61H45C50.5228 61 55 56.5228 55 51V13C55 9.68629 52.3137 7 49 7ZM19 6C15.134 6 12 9.13401 12 13V55C12 58.866 15.134 62 19 62H45C51.0751 62 56 57.0751 56 51V13C56 9.13401 52.866 6 49 6H19Z" fill="url(#ippaint2_linear_41743_63439)"/>
                <path d="M8 9C8 5.13401 11.134 2 15 2H45C48.866 2 52 5.13401 52 9V51C52 54.866 48.866 58 45 58H15C11.134 58 8 54.866 8 51V9Z" fill="url(#ippaint3_linear_41743_63439)"/>
                <path d="M8 9C8 5.13401 11.134 2 15 2H45C48.866 2 52 5.13401 52 9V51C52 54.866 48.866 58 45 58H15C11.134 58 8 54.866 8 51V9Z" fill="url(#ippaint4_radial_41743_63439)" fill-opacity="0.2"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M45 3H15C11.6863 3 9 5.68629 9 9V51C9 54.3137 11.6863 57 15 57H45C48.3137 57 51 54.3137 51 51V9C51 5.68629 48.3137 3 45 3ZM15 2C11.134 2 8 5.13401 8 9V51C8 54.866 11.134 58 15 58H45C48.866 58 52 54.866 52 51V9C52 5.13401 48.866 2 45 2H15Z" fill="url(#ippaint5_linear_41743_63439)"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M46.7905 59.24C46.5105 59.52 46.1305 59.68 45.7305 59.68C45.3305 59.68 44.9505 59.52 44.6705 59.24C44.3905 58.96 44.2305 58.58 44.2305 58.18C44.2305 57.78 44.3905 57.4 44.6705 57.12L47.5005 54.29C47.6505 54.14 47.8305 54.02 48.0305 53.95L45.6405 51.56C45.2105 51.13 45.0805 50.49 45.3205 49.92C45.5505 49.36 46.1005 49 46.7005 49H57.4905C58.3205 49 58.9905 49.67 58.9905 50.5V61.29C58.9905 61.71 58.8205 62.1 58.5205 62.38C58.2405 62.64 57.8705 62.79 57.4905 62.79C57.0905 62.79 56.7205 62.63 56.4305 62.35L54.2005 60.12C54.1305 60.31 54.0105 60.5 53.8605 60.65L51.0305 63.48C50.7505 63.76 50.3705 63.92 49.9705 63.92C49.5705 63.92 49.1905 63.76 48.9105 63.48C48.3305 62.9 48.3305 61.97 48.8805 61.39L46.7905 63.48C46.5105 63.76 46.1305 63.92 45.7305 63.92C45.3305 63.92 44.9505 63.76 44.6705 63.48C44.0905 62.9 44.0905 61.94 44.6705 61.36" fill="#F5F5F5"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M58.0005 50.5C58.0005 50.22 57.7805 50 57.5005 50H46.7105C46.2605 50 46.0405 50.54 46.3605 50.85L57.1505 61.64C57.4605 61.95 58.0005 61.73 58.0005 61.29V50.5ZM48.9205 55.71C49.1205 55.51 49.1205 55.2 48.9205 55C48.7205 54.8 48.4105 54.8 48.2105 55L45.3805 57.83C45.1805 58.03 45.1805 58.34 45.3805 58.54C45.5805 58.74 45.8905 58.74 46.0905 58.54L48.9205 55.71ZM51.0405 57.12C51.2405 57.32 51.2405 57.63 51.0405 57.83L46.0905 62.78C45.8905 62.98 45.5805 62.98 45.3805 62.78C45.1805 62.58 45.1805 62.27 45.3805 62.07L50.3305 57.12C50.5305 56.92 50.8405 56.92 51.0405 57.12ZM53.1605 59.95C53.3605 59.75 53.3605 59.44 53.1605 59.24C52.9605 59.04 52.6505 59.04 52.4505 59.24L49.6205 62.07C49.4205 62.27 49.4205 62.58 49.6205 62.78C49.8205 62.98 50.1305 62.98 50.3305 62.78L53.1605 59.95Z" fill="url(#ippaint6_linear_41743_63439)"/>
                <defs>
                <linearGradient id="ippaint0_linear_41743_63439" x1="24.2222" y1="6" x2="33.1528" y2="62.1348" gradientUnits="userSpaceOnUse">
                <stop stop-color="white"/>
                <stop offset="1" stop-color="#EBEBEB"/>
                </linearGradient>
                <radialGradient id="ippaint1_radial_41743_63439" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(26.0556 20.5833) rotate(62.354) scale(50.0471 38.5706)">
                <stop offset="0.177083" stop-color="white"/>
                <stop offset="1" stop-color="#B8B8B8"/>
                </radialGradient>
                <linearGradient id="ippaint2_linear_41743_63439" x1="26.2083" y1="6" x2="35.7019" y2="61.9445" gradientUnits="userSpaceOnUse">
                <stop stop-color="#BBBBBB"/>
                <stop offset="1" stop-color="#888888"/>
                </linearGradient>
                <linearGradient id="ippaint3_linear_41743_63439" x1="20.2222" y1="2" x2="29.1528" y2="58.1348" gradientUnits="userSpaceOnUse">
                <stop stop-color="white"/>
                <stop offset="1" stop-color="#EBEBEB"/>
                </linearGradient>
                <radialGradient id="ippaint4_radial_41743_63439" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(22.0556 16.5833) rotate(62.354) scale(50.0471 38.5706)">
                <stop offset="0.177083" stop-color="white"/>
                <stop offset="1" stop-color="#B8B8B8"/>
                </radialGradient>
                <linearGradient id="ippaint5_linear_41743_63439" x1="22.2083" y1="2" x2="31.7019" y2="57.9445" gradientUnits="userSpaceOnUse">
                <stop stop-color="#BBBBBB"/>
                <stop offset="1" stop-color="#888888"/>
                </linearGradient>
                <linearGradient id="ippaint6_linear_41743_63439" x1="45.2305" y1="50" x2="58.1595" y2="62.769" gradientUnits="userSpaceOnUse">
                <stop stop-color="#4BA446"/>
                <stop offset="1" stop-color="#3F7D35"/>
                </linearGradient>
                </defs>
            </svg>
            `,
            'fabric-realtime': `
            <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 64 64" fill="none" x="449" y="128">
                        <path d="M6 13C6 9.13401 9.13401 6 13 6H51C54.866 6 58 9.13401 58 13V51C58 54.866 54.866 58 51 58H13C9.13401 58 6 54.866 6 51V13Z" fill="url(#lupaint0_linear_41743_63162)"/>
                        <path d="M6 13C6 9.13401 9.13401 6 13 6H51C54.866 6 58 9.13401 58 13V51C58 54.866 54.866 58 51 58H13C9.13401 58 6 54.866 6 51V13Z" fill="url(#lupaint1_radial_41743_63162)" fill-opacity="0.2"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M51 7H13C9.68629 7 7 9.68629 7 13V51C7 54.3137 9.68629 57 13 57H51C54.3137 57 57 54.3137 57 51V13C57 9.68629 54.3137 7 51 7ZM13 6C9.13401 6 6 9.13401 6 13V51C6 54.866 9.13401 58 13 58H51C54.866 58 58 54.866 58 51V13C58 9.13401 54.866 6 51 6H13Z" fill="url(#lupaint2_linear_41743_63162)"/>
                        <circle cx="32" cy="32" r="13.5" fill="url(#lupaint3_linear_41743_63162)" stroke="url(#lupaint4_linear_41743_63162)"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M31.646 23.1875C27.0042 23.1875 23.2412 26.9505 23.2412 31.5923C23.2412 32.9606 23.5676 34.2505 24.1461 35.3904C24.2756 35.6454 24.4177 35.893 24.5716 36.1323C24.7957 36.4807 24.6949 36.9448 24.3465 37.1689C23.9982 37.3929 23.5341 37.2922 23.31 36.9438C23.1286 36.6618 22.9612 36.3699 22.8085 36.0692C22.1257 34.7238 21.7412 33.2019 21.7412 31.5923C21.7412 26.122 26.1757 21.6875 31.646 21.6875C32.8643 21.6875 34.0328 21.9078 35.1128 22.3114C35.5008 22.4564 35.6978 22.8884 35.5528 23.2764C35.4078 23.6645 34.9757 23.8615 34.5877 23.7165C33.6731 23.3747 32.6823 23.1875 31.646 23.1875Z" fill="#F5BCD8"/>
                        <path d="M33.5797 33.8802C35.1297 31.4202 36.6997 28.9402 38.2197 26.4902C38.4297 26.1602 38.6397 25.8302 38.8497 25.5002C39.4997 24.5202 38.0197 23.4402 37.2597 24.3202C37.1897 24.3802 37.1197 24.4402 37.0497 24.5002C36.8897 24.6402 36.7297 24.7702 36.5697 24.9102C36.2297 25.2002 35.8897 25.4902 35.5397 25.7902C34.8297 26.3902 34.1197 27.0002 33.4097 27.6002C32.4997 28.3702 31.5897 29.1502 30.6797 29.9202C30.4797 30.0902 30.2897 30.2502 30.0897 30.4202C26.9397 32.8402 31.1897 37.0602 33.5697 33.8902L33.5797 33.8802Z" fill="#F5BCD8"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M48.7905 57.24C48.5105 57.52 48.1305 57.68 47.7305 57.68C47.3305 57.68 46.9505 57.52 46.6705 57.24C46.3905 56.96 46.2305 56.58 46.2305 56.18C46.2305 55.78 46.3905 55.4 46.6705 55.12L49.5005 52.29C49.6505 52.14 49.8305 52.02 50.0305 51.95L47.6405 49.56C47.2105 49.13 47.0805 48.49 47.3205 47.92C47.5505 47.36 48.1005 47 48.7005 47H59.4905C60.3205 47 60.9905 47.67 60.9905 48.5V59.29C60.9905 59.71 60.8205 60.1 60.5205 60.38C60.2405 60.64 59.8705 60.79 59.4905 60.79C59.0905 60.79 58.7205 60.63 58.4305 60.35L56.2005 58.12C56.1305 58.31 56.0105 58.5 55.8605 58.65L53.0305 61.48C52.7505 61.76 52.3705 61.92 51.9705 61.92C51.5705 61.92 51.1905 61.76 50.9105 61.48C50.3305 60.9 50.3305 59.97 50.8805 59.39L48.7905 61.48C48.5105 61.76 48.1305 61.92 47.7305 61.92C47.3305 61.92 46.9505 61.76 46.6705 61.48C46.0905 60.9 46.0905 59.94 46.6705 59.36" fill="#F5F5F5"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M60.0005 48.5C60.0005 48.22 59.7805 48 59.5005 48H48.7105C48.2605 48 48.0405 48.54 48.3605 48.85L59.1505 59.64C59.4605 59.95 60.0005 59.73 60.0005 59.29V48.5ZM50.9205 53.71C51.1205 53.51 51.1205 53.2 50.9205 53C50.7205 52.8 50.4105 52.8 50.2105 53L47.3805 55.83C47.1805 56.03 47.1805 56.34 47.3805 56.54C47.5805 56.74 47.8905 56.74 48.0905 56.54L50.9205 53.71ZM53.0405 55.12C53.2405 55.32 53.2405 55.63 53.0405 55.83L48.0905 60.78C47.8905 60.98 47.5805 60.98 47.3805 60.78C47.1805 60.58 47.1805 60.27 47.3805 60.07L52.3305 55.12C52.5305 54.92 52.8405 54.92 53.0405 55.12ZM55.1605 57.95C55.3605 57.75 55.3605 57.44 55.1605 57.24C54.9605 57.04 54.6505 57.04 54.4505 57.24L51.6205 60.07C51.4205 60.27 51.4205 60.58 51.6205 60.78C51.8205 60.98 52.1305 60.98 52.3305 60.78L55.1605 57.95Z" fill="url(#lupaint5_linear_41743_63162)"/>
                        <defs>
                        <linearGradient id="lupaint0_linear_41743_63162" x1="20.4444" y1="6" x2="27.0222" y2="58.6222" gradientUnits="userSpaceOnUse">
                        <stop stop-color="white"/>
                        <stop offset="1" stop-color="#EBEBEB"/>
                        </linearGradient>
                        <radialGradient id="lupaint1_radial_41743_63162" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(22.6111 19.5417) rotate(56.3099) scale(49.4762 42.8159)">
                        <stop offset="0.177083" stop-color="white"/>
                        <stop offset="1" stop-color="#B8B8B8"/>
                        </radialGradient>
                        <linearGradient id="lupaint2_linear_41743_63162" x1="22.7917" y1="6" x2="29.7931" y2="58.5109" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#BBBBBB"/>
                        <stop offset="1" stop-color="#888888"/>
                        </linearGradient>
                        <linearGradient id="lupaint3_linear_41743_63162" x1="18" y1="18" x2="46" y2="46" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#E03F8F"/>
                        <stop offset="1" stop-color="#BD1E7B"/>
                        </linearGradient>
                        <linearGradient id="lupaint4_linear_41743_63162" x1="18" y1="18" x2="46" y2="46" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#E03F8F"/>
                        <stop offset="1" stop-color="#BD1E7B"/>
                        </linearGradient>
                        <linearGradient id="lupaint5_linear_41743_63162" x1="47.2305" y1="48" x2="60.1595" y2="60.769" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#E03F8F"/>
                        <stop offset="1" stop-color="#BD1E7B"/>
                        </linearGradient>
                        </defs>
                    </svg>
            `,

            'fabric-ml-model': `
             <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 64 64" fill="none" x="385" y="256">
                        <path d="M6 13C6 9.13401 9.13401 6 13 6H51C54.866 6 58 9.13401 58 13V51C58 54.866 54.866 58 51 58H13C9.13401 58 6 54.866 6 51V13Z" fill="url(#jnpaint0_linear_41743_63314)"/>
                        <path d="M6 13C6 9.13401 9.13401 6 13 6H51C54.866 6 58 9.13401 58 13V51C58 54.866 54.866 58 51 58H13C9.13401 58 6 54.866 6 51V13Z" fill="url(#jnpaint1_radial_41743_63314)" fill-opacity="0.2"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M51 7H13C9.68629 7 7 9.68629 7 13V51C7 54.3137 9.68629 57 13 57H51C54.3137 57 57 54.3137 57 51V13C57 9.68629 54.3137 7 51 7ZM13 6C9.13401 6 6 9.13401 6 13V51C6 54.866 9.13401 58 13 58H51C54.866 58 58 54.866 58 51V13C58 9.13401 54.866 6 51 6H13Z" fill="url(#jnpaint2_linear_41743_63314)"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M34.3758 20.2743C32.8931 19.4737 31.107 19.4737 29.6244 20.2743L21.5498 24.6343C20.9032 24.9835 20.5001 25.6593 20.5001 26.3942V35.9184C20.5001 37.3821 21.2997 38.729 22.5847 39.43L31.3912 44.2334C31.592 44.3429 31.8105 44.35 32.0001 44.2824C32.1897 44.35 32.4082 44.3429 32.609 44.2334L41.4155 39.43C42.7005 38.729 43.5001 37.3821 43.5001 35.9184V26.3942C43.5001 25.6593 43.097 24.9835 42.4504 24.6343L34.3758 20.2743ZM31.4999 34.5738L31.5001 34.5362C31.4865 33.4529 30.8896 32.4598 29.9368 31.9401L21.5001 27.3384V35.9184C21.5001 37.0162 22.0998 38.0264 23.0636 38.5521L31.4999 43.1536V34.5738ZM32.5003 34.5738V43.1536L40.9366 38.5521C41.9004 38.0264 42.5001 37.0162 42.5001 35.9184V27.3384L34.0633 31.9401C33.1106 32.4598 32.5137 33.4529 32.5001 34.5362L32.5003 34.5738ZM42.4237 26.0108C42.3656 25.9118 42.3039 25.8148 42.2388 25.7201C42.3169 25.8057 42.3794 25.9041 42.4237 26.0108Z" fill="url(#jnpaint3_linear_41743_63314)"/>
                        <defs>
                        <linearGradient id="jnpaint0_linear_41743_63314" x1="20.4444" y1="6" x2="27.0222" y2="58.6222" gradientUnits="userSpaceOnUse">
                        <stop stop-color="white"/>
                        <stop offset="1" stop-color="#EBEBEB"/>
                        </linearGradient>
                        <radialGradient id="jnpaint1_radial_41743_63314" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(22.6111 19.5417) rotate(56.3099) scale(49.4762 42.8159)">
                        <stop offset="0.177083" stop-color="white"/>
                        <stop offset="1" stop-color="#B8B8B8"/>
                        </radialGradient>
                        <linearGradient id="jnpaint2_linear_41743_63314" x1="22.7917" y1="6" x2="29.7931" y2="58.5109" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#BBBBBB"/>
                        <stop offset="1" stop-color="#888888"/>
                        </linearGradient>
                        <linearGradient id="jnpaint3_linear_41743_63314" x1="20.5001" y1="19.6738" x2="45.0931" y2="42.6186" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#4BA446"/>
                        <stop offset="1" stop-color="#3F7D35"/>
                        </linearGradient>
                        </defs>
                    </svg>    
            `,

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
            'gcp-bigquery': `<img style="max-width: 60px;" src="/icones/big_query.png" alt="">`,
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

    onPointerDown(e) {
        selectedElement = this;
        selectElement(this);

        const rect = this.element.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();

        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;

        const onMove = (moveEvent) => {
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

        const onUp = () => {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
            saveHistory();
        };

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
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
        // remove conexões que apontam para este elemento
        elements.forEach(el => {
            el.connections = el.connections.filter(conn => conn.to !== this.id);
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
    if (element && element.element) {
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
        if (element.element) {
            const lbl = element.element.querySelector('.element-label');
            if (lbl) lbl.textContent = element.label;
            const txt = element.element.querySelector('.shape-text-preview');
            if (txt) txt.textContent = element.label;
        }
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
    connectingFrom = { element: fromElement, point, active: true };
    if (fromElement.element) {
        fromElement.element.classList.add('connecting');
    }
}

function cancelConnection() {
    if (connectingFrom && connectingFrom.element && connectingFrom.element.element) {
        connectingFrom.element.element.classList.remove('connecting');
    }
    isConnecting = false;
    if (connectingFrom) connectingFrom.active = false;
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

    const exists = from.connections.some(conn =>
        conn.to === to.id &&
        conn.fromPoint === connectingFrom.point &&
        conn.toPoint === toPoint
    );
    if (exists) {
        cancelConnection();
        return;
    }

    from.connections.push({
        to: to.id,
        fromPoint: connectingFrom.point,
        toPoint
    });

    cancelConnection();
    redrawConnections();
    saveHistory();
}

function drawTemporaryConnection(e) {
    if (!isConnecting || !connectingFrom || !connectingFrom.active) return;

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
    if (!connectionsSvg) return;
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

    // remove apenas elementos. mantém svg
    document.querySelectorAll('.diagram-element').forEach(el => el.remove());
    if (connectionsSvg) {
        connectionsSvg.innerHTML = '';
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

        document.querySelectorAll('.diagram-element').forEach(el => el.remove());
        if (connectionsSvg) connectionsSvg.innerHTML = '';
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
        scale: 2,
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
