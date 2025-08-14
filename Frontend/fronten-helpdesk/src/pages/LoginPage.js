import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Imagen from "../imagenes/logo proyecto color.jpeg";
import styles from "../styles/LoginPage.module.css"; 

const Login = () => {
  const navigate = useNavigate();
  const [usuario, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // 1. Verificar estado del usuario
      const estadoResponse = await axios.get(
        `http://localhost:5000/usuarios/verificar-estado/${usuario}`
      );
      
      if (estadoResponse.data.estado === 'inactivo') {
        setMessage('Este usuario está inactivo. Contacte al administrador.');
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
        localStorage.setItem("nombre_usuario", usuario); // Para verificación periódica

        if (rol === "usuario") {
          navigate("/home");
        } else if (rol === "administrador") {
          navigate("/HomeAdmiPage");
        } else if (rol === "tecnico") {
          navigate("/HomeTecnicoPage");
        } else {
          alert("Sin rol para ingresar");
          window.location.reload();
        }
      }
    } catch (error) {
      // Manejo de errores
      if (error.response?.status === 403) {
        setMessage('Usuario inactivo. Contacte al administrador.');
      } else if (error.response?.status === 401) {
        setMessage("Usuario o contraseña incorrectos");
      } else {
        setMessage("Error al conectar con el servidor");
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

        {message && <p className={styles.mensaje}>{message}</p>}
      </div>
      <p>Transformando la atención al cliente con inteligencia y eficiencia.</p>
    </div>
  );
};

export default Login;
