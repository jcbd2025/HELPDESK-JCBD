import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import Logo from "../imagenes/logo proyecto color.jpeg";
import Logoempresarial from "../imagenes/logo empresarial.png";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { FaMagnifyingGlass, FaPowerOff } from "react-icons/fa6";
import { FiAlignJustify } from "react-icons/fi";
import { FcHome, FcAssistant, FcBusinessman, FcAutomatic, FcAnswers, FcCustomerSupport, FcExpired, FcGenealogy, FcBullish, FcConferenceCall, FcPortraitMode, FcOrganization } from "react-icons/fc";
import ChatBot from "../Componentes/ChatBot";
import { NotificationContext } from "../context/NotificationContext";
import styles from "../styles/HomePage.module.css";
import MenuVertical from "../Componentes/MenuVertical";


const Breadcrumbs = () => {
  const location = useLocation();
  const pathNameMap = {
    CrearCasoUse: "Crear Caso",
    Tickets: "Tickets",
    EncuestaSatisfaccion: "Encuesta de Satisfacción",
    SolucionTickets: "Solución de Tickets",
  };

  const formatCrumbName = (crumb) => {
    if (pathNameMap[crumb]) return pathNameMap[crumb];
    if (/^\d+$/.test(crumb)) return `#${crumb}`;
    return crumb.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  let currentLink = "";
  const crumbs = location.pathname
    .split("/")
    .filter((crumb) => crumb !== "" && crumb !== "home")
    .map((crumb, index, array) => {
      currentLink += `/${crumb}`;
      const isLast = index === array.length - 1;
      return (
        <div className={styles.crumb} key={crumb}>
          {isLast ? (
            <span>{formatCrumbName(crumb)}</span>
          ) : (
            <Link to={currentLink}>{formatCrumbName(crumb)}</Link>
          )}
          {!isLast && <span className={styles.separator}>/</span>}
        </div>
      );
    });

  return (
    <div className={styles.breadcrumbs}>
      <div className={styles.crumb}>
        <Link to="/home">Inicio</Link>
        {crumbs.length > 0 && <span className={styles.separator}>/</span>}
      </div>
      {crumbs}
    </div>
  );
};

const HomePage = () => {

  // Obtener datos del usuario
  const userRole = localStorage.getItem("rol") || "usuario";
  const nombre = localStorage.getItem("nombre");
  const userId = localStorage.getItem("id_usuario");
  const { addNotification } = useContext(NotificationContext);

  const roleToPath = {
    usuario: '/home',
    tecnico: '/HomeTecnicoPage',
    administrador: '/HomeAdmiPage'
  };


  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [completedSurveys, setCompletedSurveys] = useState([]);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const navigate = useNavigate();
  const [tableData, setTableData] = useState({
    nuevo: [],
    enCurso: [],
    enEspera: [],
    resueltos: [],
    cerrados: [],
    borrados: [],
    encuesta: [],
    abiertos: [],
    pendientes: [],
  });





  const handleTicketClick = (ticket) => {
    const editRoute = userRole === "usuario" ? "/CrearCasoUse" : "/CrearCasoAdmin";
    navigate(editRoute, {
      state: {
        ticketData: ticket,
        mode: "edit",
      },
    });
  };

  const markSurveyAsCompleted = (surveyId) => {
    setCompletedSurveys([...completedSurveys, surveyId]);
  };

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/usuarios/estado_tickets", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            usuario_id: userId,
            rol: userRole
          }
        });

        const agrupados = {
          nuevo: [],
          enCurso: [],
          enEspera: [],
          resueltos: [],
          cerrados: [],
          borrados: [],
          encuesta: [],
          abiertos: [],
          pendientes: [],
        };

        response.data.forEach((ticket) => {
          const estado = ticket.estado?.toLowerCase() || ticket.estado_ticket?.toLowerCase();

          let estadoFrontend;
          switch (estado) {
            case 'nuevo':
            case 'new':
              estadoFrontend = 'nuevo';
              break;
            case 'en_curso':
            case 'en_proceso':
            case 'proceso':
              estadoFrontend = 'enCurso';
              break;
            case 'en_espera':
            case 'espera':
            case 'pendiente':
              estadoFrontend = 'enEspera';
              break;
            case 'resuelto':
            case 'solucionado':
              estadoFrontend = 'resueltos';
              break;
            case 'cerrado':
              estadoFrontend = 'cerrados';
              break;
            case 'borrado':
            case 'eliminado':
              estadoFrontend = 'borrados';
              break;
            case 'abierto':
              estadoFrontend = 'abiertos';
              break;
            case 'pendiente':
              estadoFrontend = 'pendientes';
              break;
            case 'encuesta':
              estadoFrontend = 'encuesta';
              break;
            default:
              estadoFrontend = estado;
          }

          if (estadoFrontend && agrupados[estadoFrontend] !== undefined) {
            agrupados[estadoFrontend].push({
              id: ticket.id || ticket.id_ticket,
              solicitante: ticket.solicitante || ticket.nombre_completo,
              descripcion: ticket.descripcion,
              titulo: ticket.titulo,
              prioridad: ticket.prioridad,
              fecha_creacion: ticket.fecha_creacion,
              tecnico: ticket.tecnico || ticket.asignadoA || 'Sin asignar'
            });
          }
        });

        setTableData(agrupados);
      } catch (error) {
        console.error("Error al obtener los tickets:", error);
      }
    };

    fetchTickets();
  }, [userId, userRole]);

  const renderTable = (data, title) => {
    if (!data || data.length === 0) {
      return (
        <div className={styles.tablaContainer}>
          <h2>{title.toUpperCase()}</h2>
          <p>No hay tickets en este estado.</p>
        </div>
      );
    }

    return (
      <div className={styles.tablaContainer}>
        <h2>{title.toUpperCase()}</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>SOLICITANTE</th>
              <th>DESCRIPCIÓN</th>
              <th>PRIORIDAD</th>
              <th>TÉCNICO ASIGNADO</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={index}
                onClick={() => handleTicketClick(item)}
                className={styles.clickableRow}
              >
                <td>#{item.id}</td>
                <td>{item.solicitante}</td>
                <td>{item.descripcion}</td>
                <td>
                  <span className={`${styles.priority} ${styles[item.prioridad?.toLowerCase()] || ''}`}>
                    {item.prioridad}
                  </span>
                </td>
                <td>{item.tecnico}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSurveyTable = (data, title) => {
    const pendingSurveys = data.filter(
      (survey) => !completedSurveys.includes(survey.id)
    );

    if (pendingSurveys.length === 0) {
      return (
        <div className={styles.tablaContainer}>
          <h2>{title.toUpperCase()}</h2>
          <p>No hay encuestas pendientes.</p>
        </div>
      );
    }

    return (
      <div className={styles.tablaContainer}>
        <h2>{title.toUpperCase()}</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>SOLICITANTE</th>
              <th>DESCRIPCIÓN</th>
              <th>TÉCNICO ASIGNADO</th>
            </tr>
          </thead>
          <tbody>
            {pendingSurveys.map((item, index) => (
              <tr
                key={index}
                onClick={() => {
                  markSurveyAsCompleted(item.id);
                  navigate(`/EncuestaSatisfaccion/${item.id}`);
                }}
                className={styles.clickableRow}
              >
                <td>#{item.id}</td>
                <td>{item.solicitante}</td>
                <td>{item.descripcion}</td>
                <td>{item.tecnico}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const tickets = [
    { label: "Nuevo", color: "green", icon: "🟢", count: tableData.nuevo.length, key: "nuevo" },
    { label: "En curso", color: "lightgreen", icon: "⏳", count: tableData.enCurso.length, key: "enCurso" },
    { label: "En espera", color: "orange", icon: "🟡", count: tableData.enEspera.length, key: "enEspera" },
    { label: "Resueltos", color: "gray", icon: "✔️", count: tableData.resueltos.length, key: "resueltos" },
    { label: "Cerrado", color: "black", icon: "✅", count: tableData.cerrados.length, key: "cerrados" },
    { label: "Encuesta", color: "purple", icon: "📅", count: tableData.encuesta.length, key: "encuesta" },
    { label: "Abiertos", color: "#4CAF50", icon: "📝", count: tableData.abiertos.length, key: "abiertos" },
    
  ];

  const handleTabClick = (tabKey) => {
    setActiveTab(activeTab === tabKey ? null : tabKey);
  };

  const getRouteByRole = (section) => {
    if (section === "inicio") {
      if (userRole === "administrador") return "/HomeAdmiPage";
      if (userRole === "tecnico") return "/HomeTecnicoPage";
      return "/home";
    }
    if (section === "crear-caso") {
      if (["administrador", "tecnico"].includes(userRole)) return "/CrearCasoAdmin";
      return "/CrearCasoUse";
    }
    if (section === "tickets") return "/Tickets";
    return "/";
  };

  const renderMenuByRole = () => {
    switch (userRole) {
      case 'administrador':
        return (
          <ul className={styles.menuIconos}>
            <li className={styles.iconosMenu}>
              <Link to="/HomeAdmiPage" className={styles.linkSinSubrayado}>
                <FcHome className={styles.menuIcon} />
                <span className={styles.menuText}>Inicio</span>
              </Link>
            </li>

            <li className={styles.iconosMenu}>
              <div className={styles.linkSinSubrayado} onClick={toggleSupport}>
                <FcAssistant className={styles.menuIcon} />
                <span className={styles.menuText}> Soporte</span>
              </div>
              <ul className={`${styles.submenu} ${isSupportOpen ? styles.showSubmenu : ''}`}>
                <li>
                  <Link to="/Tickets" className={styles.submenuLink}>
                    <FcAnswers className={styles.menuIcon} />
                    <span className={styles.menuText}>Tickets</span>
                  </Link>
                </li>
                <li>
                  <Link to="/CrearCasoAdmin" className={styles.submenuLink}>
                    <FcCustomerSupport className={styles.menuIcon} />
                    <span className={styles.menuText}>Crear Caso</span>
                  </Link>
                </li>
                <li>
                  <Link to="/Estadisticas" className={styles.submenuLink}>
                    <FcBullish className={styles.menuIcon} />
                    <span className={styles.menuText}>Estadísticas</span>
                  </Link>
                </li>
              </ul>
            </li>

            <li className={styles.iconosMenu}>
              <div className={styles.linkSinSubrayado} onClick={toggleAdmin}>
                <FcBusinessman className={styles.menuIcon} />
                <span className={styles.menuText}> Administración</span>
              </div>
              <ul className={`${styles.submenu} ${isAdminOpen ? styles.showSubmenu : ''}`}>
                <li>
                  <Link to="/Usuarios" className={styles.submenuLink}>
                    <FcPortraitMode className={styles.menuIcon} />
                    <span className={styles.menuText}> Usuarios</span>
                  </Link>
                </li>
                <li>
                  <Link to="/Grupos" className={styles.submenuLink}>
                    <FcConferenceCall className={styles.menuIcon} />
                    <span className={styles.menuText}> Grupos</span>
                  </Link>
                </li>
                <li>
                  <Link to="/Entidades" className={styles.submenuLink}>
                    <FcOrganization className={styles.menuIcon} />
                    <span className={styles.menuText}> Entidades</span>
                  </Link>
                </li>
              </ul>
            </li>

            <li className={styles.iconosMenu}>
              <div className={styles.linkSinSubrayado} onClick={toggleConfig}>
                <FcAutomatic className={styles.menuIcon} />
                <span className={styles.menuText}> Configuración</span>
              </div>
              <ul className={`${styles.submenu} ${isConfigOpen ? styles.showSubmenu : ''}`}>
                <li>
                  <Link to="/Categorias" className={styles.submenuLink}>
                    <FcGenealogy className={styles.menuIcon} />
                    <span className={styles.menuText}>Categorias</span>
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
        );

      case 'tecnico':
        return (
          <ul className={styles.menuIconos}>
            <li className={styles.iconosMenu}>
              <Link to="/HomeTecnicoPage" className={styles.linkSinSubrayado}>
                <FcHome className={styles.menuIcon} />
                <span className={styles.menuText}>Inicio</span>
              </Link>
            </li>

            <li className={styles.iconosMenu}>
              <div className={styles.linkSinSubrayado} onClick={toggleSupport}>
                <FcAssistant className={styles.menuIcon} />
                <span className={styles.menuText}> Soporte</span>
              </div>
              <ul className={`${styles.submenu} ${isSupportOpen ? styles.showSubmenu : ''}`}>
                <li>
                  <Link to="/Tickets" className={styles.submenuLink}>
                    <FcAnswers className={styles.menuIcon} />
                    <span className={styles.menuText}>Tickets</span>
                  </Link>
                </li>
                <li>
                  <Link to="/CrearCasoAdmin" className={styles.submenuLink}>
                    <FcCustomerSupport className={styles.menuIcon} />
                    <span className={styles.menuText}>Crear Caso</span>
                  </Link>
                </li>
              </ul>
            </li>

            <li className={styles.iconosMenu}>
              <div className={styles.linkSinSubrayado} onClick={toggleAdmin}>
                <FcBusinessman className={styles.menuIcon} />
                <span className={styles.menuText}> Administración</span>
              </div>
              <ul className={`${styles.submenu} ${isAdminOpen ? styles.showSubmenu : ''}`}>
                <li>
                  <Link to="/Usuarios" className={styles.submenuLink}>
                    <FcPortraitMode className={styles.menuIcon} />
                    <span className={styles.menuText}> Usuarios</span>
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
        );

      case 'usuario':
      default:
        return (
          <ul className={styles.menuIconos}>
            <li className={styles.iconosMenu}>
              <Link to="/home" className={styles.linkSinSubrayado}>
                <FcHome className={styles.menuIcon} />
                <span className={styles.menuText}>Inicio</span>
              </Link>
            </li>

            <li className={styles.iconosMenu}>
              <Link to="/CrearCasoUse" className={styles.linkSinSubrayado}>
                <FcCustomerSupport className={styles.menuIcon} />
                <span className={styles.menuText}>Crear Caso</span>
              </Link>
            </li>

            <li className={styles.iconosMenu}>
              <Link to="/Tickets" className={styles.linkSinSubrayado}>
                <FcAnswers className={styles.menuIcon} />
                <span className={styles.menuText}>Tickets</span>
              </Link>
            </li>
          </ul>
        );
    }
  };

  return (
    <MenuVertical>
      <>
        {/* Contenido principal */}
        <div
          className={styles.container}
          
        >
          <div className={styles.sectionContainer}>
            <div className={styles.ticketContainer}>
              <li className={styles.creacion}>
                <Link to={getRouteByRole("crear-caso")} className={styles.linkSinSubrayado}>
                  <FcCustomerSupport className={styles.menuIcon} />
                  <span className={styles.creacionDeTicket}>Crear Caso</span>
                </Link>
              </li>
            </div>

            <h2>Tickets</h2>
            <div className={styles.cardsContainer}>
              {tickets.map((ticket, index) => (
                <div
                  key={index}
                  className={`${styles.card} ${activeTab === ticket.key ? styles.activeCard : ""}`}
                  style={{ borderColor: ticket.color }}
                  onClick={() => handleTabClick(ticket.key)}
                >
                  <span className={styles.icon}>{ticket.icon}</span>
                  <span className={styles.label}>{ticket.label}</span>
                  <span className={styles.count}>{ticket.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mostrar la tabla correspondiente al tab activo */}
          {activeTab === "nuevo" && renderTable(tableData.nuevo, "Nuevo")}
          {activeTab === "enProceso" && renderTable(tableData.enProceso, "En proceso")}
          {activeTab === "enEspera" && renderTable(tableData.enEspera, "En Espera")}
          {activeTab === "resueltos" && renderTable(tableData.resueltos, "Resueltos")}
          {activeTab === "cerrados" && renderTable(tableData.cerrados, "Cerrados")}
          {activeTab === "borrados" && renderTable(tableData.borrados, "Borrados")}
          {activeTab === "encuesta" && renderSurveyTable(tableData.encuesta, "Encuesta de Satisfacción")}
          {activeTab === "abiertos" && renderTable(tableData.abiertos, "Abiertos")}
          {activeTab === "pendientes" && renderTable(tableData.pendientes, "Pendientes")}
        </div>
        <ChatBot />
      </>
    </MenuVertical>


  );
};

export default HomePage;
