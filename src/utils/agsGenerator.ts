import type {
  AGSProjectData,
  AGSTransmissionData,
  AGSAbbreviation,
  PalitoData,
} from "@/types";

/**
 * Escapa aspas duplas em strings AGS (regra 5)
 * "texto com "aspas"" -> "texto com ""aspas"""
 */
const escapeAGSString = (str: string): string => {
  return str.replace(/"/g, '""');
};

/**
 * Formata um valor AGS entre aspas duplas
 * @param value Valor a ser formatado
 * @param type Tipo do dado (opcional, para formatação especial)
 */
const formatAGSValue = (
  value: string | number | undefined,
  type?: string
): string => {
  if (value === undefined || value === null) return '""';

  // Se o tipo for 2DP, formata com 2 casas decimais
  if (type === "2DP" && typeof value === "number") {
    return `"${formatAGSNumber(value, 2)}"`;
  }

  // Se o tipo for 0DP, formata sem casas decimais
  if (type === "0DP" && typeof value === "number") {
    return `"${formatAGSNumber(value, 0)}"`;
  }

  return `"${escapeAGSString(String(value))}"`;
};

/**
 * Formata número com casas decimais fixas para AGS
 * @param value Número ou string a ser formatado
 * @param decimals Número de casas decimais (padrão: 2)
 * @returns String formatada com vírgula como separador decimal
 */
const formatAGSNumber = (
  value: string | number | undefined,
  decimals: number = 2
): string => {
  if (value === undefined || value === null || value === "") return "";

  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";

  return num.toFixed(decimals);
};

/**
 * Gera uma linha AGS completa com os valores
 * @param descriptor Descritor da linha (GROUP, HEADING, etc)
 * @param values Array de valores
 * @param types Array de tipos (opcional, para DATA lines)
 */
const generateAGSLine = (
  descriptor: string,
  values: (string | number | undefined)[],
  types?: string[]
): string => {
  const formattedValues = values.map((value, index) =>
    formatAGSValue(value, types?.[index])
  );
  return `"${descriptor}",${formattedValues.join(",")}\r\n`;
};

/**
 * Gera o grupo PROJ (Informações do Projeto)
 */
export const generatePROJGroup = (projectData: AGSProjectData): string => {
  let result = "";

  // GROUP line
  result += generateAGSLine("GROUP", ["PROJ"]);

  // HEADING line
  const headings = ["PROJ_ID", "PROJ_NAME"];
  if (projectData.PROJ_LOC) headings.push("PROJ_LOC");
  if (projectData.PROJ_CLNT) headings.push("PROJ_CLNT");
  if (projectData.PROJ_CONT) headings.push("PROJ_CONT");
  if (projectData.PROJ_ENG) headings.push("PROJ_ENG");
  if (projectData.PROJ_MEMO) headings.push("PROJ_MEMO");
  result += generateAGSLine("HEADING", headings);

  // UNIT line (todos vazios para PROJ)
  result += generateAGSLine("UNIT", Array(headings.length).fill(""));

  // TYPE line
  const types = ["ID", "X"];
  if (projectData.PROJ_LOC) types.push("X");
  if (projectData.PROJ_CLNT) types.push("X");
  if (projectData.PROJ_CONT) types.push("X");
  if (projectData.PROJ_ENG) types.push("X");
  if (projectData.PROJ_MEMO) types.push("X");
  result += generateAGSLine("TYPE", types);

  // DATA line
  const dataValues = [projectData.PROJ_ID, projectData.PROJ_NAME];
  if (projectData.PROJ_LOC) dataValues.push(projectData.PROJ_LOC);
  if (projectData.PROJ_CLNT) dataValues.push(projectData.PROJ_CLNT);
  if (projectData.PROJ_CONT) dataValues.push(projectData.PROJ_CONT);
  if (projectData.PROJ_ENG) dataValues.push(projectData.PROJ_ENG);
  if (projectData.PROJ_MEMO) dataValues.push(projectData.PROJ_MEMO);
  result += generateAGSLine("DATA", dataValues);

  result += "\r\n"; // Linha em branco entre grupos
  return result;
};

/**
 * Gera o grupo TRAN (Informações de Transmissão)
 */
export const generateTRANGroup = (
  transmissionData: AGSTransmissionData
): string => {
  let result = "";

  result += generateAGSLine("GROUP", ["TRAN"]);

  const headings = ["TRAN_ISNO", "TRAN_DATE", "TRAN_PROD", "TRAN_STAT"];
  if (transmissionData.TRAN_DESC) headings.push("TRAN_DESC");
  headings.push("TRAN_AGS", "TRAN_RECV", "TRAN_DLIM", "TRAN_RCON");
  result += generateAGSLine("HEADING", headings);

  const units = ["", "yyyy-mm-dd", "", "", "", ""];
  if (transmissionData.TRAN_DESC) units.push("");
  units.push("", "");
  result += generateAGSLine("UNIT", units);

  const types = ["X", "DT", "X", "X", "X", "X"];
  if (transmissionData.TRAN_DESC) types.push("X");
  types.push("X", "X");
  result += generateAGSLine("TYPE", types);

  const dataValues = [
    transmissionData.TRAN_ISNO,
    transmissionData.TRAN_DATE,
    transmissionData.TRAN_PROD,
    transmissionData.TRAN_STAT,
  ];
  if (transmissionData.TRAN_DESC) dataValues.push(transmissionData.TRAN_DESC);
  dataValues.push(
    transmissionData.TRAN_AGS,
    transmissionData.TRAN_RECV,
    transmissionData.TRAN_DLIM,
    transmissionData.TRAN_RCON
  );
  result += generateAGSLine("DATA", dataValues);

  result += "\r\n";
  return result;
};

/**
 * Cria dados TRAN com valores padrão
 * @param userInput Dados fornecidos pelo usuário (parcial)
 * @returns AGSTransmissionData completo com padrões aplicados
 */
export const createDefaultTRANData = (userInput: {
  TRAN_PROD?: string;
  TRAN_RECV?: string;
  TRAN_DESC?: string;
  TRAN_STAT?: string;
}): AGSTransmissionData => {
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0]; // yyyy-mm-dd

  return {
    TRAN_ISNO: "1",
    TRAN_DATE: formattedDate,
    TRAN_PROD: userInput.TRAN_PROD || "",
    TRAN_STAT: userInput.TRAN_STAT || "Final",
    TRAN_AGS: "4.1.1",
    TRAN_RECV: userInput.TRAN_RECV || "",
    TRAN_DESC: userInput.TRAN_DESC,
    TRAN_DLIM: "|",
    TRAN_RCON: "+",
  };
};

