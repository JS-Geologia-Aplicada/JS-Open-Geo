export interface KmlCoordinates {
  lon: number;
  lat: number;
  alt?: number;
}

export interface KmlPlacemark {
  name: string;
  point: KmlPoint;
  description?: string;
  styleUrl?: string;
  extendedData?: KmlExtendedData;
}

export interface KmlPoint {
  coordinates: KmlCoordinates;
}

export interface KmlStyle {
  id: string;
  balloon?: {
    bgColor: string;
    textColor: string;
    text: string;
    displayMode: string;
  };
  icon?: {
    color?: string;
    scale?: number;
    href?: string;
  };
  label?: {
    color?: string;
    scale?: number;
  };
  line?: {
    color?: string;
    width?: number;
  };
  list?: {
    itemType?: "check" | "radioFolder" | "checkOffOnly" | "checkHideChildren";
    bgColor?: string;
    itemIcon?: {
      state:
        | "open"
        | "closed"
        | "error"
        | "fetching0"
        | "fetching1"
        | "fetching2";
      href: string;
    }[];
  };
  poly?: {
    color?: string;
    colorMode?: string;
  };
}

export interface KmlExtendedData {
  data: KmlData[];
  // Não implementados: Schema e namespace
}

export interface KmlData {
  displayName: string;
  value: string;
}

interface KmlDocument {
  name: string;
  placemarks: KmlPlacemark[];
  styles: KmlStyle[];
}

export class KmlBuilder {
  private document: KmlDocument;

  constructor(documentName: string) {
    this.document = {
      name: documentName,
      placemarks: [],
      styles: [],
    };
  }

  addStyle(style: KmlStyle): KmlBuilder {
    this.document.styles.push(style);
    return this;
  }

  // Overload signatures
  addPlacemark(
    name: string,
    point: KmlPoint,
    options?: {
      description?: string;
      styleUrl?: string;
      data?: KmlData[];
    }
  ): KmlBuilder;
  addPlacemark(placemark: KmlPlacemark): KmlBuilder;
  addPlacemark(
    nameOrPlacemark: string | KmlPlacemark,
    point?: KmlPoint,
    options?: {
      description?: string;
      styleUrl?: string;
      data?: KmlData[];
    }
  ): KmlBuilder {
    if (typeof nameOrPlacemark === "string") {
      const placemark: KmlPlacemark = {
        name: nameOrPlacemark,
        point: point!,
        description: options?.description,
        styleUrl: options?.styleUrl,
        extendedData: options?.data ? { data: options.data } : undefined,
      };
      this.document.placemarks.push(placemark);
    } else {
      this.document.placemarks.push(nameOrPlacemark);
    }
    return this;
  }

  createPoint = (lon: number, lat: number, alt?: number): KmlPoint => {
    return {
      coordinates: { lon, lat, alt },
    };
  };

  build(): string {
    return this.generateKmlString();
  }

  private generateKmlString(): string {
    const stylesXml = this.document.styles
      .map((style) => this.styleToXml(style))
      .join("\n");
    const placemarksXml = this.document.placemarks
      .map((pm) => this.placemarkToXml(pm))
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${this.escapeXml(this.document.name)}</name>
${stylesXml}
${placemarksXml}
  </Document>
</kml>`;
  }

  private styleToXml(style: KmlStyle): string {
    const styleParts: string[] = [`    <Style id="${style.id}">`];

    if (style.balloon) {
      styleParts.push(`      <BalloonStyle>`);
      if (style.balloon.bgColor) {
        styleParts.push(`        <bgColor>${style.balloon.bgColor}</bgColor>`);
      }
      if (style.balloon.textColor) {
        styleParts.push(
          `        <textColor>${style.balloon.textColor}</textColor>`
        );
      }
      if (style.balloon.text) {
        styleParts.push(`        <text>${style.balloon.text}</text>`);
      }
      if (style.balloon.displayMode) {
        styleParts.push(
          `        <displayMode>${style.balloon.displayMode}</displayMode>`
        );
      }
      styleParts.push(`      </BalloonStyle>`);
    }

    if (style.icon) {
      styleParts.push(`      <IconStyle>`);
      if (style.icon.color) {
        styleParts.push(`        <color>${style.icon.color}</color>`);
      }
      if (style.icon.scale) {
        styleParts.push(
          `        <scale>${style.icon.scale.toString()}</scale>`
        );
      }
      if (style.icon.href) {
        styleParts.push(`        <Icon>
          <href>${style.icon.href}</href>
        </Icon>`);
      }
      styleParts.push(`      </IconStyle>`);
    }

    if (style.label) {
      styleParts.push(`      <LabelStyle>`);
      if (style.label.color) {
        styleParts.push(`        <color>${style.label.color}</color>`);
      }
      if (style.label.scale) {
        styleParts.push(
          `        <scale>${style.label.scale.toString()}</scale>`
        );
      }
      styleParts.push(`      </LabelStyle>`);
    }

    if (style.line) {
      styleParts.push(`      <LineStyle>`);
      if (style.line.color) {
        styleParts.push(`        <color>${style.line.color}</color>`);
      }
      if (style.line.width) {
        styleParts.push(
          `        <width>${style.line.width.toString()}</width>`
        );
      }
      styleParts.push(`      </LineStyle>`);
    }

    if (style.list) {
      styleParts.push(`      <ListStyle>`);
      if (style.list.itemType) {
        styleParts.push(
          `        <listItemType>${style.list.itemType}</listItemType>`
        );
      }
      if (style.list.bgColor) {
        styleParts.push(`        <bgColor>${style.list.bgColor}</bgColor>`);
      }
      if (style.list.itemIcon) {
        style.list.itemIcon.forEach((icon) => {
          styleParts.push(`        <ItemIcon>
          <state>${icon.state}</state>
          <href>${icon.href}</href>
        </ItemIcon>`);
        });
      }
      styleParts.push(`      </ListStyle>`);
    }

    if (style.poly) {
      styleParts.push(`      <PolyStyle>`);
      if (style.poly.color) {
        styleParts.push(`        <color>${style.poly.color}</color>`);
      }
      if (style.poly.colorMode) {
        styleParts.push(
          `        <colorMode>${style.poly.colorMode}</colorMode>`
        );
      }
      styleParts.push(`      </PolyStyle>`);
    }

    styleParts.push("    </Style>");
    return styleParts.join("\n");
  }

  private placemarkToXml(placemark: KmlPlacemark): string {
    const { name, description, point, styleUrl, extendedData } = placemark;
    const alt = point.coordinates.alt ?? 0;

    return `    <Placemark>
      <name>${this.escapeXml(name)}</name>
      ${
        description
          ? `<description>${this.escapeXml(description)}</description>`
          : ""
      }
      ${styleUrl ? `<styleUrl>${styleUrl}</styleUrl>` : ""}
      <Point>
        <coordinates>${point.coordinates.lon},${
      point.coordinates.lat
    },${alt}</coordinates>
      </Point>
      ${
        extendedData && extendedData.data.length > 0
          ? `
      <ExtendedData>
        ${extendedData.data
          .map(
            (data) => `<Data name="${data.displayName}">
          <displayName>${data.displayName}</displayName>
          <value>${data.value}</value>
        </Data>`
          )
          .join("\n")}
      </ExtendedData>
        `
          : ""
      }
    </Placemark>`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}
