import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaRegClock, FaCheckCircle, FaHistory } from "react-icons/fa";
import styles from "../styles/SolucionTickets.module.css";
import ChatBot from "../Componentes/ChatBot";
import MenuVertical from "../Componentes/MenuVertical";

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


  const userRole = localStorage.getItem("rol");
  const isAdminOrTech = ["administrador", "tecnico"].includes(userRole);
  const isUser = userRole === "usuario";

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const ticketRes = await axios.get(
          `http://localhost:5000/usuarios/tickets/${id}`
        );
        console.log("Ticket recibido:", ticketRes.data);
        setTicket(ticketRes.data);

        const categoriasRes = await axios.get(
          "http://localhost:5000/usuarios/obtenerCategorias"
        );
        setCategorias(categoriasRes.data);

        setLoading(false);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setTicket({
          id: id || "TKT-001",
          titulo: "Problema con el sistema de impresión",
          descripcion:
            "El sistema no imprime correctamente los documentos largos",
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
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id]);

  const handleAgregarSeguimiento = async () => {
    if (!nuevoSeguimiento.trim()) return;

    try {
      await axios.post(`http://localhost:5000/api/tickets/${id}/seguimientos`, {
        descripcion: nuevoSeguimiento,
        usuario: localStorage.getItem("nombre"),
      });

      const response = await axios.get(
        `http://localhost:5000/api/tickets/${id}/seguimientos`
      );
      setSeguimientos(response.data);
      setNuevoSeguimiento("");
    } catch (error) {
      console.error("Error al agregar seguimiento:", error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!solucion.trim()) {
      alert("Por favor ingrese la solución");
      return;
    }

    console.log({
      ticketId: id,
      solucion,
      accion,
      fecha: new Date().toISOString(),
    });

    if (accion === "solucion") {
      alert(
        "Solución guardada. El ticket se ha cerrado y se enviará una encuesta de satisfacción."
      );
      navigate(`/EncuestaSatisfaccion/${id}`);
    } else {
      alert("Seguimiento guardado. El ticket permanece abierto.");
    }

    navigate("/Tickets");
  };

  const handleSurveySubmit = (e) => {
    e.preventDefault();
    alert(
      `Encuesta enviada: ${surveyRating} estrellas, Comentario: ${surveyComment}`
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTicket((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await axios.put(`http://localhost:5000/api/tickets/${id}`, ticket);
      setSuccessMessage("Cambios guardados correctamente");
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      alert("Error al guardar cambios");
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

          <div className={styles.layoutContainer}>
            {/* Columna izquierda - Información del ticket */}
            <div className={styles.ticketInfoContainer}>
              <div className={styles.header}>
                <h3>Información del Ticket</h3>
                {!isEditing && isAdminOrTech && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className={styles.editButton}
                  >
                    Editar
                  </button>
                )}
              </div>

              {successMessage && (
                <div className={styles.successMessage}>{successMessage}</div>
              )}

              <div className={styles.verticalForm}>
                <h4>Datos del Ticket</h4>

                <div className={styles.formGroup}>
                  <label className={styles.fecha}>Fecha de apertura:</label>
                  <input
                    type="datetime-local"
                    name="fechaApertura"
                    value={formatDateTimeForInput(ticket.fechaApertura)}
                    onChange={handleChange}
                    disabled={!isEditing || !isAdminOrTech}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tipo:</label>
                  <select
                    name="tipo"
                    value={ticket.tipo}
                    onChange={handleChange}
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
                    onChange={handleChange}
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
                    onChange={handleChange}
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
                    onChange={handleChange}
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
                    onChange={handleChange}
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
                    onChange={handleChange}
                    disabled={!isEditing || !isAdminOrTech}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Observador:</label>
                  <input
                    type="text"
                    name="observador"
                    value={ticket.observador}
                    onChange={handleChange}
                    disabled={!isEditing || !isAdminOrTech}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Asignado a:</label>
                  {isAdminOrTech ? (
                    <select
                      name="asignadoA"
                      value={ticket.asignadoA}
                      onChange={handleChange}
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
                      onChange={handleChange}
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
                  <button onClick={handleSave} className={styles.saveButton}>
                    Guardar Cambios
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className={styles.cancelButton}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            {/* Columna central - Contenido principal */}
            <div className={styles.mainContentContainer}>
              <div className={styles.ticketInfo}>
                <div className={styles.ticketHeader}>
                  <span className={styles.ticketTitle}>{ticket.titulo}</span>
                  <span
                    className={styles.ticketPriority}
                    data-priority={ticket.prioridad.toLowerCase()}
                  >
                    {ticket.prioridad}
                  </span>
                </div>

                <div className={styles.ticketDescription}>
                  <p>{ticket.descripcion}</p>
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
                    <strong>Categoría:</strong> {ticket.categoria}
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Acción a realizar:</label>
                <div className={styles.buttonRadioGroup}>
                  <button
                    type="button"
                    className={`${styles.actionButton} ${
                      accion === "seguimiento" ? styles.active : ""
                    }`}
                    onClick={() => setAccion("seguimiento")}
                  >
                    <div className={styles.buttonContent}>
                      <FaRegClock className={styles.buttonIcon} />
                      <div>
                        <div className={styles.buttonTitle}>Seguimiento</div>
                        <div className={styles.buttonSubtitle}>
                          El ticket permanece abierto
                        </div>
                      </div>
                    </div>
                  </button>

                  {isAdminOrTech && (
                    <button
                      type="button"
                      className={`${styles.actionButton} ${
                        accion === "solucion" ? styles.active : ""
                      }`}
                      onClick={() => setAccion("solucion")}
                    >
                      <div className={styles.buttonContent}>
                        <FaCheckCircle className={styles.buttonIcon} />
                        <div>
                          <div className={styles.buttonTitle}>Solución</div>
                          <div className={styles.buttonSubtitle}></div>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className={styles.solutionForm}>
                <h2 className={styles.solutionTitle}>Seguimiento </h2>

                <div className={styles.formGroup}>
                  <label htmlFor="solucion" className={styles.label}>
                    Detalle de la solución o seguimiento:
                  </label>
                  <textarea
                    id="solucion"
                    value={solucion}
                    onChange={(e) => setSolucion(e.target.value)}
                    required
                    className={styles.textarea}
                    placeholder="Describa la solución aplicada o los pasos realizados..."
                    disabled={!isAdminOrTech && !isUser} // Permitir a todos los roles editar
                  />
                </div>

                <div className={styles.buttonGroup}>
                  {isAdminOrTech && (
                    <>
                      <button type="submit" className={styles.submitButton}>
                        {accion === "solucion"
                          ? "Cerrar Ticket con Solución"
                          : "Guardar Seguimiento"}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/EncuestaSatisfaccion/:surveyId")}
                        className={styles.cancelButton}
                      >
                        Caso Gestionado
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>

            {/* Columna derecha - Opciones adicionales */}
            <div className={styles.optionsColumn}>
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
      </div>
      <ChatBot />
    </MenuVertical>
  );
};

export default SolucionTickets;