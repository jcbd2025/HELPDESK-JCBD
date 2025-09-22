import React, { useState, useEffect, useContext, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell, 
  ResponsiveContainer, 
} from "recharts";
import axios from "axios";
import styles from "../styles/HomeAdmiPage.module.css";
import ChatBot from "../Componentes/ChatBot";
import { NotificationContext } from "../context/NotificationContext";
import MenuVertical from "../Componentes/MenuVertical";


const HomeAdmiPage = () => {
  const navigate = useNavigate();
  const getTicketId = (obj) => obj?.id ?? obj?.id_ticket ?? obj?.id_ ?? obj?.idTicket ?? obj?.id_ticket2 ?? obj?.id_ticket3 ?? null;
  const goEdit = (id) => {
    if (!id) return;
    navigate(`/tickets/solucion/${id}`);
  };
  // Obtener datos del usuario
  const userRole = localStorage.getItem("rol") || "";
  const { addNotification } = useContext(NotificationContext);
  // userId puede estar guardado como 'id_usuario' o 'userId'
  const userId = localStorage.getItem("id_usuario") || localStorage.getItem("userId") || "";
  console.log("Valor de id_usuario:", userId);

  // Estados
  const [activeView, setActiveView] = useState("personal");
  const [tableData, setTableData] = useState({
    nuevo: [],
    enCurso: [],
    enEspera: [],
    resueltos: [],
    cerrados: [],
    borrados: [],
    encuesta: [],
    abiertos: [],
 
  });

  const [ticketsEnCurso, setTicketsEnCurso] = useState([]);
  const [ticketsResueltos, setTicketsResueltos] = useState([]);
  const [ticketsACerrar, setTicketsACerrar] = useState([]);
  const [globalListKey, setGlobalListKey] = useState(null);

  // Usar useCallback para addNotification
  const notify = useCallback((message, type = 'info') => {
    addNotification(message, type);
  }, [addNotification]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem("token");
        const userFullName = (localStorage.getItem("nombre_completo") || localStorage.getItem("nombre") || "").trim();

        // 🔹 Peticiones separadas para en curso y cerrados
        const [estadoGeneralRes, estado_tickets] = await Promise.all([
          axios.get("/usuarios/estado_tickets", {
            headers: { Authorization: `Bearer ${token}` },
            params: { usuario_id: userId, rol: userRole },
          }),
          axios.get(`/usuarios/tickets/tecnico/${userId}`),
        ]);

        // Normalizar estados y guardar en estados independientes para la vista personal
  const norm = (s) => String(s || '').toLowerCase().trim().replace(/_/g, ' ');
        const allTickets = estadoGeneralRes.data || [];
        const techTickets = estado_tickets.data || [];
        const isTech = (userRole || '').toLowerCase() === 'tecnico';

        const personalSource = isTech ? techTickets : allTickets;

        setTicketsEnCurso(
          personalSource.filter((t) => norm(t.estado) === 'en curso')
        );
        // Tickets resueltos (pendientes de encuesta): estado = resuelto y todavía no cerrados
        setTicketsResueltos(
          personalSource.filter((t) => norm(t.estado) === 'resuelto')
        );
        // Casos a cerrar: excluir resuelto, cerrado y borrado
        // Filtrar sólo tickets NO resueltos/cerrados/borrados y asignados al usuario actual (si hay nombre)
        const ticketsPendientes = personalSource.filter((t) => !['resuelto', 'cerrado', 'borrado'].includes(norm(t.estado)));
        const nombreMatch = (a, b) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();
        const ticketsAsignados = userFullName
          ? ticketsPendientes.filter(t => {
              const tecnicoAsignado = (t.tecnico || t.asignadoA || t.asignado_a || t.tecnico_asignado || t.nombre_tecnico || '').toString();
              return nombreMatch(tecnicoAsignado, userFullName);
            })
          : ticketsPendientes; // Si no tenemos nombre del usuario, mostrar pendientes (fallback)
        setTicketsACerrar(ticketsAsignados);

        // Agrupar datos para las tablas generales
        const agrupados = {
          nuevo: [],
          enCurso: [],
          enEspera: [],
          resueltos: [],
          cerrados: [],
          borrados: [],
          encuesta: [],
          abiertos: [],
          
        };

        estadoGeneralRes.data.forEach((ticket) => {
          // Normalizar el estado (minúsculas, sin guiones bajos)
          const estado = norm(ticket.estado || ticket.estado_ticket);

          let estadoFrontend;
          switch (estado) {
            case "nuevo":
            case "new":
              estadoFrontend = "nuevo";
              break;
            case "en curso":
            case "en_proceso":
            case "en proceso":
            case "proceso":
              estadoFrontend = "enCurso";
              break;
            case "en_espera":
            case "en espera":
            case "espera":
              estadoFrontend = "enEspera";
              break;
            case "resuelto":
            case "solucionado":
              estadoFrontend = "resueltos";
              break;
            case "cerrado":
              estadoFrontend = "cerrados";
              break;
            case "borrado":
            case "eliminado":
              estadoFrontend = "borrados";
              break;
            case "abierto":
              estadoFrontend = "abiertos";
              break;
            
            case "encuesta":
              // Si hubiera estado 'encuesta' explícito lo podríamos mapear aparte, pero mantenemos lógica.
              estadoFrontend = "encuesta";
              break;
            default:
              estadoFrontend = estado;
          }

          if (estadoFrontend && agrupados[estadoFrontend] !== undefined) {
            // Resolver nombre del técnico asignado considerando múltiples posibles campos
            const tecnicoAsignado =
              ticket.tecnico ||
              ticket.asignadoA ||
              ticket.asignado_a ||
              ticket.tecnico_asignado ||
              ticket.nombre_tecnico ||
              ticket.asignado ||
              ticket.nombre_asignado ||
              ticket.tecnicoNombre ||
              ticket.asignadoNombre ||
              "Sin asignar";

            const baseObj = {
              id: ticket.id || ticket.id_ticket,
              solicitante: ticket.solicitante || ticket.nombre_completo,
              descripcion: ticket.descripcion,
              titulo: ticket.titulo,
              prioridad: ticket.prioridad,
              fecha_creacion: ticket.fecha_creacion,
              tecnico: tecnicoAsignado,
              estado
            };
            agrupados[estadoFrontend].push(baseObj);
            // Adicional: llenar 'encuesta' sólo si es resuelto (pendiente de encuesta)
            if (estado === 'resuelto') {
              agrupados.encuesta.push(baseObj);
            }
          }
        });

        setTableData(agrupados);
      } catch (error) {
        console.error("Error al obtener los tickets:", error);
        notify("Error al cargar los tickets", "error");
      }
    };

    fetchTickets();
  }, [userId, userRole, notify]);

  // Datos
  const tickets = [
    {
      label: "Nuevo",
      key: 'nuevo',
      color: "green",
      icon: "🟢",
      count: tableData.nuevo.length,
    },
    {
      label: "En curso",
      key: 'enCurso',
      color: "lightgreen",
      icon: "⏳",
      count: tableData.enCurso.length,
    },
    {
      label: "En espera",
      key: 'enEspera',
      color: "orange",
      icon: "🟡",
      count: tableData.enEspera.length,
    },
    {
      label: "Resueltos",
      key: 'resueltos',
      color: "gray",
      icon: "✔️",
      count: tableData.resueltos.length,
    },
    {
      label: "Cerrado",
      key: 'cerrados',
      color: "black",
      icon: "✅",
      count: tableData.cerrados.length,
    },
    {
      label: "Borrado",
      key: 'borrados',
      color: "red",
      icon: "🗑",
      count: tableData.borrados.length,
    },
    {
      label: "Encuesta",
      key: 'encuesta',
      color: "purple",
      icon: "📅",
      count: tableData.encuesta.length,
    },
    {
      label: "Abiertos",
      key: 'abiertos',
      color: "#4CAF50",
      icon: "📝",
      count: tableData.abiertos.length,
    },
    
  ];

  const handleSelectChange = (event) => {
    const value = event.target.value;
    const views = ["personal", "global", "todo"];
    setActiveView(views[parseInt(value)]);
    notify(`Vista cambiada a: ${views[parseInt(value)]}`, "info");
  };

  // Verificación de rol
  if (userRole !== "administrador") {
    return (
      <div className={styles.accessDenied}>
        <h2>Acceso denegado</h2>
        <p>No tienes permisos para acceder a esta página.</p>
        <Link to="/" className={styles.returnLink}>
          Volver al inicio
        </Link>
      </div>
    );
  }


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
                        className={`${styles.viewButton} ${
                          activeView === "personal" ? styles.active : ""
                        }`}
                        onClick={() => setActiveView("personal")}
                      >
                        Vista Personal
                      </button>
                      <button
                        className={`${styles.viewButton} ${
                          activeView === "global" ? styles.active : ""
                        }`}
                        onClick={() => setActiveView("global")}
                      >
                        Vista Global
                      </button>
                      <button
                        className={`${styles.viewButton} ${
                          activeView === "todo" ? styles.active : ""
                        }`}
                        onClick={() => setActiveView("todo")}
                      >
                        Todo
                      </button>
                   
                    </div>
                    <select
                      className={`${styles.viewSelect} form-select`}
                      onChange={handleSelectChange}
                    >
                      <option value={0}>Vista Personal</option>
                      <option value={1}>Vista Global</option>
                      <option value={2}>Todo</option>
                      <option value={3}>Tablero</option>
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
                        {ticketsACerrar.map((t) => {
                          const id = getTicketId(t);
                          return (
                          <tr key={id ?? Math.random()} onClick={() => goEdit(id)} style={{ cursor: 'pointer' }}>
                            <td>{id}</td>
                            <td>{t.solicitante || 'N/A'}</td>
                            <td>{t.categoria || 'General'}</td>
                            <td>{t.descripcion || t.titulo || ''}</td>
                          </tr>
                        );})}
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
                        {ticketsResueltos.map((ticket) => {
                          const id = getTicketId(ticket);
                          return (
                          <tr key={id ?? Math.random()}>
                            <td style={{cursor:'pointer'}} onClick={() => goEdit(id)}>{id}</td>
                            <td>{ticket.solicitante}</td>
                            <td>{ticket.categoria}</td>
                            <td style={{maxWidth:'260px'}}>{ticket.descripcion}</td>
                            <td>
                              <button
                                className={styles.viewButton}
                                style={{padding:'4px 8px'}}
                                onClick={() => navigate(`/EncuestaSatisfaccion/${id}`)}
                              >
                                Encuesta
                              </button>
                            </td>
                          </tr>
                        );})}
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
                        <div
                          key={index}
                          className={styles.card}
                          style={{ borderColor: ticket.color }}
                          onClick={() => setGlobalListKey(ticket.key)}
                        >
                          <span className="icon">{ticket.icon}</span>
                          <span className="label">{ticket.label}</span>
                          <span className="count">{ticket.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lista detallada por estado en Vista Global */}
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
                          {(tableData[globalListKey] || []).map((row) => (
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

export default HomeAdmiPage;