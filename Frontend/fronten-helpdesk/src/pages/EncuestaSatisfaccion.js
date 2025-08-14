import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaMagnifyingGlass, FaPowerOff } from "react-icons/fa6";
import { FiAlignJustify } from "react-icons/fi";
import { FcHome, FcAssistant, FcBusinessman, FcAutomatic, FcAnswers, FcCustomerSupport } from "react-icons/fc";
import { FaRegClock, FaCheckCircle, FaHistory } from "react-icons/fa";
import styles from '../styles/EncuestaSatisfaccion.module.css';
import Logo from "../imagenes/logo proyecto color.jpeg";
import Logoempresarial from "../imagenes/logo empresarial.png";

const EncuestaSatisfaccion = () => {
  // Estados del componente
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  // Estados del formulario
  const [calificacion, setCalificacion] = useState("");
  const [comentario, setComentario] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para los modales
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const nombre = localStorage.getItem("nombre");
  const userRole = localStorage.getItem("rol");

  // Función para enviar la encuesta
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!calificacion) {
      setModalMessage("Por favor seleccione una calificación");
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `http://localhost:5000/api/encuestasatisfaccion`,
        {
          ticketId: surveyId,
          calificacion: parseInt(calificacion),
          comentario,
          fecha: new Date().toISOString(),
          usuario: nombre || "Anónimo"
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      if (response.status === 200) {
        setModalMessage("¡Gracias por tu feedback! La encuesta ha sido enviada correctamente.");
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error("Error al enviar encuesta:", err);
      setModalMessage(err.response?.data?.message || "Error al enviar la encuesta");
      setShowErrorModal(true);
      
      if (err.response?.status === 401) {
        setTimeout(() => navigate("/Tickets"), 3000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cerrar modales
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    navigate("/Tickets");
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
  };

  return (
    <div className={styles.containerPrincipal}>
      {/* Contenido principal */}
      <div
        className={styles.containerColumnas}
        style={{ marginLeft: isMenuExpanded ? "200px" : "60px" }}
      >
        <div className={styles.encuestaContainer}>
          <h1>Encuesta de Satisfacción - Ticket #{surveyId}</h1>
          
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>¿Cómo calificaría el servicio recibido?</label>
              <select 
                value={calificacion}
                onChange={(e) => setCalificacion(e.target.value)}
                required
                className={modalMessage && !calificacion ? styles.errorInput : ""}
                disabled={isSubmitting}
              >
                <option value="">Seleccione una calificación...</option>
                <option value="5">Excelente (5)</option>
                <option value="4">Muy Bueno (4)</option>
                <option value="3">Bueno (3)</option>
                <option value="2">Regular (2)</option>
                <option value="1">Deficiente (1)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Comentarios adicionales:</label>
              <textarea
                rows="4"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="(Opcional) ¿Algo que nos quieras comentar sobre el servicio recibido?"
                disabled={isSubmitting}
              />
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.loadingSpinner}></span>
                  Enviando...
                </>
              ) : "Enviar Encuesta"}
            </button>
          </form>
        </div>
      </div>

      {/* Modal de éxito */}
      {showSuccessModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Encuesta Enviada</h3>
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
    </div>
  );
};

export default EncuestaSatisfaccion;