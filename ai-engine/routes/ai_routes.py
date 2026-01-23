"""
AI Routes - Health analytics endpoints
"""

from flask import Blueprint, request, jsonify
from services.health_analyzer import HealthAnalyzer
from services.anomaly_detector import AnomalyDetector
from services.disease_predictor import DiseasePredictor
from services.nutrition_planner import NutritionPlanner
from services.exercise_planner import ExercisePlanner
from services.chatbot import HealthChatbot
from services.medicine_checker import MedicineChecker

bp = Blueprint('ai', __name__)

health_analyzer = HealthAnalyzer()
anomaly_detector = AnomalyDetector()
disease_predictor = DiseasePredictor()
nutrition_planner = NutritionPlanner()
exercise_planner = ExercisePlanner()
chatbot = HealthChatbot()
medicine_checker = MedicineChecker()

@bp.route('/analyze-trends', methods=['POST'])
def analyze_trends():
    """Analyze health trends from patient data"""
    try:
        data = request.json
        patient_id = data.get('patientId')
        metrics = data.get('metrics', [])
        days = data.get('days', 30)
        
        result = health_analyzer.analyze(patient_id, metrics, days)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/detect-anomalies', methods=['POST'])
def detect_anomalies():
    """Detect anomalies in patient health data"""
    try:
        data = request.json
        patient_id = data.get('patientId')
        
        result = anomaly_detector.detect(patient_id)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/predict-disease', methods=['POST'])
def predict_disease():
    """Predict potential diseases based on symptoms"""
    try:
        data = request.json
        patient_id = data.get('patientId')
        symptoms = data.get('symptoms', [])
        
        result = disease_predictor.predict(patient_id, symptoms)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/nutrition-plan', methods=['POST'])
def nutrition_plan():
    """Generate personalized nutrition plan"""
    try:
        data = request.json
        patient_id = data.get('patientId')
        preferences = data.get('preferences', {})
        goals = data.get('goals', [])
        
        result = nutrition_planner.generate(patient_id, preferences, goals)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/exercise-plan', methods=['POST'])
def exercise_plan():
    """Generate personalized exercise plan"""
    try:
        data = request.json
        patient_id = data.get('patientId')
        fitness_level = data.get('fitnessLevel', 'beginner')
        goals = data.get('goals', [])
        restrictions = data.get('restrictions', [])
        
        result = exercise_planner.generate(patient_id, fitness_level, goals, restrictions)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/chat', methods=['POST'])
def chat():
    """Chat with AI health assistant"""
    try:
        data = request.json
        message = data.get('message')
        patient_id = data.get('patientId')
        context = data.get('context', {})
        
        result = chatbot.chat(message, patient_id, context)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/check-conflicts', methods=['POST'])
def check_conflicts():
    """Check for medicine conflicts"""
    try:
        data = request.json
        medicines = data.get('medicines', [])
        
        result = medicine_checker.check(medicines)
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

