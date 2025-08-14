import React, { useState, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import { FaPowerOff, FaChevronLeft, FaChevronRight, FaChevronDown, FaSearch, FaFilter, FaPlus, FaSpinner, FaFileExcel, FaFilePdf, FaFileCsv } from "react-icons/fa";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { FiAlignJustify } from "react-icons/fi";
import { FcHome, FcAssistant, FcBusinessman, FcAutomatic, FcAnswers, FcCustomerSupport, FcGenealogy, FcBullish, FcConferenceCall, FcPortraitMode, FcOrganization, FcPrint } from "react-icons/fc";
import axios from "axios";
import styles from "../styles/Grupos.module.css";
import Logo from "../imagenes/logo proyecto color.jpeg";
import Logoempresarial from "../imagenes/logo empresarial.png";
import ChatBot from "../Componentes/ChatBot";
import { NotificationContext } from "../context/NotificationContext";
import MenuVertical from "../Componentes/MenuVertical";

const Grupos = () => {
  // Estados para el menú y UI
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [error, setError] = useState(null);

  // Estados para gestión de grupos
  const [showForm, setShowForm] = useState(false);
  const [grupos, setGrupos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("nombre_grupo");
  const [additionalFilters, setAdditionalFilters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [filteredGrupos, setFilteredGrupos] = useState([]);

  // Obtener datos del usuario
  const nombre = localStorage.getItem("nombre");
  const userRole = localStorage.getItem("rol") || "";

  // Estado para el formulario
  const [formData, setFormData] = useState({
    nombre_grupo: '',
    descripcion: ''
  });

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // Efectos
  useEffect(() => {
    fetchGrupos();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchField, searchTerm, additionalFilters, grupos]);

  // Funciones de ayuda
  const applyFilters = () => {
    let result = [...grupos];

    if (searchField && searchTerm) {
      result = result.filter(grupo => {
        const value = grupo[searchField];
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    additionalFilters.forEach(filter => {
      if (filter.field && filter.value) {
        result = result.filter(grupo => {
          const value = grupo[filter.field];
          return value?.toString().toLowerCase().includes(filter.value.toLowerCase());
        });
      }
    });

    setFilteredGrupos(result);
    setCurrentPage(1);
  };

  // Funciones de API
  const fetchGrupos = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/grupos/obtener");
      setGrupos(response.data);
      setFilteredGrupos(response.data);
    } catch (error) {
      console.error("Error al cargar grupos:", error);
      setError("Error al cargar grupos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? `http://localhost:5000/grupos/actualizacion/${editingId}`
        : 'http://localhost:5000/grupos/creacion';

      const response = await axios[method.toLowerCase()](url, formData);

      if (response.data.success) {
        alert(editingId ? 'Grupo actualizado correctamente' : 'Grupo creado correctamente');
        resetForm();
        fetchGrupos();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el grupo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este grupo?")) return;

    try {
      const response = await axios.delete(`http://localhost:5000/grupos/eliminar/${id}`);
      if (response.data.success) {
        alert("Grupo eliminado correctamente");
        fetchGrupos();
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("Ocurrió un error al intentar eliminar el grupo.");
    }
  };

  // Funciones de formulario
  const validateField = (name, value) => {
    const errors = { ...formErrors };

    switch (name) {
      case 'nombre_grupo':
        if (!value.trim()) errors.nombre_grupo = 'Nombre del grupo es requerido';
        else if (value.length < 3) errors.nombre_grupo = 'Mínimo 3 caracteres';
        else delete errors.nombre_grupo;
        break;
      default:
        break;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateForm = () => {
    const requiredFields = ['nombre_grupo'];
    const isValid = requiredFields.every(field => {
      validateField(field, formData[field]);
      return formData[field]?.trim();
    });

    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    validateField(name, value);
  };

  const resetForm = () => {
    setFormData({
      nombre_grupo: '',
      descripcion: ''
    });
    setEditingId(null);
    setFormErrors({});
    setShowForm(false);
  };

  const handleEdit = (grupo) => {
    setFormData({
      nombre_grupo: grupo.nombre_grupo,
      descripcion: grupo.descripcion || ''
    });
    setEditingId(grupo.id_grupo);
    setShowForm(true);
  };

  // Funciones de filtrado
  const addFilterField = () => {
    setAdditionalFilters([...additionalFilters, { field: 'nombre_grupo', value: '' }]);
  };

  const handleFilterChange = (index, field, value) => {
    const updated = [...additionalFilters];
    updated[index] = { ...updated[index], [field]: value };
    setAdditionalFilters(updated);
  };

  const removeFilter = (index) => {
    const updated = [...additionalFilters];
    updated.splice(index, 1);
    setAdditionalFilters(updated);
  };

  const resetSearch = () => {
    setSearchTerm("");
    setAdditionalFilters([]);
    fetchGrupos();
  };

  // Funciones de exportación
  const exportToExcel = () => {
    console.log("Exportando a Excel", filteredGrupos);
    setIsExportDropdownOpen(false);
  };

  const exportToPdf = () => {
    console.log("Exportando a PDF", filteredGrupos);
    setIsExportDropdownOpen(false);
  };

  const exportToCsv = () => {
    console.log("Exportando a CSV", filteredGrupos);
    setIsExportDropdownOpen(false);
  };

  const printTable = () => {
    window.print();
    setIsExportDropdownOpen(false);
  };

  // Funciones de paginación
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredGrupos.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredGrupos.length / rowsPerPage);

  const paginate = (page) => setCurrentPage(page);
  const nextPage = () => currentPage < totalPages && setCurrentPage(p => p + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(p => p - 1);

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Handlers para el menú

  const toggleExportDropdown = () => setIsExportDropdownOpen(!isExportDropdownOpen);

  

  const roleToPath = {
    usuario: '/home',
    tecnico: '/HomeTecnicoPage',
    administrador: '/HomeAdmiPage'
  };

  // Renderizado condicional para acceso
  if (!['administrador', 'tecnico'].includes(userRole)) {
    return (
      <div className={styles.accessDenied}>
        <h2>Acceso restringido</h2>
        <p>No tienes permisos para acceder a esta sección.</p>
        <Link to="/" className={styles.returnLink}>Volver al inicio</Link>
      </div>
    );
  }

  return (
    
    <MenuVertical>
      <>
      {/* Contenido */}
      <div className={styles.container} style={{ marginLeft: isMenuExpanded ? "200px" : "60px" }}>
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <FaSpinner className={styles.spinner} />
          </div>
        )}

        <div className={styles.topControls}>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className={styles.addButton}
          >
            <FaPlus /> {showForm ? 'Ver Grupos' : 'Agregar Grupo'}
          </button>
        </div>

        {showForm ? (
          <div className={styles.containerUsuarios}>
            <h2 className={styles.titulo}>
              {editingId ? 'Editar Grupo' : 'Formulario de Creación de Grupo'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.gridContainerUsuarios}>
                <div className={styles.columna}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nombre del Grupo</label>
                    <input
                      type="text"
                      className={`${styles.input} ${formErrors.nombre_grupo ? styles.inputError : ''}`}
                      name="nombre_grupo"
                      value={formData.nombre_grupo}
                      onChange={handleChange}
                      required
                    />
                    {formErrors.nombre_grupo && <span className={styles.errorMessage}>{formErrors.nombre_grupo}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Descripción</label>
                    <textarea
                      className={styles.input}
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleChange}
                      rows="3"
                    />
                  </div>

                  <div className={styles.botonesContainer}>
                    <button type="submit" className={styles.boton} disabled={isLoading}>
                      {isLoading ? <FaSpinner className={styles.spinnerButton} /> : 'Guardar'}
                    </button>
                    <button type="button" onClick={resetForm} className={styles.botonCancelar}>
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className={styles.searchSection}>
              <h2 className={styles.sectionTitle}>Buscar Grupos</h2>
              <form className={styles.searchForm} onSubmit={(e) => e.preventDefault()}>
                <div className={styles.mainSearch}>
                  <div className={styles.searchFieldGroup}>
                    <select
                      className={styles.searchSelect}
                      value={searchField}
                      onChange={(e) => setSearchField(e.target.value)}
                    >
                      <option value="nombre_grupo">Nombre</option>
                      <option value="descripcion">Descripción</option>
                    </select>
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder={`Buscar por ${searchField}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <button type="submit" className={styles.searchButton} disabled={isLoading}>
                    {isLoading ? <FaSpinner className={styles.spinnerButton} /> : <><FaSearch /> Buscar</>}
                  </button>
                  <button type="button" onClick={resetSearch} className={styles.resetButton} disabled={isLoading}>
                    Grupos
                  </button>
                  <button type="button" onClick={addFilterField} className={styles.addFilterButton}>
                    <FaFilter /> Agregar Filtro
                  </button>
                </div>

                {additionalFilters.map((filter, index) => (
                  <div key={index} className={styles.additionalFilter}>
                    <select
                      className={styles.searchSelect}
                      value={filter.field}
                      onChange={(e) => handleFilterChange(index, 'field', e.target.value)}
                    >
                      <option value="nombre_grupo">Nombre</option>
                      <option value="descripcion">Descripción</option>
                    </select>
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder={`Filtrar por ${filter.field}...`}
                      value={filter.value}
                      onChange={(e) => handleFilterChange(index, 'value', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeFilter(index)}
                      className={styles.removeFilterButton}
                    >
                      ×
                    </button>
                  </div>
                ))}

                <div className={styles.exportDropdown}>
                  <button
                    onClick={toggleExportDropdown}
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
                      <button onClick={exportToExcel} className={styles.exportOption}>
                        <FaFileExcel /> Excel
                      </button>
                      <button onClick={exportToPdf} className={styles.exportOption}>
                        <FaFilePdf /> PDF
                      </button>
                      <button onClick={exportToCsv} className={styles.exportOption}>
                        <FaFileCsv /> CSV
                      </button>
                      <button onClick={printTable} className={styles.exportOption}>
                        <FcPrint /> Imprimir
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className={styles.usersTableContainer}>
              <h2 className={styles.sectionTitle}>Grupos Registrados ({filteredGrupos.length})</h2>
              <div className={styles.tableWrapper}>
                <table className={styles.usersTable}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="3" className={styles.loadingCell}>
                          <FaSpinner className={styles.spinner} /> Cargando grupos...
                        </td>
                      </tr>
                    ) : currentRows.length > 0 ? (
                      currentRows.map((grupo) => (
                        <tr key={grupo.id_grupo}>
                          <td>{grupo.nombre_grupo}</td>
                          <td>{grupo.descripcion || '-'}</td>
                          <td>
                            <button
                              className={styles.actionButton}
                              onClick={() => handleEdit(grupo)}
                            >
                              Editar
                            </button>
                            <button
                              className={`${styles.actionButton} ${styles.deleteButton}`}
                              onClick={() => handleDelete(grupo.id_grupo)}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className={styles.noUsers}>No se encontraron grupos</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.paginationControls}>
              <div className={styles.rowsPerPageSelector}>
                <span>Filas por página:</span>
                <select
                  value={rowsPerPage}
                  onChange={handleRowsPerPageChange}
                  className={styles.rowsSelect}
                  disabled={isLoading}
                >
                  {[15, 30, 50, 100].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
                <span className={styles.rowsInfo}>
                  Mostrando {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, filteredGrupos.length)} de {filteredGrupos.length} registros
                </span>
              </div>

              <div className={styles.pagination}>
                <button
                  className={`${styles.paginationButton} ${currentPage === 1 || isLoading ? styles.disabled : ''}`}
                  onClick={prevPage}
                  disabled={currentPage === 1 || isLoading}
                >
                  <FaChevronLeft />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <button
                      key={pageNumber}
                      className={`${styles.paginationButton} ${currentPage === pageNumber ? styles.active : ''}`}
                      onClick={() => paginate(pageNumber)}
                      disabled={isLoading}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className={styles.paginationEllipsis}>...</span>
                    <button
                      className={`${styles.paginationButton} ${currentPage === totalPages ? styles.active : ''}`}
                      onClick={() => paginate(totalPages)}
                      disabled={isLoading}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  className={`${styles.paginationButton} ${currentPage === totalPages || isLoading ? styles.disabled : ''}`}
                  onClick={nextPage}
                  disabled={currentPage === totalPages || isLoading}
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
        </div>
        <ChatBot />
      </>
    </MenuVertical>
  );
};

export default Grupos;
