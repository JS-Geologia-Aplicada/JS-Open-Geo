import { useEffect, useMemo } from "react";
import { Alert, Button, Form } from "react-bootstrap";
import JSZip from "jszip";
import { KmlBuilder, type KmlData } from "@/utils/kmlGenerator";
import {
  convertGeographicCoordinates,
  DATUMS,
  UTM_ZONES,
  type DatumType,
  type ZoneType,
} from "@/utils/mapUtils";
import { toast } from "react-toastify";
import { processXlsxData, readXlsxFile, type XlsxRow } from "@/utils/xlsxUtils";
import { ToolLayout } from "./ToolLayout";
import { FileDropzone } from "../FileDropzone";
import { ToolControlSection } from "./ToolControlSection";
import { DataTable } from "../DataTable";
import { useToolState } from "@/hooks/useToolState";
import { analytics } from "@/utils/analyticsUtils";

interface ParsedSondagem {
  name: string;
  lon: number;
  lat: number;
  extraData: Record<string, any>;
}

const XlsxToKml = () => {
  const { state, update } = useToolState("xlsxToKml");

  const {
    selectedFile,
    rawData,
    headers,
    hasHeader,
    nameColumnIndex,
    xColumnIndex,
    yColumnIndex,
    selectedDatum,
    selectedZone,
  } = state;

  const handleFileChange = async (files: File[]) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    update({
      selectedFile: file,
      hasHeader: false,
      headers: [],
      rawData: [],
      nameColumnIndex: 0,
      xColumnIndex: 1,
      yColumnIndex: 2,
    });

    try {
      const dataArray = await readXlsxFile(file);

      if (dataArray.length === 0) {
        toast.error("Planilha vazia!");
        return;
      }

      const processed = processXlsxData(dataArray, false);
      update({ headers: processed.headers, rawData: processed.data });
    } catch (error) {
      console.error("Erro ao ler arquivo:", error);
      toast.error("Erro ao ler arquivo XLSX");
    }
  };

  // Processar dados com conversão
  const processedData = useMemo((): {
    valid: ParsedSondagem[];
    invalid: { row: XlsxRow; reason: string }[];
  } => {
    // Se faltar alguma config, retorna vazio
    if (
      nameColumnIndex === undefined ||
      xColumnIndex === undefined ||
      yColumnIndex === undefined ||
      !selectedDatum ||
      rawData.length === 0
    ) {
      return { valid: [], invalid: [] };
    }

    const nameCol = headers[nameColumnIndex];
    const xCol = headers[xColumnIndex];
    const yCol = headers[yColumnIndex];

    const valid: ParsedSondagem[] = [];
    const invalid: { row: XlsxRow; reason: string }[] = [];

    rawData.forEach((row) => {
      let xRaw = row[xCol];
      let yRaw = row[yCol];
      const name = String(row[nameCol] || "Sem nome");

      const x = parseFloat(xRaw);
      const y = parseFloat(yRaw);

      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        invalid.push({
          row,
          reason: `Coordenadas inválidas: X=${xRaw}, Y=${yRaw}`,
        });
        return;
      }

      try {
        let lon = x;
        let lat = y;
        if (selectedDatum !== "WGS84" && selectedZone) {
          [lon, lat] = convertGeographicCoordinates(
            [x, y],
            { datum: selectedDatum, zone: selectedZone },
            { datum: "WGS84", zone: undefined },
          );
        }
        if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
          invalid.push({
            row,
            reason: `Conversão gerou coordenadas inválidas`,
          });
          return;
        }
        const extraData: Record<string, any> = {};
        headers.forEach((header, index) => {
          if (
            index !== nameColumnIndex &&
            index !== xColumnIndex &&
            index !== yColumnIndex
          ) {
            const value = row[header];
            if (value !== null && value !== undefined && value !== "") {
              extraData[header] = value;
            }
          }
        });
        valid.push({ name, lon, lat, extraData });
      } catch (e) {
        invalid.push({
          row,
          reason: `Erro na conversão: ${e}`,
        });
      }
    });
    return { valid, invalid };
  }, [
    rawData,
    nameColumnIndex !== undefined,
    xColumnIndex !== undefined,
    yColumnIndex !== undefined,
    selectedDatum,
    selectedZone,
    headers,
  ]);

  useEffect(() => {
    console.log(processedData);
  }, [processedData]);

  const handleExport = async (kmz: boolean) => {
    if (processedData.valid.length === 0) return;

    const kml = new KmlBuilder("Sondagens XLSX");

    processedData.valid.forEach((sondagem) => {
      const data: KmlData[] = Object.entries(sondagem.extraData)
        .filter(
          ([_, value]) => value !== null && value !== undefined && value !== "",
        )
        .map(([key, value]) => ({
          displayName: hasHeader ? key : `Coluna ${key}`,
          value: String(value),
        }));

      kml.addPlacemark(
        sondagem.name,
        kml.createPoint(sondagem.lon, sondagem.lat),
        { data: data.length > 0 ? data : undefined },
      );
    });

    const kmlString = kml.build();

    if (kmz) {
      const zip = new JSZip();
      zip.file("doc.kml", kmlString);
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "sondagens.kmz";
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([kmlString], {
        type: "application/vnd.google-earth.kml+xml",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "sondagens.kml";
      link.click();
      URL.revokeObjectURL(url);
    }
    analytics.track("xlsx_to_kml");
  };

  // Recarregar quando mudar hasHeader
  const handleHeaderToggle = async (checked: boolean) => {
    update({ hasHeader: checked });

    // Re-processar dados com novo modo
    if (selectedFile) {
      try {
        const dataArray = await readXlsxFile(selectedFile);
        const processed = processXlsxData(dataArray, checked);
        update({ headers: processed.headers, rawData: processed.data });
      } catch (error) {
        toast.error("Erro ao reprocessar:" + error);
      }
    }
  };

  const canExport =
    nameColumnIndex !== undefined &&
    xColumnIndex !== undefined &&
    yColumnIndex !== undefined &&
    selectedDatum &&
    (selectedDatum === "WGS84" || selectedZone) &&
    processedData.valid.length > 0;

  return (
    <ToolLayout
      title="XLSX → KMZ/KML"
      controls={
        <>
          <FileDropzone
            onFileSelect={handleFileChange}
            selectedFile={selectedFile}
            accept={{
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                [".xlsx"],
              "application/vnd.ms-excel": [".xls"],
            }}
            templateTab="xlsxToKml"
          />
          {selectedFile && (
            <>
              <ToolControlSection title="Dados da planilha" collapsible>
                <>
                  <Form.Check
                    type="switch"
                    label="Possui linha de cabeçalho"
                    disabled={!selectedFile}
                    checked={hasHeader}
                    onChange={(e) => handleHeaderToggle(e.target.checked)}
                    className="mb-3 text-start"
                  />
                  <h6 className="mb-2 text-start" style={{ fontWeight: 500 }}>
                    Mapeamento de Colunas
                  </h6>
                  <div className="f-flex gap-2">
                    <Form.Group>
                      <div className="d-flex gap-2 text-start mb-2 align-items-center">
                        <Form.Label
                          className="small mb-0"
                          style={{ width: "75px" }}
                        >
                          Nome
                        </Form.Label>
                        <Form.Select
                          size="sm"
                          value={nameColumnIndex}
                          onChange={(e) => {
                            update({ nameColumnIndex: Number(e.target.value) });
                          }}
                          style={{ maxWidth: "200px" }}
                        >
                          <option value="">Selecione</option>
                          {headers.map((h, i) => (
                            <option key={h} value={i}>
                              {hasHeader ? h : `Coluna ${i + 1}`}
                            </option>
                          ))}
                        </Form.Select>
                      </div>
                    </Form.Group>
                    <Form.Group>
                      <div className="d-flex gap-2 text-start mb-2 align-items-center">
                        <Form.Label
                          className="small mb-0"
                          style={{ width: "75px" }}
                        >
                          Longitude (X)
                        </Form.Label>
                        <Form.Select
                          size="sm"
                          value={xColumnIndex}
                          onChange={(e) => {
                            update({ xColumnIndex: Number(e.target.value) });
                          }}
                          style={{ maxWidth: "200px" }}
                        >
                          <option value="">Selecione</option>
                          {headers.map((h, i) => (
                            <option key={h} value={i}>
                              {hasHeader ? h : `Coluna ${i + 1}`}
                            </option>
                          ))}
                        </Form.Select>
                      </div>
                    </Form.Group>
                    <Form.Group>
                      <div className="d-flex gap-2 text-start mb-2 align-items-center">
                        <Form.Label
                          className="small mb-0"
                          style={{ width: "75px" }}
                        >
                          Latitude (Y)
                        </Form.Label>
                        <Form.Select
                          size="sm"
                          value={yColumnIndex}
                          onChange={(e) => {
                            update({ yColumnIndex: Number(e.target.value) });
                          }}
                          style={{ maxWidth: "200px" }}
                        >
                          <option value="">Selecione</option>
                          {headers.map((h, i) => (
                            <option key={h} value={i}>
                              {hasHeader ? h : `Coluna ${i + 1}`}
                            </option>
                          ))}
                        </Form.Select>
                      </div>
                    </Form.Group>
                  </div>
                </>
              </ToolControlSection>
              <ToolControlSection title="Sistema de Coordenadas">
                <>
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
                {processedData.invalid.length > 0 && (
                  <Alert variant="warning">
                    {processedData.invalid.length == 1
                      ? `1 linha da planilha não pôde ser processada e não será exportada.`
                      : `${processedData.invalid.length} linhas da planilha não puderam ser processadas e não serão exportadas.`}
                  </Alert>
                )}
                <div className="d-flex gap-2">
                  <Button
                    onClick={() => handleExport(false)}
                    disabled={!canExport}
                    className="flex-fill"
                  >
                    KML
                  </Button>
                  <Button
                    onClick={() => handleExport(true)}
                    disabled={!canExport}
                    className="flex-fill"
                  >
                    KMZ
                  </Button>
                </div>
              </ToolControlSection>
            </>
          )}
        </>
      }
      panel={
        <>
          {rawData.length > 0 && (
            <DataTable<XlsxRow>
              data={rawData}
              columns={headers.map((h, i) => ({
                key: h,
                header: hasHeader ? h : `Coluna ${i + 1}`,
                render: (row) => String(row[h] ?? ""),
              }))}
              maxHeight="calc(100vh - 400px)"
              emptyMessage="Nenhum dado na planilha"
              title={`Planilha carregada (${rawData.length} linhas)`}
              rowClassName={(row) => {
                // Verificar se a linha está na lista de inválidas
                const isInvalid = processedData.invalid.some(
                  (inv) => inv.row === row,
                );
                return isInvalid ? "table-danger" : ""; // ← Bootstrap class
              }}
            />
          )}
        </>
      }
    ></ToolLayout>
  );
};

export default XlsxToKml;
