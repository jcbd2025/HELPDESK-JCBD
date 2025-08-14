import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UserStatusChecker = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserStatus = async () => {
      const nombre_usuario = localStorage.getItem('nombre_usuario');
      
      if (nombre_usuario) {
        try {
          const response = await axios.get(
            `http://localhost:5000/usuarios/verificar-estado/${nombre_usuario}`
          );
          
          if (response.data.estado === 'inactivo') {
            localStorage.clear();
            navigate('/login');
            alert('Tu cuenta ha sido desactivada. Por favor contacta al administrador.');
          }
        } catch (error) {
          console.error('Error al verificar estado:', error);
          if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.clear();
            navigate('/login');
          }
        }
      }
    };
    
    // Verificar inmediatamente
    checkUserStatus();
    
    // Configurar verificación periódica cada 5 minutos
    const interval = setInterval(checkUserStatus, 300000);
    
    return () => clearInterval(interval);
  }, [navigate]);

  return null;
};

export default UserStatusChecker;