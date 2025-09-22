import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
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
  const [results, setResults] = useState({ tickets: [], usuarios: [], categorias: [], grupos: [] });
  const [showPanel, setShowPanel] = useState(false);
  const debounceRef = useRef(null);
  const panelRef = useRef(null);

 // Rutas según rol
  const homeRoute =
    userRole === "usuario"
      ? "/home"
      : userRole === "tecnico"
      ? "/HomeTecnicoPage"
      : "/HomeAdmiPage";

  const crearCasoRoute =
    userRole === "usuario" ? "/CrearCasoUse" : "/CrearCasoAdmin";

  const runQuery = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setResults({ tickets: [], usuarios: [], categorias: [], grupos: [] });
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const rol = (localStorage.getItem('rol') || '').toLowerCase();
      const usuarioId = localStorage.getItem('id_usuario') || localStorage.getItem('userId') || '';
      const params = new URLSearchParams({ q });
      if (rol) params.append('rol', rol);
      if (usuarioId) params.append('usuario_id', usuarioId);
      const res = await fetch(`/usuarios/buscar?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.results || { tickets: [], usuarios: [], categorias: [], grupos: [] });
      } else {
        setResults({ tickets: [], usuarios: [], categorias: [], grupos: [] });
      }
    } catch (err) {
      const errorMsg = err.message;
      setError(errorMsg);
      setResults({ tickets: [], usuarios: [], categorias: [], grupos: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = () => {
    if (searchTerm.trim().length >= 2) {
      runQuery(searchTerm.trim());
      setShowPanel(true);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && searchTerm.trim().length >= 2) {
      handleSearch();
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    setShowPanel(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.trim().length >= 2) {
        runQuery(val.trim());
      } else {
        setResults({ tickets: [], usuarios: [], categorias: [], grupos: [] });
      }
    }, 400);
  };

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowPanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
                placeholder="Buscar (mínimo 2 letras)..."
                value={searchTerm}
                onChange={handleChange}
                onKeyDown={handleKeyPress}
                onFocus={() => { if (searchTerm.trim().length >=2) setShowPanel(true); }}
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
              {showPanel && (
                <div ref={panelRef} style={{position:'absolute', top:'42px', left:0, width:'560px', maxHeight:'60vh', overflowY:'auto', background:'#fff', border:'1px solid #ddd', borderRadius:'8px', padding:'10px', boxShadow:'0 4px 12px rgba(0,0,0,0.15)', zIndex:1000}}>
                  {searchTerm.trim().length < 2 && <div style={{fontSize:'12px', color:'#666'}}>Escribe al menos 2 caracteres…</div>}
                  {searchTerm.trim().length >=2 && !isLoading && Object.values(results).every(arr => !arr || arr.length===0) && (
                    <div style={{fontSize:'12px', color:'#666'}}>Sin resultados</div>
                  )}
                  {results.tickets?.length > 0 && (
                    <div style={{marginBottom:'10px'}}>
                      <div style={{fontSize:'11px', fontWeight:'600', color:'#444', textTransform:'uppercase'}}>Tickets</div>
                      {results.tickets.map(t => {
                        const rol = (localStorage.getItem('rol') || '').toLowerCase();
                        const usuarioNombre = (localStorage.getItem('nombre_completo') || localStorage.getItem('nombre') || '').trim().toLowerCase();
                        const esPropio = usuarioNombre && (t.solicitante || '').trim().toLowerCase() === usuarioNombre;
                        const clickable = rol !== 'usuario' || esPropio;
                        return (
                          <div
                            key={`t-${t.id}`}
                            style={{padding:'6px 4px', borderBottom:'1px solid #eee', cursor: clickable ? 'pointer' : 'not-allowed', opacity: clickable ? 1 : 0.55}}
                            title={clickable ? 'Ver ticket' : 'No autorizado'}
                            onClick={() => { if (clickable) window.location.href = `/tickets/solucion/${t.id}`; }}
                          >
                            <div style={{fontSize:'13px', fontWeight:'500'}}>{t.titulo || '(Sin título)'} <span style={{color:'#888'}}>#{t.id}</span></div>
                            <div style={{fontSize:'11px', color:'#666'}}>{(t.descripcion || '').slice(0,110)}</div>
                            <div style={{fontSize:'10px', color:'#999'}}>Estado: {t.estado} • Prioridad: {t.prioridad} • Sol: {t.solicitante || '—'}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {results.usuarios?.length > 0 && (
                    <div style={{marginBottom:'10px'}}>
                      <div style={{fontSize:'11px', fontWeight:'600', color:'#444', textTransform:'uppercase'}}>Usuarios</div>
                      {results.usuarios.map(u => (
                        <div key={`u-${u.id}`} style={{padding:'6px 4px', borderBottom:'1px solid #eee'}}>
                          <div style={{fontSize:'13px', fontWeight:'500'}}>{u.nombre_completo} <span style={{color:'#888'}}>({u.nombre_usuario})</span></div>
                          <div style={{fontSize:'11px', color:'#666'}}>{u.correo}</div>
                          <div style={{fontSize:'10px', color:'#999'}}>Rol: {u.rol} • Estado: {u.estado}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {results.categorias?.length > 0 && (
                    <div style={{marginBottom:'10px'}}>
                      <div style={{fontSize:'11px', fontWeight:'600', color:'#444', textTransform:'uppercase'}}>Categorías</div>
                      {results.categorias.map(c => (
                        <div key={`c-${c.id}`} style={{padding:'6px 4px', borderBottom:'1px solid #eee'}}>{c.nombre}</div>
                      ))}
                    </div>
                  )}
                  {results.grupos?.length > 0 && (
                    <div style={{marginBottom:'0'}}>
                      <div style={{fontSize:'11px', fontWeight:'600', color:'#444', textTransform:'uppercase'}}>Grupos</div>
                      {results.grupos.map(g => (
                        <div key={`g-${g.id}`} style={{padding:'6px 4px', borderBottom:'1px solid #eee'}}>{g.nombre}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
