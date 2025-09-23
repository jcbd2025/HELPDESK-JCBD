from typing import Any, Text, Dict, List, Optional
import os
import requests
import logging
from rasa_sdk import Action, Tracker, FormValidationAction
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
import json

# Carga opcional de variables desde .env sin romper si no existe
try:  # pragma: no cover - carga auxiliar
	from dotenv import load_dotenv  # type: ignore
	load_dotenv()
except Exception:
	pass

try:  # Cliente moderno openai>=1
	from openai import OpenAI
	_OPENAI_NEW = True
except ImportError:  # Fallback cliente legacy
	_OPENAI_NEW = False
	try:
		import openai  # type: ignore
	except ImportError:
		openai = None

API_BASE = os.getenv("HELPDESK_API_BASE", "http://localhost:5000/usuarios")

def _safe_get_slot(tracker: Tracker, slot: str, default: Optional[str] = None) -> Optional[str]:
	val = tracker.get_slot(slot)
	if isinstance(val, str):
		return val.strip()
	return val or default


class ActionCrearTicket(Action):
	def name(self) -> Text:
		return "action_crear_ticket"

	def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
		"""Crea un ticket mínimo usando el endpoint del backend.
		Valida que categoria_id y solicitante_id sean numéricos y que prioridad esté en el set permitido.
		"""
		titulo = _safe_get_slot(tracker, "titulo", "Ticket sin título")
		descripcion = _safe_get_slot(tracker, "descripcion", "Sin descripción proporcionada")
		prioridad = (_safe_get_slot(tracker, "prioridad", "media") or "media").lower()
		ubicacion = _safe_get_slot(tracker, "ubicacion", "No especificada")
		# Nueva lógica: no se pide categoría; se envía vacía para que backend la trate como NULL
		categoria_id = ""
		username = _safe_get_slot(tracker, "solicitante_username")
		solicitante_id = _safe_get_slot(tracker, "solicitante_id")  # podrá setearse tras resolver username

		logger = logging.getLogger(__name__)

		permitidas = {"baja", "media", "alta"}
		if prioridad not in permitidas:
			dispatcher.utter_message(text=f"La prioridad '{prioridad}' no es válida. Usa: baja / media / alta.")
			return []

		# Resolver solicitante por username si aún no tenemos id
		if not solicitante_id and username:
			try:
				resp_u = requests.get(f"{API_BASE}/obtener", timeout=10)
				if resp_u.ok:
					usuarios = resp_u.json()
					for u in usuarios:
						if str(u.get("nombre_usuario", "")).lower() == username.lower():
							solicitante_id = str(u.get("id_usuario"))
							break
				if not solicitante_id:
					dispatcher.utter_message(text=f"No encontré el usuario '{username}'. Verifica el nombre exacto.")
					return []
			except Exception as e:
				dispatcher.utter_message(text=f"Error buscando usuario '{username}': {e}")
				return []

		if not solicitante_id:
			dispatcher.utter_message(text="No se pudo determinar el solicitante.")
			return []
		# categoría opcional ahora (backend la permite vacía)
		if not solicitante_id.isdigit():
			dispatcher.utter_message(text=f"El ID de solicitante resuelto no es numérico: {solicitante_id}")
			return []

		data = {
			"prioridad": prioridad,
			"titulo": titulo,
			"descripcion": descripcion,
			"ubicacion": ubicacion,
			"tipo": "incidencia",
			"categoria": categoria_id,  # vacío -> backend lo vuelve NULL
			"solicitante": solicitante_id,
			"estado": "nuevo",
			"origen": "chatbot"
		}
		try:
			logger.info("[action_crear_ticket] POST %s/tickets payload=%s", API_BASE, data)
			resp = requests.post(f"{API_BASE}/tickets", data=data, timeout=15)
			logger.info("[action_crear_ticket] status=%s body=%s", resp.status_code, resp.text[:400])
			if resp.ok:
				try:
					payload = resp.json()
				except Exception:
					payload = {}
				tid = payload.get("ticket_id") or payload.get("id")
				if not tid:
					dispatcher.utter_message(text="Ticket creado pero no obtuve el ID. Verifica en el panel.")
					return []
				dispatcher.utter_message(text=f"✅ Ticket creado exitosamente. Número: {tid}")
				return [SlotSet("ticket_id", str(tid))]
			# Error
			mensaje = None
			try:
				mensaje = resp.json().get("message")
			except Exception:
				pass
			dispatcher.utter_message(text=f"No pude crear el ticket (HTTP {resp.status_code}). {mensaje or 'Revisa que los IDs existan.'}")
		except Exception as e:
			logger.exception("[action_crear_ticket] excepción")
			dispatcher.utter_message(text=f"Error al conectar con backend: {e}")
		return []


