import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Imagen from "../imagenes/logo proyecto color.jpeg";
import styles from "../styles/LoginPage.module.css"; 

const Login = () => {
  const navigate = useNavigate();
  const [usuario, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Estados para el modal
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState(""); // "error", "warning", "info"

  const showNotificationModal = (title, message, type) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Verificar estado del usuario
      const estadoResponse = await axios.get(
        `http://localhost:5000/usuarios/verificar-estado/${usuario}`
      );
      
      if (estadoResponse.data.estado === 'inactivo') {
        showNotificationModal(
          "Usuario Inactivo", 
          "Este usuario está inactivo. Contacte al administrador.", 
          "warning"
        );
        setLoading(false);
        return;
      }

      // 2. Si está activo, proceder con el login
      const response = await axios.post("http://127.0.0.1:5000/auth/login", {
        usuario,
        password,
      });
      
      if (response.status === 200) {
        const { nombre, usuario, rol, id_usuario } = response.data;
        localStorage.setItem("id_usuario", id_usuario);
        localStorage.setItem("nombre", nombre);
        localStorage.setItem("usuario", usuario);
        localStorage.setItem("rol", rol);
        localStorage.setItem("nombre_usuario", usuario);

        if (rol === "usuario") {
          navigate("/home");
        } else if (rol === "administrador") {
          navigate("/HomeAdmiPage");
        } else if (rol === "tecnico") {
          navigate("/HomeTecnicoPage");
        } else {
          showNotificationModal(
            "Error de Rol", 
            "No tiene un rol válido asignado", 
            "error"
          );
        }
      }
    } catch (error) {
      // Manejo de errores
      if (error.response?.status === 403) {
        showNotificationModal(
          "Usuario Inactivo", 
          "Este usuario está inactivo. Contacte al administrador.", 
          "warning"
        );
      } else if (error.response?.status === 401) {
        showNotificationModal(
          "Credenciales Incorrectas", 
          "Usuario o contraseña incorrectos", 
          "error"
        );
      } else if (error.code === "ERR_NETWORK") {
        showNotificationModal(
          "Error de Conexión", 
          "No se pudo conectar con el servidor", 
          "error"
        );
      } else {
        showNotificationModal(
          "Error", 
          "Usuario no existe, comuniquese con el administrador", 
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.Login}>
      <header>
        <img src={Imagen} alt="Logo" className={styles.empresarial} />
        <h1>BIENVENIDOS A HELP DESK JCBD</h1>
      </header>

      <div className={styles.row}>
        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <input
              className={styles.inicio}
              type="text"
              placeholder="USUARIO"
              value={usuario}
              onChange={(e) => setUser(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <input
              className={styles.inicio}
              type="password"
              placeholder="CONTRASEÑA"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <button
              type="submit"
              className={styles.buttonLogin}
              disabled={loading}
            >
              {loading ? "Cargando..." : "Aceptar"}
            </button>
          </div>
        </form>

        {/* Modal de notificación */}
        {showModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3 className={
                  modalType === "error" ? styles.modalErrorTitle : 
                  modalType === "warning" ? styles.modalWarningTitle : 
                  styles.modalInfoTitle
                }>
                  {modalTitle}
                </h3>
                <button 
                  onClick={closeModal} 
                  className={styles.modalCloseButton}
                >
                  &times;
                </button>
              </div>
              
              <div className={styles.modalBody}>
                <div className={
                  modalType === "error" ? styles.errorIcon : 
                  modalType === "warning" ? styles.warningIcon : 
                  styles.infoIcon
                }>
                  {modalType === "error" ? (
                    <svg viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z" />
                    </svg>
                  ) : modalType === "warning" ? (
                    <svg viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12 2L1 21h22M12 6l7.53 13H4.47M11 10v4h2v-4m-2 6v2h2v-2" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24">
                      <path fill="currentColor" d="M11 9h2V7h-2m1 13c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8m0-18A10 10 0 002 12a10 10 0 0010 10 10 10 0 0010-10A10 10 0 0012 2m-1 15h2v-6h-2v6z" />
                    </svg>
                  )}
                </div>
                <p>{modalMessage}</p>
                
                <div className={styles.modalActions}>
                  <button
                    onClick={closeModal}
                    className={
                      modalType === "error" ? styles.modalButtonError : 
                      modalType === "warning" ? styles.modalButtonWarning : 
                      styles.modalButtonInfo
                    }
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <p>Transformando la atención al cliente con inteligencia y eficiencia.</p>
    </div>
  );
};

export default Login;