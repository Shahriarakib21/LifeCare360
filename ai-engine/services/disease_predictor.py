"""
Disease Predictor
Predicts potential diseases based on symptoms
"""

from typing import List, Dict, Any

class DiseasePredictor:
    """Predict diseases based on symptoms"""
    
    def __init__(self):
        # Symptom to disease mapping (simplified)
        self.symptom_disease_map = {
            'fever': ['flu', 'infection', 'covid-19'],
            'cough': ['flu', 'cold', 'covid-19', 'bronchitis'],
            'headache': ['migraine', 'tension', 'sinusitis'],
            'fatigue': ['anemia', 'thyroid', 'depression'],
            'chest_pain': ['heart_disease', 'anxiety', 'acid_reflux'],
            'shortness_of_breath': ['asthma', 'copd', 'heart_disease'],
        }
    
    def predict(self, patient_id: str, symptoms: List[str]) -> Dict[str, Any]:
        """
        Predict potential diseases
        
        Args:
            patient_id: Patient identifier
            symptoms: List of symptoms
            
        Returns:
            Dictionary with predictions
        """
        if not symptoms:
            return {
                'patientId': patient_id,
                'predictions': [],
                'confidence': 0,
            }
        
        # Count disease occurrences
        disease_scores = {}
        for symptom in symptoms:
            diseases = self.symptom_disease_map.get(symptom.lower(), [])
            for disease in diseases:
                disease_scores[disease] = disease_scores.get(disease, 0) + 1
        
        # Sort by score
        sorted_diseases = sorted(
            disease_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        predictions = []
        for disease, score in sorted_diseases[:5]:  # Top 5
            confidence = min(score / len(symptoms) * 100, 95)  # Cap at 95%
            predictions.append({
                'disease': disease,
                'confidence': round(confidence, 2),
                'symptoms_matched': score,
            })
        
        return {
            'patientId': patient_id,
            'predictions': predictions,
            'total_symptoms': len(symptoms),
            'recommendation': 'Consult with a healthcare provider for accurate diagnosis',
        }

