import React, { useState } from "react";
import { Download, MapPin } from "lucide-react";
import type { Area, PageTextData } from "../types";
import { Button, Form, Modal } from "react-bootstrap";
import {
  convertGeographicCoordinates,
  DATUMS,
  generateKMLString,
  UTM_ZONES,
  type CoordinateSystem,
  type DatumType,
  type PointCoords,
  type ZoneType,
} from "../utils/mapUtils";
import JSZip from "jszip";
import LeafletMap from "./LeafletMap";
import { toast } from "react-toastify";

interface MapModalProps {
  extractedTexts: PageTextData[];
  areas: Area[];
}

const MapModal: React.FC<MapModalProps> = ({ extractedTexts, areas }) => {
  const [selectedDatum, setSelectedDatum] = useState<DatumType | undefined>(
    undefined
  );
  const [selectedZone, setSelectedZone] = useState<ZoneType | undefined>(
    undefined
  );
  const [show, setShow] = useState(false);
  const [points, setPoints] = useState<PointCoords[]>([]);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // Verifica se tem áreas de coordenadas configuradas
  const hasXCoord = areas.some(
    (area) => area.dataType === "x" && area.coordinates
  );
  const hasYCoord = areas.some(
    (area) => area.dataType === "y" && area.coordinates
  );
  const hasHoleId = areas.some(
    (area) => area.dataType === "hole_id" && area.coordinates
  );
  const hasRequiredData = hasXCoord && hasYCoord && hasHoleId;

  // Conta quantos pontos seriam exportados
  const pointCount = extractedTexts.length;

  const handleDownloadKMZ = async () => {
    if (points.length === 0) return;
    const kmlString = generateKMLString(points);

    const zip = new JSZip();
    zip.file("doc.kml", kmlString);

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sondagens.kmz";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePlotPoints = async () => {
    if (!selectedDatum || (selectedDatum !== "WGS84" && !selectedZone)) return;
    const points: PointCoords[] = extractedTexts.map((data) => {
      const holeIdArea = areas.find((area) => area.dataType === "hole_id");
      const xArea = areas.find((area) => area.dataType === "x");
      const yArea = areas.find((area) => area.dataType === "y");

      return {
        id: holeIdArea ? (data[holeIdArea.name][0] as string) : "",
        coords: [
          xArea ? parseFloat(data[xArea.name][0] as string) : 0,
          yArea ? parseFloat(data[yArea.name][0] as string) : 0,
        ],
      };
    });

    const coordinateSystem: CoordinateSystem = {
      datum: selectedDatum,
      zone: selectedZone || "23S",
    };
    const convertedPoints = points.map((point) => {
      return {
        ...point,
        coords: convertGeographicCoordinates(point.coords, coordinateSystem),
      };
    });

    const invalidPoints: string[] = [];
    const finalValidPoints = convertedPoints.filter((point) => {
      const [lon, lat] = point.coords;
      const isValid =
        Number.isFinite(lat) &&
        Number.isFinite(lon) &&
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180;

      if (!isValid) {
        invalidPoints.push(point.id);
      }

      return isValid;
    });

    setPoints(finalValidPoints);
    if (invalidPoints.length > 0) {
      toast.warn(
        finalValidPoints.length === 0
          ? "Coordenadas inválidas para todos os pontos"
          : `Coordenadas inválidas para ${invalidPoints.length} ponto${
              invalidPoints.length > 1 ? "s" : ""
            }: ${invalidPoints.join(", ")}`
      );
    }
  };

  return (
    <>
      <Button onClick={handleShow}>
        <MapPin />
      </Button>
      {/* Modal */}
      <Modal show={show} onHide={handleClose} size="xl">
        {/* Header */}
        <Modal.Header closeButton>
          <Modal.Title>Coordenadas das Sondagens</Modal.Title>
        </Modal.Header>

        {/* Body */}
        <Modal.Body className="p-4">
          {!hasRequiredData ? (
            // Mensagem de erro se não tem dados necessários
            <div className="alert alert-warning" role="alert">
              <h6>Dados insuficientes</h6>
              <p className="mb-2">
                Para exportar coordenadas, você precisa configurar:
              </p>
              <ul className="mb-0">
                {!hasHoleId && <li>Uma área como "ID da Sondagem"</li>}
                {!hasXCoord && <li>Uma área como "Coordenada X"</li>}
                {!hasYCoord && <li>Uma área como "Coordenada Y"</li>}
              </ul>
            </div>
          ) : (
            <>
              {/* Seleção de Datum */}
              <Form.Select
                aria-label="Datum"
                onChange={(e) => setSelectedDatum(e.target.value as DatumType)}
              >
                <option value={undefined}>Datum</option>
                {DATUMS.map((datum) => (
                  <option key={datum.value} value={datum.value}>
                    {datum.label}
                  </option>
                ))}
              </Form.Select>

              {/* Seleção de Zona UTM */}
              <Form.Select
                aria-label="Zona UTM"
                onChange={(e) => setSelectedZone(e.target.value as ZoneType)}
                disabled={selectedDatum === "WGS84"}
              >
                <option value={undefined}>Zona UTM</option>
                {UTM_ZONES.map((zone) => (
                  <option key={zone.value} value={zone.value}>
                    {zone.label}
                  </option>
                ))}
              </Form.Select>

              {/* Botões de ação */}
              <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                <div className="text-muted small">
                  Arquivo KMZ será gerado com {pointCount} ponto
                  {pointCount !== 1 ? "s" : ""}
                </div>
                <Button
                  className="btn btn-primary"
                  onClick={handlePlotPoints}
                  disabled={
                    pointCount === 0 ||
                    !selectedDatum ||
                    (selectedDatum !== "WGS84" && !selectedZone)
                  }
                >
                  <Download className="me-1" size={16} />
                  Converter coordenadas
                </Button>
              </div>

              {points.length > 0 && (
                <>
                  {/* Mapa */}
                  <div>
                    <LeafletMap points={points} />
                  </div>

                  {/* Botão Download KMZ */}
                  <div>
                    <Button onClick={handleDownloadKMZ}>Download KMZ</Button>
                  </div>
                </>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default MapModal;
