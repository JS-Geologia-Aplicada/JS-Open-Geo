import React from "react";
import type { Area } from "../types";

interface MenuCardProps {
  areas: Area[];
  areasMenu: React.ReactNode;
  extractMenu: React.ReactNode;
}

const MenuCard: React.FC<MenuCardProps> = ({
  areasMenu,
  extractMenu,
  areas,
}) => {
  return (
    <div className="card mt-2">
      <div className="card-header">
        <h4 className="card-title">Extrair dados de PDF</h4>
      </div>
      <div className="card-body">{areasMenu}</div>
      {areas.length > 0 && <div className="card-footer">{extractMenu}</div>}
    </div>
  );
};

export default MenuCard;
