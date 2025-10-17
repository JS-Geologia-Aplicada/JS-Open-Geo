import proj4 from "proj4";

export const DATUMS = [
  { value: "SAD69", label: "SAD69 (South American Datum 1969)" },
  {
    value: "SIRGAS2000",
    label: "SIRGAS2000 (Sistema de Referência Geocêntrico)",
  },
  { value: "WGS84", label: "WGS84 (World Geodetic System 1984)" },
] as const;

export const UTM_ZONES = [
  { value: "18S", label: "18S - AC (oeste)" },
  { value: "19S", label: "19S - AC (leste); AM (oeste)" },
  { value: "20S", label: "20S - AM (centro); RR, RO" },
  { value: "21S", label: "21S - AM (leste); PA, MT, MS, RS (oeste)" },
  {
    value: "22S",
    label: "22S - AP, PA, MT, MS, TO, GO, PR, SC; SP (oeste),  RS (leste)",
  },
  { value: "23S", label: "23S - MA, PI, MG, RJ; SP (leste); BA (oeste)" },
  { value: "24S", label: "24S - CE, RN, PB, PE, AL, SE, ES; BA (leste)" },
  { value: "25S", label: "25S - RN, PB, PE, AL (leste)" },
] as const;

export type DatumType = (typeof DATUMS)[number]["value"];
export type ZoneType = (typeof UTM_ZONES)[number]["value"];

export interface CoordinateSystem {
  datum: "SAD69" | "SIRGAS2000" | "WGS84";
  zone?: "18S" | "19S" | "20S" | "21S" | "22S" | "23S" | "24S" | "25S";
}

export interface PointCoords {
  id: string;
  coords: [number, number];
}

export const convertGeographicCoordinates = (
  coords: [number, number],
  sourceSystem: CoordinateSystem,
  targetSystem?: CoordinateSystem
): [number, number] => {
  const sourceProj = getProj4String(sourceSystem.datum, sourceSystem.zone);
  const targetProj = targetSystem
    ? getProj4String(targetSystem.datum, targetSystem.zone)
    : "+proj=longlat +datum=WGS84 +no_defs";

  return proj4(sourceProj, targetProj, coords);
};

export const getProj4String = (datum: string, zone?: string): string => {
  if (!zone) {
    switch (datum) {
      case "WGS84":
        return "+proj=longlat +datum=WGS84 +no_defs";
      case "SAD69":
        return "+proj=longlat +datum=SAD69 +no_defs";
      case "SIRGAS2000":
        return "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs";
      default:
        throw new Error(`Datum não suportado: ${datum}`);
    }
  }

  const zoneNumber = zone.replace("S", "");

  switch (datum) {
    case "SAD69":
      return `+proj=utm +zone=${zoneNumber} +south +datum=SAD69 +units=m +no_defs`;

    case "SIRGAS2000":
      return `+proj=utm +zone=${zoneNumber} +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs`;

    case "WGS84":
      return `+proj=utm +zone=${zoneNumber} +south +datum=WGS84 +units=m +no_defs`;

    default:
      throw new Error(`Datum não suportado: ${datum}`);
  }
};

/**
 * Função para gerar KML com base nos pontos
 * @param points Deve estar em WGS84
 * @returns
 */
export const generateKMLString = (points: PointCoords[]): string => {
  // Header do KML
  const kmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Sondagens - JS Geologia Aplicada</name>
    <description>Pontos de sondagem exportados pelo JS OpenGeo</description>
    
    <!-- Estilo para ícones de sondagem -->
    <Style id="sondagem-style">
      <IconStyle>
        <scale>1.2</scale>
        <Icon>
          <href>https://maps.google.com/mapfiles/kml/paddle/blu-blank.png</href>
        </Icon>
        <hotSpot x="0.5" y="0.5" xunits="fraction" yunits="fraction"/>
      </IconStyle>
      <LabelStyle>
        <scale>0.8</scale>
        <color>ff0000ff</color>
      </LabelStyle>
    </Style>`;

  // Gerar Placemarks para cada ponto
  const placemarks = points
    .map((point) => {
      // KML usa formato: longitude,latitude,altitude
      const coordinates = `${point.coords[0]},${point.coords[1]},0`;

      return `
    <Placemark>
      <name>${escapeXML(point.id)}</name>
      <description>
        <![CDATA[
          <b>ID da Sondagem:</b> ${escapeXML(point.id)}<br/>
          <b>Latitude:</b> ${point.coords[0].toFixed(6)}°<br/>
          <b>Longitude:</b> ${point.coords[1].toFixed(6)}°<br/>
          <i>Gerado por JS OpenGeo</i>
        ]]>
      </description>
      <styleUrl>#sondagem-style</styleUrl>
      <Point>
        <coordinates>${coordinates}</coordinates>
      </Point>
    </Placemark>`;
    })
    .join("");

  // Footer do KML
  const kmlFooter = `
  </Document>
</kml>`;

  return kmlHeader + placemarks + kmlFooter;
};

// Helper function para escapar caracteres especiais do XML
const escapeXML = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};
