# JS Open Geo

Uma aplicação web para extrair texto de áreas específicas em documentos PDF, permitindo selecionar uma região em qualquer página e aplicar a mesma área em todas as páginas do documento.

## Links

- **[Demo ao vivo](https://js-geologia-aplicada.github.io/js-open-geo/)**
- **[Repositório](https://github.com/js-geologia-aplicada/js-open-geo)**

## Como usar

1. **Faça upload** de um arquivo PDF
2. **Navegue** pelas páginas usando os controles
3. **Selecione áreas** clicando e movendo o mouse sobre o texto desejado
4. **Clique em "Extrair Textos"** para processar todas as páginas
5. **Visualize os resultados** na tabela lateral
6. **Exporte** como XLS, CSV ou JSON

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

- **React + TypeScript** - Framework principal
- **Vite** - Build tool e dev server

### Interface & UX

- **React Bootstrap** - Componentes React para Bootstrap
- **Lucide React** - Ícones
- **@hello-pangea/dnd** - Drag and drop
- **Toastify** - Notificações
- **React Dropzone** - Upload de arquivos por drag and drop

### Processamento PDF

- **React PDF** - Renderização de PDFs
- **PDF.js** - Engine de processamento PDF
- **PDF-lib** - Manipulação avançada de PDFs
- **Tesseract.js** - OCR (Optical Character Recognition)

### Mapas & Coordenadas

- **Leaflet** - Mapas interativos
- **OpenStreetMap** - Camada de mapa base
- **Esri World Imagery** - Camada de satélite
- **Proj4** - Transformações de coordenadas

### Export & Dados

- **@tarikjabiri/dxf** - Geração de DXF
- **SheetJS (XLSX)** - Exportação Excel
- **JSZip** - Compactação de arquivos
- **React CSV** - Exportação CSV

## Desenvolvimento

**Desenvolvido por:** Anya Cunha - [GitHub](https://github.com/anyasc)
