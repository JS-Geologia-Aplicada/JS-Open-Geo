import { Container } from "react-bootstrap";
import { Outlet } from "react-router-dom";

export const ToolsPage = () => {
  return (
    <Container fluid className="p-0">
      <div style={{ minHeight: "calc(100vh - 192px)" }}>
        <Outlet />
      </div>
    </Container>
  );
};
