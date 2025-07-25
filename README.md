# Extrator de Dados de PDF

Uma aplicação web para extrair texto de áreas específicas em documentos PDF, permitindo selecionar uma região em qualquer página e aplicar a mesma área em todas as páginas do documento.

## Links

- **[Demo ao vivo](https://js-geologia-aplicada.github.io/extrator-dados-PDF/)**
- **[Repositório](https://github.com/js-geologia-aplicada/extrator-dados-PDF)**

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
git clone https://github.com/js-geologia-aplicada/extrator-dados-PDF

# Entre na pasta
cd extrator-dados-dpf

# Instale as dependências
npm install

# Execute o projeto
npm run dev
```

## Tecnologias

- **React + TypeScript** - Framework principal
- **Vite** - Build tool
- **Bootstrap 5** - Interface e responsividade
- **React PDF** - Renderização e manipulação de PDFs
- **PDF.js** - Engine de processamento PDF
- **SheetJS** - Exportação Excel
- **@hello-pangea/dnd** - Drag and drop das áreas
- **Lucide React** - Ícones

## Desenvolvimento

**Desenvolvido por:** Anya Cunha - [GitHub](https://github.com/anyasc)
