from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from routes.auth import auth_bp
from routes.panel import panel_bp
from routes.usuarios import usuarios_bp
from routes.categorias import categorias_bp
from routes.grupos import grupos_bp
from routes.entidades import entidades_bp



app = Flask(__name__)
CORS(app)
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(panel_bp, url_prefix="/panel") 
app.register_blueprint(usuarios_bp, url_prefix="/usuarios")
app.register_blueprint(categorias_bp, url_prefix="/categorias")
app.register_blueprint(grupos_bp, url_prefix="/grupos")
app.register_blueprint(entidades_bp, url_prefix="/entidades")

# Servir archivos subidos
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory('uploads', filename, as_attachment=False)

if __name__ == "__main__":
    app.run(debug=True)




