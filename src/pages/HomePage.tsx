import { Container, Row, Image, Col, Card, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import styles from "./HomePage.module.css";
import changelogData from "@data/changelog.json";

const HomePage = () => {
  const tools: { name: string; description: string; path: string }[] = [
    {
      name: "Dados de sondagem",
      path: "/dados_de_sondagem",
      description:
        "Faça upload de arquivos em PDF e extraia os dados de uma ou mais sondagens. Exporte em múltiplos formatos, incluindo XLSX, Leapfrog e AGS.",
    },
    {
      name: "Palitos de sondagem",
      path: "/palitos",
      description:
        "Utilize os dados extraídos na ferramenta de dados de sondagem ou seus próprios dados para criar um arquivo DXF com palitos de sondagem seguindo diferentes modelos.",
    },
    {
      name: "Ferramentas CAD/SIG",
      path: "/ferramentas",
      description:
        "Acesse uma variedade de ferramentas para operações e transformações de arquivos nos formatos DXF, XLSX, KML e KMZ.",
    },
  ];

  const navigate = useNavigate();

  const currentVersion = changelogData.versions[0].version;

  return (
    <>
      {/* Seção com logo e resumo */}
      <Container fluid style={{ backgroundColor: "#1D1D1D" }}>
        <Row className="justify-content-center" style={{ paddingTop: "64px" }}>
          <Col xs={4}>
            <div className="d-flex flex-column align-items-end">
              <Image src="js_open_geo_logo.png" style={{ width: "100%" }} />
              <span
                style={{
                  color: "#888",
                  paddingRight: "30px",
                  fontWeight: "600",
                  fontSize: "20px",
                  marginTop: "-20px",
                }}
              >
                {currentVersion}
              </span>
            </div>
          </Col>
        </Row>
        <Row className="justify-content-center" style={{ marginTop: "2rem" }}>
          <Col xs={4}>
            <p className="text-center" style={{ color: "#ddd" }}>
              Um programa totalmente on-line, gratuito e de código aberto da JS
              Geologia Aplicada, desenvolvido para facilitar e agilizar a
              organização e análise de dados geológico-geotécnicos.
            </p>
          </Col>
        </Row>
        <Row
          className="justify-content-center"
          style={{ marginTop: "1rem", paddingBottom: "1rem" }}
        >
          <Col xs={4}>
            <div
              className="d-flex justify-content-around"
              style={{ color: "#fff" }}
            >
              <Link className={styles.headerLink} to="/sobre">
                Sobre
              </Link>
              <Link className={styles.headerLink} to="/changelog">
                Histórico de versões
              </Link>
            </div>
          </Col>
        </Row>
      </Container>

      <Container fluid>
        <Row>
          <Col
            xs={3}
            style={{
              // height: "100%",
              color: "white",
              backgroundColor: "#003380",
            }}
          >
            Área de estatísticas
          </Col>
          <Col xs={9}>
            <Row>
              <Col>
                <h2 className={styles.toolsTitle}>Ferramentas</h2>
              </Col>
            </Row>
            <Row>
              {tools.map((tool, index) => (
                <Col xs={12} lg={6} key={index}>
                  <Card
                    className={styles.toolCard}
                    onClick={() => navigate(tool.path)}
                  >
                    <Card.Title>{tool.name}</Card.Title>
                    <Card.Text className={styles.toolCardWrapper}>
                      <span className={styles.toolCardText}>
                        {tool.description}
                      </span>
                    </Card.Text>
                  </Card>
                </Col>
              ))}
            </Row>
            <Row
              className="justify-content-center"
              style={{ marginTop: "4rem" }}
            >
              <Col xs={10} lg={8}>
                <Alert variant="secondary" className="text-center">
                  <div>
                    Acompanhe a JS Geologia Aplicada nas redes sociais para
                    ficar por dentro de novidades no JS OpenGeo, cursos e mais
                    ações
                  </div>
                  <div className="d-flex justify-content-center align-items-center gap-3 mt-1">
                    <a
                      href="https://www.linkedin.com/company/js-geologia-aplicada"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none text-dark"
                      title="LinkedIn"
                    >
                      <i
                        className="bi bi-linkedin"
                        style={{ fontSize: "1.5rem" }}
                      ></i>
                    </a>
                    <a
                      href="https://www.instagram.com/js.geologia/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none text-dark"
                      title="Instagram"
                    >
                      <i
                        className="bi bi-instagram"
                        style={{ fontSize: "1.5rem" }}
                      ></i>
                    </a>
                  </div>
                </Alert>
              </Col>{" "}
            </Row>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default HomePage;
