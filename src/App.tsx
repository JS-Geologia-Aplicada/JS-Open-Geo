import { useState } from "react";
import DataExtractionPage from "./components/DataExtractionPage";
import AppHeader from "./components/AppHeader";
import DxfPage from "./components/DxfPage";
import AppNavigation from "./components/AppNavigation";
import { Col, Container, Row } from "react-bootstrap";
import type { Area, PageTextData, PalitoData } from "./types";
import HelpModal from "./components/HelpModal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [currentPage, setCurrentPage] = useState<"extraction" | "dxf">(
    "extraction"
  );
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
    <Container fluid className="text-center px-xl-5">
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
        <Col>
          <AppHeader />
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col>
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
      ) : (
        <DxfPage
          areas={areas}
          extractedTexts={extractedTexts}
          palitoData={palitoData}
          setPalitoData={setPalitoData}
        />
      )}
    </Container>
  );
}

export default App;
