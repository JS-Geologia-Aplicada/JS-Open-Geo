# JS Open Geo

![Version](https://img.shields.io/badge/version-2.0--beta-blue)
![License](https://img.shields.io/badge/license-MIT-green)

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

Você precisará ter instalado em seu computador:

- **[Node.js 18+](https://nodejs.org/)** - Baixe a versão LTS (recomendada)
- **[Git](https://git-scm.com/)**

### Instalação

Abra um terminal na pasta que deseja baixar o projeto. Para fazer isso no Windows, é possível clicar com o botão direito do mouse na pasta e selecionar a opção _Abrir no Terminal_.

```bash
# Clone o repositório:
git clone https://github.com/js-geologia-aplicada/js-open-geo

# Entre na pasta do projeto:
cd JS-Open-Geo

# Instale as dependências:
npm install

# Execute o projeto:
npm run dev
```

O terminal mostrará algo como:

```
  ➜  Local:   http://localhost:5173/JS-Open-Geo/
  ➜  Network: use --host to expose
```

Clique no link segurando a tecla control ou abra o navegador e acesse: **http://localhost:5173/JS-Open-Geo/**

Para **suspender** a execução do projeto:

- Pressione `Ctrl + C` no terminal, **ou**
- Feche o terminal

Sempre que for utilizar o programa novamente, abra o terminal na pasta do projeto e execute:

```bash
npm run dev
```

### Mantendo atualizado

Para atualizar sua cópia local com as últimas mudanças:

```bash
# Verificar se há atualizações disponíveis
git fetch origin main
git status # Mostra "Your branch is behind" se houver atualizações

# Baixar atualizações
git pull origin main

# Reinstalar dependências
npm install
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

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Desenvolvimento

**Desenvolvido por:** Anya Cunha - [GitHub](https://github.com/anyasc)
