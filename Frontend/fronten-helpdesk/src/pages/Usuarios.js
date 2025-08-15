import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { FaPowerOff, FaChevronLeft, FaChevronRight, FaChevronDown, FaSearch, FaFilter, FaPlus, FaSpinner, FaFileExcel, FaFilePdf, FaFileCsv } from "react-icons/fa";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { FiAlignJustify } from "react-icons/fi";
import { FcHome, FcAssistant, FcBusinessman, FcAutomatic, FcAnswers, FcCustomerSupport, FcGenealogy, FcBullish, FcConferenceCall, FcPortraitMode, FcOrganization, FcPrint } from "react-icons/fc";
import axios from "axios";
import styles from "../styles/Usuarios.module.css";
import ChatBot from "../Componentes/ChatBot";
import MenuVertical from "../Componentes/MenuVertical";

const Usuarios = () => {
  // Estados para UI
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [menuState, setMenuState] = useState({
    support: false,
    admin: false,
    config: false
  });

  // Estados para datos
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("nombre_usuario");
  const [additionalFilters, setAdditionalFilters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [entidades, setEntidades] = useState([]);
  const [grupos, setGrupos] = useState([]);

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

  // Datos del formulario
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    nombre_completo: '',
    correo: '',
    telefono: '',
    contrasena: '',
    estado: 'activo',
    id_entidad: '',
    rol: '',
    grupo: ''
  });

  // Efectos
  useEffect(() => {
    fetchUsers();
    fetchEntidades();
    fetchGrupos();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchField, searchTerm, additionalFilters, users]);

  // Funciones de ayuda
  const applyFilters = () => {
    let result = [...users];

    if (searchField && searchTerm) {
      result = result.filter(user => {
        const value = user[searchField];
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    additionalFilters.forEach(filter => {
      if (filter.field && filter.value) {
        result = result.filter(user => {
          const value = user[filter.field];
          return value?.toString().toLowerCase().includes(filter.value.toLowerCase());
        });
      }
    });

    setFilteredUsers(result);
    setCurrentPage(1);
  };

  const toggleMenu = (menu) => {
    setMenuState(prev => {
      const newState = { support: false, admin: false, config: false };
      if (menu) newState[menu] = !prev[menu];
      return newState;
    });
  };



  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleMainMenu = () => setIsMenuExpanded(!isMenuExpanded);
  const toggleExportDropdown = () => setIsExportDropdownOpen(!isExportDropdownOpen);

  // Funciones de exportación
  const exportToExcel = () => {
    console.log("Exportando a Excel", filteredUsers);
    setIsExportDropdownOpen(false);
  };

  const exportToPdf = () => {
    console.log("Exportando a PDF", filteredUsers);
    setIsExportDropdownOpen(false);
  };

  const exportToCsv = () => {
    console.log("Exportando a CSV", filteredUsers);
    setIsExportDropdownOpen(false);
  };

  const printTable = () => {
    window.print();
    setIsExportDropdownOpen(false);
  };

  // Funciones de API
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/usuarios/obtener");
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEntidades = async () => {
    try {
      const response = await axios.get("http://localhost:5000/usuarios/obtenerEntidades");
      setEntidades(response.data);
    } catch (error) {
      console.error("Error al cargar entidades:", error);
    }
  };

   const fetchGrupos = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/usuarios/obtenerGrupos");
      setGrupos(response.data);
      setFilteredGrupos(response.data);
    } catch (error) {
      console.error("Error al cargar grupos:", error);
      showNotificationModal("Error", "Error al cargar los grupos", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Funciones de validación corregidas
  const validateField = (name, value) => {
    const newErrors = { ...formErrors };

    switch (name) {
      case 'nombre_usuario':
        if (!value) {
          newErrors[name] = 'Nombre de usuario es requerido';
        } else if (typeof value === 'string' && value.trim().length < 3) {
          newErrors[name] = 'Mínimo 3 caracteres';
        } else {
          delete newErrors[name];
        }
        break;

      case 'nombre_completo':
        if (!value) {
          newErrors[name] = 'Nombre completo es requerido';
        } else if (typeof value === 'string' && value.trim().length === 0) {
          newErrors[name] = 'Nombre completo no puede estar vacío';
        } else {
          delete newErrors[name];
        }
        break;

      case 'correo':
        if (!value) {
          newErrors[name] = 'Correo es requerido';
        } else if (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          newErrors[name] = 'Correo inválido';
        } else {
          delete newErrors[name];
        }
        break;

      case 'telefono':
        if (value && typeof value === 'string' && !/^\d{7,15}$/.test(value.trim())) {
          newErrors[name] = 'Teléfono inválido';
        } else {
          delete newErrors[name];
        }
        break;

      case 'contrasena':
        if (!editingId && !value) {
          newErrors[name] = 'Contraseña es requerida';
        } else if (value && typeof value === 'string' && value.length < 6) {
          newErrors[name] = 'Mínimo 6 caracteres';
        } else {
          delete newErrors[name];
        }
        break;

      case 'id_entidad':
        if (value === '' || value === null || value === undefined) {
          newErrors[name] = 'Entidad es requerida';
        } else {
          delete newErrors[name];
        }
        break;

      case 'rol':
        if (!value) {
          newErrors[name] = 'Rol es requerido';
        } else {
          delete newErrors[name];
        }
        break;

      default:
        break;
    }

    setFormErrors(newErrors);
    return !newErrors[name];
  };

  const validateForm = () => {
    const requiredFields = ['nombre_usuario', 'nombre_completo', 'correo', 'id_entidad', 'rol'];
    if (!editingId) requiredFields.push('contrasena');

    const isValid = requiredFields.every(field => {
      const value = formData[field];
      validateField(field, value);

      if (value === null || value === undefined || value === '') {
        return false;
      }

      if (typeof value === 'string') {
        return value.trim() !== '';
      }

      if (typeof value === 'number') {
        return true;
      }

      return true;
    });

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setModalMessage("Por favor complete todos los campos requeridos correctamente");
      setShowErrorModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `http://localhost:5000/usuarios/actualizacion/${editingId}`
        : 'http://localhost:5000/usuarios/creacion';

      const response = await axios[method.toLowerCase()](url, formData);

      if (response.data.success) {
        setModalMessage(editingId
          ? '¡Usuario actualizado correctamente!'
          : '¡Usuario creado con éxito!');
        setShowSuccessModal(true);
        resetForm();
        fetchUsers();
      }
    } catch (error) {
      console.error('Error:', error);
      let errorMessage = 'Error al procesar la solicitud';

      if (error.response?.data?.message) {
        if (error.response.data.message.includes('ya existe')) {
          errorMessage = 'El nombre de usuario ya está en uso';
        } else {
          errorMessage = error.response.data.message;
        }
      }

      setModalMessage(errorMessage);
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

   const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este usuario?")) return;

    try {
      const response = await axios.delete(`http://localhost:5000/usuarios/eliminar/${id}`);
      if (response.data.success) {
        setModalMessage("Usuario eliminado correctamente");
        setShowSuccessModal(true);
        fetchUsers();
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      setModalMessage(error.response?.data?.message || "Error al eliminar el usuario");
      setShowErrorModal(true);
    }
  };

  // Funciones de formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const resetForm = () => {
    setFormData({
      nombre_usuario: '',
      nombre_completo: '',
      correo: '',
      telefono: '',
      contrasena: '',
      estado: 'activo',
      id_entidad: '',
      rol: ''
    });
    setEditingId(null);
    setFormErrors({});
    setShowForm(false);
  };

  const handleEdit = (user) => {
    setFormData({
      nombre_usuario: user.nombre_usuario,
      nombre_completo: user.nombre_completo,
      correo: user.correo,
      telefono: user.telefono,
      contrasena: '',
      estado: user.estado,
      id_entidad: user.id_entidad1 || '',
      rol: user.rol
    });
    setEditingId(user.id_usuario);
    setShowForm(true);
  };

  // Funciones de filtrado
  const addFilterField = () => {
    setAdditionalFilters([...additionalFilters, { field: 'nombre_usuario', value: '' }]);
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
    fetchUsers();
  };

  // Funciones de paginación
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredUsers.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  const paginate = (page) => setCurrentPage(page);
  const nextPage = () => currentPage < totalPages && setCurrentPage(p => p + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(p => p - 1);

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
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

  // Cerrar modales
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
  };

  return (
    <MenuVertical>
      <>

        {/* Contenido */}
        <div className={styles.container}>
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
              <FaPlus /> {showForm ? 'Ver Usuarios' : 'Agregar Usuario'}
            </button>
          </div>

          {showForm ? (
            <div className={styles.containerUsuarios}>
              <h2 className={styles.titulo}>
                {editingId ? 'Editar Usuario' : 'Formulario de Creación de Usuario'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className={styles.gridContainerUsuarios}>
                  <div className={styles.columna}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Nombre de usuario</label>
                      <input
                        type="text"
                        className={`${styles.input} ${formErrors.nombre_usuario ? styles.inputError : ''}`}
                        name="nombre_usuario"
                        value={formData.nombre_usuario}
                        onChange={handleChange}
                        required
                      />
                      {formErrors.nombre_usuario && <span className={styles.errorMessage}>{formErrors.nombre_usuario}</span>}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Nombre completo</label>
                      <input
                        type="text"
                        className={`${styles.input} ${formErrors.nombre_completo ? styles.inputError : ''}`}
                        name="nombre_completo"
                        value={formData.nombre_completo}
                        onChange={handleChange}
                        required
                      />
                      {formErrors.nombre_completo && <span className={styles.errorMessage}>{formErrors.nombre_completo}</span>}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Correo electrónico</label>
                      <input
                        type="email"
                        className={`${styles.input} ${formErrors.correo ? styles.inputError : ''}`}
                        name="correo"
                        value={formData.correo}
                        onChange={handleChange}
                        required
                      />
                      {formErrors.correo && <span className={styles.errorMessage}>{formErrors.correo}</span>}
                    </div>
                  </div>

                  <div className={styles.columna}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Teléfono</label>
                      <input
                        type="tel"
                        className={`${styles.input} ${formErrors.telefono ? styles.inputError : ''}`}
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                      />
                      {formErrors.telefono && <span className={styles.errorMessage}>{formErrors.telefono}</span>}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Contraseña</label>
                      <input
                        type="password"
                        className={`${styles.input} ${formErrors.contrasena ? styles.inputError : ''}`}
                        name="contrasena"
                        value={formData.contrasena}
                        onChange={handleChange}
                        placeholder={editingId ? "Dejar en blanco para no cambiar" : ""}
                        required={!editingId}
                      />
                      {formErrors.contrasena && <span className={styles.errorMessage}>{formErrors.contrasena}</span>}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Estado</label>
                      <select
                        className={styles.select}
                        name="estado"
                        value={formData.estado}
                        onChange={handleChange}
                      >
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className={styles.selectsContainer}>
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
                    <label className={styles.label}>Rol</label>
                    <select
                      className={`${styles.select} ${formErrors.rol ? styles.inputError : ''}`}
                      name="rol"
                      value={formData.rol}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleccione un rol</option>
                      <option value="administrador">Administrador</option>
                      <option value="tecnico">Técnico</option>
                      <option value="usuario">Usuario</option>
                    </select>
                    {formErrors.rol && <span className={styles.errorMessage}>{formErrors.rol}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Grupo</label>
                    <select
                      className={`${styles.select} ${formErrors.id_grupo ? styles.inputError : ''}`}
                      name="id_grupo"
                      value={formData.id_grupo}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleccione un grupo</option>
                      {grupos.map(grupo => (
                        <option key={grupo.id_grupo} value={grupo.id_grupo}>
                          {grupo.nombre_grupo}
                        </option>
                      ))}
                    </select>
                    {formErrors.id_grupo && <span className={styles.errorMessage}>{formErrors.id_grupo}</span>}
                  </div>
                </div>

                <div className={styles.botonesContainer}>
                  <button type="submit" className={styles.boton} disabled={isLoading}>
                    {isLoading ? <FaSpinner className={styles.spinnerButton} /> : 'Guardar'}
                  </button>
                  <button type="button" onClick={resetForm} className={styles.botonCancelar}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className={styles.searchSection}>
                <h2 className={styles.sectionTitle}>Buscar Usuarios</h2>
                <form className={styles.searchForm} onSubmit={(e) => e.preventDefault()}>
                  <div className={styles.mainSearch}>
                    <div className={styles.searchFieldGroup}>
                      <select
                        className={styles.searchSelect}
                        value={searchField}
                        onChange={(e) => setSearchField(e.target.value)}
                      >
                        <option value="nombre_usuario">Usuario</option>
                        <option value="nombre_completo">Nombre completo</option>
                        <option value="correo">Correo</option>
                        <option value="rol">Rol</option>
                        <option value="estado">Estado</option>
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
                      Usuarios
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
                        <option value="nombre_usuario">Usuario</option>
                        <option value="nombre_completo">Nombre completo</option>
                        <option value="correo">Correo</option>
                        <option value="rol">Rol</option>
                        <option value="estado">Estado</option>
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
                <h2 className={styles.sectionTitle}>Usuarios Registrados ({filteredUsers.length})</h2>
                <div className={styles.tableWrapper}>
                  <table className={styles.usersTable}>
                    <thead>
                      <tr>
                        <th>Usuario</th>
                        <th>Nombre completo</th>
                        <th>Correo</th>
                        <th>Teléfono</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Grupo</th>
                        <th>Entidad</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan="8" className={styles.loadingCell}>
                            <FaSpinner className={styles.spinner} /> Cargando usuarios...
                          </td>
                        </tr>
                      ) : currentRows.length > 0 ? (
                        currentRows.map((user) => (
                          <tr key={user.id_usuario}>
                            <td>{user.nombre_usuario}</td>
                            <td>{user.nombre_completo}</td>
                            <td>{user.correo}</td>
                            <td>{user.telefono || '-'}</td>
                            <td>{user.rol}</td>
                            <td>{user.grupo}</td>

                            <td>
                              <span className={`${styles.statusBadge} ${user.estado === 'activo' ? styles.active : styles.inactive}`}>
                                {user.estado === 'activo' ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td>{user.entidad || '-'}</td>
                            <td>
                              <button
                                className={styles.actionButton}
                                onClick={() => handleEdit(user)}
                              >
                                Editar
                              </button>
                              <button
                                className={`${styles.actionButton} ${styles.deleteButton}`}
                                onClick={() => handleDelete(user.id_usuario)}
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className={styles.noUsers}>No se encontraron usuarios</td>
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
                    Mostrando {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, filteredUsers.length)} de {filteredUsers.length} registros
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

export default Usuarios;
