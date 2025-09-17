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

// Datos de ejemplo para el dashboard
const demoStats = {
  users: {
    total: 142,
    active: 128,
    inactive: 14,
    distribution: [
      { name: 'Administradores', value: 8 },
      { name: 'Agentes', value: 32 },
      { name: 'Usuarios', value: 102 }
    ]
  },
  tickets: {
    total: 356,
    open: 142,
    resolved: 214,
    byStatus: [
      { name: 'Abierto', value: 142 },
      { name: 'En progreso', value: 87 },
      { name: 'Resuelto', value: 214 },
      { name: 'Cerrado', value: 198 }
    ],
    trend: Array.from({ length: 30 }, (_, i) => ({
      date: `${i + 1}/06`,
      created: Math.floor(Math.random() * 20) + 5,
      resolved: Math.floor(Math.random() * 18) + 3
    }))
  },
  surveys: {
    total: 287,
    completed: 214,
    pending: 73
  },
  entities: [
    { name: 'Sede Principal', value: 124 },
    { name: 'Sede Norte', value: 87 },
    { name: 'Sede Sur', value: 65 },
    { name: 'Oficina Este', value: 42 }
  ]
};

const Dashboard = () => {
  const [stats, setStats] = useState(demoStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  const { addNotification } = useContext(NotificationContext);


// Obtener userId y userRole del localStorage
const userId = localStorage.getItem("userId") || "";
const userRole = localStorage.getItem("rol") || "";

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
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

      // Simular llamadas API con datos demo
   setStats(demoStats);
        
        addNotification("Datos del dashboard cargados correctamente", "success");
        setLoading(false);
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message;
        setError(errorMsg);
        addNotification(`Error al cargar datos: ${errorMsg}`, "error");
        setLoading(false);
        
        
        setStats(demoStats);
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, addNotification, userId, userRole]);

// Colores para las gráficas
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

if (loading) return (
  <div className={styles.loadingContainer}>
    <div className={styles.spinner}></div>
    <p>Cargando estadísticas...</p>
  </div>
);

if (error) return (
  <div className={styles.errorContainer}>
    <p>Error al cargar los datos: {error}</p>
    <button onClick={() => window.location.reload()}>Reintentar</button>
  </div>
);

return (
  <div className={styles.dashboardContainer}>
    <div className={styles.dashboardHeader}>
      <h2>Tablero de Estadísticas</h2>
      <div className={styles.timeRangeSelector}>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className={styles.timeRangeSelect}
        >
          <option value="day">Hoy</option>
          <option value="week">Esta semana</option>
          <option value="month">Este mes</option>
          <option value="year">Este año</option>
        </select>
      </div>
    </div>

    {/* Resumen de estadísticas */}
    <div className={styles.statsSummary}>
      <div className={styles.statCard}>
        <h3>Usuarios</h3>
        <p className={styles.statValue}>{stats.users.total}</p>
        <div className={styles.statBreakdown}>
          <span>Activos: {stats.users.active}</span>
          <span>Inactivos: {stats.users.inactive}</span>
        </div>
      </div>

      <div className={styles.statCard}>
        <h3>Tickets</h3>
        <p className={styles.statValue}>{stats.tickets.total}</p>
        <div className={styles.statBreakdown}>
          <span>Abiertos: {stats.tickets.open}</span>
          <span>Resueltos: {stats.tickets.resolved}</span>
        </div>
      </div>

      <div className={styles.statCard}>
        <h3>Encuestas</h3>
        <p className={styles.statValue}>{stats.surveys.total}</p>
        <div className={styles.statBreakdown}>
          <span>Completadas: {stats.surveys.completed}</span>
          <span>Pendientes: {stats.surveys.pending}</span>
        </div>
      </div>
    </div>

    {/* Gráficas principales */}
    <div className={styles.chartsGrid}>
      {/* Gráfica de usuarios */}
      <div className={styles.chartCard}>
        <h3>Distribución de Usuarios</h3>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.users.distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {stats.users.distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} usuarios`, 'Cantidad']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfica de tickets por estado */}
      <div className={styles.chartCard}>
        <h3>Tickets por Estado</h3>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.tickets.byStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} tickets`, 'Cantidad']} />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" name="Tickets" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfica de tendencia de tickets */}
      <div className={styles.chartCard}>
        <h3>Tendencia de Tickets ({timeRange === 'month' ? 'Últimos 30 días' : 'Últimos 12 meses'})</h3>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.tickets.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} tickets`, 'Cantidad']} />
              <Legend />
              <Line type="monotone" dataKey="created" stroke="#8884d8" name="Creados" />
              <Line type="monotone" dataKey="resolved" stroke="#82ca9d" name="Resueltos" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfica de entidades con más tickets */}
      <div className={styles.chartCard}>
        <h3>Entidades con más Tickets</h3>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.entities}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} tickets`, 'Cantidad']} />
              <Legend />
              <Bar dataKey="value" fill="#82ca9d" name="Tickets" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </div>
);
};


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

        // 🔹 Peticiones separadas para en curso y cerrados
        const [estadoGeneralRes, estado_tickets] = await Promise.all([
          axios.get("http://localhost:5000/usuarios/estado_tickets", {
            headers: { Authorization: `Bearer ${token}` },
            params: { usuario_id: userId, rol: userRole },
          }),
          axios.get(`http://localhost:5000/usuarios/tickets/tecnico/${userId}`),
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
        setTicketsResueltos(
          personalSource.filter((t) => norm(t.estado) === 'resuelto')
        );
        // Casos a cerrar: excluir resuelto, cerrado y borrado
        setTicketsACerrar(
          personalSource.filter((t) => !['resuelto', 'cerrado', 'borrado'].includes(norm(t.estado)))
        );

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

            agrupados[estadoFrontend].push({
              id: ticket.id || ticket.id_ticket,
              solicitante: ticket.solicitante || ticket.nombre_completo,
              descripcion: ticket.descripcion,
              titulo: ticket.titulo,
              prioridad: ticket.prioridad,
              fecha_creacion: ticket.fecha_creacion,
              tecnico: tecnicoAsignado,
            });
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
    const views = ["personal", "global", "todo", "dashboard"];
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
                      <button
                        className={`${styles.viewButton} ${
                          activeView === "dashboard" ? styles.active : ""
                        }`}
                        onClick={() => setActiveView("dashboard")}
                      >
                        Tablero
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
                    <h2>ENCUESTA DE SATISFACCIÓN</h2>
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
                        {ticketsResueltos.map((ticket) => {
                          const id = getTicketId(ticket);
                          return (
                          <tr key={id ?? Math.random()} onClick={() => goEdit(id)} style={{ cursor: 'pointer' }}>
                            <td>{id}</td>
                            <td>{ticket.solicitante}</td>
                            <td>{ticket.categoria}</td>
                            <td>{ticket.descripcion}</td>
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

              {/* Vista Tablero */}
              {activeView === "dashboard" && <Dashboard />}
            </div>
          </main>
        </div>
        <ChatBot />
      </>
    </MenuVertical>
  );
};

export default HomeAdmiPage;