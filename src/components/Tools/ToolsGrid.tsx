import type { ToolsType } from "@/data/tools";
import { Card, Col, Row } from "react-bootstrap";

type Props = {
  tools: ToolsType[];
  onSelectTool: (toolId: ToolsType) => void;
};
export const ToolsGrid = ({ tools, onSelectTool }: Props) => {
  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh", padding: "2rem" }}
    >
      <div style={{ maxWidth: "1200px", width: "100%" }}>
        <h1 className="text-center mb-5">Ferramentas CAD/SIG</h1>
        <Row xs={1} md={2} lg={3} className="g-4">
          {tools.map((tool) => (
            <Col key={tool.id}>
              <Card
                className="h-100 shadow-sm"
                style={{
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 1px 3px rgba(0,0,0,0.12)";
                }}
                onClick={() => onSelectTool(tool)}
              >
                <Card.Body>
                  <Card.Title className="mb-3">{tool.name}</Card.Title>
                  <Card.Text className="text-muted">
                    {tool.description}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};
