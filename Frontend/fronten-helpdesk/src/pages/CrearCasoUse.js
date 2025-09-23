import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';
import { Link, useNavigate, Outlet, useLocation, useParams } from "react-router-dom";
import { FcCustomerSupport } from "react-icons/fc";
import ChatBot from "../Componentes/ChatBot";
import styles from "../styles/CrearCasoUse.module.css";
import MenuVertical from "../Componentes/MenuVertical";

const CrearCasoUse = () => {
  // Estados principales
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [categorias, setCategorias] = useState([]);

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

  // Determinar si estamos en modo edición - SIEMPRE DESHABILITADO
  const isEditMode = false; // Forzar a false para deshabilitar edición

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
        // Obtener categorías
        const catsResponse = await axios.get("/usuarios/obtenerCategorias");
        setCategorias(catsResponse.data);

        // Obtener datos del usuario logueado para el campo origen
        const userResponse = await axios.get(`/usuarios/obtenerUsuario/${userId}`);
        const userData = userResponse.data;

        // En modo creación, establecer el origen con la entidad del usuario
        setFormData(prev => ({
          ...prev,
          origen: userData.entidad || ""
        }));

      } catch (error) {
        console.error("Error al obtener datos iniciales:", error);
        setModalMessage("Error al cargar datos iniciales");
        setShowErrorModal(true);
      }
    };

    fetchInitialData();
  }, [userId]);

  // Manejo de cambios en el formulario
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'archivos') {
      const nuevos = files ? Array.from(files) : [];
      setFormData(prev => ({
        ...prev,
        archivos: [...nuevos],
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Envío del formulario - SOLO CREACIÓN
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formDataToSend = new FormData();

      // Campos para creación
      formDataToSend.append("titulo", formData.titulo);
      formDataToSend.append("descripcion", formData.descripcion);
      formDataToSend.append("solicitante", formData.solicitante);
      formDataToSend.append("ubicacion", formData.ubicacion);
      formDataToSend.append("prioridad", formData.prioridad);
      formDataToSend.append("tipo", formData.tipo);
      formDataToSend.append("categoria", formData.categoria);
      formDataToSend.append("estado", formData.estado);

      // Adjuntos
      if (formData.archivos && formData.archivos.length > 0) {
        formData.archivos.forEach((file) => formDataToSend.append("archivos", file));
      }

      const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.post(
        `${API_BASE_URL}/usuarios/tickets`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        const createdId = response.data.ticket_id || response.data.id_ticket;
        setModalMessage(`Ticket creado correctamente con ID: ${createdId}`);
        setCreatedTicketId(createdId);
        setShowSuccessModal(true);
      } else {
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

      setModalMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Funciones para cerrar modales
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    navigate("/Tickets");
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
  };

  // Validación del formulario - solo para creación
  const validateForm = () => {
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

  return (
    <MenuVertical>
      <div className={styles.containercaso}>
        <div className={styles.sectionContainer}>
          <div className={styles.ticketContainer}>
            <ul className={styles.creacion}>
              <li>
                <Link to="/CrearCasoUse" className={styles.linkSinSubrayado}>
                  <FcCustomerSupport className={styles.menuIcon} />
                  <span className={styles.creacionDeTicket}>
                    Crear Nuevo Ticket
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

        {/* Formulario - SOLO CREACIÓN */}
        <div className={styles.formColumn}>
          <div className={styles.formContainerCaso}>
            <form onSubmit={handleSubmit}>
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

              {/* Campo Ubicación */}
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

              {/* Prioridad */}
              <div className={styles.formGroupCaso}>
                <label className={styles.casoLabel}>Prioridad*</label>
                <select
                  className={styles.casoSelect}
                  name="prioridad"
                  value={formData.prioridad}
                  onChange={handleChange}
                  required
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
                  required
                >
                  <option value="">Seleccione...</option>
                  {categorias.map(cat => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nombre_categoria}
                    </option>
                  ))}
                </select>
              </div>

              {/* Título */}
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

              {/* Descripción */}
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

              {/* Archivo(s) adjunto(s) */}
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
                          className={styles.removeFileButton}
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
                  'Crear Ticket'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Modal de éxito */}
        {showSuccessModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>Ticket Creado</h3>
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

                {createdTicketId && (
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
      </div>
    </MenuVertical>
  );
};

export default CrearCasoUse;