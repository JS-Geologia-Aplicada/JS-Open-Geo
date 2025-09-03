import { useState } from "react";
import type { Area, SelectionArea } from "../types";
import EditablePolyArea from "./EditablePolyArea";

interface SelectedAreasProps {
  areas: Area[];
  zoomScale: number;
  activeAreaId: string | null;
  onChangeCoords: (newCoords: SelectionArea, areaId: string) => void;
}

const SelectedAreas: React.FC<SelectedAreasProps> = ({
  areas,
  zoomScale,
  activeAreaId,
  onChangeCoords: onConfirmNewCoords,
}) => {
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [latestTempCoords, setLatestTempCoords] =
    useState<SelectionArea | null>(null);

  const handleTempCoordsChange = (areaId: string, coords: SelectionArea) => {
    if (areaId === editingAreaId) {
      setLatestTempCoords(coords);
    }
  };

  const handleStartEdit = (areaId: string) => {
    if (editingAreaId && editingAreaId !== areaId && latestTempCoords) {
      onConfirmNewCoords(latestTempCoords, editingAreaId);
    }

    setLatestTempCoords(null);
    setEditingAreaId(areaId);
  };

  const handleFinishEdit = () => {
    setEditingAreaId(null);
  };

  return (
    <>
      {areas.map((area) => {
        if (!area.coordinates || area.id === activeAreaId) return null;

        return (
          <EditablePolyArea
            key={`selected-${area.id}`}
            area={area}
            zoomScale={zoomScale}
            isEditing={editingAreaId === area.id}
            onStartEdit={handleStartEdit}
            onFinishEdit={handleFinishEdit}
            onConfirmNewCoords={onConfirmNewCoords}
            onTempCoordsChange={handleTempCoordsChange}
          />
        );
      })}
    </>
  );
};

export default SelectedAreas;
