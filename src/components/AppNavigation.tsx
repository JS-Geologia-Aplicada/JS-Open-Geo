import { Button } from "react-bootstrap";

interface AppNavigationProps {
  currentPage: "extraction" | "dxf";
  onChangePage: (page: "extraction" | "dxf") => void;
}

const AppNavigation = ({ currentPage, onChangePage }: AppNavigationProps) => {
  return (
    <div>
      <Button
        disabled={currentPage === "extraction"}
        onClick={() => onChangePage("extraction")}
      >
        Extração de Dados de PDFs
      </Button>
      <Button
        disabled={currentPage === "dxf"}
        onClick={() => onChangePage("dxf")}
      >
        Geração de Palitos
      </Button>
    </div>
  );
};
export default AppNavigation;
