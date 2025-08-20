import React, { useState, useEffect } from "react";
import {
  Outlet,
  Link,
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import ChatBot from "../Componentes/ChatBot";
import { useNotification } from "../context/NotificationContext";
import styles from "../styles/CrearCasoAdmin.module.css";
import MenuVertical from "../Componentes/MenuVertical";

const CrearCasoAdmin = () => {
  // Obtener datos del usuario
  const userRole = localStorage.getItem("rol") || "";
  const userNombre = localStorage.getItem("nombre") || "";
  const { addNotification } = useNotification();

  // Estados
  const location = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState(null);
  const navigate = useNavigate();

  // Estado del formulario
  const [formData, setFormData] = useState({
    id: "",
    tipo: "incidencia",
    origen: "",
    prioridad: "mediana",
    categoria: "",
    titulo: "",
    descripcion: "",
    archivos: [],
    solicitante: "", // Cambiar para que se seleccione del select
    elementos: "",
    entidad: "",
    estado: "nuevo",
    ubicacion: "",
    observador: "",
    asignado_a: "",
    grupo_asignado: "",
    fechaApertura: new Date().toISOString().slice(0, 16),
  });

  // Verificación de rol
  const isAdminOrTech = userRole === "administrador" || userRole === "tecnico";

  // Obtener datos iniciales al cargar el componente
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // Usar Promise.all para llamadas paralelas
        const [usuariosRes, deptosRes, catsRes, grupoRes] = await Promise.all([
          axios.get("http://localhost:5000/usuarios/obtener"),
          axios.get("http://localhost:5000/usuarios/obtenerEntidades"),
          axios.get("http://localhost:5000/usuarios/obtenerCategorias"),
          axios.get("http://localhost:5000/usuarios/obtenerGrupos"),
        ]);

        setUsuarios(usuariosRes.data);
        setDepartamentos(deptosRes.data);
        setCategorias(catsRes.data);
        setGrupos(grupoRes.data);

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
  }, [location.state]);

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

  // Manejar búsqueda
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/Tickets?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm("");
    }
  };

  // Manejo de cambios en el formulario
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "archivos" && files) {
      setFormData((prev) => ({
        ...prev,
        archivos: Array.from(files),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const removeFile = (index) => {
    setFormData((prev) => {
      const newFiles = [...prev.archivos];
      newFiles.splice(index, 1);
      return { ...prev, archivos: newFiles };
    });
  };

  // Envío del formulario
  const handleSubmit = async (e) => {
    console.log("se esta enviando el formulario", formData);
    // Validar campos obligatorios
    const missingFields = [];
    const requiredFields = {
      entidad: "Entidad",
      titulo: "Título",
      descripcion: "Descripción",
      fechaApertura: "Fecha de apertura",
      tipo: "Tipo",
      categoria: "Categoría",
      estado: "Estado",
      prioridad: "Prioridad",
      ubicacion: "Ubicación",
      solicitante: "Solicitante",
      grupo_asignado: "Grupo asignado",
      asignado_a: "Asignado a",
    };

    Object.keys(requiredFields).forEach((field) => {
      if (!formData[field]) {
        missingFields.push(requiredFields[field]);
      }
    });

    if (missingFields.length > 0) {
      addNotification(
        `Por favor complete los siguientes campos obligatorios: ${missingFields.join(
          ", "
        )}`,
        "error"
      );
      return;
    }
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage("");

    try {
      const formDataToSend = new FormData();

      // Agregar campos al FormData
      Object.keys(formData).forEach((key) => {
        if (
          key !== "archivos" &&
          formData[key] !== undefined &&
          formData[key] !== null
        ) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Agregar archivos
      formData.archivos.forEach((file) => {
        formDataToSend.append("archivos", file);
      });

      const response = await axios.post(
        "http://localhost:5000/usuarios/tickets",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Mostrar modal de éxito
      setCreatedTicketId(response.data.id_ticket);
      setShowSuccessModal(true);

      // Opcional: resetear el formulario después de crear el ticket
      if (!location.state?.ticketData) {
        setFormData({
          id: "",
          tipo: "incidencia",
          origen: "",
          prioridad: "mediana",
          categoria: "",
          titulo: "",
          descripcion: "",
          archivos: [],
          solicitante: userNombre || "",
          elementos: "",
          entidad: "",
          estado: "nuevo",
          ubicacion: "",
          observador: "",
          asignado_a: "",
          grupo_asignado: "",
          fechaApertura: new Date().toISOString().slice(0, 16),
        });
      }
    } catch (error) {
      addNotification(
        error.response?.data?.detail || "Error al procesar la solicitud",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Validación del formulario
  const validateForm = () => {
    return (
      formData.tipo &&
      formData.origen &&
      formData.prioridad &&
      formData.categoria &&
      formData.titulo &&
      formData.descripcion &&
      formData.solicitante
    );
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    // Solo redirige si estamos creando un nuevo ticket, no editando
    if (!location.state?.ticketData) {
      navigate("/Tickets");
    }
  };

  const formatDateTimeForInput = (dateString) => {
    if (!dateString) return "";
    if (dateString.includes("T")) return dateString.substring(0, 16);

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const pad = (num) => num.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  return (
    <MenuVertical>
      <>
        {/* Contenido Principal */}
        <div className={styles.containerCrearCasoAdmin}>
          <div className={styles.containersolucion}>
            <h1 className={styles.title}>
              {location.state?.ticketData
                ? "Editar Ticket"
                : "Creación de Ticket"}
            </h1>

            <div className={styles.layoutContainer}>
              <div className={styles.gloBoContainer}>
                <div className={styles.gloBoHeader}>
                  <h2>
                    {location.state?.ticketData
                      ? "Editar Caso"
                      : "Crear Nuevo Caso"}
                  </h2>
                </div>

                <div className={styles.gloBoBody}>
                  <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                      <label>Entidad:*</label>
                      <select
                        className={styles.inputField}
                        value={formData.entidad}
                        name="entidad"
                        onChange={handleChange}
                        required
                      >
                        <option value="">Seleccione una entidad</option>
                        {departamentos.map((depto) => (
                          <option
                            key={depto.id_entidad}
                            value={depto.id_entidad}
                          >
                            {depto.nombre_entidad}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Título*</label>
                      <input
                        className={styles.inputField}
                        type="text"
                        name="titulo"
                        value={formData.titulo}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Descripción*</label>
                      <textarea
                        className={styles.inputField}
                        placeholder="Describa el caso detalladamente"
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        rows="5"
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Adjuntar archivos:</label>
                      <div className={styles.fileUploadContainer}>
                        <input
                          type="file"
                          id="fileUpload"
                          className={styles.fileInput}
                          onChange={handleChange}
                          name="archivos"
                          multiple
                        />
                        <label
                          htmlFor="fileUpload"
                          className={styles.fileUploadButton}
                        >
                          Seleccionar archivos
                        </label>
                        {formData.archivos.length > 0 && (
                          <div className={styles.fileList}>
                            {formData.archivos.map((file, index) => (
                              <div key={index} className={styles.fileItem}>
                                <span>{file.name}</span>
                                <button
                                  type="submit"
                                  onClick={() => removeFile(index)}
                                  className={styles.removeFileButton}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.formActions}>
                      <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isLoading}
                      >
                        {isLoading
                          ? "Procesando..."
                          : location.state?.ticketData
                          ? "Actualizar Ticket"
                          : "Crear Ticket"}
                      </button>
                    </div>
                  </form>
                </div>
                <div className={styles.gloBoPointer}></div>
              </div>

              {/* Modal de éxito */}
              {showSuccessModal && (
                <div className={styles.modalOverlay}>
                  <div className={styles.successModal}>
                    <div className={styles.modalHeader}>
                      <h3>
                        ¡Ticket{" "}
                        {location.state?.ticketData ? "actualizado" : "creado"}{" "}
                        exitosamente!
                      </h3>
                      <button
                        onClick={handleCloseModal}
                        className={styles.modalCloseButton}
                      >
                        &times;
                      </button>
                    </div>

                    <div className={styles.modalBody}>
                      <div className={styles.successIcon}>
                        <svg viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"
                          />
                        </svg>
                      </div>
                      <p>
                        El ticket fue{" "}
                        {location.state?.ticketData ? "actualizado" : "creado"}{" "}
                        con el número:
                      </p>
                      <p className={styles.ticketId}>
                        <strong>{createdTicketId}</strong>
                      </p>

                      <div className={styles.modalActions}>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(createdTicketId);
                            addNotification(
                              "Número de ticket copiado",
                              "success"
                            );
                          }}
                          className={styles.copyButton}
                        >
                          Copiar número
                        </button>
                        <button
                          onClick={handleCloseModal}
                          className={styles.modalButton}
                        >
                          Aceptar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.ticketInfoContainer}>
                <div className={styles.header}>
                  <h3>Información del Ticket</h3>
                </div>

                <div className={styles.verticalForm}>
                  <h4>Casos</h4>

                  <div className={styles.formGroup}>
                    <label className={styles.fecha}>Fecha de apertura*</label>
                    <input
                      type="datetime-local"
                      name="fechaApertura"
                      value={formatDateTimeForInput(formData.fechaApertura)}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Tipo*</label>
                    <select
                      name="tipo"
                      value={formData.tipo}
                      onChange={handleChange}
                      required
                    >
                      <option value="incidencia">Incidencia</option>
                      <option value="requerimiento">Requerimiento</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Categoría*</label>
                    <select
                      name="categoria"
                      value={formData.categoria}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleccione...</option>
                      {categorias?.map((categoria) => (
                        <option
                          key={categoria.id_categoria}
                          value={categoria.id_categoria}
                        >
                          {categoria.nombre_categoria}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Estado*</label>
                    <select
                      name="estado"
                      value={formData.estado}
                      onChange={handleChange}
                      required
                    >
                      <option value="nuevo">Nuevo</option>
                      <option value="en_curso">En curso</option>
                      <option value="en_espera">En espera</option>
                      <option value="resuelto">Resuelto</option>
                      <option value="cerrado">Cerrado</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Prioridad*</label>
                    <select
                      name="prioridad"
                      value={formData.prioridad}
                      onChange={handleChange}
                      required
                    >
                      <option value="alta">Alta</option>
                      <option value="mediana">Mediana</option>
                      <option value="baja">Baja</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Ubicación*</label>
                    <input
                      type="text"
                      name="ubicacion"
                      value={formData.ubicacion}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <h4>Asignaciones</h4>

                  <div className={styles.formGroup}>
                    <label className={styles.casoLabel}>Solicitante*</label>
                    <input
                      className={styles.casoInput}
                      type="text"
                      value={userNombre}
                      readOnly
                      disabled
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Observador</label>
                    <select
                      name="observador"
                      value={formData.observador}
                      onChange={handleChange}
                    >
                      <option value="">Seleccione un usuario...</option>
                      {usuarios.map((usuario) => (
                        <option
                          key={usuario.id_usuario}
                          value={usuario.id_usuario}
                        >
                          {`${usuario.nombre_completo}`} ({usuario.correo})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Grupo asignado*</label>
                    <select
                      name="grupo_asignado"
                      value={formData.grupo_asignado}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleccione un grupo...</option>
                      {grupos.map((grupo) => (
                        <option key={grupo.id_grupo} value={grupo.id_grupo}>
                          {grupo.nombre_grupo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Asignado a*</label>
                    <select
                      name="asignado_a"
                      value={formData.asignado_a}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleccione un usuario...</option>
                      {usuarios.map((usuario) => (
                        <option
                          key={usuario.id_usuario}
                          value={usuario.id_usuario}
                        >
                          {`${usuario.Nombre_completo}`} ({usuario.correo})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ChatBot />
      </>
    </MenuVertical>
  );
};

export default CrearCasoAdmin;