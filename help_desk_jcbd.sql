-- Active: 1744258976597@@127.0.0.1@3306@mysql
DROP DATABASE IF EXISTS help_desk_jcbd;


CREATE DATABASE help_desk_jcbd;

USE help_desk_jcbd;

CREATE TABLE `adjuntos_tickets` (
  `id_adjunto` int(11) NOT NULL,
  `id_ticket1` int(11) NOT NULL,
  `nombre_archivo` varchar(255) NOT NULL,
  `ruta_archivo` varchar(255) NOT NULL,
  `tipo_archivo` varchar(50) DEFAULT NULL,
  `tamano` int(11) DEFAULT NULL COMMENT 'Tamaño en bytes',
  `fecha_subida` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



CREATE TABLE `categorias` (
  `id_categoria` int(11) NOT NULL,
  `nombre_categoria` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



INSERT INTO `categorias` (`id_categoria`, `nombre_categoria`, `descripcion`) VALUES
(1, 'Hardware', 'Problemas relacionados con equipos físicos'),
(2, 'Software', 'Problemas relacionados con programas y sistemas'),
(3, 'Red', 'Problemas de conectividad y redes'),
(4, 'Cuentas', 'Gestión de cuentas y permisos de usuarios');




CREATE TABLE `entidades` (
  `id_entidad` int(11) NOT NULL,
  `nombre_entidad` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


INSERT INTO `entidades` (`id_entidad`, `nombre_entidad`, `descripcion`) VALUES
(1, 'Departamento de TI', 'Departamento de Tecnologías de la Información'),
(2, 'Recursos Humanos', 'Departamento de gestión de personal'),
(3, 'Contabilidad', 'Departamento financiero y contable'),
(4, 'Operaciones', 'Departamento de operaciones generales');



CREATE TABLE `grupos` (
  `id_grupo` int(11) NOT NULL,
  `nombre_grupo` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



INSERT INTO `grupos` (`id_grupo`, `nombre_grupo`, `descripcion`) VALUES
(1, 'Administradores del Sistema', 'Grupo de administración de sistemas'),
(2, 'Soporte Técnico N1', 'Grupo de soporte técnico de primer nivel'),
(3, 'Soporte Técnico N2', 'Grupo de soporte técnico especializado'),
(4, 'Redes', 'Grupo de soporte técnico especializado en redes');



CREATE TABLE `historial_tickets` (
  `id_historial` int(11) NOT NULL,
  `id_ticket2` int(11) NOT NULL,
  `campo_modificado` varchar(50) NOT NULL,
  `valor_anterior` text DEFAULT NULL,
  `valor_nuevo` text DEFAULT NULL,
  `fecha_modificacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `modificado_por` int(11) DEFAULT NULL COMMENT 'ID del usuario que realizó el cambio',
  `nombre_modificador` varchar(100) DEFAULT NULL COMMENT 'Nombre del usuario que realizó el cambio',
  `rol_modificador` varchar(100) DEFAULT NULL COMMENT 'Rol del usuario que realizó el cambio',
  `comentario_reapertura` text DEFAULT NULL COMMENT 'Comentario al reabrir el ticket'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



CREATE TABLE `tickets` (
  `id_ticket` int(11) NOT NULL,
  `prioridad` varchar(100) NOT NULL,
  `estado_ticket` varchar(100) NOT NULL DEFAULT 'nuevo',
  `tipo` varchar(100) NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `descripcion` text NOT NULL,
  `ubicacion` varchar(100) NOT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_cierre` timestamp NULL DEFAULT NULL,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `id_categoria1` int(11) DEFAULT NULL,
  `id_grupo1` int(11) DEFAULT NULL,
  `id_tecnico_asignado` int(11) DEFAULT NULL,
  `id_usuario_reporta` int(11) DEFAULT NULL,
  `contador_reaperturas` int(11) DEFAULT 0 COMMENT 'Número de veces que se ha reabierto este ticket'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



INSERT INTO `tickets` (`id_ticket`, `prioridad`, `estado_ticket`, `tipo`, `titulo`, `descripcion`, `ubicacion`, `fecha_creacion`, `fecha_cierre`, `fecha_actualizacion`, `id_categoria1`, `id_grupo1`, `id_tecnico_asignado`, `id_usuario_reporta`, `contador_reaperturas`) VALUES
(1, 'Alta', 'nuevo', 'incidencia', 'Computadora no enciende', 'El equipo del usuario no muestra señal de vida al presionar el botón de encendido', 'Oficina 101', '2025-06-18 10:10:10', '2025-06-18 11:34:07', '2025-06-18 11:34:07', 1, 1, 2, 3, 0),
(2, 'Media', 'nuevo', 'requerimiento', 'Instalación de Photoshop', 'El usuario requiere la instalación de Adobe Photoshop para edición de imágenes', 'Oficina 205', '2025-06-18 10:10:10', '2025-06-18 11:34:07', '2025-06-18 11:34:12', 2, 2, 2, 3, 0),
(3, 'Alta', 'nuevo', 'incidencia', 'No hay conexión a internet', 'Todo el departamento de contabilidad ha perdido conexión a internet', 'Área Contabilidad', '2025-06-18 10:10:10', '2025-06-18 11:34:07', '2025-06-18 11:34:32', 3, 1, 6, 2, 0),
(4, 'Baja', 'nuevo', 'requerimiento', 'Restablecer contraseña', 'El usuario olvidó su contraseña y necesita que se la restablezcan', 'Oficina 312', '2025-06-18 10:10:10', '2025-06-18 11:34:07', '2025-06-25 01:00:00', 4, 3, 2, 3, 0),
(5, 'Media', 'nuevo', 'incidencia', 'Impresora no funciona', 'La impresora de la oficina 107 no responde y muestra un error de papel atascado', 'Oficina 107', '2025-06-18 10:10:10', '2025-06-18 11:34:07', '2025-06-18 11:34:45', 1, 2, 7, 3, 0);

--
-- Disparadores `tickets`
--
DELIMITER $$
CREATE TRIGGER `after_ticket_insert` AFTER INSERT ON `tickets` FOR EACH ROW BEGIN
    DECLARE usuario_reporta_nombre VARCHAR(100);
    DECLARE usuario_reporta_id INT;
    DECLARE usuario_reporta_rol VARCHAR(100);
    
    SET usuario_reporta_id = NEW.id_usuario_reporta;
    SELECT nombre_completo, rol INTO usuario_reporta_nombre, usuario_reporta_rol 
    FROM usuarios WHERE id_usuario = usuario_reporta_id;
    
    INSERT INTO historial_tickets (id_ticket2, campo_modificado, valor_anterior, 
                                 valor_nuevo, modificado_por, nombre_modificador, rol_modificador)
    VALUES (NEW.id_ticket, 'ticket_creado', NULL, 
           'Ticket creado con todos los campos',
           usuario_reporta_id, usuario_reporta_nombre, usuario_reporta_rol);
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_ticket_update` AFTER UPDATE ON `tickets` FOR EACH ROW BEGIN
    DECLARE user_id INT;
    DECLARE user_name VARCHAR(100);
    DECLARE user_rol VARCHAR(100);
    DECLARE old_categoria_nombre VARCHAR(100);
    DECLARE new_categoria_nombre VARCHAR(100);
    DECLARE old_grupo_nombre VARCHAR(100);
    DECLARE new_grupo_nombre VARCHAR(100);
    DECLARE old_tecnico_nombre VARCHAR(100);
    DECLARE new_tecnico_nombre VARCHAR(100);
    DECLARE old_usuario_reporta_nombre VARCHAR(100);
    DECLARE new_usuario_reporta_nombre VARCHAR(100);
    DECLARE es_reapertura BOOLEAN DEFAULT FALSE;
    
    -- Obtener ID, nombre y rol del usuario que realiza la modificación
    SET user_id = IFNULL(NEW.id_tecnico_asignado, @current_user_id);
    IF user_id IS NULL THEN
        SET user_id = 1; -- Usar admin como fallback
        SET user_name = 'Admin Sistema';
        SET user_rol = 'administrador';
    ELSE
        SELECT nombre_completo, rol INTO user_name, user_rol FROM usuarios WHERE id_usuario = user_id;
    END IF;
    
    -- Determinar si es una reapertura por usuario
    IF (OLD.estado_ticket = 'resuelto' AND NEW.estado_ticket != 'resuelto' AND user_rol = 'usuario') THEN
        SET es_reapertura = TRUE;
        
        -- Incrementar contador de reaperturas
        UPDATE tickets SET contador_reaperturas = contador_reaperturas + 1 WHERE id_ticket = NEW.id_ticket;
    END IF;
    
    -- Obtener nombres para categorías
    SELECT IFNULL(nombre_categoria, 'Sin categoría') INTO old_categoria_nombre 
    FROM categorias WHERE id_categoria = OLD.id_categoria1;
    
    SELECT IFNULL(nombre_categoria, 'Sin categoría') INTO new_categoria_nombre 
    FROM categorias WHERE id_categoria = NEW.id_categoria1;
    
    -- Obtener nombres para grupos
    SELECT IFNULL(nombre_grupo, 'Sin grupo') INTO old_grupo_nombre 
    FROM grupos WHERE id_grupo = OLD.id_grupo1;
    
    SELECT IFNULL(nombre_grupo, 'Sin grupo') INTO new_grupo_nombre 
    FROM grupos WHERE id_grupo = NEW.id_grupo1;
    
    -- Obtener nombres para técnicos
    SELECT IFNULL(nombre_completo, 'Sin técnico') INTO old_tecnico_nombre 
    FROM usuarios WHERE id_usuario = OLD.id_tecnico_asignado;
    
    SELECT IFNULL(nombre_completo, 'Sin técnico') INTO new_tecnico_nombre 
    FROM usuarios WHERE id_usuario = NEW.id_tecnico_asignado;
    
    -- Obtener nombres para usuarios que reportan
    SELECT IFNULL(nombre_completo, 'Usuario desconocido') INTO old_usuario_reporta_nombre 
    FROM usuarios WHERE id_usuario = OLD.id_usuario_reporta;
    
    SELECT IFNULL(nombre_completo, 'Usuario desconocido') INTO new_usuario_reporta_nombre 
    FROM usuarios WHERE id_usuario = NEW.id_usuario_reporta;
    
    -- Registrar reapertura por usuario (con comentario si está disponible)
    IF es_reapertura THEN
        INSERT INTO historial_tickets (id_ticket2, campo_modificado, valor_anterior, valor_nuevo, 
                                     modificado_por, nombre_modificador, rol_modificador, comentario_reapertura)
        VALUES (NEW.id_ticket, 'reapertura_usuario', OLD.estado_ticket, NEW.estado_ticket, 
               user_id, user_name, user_rol, @comentario_reapertura);
    END IF;
    
    -- Registrar cambios en prioridad
    IF NEW.prioridad != OLD.prioridad THEN
        INSERT INTO historial_tickets (id_ticket2, campo_modificado, valor_anterior, valor_nuevo, 
                                     modificado_por, nombre_modificador, rol_modificador)
        VALUES (NEW.id_ticket, 'prioridad', OLD.prioridad, NEW.prioridad, 
               user_id, user_name, user_rol);
    END IF;
    
    -- Registrar cambios en estado_ticket (general)
    IF NEW.estado_ticket != OLD.estado_ticket AND NOT es_reapertura THEN
        INSERT INTO historial_tickets (id_ticket2, campo_modificado, valor_anterior, valor_nuevo, 
                                     modificado_por, nombre_modificador, rol_modificador)
        VALUES (NEW.id_ticket, 'estado_ticket', OLD.estado_ticket, NEW.estado_ticket, 
               user_id, user_name, user_rol);
    END IF;
    
    -- Registrar cambios en tipo
    IF NEW.tipo != OLD.tipo THEN
        INSERT INTO historial_tickets (id_ticket2, campo_modificado, valor_anterior, valor_nuevo, 
                                     modificado_por, nombre_modificador, rol_modificador)
        VALUES (NEW.id_ticket, 'tipo', OLD.tipo, NEW.tipo, 
               user_id, user_name, user_rol);
    END IF;
    
    -- Registrar cambios en título
    IF NEW.titulo != OLD.titulo THEN
        INSERT INTO historial_tickets (id_ticket2, campo_modificado, valor_anterior, valor_nuevo, 
                                     modificado_por, nombre_modificador, rol_modificador)
        VALUES (NEW.id_ticket, 'titulo', OLD.titulo, NEW.titulo, 
               user_id, user_name, user_rol);
    END IF;
    
    -- Registrar cambios en descripción (guardamos solo los primeros 255 caracteres)
    IF NEW.descripcion != OLD.descripcion THEN
        INSERT INTO historial_tickets (id_ticket2, campo_modificado, valor_anterior, valor_nuevo, 
                                     modificado_por, nombre_modificador, rol_modificador)
        VALUES (NEW.id_ticket, 'descripcion', LEFT(OLD.descripcion, 255), LEFT(NEW.descripcion, 255), 
               user_id, user_name, user_rol);
    END IF;
    
    -- Registrar cambios en ubicación
    IF NEW.ubicacion != OLD.ubicacion THEN
        INSERT INTO historial_tickets (id_ticket2, campo_modificado, valor_anterior, valor_nuevo, 
                                     modificado_por, nombre_modificador, rol_modificador)
        VALUES (NEW.id_ticket, 'ubicacion', OLD.ubicacion, NEW.ubicacion, 
               user_id, user_name, user_rol);
    END IF;
    
    -- Registrar cambios en categoría (mostrando nombres)
    IF (NEW.id_categoria1 != OLD.id_categoria1) OR (NEW.id_categoria1 IS NULL AND OLD.id_categoria1 IS NOT NULL) OR (NEW.id_categoria1 IS NOT NULL AND OLD.id_categoria1 IS NULL) THEN
        INSERT INTO historial_tickets (id_ticket2, campo_modificado, valor_anterior, valor_nuevo, 
                                     modificado_por, nombre_modificador, rol_modificador)
        VALUES (NEW.id_ticket, 'categoría', old_categoria_nombre, new_categoria_nombre, 
               user_id, user_name, user_rol);
    END IF;
    
    -- Registrar cambios en grupo (mostrando nombres)
    IF (NEW.id_grupo1 != OLD.id_grupo1) OR (NEW.id_grupo1 IS NULL AND OLD.id_grupo1 IS NOT NULL) OR (NEW.id_grupo1 IS NOT NULL AND OLD.id_grupo1 IS NULL) THEN
        INSERT INTO historial_tickets (id_ticket2, campo_modificado, valor_anterior, valor_nuevo, 
                                     modificado_por, nombre_modificador, rol_modificador)
        VALUES (NEW.id_ticket, 'grupo', old_grupo_nombre, new_grupo_nombre, 
               user_id, user_name, user_rol);
    END IF;
    
    -- Registrar cambios en técnico asignado (mostrando nombres)
    IF (NEW.id_tecnico_asignado != OLD.id_tecnico_asignado) OR (NEW.id_tecnico_asignado IS NULL AND OLD.id_tecnico_asignado IS NOT NULL) OR (NEW.id_tecnico_asignado IS NOT NULL AND OLD.id_tecnico_asignado IS NULL) THEN
        INSERT INTO historial_tickets (id_ticket2, campo_modificado, valor_anterior, valor_nuevo, 
                                     modificado_por, nombre_modificador, rol_modificador)
        VALUES (NEW.id_ticket, 'técnico asignado', old_tecnico_nombre, new_tecnico_nombre, 
               user_id, user_name, user_rol);
    END IF;
    
    -- Registrar cambios en usuario que reporta (mostrando nombres)
    IF (NEW.id_usuario_reporta != OLD.id_usuario_reporta) OR (NEW.id_usuario_reporta IS NULL AND OLD.id_usuario_reporta IS NOT NULL) OR (NEW.id_usuario_reporta IS NOT NULL AND OLD.id_usuario_reporta IS NULL) THEN
        INSERT INTO historial_tickets (id_ticket2, campo_modificado, valor_anterior, valor_nuevo, 
                                     modificado_por, nombre_modificador, rol_modificador)
        VALUES (NEW.id_ticket, 'usuario que reporta', old_usuario_reporta_nombre, new_usuario_reporta_nombre, 
               user_id, user_name, user_rol);
    END IF;
    
    -- Registrar cierre de ticket
    IF (NEW.fecha_cierre IS NOT NULL AND OLD.fecha_cierre IS NULL) THEN
        INSERT INTO historial_tickets (id_ticket2, campo_modificado, valor_anterior, valor_nuevo, 
                                     modificado_por, nombre_modificador, rol_modificador)
        VALUES (NEW.id_ticket, 'fecha_cierre', NULL, NEW.fecha_cierre, 
               user_id, user_name, user_rol);
    END IF;
    
    -- Registrar reapertura de ticket (general)
    IF (NEW.fecha_cierre IS NULL AND OLD.fecha_cierre IS NOT NULL) THEN
        INSERT INTO historial_tickets (id_ticket2, campo_modificado, valor_anterior, valor_nuevo, 
                                     modificado_por, nombre_modificador, rol_modificador)
        VALUES (NEW.id_ticket, 'ticket_reapertura', OLD.fecha_cierre, NULL, 
               user_id, user_name, user_rol);
    END IF;
END
$$
DELIMITER ;



CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `nombre_completo` varchar(100) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `nombre_usuario` varchar(50) NOT NULL,
  `contraseña` varchar(100) NOT NULL,
  `rol` varchar(100) NOT NULL,
  `estado` varchar(100) NOT NULL DEFAULT 'activo',
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `id_entidad1` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nombre_completo`, `correo`, `telefono`, `nombre_usuario`, `contraseña`, `rol`, `estado`, `fecha_registro`, `fecha_actualizacion`, `id_entidad1`) VALUES
(1, 'Admin Sistema', 'admin@helpdeskjcbd.com', '123456789', 'Admin', 'admin123', 'administrador', 'activo', '2025-06-18 10:09:59', '2025-06-18 11:32:19', 1),
(2, 'Técnico Principal', 'tecnico@helpdeskjcbd.com', '123456789', 'Tecnico_1', 'tecnico123', 'tecnico', 'activo', '2025-06-18 10:09:59', '2025-06-18 10:59:48', 1),
(3, 'Sistema Usuario', 'usuario1@helpdeskjcbd.com', '123456789', 'Usuario_1', 'usuario123', 'usuario', 'activo', '2025-06-18 10:09:59', '2025-06-18 11:09:01', 2),
(4, 'Usuario Sistema', 'usuario2@helpdeskjcbd.com', '123456789', 'Usuario_2', 'usuario1234', 'usuario', 'activo', '2025-06-18 10:09:59', '2025-06-18 11:09:14', 3),
(5, 'Usuario Usuario', 'usuario3@helpdeskjcbd.com', '5551234567', 'Usuario_3', 'usuario12345', 'usuario', 'activo', '2025-06-18 10:09:59', '2025-06-18 11:09:23', 4),
(6, 'Tecnico Tecnico', 'tecnico1@helpdeskjcbd.com', '5557654321', 'Tecnico_2', 'tecnico1234', 'tecnico', 'activo', '2025-06-18 10:09:59', '2025-06-18 11:09:34', 1),
(7, 'Tecnico Tecnico Tecnico', 'tecnico2@helpdeskjcbd.com', '5559876543', 'Tecnico_3', 'tecnico12345', 'tecnico', 'activo', '2025-06-18 10:09:59', '2025-06-18 11:09:47', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios_tickets`
--

CREATE TABLE `usuarios_tickets` (
  `id_usuario1` int(11) NOT NULL,
  `id_ticket3` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


ALTER TABLE `adjuntos_tickets`
  ADD PRIMARY KEY (`id_adjunto`),
  ADD KEY `adjuntos_tickets_ibfk_1` (`id_ticket1`);


ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id_categoria`);


ALTER TABLE `entidades`
  ADD PRIMARY KEY (`id_entidad`);


ALTER TABLE `grupos`
  ADD PRIMARY KEY (`id_grupo`);


ALTER TABLE `historial_tickets`
  ADD PRIMARY KEY (`id_historial`),
  ADD KEY `id_ticket2` (`id_ticket2`),
  ADD KEY `modificado_por` (`modificado_por`);


ALTER TABLE `tickets`
  ADD PRIMARY KEY (`id_ticket`),
  ADD KEY `id_categoria1` (`id_categoria1`),
  ADD KEY `id_grupo1` (`id_grupo1`),
  ADD KEY `id_tecnico_asignado` (`id_tecnico_asignado`),
  ADD KEY `id_usuario_reporta` (`id_usuario_reporta`);


ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `correo` (`correo`),
  ADD UNIQUE KEY `nombre_usuario` (`nombre_usuario`),
  ADD KEY `id_entidad1` (`id_entidad1`);


ALTER TABLE `usuarios_tickets`
  ADD PRIMARY KEY (`id_usuario1`,`id_ticket3`),
  ADD KEY `id_ticket3` (`id_ticket3`);


ALTER TABLE `adjuntos_tickets`
  MODIFY `id_adjunto` int(11) NOT NULL AUTO_INCREMENT;


ALTER TABLE `categorias`
  MODIFY `id_categoria` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;


ALTER TABLE `entidades`
  MODIFY `id_entidad` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;


ALTER TABLE `grupos`
  MODIFY `id_grupo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;


ALTER TABLE `historial_tickets`
  MODIFY `id_historial` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;


ALTER TABLE `tickets`
  MODIFY `id_ticket` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;


ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;



ALTER TABLE `adjuntos_tickets`
  ADD CONSTRAINT `adjuntos_tickets_ibfk_1` FOREIGN KEY (`id_ticket1`) REFERENCES `tickets` (`id_ticket`) ON DELETE CASCADE;


ALTER TABLE `historial_tickets`
  ADD CONSTRAINT `historial_tickets_ibfk_1` FOREIGN KEY (`id_ticket2`) REFERENCES `tickets` (`id_ticket`) ON DELETE CASCADE,
  ADD CONSTRAINT `historial_tickets_ibfk_2` FOREIGN KEY (`modificado_por`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL;


ALTER TABLE `tickets`
  ADD CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`id_categoria1`) REFERENCES `categorias` (`id_categoria`) ON DELETE SET NULL,
  ADD CONSTRAINT `tickets_ibfk_2` FOREIGN KEY (`id_grupo1`) REFERENCES `grupos` (`id_grupo`) ON DELETE SET NULL,
  ADD CONSTRAINT `tickets_ibfk_3` FOREIGN KEY (`id_tecnico_asignado`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL,
  ADD CONSTRAINT `tickets_ibfk_4` FOREIGN KEY (`id_usuario_reporta`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL;


ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_entidad1`) REFERENCES `entidades` (`id_entidad`) ON DELETE SET NULL;


ALTER TABLE `usuarios_tickets`
  ADD CONSTRAINT `usuarios_tickets_ibfk_1` FOREIGN KEY (`id_usuario1`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  ADD CONSTRAINT `usuarios_tickets_ibfk_2` FOREIGN KEY (`id_ticket3`) REFERENCES `tickets` (`id_ticket`) ON DELETE CASCADE;
COMMIT;
