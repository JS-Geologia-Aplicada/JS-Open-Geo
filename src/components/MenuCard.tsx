import React from "react";

interface MenuCardProps {
  children: React.ReactNode;
}

const MenuCard: React.FC<MenuCardProps> = ({ children }) => {
  return (
    <div className="card mt-5">
      <div className="card-header">
        <img
          src="js_logo_horizontal.png"
          alt="JS Geologia Aplicada"
          style={{ maxWidth: "200px" }}
        />
      </div>
      <div className="card-body">
        <h4 className="card-title">Extrator de dados de PDF</h4>
        <p className="card-text">Selecione áreas, extraia dados</p>
        {children}
      </div>
    </div>
  );
};

export default MenuCard;
