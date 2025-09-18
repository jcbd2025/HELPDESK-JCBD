import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';
import { Link, useNavigate, Outlet, useLocation, useParams } from "react-router-dom";
import Logo from "../imagenes/logo proyecto color.jpeg";
import Logoempresarial from "../imagenes/logo empresarial.png";
import { FaMagnifyingGlass, FaPowerOff } from "react-icons/fa6";
import { FiAlignJustify } from "react-icons/fi";
import { FcHome, FcAssistant, FcBusinessman, FcAutomatic, FcAnswers, FcCustomerSupport, FcExpired, FcGenealogy, FcBullish, FcConferenceCall, FcPortraitMode, FcOrganization } from "react-icons/fc";
import ChatBot from "../Componentes/ChatBot";
import { useNotification } from "../context/NotificationContext";
import styles from "../styles/CrearCasoUse.module.css";
import MenuVertical from "../Componentes/MenuVertical";

const CrearCasoUse = () => {
  // Estados principales
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Estados para los modales
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [createdTicketId, setCreatedTicketId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const fileInputRef = useRef(null);

  // Obtener datos del usuario desde localStorage
  const userRole = localStorage.getItem("rol") || "usuario";
  const userNombre = localStorage.getItem("nombre") || "";
  const userId = localStorage.getItem("id_usuario");

  // Determinar si estamos en modo edición
  const isEditMode = id || location.state?.ticketData;

  // Handlers
  const toggleChat = () => setIsChatOpen(!isChatOpen);
  const toggleMenu = () => setIsMenuExpanded(!isMenuExpanded);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
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

  // Manejar búsqueda
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/Tickets?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm("");
    }
  };

  const roleToPath = {
    usuario: '/home',
    tecnico: '/HomeTecnicoPage',
    administrador: '/HomeAdmiPage'
  };

  // Estado del formulario
  const [formData, setFormData] = useState({
    id: "",
    tipo: "incidencia",
    origen: "",
    ubicacion: "",
    prioridad: "",
    categoria: "",
    titulo: "",
    descripcion: "",
    archivos: [],
    solicitante: userId,
    estado: "nuevo"
  });

  // Obtener datos iniciales al cargar el componente
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Obtener usuarios
        const usuariosResponse = await axios.get(
          "/usuarios/obtener"
        );
        setUsuarios(usuariosResponse.data);

        // Obtener departamentos
        const deptosResponse = await axios.get(
          "/usuarios/obtenerEntidades"
        );
        setDepartamentos(deptosResponse.data);

        // Obtener categorías
        const catsResponse = await axios.get(
          "/usuarios/obtenerCategorias"
        );
        setCategorias(catsResponse.data);

        // Obtener datos del usuario logueado para el campo origen
        const userResponse = await axios.get(
          `/usuarios/obtenerUsuario/${userId}`
        );
        const userData = userResponse.data;

        // Cargar datos del ticket si estamos en modo edición
        if (isEditMode) {
          const ticketId = id || location.state?.ticketData?.id_ticket || location.state?.ticketData?.id;
          const response = await axios.get(
            `/usuarios/tickets/${ticketId}`
          );
          const ticketData = response.data;

          // Buscar el ID de la categoría correspondiente al nombre recibido
          const categoriaId = categorias.find(cat => cat.nombre_categoria === ticketData.categoria)?.id_categoria;

          setFormData({
            id: ticketData.id,
            tipo: ticketData.tipo,
            origen: ticketData.origen || userData.entidad,
            ubicacion: ticketData.ubicacion,
            prioridad: ticketData.prioridad,
            categoria: categoriaId || "", // Asignar el ID de la categoría si se encuentra
            titulo: ticketData.titulo,
            descripcion: ticketData.descripcion,
            archivo: null,
            solicitante: userId,
            estado: ticketData.estado
          });
        } else {
          // En modo creación, establecer el origen con la entidad del usuario
          setFormData(prev => ({
            ...prev,
            origen: userData.entidad
          }));
        }
      } catch (error) {
        console.error("Error al obtener datos iniciales:", error);
        setModalMessage("Error al cargar datos iniciales");
        setShowErrorModal(true);
      }
    };

    fetchInitialData();
  }, [id, location.state, isEditMode, userId, categorias]);

  // Manejo de cambios en el formulario
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'archivos') {
      const nuevos = files ? Array.from(files) : [];
      setFormData(prev => ({
        ...prev,
        // Agregar a la lista existente para permitir múltiples selecciones sucesivas
        archivos: [...(prev.archivos || []), ...nuevos],
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const removeArchivo = (idx) => {
    setFormData(prev => ({
      ...prev,
      archivos: prev.archivos.filter((_, i) => i !== idx)
    }));
    // Limpiar el input para permitir volver a seleccionar el mismo archivo si se desea
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formDataToSend = new FormData();

      // Campos que siempre se envían
      formDataToSend.append("titulo", formData.titulo);
      formDataToSend.append("descripcion", formData.descripcion);
      formDataToSend.append("solicitante", formData.solicitante);
      formDataToSend.append("ubicacion", formData.ubicacion);

      // Campos adicionales para admin/tecnico o creación
      if (!isEditMode || userRole === 'administrador' || userRole === 'tecnico') {
        formDataToSend.append("prioridad", formData.prioridad);
        formDataToSend.append("tipo", formData.tipo);
        formDataToSend.append("categoria", formData.categoria);
      }

      // Adjuntos
      if (isEditMode) {
        // PUT /usuarios/tickets/:id acepta 'archivo' singular
        if (formData.archivos && formData.archivos.length > 0) {
          formDataToSend.append("archivo", formData.archivos[0]);
        }
      } else {
        // POST /usuarios/tickets acepta múltiples 'archivos'
        if (formData.archivos && formData.archivos.length > 0) {
          formData.archivos.forEach((file) => formDataToSend.append("archivos", file));
        }
        // Enviar estado si está presente
        if (formData.estado) {
          formDataToSend.append("estado", formData.estado);
        }
      }

      let response;

      if (isEditMode) {
        // En modo edición, agregar datos de usuario para validación en backend
        formDataToSend.append("user_id", userId);
        formDataToSend.append("user_role", userRole);

        response = await axios.put(
          `/usuarios/tickets/${formData.id}`,
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        response = await axios.post(
          "/usuarios/tickets",
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      if (response.data.success) {
        // Mostrar modal de éxito
        const createdId = response.data.ticket_id || response.data.id_ticket;
        setModalMessage(
          isEditMode
            ? "Ticket actualizado correctamente"
            : `Ticket creado correctamente con ID: ${createdId}`
        );
        setCreatedTicketId(createdId);
        setShowSuccessModal(true);
      } else {
        // Mostrar modal de error
        setModalMessage(response.data.message || "Error al procesar la solicitud");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error detallado:", error);

      let errorMsg = "Error al procesar la solicitud";
      if (error.response) {
        errorMsg = error.response.data?.message ||
          `Error ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        errorMsg = "No se recibió respuesta del servidor";
      } else {
        errorMsg = error.message || "Error al procesar la solicitud";
      }

      // Mostrar modal de error
      setModalMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Funciones para cerrar modales
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    if (!isEditMode) {
      navigate("/Tickets");
    }
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
  };

  // Validación del formulario
  const validateForm = () => {
    if (isEditMode) {
      // En modo edición, solo requerimos título, descripción y ubicación para usuarios normales
      if (userRole === 'usuario') {
        return formData.titulo && formData.descripcion && formData.ubicacion;
      }
    }

    // Para creación o edición por admin/tecnico, validar todos los campos
    return (
      formData.tipo &&
      formData.prioridad &&
      formData.categoria &&
      formData.titulo &&
      formData.descripcion &&
      formData.solicitante &&
      formData.ubicacion
    );
  };

  const getRouteByRole = (section) => {
    const userRole = localStorage.getItem("rol");

    if (section === 'inicio') {
      if (userRole === 'administrador') {
        return '/HomeAdmiPage';
      } else if (userRole === 'tecnico') {
        return '/HomeTecnicoPage';
      } else {
        return '/home';
      }
    } else if (section === 'crear-caso') {
      if (userRole === 'administrador') {
        return '/CrearCasoAdmin';
      } else if (userRole === 'tecnico') {
        return '/CrearCasoAdmin';
      } else {
        return '/CrearCasoUse';
      }
    } else if (section === "tickets") {
      return "/Tickets";
    }
  };

  return (
    <MenuVertical>
      <>


        {/* Contenido Principal */}
        <div className={styles.containercaso} >

          <div className={styles.sectionContainer}>
            <div className={styles.ticketContainer}>
              <ul className={styles.creacion}>
                <li>
                  <Link to="/CrearCasoUse" className={styles.linkSinSubrayado}>
                    <FcCustomerSupport className={styles.menuIcon} />
                    <span className={styles.creacionDeTicket}>
                      {isEditMode ? "Editar Ticket" : "Crear Nuevo Ticket"}
                    </span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Mensajes de estado */}
          {error && (
            <div className={styles.errorMessage}>
              {error}
              <button
                onClick={() => setError(null)}
                className={styles.closeMessage}
              >
                &times;
              </button>
            </div>
          )}
          {success && (
            <div className={styles.successMessage}>
              {success}
              <button
                onClick={() => setSuccess(null)}
                className={styles.closeMessage}
              >
                &times;
              </button>
            </div>
          )}

          {/* Formulario */}
          <div className={styles.formColumn}>
            <div className={styles.formContainerCaso}>
              <form onSubmit={handleSubmit}>
                {/* Campo ID oculto (necesario para el backend pero no visible) */}
                {isEditMode && <input type="hidden" name="id" value={formData.id} />}

                {/* Solicitante */}
                <div className={styles.formGroupCaso}>
                  <label className={styles.casoLabel}>Solicitante*</label>
                  <input
                    className={styles.casoInput}
                    type="text"
                    value={userNombre}
                    readOnly
                    disabled
                  />
                </div>

                {/* Estado (solo visible en edición) */}
                {isEditMode && (
                  <div className={styles.formGroupCaso}>
                    <label className={styles.casoLabel}>Estado</label>
                    <input
                      className={styles.casoInput}
                      type="text"
                      value={formData.estado}
                      readOnly
                      disabled
                    />
                  </div>
                )}

                {/* Campo Origen - solo lectura */}
                <div className={styles.formGroupCaso}>
                  <label className={styles.casoLabel}>Origen*</label>
                  <input
                    className={styles.casoInput}
                    type="text"
                    name="origen"
                    value={formData.origen || ''}
                    readOnly
                  />
                </div>

                {/* Campo Ubicación - editable siempre */}
                <div className={styles.formGroupCaso}>
                  <label className={styles.casoLabel}>Ubicación*</label>
                  <input
                    className={styles.casoInput}
                    type="text"
                    name="ubicacion"
                    value={formData.ubicacion}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Edificio A, Piso 3, Oficina 302"
                  />
                </div>

                {/* Prioridad - editable solo en creación o por admin/tecnico */}
                <div className={styles.formGroupCaso}>
                  <label className={styles.casoLabel}>Prioridad*</label>
                  <select
                    className={styles.casoSelect}
                    name="prioridad"
                    value={formData.prioridad}
                    onChange={handleChange}
                    required={!isEditMode}
                    disabled={isEditMode && !(userRole === 'administrador' || userRole === 'tecnico')}
                  >
                    <option value="">Seleccione...</option>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>

                {/* Campo Categoría con datos dinámicos */}
                <div className={styles.formGroupCaso}>
                  <label className={styles.casoLabel}>Categoría*</label>
                  <select
                    className={styles.casoSelect}
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    required={!isEditMode}
                    disabled={isEditMode && !(userRole === 'administrador' || userRole === 'tecnico')}
                  >
                    <option value="">Seleccione...</option>
                    {categorias.map(cat => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>
                        {cat.nombre_categoria}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Título - siempre editable */}
                <div className={styles.formGroupCaso}>
                  <label className={styles.casoLabel}>Título*</label>
                  <input
                    className={styles.casoInput}
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Descripción - siempre editable */}
                <div className={styles.formGroupCaso}>
                  <label className={styles.casoLabel}>Descripción*</label>
                  <textarea
                    className={styles.casoTextarea}
                    placeholder="Describa el caso detalladamente"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    rows="5"
                    required
                  />
                </div>

                {/* Archivo(s) adjunto(s) - siempre editable */}
                <div className={styles.formGroupCaso}>
                  <label className={styles.casoLabel}>Adjuntar archivo</label>
                  <input
                    className={styles.casoFile}
                    type="file"
                    name="archivos"
                    ref={fileInputRef}
                    multiple
                    onChange={handleChange}
                  />
                  {Array.isArray(formData.archivos) && formData.archivos.length > 0 && (
                    <ul className={styles.fileList}>
                      {formData.archivos.map((f, idx) => (
                        <li key={idx} className={styles.fileItem}>
                          {f.name}
                          <button
                            type="button"
                            onClick={() => removeArchivo(idx)}
                            style={{ marginLeft: 8 }}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isLoading || !validateForm()}
                >
                  {isLoading ? (
                    <>
                      <span className={styles.loadingSpinner}></span>
                      Procesando...
                    </>
                  ) : (
                    isEditMode ? 'Actualizar Ticket' : 'Crear Ticket'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ChatBot */}
        <ChatBot />

        {/* Modal de éxito */}
        {showSuccessModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>{isEditMode ? "Actualización Exitosa" : "Ticket Creado"}</h3>
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

                {!isEditMode && createdTicketId && (
                  <div className={styles.ticketIdContainer}>
                    <p>Número de ticket:</p>
                    <p className={styles.ticketId}>{createdTicketId}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(createdTicketId);
                        setSuccess("Número copiado al portapapeles");
                      }}
                      className={styles.copyButton}
                    >
                      Copiar número
                    </button>
                  </div>
                )}

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
      </>
    </MenuVertical>
  );
};

export default CrearCasoUse;