/**
 * Gera o grupo ABBR (Abreviações)
 */
export const generateABBRGroup = (abbreviations: AGSAbbreviation[]): string => {
  if (abbreviations.length === 0) return "";

  let result = "";

  result += generateAGSLine("GROUP", ["ABBR"]);
  result += generateAGSLine("HEADING", ["ABBR_HDNG", "ABBR_CODE", "ABBR_DESC"]);
  result += generateAGSLine("UNIT", ["", "", ""]);
  result += generateAGSLine("TYPE", ["X", "X", "X"]);

  // DATA lines - uma para cada abreviação
  abbreviations.forEach((abbr) => {
    result += generateAGSLine("DATA", [
      "GEOL_GEOL",
      abbr.code,
      abbr.description,
    ]);
  });

  result += "\r\n";
  return result;
};

/**
 * Gera o grupo TYPE (Definição de Tipos de Dados)
 */
export const generateTYPEGroup = (): string => {
  let result = "";

  result += generateAGSLine("GROUP", ["TYPE"]);
  result += generateAGSLine("HEADING", ["TYPE_TYPE", "TYPE_DESC"]);
  result += generateAGSLine("UNIT", ["", ""]);
  result += generateAGSLine("TYPE", ["X", "X"]);

  // Tipos usados no arquivo
  const types = [
    ["ID", "Identificador"],
    ["X", "Texto"],
    ["2DP", "Numérico, 2 casas decimais"],
    ["0DP", "Numérico, sem casas decimais"],
    ["DT", "Data (yyyy-mm-dd)"],
    ["PA", "Abreviação"],
  ];

  types.forEach(([code, desc]) => {
    result += generateAGSLine("DATA", [code, desc]);
  });

  result += "\r\n";
  return result;
};

/**
 * Gera o grupo UNIT (Definição de Unidades)
 */
