import { useMemo } from "react";
import { Button, Form } from "react-bootstrap";
import * as XLSX from "xlsx";
import { parseKmlFile } from "@/utils/kmlParser";
import JSZip from "jszip";
import {
  convertGeographicCoordinates,
  DATUMS,
  UTM_ZONES,
  type DatumType,
  type ZoneType,
} from "@/utils/mapUtils";
import { ToolLayout } from "./ToolLayout";
import { ToolControlSection } from "./ToolControlSection";
import { FileDropzone } from "../FileDropzone";
import { DataTable } from "../DataTable";
import { useToolState } from "@/hooks/useToolState";

const KmlToXlsx = () => {
  const { state, update } = useToolState("kmlToXlsx");
  const {
    selectedFile,
    convertCoordinates,
    selectedDatum,
    selectedZone,
    sondagens,
  } = state;

  const processedSondagens = useMemo(() => {
    if (!convertCoordinates || !selectedDatum) {
      return sondagens.map((s) => ({
        ...s,
        displayCoords: {
          x: s.coordinates.lon,
          y: s.coordinates.lat,
          xLabel: "Longitude",
          yLabel: "Latitude",
        },
      }));
    }

    return sondagens.map((s) => {
      let x = s.coordinates.lon;
      let y = s.coordinates.lat;
      let xLabel = "Longitude";
      let yLabel = "Latitude";

      if (selectedDatum === "WGS84") {
        xLabel = "Longitude";
        yLabel = "Latitude";
      } else if (selectedZone) {
        [x, y] = convertGeographicCoordinates(
          [s.coordinates.lon, s.coordinates.lat],
          { datum: "WGS84", zone: undefined },
          { datum: selectedDatum, zone: selectedZone }
        );
        xLabel = "X (UTM)";
        yLabel = "Y (UTM)";
      }

      return {
        ...s,
        displayCoords: { x, y, xLabel, yLabel },
      };
    });
  }, [sondagens, convertCoordinates, selectedDatum, selectedZone]);

  const handleFileChange = async (files: File[]) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    update({ selectedFile: file });

    try {
      let kmlText: string;

      if (file.name.endsWith(".kmz")) {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(file);
        const kmlFile = Object.keys(zipContent.files).find((name) =>
          name.endsWith(".kml")
        );

        if (!kmlFile) {
          throw new Error("Nenhum arquivo KML encontrado dentro do KMZ");
        }

        kmlText = await zipContent.files[kmlFile].async("text");
      } else {
        kmlText = await file.text();
      }

      const parsedSondagens = parseKmlFile(kmlText);
      update({ sondagens: parsedSondagens });
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      alert("Erro ao processar arquivo KML/KMZ: " + error);
    }
  };

  const handleExportXlsx = () => {
    if (sondagens.length === 0) return;

    const excelData = processedSondagens.map((s) => ({
      Nome: s.name,
      [s.displayCoords.xLabel]: s.displayCoords.x,
      [s.displayCoords.yLabel]: s.displayCoords.y,
      Elevação: s.coordinates.elevation,
      ...s.extendedData,
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sondagens");
    XLSX.writeFile(wb, "sondagens-kml.xlsx");
  };

  const extendedDataColumns = Array.from(
    new Set(sondagens.flatMap((s) => Object.keys(s.extendedData)))
  );

  return (
    <ToolLayout
      title="KML → XLSX"
      controls={
        <>
          {/* Área de Upload */}
          <FileDropzone
            onFileSelect={handleFileChange}
            selectedFile={selectedFile}
            accept={{
              "application/vnd.google-earth.kml+xml": [".kml"],
              "application/vnd.google-earth.kmz": [".kmz"],
            }}
            templateTab="kmlToXlsx"
          />
          {selectedFile && (
            <>
              <ToolControlSection title="Conversão de Coordenadas">
                <>
                  <Form.Group>
                    <div className="d-flex gap-2 text-start mb-2 align-items-center">
                      <Form.Check
                        type="switch"
                        checked={convertCoordinates}
                        onChange={(e) =>
                          update({ convertCoordinates: e.target.checked })
                        }
                      />
                      <Form.Label className="mb-0">
                        Converter coordenadas
                      </Form.Label>
                    </div>
                  </Form.Group>
                  <div className="d-flex gap-3">
                    <Form.Select
                      aria-label="Datum"
                      value={selectedDatum || ""}
                      onChange={(e) =>
                        update({ selectedDatum: e.target.value as DatumType })
                      }
                    >
                      <option value="">Datum</option>
                      {DATUMS.map((datum) => (
                        <option key={datum.value} value={datum.value}>
                          {datum.label}
                        </option>
                      ))}
                    </Form.Select>

                    {/* Seleção de Zona UTM */}
                    <Form.Select
                      aria-label="Zona UTM"
                      value={selectedZone || ""}
                      onChange={(e) =>
                        update({ selectedZone: e.target.value as ZoneType })
                      }
                      disabled={!selectedDatum || selectedDatum === "WGS84"}
                    >
                      <option value="">Zona UTM</option>
                      {UTM_ZONES.map((zone) => (
                        <option key={zone.value} value={zone.value}>
                          {zone.label}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </>
              </ToolControlSection>
              <ToolControlSection title="Exportar">
                <Button
                  onClick={handleExportXlsx}
                  disabled={sondagens.length === 0}
                  className="w-100"
                >
                  XLSX
                </Button>
              </ToolControlSection>
            </>
          )}
        </>
      }
      panel={
        <>
          {sondagens.length > 0 && (
            <>
              <DataTable
                data={processedSondagens as Record<string, any>[]}
                columns={[
                  { key: "name", header: "Nome" },
                  {
                    key: "x",
                    header:
                      processedSondagens[0]?.displayCoords.xLabel ||
                      "Longitude",
                    render: (row) =>
                      row.displayCoords.x.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 3,
                      }),
                  },
                  {
                    key: "y",
                    header:
                      processedSondagens[0]?.displayCoords.yLabel || "Latitude",
                    render: (row) =>
                      row.displayCoords.y.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 3,
                      }),
                  },
                  {
                    key: "elevation",
                    header: "Elevação",
                    render: (row) =>
                      row.coordinates.elevation?.toFixed(2) || "-",
                  },
                  ...extendedDataColumns.map((col) => ({
                    key: col,
                    header: col,
                    render: (row: any) => row.extendedData[col] || "-",
                  })),
                ]}
                maxHeight="calc(100vh - 400px)"
                title={`Dados extraídos (${sondagens.length} pontos)`}
              />
            </>
          )}
        </>
      }
    />
  );
};

export default KmlToXlsx;
