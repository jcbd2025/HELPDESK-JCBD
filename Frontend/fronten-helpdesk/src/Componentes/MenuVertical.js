import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { FaMagnifyingGlass, FaPowerOff } from "react-icons/fa6";
import { FiAlignJustify } from "react-icons/fi";
import {
  FcHome, FcAssistant, FcBusinessman, FcAutomatic,
  FcAnswers, FcCustomerSupport, FcExpired, FcGenealogy,
  FcBullish, FcConferenceCall, FcPortraitMode, FcOrganization
} from "react-icons/fc";
import Logo from "../imagenes/logo proyecto color.jpeg";
import Logoempresarial from "../imagenes/logo empresarial.png";
import styles from "../styles/HomeAdmiPage.module.css";
import { NotificationContext } from "../context/NotificationContext";

const MenuVertical = ({ children }) => {
  const userRole = localStorage.getItem("rol") || "";
  const nombre = localStorage.getItem("nombre") || "";
  const { addNotification } = useContext(NotificationContext);

  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

 // Rutas según rol
  const homeRoute =
    userRole === "usuario"
      ? "/home"
      : userRole === "tecnico"
      ? "/HomeTecnicoPage"
      : "/HomeAdmiPage";

  const crearCasoRoute =
    userRole === "usuario" ? "/CrearCasoUse" : "/CrearCasoAdmin";

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      addNotification(`Buscando: ${searchTerm}`, "info");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addNotification(`Resultados para: ${searchTerm}`, "success");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      addNotification(`Error en búsqueda: ${errorMsg}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      handleSearch();
    }
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleMenuClick = (menuName) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  const handleMouseLeave = () => {
    setOpenMenu(null);
  };

  const handleLinkClick = () => {
    setOpenMenu(null);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={styles.containerPrincipal}>
      {/* Menú Vertical */}
      <aside
        className={`${styles.menuVertical} ${isMenuExpanded ? styles.expanded : ""}`}
        onMouseEnter={() => setIsMenuExpanded(true)}
        onMouseLeave={() => setIsMenuExpanded(false)}
      >
        <div className={styles.containerFluidMenu}>
          {/* Logo */}
          <div className={styles.logoContainer}>
            <img src={Logo} alt="Logo" />
          </div>

          {/* Botón menú móvil */}
          <button
            className={`${styles.menuButton} ${styles.mobileMenuButton}`}
            type="button"
            onClick={toggleMobileMenu}
          >
            <FiAlignJustify className={styles.menuIcon} />
          </button>

          {/* Contenedor Menú */}
          <div
            className={`${styles.menuVerticalDesplegable} ${isMobileMenuOpen ? styles.mobileMenuOpen : ""}`}
          >
            <ul className={styles.menuIconos}>

              {/* Inicio */}
              <li className={styles.iconosMenu}>
                <Link to={homeRoute} className={styles.linkSinSubrayado} onClick={handleLinkClick}>
                  <FcHome className={styles.menuIcon} />
                  <span className={styles.menuText}>Inicio</span>
                </Link>
              </li>

              {/* Soporte (técnico y administrador) */}
              {(userRole === "tecnico" || userRole === "administrador") && (
                <li
                  className={styles.iconosMenu}
                  onMouseLeave={handleMouseLeave}
                >
                  <div
                    className={styles.linkSinSubrayado}
                    onClick={() => handleMenuClick("support")}
                  >
                    <FcAssistant className={styles.menuIcon} />
                    <span className={styles.menuText}> Soporte</span>
                  </div>
                  <ul className={`${styles.submenu} ${openMenu === "support" ? styles.showSubmenu : ""}`}>
                    <li>
                      <Link to={crearCasoRoute} className={styles.submenuLink} onClick={handleLinkClick}>
                        <FcCustomerSupport className={styles.menuIcon} />
                        <span className={styles.menuText}>Crear Caso</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/Tickets" className={styles.submenuLink} onClick={handleLinkClick}>
                        <FcAnswers className={styles.menuIcon} />
                        <span className={styles.menuText}>Tickets</span>
                      </Link>
                    </li>
                    
                  </ul>
                </li>
              )}

              {/* Soporte para usuario */}
              {userRole === "usuario" && (
                <>
                  <li className={styles.iconosMenu}>
                    <Link to={crearCasoRoute} className={styles.linkSinSubrayado} onClick={handleLinkClick}>
                      <FcCustomerSupport className={styles.menuIcon} />
                      <span className={styles.menuText}>Crear Caso</span>
                    </Link>
                  </li>
                  <li className={styles.iconosMenu}>
                    <Link to="/Tickets" className={styles.linkSinSubrayado} onClick={handleLinkClick}>
                      <FcAnswers className={styles.menuIcon} />
                      <span className={styles.menuText}>Tickets</span>
                    </Link>
                  </li>
                </>
              )}

              {/* Administración */}
              {(userRole === "tecnico" || userRole === "administrador") && (
                <li
                  className={styles.iconosMenu}
                  onMouseLeave={handleMouseLeave}
                >
                  <div
                    className={styles.linkSinSubrayado}
                    onClick={() => handleMenuClick("admin")}
                  >
                    <FcBusinessman className={styles.menuIcon} />
                    <span className={styles.menuText}> Administración</span>
                  </div>
                  <ul className={`${styles.submenu} ${openMenu === "admin" ? styles.showSubmenu : ""}`}>
                    <li>
                      <Link to="/Usuarios" className={styles.submenuLink} onClick={handleLinkClick}>
                        <FcPortraitMode className={styles.menuIcon} />
                        <span className={styles.menuText}>Usuarios</span>
                      </Link>
                    </li>
                    {userRole === "administrador" && (
                      <>
                        <li>
                          <Link to="/Grupos" className={styles.submenuLink} onClick={handleLinkClick}>
                            <FcConferenceCall className={styles.menuIcon} />
                            <span className={styles.menuText}>Grupos</span>
                          </Link>
                        </li>
                        <li>
                          <Link to="/Entidades" className={styles.submenuLink} onClick={handleLinkClick}>
                            <FcOrganization className={styles.menuIcon} />
                            <span className={styles.menuText}>Entidades</span>
                          </Link>
                        </li>
                      </>
                    )}
                  </ul>
                </li>
              )}

              {/* Configuración solo administrador */}
              {userRole === "administrador" && (
                <li
                  className={styles.iconosMenu}
                  onMouseLeave={handleMouseLeave}
                >
                  <div
                    className={styles.linkSinSubrayado}
                    onClick={() => handleMenuClick("config")}
                  >
                    <FcAutomatic className={styles.menuIcon} />
                    <span className={styles.menuText}> Configuración</span>
                  </div>
                  <ul className={`${styles.submenu} ${openMenu === "config" ? styles.showSubmenu : ""}`}>
                    <li>
                      <Link to="/Categorias" className={styles.submenuLink} onClick={handleLinkClick}>
                        <FcGenealogy className={styles.menuIcon} />
                        <span className={styles.menuText}>Categorías</span>
                      </Link>
                    </li>
                  </ul>
                </li>
              )}

            </ul>
          </div>

          <div className={styles.floatingContainer}>
            <div className={styles.menuLogoEmpresarial}>
              <img src={Logoempresarial} alt="Logo Empresarial" />
            </div>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <div style={{ marginLeft: isMenuExpanded ? "200px" : "60px", transition: "margin-left 0.3s ease" }}>
        {/* Header */}
        <header className={styles.containerInicio}>
          <div className={styles.containerInicioImg}>
            <Link to={homeRoute} className={styles.linkSinSubrayado}>
              <span>Inicio</span>
            </Link>
          </div>
          <div className={styles.inputContainer}>
            <div className={styles.searchContainer}>
              <input
                className={styles.search}
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button
                className={styles.buttonBuscar}
                title="Buscar"
                disabled={isLoading || !searchTerm.trim()}
                onClick={handleSearch}
              >
                <FaMagnifyingGlass className={styles.searchIcon} />
              </button>
              {isLoading && <span className={styles.loading}>Buscando...</span>}
              {error && <div className={styles.errorMessage}>{error}</div>}
            </div>

            <div className={styles.userContainer}>
              <span className={styles.username}>
                Bienvenido, <span id="nombreusuario">{nombre}</span>
              </span>
              <div className={styles.iconContainer}>
                <Link to="/">
                  <FaPowerOff className={styles.icon} />
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Vista principal */}
        {children}
      </div>
    </div>
  );
};
export default MenuVertical;
