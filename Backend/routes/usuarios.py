from flask import Blueprint, request, jsonify
from database import get_db_connection
import os
import uuid
from werkzeug.utils import secure_filename
from datetime import datetime

usuarios_bp = Blueprint("usuarios", __name__)

# Configuración para archivos adjuntos
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png',
                      'jpg', 'jpeg', 'xlsx', 'doc', 'docx'}


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@usuarios_bp.route("/creacion", methods=["POST"])
def crear_usuario():
    try:
        data = request.get_json()
        nombre_usuario = data.get("nombre_usuario")
        nombre_completo = data.get("nombre_completo")
        telefono = data.get("telefono")
        correo = data.get("correo")
        id_entidad = data.get("id_entidad")
        rol = data.get("rol")
        contrasena = data.get("contrasena")
        estado = data.get("estado", "activo")  # Valor por defecto "activo"

        # Validar campos requeridos
        campos_requeridos = [
            nombre_usuario,
            nombre_completo,
            telefono,
            correo,
            rol,
            contrasena
        ]

        if not all(campos_requeridos):
            return jsonify({
                "success": False,
                "message": "Faltan campos requeridos"
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Verificar si el nombre de usuario ya existe
        cursor.execute(
            "SELECT id_usuario FROM usuarios WHERE nombre_usuario = %s", (nombre_usuario,))
        if cursor.fetchone():
            return jsonify({
                "success": False,
                "message": "El nombre de usuario ya existe"
            }), 400

        # Verificar si el correo ya existe
        cursor.execute(
            "SELECT id_usuario FROM usuarios WHERE correo = %s", (correo,))
        if cursor.fetchone():
            return jsonify({
                "success": False,
                "message": "El correo ya está registrado"
            }), 400

        query = """
            INSERT INTO usuarios (
                nombre_usuario, 
                nombre_completo, 
                correo, 
                telefono, 
                contraseña, 
                rol, 
                estado, 
                id_entidad1
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            nombre_usuario,
            nombre_completo,
            correo,
            telefono,
            contrasena,
            rol,
            estado,
            id_entidad
        ))
        conn.commit()

        nuevo_id = cursor.lastrowid

        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Usuario creado correctamente",
            "id_usuario": nuevo_id
        }), 201

    except Exception as e:
        print("Error al crear usuario:", e)
        return jsonify({
            "success": False,
            "message": "Error interno del servidor"
        }), 500


@usuarios_bp.route("/actualizacion/<int:usuario_id>", methods=["PUT"])
def actualizar_usuario(usuario_id):
    try:
        data = request.get_json()
        nombre_usuario = data.get("nombre_usuario")
        nombre_completo = data.get("nombre_completo")
        telefono = data.get("telefono")
        correo = data.get("correo")
        id_entidad = data.get("id_entidad")
        rol = data.get("rol")
        contrasena = data.get("contrasena")
        estado = data.get("estado", "activo")

        # Validar campos requeridos
        campos_requeridos = [
            nombre_usuario,
            nombre_completo,
            telefono,
            correo,
            rol
        ]

        if not all(campos_requeridos):
            return jsonify({
                "success": False,
                "message": "Faltan campos requeridos"
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Verificar si el usuario existe
        cursor.execute(
            "SELECT id_usuario FROM usuarios WHERE id_usuario = %s", (usuario_id,))
        if not cursor.fetchone():
            return jsonify({
                "success": False,
                "message": "Usuario no encontrado"
            }), 404

        # Verificar si el nuevo nombre de usuario ya existe (excluyendo el actual)
        cursor.execute(
            "SELECT id_usuario FROM usuarios WHERE nombre_usuario = %s AND id_usuario != %s",
            (nombre_usuario, usuario_id)
        )
        if cursor.fetchone():
            return jsonify({
                "success": False,
                "message": "El nombre de usuario ya está en uso"
            }), 400

        # Verificar si el nuevo correo ya existe (excluyendo el actual)
        cursor.execute(
            "SELECT id_usuario FROM usuarios WHERE correo = %s AND id_usuario != %s",
            (correo, usuario_id)
        )
        if cursor.fetchone():
            return jsonify({
                "success": False,
                "message": "El correo ya está registrado"
            }), 400

        # Construir la consulta según si se actualiza contraseña o no
        if contrasena:
            query = """
                UPDATE usuarios
                SET nombre_usuario = %s, 
                    nombre_completo = %s, 
                    correo = %s, 
                    telefono = %s, 
                    contraseña = %s, 
                    rol = %s, 
                    estado = %s, 
                    id_entidad1 = %s,
                    fecha_actualizacion = NOW()
                WHERE id_usuario = %s
            """
            params = (
                nombre_usuario,
                nombre_completo,
                correo,
                telefono,
                contrasena,
                rol,
                estado,
                id_entidad,
                usuario_id
            )
        else:
            query = """
                UPDATE usuarios
                SET nombre_usuario = %s, 
                    nombre_completo = %s, 
                    correo = %s, 
                    telefono = %s, 
                    rol = %s, 
                    estado = %s, 
                    id_entidad1 = %s,
                    fecha_actualizacion = NOW()
                WHERE id_usuario = %s
            """
            params = (
                nombre_usuario,
                nombre_completo,
                correo,
                telefono,
                rol,
                estado,
                id_entidad,
                usuario_id
            )

        cursor.execute(query, params)
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({
                "success": False,
                "message": "No se realizaron cambios"
            }), 400

        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Usuario actualizado correctamente"
        }), 200

    except Exception as e:
        print("Error al actualizar usuario:", e)
        return jsonify({
            "success": False,
            "message": "Error interno del servidor"
        }), 500


@usuarios_bp.route("/obtener", methods=["GET"])
def obtener_usuarios():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Obtener usuarios con información de entidad
        query = """
            SELECT 
                u.id_usuario,
                u.nombre_usuario,
                u.nombre_completo,
                u.correo,
                u.telefono,
                u.rol,
                u.estado,
                u.fecha_registro,
                u.fecha_actualizacion,
                e.nombre_entidad AS entidad,
                u.id_entidad1
            FROM usuarios u
            LEFT JOIN entidades e ON u.id_entidad1 = e.id_entidad
        """
        cursor.execute(query)
        usuarios = cursor.fetchall()

        cursor.close()
        conn.close()
        return jsonify(usuarios)
    except Exception as e:
        print("Error al obtener usuarios:", e)
        return jsonify({
            "success": False,
            "message": "Error al obtener usuarios"
        }), 500


@usuarios_bp.route("/eliminar/<int:usuario_id>", methods=["DELETE"])
def eliminar_usuario(usuario_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Verificar si el usuario existe
        cursor.execute(
            "SELECT id_usuario FROM usuarios WHERE id_usuario = %s", (usuario_id,))
        usuario = cursor.fetchone()

        if not usuario:
            return jsonify({
                "success": False,
                "message": "Usuario no encontrado"
            }), 404

        # Eliminar el usuario
        cursor.execute(
            "DELETE FROM usuarios WHERE id_usuario = %s", (usuario_id,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({
                "success": False,
                "message": "No se pudo eliminar el usuario"
            }), 400

        return jsonify({
            "success": True,
            "message": "Usuario eliminado correctamente"
        }), 200

    except Exception as e:
        print("Error al eliminar usuario:", e)
        conn.rollback()
        return jsonify({
            "success": False,
            "message": "Error al eliminar el usuario"
        }), 500

    finally:
        cursor.close()
        conn.close()


@usuarios_bp.route("/obtenerEntidades", methods=["GET"])
def obtener_entidades():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM entidades")
        entidades = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(entidades)
    except Exception as e:
        print("Error al obtener entidades:", e)
        return jsonify({
            "success": False,
            "message": "Error al obtener entidades"
        }), 500


@usuarios_bp.route("/verificar-estado/<string:nombre_usuario>", methods=["GET"])
def verificar_estado_usuario(nombre_usuario):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT estado FROM usuarios WHERE nombre_usuario = %s", (nombre_usuario,))
        usuario = cursor.fetchone()

        cursor.close()
        conn.close()

        if not usuario:
            return jsonify({"success": False, "message": "Usuario no encontrado"}), 404

        return jsonify({
            "success": True,
            "estado": usuario['estado']
        }), 200

    except Exception as e:
        print("Error al verificar estado:", e)
        return jsonify({"success": False, "message": "Error interno del servidor"}), 500


@usuarios_bp.route("/obtenerGrupos", methods=["GET"])
def obtener_grupos():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM grupos")
        grupos = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(grupos)
    except Exception as e:
        print("Error al obtener grupos:", e)
        return jsonify({
            "success": False,
            "message": "Error al obtener grupos"
        }), 500


@usuarios_bp.route("/obtenerCategorias", methods=["GET"])
def obtener_categorias():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM categorias")
        categorias = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(categorias)
    except Exception as e:
        print("Error al obtener categorías:", e)
        return jsonify({
            "success": False,
            "message": "Error al obtener categorías"
        }), 500


@usuarios_bp.route("/obtenerUsuario/<int:usuario_id>", methods=["GET"])
def obtener_usuario(usuario_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT 
                u.id_usuario,
                u.nombre_completo,
                u.nombre_usuario,
                u.correo,
                u.telefono,
                u.rol,
                u.estado,
                e.nombre_entidad AS entidad,
                e.id_entidad
            FROM usuarios u
            LEFT JOIN entidades e ON u.id_entidad1 = e.id_entidad
            WHERE u.id_usuario = %s
        """, (usuario_id,))

        usuario = cursor.fetchone()
        cursor.close()
        conn.close()

        if not usuario:
            return jsonify({"success": False, "message": "Usuario no encontrado"}), 404

        return jsonify(usuario)

    except Exception as e:
        print("Error al obtener usuario:", e)
        return jsonify({"success": False, "message": "Error al obtener usuario"}), 500


@usuarios_bp.route("/tickets", methods=["POST"])
def crear_ticket():
    conn = None
    try:
        prioridad = request.form.get("prioridad")
        titulo = request.form.get("titulo")
        descripcion = request.form.get("descripcion")
        ubicacion = request.form.get("ubicacion")
        tipo = request.form.get("tipo")
        categoria = request.form.get("categoria")
        solicitante = request.form.get("solicitante")
        archivos = request.files.getlist("archivos") 
        grupo = request.form.get("grupo_asignado")
        asignado = request.form.get("asignado_a")
        estado_ticket = request.form.get("estado") or "nuevo"  # ✅ usa el que venga o "nuevo"

        # Validación de campos requeridos
        if not all([prioridad, titulo, descripcion, ubicacion, tipo, categoria, solicitante]):
            return jsonify({
                "success": False,
                "message": "Faltan campos requeridos"
            }), 400

        # Si vienen vacíos, convertirlos a None para que vayan como NULL en MySQL
        grupo = grupo if grupo else None
        asignado = asignado if asignado else None

        conn = get_db_connection()
        cursor = conn.cursor()

        # Insertar ticket con campos completos
        query_ticket = """
            INSERT INTO tickets (
                prioridad, tipo, titulo, descripcion, ubicacion,
                id_categoria1, id_usuario_reporta, estado_ticket,
                fecha_creacion, fecha_actualizacion,
                id_grupo1, id_tecnico_asignado, contador_reaperturas, fecha_cierre
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW(), %s, %s, 0, NULL)
        """
        cursor.execute(query_ticket, (
            prioridad,
            tipo,
            titulo,
            descripcion,
            ubicacion,
            categoria,
            solicitante,
            estado_ticket,  # ✅ ahora se usa lo enviado o "nuevo"
            grupo,
            asignado
        ))
        ticket_id = cursor.lastrowid

        # Insertar relación usuario-ticket
        query_usuarios_ticket = """
            INSERT INTO usuarios_tickets (id_usuario1, id_ticket3)
            VALUES (%s, %s)
        """
        cursor.execute(query_usuarios_ticket, (solicitante, ticket_id))

        # Manejar archivos adjuntos si existen
        if archivos:
            if not os.path.exists(UPLOAD_FOLDER):
                os.makedirs(UPLOAD_FOLDER)

            for archivo in archivos:
                if archivo and allowed_file(archivo.filename):
                    filename = f"{uuid.uuid4().hex}_{secure_filename(archivo.filename)}"
                    filepath = os.path.join(UPLOAD_FOLDER, filename)

                    archivo.save(filepath)

                    # Insertar en tabla de adjuntos
                    query_adjunto = """
                        INSERT INTO adjuntos_tickets (
                            id_ticket1, nombre_archivo, ruta_archivo,
                            tipo_archivo, tamano
                        ) VALUES (%s, %s, %s, %s, %s)
                    """
                    cursor.execute(query_adjunto, (
                        ticket_id,
                        filename,
                        f"uploads/{filename}",  # ruta relativa
                        archivo.content_type,
                        os.path.getsize(filepath)
                    ))

        conn.commit()
        cursor.close()
        return jsonify({
            "success": True,
            "message": "Ticket creado correctamente",
            "ticket_id": ticket_id,
            "estado_ticket": estado_ticket  # ✅ lo devuelves en la respuesta también
        }), 201

    except Exception as e:
        print("❌ Error al crear ticket:", e)
        if conn:
            conn.rollback()
        return jsonify({
            "success": False,
            "message": "Error interno del servidor"
        }), 500
    finally:
        if conn:
            conn.close()





@usuarios_bp.route("/tickets", methods=["GET"])
def obtener_tickets():
    try:
        usuario_id = request.args.get("usuario_id")
        rol = request.args.get("rol")

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT 
                t.id_ticket as id,
                t.titulo,
                t.descripcion,
                t.prioridad,
                t.estado_ticket as estado,
                t.tipo,
                t.ubicacion,
                t.fecha_creacion,
                t.fecha_actualizacion as ultimaActualizacion,
                c.nombre_categoria AS categoria,
                u.nombre_completo AS solicitante,
                u.id_usuario AS solicitanteId,
                tec.nombre_completo AS tecnico,
                g.nombre_grupo AS grupo
            FROM tickets t
            LEFT JOIN categorias c ON t.id_categoria1 = c.id_categoria
            LEFT JOIN usuarios_tickets ut ON t.id_ticket = ut.id_ticket3
            LEFT JOIN usuarios u ON ut.id_usuario1 = u.id_usuario
            LEFT JOIN usuarios tec ON t.id_tecnico_asignado = tec.id_usuario
            LEFT JOIN grupos g ON t.id_grupo1 = g.id_grupo
        """

        params = []
        if rol and rol.lower() not in ['administrador', 'tecnico'] and usuario_id:
            query += " WHERE ut.id_usuario1 = %s"
            params.append(usuario_id)

        # Ordenar por fecha de creación descendente (más reciente primero)
        query += " ORDER BY t.fecha_creacion DESC"

        cursor.execute(query, params)
        tickets = cursor.fetchall()

        for ticket in tickets:
            ticket['fecha_creacion'] = ticket['fecha_creacion'].strftime(
                '%Y-%m-%d %H:%M:%S')
            if ticket['ultimaActualizacion']:
                ticket['ultimaActualizacion'] = ticket['ultimaActualizacion'].strftime(
                    '%Y-%m-%d %H:%M:%S')

        cursor.close()
        conn.close()

        return jsonify(tickets)

    except Exception as e:
        print("Error al obtener tickets:", e)
        return jsonify({
            "success": False,
            "message": "Error al obtener tickets"
        }), 500


@usuarios_bp.route("/tickets/<int:id_ticket>", methods=["GET"])
def obtener_ticket_por_id(id_ticket):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT 
                t.id_ticket as id,
                t.titulo,
                t.descripcion,
                t.prioridad,
                t.estado_ticket as estado,
                t.tipo,
                t.ubicacion,
                t.fecha_creacion as fechaApertura,
                t.fecha_actualizacion as ultimaActualizacion,
                c.nombre_categoria AS categoria,
                u.nombre_completo AS solicitante,
                u.id_usuario AS solicitanteId,
                tec.nombre_completo AS asignadoA,
                g.nombre_grupo AS grupoAsignado
            FROM tickets t
            LEFT JOIN categorias c ON t.id_categoria1 = c.id_categoria
            LEFT JOIN usuarios_tickets ut ON t.id_ticket = ut.id_ticket3
            LEFT JOIN usuarios u ON ut.id_usuario1 = u.id_usuario
            LEFT JOIN usuarios tec ON t.id_tecnico_asignado = tec.id_usuario
            LEFT JOIN grupos g ON t.id_grupo1 = g.id_grupo
            WHERE t.id_ticket = %s
        """, (id_ticket,))

        ticket = cursor.fetchone()

        if ticket:
            # Formatear fechas
            ticket['fechaApertura'] = ticket['fechaApertura'].strftime(
                '%Y-%m-%d %H:%M:%S')
            if ticket['ultimaActualizacion']:
                ticket['ultimaActualizacion'] = ticket['ultimaActualizacion'].strftime(
                    '%Y-%m-%d %H:%M:%S')

            # Obtener adjuntos si existen
            cursor.execute("""
                SELECT * FROM adjuntos_tickets 
                WHERE id_ticket1 = %s
            """, (id_ticket,))
            adjuntos = cursor.fetchall()
            ticket['adjuntos'] = adjuntos

        cursor.close()
        conn.close()

        if not ticket:
            return jsonify({
                "success": False,
                "message": "Ticket no encontrado"
            }), 404

        return jsonify(ticket)

    except Exception as e:
        print("Error al obtener el ticket:", e)
        return jsonify({
            "success": False,
            "message": "Error al obtener el ticket"
        }), 500


