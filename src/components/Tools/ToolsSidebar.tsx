import type { ToolsType } from "@/data/tools";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Nav } from "react-bootstrap";

type Props = {
  tools: ToolsType[];
  selectedTool: ToolsType;
  collapsed: boolean;
  onSelectTool: (toolId: ToolsType) => void;
  onToggleCollapse: () => void;
};
export const ToolsSidebar = ({
  tools,
  selectedTool,
  collapsed,
  onSelectTool,
  onToggleCollapse,
}: Props) => {
  return (
    <div
      style={{
        width: collapsed ? "70px" : "280px",
        height: "calc(100vh - 192px)",
        position: "fixed",
        top: "133.76px",
        left: 0,
        backgroundColor: "#f8f9fa",
        borderRight: "1px solid #dee2e6",
        transition: "width 0.3s ease",
        overflow: "hidden",
        zIndex: 1000,
      }}
    >
      {/* Header com botão de colapsar */}
      <div
        className="d-flex align-items-center justify-content-between p-3"
        style={{ borderBottom: "1px solid #dee2e6", height: "60px" }}
      >
        {!collapsed && (
          <h5 className="mb-0" style={{ whiteSpace: "nowrap" }}>
            Ferramentas
          </h5>
        )}
        <Button
          variant="link"
          onClick={onToggleCollapse}
          className="p-0"
          style={{ minWidth: "24px" }}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>

      {/* Lista de ferramentas */}
      <Nav className="flex-column">
        {tools.map((tool) => (
          <Nav.Link
            key={tool.id}
            onClick={() => onSelectTool(tool)}
            active={selectedTool.id === tool.id}
            className="px-3 py-3"
            style={{
              cursor: "pointer",
              borderLeft:
                selectedTool.id === tool.id
                  ? "3px solid #0d6efd"
                  : "3px solid transparent",
              whiteSpace: collapsed ? "nowrap" : "normal",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {collapsed ? (
              // Apenas primeira letra quando colapsado
              <img
                src={tool.icon}
                alt={`Ícone ${tool.name}`}
                style={{ maxWidth: "40px" }}
              />
            ) : (
              <div>
                <div style={{ fontWeight: 500, color: "black" }}>
                  {tool.name}
                </div>
                <small className="text-muted d-block mt-1">
                  {tool.description}
                </small>
              </div>
            )}
          </Nav.Link>
        ))}
      </Nav>
    </div>
  );
};