export const generateUNITGroup = (): string => {
  let result = "";

  result += generateAGSLine("GROUP", ["UNIT"]);
  result += generateAGSLine("HEADING", ["UNIT_UNIT", "UNIT_DESC"]);
  result += generateAGSLine("UNIT", ["", ""]);
  result += generateAGSLine("TYPE", ["X", "X"]);

  // Unidades usadas no arquivo
  const units = [
    ["m", "Metro"],
    ["yyyy-mm-dd", "Data (ano-mês-dia)"],
  ];

  units.forEach(([unit, desc]) => {
    result += generateAGSLine("DATA", [unit, desc]);
  });

  result += "\r\n";
  return result;
};

/**
 * Gera o grupo LOCA (Localização das Sondagens)
 */
export const generateLOCAGroup = (palito: PalitoData): string => {
  // Define a profundidade máxima
  const maxDepth =
    palito.max_depth || palito.depths[palito.depths.length - 1] || undefined;

  // Verifica quais campos temos disponíveis
  const hasX = palito.x !== undefined;
  const hasY = palito.y !== undefined;
  const hasZ = palito.z !== undefined;
  const hasDepth = maxDepth !== undefined;

  let result = "";
  result += generateAGSLine("GROUP", ["LOCA"]);

  // Monta HEADING dinamicamente
  const headings = ["LOCA_ID"];
  if (hasX) headings.push("LOCA_NATE");
  if (hasY) headings.push("LOCA_NATN");
  if (hasZ) headings.push("LOCA_GL");
  if (hasDepth) headings.push("LOCA_FDEP");
  result += generateAGSLine("HEADING", headings);

  // UNIT
  const units = [""];
  if (hasX) units.push("m");
  if (hasY) units.push("m");
  if (hasZ) units.push("m");
  if (hasDepth) units.push("m");
  result += generateAGSLine("UNIT", units);

  // TYPE
  const types = ["ID"];
  if (hasX) types.push("2DP");
  if (hasY) types.push("2DP");
  if (hasZ) types.push("2DP");
  if (hasDepth) types.push("2DP");
  result += generateAGSLine("TYPE", types);

  // DATA line
  const dataValues: (string | number)[] = [palito.hole_id];
  if (hasX) dataValues.push(palito.x || "");
  if (hasY) dataValues.push(palito.y || "");
  if (hasZ) dataValues.push(palito.z || "");
  if (hasDepth) dataValues.push(maxDepth || "");

  result += generateAGSLine("DATA", dataValues, types);

  result += "\r\n";
  return result;
};

/**
 * Gera o grupo GEOL (Descrição Geológica)
 */
export const generateGEOLGroup = (palito: PalitoData): string => {
  const hasGeology = palito.geology.length > 0;
  const hasDepths = palito.depths.length > 0;
  const hasInterp = palito.interp && palito.interp.length > 0;

  if (!hasGeology || !hasDepths) {
    return ""; // Precisa de geology e depths no mínimo
  }

  let result = "";
  result += generateAGSLine("GROUP", ["GEOL"]);

  const headings = ["LOCA_ID", "GEOL_TOP", "GEOL_BASE", "GEOL_DESC"];
  if (hasInterp) headings.push("GEOL_GEOL");
  result += generateAGSLine("HEADING", headings);

  const units = ["", "m", "m", ""];
  if (hasInterp) units.push("");
  result += generateAGSLine("UNIT", units);

  const types = ["ID", "2DP", "2DP", "X"];
  if (hasInterp) types.push("PA");
  result += generateAGSLine("TYPE", types);

  // DATA lines
  if (palito.depths.length < 2) return result + "\r\n";

  for (let i = 0; i < palito.depths.length - 1; i++) {
    const dataValues: (string | number)[] = [
      palito.hole_id,
      palito.depths[i],
      palito.depths[i + 1],
      palito.geology[i] || "",
    ];

    if (hasInterp) {
      dataValues.push(palito.interp?.[i] || "");
    }

    result += generateAGSLine("DATA", dataValues, types);
  }

  result += "\r\n";
  return result;
};

/**
 * Gera o grupo ISPT
 */
