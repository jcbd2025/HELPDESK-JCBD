import React, { useState, useEffect, useContext } from "react";
import { Link, Outlet } from "react-router-dom";
import { FaMagnifyingGlass, FaPowerOff } from "react-icons/fa6";
import { FiAlignJustify } from "react-icons/fi";
import {
  FcHome, FcAssistant, FcBusinessman, FcAutomatic,
  FcAnswers, FcCustomerSupport, FcExpired, FcGenealogy,
  FcBullish, FcConferenceCall, FcPortraitMode, FcOrganization
} from "react-icons/fc";
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import Logo from "../imagenes/logo proyecto color.jpeg";
import Logoempresarial from "../imagenes/logo empresarial.png";
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
      await new Promise(resolve => setTimeout(resolve, 500));

      addNotification("Datos del dashboard cargados correctamente", "success");
      setLoading(false);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      addNotification(`Error al cargar datos: ${errorMsg}`, "error");
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
  // Obtener datos del usuario
  const userRole = localStorage.getItem("rol") || "";
  const nombre = localStorage.getItem("nombre") || "";
  const { addNotification } = useContext(NotificationContext);

  // Estados
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeView, setActiveView] = useState("personal");
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Función para manejar la búsqueda
  const handleSearch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      addNotification(`Buscando: ${searchTerm}`, "info");

      // Simular búsqueda
      await new Promise(resolve => setTimeout(resolve, 1000));

      addNotification(`Resultados para: ${searchTerm}`, "success");
      setIsLoading(false);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      addNotification(`Error en búsqueda: ${errorMsg}`, "error");
      setIsLoading(false);
    }
  };

  // Buscar al presionar Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      handleSearch();
    }
  };

  // Datos
  const tickets = [
    { label: "Nuevo", color: "green", icon: "🟢", count: 0 },
    { label: "En espera", color: "orange", icon: "🟡", count: 0 },
    { label: "Borrado", color: "red", icon: "🗑", count: 0 },
    { icon: "📝", label: "Abiertos", count: 5, color: "#4CAF50" },
    { icon: "⏳", label: "En curso", count: 3, color: "lightgreen" },
    { icon: "✅", label: "Cerrados", count: 12, color: "#2196F3" },
    { icon: "⚠️", label: "Pendientes", count: 2, color: "#FF5722" },
    { icon: "✔️", label: "Resueltos", count: 4, color: "#607D8B" },
  ];

  // Handlers
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    addNotification(isChatOpen ? "Chat cerrado" : "Chat abierto", "info");
  };

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
    const views = ["personal", "global", "todo", "dashboard"];
    setActiveView(views[parseInt(value)]);
    addNotification(`Vista cambiada a: ${views[parseInt(value)]}`, "info");
  };

  const toggleMenu = () => setIsMenuExpanded(!isMenuExpanded);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleMenuClick = (menuName) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  const handleMouseLeave = () => {
    setOpenMenu(null);
  };

  const handleLinkClick = () => {
    setOpenMenu(null); // Cierra cualquier submenú después de seleccionar una opción
    setIsMobileMenuOpen(false); // Cierra menú móvil si está abierto
  };



  return (
    <div className={styles.containerPrincipal}>
      {/* Menú Vertical */}
      <aside
        className={`${styles.menuVertical} ${isMenuExpanded ? styles.expanded : ""}`}
        onMouseEnter={toggleMenu}
        onMouseLeave={toggleMenu}
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
            className={`${styles.menuVerticalDesplegable} ${isMobileMenuOpen ? styles.mobileMenuOpen : ""
              }`}
          >
            <ul className={styles.menuIconos}>
              {/* Inicio */}
              <li className={styles.iconosMenu}>
                <Link
                  to="/homeAdmiPage"
                  className={styles.linkSinSubrayado}
                  onClick={handleLinkClick}
                >
                  <FcHome className={styles.menuIcon} />
                  <span className={styles.menuText}>Inicio</span>
                </Link>
              </li>

              {/* Soporte */}
              <li className={styles.iconosMenu} onMouseLeave={handleMouseLeave}>
                <div
                  className={styles.linkSinSubrayado}
                  onClick={() => handleMenuClick("support")}
                >
                  <FcAssistant className={styles.menuIcon} />
                  <span className={styles.menuText}> Soporte</span>
                </div>
                <ul
                  className={`${styles.submenu} ${openMenu === "support" ? styles.showSubmenu : ""
                    }`}
                >
                  <li>
                    <Link to="/Tickets" className={styles.submenuLink} onClick={handleLinkClick}>
                      <FcAnswers className={styles.menuIcon} />
                      <span className={styles.menuText}>Tickets</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/CrearCasoAdmin" className={styles.submenuLink} onClick={handleLinkClick}>
                      <FcCustomerSupport className={styles.menuIcon} />
                      <span className={styles.menuText}>Crear Caso</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/Estadisticas" className={styles.submenuLink} onClick={handleLinkClick}>
                      <FcBullish className={styles.menuIcon} />
                      <span className={styles.menuText}>Estadísticas</span>
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Administración */}
              <li className={styles.iconosMenu} onMouseLeave={handleMouseLeave}>
                <div
                  className={styles.linkSinSubrayado}
                  onClick={() => handleMenuClick("admin")}
                >
                  <FcBusinessman className={styles.menuIcon} />
                  <span className={styles.menuText}> Administración</span>
                </div>
                <ul
                  className={`${styles.submenu} ${openMenu === "admin" ? styles.showSubmenu : ""
                    }`}
                >
                  <li>
                    <Link to="/Usuarios" className={styles.submenuLink} onClick={handleLinkClick}>
                      <FcPortraitMode className={styles.menuIcon} />
                      <span className={styles.menuText}> Usuarios</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/Grupos" className={styles.submenuLink} onClick={handleLinkClick}>
                      <FcConferenceCall className={styles.menuIcon} />
                      <span className={styles.menuText}> Grupos</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/Entidades" className={styles.submenuLink} onClick={handleLinkClick}>
                      <FcOrganization className={styles.menuIcon} />
                      <span className={styles.menuText}> Entidades</span>
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Configuración */}
              <li className={styles.iconosMenu} onMouseLeave={handleMouseLeave}>
                <div
                  className={styles.linkSinSubrayado}
                  onClick={() => handleMenuClick("config")}
                >
                  <FcAutomatic className={styles.menuIcon} />
                  <span className={styles.menuText}> Configuración</span>
                </div>
                <ul
                  className={`${styles.submenu} ${openMenu === "config" ? styles.showSubmenu : ""
                    }`}
                >
                  <li>
                    <Link to="/Categorias" className={styles.submenuLink} onClick={handleLinkClick}>
                      <FcGenealogy className={styles.menuIcon} />
                      <span className={styles.menuText}>Categorias</span>
                    </Link>
                  </li>
                </ul>
              </li>
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
        <Outlet />
      </div>

      {/* Header */}
      <header className={styles.containerInicio} style={{ marginLeft: isMenuExpanded ? "200px" : "60px" }}>
        <div className={styles.containerInicioImg}>
          <Link to="/homeAdmiPage" className={styles.linkSinSubrayado}>
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
            <span className={styles.username}>Bienvenido, <span id="nombreusuario">{nombre}</span></span>
            <div className={styles.iconContainer}>
              <Link to="/">
                <FaPowerOff className={styles.icon} />
              </Link>
            </div>
          </div>
        </div>
      </header>


      {/* Contenido Principal */}
      <div className={styles.containerHomeAdmiPage} style={{ marginLeft: isMenuExpanded ? "200px" : "60px" }}>
        <main>
          <div className={styles.flexColumna}>
            <div className={styles.row}>
              <div className={styles.col}>
                <div className={styles.flexColumnHorizontal}>
                  <div className={styles.viewButtonsContainer}>
                   
                    <button
                      className={`${styles.viewButton} ${activeView === "dashboard" ? styles.active : ""}`}
                      onClick={() => setActiveView("dashboard")}
                    >
                      Tablero
                    </button>
                  </div>
                  <select className={`${styles.viewSelect} form-select`} onChange={handleSelectChange}>
                  
                    <option value={3}>Tablero</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="app-container">
            

            {/* Vista Tablero */}
            {activeView === "dashboard" && <Dashboard />}
          </div>
        </main>
      </div>

   <ChatBot />
    </div>
  );
};

export default HomeAdmiPage;