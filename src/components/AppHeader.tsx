import { useState } from "react";
import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap";

const AppHeader = () => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <>
      <Navbar bg="white" expand="lg" className="border-bottom">
        <Container fluid>
          {/* Logo */}
          <Navbar.Brand
            href="https://www.jsgeo.com.br/"
            target="_blank"
            className="ps-3"
          >
            <img
              src="js_logo_horizontal.png"
              alt="JS Geologia Aplicada"
              style={{ height: "40px" }}
            />
          </Navbar.Brand>

          {/* Toggle para mobile */}
          <Navbar.Toggle aria-controls="basic-navbar-nav" />

          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link href="https://www.jsgeo.com.br/" target="_blank">
                Home
              </Nav.Link>
              <Nav.Link
                href="https://www.jsgeo.com.br/quem-e-a-js"
                target="_blank"
              >
                Quem é a JS
              </Nav.Link>

              <NavDropdown
                title={
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      window.open(
                        "https://www.jsgeo.com.br/areas-de-atuacao",
                        "_blank"
                      );
                    }}
                    className="text-decoration-none text-muted"
                  >
                    Áreas de atuação
                  </span>
                }
                id="areas-dropdown"
                className="text-secondary mx-1"
                style={{ fontSize: "0.95rem" }}
                show={showDropdown}
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
              >
                <NavDropdown.Item
                  href="https://www.jsgeo.com.br/clientes"
                  target="_blank"
                >
                  Clientes
                </NavDropdown.Item>
                <NavDropdown.Item
                  href="https://www.jsgeo.com.br/projetos"
                  target="_blank"
                >
                  Projetos
                </NavDropdown.Item>
              </NavDropdown>
              <Nav.Link
                href="https://www.jsgeo.com.br/publicacoes"
                target="_blank"
              >
                Publicações
              </Nav.Link>
              <Nav.Link
                href="https://www.jsgeo.com.br/patrocinios"
                target="_blank"
              >
                Patrocínios
              </Nav.Link>
              <Nav.Link
                href="https://js-geologia-aplicada.github.io/JS-Open-Geo/"
                target="_blank"
              >
                JS OpenGeo
              </Nav.Link>
              <Nav.Link href="https://www.jsgeo.com.br/cursos" target="_blank">
                Cursos
              </Nav.Link>
              <Nav.Link href="https://www.jsgeo.com.br/blog" target="_blank">
                Blog
              </Nav.Link>
              <Nav.Link href="https://www.jsgeo.com.br/contato" target="_blank">
                Contato
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
};

export default AppHeader;