class ActionEstadoTicket(Action):
	def name(self) -> Text:
		return "action_estado_ticket"

	def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
		"""Consulta estado de un ticket cuando el usuario menciona un número.
		(Mejorable: extracción de número vía regex/entidad)."""
		# Intentar leer un número simple del último mensaje
		import re
		text = tracker.latest_message.get("text", "")
		numeros = re.findall(r"\d+", text)
		if not numeros:
			dispatcher.utter_message(text="No encontré un número de ticket en tu mensaje. Ejemplo: 'estado ticket 123'.")
			return []
		ticket_id = numeros[0]
		try:
			resp = requests.get(f"{API_BASE}/tickets/{ticket_id}", timeout=10)
			if resp.status_code == 200:
				data = resp.json()
				estado = data.get("estado") or data.get("estado_ticket") or "desconocido"
				prioridad = data.get("prioridad", "?")
				titulo = data.get("titulo", "(sin título)")
				dispatcher.utter_message(text=f"Ticket {ticket_id}: '{titulo}' | Estado: {estado} | Prioridad: {prioridad}")
			else:
				dispatcher.utter_message(text=f"No pude obtener el ticket {ticket_id}. Código {resp.status_code}.")
		except Exception as e:
			dispatcher.utter_message(text=f"Error consultando ticket {ticket_id}: {e}")
		return []


class ActionReiniciarPassword(Action):
	def name(self) -> Text:
		return "action_reiniciar_password"

	def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
		"""Placeholder para futura integración de reseteo de password (en cola)."""
		usuario = _safe_get_slot(tracker, "usuario") or "tu cuenta"
		dispatcher.utter_message(text=f"He recibido tu solicitud de restablecer contraseña para {usuario}. (Función en desarrollo)")
		return []


