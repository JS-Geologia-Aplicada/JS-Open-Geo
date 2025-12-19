import React from "react";
import { useExtractionContext } from "@/contexts/ExtractionContext";

interface MenuCardProps {
  areasMenu: React.ReactNode;
  extractMenu: React.ReactNode;
}

const MenuCard: React.FC<MenuCardProps> = ({ areasMenu, extractMenu }) => {
  const {
    extractionState: { areas },
  } = useExtractionContext();
  return (
    <div className="card mt-2">
      <div className="card-header">
        <h4 className="card-title">Dados de sondagem</h4>
      </div>
      <div className="card-body">{areasMenu}</div>
      {areas.length > 0 && <div className="card-footer">{extractMenu}</div>}
    </div>
  );
};

export default MenuCard;
