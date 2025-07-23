import type { Area } from "../types";

interface SelectedAreasProps {
  areas: Area[];
  zoomScale: number;
  activeAreaId: string | null;
}

const SelectedAreas: React.FC<SelectedAreasProps> = ({
  areas,
  zoomScale,
  activeAreaId,
}) => {
  return (
    <>
      {areas.map((area) => {
        if (!area.coordinates || area.id === activeAreaId) return null;

        return (
          <div
            className="position-absolute border"
            key={`selected-${area.id}`}
            style={{
              left: area.coordinates.x * zoomScale,
              top: area.coordinates.y * zoomScale,
              width: area.coordinates.width * zoomScale,
              height: area.coordinates.height * zoomScale,
              backgroundColor: `${area.color}20`,
              borderColor: area.color,
              borderWidth: "2px",
              zIndex: 10,
            }}
            title={area.name}
          ></div>
        );
      })}
    </>
  );
};

export default SelectedAreas;
