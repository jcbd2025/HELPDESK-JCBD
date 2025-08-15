import React, { useState, useEffect, useContext } from "react";
import { Link, Outlet } from "react-router-dom";
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
      { name: "Administradores", value: 8 },
      { name: "Agentes", value: 32 },
      { name: "Usuarios", value: 102 },
    ],
  },
  tickets: {
    total: 356,
    open: 142,
    resolved: 214,
    byStatus: [
      { name: "Abierto", value: 142 },
      { name: "En progreso", value: 87 },
      { name: "Resuelto", value: 214 },
      { name: "Cerrado", value: 198 },
    ],
    trend: Array.from({ length: 30 }, (_, i) => ({
      date: `${i + 1}/06`,
      created: Math.floor(Math.random() * 20) + 5,
      resolved: Math.floor(Math.random() * 18) + 3,
    })),
  },
  surveys: {
    total: 287,
    completed: 214,
    pending: 73,
  },
  entities: [
    { name: "Sede Principal", value: 124 },
    { name: "Sede Norte", value: 87 },
    { name: "Sede Sur", value: 65 },
    { name: "Oficina Este", value: 42 },
  ],
};

const Dashboard = () => {
  const [stats, setStats] = useState(demoStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("month");
  const { addNotification } = useContext(NotificationContext);

  // Obtener userId y userRole del localStorage
  const userId = localStorage.getItem("id_usuario");
  console.log("Valor de id_usuario:", userId);

  const userRole = localStorage.getItem("rol") || "";

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // Usar Promise.all para llamadas paralelas
        const [usuariosRes, deptosRes, catsRes, grupoRes, ticketsRes] =
          await Promise.all([
            axios.get("http://localhost:5000/usuarios/obtener"),
            axios.get("http://localhost:5000/usuarios/obtenerEntidades"),
            axios.get("http://localhost:5000/usuarios/obtenerCategorias"),
            axios.get("http://localhost:5000/usuarios/obtenerGrupos"),
            axios.get(
              `http://localhost:5000/usuarios/tickets/tecnico/${userId}`
            ),
          ]);

        setUsuarios(usuariosRes.data);
        setDepartamentos(deptosRes.data);
        setCategorias(catsRes.data);
        setGrupos(grupoRes.data);

        // Filtrar tickets por estado si es necesario
        const ticketsEnCurso = ticketsRes.data.filter(
          (ticket) => ticket.estado === "en_curso"
        );
        setTicketsEnCurso(ticketsEnCurso);

        if (location.state?.ticketData) {
          setFormData((prev) => ({
            ...prev,
            ...location.state.ticketData,
            fechaApertura: formatDateTimeForInput(
              location.state.ticketData.fechaApertura
            ),
          }));
        }
      } catch (error) {
        addNotification(
          error.response?.data?.message || "Error al cargar datos iniciales",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [location.state, userId]);

  // Colores para las gráficas
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
  ];

  if (loading)
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando estadísticas...</p>
      </div>
    );

  if (error)
    return (
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
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {stats.users.distribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} usuarios`, "Cantidad"]}
                />
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
                <Tooltip
                  formatter={(value) => [`${value} tickets`, "Cantidad"]}
                />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="Tickets" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica de tendencia de tickets */}
        <div className={styles.chartCard}>
          <h3>
            Tendencia de Tickets (
            {timeRange === "month" ? "Últimos 30 días" : "Últimos 12 meses"})
          </h3>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.tickets.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${value} tickets`, "Cantidad"]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="created"
                  stroke="#8884d8"
                  name="Creados"
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#82ca9d"
                  name="Resueltos"
                />
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
                <Tooltip
                  formatter={(value) => [`${value} tickets`, "Cantidad"]}
                />
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
  // Obtener datos del usuario
  const userRole = localStorage.getItem("rol") || "";
  const nombre = localStorage.getItem("nombre") || "";
  const { addNotification } = useContext(NotificationContext);
  const userId = localStorage.getItem("id_usuario") || "";
  console.log("Valor de id_usuario:", userId);

  // Estados
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeView, setActiveView] = useState("personal");
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

  const [ticketsEnCurso, setTicketsEnCurso] = useState([]);
  const [ticketsCerrados, setTicketsCerrados] = useState([]);

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

        // Guardar en estados independientes
        setTicketsEnCurso(
          estado_tickets.data.filter((ticket) => ticket.estado === "en_curso")
        );
        setTicketsCerrados(
          estado_tickets.data.filter((ticket) => ticket.estado === "Cerrado")
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
          pendientes: [],
        };

        estadoGeneralRes.data.forEach((ticket) => {
          const estado =
            ticket.estado?.toLowerCase() || ticket.estado_ticket?.toLowerCase();

          let estadoFrontend;
          switch (estado) {
            case "nuevo":
            case "new":
              estadoFrontend = "nuevo";
              break;
            case "en_curso":
            case "en_proceso":
            case "proceso":
              estadoFrontend = "enCurso";
              break;
            case "en_espera":
            case "espera":
            case "pendiente":
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
            case "pendiente":
              estadoFrontend = "pendientes";
              break;
            case "encuesta":
              estadoFrontend = "encuesta";
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
              tecnico: ticket.tecnico || ticket.asignadoA || "Sin asignar",
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
  // Datos
  const tickets = [
    {
      label: "Nuevo",
      color: "green",
      icon: "🟢",
      count: tableData.nuevo.length,
    },
    {
      label: "En curso",
      color: "lightgreen",
      icon: "⏳",
      count: ticketsEnCurso.length,
    },
    {
      label: "En espera",
      color: "orange",
      icon: "🟡",
      count: tableData.enEspera.length,
    },
    {
      label: "Resueltos",
      color: "gray",
      icon: "✔️",
      count: tableData.resueltos.length,
    },
    {
      label: "Cerrado",
      color: "black",
      icon: "✅",
      count: ticketsCerrados.length,
    },
    {
      label: "Borrado",
      color: "red",
      icon: "🗑",
      count: tableData.borrados.length,
    },
    {
      label: "Encuesta",
      color: "purple",
      icon: "📅",
      count: tableData.encuesta.length,
    },
    {
      label: "Abiertos",
      color: "#4CAF50",
      icon: "📝",
      count: tableData.abiertos.length,
    },
    {
      label: "Pendientes",
      color: "#FF5722",
      icon: "⚠️",
      count: tableData.pendientes.length,
    },
  ];
  

  const handleSelectChange = (event) => {
    const value = event.target.value;
    const views = ["personal", "global", "todo", "dashboard"];
    setActiveView(views[parseInt(value)]);
    addNotification(`Vista cambiada a: ${views[parseInt(value)]}`, "info");
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
                        <tr>
                          <td>ID: 2503160091</td>
                          <td>Santiago Caricena Corredor</td>
                          <td>General</td>
                          <td>
                            NO LE PERMITE REALIZA NINGUNA ACCIÓN - USUARIO
                            TEMPORAL (1 - 0)
                          </td>
                        </tr>
                        <tr>
                          <td>ID: 2503160090</td>
                          <td>Santiago Caricena Corredor</td>
                          <td>General</td>
                          <td>CONFIGURAR IMPRESORA (1 - 0)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className={styles.tablaContainer}>
                    <h2>SUS CASOS EN CURSO</h2>
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
                        {ticketsEnCurso.map((ticket1) => (
                          <tr key={ticket1.id}>
                            <td>{ticket1.id}</td>
                            <td>{ticket1.solicitante}</td>
                            <td>{ticket1.categoria}</td>
                            <td>{ticket1.descripcion}</td>
                          </tr>
                        ))}
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
                        {ticketsCerrados.map((ticket) => (
                          <tr key={ticket.id}>
                            <td>{ticket.id}</td>
                            <td>{ticket.solicitante}</td>
                            <td>{ticket.categoria}</td>
                            <td>{ticket.descripcion}</td>
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
                        <div
                          key={index}
                          className={styles.card}
                          style={{ borderColor: ticket.color }}
                        >
                          <span className="icon">{ticket.icon}</span>
                          <span className="label">{ticket.label}</span>
                          <span className="count">{ticket.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Vista Tablero */}
              {activeView === "dashboard" && <Dashboard />}
            </div>
          </main>
          {/* Mostrar la tabla correspondiente al tab activo */}
          {activeTab === "nuevo" && renderTable(tableData.nuevo, "Nuevo")}
          {activeTab === "enCurso" &&
            renderTable(tableData.enCurso, "En curso")}
          {activeTab === "enEspera" &&
            renderTable(tableData.enEspera, "En Espera")}
          {activeTab === "resueltos" &&
            renderTable(tableData.resueltos, "Resueltos")}
          {activeTab === "cerrados" &&
            renderTable(tableData.cerrados, "Cerrados")}
          {activeTab === "borrados" &&
            renderTable(tableData.borrados, "Borrados")}
          {activeTab === "encuesta" &&
            renderSurveyTable(tableData.encuesta, "Encuesta de Satisfacción")}
          {activeTab === "abiertos" &&
            renderTable(tableData.abiertos, "Abiertos")}
          {activeTab === "pendientes" &&
            renderTable(tableData.pendientes, "Pendientes")}
        </div>
        <ChatBot />
      </>
    </MenuVertical>
  );
};

export default HomeAdmiPage;
