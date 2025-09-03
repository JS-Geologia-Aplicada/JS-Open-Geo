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

interface MapModalProps {
  extractedTexts: PageTextData[];
  areas: Area[];
}

const MapModal: React.FC<MapModalProps> = ({ extractedTexts, areas }) => {
  const [selectedDatum, setSelectedDatum] = useState<DatumType>("SAD69");
  const [selectedZone, setSelectedZone] = useState<ZoneType>("23S");
  const [show, setShow] = useState(false);

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
    // TODO: Implementar função de conversão e geração KMZ

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
      zone: selectedZone,
    };
    const convertedPoints = points.map((point) => {
      return {
        ...point,
        coords: convertGeographicCoordinates(point.coords, coordinateSystem),
      };
    });

    const kmlString = generateKMLString(convertedPoints);

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

  return (
    <>
      <Button onClick={handleShow}>
        <MapPin />
      </Button>
      {/* Modal */}
      <Modal show={show} onHide={handleClose}>
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
                value={selectedDatum}
                onChange={(e) => setSelectedDatum(e.target.value as DatumType)}
              >
                <option>Datum</option>
                {DATUMS.map((datum) => (
                  <option key={datum.value} value={datum.value}>
                    {datum.label}
                  </option>
                ))}
              </Form.Select>

              {/* Seleção de Zona UTM */}
              <Form.Select
                aria-label="Zona UTM"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value as ZoneType)}
              >
                <option>Zona UTM</option>
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
                  onClick={handleDownloadKMZ}
                  disabled={pointCount === 0}
                >
                  <Download className="me-1" size={16} />
                  Baixar KMZ
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default MapModal;
