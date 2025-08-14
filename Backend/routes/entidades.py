from flask import Blueprint, request, jsonify
from database import get_db_connection

entidades_bp = Blueprint('entidades', __name__)

@entidades_bp.route('/obtener', methods=['GET'])
def obtener_entidades():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM entidades")
        entidades = cursor.fetchall()
        return jsonify(entidades)
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@entidades_bp.route('/creacion', methods=['POST'])
def crear_entidad():
    data = request.get_json()
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO entidades (nombre_entidad, descripcion) VALUES (%s, %s)",
            (data['nombre_entidad'], data['descripcion'])
        )
        conn.commit()
        return jsonify({'success': True, 'message': 'Entidad creada correctamente'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@entidades_bp.route('/actualizacion/<int:id_entidad>', methods=['PUT'])
def actualizar_entidad(id_entidad):
    data = request.get_json()
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE entidades SET nombre_entidad = %s, descripcion = %s WHERE id_entidad = %s",
            (data['nombre_entidad'], data['descripcion'], id_entidad)
        )
        conn.commit()
        return jsonify({'success': True, 'message': 'Entidad actualizada correctamente'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@entidades_bp.route('/eliminar/<int:id_entidad>', methods=['DELETE'])
def eliminar_entidad(id_entidad):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verificar si hay usuarios asociados a esta entidad
        cursor.execute("SELECT COUNT(*) FROM usuarios WHERE id_entidad1 = %s", (id_entidad,))
        count = cursor.fetchone()[0]
        
        if count > 0:
            return jsonify({'success': False, 'message': 'No se puede eliminar la entidad porque tiene usuarios asociados'}), 400
        
        cursor.execute("DELETE FROM entidades WHERE id_entidad = %s", (id_entidad,))
        conn.commit()
        return jsonify({'success': True, 'message': 'Entidad eliminada correctamente'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()