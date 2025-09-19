from flask import Blueprint, request, jsonify
from database import get_db_connection
import os
import uuid
from werkzeug.utils import secure_filename
from datetime import datetime
import json

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
        id_grupo = data.get("id_grupo")
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

        # Normalizar id_grupo vacío a None
        if id_grupo == "":
            id_grupo = None
        # Insertar incluyendo id_grupo si está presente (columna 'id_grupo')
        if id_grupo is not None:
            query = """
                INSERT INTO usuarios (
                    nombre_usuario, 
                    nombre_completo, 
                    correo, 
                    telefono, 
                    contraseña, 
                    rol, 
                    estado, 
                    id_entidad1,
                    id_grupo
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (
                nombre_usuario,
                nombre_completo,
                correo,
                telefono,
                contrasena,
                rol,
                estado,
                id_entidad,
                id_grupo
            ))
        else:
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
        id_grupo = data.get("id_grupo")
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
        # Normalizar id_grupo vacío a None
        if id_grupo == "":
            id_grupo = None
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
                    id_grupo = %s,
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
                id_grupo,
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
                    id_grupo = %s,
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
                id_grupo,
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
                u.id_entidad1,
                u.id_grupo,
                g.nombre_grupo AS grupo
            FROM usuarios u
            LEFT JOIN entidades e ON u.id_entidad1 = e.id_entidad
            LEFT JOIN grupos g ON u.id_grupo = g.id_grupo
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

        # Validación de campos requeridos (categoría deja de ser obligatoria)
        if not all([prioridad, titulo, descripcion, ubicacion, tipo, solicitante]):
            return jsonify({
                "success": False,
                "message": "Faltan campos requeridos"
            }), 400

        # Si vienen vacíos, convertirlos a None para que vayan como NULL en MySQL
        grupo = grupo if grupo else None
        asignado = asignado if asignado else None

        # Normalizar categoría vacía a None para insertar NULL
        if not categoria:
            categoria = None

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
                c.id_categoria AS categoriaId,
                u.nombre_completo AS solicitante,
                u.id_usuario AS solicitanteId,
                tec.nombre_completo AS asignadoA,
                tec.id_usuario AS asignadoAId,
                g.nombre_grupo AS grupoAsignado,
                g.id_grupo AS grupoAsignadoId
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
            
            # Obtener seguimientos/soluciones del historial
            cursor.execute(
                """
                SELECT id_historial, campo_modificado, valor_nuevo, fecha_modificacion,
                       nombre_modificador
                FROM historial_tickets
                WHERE id_ticket2 = %s AND campo_modificado IN ('seguimiento','solucion')
                ORDER BY fecha_modificacion ASC
                """,
                (id_ticket,)
            )
            hist = cursor.fetchall()
            items = []
            for r in hist:
                try:
                    payload = json.loads(r['valor_nuevo']) if r['valor_nuevo'] else {}
                except Exception:
                    payload = {'descripcion': r['valor_nuevo']}
                items.append({
                    'id': r['id_historial'],
                    'tipo': r['campo_modificado'],
                    'usuario': r.get('nombre_modificador') or 'Sistema',
                    'fecha': r['fecha_modificacion'].strftime('%Y-%m-%d %H:%M:%S'),
                    'descripcion': payload.get('descripcion', ''),
                    'archivos': payload.get('archivos', []) or []
                })
            ticket['seguimientos'] = items

        cursor.close()
        conn.close()

        if not ticket:
            return jsonify({
                "success": False,
                "message": "Ticket no encontrado"
            }), 404
        print(ticket)    
        return jsonify(ticket)

    except Exception as e:
        print("Error al obtener el ticket:", e)
        return jsonify({
            "success": False,
            "message": "Error al obtener el ticket"
        }), 500


@usuarios_bp.route("/tickets/<int:id_ticket>", methods=["PUT"])
def actualizar_ticket(id_ticket):
    conn = None
    cursor = None
    try:
        # Asegurar que puede manejar FormData
        if request.content_type and request.content_type.startswith('multipart/form-data'):
            data = request.form
            archivo = request.files.get('archivo')
        else:
            data = request.get_json() or {}
            archivo = None

        # Validar campos requeridos
        #user_id = data.get("user_id")
        #user_role = data.get("user_role")

        #if not user_id or not user_role:
         #   return jsonify({
          #      "success": False,
           #     "message": "Se requieren user_id y user_role"
            #}), 400

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
        #if user_role not in ['administrador', 'tecnico'] and str(ticket['id_usuario_reporta']) != str(user_id):
         #   return jsonify({
          #      "success": False,
           #     "message": "No tienes permisos para editar este ticket"
           # }), 403

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

        # Campos adicionales (sin control de roles por ahora)
        if 'prioridad' in data:
            updates.append("prioridad = %s")
            params.append(str(data['prioridad']))

        if 'tipo' in data:
            updates.append("tipo = %s")
            params.append(str(data['tipo']))

        # Mapear nombre de categoría a id
        if 'categoria' in data and data.get('categoria'):
            cursor.execute(
                "SELECT id_categoria FROM categorias WHERE nombre_categoria = %s",
                (str(data['categoria']),)
            )
            cat = cursor.fetchone()
            if cat:
                updates.append("id_categoria1 = %s")
                params.append(cat['id_categoria'])

        # Mapear estado a formato esperado en BD (minúsculas)
        if 'estado' in data and data.get('estado'):
            estado_val = str(data['estado']).strip()
            updates.append("estado_ticket = %s")
            params.append(estado_val.lower())

        # Mapear grupo por nombre a id
        if 'grupoAsignado' in data:
            nombre_grupo = data.get('grupoAsignado')
            if nombre_grupo:
                cursor.execute(
                    "SELECT id_grupo FROM grupos WHERE nombre_grupo = %s",
                    (str(nombre_grupo),)
                )
                g = cursor.fetchone()
                if g:
                    updates.append("id_grupo1 = %s")
                    params.append(g['id_grupo'])
            else:
                # limpiar grupo si llega vacío
                updates.append("id_grupo1 = %s")
                params.append(None)

        # Mapear técnico asignado por nombre completo a id
        if 'asignadoA' in data:
            nombre_tecnico = data.get('asignadoA')
            if nombre_tecnico:
                cursor.execute(
                    "SELECT id_usuario FROM usuarios WHERE nombre_completo = %s",
                    (str(nombre_tecnico),)
                )
                t = cursor.fetchone()
                if t:
                    updates.append("id_tecnico_asignado = %s")
                    params.append(t['id_usuario'])
            else:
                updates.append("id_tecnico_asignado = %s")
                params.append(None)

        # Permitir editar la fecha de apertura si llega en formato ISO/legible
        if 'fechaApertura' in data and data.get('fechaApertura'):
            try:
                fecha_str = str(data['fechaApertura']).replace('T', ' ')
                # Intentar parsear dos formatos comunes
                try:
                    fecha_dt = datetime.strptime(fecha_str, "%Y-%m-%d %H:%M")
                except ValueError:
                    fecha_dt = datetime.strptime(fecha_str, "%Y-%m-%d %H:%M:%S")
                updates.append("fecha_creacion = %s")
                params.append(fecha_dt.strftime("%Y-%m-%d %H:%M:%S"))
            except Exception:
                pass

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
        if conn:
            conn.rollback()
        return jsonify({
            "success": False,
            "message": f"Error al actualizar ticket: {str(e)}"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()



@usuarios_bp.route("/tickets/<int:id_ticket>/seguimientos", methods=["GET"])
def listar_seguimientos(id_ticket):
    """Devuelve seguimientos y soluciones registrados en el historial para un ticket."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT id_historial, campo_modificado, valor_nuevo, fecha_modificacion,
                   nombre_modificador
            FROM historial_tickets
            WHERE id_ticket2 = %s AND campo_modificado IN ('seguimiento','solucion')
            ORDER BY fecha_modificacion ASC
            """,
            (id_ticket,)
        )
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        items = []
        for r in rows:
            desc = ""
            archivos = []
            try:
                payload = json.loads(r['valor_nuevo']) if r['valor_nuevo'] else {}
                desc = payload.get('descripcion', '')
                archivos = payload.get('archivos', []) or []
            except Exception:
                desc = r['valor_nuevo'] or ''

            items.append({
                'id': r['id_historial'],
                'tipo': r['campo_modificado'],
                'usuario': r.get('nombre_modificador') or 'Sistema',
                'fecha': r['fecha_modificacion'].strftime('%Y-%m-%d %H:%M:%S'),
                'descripcion': desc,
                'archivos': archivos
            })

        return jsonify(items)
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error al obtener seguimientos: {str(e)}'
        }), 500


def _guardar_archivos_adjuntos(files):
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    guardados = []
    for f in files or []:
        if f and allowed_file(f.filename):
            filename = f"{uuid.uuid4().hex}_{secure_filename(f.filename)}"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            f.save(filepath)
            guardados.append(filename)
    return guardados


def _resolver_usuario_por_nombre(nombre_completo):
    if not nombre_completo:
        return None, None
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT id_usuario, nombre_completo, rol FROM usuarios WHERE nombre_completo = %s",
        (nombre_completo,)
    )
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if not row:
        return None, None
    return row['id_usuario'], row['rol']


@usuarios_bp.route("/tickets/<int:id_ticket>/seguimientos", methods=["POST"])
def agregar_seguimiento(id_ticket):
    """Registra un seguimiento para el ticket. Acepta multipart/form-data con
    descripcion, usuario (nombre), tipo (seguimiento|solucion) y archivos[]."""
    conn = None
    cursor = None
    try:
        # Manejar multipart
        tipo = request.form.get('tipo', 'seguimiento')
        descripcion = request.form.get('descripcion', '').strip()
        usuario_nombre = request.form.get('usuario')
        archivos = request.files.getlist('archivos')

        if not descripcion:
            return jsonify({'success': False, 'message': 'La descripción es requerida'}), 400

        # Verificar ticket existe
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id_ticket FROM tickets WHERE id_ticket = %s", (id_ticket,))
        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Ticket no encontrado'}), 404

        # Guardar archivos
        nombres_archivos = _guardar_archivos_adjuntos(archivos)

        # Resolver usuario
        modificado_por, rol_mod = _resolver_usuario_por_nombre(usuario_nombre)

        # Insertar en historial
        payload = {
            'descripcion': descripcion,
            'archivos': nombres_archivos
        }
        cursor.execute(
            """
            INSERT INTO historial_tickets
            (id_ticket2, campo_modificado, valor_nuevo, modificado_por, nombre_modificador, rol_modificador)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (id_ticket, tipo, json.dumps(payload, ensure_ascii=False), modificado_por, usuario_nombre, rol_mod)
        )

        # Si es solución, actualizar estado del ticket y fecha_cierre
        if tipo == 'solucion':
            cursor.execute(
                "UPDATE tickets SET estado_ticket = %s, fecha_cierre = NOW(), fecha_actualizacion = NOW() WHERE id_ticket = %s",
                ('resuelto', id_ticket)
            )

        conn.commit()
        return jsonify({'success': True, 'message': 'Registro guardado correctamente'}), 201
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'message': f'Error al guardar: {str(e)}'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@usuarios_bp.route("/tickets/<int:id_ticket>/solucionar", methods=["POST"])
def solucionar_ticket(id_ticket):
    """Atajo para registrar una solución (equivalente a POST /seguimientos con tipo=solucion)."""
    # Adaptar request a tipo solucion y delegar
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        # Clonamos la request.form en un dict mutable
        form = request.form.to_dict(flat=True)
        form['tipo'] = 'solucion'
        # No podemos reasignar request.form, pero podemos usar los mismos datos en agregar_seguimiento
        # Así que simplemente llamamos la función agregando un flag en el contexto si fuera necesario.
        # Para mantenerlo simple, reutilizamos la misma lógica directamente aquí.
        # Extraer campos
        descripcion = form.get('descripcion', '').strip()
        usuario_nombre = form.get('usuario')
        archivos = request.files.getlist('archivos')

        if not descripcion:
            return jsonify({'success': False, 'message': 'La descripción es requerida'}), 400

        conn = None
        cursor = None
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT id_ticket FROM tickets WHERE id_ticket = %s", (id_ticket,))
            if not cursor.fetchone():
                return jsonify({'success': False, 'message': 'Ticket no encontrado'}), 404

            nombres_archivos = _guardar_archivos_adjuntos(archivos)
            modificado_por, rol_mod = _resolver_usuario_por_nombre(usuario_nombre)
            payload = {'descripcion': descripcion, 'archivos': nombres_archivos}
            cursor.execute(
                """
                INSERT INTO historial_tickets
                (id_ticket2, campo_modificado, valor_nuevo, modificado_por, nombre_modificador, rol_modificador)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (id_ticket, 'solucion', json.dumps(payload, ensure_ascii=False), modificado_por, usuario_nombre, rol_mod)
            )
            cursor.execute(
                "UPDATE tickets SET estado_ticket = %s, fecha_cierre = NOW(), fecha_actualizacion = NOW() WHERE id_ticket = %s",
                ('resuelto', id_ticket)
            )
            conn.commit()
            return jsonify({'success': True, 'message': 'Solución guardada y ticket resuelto'}), 201
        except Exception as e:
            if conn:
                conn.rollback()
            return jsonify({'success': False, 'message': f'Error al guardar solución: {str(e)}'}), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    else:
        # Si no es multipart, redirigir a agregar_seguimiento con tipo solucion no es trivial.
        # Requerimos multipart para archivos. Aceptamos también JSON simple.
        data = request.get_json() or {}
        # Simular como seguimiento con tipo solucion
        with request.environ.copy():
            # Reutilizamos la misma lógica de inserción con datos mínimos
            conn = None
            cursor = None
            try:
                descripcion = str(data.get('descripcion', '')).strip()
                usuario_nombre = data.get('usuario')
                if not descripcion:
                    return jsonify({'success': False, 'message': 'La descripción es requerida'}), 400
                conn = get_db_connection()
                cursor = conn.cursor(dictionary=True)
                cursor.execute("SELECT id_ticket FROM tickets WHERE id_ticket = %s", (id_ticket,))
                if not cursor.fetchone():
                    return jsonify({'success': False, 'message': 'Ticket no encontrado'}), 404
                modificado_por, rol_mod = _resolver_usuario_por_nombre(usuario_nombre)
                payload = {'descripcion': descripcion, 'archivos': []}
                cursor.execute(
                    """
                    INSERT INTO historial_tickets
                    (id_ticket2, campo_modificado, valor_nuevo, modificado_por, nombre_modificador, rol_modificador)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (id_ticket, 'solucion', json.dumps(payload, ensure_ascii=False), modificado_por, usuario_nombre, rol_mod)
                )
                cursor.execute(
                    "UPDATE tickets SET estado_ticket = %s, fecha_cierre = NOW(), fecha_actualizacion = NOW() WHERE id_ticket = %s",
                    ('resuelto', id_ticket)
                )
                conn.commit()
                return jsonify({'success': True, 'message': 'Solución guardada y ticket resuelto'}), 201
            except Exception as e:
                if conn:
                    conn.rollback()
                return jsonify({'success': False, 'message': f'Error al guardar solución: {str(e)}'}), 500
            finally:
                if cursor:
                    cursor.close()
                if conn:
                    conn.close()

