import { createContext, useState, useEffect, useContext } from "react";

import "../styles/NotificationContext.module.css";
export const NotificationContext = createContext();

export const useNotification = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = "info") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type, closing: false }]);

    // 🔊 Reproducir sonido
    playSound(type);

    return () => removeNotification(id);
  };

  const removeNotification = (id) => {
    // Marcar como cerrando para activar animación de salida
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, closing: true } : n))
    );

    // Eliminar después del tiempo de animación (400ms)
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 400);
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="notification-container">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            closing={notification.closing}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

const Notification = ({ message, type = "info", closing, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`notification ${type} ${closing ? "hide" : "show"}`}>
      <div className="notification-content">
        <span>{message}</span>
        <button onClick={onClose} className="closeButton">
          &times;
        </button>
      </div>
    </div>
  );
};

// Función para reproducir sonido
const playSound = (type) => {
  let soundFile;
  switch (type) {
    case "success":
      soundFile = "/sounds/success.mp3";
      break;
    case "error":
      soundFile = "/sounds/error.mp3";
      break;
    case "warning":
      soundFile = "/sounds/warning.mp3";
      break;
    default:
      soundFile = "/sounds/info.mp3";
  }

  const audio = new Audio(soundFile);
  audio.play().catch(() => {});
};
