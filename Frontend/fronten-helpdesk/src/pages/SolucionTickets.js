import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaRegClock, FaCheckCircle, FaHistory } from "react-icons/fa";
import styles from "../styles/SolucionTickets.module.css";
import ChatBot from "../Componentes/ChatBot";
import MenuVertical from "../Componentes/MenuVertical";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const SolucionTickets = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const [solucion, setSolucion] = useState("");
  const [accion, setAccion] = useState("seguimiento");
  const [ticket, setTicket] = useState({
    id: "",
    titulo: "",
    descripcion: "",
    solicitante: "",
    prioridad: "",
    estado: "",
    tecnico: "",
    grupo: "",
    categoria: "",
    fechaApertura: "",
    ultimaActualizacion: "",
    tipo: "incidencia",
    ubicacion: "",
    observador: "",
    asignadoA: "",
    grupoAsignado: "",
  });
  const [surveyEnabled, setSurveyEnabled] = useState(false);
  const [surveyRating, setSurveyRating] = useState(0);
  const [surveyComment, setSurveyComment] = useState("");
  const [casos, setCasos] = useState([]);
  const [casoActual, setCasoActual] = useState(null);
  const [seguimientos, setSeguimientos] = useState([]);
  const [nuevoSeguimiento, setNuevoSeguimiento] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showSolutionForm, setShowSolutionForm] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [solutionFormData, setSolutionFormData] = useState({
    descripcion: "",
    archivos: []
  });

  const userRole = localStorage.getItem("rol");
  const isAdminOrTech = ["administrador", "tecnico"].includes(userRole);
  const isUser = userRole === "usuario";

  const SeguimientoItem = ({ seguimiento }) => {
    const isSolucion = seguimiento.tipo === 'solucion';
    
    return (
      <div className={isSolucion ? styles.solucionItem : styles.seguimientoItem}>
        <div className={isSolucion ? styles.solucionHeader : styles.seguimientoHeader}>
          <span className={isSolucion ? styles.solucionUsuario : styles.seguimientoUsuario}>
            {seguimiento.usuario}
          </span>
          <span className={isSolucion ? styles.solucionFecha : styles.seguimientoFecha}>
            {new Date(seguimiento.fecha).toLocaleString()}
          </span>
        </div>
        <div className={isSolucion ? styles.solucionContent : styles.seguimientoContent}>
          <p>{seguimiento.descripcion}</p>
          {seguimiento.archivos && seguimiento.archivos.length > 0 && (
            <div className={styles.archivosContainer}>
              <strong>Archivos adjuntos:</strong>
              <ul>
                {seguimiento.archivos.map((archivo, index) => (
                  <li key={index}>
                    <a href={`${API_BASE_URL}/uploads/${archivo}`} target="_blank" rel="noopener noreferrer">
                      {archivo}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setShowOptions(false);

    if (option === 'solucion' || option === 'seguimiento') {
      setShowSolutionForm(true);
    } else {
      setShowSolutionForm(false);
    }
  };

  const handleSolutionFileChange = (e) => {
    const { files } = e.target;
    if (files) {
      setSolutionFormData(prev => ({
        ...prev,
        archivos: Array.from(files)
      }));
    }
  };

  const removeSolutionFile = (index) => {
    setSolutionFormData(prev => {
      const newFiles = [...prev.archivos];
      newFiles.splice(index, 1);
      return { ...prev, archivos: newFiles };
    });
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        const [ticketRes, categoriasRes, seguimientosRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/usuarios/tickets/${id}`),
          axios.get(`${API_BASE_URL}/usuarios/obtenerCategorias`),
          axios.get(`${API_BASE_URL}/usuarios/tickets/${id}/seguimientos`)
        ]);

        setTicket(ticketRes.data);
        setCategorias(categoriasRes.data);
        setSeguimientos(seguimientosRes.data);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setError("Error al cargar los datos del ticket");
        setTicket({
          id: id || "TKT-001",
          titulo: "Problema con el sistema de impresión",
          descripcion: "El sistema no imprime correctamente los documentos largos",
          solicitante: "Usuario Ejemplo",
          prioridad: "Alta",
          estado: "Abierto",
          tecnico: "Técnico Asignado",
          grupo: "Soporte Técnico",
          categoria: "Hardware",
          fechaApertura: "2023-05-10 09:30:00",
          ultimaActualizacion: "2023-05-12 14:15:00",
          tipo: "incidencia",
          ubicacion: "Oficina Central",
          observador: "",
          asignadoA: "Técnico Asignado",
          grupoAsignado: "Soporte Técnico",
        });
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [id]);

  const handleTicketInfoChange = (e) => {
    const { name, value } = e.target;
    setTicket(prev => ({
      ...prev,
      [name]: value,
      ultimaActualizacion: new Date().toLocaleString()
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!solutionFormData.descripcion.trim()) {
      setError("Por favor ingrese la solución o seguimiento");
      return;
    }

    try {
      setIsLoading(true);

      const endpoint = selectedOption === "solucion"
        ? `${API_BASE_URL}/usuarios/tickets/${id}/solucionar`
        : `${API_BASE_URL}/usuarios/tickets/${id}/seguimientos`;

      const formDataToSend = new FormData();
      formDataToSend.append('descripcion', solutionFormData.descripcion);
      formDataToSend.append('usuario', localStorage.getItem("nombre"));

      if (selectedOption === "solucion") {
        formDataToSend.append('estado', 'resuelto');
        formDataToSend.append('tipo', 'solucion');
      } else {
        formDataToSend.append('tipo', 'seguimiento');
      }

      solutionFormData.archivos.forEach(file => {
        formDataToSend.append('archivos', file);
      });

      await axios.post(endpoint, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Refrescar los datos del ticket y seguimientos
      const [ticketRes, seguimientosRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/usuarios/tickets/${id}`),
        axios.get(`${API_BASE_URL}/usuarios/tickets/${id}/seguimientos`)
      ]);

      setTicket(ticketRes.data);
      setSeguimientos(seguimientosRes.data);
      setSolutionFormData({ descripcion: "", archivos: [] });
      setShowSolutionForm(false);

      setSuccessMessage(
        selectedOption === "solucion"
          ? "Solución guardada. El ticket se ha cerrado."
          : "Seguimiento guardado correctamente."
      );

      if (selectedOption === "solucion") {
        navigate(`/EncuestaSatisfaccion/${id}`);
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      setError("Error al procesar la solicitud");
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccessMessage(""), 3000);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);

      if (!ticket.titulo || !ticket.descripcion) {
        setError("Título y descripción son campos obligatorios");
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/usuarios/tickets/${id}/actualizar`,
        ticket
      );

      setTicket(response.data);
      setSuccessMessage("Cambios guardados correctamente");
      setIsEditing(false);
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      setError(error.response?.data?.message || "Error al guardar cambios");
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccessMessage(""), 3000);
      setTimeout(() => setError(null), 3000);
    }
  };

  const formatDateTimeForInput = (dateString) => {
    if (!dateString) return "";

    if (dateString.includes("T")) {
      return dateString.substring(0, 16);
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const pad = (num) => num.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  if (loading) {
    return (
      <MenuVertical>
        <div className={styles.loading}>Cargando ticket...</div>
      </MenuVertical>
    );
  }

  return (
    <MenuVertical>
      <div className={styles.containerColumnas}>
        <div className={styles.containersolucion}>
          <h1 className={styles.title}>Solución del Ticket #{ticket.id}</h1>

          {isLoading && <div className={styles.loadingIndicator}>Guardando cambios...</div>}
          {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.mainLayout}>
            {/* Columna izquierda - Información del ticket */}
            <div className={styles.ticketInfoContainer}>
              <div className={styles.header}>
                <h3>Información del Ticket</h3>
                {!isEditing && isAdminOrTech && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className={styles.editButton}
                    disabled={isLoading}
                  >
                    Editar
                  </button>
                )}
              </div>

              <div className={styles.verticalForm}>
                <h4>Datos del Ticket</h4>

                <div className={styles.formGroup}>
                  <label className={styles.fecha}>Fecha de apertura:</label>
                  <input
                    type="datetime-local"
                    name="fechaApertura"
                    value={formatDateTimeForInput(ticket.fechaApertura)}
                    onChange={handleTicketInfoChange}
                    disabled={!isEditing || !isAdminOrTech}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tipo:</label>
                  <select
                    name="tipo"
                    value={ticket.tipo}
                    onChange={handleTicketInfoChange}
                    disabled={!isEditing || !isAdminOrTech}
                  >
                    <option value="incidencia">Incidencia</option>
                    <option value="requerimiento">Requerimiento</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Categoría:</label>
                  <select
                    name="categoria"
                    value={ticket.categoria}
                    onChange={handleTicketInfoChange}
                    disabled={!isEditing || !isAdminOrTech}
                  >
                    <option value="">Seleccione...</option>
                    {categorias?.map((categoria) => (
                      <option key={categoria.id_categoria} value={categoria.id_categoria}>
                        {categoria.nombre_categoria}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Estado:</label>
                  <select
                    name="estado"
                    value={ticket.estado}
                    onChange={handleTicketInfoChange}
                    disabled={!isEditing || !isAdminOrTech}
                  >
                    <option value="nuevo">Nuevo</option>
                    <option value="en-curso">En curso</option>
                    <option value="en-espera">En espera</option>
                    <option value="resuelto">Resuelto</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Prioridad:</label>
                  <select
                    name="prioridad"
                    value={ticket.prioridad}
                    onChange={handleTicketInfoChange}
                    disabled={!isEditing || !isAdminOrTech}
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Ubicación:</label>
                  <input
                    type="text"
                    name="ubicacion"
                    value={ticket.ubicacion}
                    onChange={handleTicketInfoChange}
                    disabled={!isEditing || !isAdminOrTech}
                  />
                </div>

                <h4>Asignaciones</h4>

                <div className={styles.formGroup}>
                  <label>Solicitante:</label>
                  <input
                    type="text"
                    name="solicitante"
                    value={ticket.solicitante}
                    onChange={handleTicketInfoChange}
                    disabled={!isEditing || !isAdminOrTech}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Observador:</label>
                  <input
                    type="text"
                    name="observador"
                    value={ticket.observador}
                    onChange={handleTicketInfoChange}
                    disabled={!isEditing || !isAdminOrTech}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Asignado a:</label>
                  {isAdminOrTech ? (
                    <select
                      name="asignadoA"
                      value={ticket.asignadoA}
                      onChange={handleTicketInfoChange}
                      disabled={!isEditing || !isAdminOrTech}
                    >
                      <option value="">Seleccionar técnico</option>
                      {tecnicos.map((tec) => (
                        <option key={tec.id} value={tec.nombre}>
                          {tec.nombre}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" value={ticket.asignadoA} disabled />
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Grupo asignado:</label>
                  {isAdminOrTech ? (
                    <select
                      name="grupoAsignado"
                      value={ticket.grupoAsignado}
                      onChange={handleTicketInfoChange}
                      disabled={!isEditing || !isAdminOrTech}
                    >
                      <option value="">Seleccionar grupo</option>
                      {grupos.map((grupo) => (
                        <option key={grupo.id} value={grupo.nombre}>
                          {grupo.nombre}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" value={ticket.grupoAsignado} disabled />
                  )}
                </div>
              </div>

              {isEditing && isAdminOrTech && (
                <div className={styles.actions}>
                  <button
                    onClick={handleSaveChanges}
                    className={styles.saveButton}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className={styles.cancelButton}
                    disabled={isLoading}
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </div>

            {/* Columna central - Contenido principal */}
            <div className={styles.mainContentContainer}>
              <div className={styles.ticketInfo}>
                <div className={styles.ticketHeader}>
                  {isEditing ? (
                    <input
                      type="text"
                      name="titulo"
                      value={ticket.titulo}
                      onChange={handleTicketInfoChange}
                      className={styles.editInput}
                    />
                  ) : (
                    <span className={styles.ticketTitle}>{ticket.titulo}</span>
                  )}

                  {isEditing ? (
                    <select
                      name="prioridad"
                      value={ticket.prioridad}
                      onChange={handleTicketInfoChange}
                      className={styles.editSelect}
                      data-priority={ticket.prioridad.toLowerCase()}
                    >
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baja">Baja</option>
                    </select>
                  ) : (
                    <span
                      className={styles.ticketPriority}
                      data-priority={ticket.prioridad.toLowerCase()}
                    >
                      {ticket.prioridad}
                    </span>
                  )}
                </div>

                <div className={styles.ticketDescription}>
                  {isEditing ? (
                    <textarea
                      name="descripcion"
                      value={ticket.descripcion}
                      onChange={handleTicketInfoChange}
                      className={styles.editTextarea}
                    />
                  ) : (
                    <p>{ticket.descripcion}</p>
                  )}
                </div>

                <div className={styles.ticketMeta}>
                  <div>
                    <strong>Solicitante:</strong> {ticket.solicitante}
                  </div>
                  <div>
                    <strong>Fecha apertura:</strong> {ticket.fechaApertura}
                  </div>
                  <div>
                    <strong>Última actualización:</strong>{" "}
                    {ticket.ultimaActualizacion}
                  </div>
                  <div>
                    <strong>Categoría:</strong>
                    {isEditing ? (
                      <input
                        type="text"
                        name="categoria"
                        value={ticket.categoria}
                        onChange={handleTicketInfoChange}
                        className={styles.editInput}
                      />
                    ) : (
                      ticket.categoria
                    )}
                  </div>
                </div>

                <div className={styles.ticketActions}>
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveChanges}
                        className={styles.saveButton}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className={styles.cancelButtons}
                        disabled={isLoading}
                      >
                        Cerrar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className={styles.editButton}
                      disabled={isLoading}
                    >
                      Editar
                    </button>
                  )}
                </div>
              </div>

              {/* Mostrar seguimientos existentes */}
              <div className={styles.seguimientosContainer}>
                <h3 className={styles.seguimientosTitle}>
                  {seguimientos.length > 0 ? 'Historial de Seguimientos' : 'No hay seguimientos aún'}
                </h3>
                {seguimientos.map((seguimiento, index) => (
                  <SeguimientoItem key={index} seguimiento={seguimiento} />
                ))}
              </div>

              {/* Botón de opciones y formulario */}
              <div className={styles.optionsContainers}>
                <button
                  className={styles.optionsButtons}
                  onClick={() => setShowOptions(!showOptions)}
                >
                  Acciones
                  <span className={styles.arrowIcon}>
                    {showOptions ? '▲' : '▼'}
                  </span>
                </button>

                {showOptions && (
                  <div className={styles.optionsDropdowns}>
                    <button
                      className={styles.optionItems}
                      onClick={() => handleOptionSelect('solucion')}
                    >
                      Agregar solución
                    </button>

                    <button
                      className={styles.optionItems}
                      onClick={() => handleOptionSelect('seguimiento')}
                    >
                      Seguimiento
                    </button>
                  </div>
                )}
              </div>

              {showSolutionForm && (
                <div className={styles.solutionForms}>
                  <h3>
                    {selectedOption === 'solucion' ? 'Agregar Solución' : 'Agregar Seguimiento'}
                  </h3>

                  <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                      <label>Descripción:</label>
                      <textarea
                        className={styles.textarea}
                        placeholder={
                          selectedOption === 'solucion'
                            ? 'Describa la solución al problema...'
                            : 'Agregue detalles del seguimiento...'
                        }
                        value={solutionFormData.descripcion}
                        onChange={(e) => setSolutionFormData({
                          ...solutionFormData,
                          descripcion: e.target.value
                        })}
                        rows="5"
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Archivos adjuntos:</label>
                      <input
                        type="file"
                        multiple
                        onChange={handleSolutionFileChange}
                        className={styles.fileInput}
                      />
                      {solutionFormData.archivos.length > 0 && (
                        <div className={styles.fileList}>
                          <strong>Archivos seleccionados:</strong>
                          <ul>
                            {solutionFormData.archivos.map((file, index) => (
                              <li key={index} className={styles.fileItem}>
                                {file.name}
                                <button
                                  type="button"
                                  onClick={() => removeSolutionFile(index)}
                                  className={styles.removeFileButton}
                                >
                                  ×
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className={styles.formActions}>
                      <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Procesando...' : 'Guardar'}
                      </button>
                      <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={() => {
                          setShowSolutionForm(false);
                          setSolutionFormData({ descripcion: "", archivos: [] });
                        }}
                        disabled={isLoading}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Columna derecha - Opciones del ticket */}
            <div className={styles.optionsContainer}>
              <h3>Opciones del Ticket</h3>

              <div className={styles.optionGroup}>
                <label className={styles.optionLabel}>Casos</label>
                <div className={styles.optionContent}>
                  <Link
                    to="/tickets/solucion/:id"
                    className={styles.optionLink}
                  >
                    Caso Actual
                  </Link>
                </div>
              </div>

              <div className={styles.optionGroup}>
                <label className={styles.optionLabel}>
                  Encuesta de satisfacción
                </label>
                <div className={styles.optionContent}>
                  <Link
                    to="/EncuestaSatisfaccion/:surveyId"
                    className={styles.optionLink}
                  >
                    Encuesta
                  </Link>
                </div>
              </div>

              <div className={styles.optionGroup}>
                <label className={styles.optionLabel}>Histórico</label>
                <div className={styles.optionContent}>
                  <Link
                    to={`/tickets/${ticket.id}/historial`}
                    className={styles.optionLink}
                  >
                    <FaHistory /> Historial
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ChatBot />
    </MenuVertical>
  );
};

export default SolucionTickets;