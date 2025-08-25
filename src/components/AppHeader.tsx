const AppHeader = () => {
  return (
    <>
      <header>
        <div className="d-flex align-items-center justify-content-between py-3">
          <div className="d-flex gap-3">
            <a
              href="https://www.instagram.com/js.geologia/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-decoration-none"
              title="Instagram"
            >
              <i className="bi bi-instagram"></i>
            </a>

            <a
              href="https://www.linkedin.com/company/js-geologia-aplicada"
              target="_blank"
              rel="noopener noreferrer"
              className="text-decoration-none"
              title="LinkedIn"
            >
              <i className="bi bi-linkedin"></i>
            </a>
          </div>

          {/* Logo centralizado */}
          <div className="flex-grow-1 text-center">
            <a
              href="https://www.jsgeo.com.br/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="js_logo_horizontal.png"
                alt="JS Geologia Aplicada"
                style={{ maxHeight: "60px" }}
              />
            </a>
          </div>

          <div style={{ width: "56px" }}></div>
        </div>
      </header>

      {/* Linha divisória */}
      <hr
        style={{
          borderColor: "rgb(33,33,33)",
          borderWidth: "0.88px",
          padding: "0px 15px 0px 15px",
          margin: "4px 0px 4px 0px",
        }}
      />
    </>
  );
};

export default AppHeader;
