import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface ToolControlSectionProps {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean; // Se pode abrir/fechar
  defaultOpen?: boolean; // Estado inicial (se collapsible)
  className?: string;
}

export const ToolControlSection = ({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
  className = "",
}: ToolControlSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`my-4 ${className}`}>
      {/* Header com título e botão opcional */}
      <div
        className="d-flex align-items-center justify-content-between mb-2"
        style={{
          paddingBottom: "8px",
          borderBottom: "1px solid #dee2e6",
          cursor: collapsible ? "pointer" : "default",
        }}
        onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
      >
        <h6 className="mb-0" style={{ fontWeight: 600 }}>
          {title}
        </h6>

        {collapsible && (
          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none"
            style={{ fontSize: "1.2rem", lineHeight: 1 }}
            aria-label={isOpen ? "Recolher" : "Expandir"}
          >
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        )}
      </div>

      {/* Conteúdo (com transição suave) */}
      {(!collapsible || isOpen) && (
        <div
          style={{
            animation: collapsible ? "fadeIn 0.2s ease-in" : "none",
            padding: "0 5px 0 5px",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};
