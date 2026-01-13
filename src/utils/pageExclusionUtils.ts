export const parsePageRanges = (
  input: string,
  maxPage: number
): { pages: Set<number>; isValid: boolean } => {
  // Remove todos os espaços
  const cleaned = input.replace(/\s+/g, "");

  // Se vazio, é válido (nenhuma página selecionada)
  if (!cleaned) {
    return { pages: new Set<number>(), isValid: true };
  }

  // Valida caracteres permitidos
  if (!/^[0-9,\-]+$/.test(cleaned)) {
    return { pages: new Set<number>(), isValid: false };
  }

  const pages = new Set<number>();

  // Split por vírgulas, ignora vazios
  const segments = cleaned.split(",").filter((s) => s.trim());

  for (const segment of segments) {
    // Remove hífens duplicados (5--10 → 5-10)
    const normalized = segment.replace(/-+/g, "-");

    // Se termina com hífen, remove (5- → 5)
    const trimmed = normalized.replace(/-$/, "");

    if (trimmed.includes("-")) {
      // É um range
      const parts = trimmed.split("-").filter((p) => p);

      if (parts.length === 2) {
        let [start, end] = parts.map((p) => parseInt(p, 10));

        // Inverte se necessário
        if (start > end) {
          [start, end] = [end, start];
        }

        // Adiciona range respeitando maxPage
        for (let i = start; i <= Math.min(end, maxPage); i++) {
          if (i >= 1) {
            pages.add(i);
          }
        }
      } else if (parts.length === 1) {
        // Range incompleto (ex: "-5" ou "5-")
        const num = parseInt(parts[0], 10);
        if (num >= 1 && num <= maxPage) {
          pages.add(num);
        }
      }
    } else {
      // Número único
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && num <= maxPage) {
        pages.add(num);
      }
    }
  }

  return { pages, isValid: true };
};

export const formatPageRanges = (pages: Set<number>): string => {
  if (pages.size === 0) return "";

  // Converte pra array ordenado
  const sorted = Array.from(pages).sort((a, b) => a - b);

  const ranges: string[] = [];
  let rangeStart = sorted[0];
  let rangeEnd = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];

    // Se é sequencial, estende o range
    if (current === rangeEnd + 1) {
      rangeEnd = current;
    } else {
      // Finaliza range anterior
      if (rangeStart === rangeEnd) {
        ranges.push(`${rangeStart}`);
      } else {
        ranges.push(`${rangeStart}-${rangeEnd}`);
      }

      // Inicia novo range
      rangeStart = current;
      rangeEnd = current;
    }
  }

  // Adiciona último range
  if (rangeStart === rangeEnd) {
    ranges.push(`${rangeStart}`);
  } else {
    ranges.push(`${rangeStart}-${rangeEnd}`);
  }

  return ranges.join(", ");
};
