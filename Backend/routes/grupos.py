from flask import Blueprint, request, jsonify
from database import get_db_connection

grupos_bp = Blueprint('grupos', __name__)

@grupos_bp.route('/obtener', methods=['GET'])
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
        return jsonify({'success': False, 'message': str(e)}), 500

@grupos_bp.route('/creacion', methods=['POST'])
def crear_grupo():
    try:
        data = request.get_json()
        nombre_grupo = data.get('nombre_grupo')
        descripcion = data.get('descripcion', '')

        if not nombre_grupo:
            return jsonify({'success': False, 'message': 'Nombre del grupo es requerido'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO grupos (nombre_grupo, descripcion) VALUES (%s, %s)",
            (nombre_grupo, descripcion)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True, 'message': 'Grupo creado correctamente'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@grupos_bp.route('/actualizacion/<int:id_grupo>', methods=['PUT'])
def actualizar_grupo(id_grupo):
    try:
        data = request.get_json()
        nombre_grupo = data.get('nombre_grupo')
        descripcion = data.get('descripcion', '')

        if not nombre_grupo:
            return jsonify({'success': False, 'message': 'Nombre del grupo es requerido'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE grupos SET nombre_grupo = %s, descripcion = %s WHERE id_grupo = %s",
            (nombre_grupo, descripcion, id_grupo)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True, 'message': 'Grupo actualizado correctamente'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@grupos_bp.route('/eliminar/<int:id_grupo>', methods=['DELETE'])
def eliminar_grupo(id_grupo):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verificar si el grupo está asignado a algún ticket
        cursor.execute("SELECT COUNT(*) FROM tickets WHERE id_grupo1 = %s", (id_grupo,))
        count = cursor.fetchone()[0]
        
        if count > 0:
            cursor.close()
            conn.close()
            return jsonify({
                'success': False, 
                'message': 'No se puede eliminar el grupo porque está asignado a tickets'
            }), 400
        
        cursor.execute("DELETE FROM grupos WHERE id_grupo = %s", (id_grupo,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True, 'message': 'Grupo eliminado correctamente'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500