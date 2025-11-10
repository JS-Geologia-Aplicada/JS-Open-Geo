# JS Open Geo

![Version](https://img.shields.io/badge/version-2.0--beta-blue)
![React](https://img.shields.io/badge/react-19.1-61dafb)
![TypeScript](https://img.shields.io/badge/typescript-5.8-3178c6)

Uma aplicação web para para facilitar e agilizar a organização e análise de dados geológico-geotécnico.

## Links

- **[Demo ao vivo](https://js-geologia-aplicada.github.io/js-open-geo/)**
- **[Repositório](https://github.com/js-geologia-aplicada/js-open-geo)**

## Funcionalidades

### Extração de Dados PDF

Extraia texto de áreas específicas em documentos PDF de forma automatizada:

- Selecione áreas de interesse em qualquer página
- Aplique a mesma seleção para todas as páginas do documento
- Reordene áreas via drag-and-drop
- Suporte a OCR para PDFs escaneados
- Exporte para XLSX, CSV ou JSON

### Geração de Palitos DXF

Crie palitos de sondagem a partir de seus dados:

- Utilize os dados extraídos de PDF ou utilize seus próprios dados
- Gere automaticamente perfis em formato DXF
- Diferentes modelos de palito disponíveis

### Ferramentas CAD/SIG

#### **Ferramentas DXF**

- Extraia dados de sondagens de arquivos DXF
- Suporte a blocos atribuídos e multileaders
- Renomeie sondagens automaticamente por direção
- Filtre por camadas
- Exporte para XLSX, KML/KMZ ou DXF modificado

#### **KML/KMZ → Excel**

- Converta arquivos KML/KMZ para planilhas XLSX
- Preserva coordenadas e dados estendidos
- Suporte a conversão entre sistemas de coordenadas (WGS84, SIRGAS2000, SAD69)

#### **XLSX → KML/KMZ**

- Gere arquivos KML/KMZ a partir de planilhas XLSX
- Suporte a conversão entre sistemas de coordenadas (WGS84, SIRGAS2000, SAD69)

#### **XLSX → Perfil DXF**

- Gere perfis em DXF a partir de planilhas Excel
- Importe dados de sondagem: nome, distância e cota (opcional)
- Exporte DXF com guias verticais dos pontos ao longo do eixo X

#### **Cálculo de Distâncias**

- Calcule distâncias de sondagens até polylines
- Identifique lado (esquerda/direita) em relação à linha de referência
- Exporte resultados para XLSX

## Executar localmente

### Pré-requisitos

- Node.js 16+
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone https://github.com/js-geologia-aplicada/js-open-geo

# Entre na pasta
cd extrator-dados-dpf

# Instale as dependências
npm install

# Execute o projeto
npm run dev
```

## Tecnologias

### Core

- **React 19 + TypeScript** - Framework principal
- **Vite** - Build tool e dev server

### Interface & UX

- **React Bootstrap** - Componentes React para Bootstrap
- **Bootstrap 5** - Framework CSS
- **Lucide React** - Ícones
- **@hello-pangea/dnd** - Drag and drop
- **Toastify** - Notificações
- **React Dropzone** - Upload de arquivos por drag and drop

### Processamento PDF

- **React PDF** - Renderização de PDFs
- **PDF.js** - Engine de processamento PDF
- **PDF-lib** - Manipulação avançada de PDFs
- **Tesseract.js** - OCR (Optical Character Recognition)

### CAD & Geoespacial

- **@tarikjabiri/dxf** - Geração de DXF
- **Leaflet** - Mapas interativos
- **OpenStreetMap** - Camada de mapa base
- **Esri World Imagery** - Camada de satélite
- **Proj4** - Transformações de coordenadas

### Processamento de Dados

- **dxf-parser** - Parser de arquivos DXF
- **SheetJS (XLSX)** - Exportação Excel
- **JSZip** - Compactação e descompactação
- **PapaParse** - Processamento de arquivos CSV
- **React CSV** - Exportação CSV
- **MathJS** - Operações matemáticas avançadas

## Desenvolvimento

**Desenvolvido por:** Anya Cunha - [GitHub](https://github.com/anyasc)
