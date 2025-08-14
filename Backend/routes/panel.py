from flask import Blueprint, jsonify

panel_bp = Blueprint("dashboard", __name__)

@panel_bp.route("/", methods=["GET"])
def dashboard():
    return jsonify({"mensaje": "Bienvenido al Dashboard"}), 200
