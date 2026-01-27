import { useEffect, useState } from "react";
import DataExtractionPage from "./pages/DataExtractionPage";
import AppHeader from "./components/AppHeader";
import DxfPage from "./pages/DxfPage";
import AppNavigation from "./components/AppNavigation";
import { Col, Container, Row } from "react-bootstrap";
import type { PageType } from "./types";
import HelpModal from "./components/HelpModal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AboutPage from "./pages/AboutPage";
import ChangelogPage from "./pages/ChangelogPage";
import AppFooter from "./components/AppFooter";
import { ToolsPage } from "./pages/ToolsPage";
import { analytics } from "./utils/analyticsUtils";

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>("extraction");

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

  useEffect(() => {
    // 1. Envia dados órfãos de sessão anterior (se houver)
    const pending = analytics.getPendingData();
    if (pending) {
      analytics.flush();
    }

    // 2. Registra pageview
    analytics.track("pageview");

    const lastView = localStorage.getItem("lastView");
    const today = new Date().toISOString().split("T")[0];
    if (!lastView || lastView !== today) {
      analytics.track("unique_daily_view");
      localStorage.setItem("lastView", today);
    }

    // 3. Setup do beforeunload
    const handleUnload = () => {
      console.log("Enviando dados antes de fechar...");
      analytics.flushSync();
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  return (
    <div className="app-container">
      <div className="main-content">
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
            <DataExtractionPage onShowHelp={handleShowHelp} />
          ) : currentPage === "dxf" ? (
            <DxfPage />
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
      </div>
      <AppFooter />
    </div>
  );
}

export default App;
