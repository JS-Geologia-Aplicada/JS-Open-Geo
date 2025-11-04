import { useState } from "react";
import DataExtractionPage from "./pages/DataExtractionPage";
import AppHeader from "./components/AppHeader";
import DxfPage from "./pages/DxfPage";
import AppNavigation from "./components/AppNavigation";
import { Col, Container, Row } from "react-bootstrap";
import type { Area, PageTextData, PageType, PalitoData } from "./types";
import HelpModal from "./components/HelpModal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AboutPage from "./pages/AboutPage";
import ChangelogPage from "./pages/ChangelogPage";
import AppFooter from "./components/AppFooter";
import { ToolsPage } from "./pages/ToolsPage";
import { AppProviders } from "./contexts/AppContext";

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>("extraction");
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedTexts, setExtractedTexts] = useState<PageTextData[]>([]);
  const [palitoData, setPalitoData] = useState<PalitoData[]>([]);

  // Lidando com o Modal de ajuda
  const [openHelpOnLoad, setOpenHelpOnLoad] = useState(() => {
    const saved = localStorage.getItem("showHelpOnLoad");
    return saved !== "false";
  });
  const [showHelp, setShowHelp] = useState(openHelpOnLoad);
  const handleShowHelp = () => {
    setShowHelp(true);
  };
  const toggleShowHelpOnLoad = (show: boolean) => {
    setOpenHelpOnLoad(show);
    localStorage.setItem("showHelpOnLoad", show.toString());
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <AppProviders>
          <Container fluid className="text-center p-0">
            <ToastContainer
              position="top-right"
              autoClose={6000}
              hideProgressBar={false}
            />
            <HelpModal
              showOnLoad={openHelpOnLoad}
              onToggleShowOnLoad={toggleShowHelpOnLoad}
              show={showHelp}
              setShow={setShowHelp}
            />
            <Row className="justify-content-center">
              <Col className="px-0">
                <AppHeader />
              </Col>
            </Row>
            <Row className="justify-content-center">
              <Col className="px-0">
                <AppNavigation
                  currentPage={currentPage}
                  onChangePage={setCurrentPage}
                />
              </Col>
            </Row>
            {currentPage === "extraction" ? (
              <DataExtractionPage
                areas={areas}
                setAreas={setAreas}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                extractedTexts={extractedTexts}
                setExtractedTexts={setExtractedTexts}
                onShowHelp={handleShowHelp}
              />
            ) : currentPage === "dxf" ? (
              <DxfPage
                areas={areas}
                extractedTexts={extractedTexts}
                palitoData={palitoData}
                setPalitoData={setPalitoData}
              />
            ) : currentPage === "about" ? (
              <AboutPage />
            ) : currentPage === "changelog" ? (
              <ChangelogPage />
            ) : currentPage === "transform" ? (
              <ToolsPage />
            ) : (
              <div>Erro: página não encontrada</div>
            )}
          </Container>
        </AppProviders>
      </div>
      <AppFooter />
    </div>
  );
}

export default App;
