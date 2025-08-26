import { Container, Nav, Navbar } from "react-bootstrap";

interface AppNavigationProps {
  currentPage: "extraction" | "dxf";
  onChangePage: (page: "extraction" | "dxf") => void;
}

const AppNavigation = ({ currentPage, onChangePage }: AppNavigationProps) => {
  return (
    <Navbar className="border-bottom mb-2">
      <Container fluid className="px-4">
        <Navbar.Brand className="text-dark fw-bold">JS Open Geo</Navbar.Brand>
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
        </Nav>
      </Container>
    </Navbar>
  );
};
export default AppNavigation;
