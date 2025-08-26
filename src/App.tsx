import { useState } from "react";
import DataExtractionPage from "./components/DataExtractionPage";
import AppHeader from "./components/AppHeader";
import DxfPage from "./components/DxfPage";
import AppNavigation from "./components/AppNavigation";
import { Col, Container, Row } from "react-bootstrap";
import type { Area, PageTextData } from "./types";

function App() {
  const [currentPage, setCurrentPage] = useState<"extraction" | "dxf">(
    "extraction"
  );
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedTexts, setExtractedTexts] = useState<PageTextData[]>([]);

  return (
    <Container fluid className="text-center px-xl-5">
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
        />
      ) : (
        <DxfPage areas={areas} extractedTexts={extractedTexts} />
      )}
    </Container>
  );
}

export default App;
