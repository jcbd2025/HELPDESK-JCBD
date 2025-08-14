from flask import Blueprint, request, jsonify
from database import get_db_connection

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["POST"])
def Login():
    data = request.get_json()
    user = data.get("usuario")
    password = data.get("password")

    if not user or not password:
        return jsonify({"error": "Faltan credenciales"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Primero verificar el estado del usuario
        cursor.execute(
            "SELECT estado FROM usuarios WHERE nombre_usuario = %s",
            (user,)
        )
        estado_result = cursor.fetchone()
        
        if not estado_result:
            return jsonify({"error": "Credenciales inválidas"}), 401
        
        estado = estado_result[0]
        if estado != 'activo':
            return jsonify({
                "error": "Usuario inactivo. Contacte al administrador."
            }), 403

        # Si está activo, verificar credenciales
        cursor.execute(
            "SELECT id_usuario, nombre_completo, nombre_usuario, rol FROM usuarios WHERE nombre_usuario = %s AND contraseña = %s",
            (user, password)
        )

        usuario = cursor.fetchone()

        if usuario:
            return jsonify({
                "mensaje": "Inicio de sesión exitoso",
                "id_usuario": usuario[0],
                "nombre": usuario[1],
                "usuario": usuario[2],
                "rol": usuario[3]
            }), 200

        return jsonify({"error": "Credenciales inválidas"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()
