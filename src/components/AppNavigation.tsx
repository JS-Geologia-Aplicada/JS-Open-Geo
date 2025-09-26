import { Container, Nav, Navbar } from "react-bootstrap";
import type { PageType } from "../types";

interface AppNavigationProps {
  currentPage: PageType;
  onChangePage: (page: PageType) => void;
}

const AppNavigation = ({ currentPage, onChangePage }: AppNavigationProps) => {
  return (
    <Navbar className="border-bottom mb-2">
      <Container fluid className="px-4">
        <Navbar.Brand className="text-dark fw-bold">
          <div className="d-flex align-items-end">
            <img
              src="js_open_geo_logo.png"
              alt="JS OpenGeo"
              style={{ height: "40px" }}
            />
            <span className="text-muted small mx-1">v1.1.0-alpha.1</span>
          </div>
        </Navbar.Brand>
        <Nav className="mx-auto">
          <Nav.Link
            active={currentPage === "extraction"}
            onClick={
              currentPage === "extraction"
                ? undefined
                : () => onChangePage("extraction")
            }
            style={{
              cursor: currentPage === "extraction" ? "default" : "pointer",
            }}
            className={`px-4 ${currentPage === "extraction" && "fw-bold"}`}
          >
            Extração de Dados
          </Nav.Link>
          <Nav.Link
            active={currentPage === "dxf"}
            onClick={
              currentPage === "dxf" ? undefined : () => onChangePage("dxf")
            }
            style={{ cursor: currentPage === "dxf" ? "default" : "pointer" }}
            className={`px-4 ${currentPage === "dxf" && "fw-bold"}`}
          >
            Geração de Palitos
          </Nav.Link>
          <Nav.Link
            active={currentPage === "transform"}
            onClick={
              currentPage === "transform"
                ? undefined
                : () => onChangePage("transform")
            }
            style={{
              cursor: currentPage === "transform" ? "default" : "pointer",
            }}
            className={`px-4 ${currentPage === "transform" && "fw-bold"}`}
          >
            Transformações
          </Nav.Link>
          <Nav.Link
            active={currentPage === "about"}
            onClick={
              currentPage === "about" ? undefined : () => onChangePage("about")
            }
            style={{ cursor: currentPage === "about" ? "default" : "pointer" }}
            className={`px-4 ${currentPage === "about" && "fw-bold"}`}
          >
            Sobre
          </Nav.Link>
          <Nav.Link
            active={currentPage === "changelog"}
            onClick={
              currentPage === "changelog"
                ? undefined
                : () => onChangePage("changelog")
            }
            style={{
              cursor: currentPage === "changelog" ? "default" : "pointer",
            }}
            className={`px-4 ${currentPage === "changelog" && "fw-bold"}`}
          >
            Detalhes da Versão
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
};
export default AppNavigation;
