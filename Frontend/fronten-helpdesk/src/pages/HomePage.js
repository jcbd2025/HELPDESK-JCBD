import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FcCustomerSupport } from "react-icons/fc";
import ChatBot from "../Componentes/ChatBot";
import styles from "../styles/HomePage.module.css";
import MenuVertical from "../Componentes/MenuVertical";

const HomePage = () => {
  // Obtener datos del usuario
  const userRole = localStorage.getItem("rol") || "usuario";
  const userId = localStorage.getItem("id_usuario");
  console.log("verificando el userId:", userId);
  
  const navigate = useNavigate();
  const [tableData, setTableData] = useState({
    nuevo: [],
    enCurso: [],
    enEspera: [],
    resueltos: [],
    cerrados: [],
    borrados: [],
    encuesta: [],
   
    pendientes: [],
  });

  const [activeTab, setActiveTab] = useState(null);
  const [completedSurveys, setCompletedSurveys] = useState([]);

  const handleTicketClick = (ticket) => {
    const editRoute = userRole === "usuario" ? "/CrearCasoUse" : "/CrearCasoAdmin";
    navigate(editRoute, {
      state: {
        ticketData: ticket,
        mode: "edit",
      },
    });
  };

  const markSurveyAsCompleted = (surveyId) => {
    setCompletedSurveys([...completedSurveys, surveyId]);
  };

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/usuarios/estado_tickets", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            usuario_id: userId,
            rol: userRole
          }
        });

        const agrupados = {
          nuevo: [],
          enCurso: [],
          enEspera: [],
          resueltos: [],
          cerrados: [],
          borrados: [],
          encuesta: [],
        
          pendientes: [],
        };

        response.data.forEach((ticket) => {
          const estado = ticket.estado?.toLowerCase() || ticket.estado_ticket?.toLowerCase();

          let estadoFrontend;
          switch (estado) {
            case 'nuevo':
            case 'new':
              estadoFrontend = 'nuevo';
              break;
            case 'en_curso':
            case 'en_proceso':
            case 'proceso':
              estadoFrontend = 'enCurso';
              break;
            case 'en_espera':
            case 'espera':
              estadoFrontend = 'enEspera';
              break;
            case 'resuelto':
            case 'solucionado':
              estadoFrontend = 'resueltos';
              break;
            case 'cerrado':
              estadoFrontend = 'cerrados';
              break;
            case 'borrado':
            case 'eliminado':
              estadoFrontend = 'borrados';
              break;
            
            case 'pendiente':
              estadoFrontend = 'pendientes';
              break;
            case 'encuesta':
              estadoFrontend = 'encuesta';
              break;
            default:
              estadoFrontend = estado;
          }

          if (estadoFrontend && agrupados[estadoFrontend] !== undefined) {
            agrupados[estadoFrontend].push({
              id: ticket.id || ticket.id_ticket,
              solicitante: ticket.solicitante || ticket.nombre_completo,
              descripcion: ticket.descripcion,
              titulo: ticket.titulo,
              prioridad: ticket.prioridad,
              fecha_creacion: ticket.fecha_creacion,
              tecnico: ticket.tecnico || ticket.asignadoA || 'Sin asignar'
            });
          }
        });

        setTableData(agrupados);
      } catch (error) {
        console.error("Error al obtener los tickets:", error);
      }
    };

    fetchTickets();
  }, [userId, userRole]);

  const renderTable = (data, title) => {
    if (!data || data.length === 0) {
      return (
        <div className={styles.tablaContainer}>
          <h2>{title.toUpperCase()}</h2>
          <p>No hay tickets en este estado.</p>
        </div>
      );
    }

    return (
      <div className={styles.tablaContainer}>
        <h2>{title.toUpperCase()}</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>SOLICITANTE</th>
              <th>DESCRIPCIÓN</th>
              <th>PRIORIDAD</th>
              <th>TÉCNICO ASIGNADO</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={index}
                onClick={() => handleTicketClick(item)}
                className={styles.clickableRow}
              >
                <td>#{item.id}</td>
                <td>{item.solicitante}</td>
                <td>{item.descripcion}</td>
                <td>
                  <span className={`${styles.priority} ${styles[item.prioridad?.toLowerCase()] || ''}`}>
                    {item.prioridad}
                  </span>
                </td>
                <td>{item.tecnico}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSurveyTable = (data, title) => {
    const pendingSurveys = data.filter(
      (survey) => !completedSurveys.includes(survey.id)
    );

    if (pendingSurveys.length === 0) {
      return (
        <div className={styles.tablaContainer}>
          <h2>{title.toUpperCase()}</h2>
          <p>No hay encuestas pendientes.</p>
        </div>
      );
    }

    return (
      <div className={styles.tablaContainer}>
        <h2>{title.toUpperCase()}</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>SOLICITANTE</th>
              <th>DESCRIPCIÓN</th>
              <th>TÉCNICO ASIGNADO</th>
            </tr>
          </thead>
          <tbody>
            {pendingSurveys.map((item, index) => (
              <tr
                key={index}
                onClick={() => {
                  markSurveyAsCompleted(item.id);
                  navigate(`/EncuestaSatisfaccion/${item.id}`);
                }}
                className={styles.clickableRow}
              >
                <td>#{item.id}</td>
                <td>{item.solicitante}</td>
                <td>{item.descripcion}</td>
                <td>{item.tecnico}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const tickets = [
    { label: "Nuevo", color: "green", icon: "🟢", count: tableData.nuevo.length, key: "nuevo" },
    { label: "En curso", color: "lightgreen", icon: "⏳", count: tableData.enCurso.length, key: "enCurso" },
    { label: "En espera", color: "orange", icon: "🟡", count: tableData.enEspera.length, key: "enEspera" },
    { label: "Resueltos", color: "gray", icon: "✔️", count: tableData.resueltos.length, key: "resueltos" },
    { label: "Cerrado", color: "black", icon: "✅", count: tableData.cerrados.length, key: "cerrados" },
    { label: "Encuesta", color: "purple", icon: "📅", count: tableData.encuesta.length, key: "encuesta" },
    
  ];

  const handleTabClick = (tabKey) => {
    setActiveTab(activeTab === tabKey ? null : tabKey);
  };

  const getRouteByRole = (section) => {
    if (section === "inicio") {
      if (userRole === "administrador") return "/HomeAdmiPage";
      if (userRole === "tecnico") return "/HomeTecnicoPage";
      return "/home";
    }
    if (section === "crear-caso") {
      if (["administrador", "tecnico"].includes(userRole)) return "/CrearCasoAdmin";
      return "/CrearCasoUse";
    }
    if (section === "tickets") return "/Tickets";
    return "/";
  };

  return (
    <MenuVertical>
      <>
        {/* Contenido principal */}
        <div className={styles.container}>
          <div className={styles.sectionContainer}>
            <div className={styles.ticketContainer}>
              <li className={styles.creacion}>
                <Link to={getRouteByRole("crear-caso")} className={styles.linkSinSubrayado}>
                  <FcCustomerSupport className={styles.menuIcon} />
                  <span className={styles.creacionDeTicket}>Crear Caso</span>
                </Link>
              </li>
            </div>

            <h2>Tickets</h2>
            <div className={styles.cardsContainer}>
              {tickets.map((ticket, index) => (
                <div
                  key={index}
                  className={`${styles.card} ${activeTab === ticket.key ? styles.activeCard : ""}`}
                  style={{ borderColor: ticket.color }}
                  onClick={() => handleTabClick(ticket.key)}
                >
                  <span className={styles.icon}>{ticket.icon}</span>
                  <span className={styles.label}>{ticket.label}</span>
                  <span className={styles.count}>{ticket.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mostrar la tabla correspondiente al tab activo */}
          {activeTab === "nuevo" && renderTable(tableData.nuevo, "Nuevo")}
          {activeTab === "enCurso" && renderTable(tableData.enCurso, "En curso")}
          {activeTab === "enEspera" && renderTable(tableData.enEspera, "En Espera")}
          {activeTab === "resueltos" && renderTable(tableData.resueltos, "Resueltos")}
          {activeTab === "cerrados" && renderTable(tableData.cerrados, "Cerrados")}
          {activeTab === "borrados" && renderTable(tableData.borrados, "Borrados")}
          {activeTab === "encuesta" && renderSurveyTable(tableData.encuesta, "Encuesta de Satisfacción")}
      
          {activeTab === "pendientes" && renderTable(tableData.pendientes, "Pendientes")}
        </div>
        <ChatBot />
      </>
    </MenuVertical>
  );
};

export default HomePage;