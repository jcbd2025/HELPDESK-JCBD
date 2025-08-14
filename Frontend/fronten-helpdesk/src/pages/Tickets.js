import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { FaPowerOff, FaFileExcel, FaFilePdf, FaFileCsv, FaChevronDown, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { FiAlignJustify } from "react-icons/fi";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { FcEmptyFilter, FcHome, FcAssistant, FcBusinessman, FcAutomatic, FcAnswers, FcCustomerSupport, FcBullish, FcPortraitMode, FcConferenceCall, FcOrganization, FcGenealogy, FcPrint } from "react-icons/fc";
import axios from "axios";
import Logo from "../imagenes/logo proyecto color.jpeg";
import Logoempresarial from "../imagenes/logo empresarial.png";
import ChatBot from "../Componentes/ChatBot";
import { NotificationContext } from "../context/NotificationContext";
import styles from "../styles/Tickets.module.css";
import MenuVertical from "../Componentes/MenuVertical";

const Tickets = () => {
  // 1. Datos del usuario y configuración inicial
  const userRole = localStorage.getItem("rol") || "usuario";
  const nombre = localStorage.getItem("nombre") || "";
  const isAdminOrTech = ["administrador", "tecnico", "usuario"].includes(userRole);
  const navigate = useNavigate();
  const location = useLocation();

  // 2. Estados principales
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toolbarSearchTerm, setToolbarSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [usuarios, setUsuarios] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [categorias, setCategorias] = useState([]);

  // 3. Datos y filtros
  const initialData = useMemo(() => Array.from({ length: 100 }, (_, i) => ({
    id: `2503290${(1000 - i).toString().padStart(3, "0")}`,
    id_ticket: `2503290${(1000 - i).toString().padStart(3, "0")}`,
    titulo: `CREACION DE USUARIOS - PARALELO ACADEMICO ${i + 1}`,
    solicitante: "Jenyfer Quintero Calixto",
    descripcion: "ALIMENTAR EL EXCEL DE DELOGIN",
    prioridad: ["Mediana", "Alta", "Baja"][i % 3],
    estado: ["Nuevo", "En Espera", "Cerrado", "Resuelto", "En Curso"][i % 5],
    tecnico: "Jenyfer Quintero Calixto",
    grupo: "EDQ B",
    categoria: "CREACION DE USUARIO",
    ultimaActualizacion: "2025-03-29 03:40",
    fecha_creacion: "2025-03-29 03:19",
    fechaApertura: "2025-03-29 03:19",
  })), []);

  const [tickets, setTickets] = useState(initialData);
  const [filteredTickets, setFilteredTickets] = useState(initialData);
  const [filters, setFilters] = useState({
    id: "",
    titulo: "",
    solicitante: "",
    prioridad: "",
    estado: "",
    tecnico: "",
    grupo: "",
    categoria: "",
  });
  const [formData, setFormData] = useState({
    id: "",
    tipo: "incidencia",
    origen: "",
    prioridad: "mediana",
    categoria: "",
    titulo: "",
    descripcion: "",
    archivos: [],
    solicitante: nombre || "",
    elementos: "",
    entidad: "",
    estado: "nuevo",
    ubicacion: "",
    observador: "",
    asignado_a: "",
    grupo_asignado: "",
    fechaApertura: new Date().toISOString().slice(0, 16)
  });

  // Manejo de cambios en el formulario
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "archivos" && files) {
      setFormData(prev => ({
        ...prev,
        archivos: Array.from(files)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const removeFile = (index) => {
    setFormData(prev => {
      const newFiles = [...prev.archivos];
      newFiles.splice(index, 1);
      return { ...prev, archivos: newFiles };
    });
  };

  // 4. Funciones principales
  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/usuarios/tickets", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const normalizedTickets = response.data.map(ticket => ({
        id: ticket.id_ticket || ticket.id || '',
        id_ticket: ticket.id_ticket || ticket.id || '',
        titulo: ticket.titulo || '',
        solicitante: ticket.solicitante || '',
        descripcion: ticket.descripcion || '',
        prioridad: ticket.prioridad || '',
        estado: ticket.estado || ticket.estado_ticket || '',
        tecnico: ticket.tecnico || ticket.nombre_tecnico || '',
        grupo: ticket.grupo || '',
        categoria: ticket.categoria || ticket.nombre_categoria || '',
        fecha_creacion: ticket.fecha_creacion || ticket.fechaApertura || '',
        ultimaActualizacion: ticket.ultimaActualizacion || ''
      }));

      setTickets(normalizedTickets);
      setFilteredTickets(normalizedTickets);
    } catch (err) {
      setError("Error al cargar tickets");
      setTickets(initialData);
      setFilteredTickets(initialData);
    } finally {
      setIsLoading(false);
    }
  }, [initialData]);

  const handleSearch = useCallback((searchValue) => {
    const term = searchValue.toLowerCase().trim();
    setSearchTerm(term);
    if (term) {
      navigate(`/busqueda-global?query=${encodeURIComponent(term)}`);
    }
  }, [navigate]);

  const handleToolbarSearch = useCallback((searchValue) => {
    const term = searchValue.toLowerCase().trim();
    setToolbarSearchTerm(term);

    if (!term) {
      setFilteredTickets(tickets);
      return;
    }

    const filtered = tickets.filter((item) =>
      Object.values(item).some((val) =>
        val !== null && val !== undefined && String(val).toLowerCase().includes(term)
      )
    );

    setFilteredTickets(filtered);
    setCurrentPage(1);
  }, [tickets]);

  const applyFilters = useCallback(() => {
    const filteredData = tickets.filter((item) =>
      Object.keys(filters).every((key) =>
        !filters[key] || String(item[key] || "").toLowerCase().includes(filters[key].toLowerCase())
      )
    );
    setFilteredTickets(filteredData);
    setCurrentPage(1);
  }, [filters, tickets]);

  const clearFilters = useCallback(() => {
    setFilters({
      id: "",
      titulo: "",
      solicitante: "",
      prioridad: "",
      estado: "",
      tecnico: "",
      grupo: "",
      categoria: "",
    });
    setFilteredTickets(tickets);
    setCurrentPage(1);
  }, [tickets]);

  // 5. Efectos secundarios
  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlSearchTerm = searchParams.get("search");
    if (urlSearchTerm) {
      setToolbarSearchTerm(urlSearchTerm);
      handleToolbarSearch(urlSearchTerm);
    }
  }, [location.search, handleToolbarSearch]);

  // 6. Funciones de UI
  const toggleChat = () => setIsChatOpen(!isChatOpen);
  const toggleMenu = () => setIsMenuExpanded(!isMenuExpanded);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleExportDropdown = () => setIsExportDropdownOpen(!isExportDropdownOpen);

  const toggleSupport = (e) => {
    e?.stopPropagation();
    setIsSupportOpen(!isSupportOpen);
    setIsAdminOpen(false);
    setIsConfigOpen(false);
  };

  const toggleAdmin = (e) => {
    e?.stopPropagation();
    setIsAdminOpen(!isAdminOpen);
    setIsSupportOpen(false);
    setIsConfigOpen(false);
  };

  const toggleConfig = (e) => {
    e?.stopPropagation();
    setIsConfigOpen(!isConfigOpen);
    setIsSupportOpen(false);
    setIsAdminOpen(false);
  };

  // 7. Funciones de paginación
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = useMemo(() =>
    filteredTickets.slice(indexOfFirstRow, indexOfLastRow),
    [filteredTickets, indexOfFirstRow, indexOfLastRow]
  );

  const totalPages = Math.ceil(filteredTickets.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  // 8. Funciones de exportación
  const exportToExcel = () => {
    console.log("Exportando a Excel", filteredTickets);
    setIsExportDropdownOpen(false);
  };

  const exportToPdf = () => {
    console.log("Exportando a PDF", filteredTickets);
    setIsExportDropdownOpen(false);
  };

  const exportToCsv = () => {
    console.log("Exportando a CSV", filteredTickets);
    setIsExportDropdownOpen(false);
  };

  const printTable = () => {
    window.print();
    setIsExportDropdownOpen(false);
  };

  // 9. Render condicional temprano
  if (!isAdminOrTech) {
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


  // 11. Formateador de fechas
  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    try {
      return new Date(`${dateString} -05:00`)
        .toLocaleString("es-CO", {
          timeZone: "America/Bogota",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        .toUpperCase();
    } catch {
      return dateString.toUpperCase();
    }
  };

  // 12. Render principal
  return (
    <MenuVertical>
      <>

        {/* Contenido principal - Tabla de tickets */}
        <div className={styles.containerticket} style={{ marginLeft: isMenuExpanded ? "200px" : "60px" }}>
          {/* Barra de herramientas */}
          <div className={styles.toolbar}>
            <div className={styles.searchContainer}>
              <input
                className={styles.search}
                type="text"
                placeholder="Buscar en tickets..."
                value={toolbarSearchTerm}
                onChange={(e) => setToolbarSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleToolbarSearch(toolbarSearchTerm)}
              />
              <button
                type="button"
                className={styles.buttonBuscar}
                title="Buscar"
                onClick={() => handleToolbarSearch(toolbarSearchTerm)}
              >
                <FaMagnifyingGlass className={styles.searchIcon} />
              </button>
            </div>

            <div className={styles.actions}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={styles.Buttonfiltros}
                title="Alternar filtros"
              >
                <FcEmptyFilter />
                <span className={styles.mostrasfiltros}>
                  {showFilters ? "Ocultar" : "Mostrar"} filtros
                </span>
              </button>

              {/* Dropdown de exportación */}
              <div className={styles.exportDropdown}>
                <button
                  onClick={toggleExportDropdown}
                  className={styles.exportButton}
                  title="Opciones de exportación"
                >
                  Exportar <FaChevronDown className={styles.dropdownIcon} />
                </button>
                {isExportDropdownOpen && (
                  <div className={styles.exportDropdownContent} onMouseLeave={() => setIsExportDropdownOpen(false)}>
                    <button onClick={exportToExcel} className={styles.exportOption}><FaFileExcel /> Excel</button>
                    <button onClick={exportToPdf} className={styles.exportOption}><FaFilePdf /> PDF</button>
                    <button onClick={exportToCsv} className={styles.exportOption}><FaFileCsv /> CSV</button>
                    <button onClick={printTable} className={styles.exportOption}><FcPrint /> Imprimir</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel de filtros */}
          {showFilters && (
            <div className={styles.filterPanel}>
              <div className={styles.filterRow}>
                <div className={styles.filterGroup}>
                  <label>ID</label>
                  <input type="text" name="id" value={filters.id} onChange={(e) => setFilters({ ...filters, id: e.target.value })} />
                </div>
                <div className={styles.filterGroup}>
                  <label>Título</label>
                  <input type="text" name="titulo" value={filters.titulo} onChange={(e) => setFilters({ ...filters, titulo: e.target.value })} />
                </div>
                <div className={styles.filterGroup}>
                  <label>Solicitante:</label>
                  <select
                    name="solicitante"
                    value={formData.solicitante}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccione un usuario...</option>
                    {usuarios.map(usuario => (
                      <option key={usuario.id_usuario} value={usuario.id_usuario}>
                        {`${usuario.nombre_completo}`} ({usuario.correo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.filterRow}>
                <div className={styles.filterGroup}>
                  <label>Prioridad:</label>
                  <select name="prioridad" value={filters.prioridad} onChange={(e) => setFilters({ ...filters, prioridad: e.target.value })}>
                    <option value="">Seleccione...</option>
                    <option value="alta">Alta</option>
                    <option value="mediana">Mediana</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
                <div className={styles.filterGroup}>
                  <label>Estado:</label>
                  <select name="estado" value={filters.estado} onChange={(e) => setFilters({ ...filters, estado: e.target.value })}>
                    <option value="">Seleccione...</option>
                    <option value="nuevo">Nuevo</option>
                    <option value="en_curso">En curso</option>
                    <option value="en_espera">En espera</option>
                    <option value="resuelto">Resuelto</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                </div>
                <div className={styles.filterGroup}>
                  <label>Asignado a:</label>
                  <select
                    name="asignado_a"
                    value={formData.asignado_a}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccione un usuario...</option>
                    {usuarios.map(usuario => (
                      <option key={usuario.id_usuario} value={usuario.id_usuario}>
                        {`${usuario.nombre_completo}`} ({usuario.correo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.filterGroup}>
                <label>Grupo asignado:</label>
                <select
                  name="grupo_asignado"
                  value={formData.grupo_asignado}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione un grupo...</option>
                  {grupos.map(grupo => (
                    <option key={grupo.id_grupo} value={grupo.id_grupo}>
                      {grupo.nombre_grupo}
                    </option>
                  ))}
                </select>
                <div className={styles.filterGroup}>
                  <label>Categoría:</label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccione...</option>
                    {categorias?.map(categoria => (
                      <option key={categoria.id_categoria} value={categoria.id_categoria}>
                        {categoria.nombre_categoria}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.filterActions}>
                  <button onClick={applyFilters} className={styles.applyButton}>Aplicar Filtros</button>
                  <button onClick={clearFilters} className={styles.clearButton}>Limpiar Filtros</button>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de tickets */}
          <div className={styles.tableContainer}>
            <table className={styles.tableticket}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Título</th>
                  <th>Solicitante</th>
                  <th>Descripción</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Técnico</th>
                  <th>Grupo</th>
                  <th>Categoría</th>
                  <th>Fecha Apertura</th>
                  <th>Última Actualización</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.length > 0 ? (
                  currentRows.map((ticket, index) => (
                    <tr key={index}>
                      <td>
                        <span className={styles.clickableCell} onClick={() => navigate(`/tickets/solucion/${ticket.id || ticket.id_ticket}`)}>
                          {ticket.id || ticket.id_ticket || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className={styles.clickableCell} onClick={() => navigate(`/tickets/solucion/${ticket.id || ticket.id_ticket}`)}>
                          {String(ticket.titulo || 'Sin título').toUpperCase()}
                        </span>
                      </td>
                      <td>{String(ticket.solicitante || 'Sin solicitante').toUpperCase()}</td>
                      <td>{String(ticket.descripcion || 'Sin descripción').toUpperCase()}</td>
                      <td>
                        <span className={`${styles.priority} ${styles[String(ticket.prioridad || '').toLowerCase()] || ''}`}>
                          {String(ticket.prioridad || 'Sin prioridad').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.status} ${styles[String(ticket.estado || '').toLowerCase()] || ''}`}>
                          {String(ticket.estado || 'Sin estado').toUpperCase()}
                        </span>
                      </td>
                      <td>{String(ticket.tecnico || 'No asignado').toUpperCase()}</td>
                      <td>{String(ticket.grupo || 'Sin grupo').toUpperCase()}</td>
                      <td>{String(ticket.categoria || 'Sin categoría').toUpperCase()}</td>
                      <td>{formatDate(ticket.fecha_creacion || ticket.fechaApertura)}</td>
                      <td>{formatDate(ticket.ultimaActualizacion)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className={styles.noResults}>
                      No se encontraron tickets que coincidan con los criterios de búsqueda
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Controles de paginación */}
          <div className={styles.paginationControls}>
            <div className={styles.rowsPerPageSelector}>
              <span>Filas por página:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={styles.rowsSelect}
              >
                {[15, 30, 50, 100].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <span className={styles.rowsInfo}>
                Mostrando {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, filteredTickets.length)} de {filteredTickets.length} tickets
              </span>
            </div>

            <div className={styles.pagination}>
              <button onClick={prevPage} disabled={currentPage === 1} className={styles.paginationButton}>
                <FaChevronLeft />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => paginate(pageNumber)}
                    className={`${styles.paginationButton} ${currentPage === pageNumber ? styles.active : ""}`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              {totalPages > 5 && currentPage < totalPages - 2 && (
                <span className={styles.paginationEllipsis}>...</span>
              )}

              {totalPages > 5 && currentPage < totalPages - 2 && (
                <button
                  onClick={() => paginate(totalPages)}
                  className={`${styles.paginationButton} ${currentPage === totalPages ? styles.active : ""}`}
                >
                  {totalPages}
                </button>
              )}

              <button onClick={nextPage} disabled={currentPage === totalPages} className={styles.paginationButton}>
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>
        <ChatBot />

      </>
    </MenuVertical>
  );
};

export default Tickets;