import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { FaFileExcel, FaFilePdf, FaFileCsv, FaChevronDown, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { FcEmptyFilter, FcPrint } from "react-icons/fc";
import axios from "axios";
import ChatBot from "../Componentes/ChatBot";
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
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toolbarSearchTerm, setToolbarSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [usuarios, setUsuarios] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);

    // Efecto para obtener usuarios y llenar los select
    useEffect(() => {
      const fetchUsuarios = async () => {
        try {
          const token = localStorage.getItem("token");
          const usuariosResponse = await axios.get(
            "http://localhost:5000/usuarios/obtener",
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setUsuarios(usuariosResponse.data);
        } catch (err) {
          console.error("Error al obtener usuarios:", err);
        }
      };
      fetchUsuarios();
    }, []);
  // 3. Estado de filtros
  const [filters, setFilters] = useState({
  id: "",
  titulo: "",
  solicitante: "",
  prioridad: "",
  estado: "",
  usuario: "",
  grupo: "",
  categoria: "",
  });

  // 4. Obtener tickets de la API
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
      console.error("Error fetching tickets:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);


  // 5. Aplicar filtros
  const applyFilters = useCallback(() => {
    const filteredData = tickets.filter((item) => {
      // Filtrado general
      let match = Object.keys(filters).every((key) => {
        if (!filters[key]) return true;
        // Filtro especial para técnico
        if (key === "usuario") {
          // El campo técnico puede ser id, nombre o id_usuario según cómo se guarde en el ticket
          return String(item.id_tecnico || item.tecnico || item.id_usuario || "") === filters.usuario;
        }
        return String(item[key] || "").toLowerCase().includes(filters[key].toLowerCase());
      });
      return match;
    });
    setFilteredTickets(filteredData);
    setCurrentPage(1);
  }, [filters, tickets]);

  // 6. Limpiar filtros
  const clearFilters = useCallback(() => {
    setFilters({
      id: "",
      titulo: "",
      solicitante: "",
      prioridad: "",
      estado: "",
      usuario: "",
      grupo: "",
      categoria: "",
    });
    setFilteredTickets(tickets);
    setCurrentPage(1);
  }, [tickets]);

  // 7. Buscar en la barra de herramientas
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
    )

    setFilteredTickets(filtered);
    setCurrentPage(1);
  }, [tickets]);

  // 8. Efectos secundarios
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlSearchTerm = searchParams.get("search");
    if (urlSearchTerm) {
      setToolbarSearchTerm(urlSearchTerm);
      handleToolbarSearch(urlSearchTerm);
    }
  }, [location.search, handleToolbarSearch]);

  // 9. Aplicar filtros cuando cambian
  useEffect(() => {
    applyFilters();
  }, [filters, applyFilters]);



  // 10. Render condicional temprano
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

  // 11. Paginación
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredTickets.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredTickets.length / rowsPerPage);

  // 12. Formateador de fechas
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

  // 13. Exportar datos
  const exportData = (type) => {
    console.log(`Exportando a ${type}`, filteredTickets);
    setIsExportDropdownOpen(false);
  };

  return (
    <MenuVertical>
      <div className={styles.containerticket}>
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
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                className={styles.exportButton}
                title="Opciones de exportación"
              >
                Exportar <FaChevronDown className={styles.dropdownIcon} />
              </button>
              {isExportDropdownOpen && (
                <div
                  className={styles.exportDropdownContent}
                  onMouseLeave={() => setIsExportDropdownOpen(false)}
                >
                  <button onClick={() => exportData('Excel')} className={styles.exportOption}>
                    <FaFileExcel /> Excel
                  </button>
                  <button onClick={() => exportData('PDF')} className={styles.exportOption}>
                    <FaFilePdf /> PDF
                  </button>
                  <button onClick={() => exportData('CSV')} className={styles.exportOption}>
                    <FaFileCsv /> CSV
                  </button>
                  <button onClick={() => window.print()} className={styles.exportOption}>
                    <FcPrint /> Imprimir
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div className={styles.filterPanel}>
            <div className={styles.filterGrid}>
              {/* Fila 1 */}
              <div className={styles.filterGroup}>
                <label>ID</label>
                <input
                  type="text"
                  name="id"
                  value={filters.id}
                  onChange={(e) => setFilters({ ...filters, id: e.target.value })}
                  placeholder="Filtrar por ID"
                />
              </div>
              <div className={styles.filterGroup}>
                <label>Título</label>
                <input
                  type="text"
                  name="titulo"
                  value={filters.titulo}
                  onChange={(e) => setFilters({ ...filters, titulo: e.target.value })}
                  placeholder="Filtrar por título"
                />
              </div>
              <div className={styles.filterGroup}>
                <label>Solicitante</label>
                <select
                  name="solicitante"
                  value={filters.solicitante}
                  onChange={(e) => setFilters({ ...filters, solicitante: e.target.value })}
                >
                  <option value="">Seleccione un usuario...</option>
                  {usuarios.map((usuario) => (
                    <option
                      key={usuario.id_usuario}
                      value={usuario.nombre_completo}
                    >
                      {`${usuario.nombre_completo}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fila 2 */}
              <div className={styles.filterGroup}>
                <label>Prioridad</label>
                <select
                  name="prioridad"
                  value={filters.prioridad}
                  onChange={(e) => setFilters({ ...filters, prioridad: e.target.value })}
                  className={styles.filterSelect}
                >
                  <option value="">Todas las prioridades</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Estado</label>
                <select
                  name="estado"
                  value={filters.estado}
                  onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                >
                  <option value="">Todos los estados</option>
                  <option value="Nuevo">Nuevo</option>
                  <option value="En curso">En curso</option>
                  <option value="En espera">En espera</option>
                  <option value="Resuelto">Resuelto</option>
                  <option value="Cerrado">Cerrado</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Asignado a*</label>
                <select
                  name="asignado_a"
                  value={filters.usuario}
                  onChange={(e) => setFilters({ ...filters, usuario: e.target.value })}
                  required
                >
                  <option value="">Seleccione un técnico...</option>
                  {usuarios
                    .filter((usuario) => usuario.rol === "tecnico")
                    .map((usuario) => (
                      <option
                        key={usuario.id_usuario}
                        value={usuario.nombre_completo}
                      >
                        {`${usuario.nombre_completo}`}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className={styles.filterActions}>
              <button onClick={applyFilters} className={styles.applyButton}>
                Aplicar Filtros
              </button>
              <button onClick={clearFilters} className={styles.clearButton}>
                Limpiar Filtros
              </button>
            </div>
          </div>
        )}

        {/* Tabla de tickets */}
        <div className={styles.tableContainer}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Cargando tickets...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <p>{error}</p>
              <button onClick={fetchTickets} className={styles.retryButton}>
                Reintentar
              </button>
            </div>
          ) : (
            <table className={styles.tableticket}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Título</th>
                  <th>Solicitante</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Técnico</th>
                  <th>Fecha Apertura</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.length > 0 ? (
                  currentRows.map((ticket, index) => (
                    <tr key={index} className={styles.clickableRow}>
                      <td>
                        <span
                          className={styles.clickableCell}
                          onClick={() => navigate(`/tickets/solucion/${ticket.id || ticket.id_ticket}`)}
                        >
                          {ticket.id || ticket.id_ticket || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={styles.clickableCell}
                          onClick={() => navigate(`/tickets/solucion/${ticket.id || ticket.id_ticket}`)}
                        >
                          {String(ticket.titulo || 'Sin título').toUpperCase()}
                        </span>
                      </td>
                      <td>{String(ticket.solicitante || 'Sin solicitante').toUpperCase()}</td>
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
                      <td>{formatDate(ticket.fecha_creacion || ticket.fechaApertura)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className={styles.noResults}>
                      No se encontraron tickets que coincidan con los filtros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Controles de paginación */}
        {!isLoading && !error && filteredTickets.length > 0 && (
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
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={styles.paginationButton}
              >
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
                    onClick={() => setCurrentPage(pageNumber)}
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
                  onClick={() => setCurrentPage(totalPages)}
                  className={`${styles.paginationButton} ${currentPage === totalPages ? styles.active : ""}`}
                >
                  {totalPages}
                </button>
              )}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={styles.paginationButton}
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
      <ChatBot />
    </MenuVertical>
  );
};

export default Tickets;