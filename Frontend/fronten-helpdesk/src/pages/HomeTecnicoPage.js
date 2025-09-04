import React, { useState, useContext } from "react";
import { Link, Outlet } from "react-router-dom";
import { FaMagnifyingGlass, FaPowerOff } from "react-icons/fa6";
import { FiAlignJustify } from "react-icons/fi";
import { FcHome, FcAssistant, FcBusinessman, FcAutomatic, FcAnswers, FcCustomerSupport, FcExpired, FcGenealogy, FcBullish, FcConferenceCall, FcPortraitMode, FcOrganization } from "react-icons/fc";
import styles from "../styles/HomeAdmiPage.module.css";
import ChatBot from "../Componentes/ChatBot";
import { NotificationContext } from "../context/NotificationContext";
import MenuVertical from "../Componentes/MenuVertical";

const HomeTecnicoPage = () => {

    // Obtener datos del usuario
  const userRole = localStorage.getItem("rol") || "usuario";
  const nombre = localStorage.getItem("nombre");
  const userId = localStorage.getItem("id_usuario");
  const { addNotification } = useContext(NotificationContext);


  // Estados
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeView, setActiveView] = useState("personal");
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);


  // Datos
  const tickets = [
{ label: "Nuevo", color: "green", icon: "🟢", count: 0 },
    { label: "En curso", color: "lightgreen", icon: "⏳", count: 0 },
    { label: "En espera", color: "orange", icon: "🟡", count: 0 },
    { label: "Resueltos", color: "gray", icon: "✔️", count: 0 },
    { label: "Cerrado", color: "black", icon: "✅", count: 0 },
    { label: "Borrado", color: "red", icon: "🗑", count: 0 },
    { label: "Encuesta", color: "purple", icon: "📅", count: 0 },
    { label: "Abiertos", color: "#4CAF50", icon: "📝", count: 0 },
    { label: "Pendientes", color: "#FF5722", icon: "⚠️", count: 0},
  ];


  // Handlers

  const toggleChat = () => setIsChatOpen(!isChatOpen);

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

  const handleSelectChange = (event) => {
    const value = event.target.value;
    setActiveView(value === "0" ? "personal" : value === "1" ? "global" : "todo");
  };

  const toggleMenu = () => setIsMenuExpanded(!isMenuExpanded);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const roleToPath = {
    usuario: '/home',
    tecnico: '/HomeTecnicoPage',
    administrador: '/HomeAdmiPage'
  };


  return (
    <MenuVertical>
      <>


        {/* Contenido Principal */}
        <div className={styles.containerHomeAdmiPage}>
          <main>
            <div className={styles.flexColumna}>
              <div className={styles.row}>
                <div className={styles.col}>
                  <div className={styles.flexColumnHorizontal}>
                    <div className={styles.viewButtonsContainer}>
                      <button
                        className={`${styles.viewButton} ${activeView === "personal" ? styles.active : ""}`}
                        onClick={() => setActiveView("personal")}
                      >
                        Vista Personal
                      </button>
                      <button
                        className={`${styles.viewButton} ${activeView === "global" ? styles.active : ""}`}
                        onClick={() => setActiveView("global")}
                      >
                        Vista Global
                      </button>
                      <button
                        className={`${styles.viewButton} ${activeView === "todo" ? styles.active : ""}`}
                        onClick={() => setActiveView("todo")}
                      >
                        Todo
                      </button>
                    </div>
                    <select className={`${styles.viewSelect} form-select`} onChange={handleSelectChange}>
                      <option value={0}>Vista Personal</option>
                      <option value={1}>Vista Global</option>
                      <option value={2}>Todo</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="app-container">
              {/* Vista Personal */}
              {(activeView === "personal" || activeView === "todo") && (
                <>
                  <div className={styles.tablaContainer}>
                    <h2>SUS CASOS A CERRAR</h2>
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>SOLICITANTE</th>
                          <th>ELEMENTOS ASOCIADOS</th>
                          <th>DESCRIPCIÓN</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>ID: 2503160091</td>
                          <td>Santiago Caricena Corredor</td>
                          <td>General</td>
                          <td>NO LE PERMITE REALIZA NINGUNA ACCIÓN - USUARIO TEMPORAL (1 - 0)</td>
                        </tr>
                        <tr>
                          <td>ID: 2503160090</td>
                          <td>Santiago Caricena Corredor</td>
                          <td>General</td>
                          <td>CONFIGURAR IMPRESORA (1 - 0)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className={styles.tablaContainer}>
                    <h2>SUS CASOS EN CURSO</h2>
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>SOLICITANTE</th>
                          <th>ELEMENTOS ASOCIADOS</th>
                          <th>DESCRIPCIÓN</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>ID: 2503160088</td>
                          <td>HUN HUN Generico</td>
                          <td>General</td>
                          <td>LLAMOO DE TIMBRES (1 - 0)</td>
                        </tr>
                        <tr>
                          <td>ID: 2503160088</td>
                          <td>Wendy Johanna Alfonso Peralta</td>
                          <td>General</td>
                          <td>CONFIGURAR IMPRESORA (1 - 0)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className={styles.tablaContainer}>
                    <h2>ENCUESTA DE SATISFACCIÓN</h2>
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>SOLICITANTE</th>
                          <th>ELEMENTOS ASOCIADOS</th>
                          <th>DESCRIPCIÓN</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>ID: 2503150021</td>
                          <td>Julian Antonio Niño Oedoy</td>
                          <td>General</td>
                          <td>ALTA MEDICA (1 - 0)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Vista Global */}
              {(activeView === "global" || activeView === "todo") && (
                <>
                  <div className={styles.sectionContainer}>
                    <h2>Tickets</h2>
                    <div className={styles.cardsContainer}>
                      {tickets.map((ticket, index) => (
                        <div key={index} className={styles.card} style={{ borderColor: ticket.color }}>
                          <span className="icon">{ticket.icon}</span>
                          <span className="label">{ticket.label}</span>
                          <span className="count">{ticket.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>


                </>
              )}
            </div>
          </main>
        </div>

        <ChatBot />
      </>
    </MenuVertical>
  );
};

export default HomeTecnicoPage;