@usuarios_bp.route("/tickets/<int:id_ticket>", methods=["PUT"])
def actualizar_ticket(id_ticket):
    try:
        # Asegurar que puede manejar FormData
        if request.content_type.startswith('multipart/form-data'):
            data = request.form
            archivo = request.files.get('archivo')
        else:
            data = request.get_json()
            archivo = None

        # Validar campos requeridos
        user_id = data.get("user_id")
        user_role = data.get("user_role")

        if not user_id or not user_role:
            return jsonify({
                "success": False,
                "message": "Se requieren user_id y user_role"
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Verificar existencia del ticket
        cursor.execute("""
            SELECT id_usuario_reporta FROM tickets 
            WHERE id_ticket = %s
        """, (id_ticket,))
        ticket = cursor.fetchone()

        if not ticket:
            return jsonify({
                "success": False,
                "message": "Ticket no encontrado"
            }), 404

        # Validar permisos
        if user_role not in ['administrador', 'tecnico'] and str(ticket['id_usuario_reporta']) != str(user_id):
            return jsonify({
                "success": False,
                "message": "No tienes permisos para editar este ticket"
            }), 403

        # Preparar actualización
        updates = []
        params = []

        # Campos actualizables por todos
        if 'titulo' in data:
            updates.append("titulo = %s")
            params.append(data['titulo'])

        if 'descripcion' in data:
            updates.append("descripcion = %s")
            params.append(data['descripcion'])

        if 'ubicacion' in data:
            updates.append("ubicacion = %s")
            params.append(data['ubicacion'])

        # Campos solo para admin/tecnico
        if user_role in ['administrador', 'tecnico']:
            if 'prioridad' in data:
                updates.append("prioridad = %s")
                params.append(data['prioridad'])

            if 'tipo' in data:
                updates.append("tipo = %s")
                params.append(data['tipo'])

            if 'ubicacion' in data:
                updates.append("ubicacion = %s")
                params.append(data['ubicacion'])

            if 'categoria' in data:
                updates.append("id_categoria1 = %s")
                params.append(data['categoria'])

        # Ejecutar actualización si hay campos
        if updates:
            params.append(id_ticket)
            query = f"""
                UPDATE tickets 
                SET {', '.join(updates)}, fecha_actualizacion = NOW() 
                WHERE id_ticket = %s
            """
            cursor.execute(query, params)

        # Manejar archivo adjunto
        if archivo and allowed_file(archivo.filename):
            filename = secure_filename(archivo.filename)
            filepath = os.path.join(UPLOAD_FOLDER, filename)

            # Crear directorio si no existe
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            archivo.save(filepath)

            # Eliminar adjuntos anteriores
            cursor.execute("""
                DELETE FROM adjuntos_tickets 
                WHERE id_ticket1 = %s
            """, (id_ticket,))

            # Insertar nuevo adjunto
            cursor.execute("""
                INSERT INTO adjuntos_tickets 
                (id_ticket1, nombre_archivo, ruta_archivo, tipo_archivo, tamano)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                id_ticket,
                filename,
                filepath,
                archivo.content_type,
                os.path.getsize(filepath)
            ))

        conn.commit()
        return jsonify({
            "success": True,
            "message": "Ticket actualizado correctamente"
        }), 200

    except Exception as e:
        conn.rollback()
        return jsonify({
            "success": False,
            "message": f"Error al actualizar ticket: {str(e)}"
        }), 500

    finally:
        cursor.close()
        conn.close()


@usuarios_bp.route("/estado_tickets", methods=["GET"])
def obtener_estado_tickets():
    estado = request.args.get("estado")
    usuario_id = request.args.get("usuario_id")
    rol = request.args.get("rol")

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT 
                t.id_ticket as id,
                t.titulo,
                t.descripcion,
                t.prioridad,
                t.estado_ticket as estado,
                t.tipo,
                t.ubicacion,
                t.fecha_creacion,
                t.fecha_actualizacion as ultimaActualizacion,
                c.nombre_categoria AS categoria,
                u.nombre_completo AS solicitante,
                u.id_usuario AS solicitanteId
            FROM tickets t
            LEFT JOIN categorias c ON t.id_categoria1 = c.id_categoria
            LEFT JOIN usuarios_tickets ut ON t.id_ticket = ut.id_ticket3
            LEFT JOIN usuarios u ON ut.id_usuario1 = u.id_usuario
        """

        conditions = []
        params = []

        if estado:
            conditions.append("t.estado_ticket = %s")
            params.append(estado)

        if rol and rol.lower() not in ['administrador', 'tecnico'] and usuario_id:
            conditions.append("ut.id_usuario1 = %s")
            params.append(usuario_id)

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        # Ordenar por fecha de creación descendente (más reciente primero)
        query += " ORDER BY t.fecha_creacion DESC"

        cursor.execute(query, params)
        tickets = cursor.fetchall()

        # Formatear fechas
        for ticket in tickets:
            ticket['fecha_creacion'] = ticket['fecha_creacion'].strftime(
                '%Y-%m-%d %H:%M:%S')
            if ticket['ultimaActualizacion']:
                ticket['ultimaActualizacion'] = ticket['ultimaActualizacion'].strftime(
                    '%Y-%m-%d %H:%M:%S')

        cursor.close()
        conn.close()

        return jsonify(tickets)

    except Exception as e:
        print("Error al obtener tickets:", e)
        return jsonify({
            "success": False,
            "message": "Error al obtener tickets"
        }), 500


@usuarios_bp.route("/tickets/tecnico/<int:id_tecnico>", methods=["GET"])
def obtener_tickets_por_tecnico(id_tecnico):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
    SELECT 
        t.id_ticket as id,
        t.titulo,
        t.descripcion,
        t.prioridad,
        t.estado_ticket as estado,
        t.tipo,
        t.ubicacion,
        t.fecha_creacion,
        t.fecha_actualizacion as ultimaActualizacion,
        t.id_tecnico_asignado,  -- <--- aquí lo agregas
        c.nombre_categoria AS categoria,
        u.nombre_completo AS solicitante,
        u.id_usuario AS solicitanteId
    FROM tickets t
    LEFT JOIN categorias c ON t.id_categoria1 = c.id_categoria
    LEFT JOIN usuarios_tickets ut ON t.id_ticket = ut.id_ticket3
    LEFT JOIN usuarios u ON ut.id_usuario1 = u.id_usuario
    WHERE t.id_tecnico_asignado = %s
    ORDER BY t.fecha_creacion DESC
"""

        cursor.execute(query, (id_tecnico,))
        tickets = cursor.fetchall()
        print(tickets)
        # Formatear fechas
        for ticket in tickets:
            ticket['fecha_creacion'] = ticket['fecha_creacion'].strftime(
                '%Y-%m-%d %H:%M:%S')
            if ticket['ultimaActualizacion']:
                ticket['ultimaActualizacion'] = ticket['ultimaActualizacion'].strftime(
                    '%Y-%m-%d %H:%M:%S')

        cursor.close()
        conn.close()

        return jsonify(tickets)

    except Exception as e:
        print("Error al obtener tickets por técnico:", e)
        return jsonify({
            "success": False,
            "message": "Error al obtener tickets por técnico"
        }), 500
