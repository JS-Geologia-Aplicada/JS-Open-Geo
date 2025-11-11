import * as XLSX from "xlsx";

export interface XlsxRow {
  [key: string]: any;
}

export interface ProcessedXlsxData {
  headers: string[]; // ["col_0", "col_1"] ou ["Nome", "X", "Y"]
  data: Record<string, any>[]; // Array de objetos com os dados
}

/**
 * Lê um arquivo XLSX e retorna array de arrays
 */
export const readXlsxFile = async (file: File): Promise<any[][]> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];

  return XLSX.utils.sheet_to_json(worksheet, {
    header: 1, // Retorna array de arrays
  });
};

/**
 * Processa dados do XLSX considerando se tem header ou não
 */
export const processXlsxData = (
  dataArray: XlsxRow[],
  hasHeader: boolean
): ProcessedXlsxData => {
  if (dataArray.length === 0) {
    return { headers: [], data: [] };
  }

  let headers: string[];
  let actualData: Record<string, any>[];

  if (hasHeader && dataArray.length > 1) {
    // COM header: primeira linha = nomes das colunas
    const headerRow = dataArray[0];
    headers = headerRow.map((v: string | null | undefined, i: number) =>
      v !== null && v !== undefined && v !== "" ? String(v) : `Coluna ${i + 1}`
    );

    // Dados começam da segunda linha
    actualData = dataArray.slice(1).map((row) => {
      const mapped: Record<string, any> = {};
      headers.forEach((h, i) => {
        mapped[h] = row[i];
      });
      return mapped;
    });
  } else {
    // SEM header: todas as linhas são dados
    const numCols = dataArray[0]?.length || 0;
    headers = Array.from({ length: numCols }, (_, i) => `col_${i}`);

    actualData = (hasHeader ? dataArray.slice(1) : dataArray).map((row) => {
      const mapped: Record<string, any> = {};
      headers.forEach((col, idx) => {
        mapped[col] = row[idx];
      });
      return mapped;
    });
  }

  return { headers, data: actualData };
};

/**
 * Gera labels amigáveis para colunas (usado em selects)
 */
export const getColumnLabel = (
  columnKey: string,
  index: number,
  hasHeader: boolean
): string => {
  return hasHeader ? columnKey : `Coluna ${index + 1}`;
};
