import React, { useState, useContext, useEffect, useCallback } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { FaMagnifyingGlass, FaPowerOff } from "react-icons/fa6";
import { FiAlignJustify } from "react-icons/fi";
import { FcHome, FcAssistant, FcBusinessman, FcAutomatic, FcAnswers, FcCustomerSupport, FcExpired, FcGenealogy, FcBullish, FcConferenceCall, FcPortraitMode, FcOrganization } from "react-icons/fc";
import styles from "../styles/HomeAdmiPage.module.css";
import axios from "axios";
import ChatBot from "../Componentes/ChatBot";
import { NotificationContext } from "../context/NotificationContext";
import MenuVertical from "../Componentes/MenuVertical";

const HomeTecnicoPage = () => {

    // Obtener datos del usuario
  const userRole = localStorage.getItem("rol") || "usuario";
  const nombre = localStorage.getItem("nombre");
  const userId = localStorage.getItem("id_usuario") || localStorage.getItem("userId") || "";
  const { addNotification } = useContext(NotificationContext);
  const navigate = useNavigate();

  const goEdit = (id) => id && navigate(`/tickets/solucion/${id}`);
  const norm = (s) => String(s || '').toLowerCase().trim().replace(/_/g, ' ');


  // Estados
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeView, setActiveView] = useState("personal");
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tableData, setTableData] = useState({
    nuevo: [], enCurso: [], enEspera: [], resueltos: [], cerrados: [], borrados: [], encuesta: [], abiertos: [],
  });
  const [ticketsEnCurso, setTicketsEnCurso] = useState([]);
  const [ticketsResueltos, setTicketsResueltos] = useState([]);
  const [ticketsACerrar, setTicketsACerrar] = useState([]);
  const [globalListKey, setGlobalListKey] = useState(null);


  // Datos
  const tickets = [
    { label: "Nuevo", key: 'nuevo', color: "green", icon: "🟢", count: tableData.nuevo.length },
    { label: "En curso", key: 'enCurso', color: "lightgreen", icon: "⏳", count: tableData.enCurso.length },
    { label: "En espera", key: 'enEspera', color: "orange", icon: "🟡", count: tableData.enEspera.length },
    { label: "Resueltos", key: 'resueltos', color: "gray", icon: "✔️", count: tableData.resueltos.length },
    { label: "Cerrado", key: 'cerrados', color: "black", icon: "✅", count: tableData.cerrados.length },
    { label: "Borrado", key: 'borrados', color: "red", icon: "🗑", count: tableData.borrados.length },
    { label: "Encuesta", key: 'encuesta', color: "purple", icon: "📅", count: tableData.encuesta.length },
    { label: "Abiertos", key: 'abiertos', color: "#4CAF50", icon: "📝", count: tableData.abiertos.length },
  ];

  const notify = useCallback((message, type = 'info') => addNotification(message, type), [addNotification]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const [estadoGeneralRes, estado_tickets] = await Promise.all([
          axios.get("/usuarios/estado_tickets", { headers: { Authorization: `Bearer ${token}` }, params: { usuario_id: userId, rol: 'tecnico' } }),
          axios.get(`/usuarios/tickets/tecnico/${userId}`),
        ]);

        // Fuente personal: tickets del técnico
        const personal = estado_tickets.data || [];
        setTicketsEnCurso(personal.filter(t => norm(t.estado) === 'en curso'));
  setTicketsResueltos(personal.filter(t => norm(t.estado) === 'resuelto'));
        setTicketsACerrar(personal.filter(t => !['resuelto','cerrado','borrado'].includes(norm(t.estado))));

        // Agrupado global
  const agrupados = { nuevo: [], enCurso: [], enEspera: [], resueltos: [], cerrados: [], borrados: [], encuesta: [], abiertos: [] };
        (estadoGeneralRes.data || []).forEach(ticket => {
          const estado = norm(ticket.estado || ticket.estado_ticket);
          let key;
          switch (estado) {
            case 'nuevo':
            case 'new': key = 'nuevo'; break;
            case 'en curso':
            case 'en proceso':
            case 'proceso': key = 'enCurso'; break;
            case 'en espera':
            case 'en_espera':
            case 'espera': key = 'enEspera'; break;
            case 'resuelto':
            case 'solucionado': key = 'resueltos'; break;
            case 'cerrado': key = 'cerrados'; break;
            case 'borrado':
            case 'eliminado': key = 'borrados'; break;
            case 'abierto': key = 'abiertos'; break;
            case 'encuesta': key = 'encuesta'; break;
            default: key = null;
          }
          if (key && agrupados[key]) {
            const baseObj = {
              id: ticket.id || ticket.id_ticket,
              solicitante: ticket.solicitante || ticket.nombre_completo,
              titulo: ticket.titulo,
              descripcion: ticket.descripcion,
              prioridad: ticket.prioridad,
              fecha_creacion: ticket.fecha_creacion,
              tecnico: ticket.tecnico || ticket.asignadoA || 'Sin asignar',
              estado
            };
            agrupados[key].push(baseObj);
            if (estado === 'resuelto') {
              agrupados.encuesta.push(baseObj);
            }
          }
        });

        setTableData(agrupados);
      } catch (err) {
        console.error('Error cargando tickets técnico/global:', err);
        notify('Error al cargar tickets', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTickets();
  }, [userId, notify]);


  // Handlers

  const toggleChat = () => setIsChatOpen(!isChatOpen);

  const toggleSupport = () => {
    setIsSupportOpen(!isSupportOpen);
    setIsAdminOpen(false);
    setIsConfigOpen(false);
  };

  const toggleAdmin = () => {
    setIsAdminOpen(!isAdminOpen);
    setIsSupportOpen(false);
    setIsConfigOpen(false);
  };

  const toggleConfig = () => {
    setIsConfigOpen(!isConfigOpen);
    setIsSupportOpen(false);
    setIsAdminOpen(false);
  };

  const handleSelectChange = (event) => {
    const value = event.target.value;
    setActiveView(value === "0" ? "personal" : value === "1" ? "global" : "todo");
  };

  const toggleMenu = () => setIsMenuExpanded(!isMenuExpanded);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const roleToPath = {
    usuario: '/home',
    tecnico: '/HomeTecnicoPage',
    administrador: '/HomeAdmiPage'
  };


  return (
    <MenuVertical>
      <>


        {/* Contenido Principal */}
        <div className={styles.containerHomeAdmiPage}>
          <main>
            <div className={styles.flexColumna}>
              <div className={styles.row}>
                <div className={styles.col}>
                  <div className={styles.flexColumnHorizontal}>
                    <div className={styles.viewButtonsContainer}>
                      <button
                        className={`${styles.viewButton} ${activeView === "personal" ? styles.active : ""}`}
                        onClick={() => setActiveView("personal")}
                      >
                        Vista Personal
                      </button>
                      <button
                        className={`${styles.viewButton} ${activeView === "global" ? styles.active : ""}`}
                        onClick={() => setActiveView("global")}
                      >
                        Vista Global
                      </button>
                      <button
                        className={`${styles.viewButton} ${activeView === "todo" ? styles.active : ""}`}
                        onClick={() => setActiveView("todo")}
                      >
                        Todo
                      </button>
                    </div>
                    <select className={`${styles.viewSelect} form-select`} onChange={handleSelectChange}>
                      <option value={0}>Vista Personal</option>
                      <option value={1}>Vista Global</option>
                      <option value={2}>Todo</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="app-container">
              {/* Vista Personal */}
              {(activeView === "personal" || activeView === "todo") && (
                <>
                  <div className={styles.tablaContainer}>
                    <h2>SUS CASOS A CERRAR</h2>
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>SOLICITANTE</th>
                          <th>ELEMENTOS ASOCIADOS</th>
                          <th>DESCRIPCIÓN</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ticketsACerrar.map(t => (
                          <tr key={t.id || t.id_ticket} onClick={() => goEdit(t.id || t.id_ticket)} style={{ cursor: 'pointer' }}>
                            <td>{t.id || t.id_ticket}</td>
                            <td>{t.solicitante || 'N/A'}</td>
                            <td>{t.categoria || 'General'}</td>
                            <td>{t.descripcion || t.titulo || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                   <div className={styles.tablaContainer}>
                    <h2>ENCUESTA DE SATISFACCIÓN (Pendientes)</h2>
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>SOLICITANTE</th>
                          <th>ELEMENTOS ASOCIADOS</th>
                          <th>DESCRIPCIÓN</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ticketsResueltos.map(ticket => (
                          <tr key={ticket.id || ticket.id_ticket}>
                            <td style={{cursor:'pointer'}} onClick={() => goEdit(ticket.id || ticket.id_ticket)}>{ticket.id || ticket.id_ticket}</td>
                            <td>{ticket.solicitante}</td>
                            <td>{ticket.categoria || 'General'}</td>
                            <td style={{maxWidth:'260px'}}>{ticket.descripcion}</td>
                            <td>
                              <button
                                className={styles.viewButton}
                                style={{padding:'4px 8px'}}
                                onClick={() => navigate(`/EncuestaSatisfaccion/${ticket.id || ticket.id_ticket}`)}
                              >
                                Encuesta
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Vista Global */}
              {(activeView === "global" || activeView === "todo") && (
                <>
                  <div className={styles.sectionContainer}>
                    <h2>Tickets</h2>
                    <div className={styles.cardsContainer}>
                      {tickets.map((ticket, index) => (
                        <div key={index} className={styles.card} style={{ borderColor: ticket.color }} onClick={() => setGlobalListKey(ticket.key)}>
                          <span className="icon">{ticket.icon}</span>
                          <span className="label">{ticket.label}</span>
                          <span className="count">{ticket.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {globalListKey && (
                    <div className={styles.tablaContainer}>
                      <h2>Casos: {tickets.find(t => t.key === globalListKey)?.label}</h2>
                      <table>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>SOLICITANTE</th>
                            <th>TÍTULO</th>
                            <th>PRIORIDAD</th>
                            <th>TÉCNICO</th>
                            <th>FECHA CREACIÓN</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(tableData[globalListKey] || []).map(row => (
                            <tr key={row.id} onClick={() => goEdit(row.id)} style={{ cursor: 'pointer' }}>
                              <td>{row.id}</td>
                              <td>{row.solicitante}</td>
                              <td>{row.titulo}</td>
                              <td>{row.prioridad}</td>
                              <td>{row.tecnico}</td>
                              <td>{row.fecha_creacion}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}


                </>
              )}
            </div>
          </main>
        </div>

        <ChatBot />
      </>
    </MenuVertical>
  );
};

export default HomeTecnicoPage;