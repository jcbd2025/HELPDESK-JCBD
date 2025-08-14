import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { FaPowerOff, FaChevronLeft, FaChevronRight, FaChevronDown, FaSearch, FaFilter, FaPlus, FaSpinner, FaFileExcel, FaFilePdf, FaFileCsv } from "react-icons/fa";
import { FcHome, FcAssistant, FcBusinessman, FcAutomatic, FcAnswers, FcCustomerSupport, FcGenealogy, FcBullish, FcConferenceCall, FcPortraitMode, FcOrganization, FcPrint } from "react-icons/fc";
import axios from "axios";
import styles from "../styles/Categorias.module.css";
import ChatBot from "../Componentes/ChatBot";
import { useNotification } from "../context/NotificationContext";
import MenuVertical from "../Componentes/MenuVertical";

const Categorias = () => {
  // Estados para UI
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [entidades, setEntidades] = useState([]);
  const [menuState, setMenuState] = useState({
    support: false,
    admin: false,
    config: false
  });

  // Estados para datos
  const [showForm, setShowForm] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [filteredCategorias, setFilteredCategorias] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("nombre_categoria");
  const [additionalFilters, setAdditionalFilters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formErrors, setFormErrors] = useState({});


  // Estados para modales
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // Datos del usuario
  const nombre = localStorage.getItem("nombre");
  const userRole = localStorage.getItem("rol") || "";
  const { addNotification } = useNotification();

  // Datos del formulario
  const [formData, setFormData] = useState({
    nombre_categoria: '',
    id_entidad: '',
    descripcion: ''
  });

  // Efectos
  useEffect(() => {
    fetchCategorias();
    fetchEntidades();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchField, searchTerm, additionalFilters, categorias]);

  // Funciones de ayuda
  const applyFilters = () => {
    let result = [...categorias];

    if (searchField && searchTerm) {
      result = result.filter(categoria => {
        const value = categoria[searchField];
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    additionalFilters.forEach(filter => {
      if (filter.field && filter.value) {
        result = result.filter(categoria => {
          const value = categoria[filter.field];
          return value?.toString().toLowerCase().includes(filter.value.toLowerCase());
        });
      }
    });

    setFilteredCategorias(result);
    setCurrentPage(1);
  };

  const fetchEntidades = async () => {
    try {
      const response = await axios.get("http://localhost:5000/usuarios/obtenerEntidades");
      setEntidades(response.data);
    } catch (error) {
      console.error("Error al cargar entidades:", error);
      setModalMessage("Error al cargar las entidades disponibles");
      setShowErrorModal(true);
    }
  };

  const toggleMenu = (menu) => {
    setMenuState(prev => {
      const newState = { support: false, admin: false, config: false };
      if (menu) newState[menu] = !prev[menu];
      return newState;
    });
  };

  const toggleExportDropdown = () => setIsExportDropdownOpen(!isExportDropdownOpen);

  // Funciones de exportación
  const exportToExcel = () => {
    console.log("Exportando a Excel", filteredCategorias);
    setIsExportDropdownOpen(false);
  };

  const exportToPdf = () => {
    console.log("Exportando a PDF", filteredCategorias);
    setIsExportDropdownOpen(false);
  };

  const exportToCsv = () => {
    console.log("Exportando a CSV", filteredCategorias);
    setIsExportDropdownOpen(false);
  };

  const printTable = () => {
    window.print();
    setIsExportDropdownOpen(false);
  };

  // Funciones de API
  const fetchCategorias = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/categorias/obtener");
      setCategorias(response.data);
      setFilteredCategorias(response.data);
    } catch (error) {
      console.error("Error al cargar categorias:", error);
      setModalMessage("Error al cargar las categorías");
      setShowErrorModal(true);
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
        ? `http://localhost:5000/categorias/actualizacion/${editingId}`
        : 'http://localhost:5000/categorias/creacion';

      const response = await axios[method.toLowerCase()](url, formData);

      if (response.data.success) {
        setModalMessage(editingId 
          ? '¡Categoría actualizada correctamente!' 
          : '¡Categoría creada con éxito!');
        setShowSuccessModal(true);
        resetForm();
        fetchCategorias();
      }
    } catch (error) {
      console.error('Error:', error);
      setModalMessage(error.response?.data?.message || "Error al procesar la solicitud");
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta categoría?")) return;

    try {
      const response = await axios.delete(`http://localhost:5000/categorias/eliminar/${id}`);
      if (response.data.success) {
        setModalMessage("Categoría eliminada correctamente");
        setShowSuccessModal(true);
        fetchCategorias();
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      setModalMessage(error.response?.data?.message || "Error al eliminar la categoría");
      setShowErrorModal(true);
    }
  };

  // Funciones de formulario
  const validateField = (name, value) => {
    const newErrors = { ...formErrors };

    if (!value?.trim()) {
      newErrors[name] = `${name} es requerido`;
    } else {
      delete newErrors[name];
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const requiredFields = ['nombre_categoria', 'id_entidad'];
    const isValid = requiredFields.every(field => {
      validateField(field, formData[field]);
      return formData[field]?.trim();
    });

    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const resetForm = () => {
    setFormData({
      nombre_categoria: '',
      id_entidad: '',
      descripcion: ''
    });
    setEditingId(null);
    setFormErrors({});
    setShowForm(false);
  };

  const handleEdit = (categoria) => {
    setFormData({
      nombre_categoria: categoria.nombre_categoria,
      id_entidad: categoria.id_entidad,
      descripcion: categoria.descripcion || ''
    });
    setEditingId(categoria.id_categoria);
    setShowForm(true);
  };

  // Funciones de filtrado
  const addFilterField = () => {
    setAdditionalFilters([...additionalFilters, { field: 'nombre_categoria', value: '' }]);
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
    fetchCategorias();
  };

  // Funciones de paginación
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredCategorias.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredCategorias.length / rowsPerPage);

  const paginate = (page) => setCurrentPage(page);
  const nextPage = () => currentPage < totalPages && setCurrentPage(p => p + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(p => p - 1);

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Cerrar modales
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
  };

  // Renderizado condicional
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
        <div className={styles.container} style={{  marginLeft: isMenuExpanded ? "100px" : "20px" }}>
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
              <FaPlus /> {showForm ? 'Ver Categorías' : 'Agregar Categoría'}
            </button>
          </div>

          {showForm ? (
            <div className={styles.containerUsuarios}>
              <h2 className={styles.titulo}>
                {editingId ? 'Editar Categoría' : 'Formulario de Creación de Categoría'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className={styles.gridContainerUsuarios}>
                  <div className={styles.columna}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Nombre de la Categoría</label>
                      <input
                        type="text"
                        className={`${styles.input} ${formErrors.nombre_categoria ? styles.inputError : ''}`}
                        name="nombre_categoria"
                        value={formData.nombre_categoria}
                        onChange={handleChange}
                        required
                      />
                      {formErrors.nombre_categoria && <span className={styles.errorMessage}>{formErrors.nombre_categoria}</span>}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Entidad</label>
                      <select
                        className={`${styles.select} ${formErrors.id_entidad ? styles.inputError : ''}`}
                        name="id_entidad"
                        value={formData.id_entidad}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Seleccione una entidad</option>
                        {entidades.map(entidad => (
                          <option key={entidad.id_entidad} value={entidad.id_entidad}>
                            {entidad.nombre_entidad}
                          </option>
                        ))}
                      </select>
                      {formErrors.id_entidad && <span className={styles.errorMessage}>{formErrors.id_entidad}</span>}
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
                <h2 className={styles.sectionTitle}>Buscar Categorías</h2>
                <form className={styles.searchForm} onSubmit={(e) => e.preventDefault()}>
                  <div className={styles.mainSearch}>
                    <div className={styles.searchFieldGroup}>
                      <select
                        className={styles.searchSelect}
                        value={searchField}
                        onChange={(e) => setSearchField(e.target.value)}
                      >
                        <option value="nombre_categoria">Nombre</option>
                        <option value="entidad">Entidad</option>
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
                      Categorías
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
                        <option value="nombre_categoria">Nombre</option>
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
                <h2 className={styles.sectionTitle}>Categorías Registradas ({filteredCategorias.length})</h2>
                <div className={styles.tableWrapper}>
                  <table className={styles.usersTable}>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Entidad</th>
                        <th>Descripción</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan="4" className={styles.loadingCell}>
                            <FaSpinner className={styles.spinner} /> Cargando categorías...
                          </td>
                        </tr>
                      ) : currentRows.length > 0 ? (
                        currentRows.map((categoria) => (
                          <tr key={categoria.id_categoria}>
                            <td>{categoria.nombre_categoria}</td>
                            <td>{categoria.entidad}</td>
                            <td>{categoria.descripcion || '-'}</td>
                            <td>
                              <button
                                className={styles.actionButton}
                                onClick={() => handleEdit(categoria)}
                              >
                                Editar
                              </button>
                              <button
                                className={`${styles.actionButton} ${styles.deleteButton}`}
                                onClick={() => handleDelete(categoria.id_categoria)}
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className={styles.noUsers}>No se encontraron categorías</td>
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
                    Mostrando {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, filteredCategorias.length)} de {filteredCategorias.length} registros
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

          {/* Modal de éxito */}
          {showSuccessModal && (
            <div className={styles.modalOverlay}>
              <div className={styles.modal}>
                <div className={styles.modalHeader}>
                  <h3>Operación Exitosa</h3>
                  <button 
                    onClick={handleCloseSuccessModal} 
                    className={styles.modalCloseButton}
                  >
                    &times;
                  </button>
                </div>
                
                <div className={styles.modalBody}>
                  <div className={styles.successIcon}>
                    <svg viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" />
                    </svg>
                  </div>
                  <p>{modalMessage}</p>
                  
                  <div className={styles.modalActions}>
                    <button
                      onClick={handleCloseSuccessModal}
                      className={styles.modalButton}
                    >
                      Aceptar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal de error */}
          {showErrorModal && (
            <div className={styles.modalOverlay}>
              <div className={styles.modal}>
                <div className={styles.modalHeader}>
                  <h3>Error</h3>
                  <button 
                    onClick={handleCloseErrorModal} 
                    className={styles.modalCloseButton}
                  >
                    &times;
                  </button>
                </div>
                
                <div className={styles.modalBody}>
                  <div className={styles.errorIcon}>
                    <svg viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z" />
                    </svg>
                  </div>
                  <p>{modalMessage}</p>
                  
                  <div className={styles.modalActions}>
                    <button
                      onClick={handleCloseErrorModal}
                      className={styles.modalButtonError}
                    >
                      Entendido
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <ChatBot />
        </div>
      </>
    </MenuVertical>
  );
};

export default Categorias;