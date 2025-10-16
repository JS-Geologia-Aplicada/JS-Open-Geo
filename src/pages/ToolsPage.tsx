import { useState } from "react";
import { TOOLS, type ToolsType } from "@/data/tools";
import { Container } from "react-bootstrap";
import { ToolsGrid } from "@/components/Tools/ToolsGrid";
import { ToolsSidebar } from "@/components/Tools/ToolsSidebar";

export const ToolsPage = () => {
  const [selectedTool, setSelectedTool] = useState<ToolsType | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const handleSelectTool = (toolId: ToolsType) => {
    setSelectedTool(toolId);
    setSidebarCollapsed(false); // Expande ao selecionar
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const selectedToolData = TOOLS.find((t) => t.id === selectedTool?.id);
  const SelectedComponent = selectedToolData?.component;

  return (
    <Container fluid className="p-0" style={{ height: "100vh" }}>
      {!selectedTool ? (
        // Grid inicial centralizado
        <ToolsGrid tools={TOOLS} onSelectTool={handleSelectTool} />
      ) : (
        // Layout com sidebar + conteúdo
        <div className="d-flex" style={{ height: "100%" }}>
          <ToolsSidebar
            tools={TOOLS}
            selectedTool={selectedTool}
            collapsed={sidebarCollapsed}
            onSelectTool={handleSelectTool}
            onToggleCollapse={handleToggleSidebar}
          />
          <div
            className="flex-grow-1 overflow-auto p-4"
            style={{
              marginLeft: sidebarCollapsed ? "60px" : "280px",
              transition: "margin-left 0.3s ease",
            }}
          >
            {SelectedComponent && <SelectedComponent />}
          </div>
        </div>
      )}
    </Container>
  );
};