class ValidateTicketForm(FormValidationAction):
	def name(self) -> Text:
		return "validate_ticket_form"

	async def validate_prioridad(self, slot_value: Any, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> Dict[Text, Any]:
		val = (slot_value or "").strip().lower()
		if val in {"baja", "media", "alta"}:
			return {"prioridad": val}
		dispatcher.utter_message(text="Prioridad inválida. Usa baja / media / alta.")
		return {"prioridad": None}

	async def validate_solicitante_username(self, slot_value: Any, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> Dict[Text, Any]:
		val = (slot_value or "").strip()
		if not val:
			dispatcher.utter_message(text="El nombre de usuario no puede estar vacío.")
			return {"solicitante_username": None}
		# Aceptamos cualquier string; la resolución a ID se hace en la acción
		return {"solicitante_username": val}

	async def validate_ubicacion(self, slot_value: Any, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> Dict[Text, Any]:
		val = (slot_value or "").strip()
		if not val:
			dispatcher.utter_message(text="La ubicación no puede estar vacía. Indica algo como 'Oficina Central', 'Piso 2', 'Remoto', etc.")
			return {"ubicacion": None}
		if len(val) > 100:
			dispatcher.utter_message(text="La ubicación es muy larga (máx 100 caracteres).")
			return {"ubicacion": None}
		return {"ubicacion": val}


class ActionResponderLLM(Action):
	"""Usa la API de OpenAI para responder consultas generales.
	Si la respuesta detecta que debe escalarse (palabras clave de error/no solución), sugiere crear ticket."""

	def name(self) -> Text:
		return "action_responder_llm"

	def _build_prompt(self, user_text: str) -> str:
		instrucciones = (
			"Actúas como asistente de help desk empresarial en español. Reglas: "
			"1) Identifica rápidamente el área probable (hardware, software, red, correo, almacenamiento, acceso). "
			"2) Si el mensaje es muy corto o ambiguo, ofrece 2-4 hipótesis y pide un dato clave (ej: error exacto, cuándo ocurre, cambios recientes). "
			"3) Da pasos concretos y ordenados numerados. "
			"4) Si el tema NO es de soporte TI, reconduce y pide reformular. "
			"5) Si para resolver se requiere intervención física, permisos elevados o no hay datos suficientes tras una aclaración, termina con [CREAR_TICKET]. "
			"6) No inventes políticas internas ni datos sensibles. "
			"7) Sé breve pero útil. "
		)
		return f"{instrucciones}\n\nMensaje actual del usuario: {user_text}\nRespuesta:";

	def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
		api_key = os.getenv("OPENAI_API_KEY")
		user_text = tracker.latest_message.get("text", "")
		logger = logging.getLogger(__name__)
		if not api_key:
			dispatcher.utter_message(text="No hay clave de modelo configurada. Solicita al administrador que defina OPENAI_API_KEY.")
			return []
		if not user_text:
			dispatcher.utter_message(text="No recibí tu pregunta.")
			return []
		# Construir contexto con últimas 4 entradas del usuario (si existen)
		# Nota: simplificado: sólo concatenamos textos previos del usuario para dar más contexto
		user_events = [e for e in tracker.events if e.get("event") == "user"]
		ultimos = user_events[-4:] if len(user_events) > 4 else user_events
		contexto_prev = "\n".join(f"Usuario previo: {e.get('text')}" for e in ultimos[:-1])
		prompt_base = self._build_prompt(user_text)
		if contexto_prev:
			prompt = contexto_prev + "\n" + prompt_base
		else:
			prompt = prompt_base

		# Si es extremadamente corto, añadimos señal para hipótesis
		if len(user_text.strip()) <= 4:
			prompt += "\nNota: El input es muy corto. Inicia con hipótesis y pide detalle específico."
		elif any(p in user_text.lower() for p in ["pc", "falla", "error", "disco", "sin disco"]):
			prompt += "\nNota: Incluir posibles causas resumidas (máx 4) antes de pasos." 
		respuesta = None
		# Lista de modelos candidatos (el primero puede venir de variable de entorno)
		primary = os.getenv("OPENAI_MODEL")
		candidatos_base = [primary, "gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"]
		candidatos: List[str] = [m for m in candidatos_base if m]
		errores_modelo: List[str] = []

		for modelo in candidatos:
			try:
				if _OPENAI_NEW:
					client = OpenAI(api_key=api_key)
					comp = client.chat.completions.create(
						model=modelo,
						messages=[{"role": "system", "content": "Asistente de soporte"}, {"role": "user", "content": prompt}],
						max_tokens=400,
						temperature=0.3,
					)
					respuesta = comp.choices[0].message.content.strip()
				else:
					if openai is None:
						errores_modelo.append("openai no instalado")
						continue
					openai.api_key = api_key
					comp = openai.ChatCompletion.create(
						model=modelo,
						messages=[{"role": "system", "content": "Asistente de soporte"}, {"role": "user", "content": prompt}],
						max_tokens=400,
						temperature=0.3,
					)
					respuesta = comp.choices[0].message["content"].strip()
				logger.info("[LLM] Modelo '%s' usado con éxito", modelo)
				break
			except Exception as e:  # Capturar y probar siguiente modelo si es error de modelo
				err = str(e)
				logger.warning("[LLM] Falla modelo %s: %s", modelo, err)
				# Si es error de modelo inexistente / permisos, probamos siguiente
				if any(code in err.lower() for code in ["model_not_found", "does not have access", "404"]):
					errores_modelo.append(f"{modelo}: no autorizado / no existe")
					continue
				# Otros errores (red, timeout) se reportan y se detiene
				dispatcher.utter_message(text=f"Error consultando el asistente: {e}")
				return []

		if not respuesta:
			if errores_modelo:
				lista = ", ".join(errores_modelo)
				dispatcher.utter_message(text="No pude acceder a los modelos configurados. Detalles: " + lista + ". Pide a un administrador ajustar la variable OPENAI_MODEL o habilitar alguno de esos modelos.")
			else:
				dispatcher.utter_message(text="No obtuve respuesta del asistente. Intenta de nuevo más tarde.")
			return []

		if not respuesta:
			dispatcher.utter_message(text="No obtuve respuesta del asistente.")
			return []

		# Detectar etiqueta para ofrecer iniciar formulario de ticket
		if respuesta.endswith("[CREAR_TICKET]"):
			texto = respuesta.replace("[CREAR_TICKET]", "").rstrip()
			dispatcher.utter_message(text=texto + "\nPuedo crear un ticket si lo deseas. Di: 'crear ticket'.")
		else:
			dispatcher.utter_message(text=respuesta)
		return []

