import type { AGSAbbreviation } from "../types";

// Dicionário padrão de abreviações geológicas
export const DEFAULT_GEOLOGY_ABBREVIATIONS: Record<string, string> = {
  AL: "Aluvião",
  AT: "Aterro",
  BL: "Bloco de Rocha",
  CO: "Colúvio",
  ORG: "Solo Orgânico",
  TA: "Terraço Aluvionar",
  TL: "Tálus",
  SM: "Sedimentos Marinhos",
  SFL: "Sedimentos Flúvio-Lacustres",
  SEO: "Sedimentos Eólicos",
  SFM: "Sedimento Flúvio-Marinho",
  SBT: "Sedimentos de Bacias Terciárias, de São Paulo, de Taubaté, de Curitiba, etc",
  SE: "Solo Eluvial",
  SR: "Solo Residual",
  SAR: "Solo de Alteração de Rocha",
  SRJ: "Solo Residual Jovem",
  SRM: "Solo Residual Maduro",
  RAM: "Rocha Alterada Mole",
  RAD: "Rocha Alterada Dura",
  RS: "Rocha Sã",
};

/**
 * Detecta abreviações nos dados de geologia
 * @param extractedTexts Dados extraídos do PDF
 * @param areas Áreas configuradas
 * @returns Lista de abreviações detectadas
 */
export const detectAbbreviations = (
  interpValues: string[]
): AGSAbbreviation[] => {
  const detectedCodes = new Set<string>();
  const abbreviations: AGSAbbreviation[] = [];

  // Processa cada valor de interpretação
  interpValues.forEach((value) => {
    if (!value || value.trim() === "") return;

    // Remove espaços e separa por "+" se houver concatenação
    const codes = value
      .trim()
      .split("+")
      .map((code) => code.trim())
      .filter((code) => code !== "");

    codes.forEach((code) => {
      if (!detectedCodes.has(code)) {
        detectedCodes.add(code);
        abbreviations.push({
          code: code,
          description: DEFAULT_GEOLOGY_ABBREVIATIONS[code] || "",
          isUserDefined: !DEFAULT_GEOLOGY_ABBREVIATIONS[code],
        });
      }
    });
  });

  return abbreviations.sort((a, b) => a.code.localeCompare(b.code));
};

/**
 * Valida se todas as abreviações têm definição
 * @param abbreviations Lista de abreviações
 * @returns true se todas têm definição, false caso contrário
 */
export const validateAbbreviations = (
  abbreviations: AGSAbbreviation[]
): boolean => {
  return abbreviations.every((abbr) => abbr.description.trim() !== "");
};