export const generateISPTGroup = (palito: PalitoData): string => {
  const hasNSPT = palito.nspt.values.length > 0;
  if (!hasNSPT) return "";

  const types = ["ID", "2DP", "X"];

  let result = "";
  result += generateAGSLine("GROUP", ["ISPT"]);
  result += generateAGSLine("HEADING", ["LOCA_ID", "ISPT_TOP", "ISPT_REP"]);
  result += generateAGSLine("UNIT", ["", "m", ""]);
  result += generateAGSLine("TYPE", types);

  // DATA lines
  const maxDepth =
    palito.max_depth || palito.depths[palito.depths.length - 1] || 0;
  const firstTo = Math.ceil(maxDepth) - palito.nspt.values.length + 1;

  let currentDepth = 0;
  palito.nspt.values.forEach((value, index) => {
    currentDepth = index === 0 ? firstTo : currentDepth + 1;
    result += generateAGSLine(
      "DATA",
      [palito.hole_id, currentDepth, value],
      types
    );
  });

  result += "\r\n";
  return result;
};

/**
 * Gera o grupo WSTG (Nível d'Água)
 */
export const generateWSTGGroup = (palito: PalitoData): string => {
  const hasWaterLevel =
    palito.water_level !== undefined && palito.water_level >= 0;
  if (!hasWaterLevel) return "";

  const types = ["ID", "2DP"];

  let result = "";
  result += generateAGSLine("GROUP", ["WSTG"]);
  result += generateAGSLine("HEADING", ["LOCA_ID", "WSTG_DPTH"]);
  result += generateAGSLine("UNIT", ["", "m"]);
  result += generateAGSLine("TYPE", types);

  // DATA line
  result += generateAGSLine(
    "DATA",
    [palito.hole_id, palito.water_level!],
    types
  );

  result += "\r\n";
  return result;
};

/**
 * Gera arquivo AGS completo para uma sondagem
 * @param palito Dados da sondagem
 * @param projectData Dados do projeto
 * @param transmissionData Dados de transmissão
 * @param abbreviations Lista de abreviações
 * @returns String completa do arquivo AGS
 */
export const generateAGSFile = (
  palito: PalitoData,
  projectData: AGSProjectData,
  transmissionData: AGSTransmissionData,
  abbreviations: AGSAbbreviation[]
): string => {
  let agsContent = "";

  // Grupos obrigatórios (sempre na ordem especificada)
  agsContent += generatePROJGroup(projectData);
  agsContent += generateTRANGroup(transmissionData);

  // ABBR - obrigatório se houver abreviações
  if (abbreviations.length > 0) {
    agsContent += generateABBRGroup(abbreviations);
  }

  // TYPE e UNIT - sempre obrigatórios
  agsContent += generateTYPEGroup();
  agsContent += generateUNITGroup();

  // Grupos de dados (opcionais conforme disponibilidade)
  const locaGroup = generateLOCAGroup(palito);
  if (locaGroup) agsContent += locaGroup;

  const geolGroup = generateGEOLGroup(palito);
  if (geolGroup) agsContent += geolGroup;

  const isptGroup = generateISPTGroup(palito);
  if (isptGroup) agsContent += isptGroup;

  const wstgGroup = generateWSTGGroup(palito);
  if (wstgGroup) agsContent += wstgGroup;

  return agsContent;
};

/**
 * Gera múltiplos arquivos AGS (um por sondagem)
 * @param palitoDataArray Array com dados de todas as sondagens
 * @param projectData Dados do projeto
 * @param userTranInput Dados de transmissão fornecidos pelo usuário
 * @param abbreviations Lista de abreviações
 * @returns Array de objetos {filename, content}
 */
export const generateMultipleAGSFiles = (
  palitoDataArray: PalitoData[],
  projectData: AGSProjectData,
  userTranInput: {
    TRAN_PROD?: string;
    TRAN_RECV?: string;
    TRAN_DESC?: string;
    TRAN_STAT?: string;
  },
  abbreviations: AGSAbbreviation[]
): { filename: string; content: string }[] => {
  const transmissionData = createDefaultTRANData(userTranInput);
  const files: { filename: string; content: string }[] = [];

  palitoDataArray.forEach((palito) => {
    const agsContent = generateAGSFile(
      palito,
      projectData,
      transmissionData,
      abbreviations
    );

    files.push({
      filename: `${palito.hole_id}.ags`,
      content: agsContent,
    });
  });

  return files;
};
