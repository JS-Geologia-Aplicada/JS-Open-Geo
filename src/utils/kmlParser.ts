export interface KmlSondagem {
  name: string;
  coordinates: {
    lon: number;
    lat: number;
    elevation?: number;
  };
  extendedData: Record<string, string>;
}

export const parseKmlFile = (kmlText: string): KmlSondagem[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(kmlText, "text/xml");

  // Verificar se tem erro de parsing
  const parserError = xmlDoc.querySelector("parsererror");
  if (parserError) {
    throw new Error("Erro ao parsear KML: " + parserError.textContent);
  }

  const placemarks = xmlDoc.querySelectorAll("Placemark");
  const sondagens: KmlSondagem[] = [];

  placemarks.forEach((placemark) => {
    // 1. Extrair nome
    const nameEl = placemark.querySelector("name");
    const name = nameEl?.textContent?.trim() || "Sem nome";

    // 2. Extrair coordenadas
    const coordsEl = placemark.querySelector("Point > coordinates");
    const coordsText = coordsEl?.textContent?.trim();

    if (!coordsText) {
      console.warn(`Placemark "${name}" sem coordenadas, ignorando.`);
      return;
    }

    const [lonStr, latStr, elevStr] = coordsText.split(",");
    const coordinates = {
      lon: parseFloat(lonStr),
      lat: parseFloat(latStr),
      elevation: elevStr ? parseFloat(elevStr) : undefined,
    };

    // 3. Extrair ExtendedData
    const extendedData: Record<string, string> = {};
    const dataElements = placemark.querySelectorAll("ExtendedData > Data");

    dataElements.forEach((dataEl) => {
      const dataName = dataEl.getAttribute("name");
      const valueEl = dataEl.querySelector("value");
      const value = valueEl?.textContent?.trim();

      if (dataName && value) {
        extendedData[dataName] = value;
      }
    });

    sondagens.push({
      name,
      coordinates,
      extendedData,
    });
  });

  return sondagens;
};