@usuarios_bp.route("/encuestasatisfaccion", methods=["POST"])
def encuesta_satisfaccion():
    """Registra una encuesta de satisfacción asociada a un ticket en historial_tickets."""
    conn = None
    cursor = None
    try:
        data = request.get_json() or {}
        ticket_id = data.get('ticketId') or data.get('ticket_id') or data.get('id_ticket')
        calificacion = data.get('calificacion')
        comentario = str(data.get('comentario') or '').strip()
        usuario_nombre = data.get('usuario')
        fecha = data.get('fecha')  # opcional, informativo

        # Validaciones básicas
        if not ticket_id:
            return jsonify({'success': False, 'message': 'ticketId es requerido'}), 400
        try:
            calificacion = int(calificacion)
        except Exception:
            return jsonify({'success': False, 'message': 'calificacion debe ser numérica'}), 400
        if calificacion < 1 or calificacion > 5:
            return jsonify({'success': False, 'message': 'calificacion fuera de rango (1-5)'}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id_ticket FROM tickets WHERE id_ticket = %s", (ticket_id,))
        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Ticket no encontrado'}), 404

        modificado_por, rol_mod = _resolver_usuario_por_nombre(usuario_nombre)
        payload = {
            'calificacion': calificacion,
            'comentario': comentario,
            'fecha': fecha
        }
        cursor.execute(
            """
            INSERT INTO historial_tickets
            (id_ticket2, campo_modificado, valor_nuevo, modificado_por, nombre_modificador, rol_modificador)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (ticket_id, 'encuesta', json.dumps(payload, ensure_ascii=False), modificado_por, usuario_nombre, rol_mod)
        )

        # Al registrar la encuesta, cerrar el ticket
        cursor.execute(
            """
            UPDATE tickets
            SET estado_ticket = %s,
                fecha_cierre = COALESCE(fecha_cierre, NOW()),
                fecha_actualizacion = NOW()
            WHERE id_ticket = %s
            """,
            ('cerrado', ticket_id)
        )

        conn.commit()
        return jsonify({'success': True, 'message': 'Encuesta registrada correctamente', 'nuevo_estado': 'cerrado'}), 201
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'message': f'Error al registrar encuesta: {str(e)}'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
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
                u.id_usuario AS solicitanteId,
                t.id_tecnico_asignado AS tecnicoId,
                tech.nombre_completo AS tecnico
            FROM tickets t
            LEFT JOIN categorias c ON t.id_categoria1 = c.id_categoria
            LEFT JOIN usuarios_tickets ut ON t.id_ticket = ut.id_ticket3
            LEFT JOIN usuarios u ON ut.id_usuario1 = u.id_usuario
            LEFT JOIN usuarios tech ON t.id_tecnico_asignado = tech.id_usuario
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
        t.id_tecnico_asignado AS tecnicoId,
        tech.nombre_completo AS tecnico,
        c.nombre_categoria AS categoria,
        u.nombre_completo AS solicitante,
        u.id_usuario AS solicitanteId
    FROM tickets t
    LEFT JOIN categorias c ON t.id_categoria1 = c.id_categoria
    LEFT JOIN usuarios_tickets ut ON t.id_ticket = ut.id_ticket3
    LEFT JOIN usuarios u ON ut.id_usuario1 = u.id_usuario
    LEFT JOIN usuarios tech ON t.id_tecnico_asignado = tech.id_usuario
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
