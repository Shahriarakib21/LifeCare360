"""
Anomaly Detector
Detects anomalies in patient health data
"""

import numpy as np
from sklearn.ensemble import IsolationForest
from typing import List, Dict, Any

class AnomalyDetector:
    """Detect anomalies in patient health data"""
    
    def __init__(self):
        self.model = IsolationForest(contamination=0.1, random_state=42)
    
    def detect(self, patient_id: str) -> Dict[str, Any]:
        """
        Detect anomalies in patient data
        
        Args:
            patient_id: Patient identifier
            
        Returns:
            Dictionary with detected anomalies
        """
        # TODO: Fetch actual patient data from database
        # This is a placeholder implementation
        
        # Sample data (replace with actual DB query)
        sample_data = self._get_sample_data()
        
        anomalies = []
        
        for metric, values in sample_data.items():
            if len(values) < 3:
                continue
            
            # Detect outliers using IQR method
            q1 = np.percentile(values, 25)
            q3 = np.percentile(values, 75)
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            
            for i, value in enumerate(values):
                if value < lower_bound or value > upper_bound:
                    anomalies.append({
                        'metric': metric,
                        'value': value,
                        'index': i,
                        'severity': 'high' if abs(value - np.mean(values)) > 2 * np.std(values) else 'medium',
                        'message': f'{metric} value {value} is outside normal range',
                    })
        
        return {
            'patientId': patient_id,
            'anomalies': anomalies,
            'count': len(anomalies),
            'critical': len([a for a in anomalies if a['severity'] == 'high']),
        }
    
    def _get_sample_data(self) -> Dict[str, List[float]]:
        """Get sample data (placeholder)"""
        return {
            'heartRate': [72, 75, 68, 120, 74, 73, 70],  # 120 is anomaly
            'temperature': [98.6, 98.7, 98.5, 102.0, 98.6, 98.8, 98.7],  # 102 is anomaly
            'glucose': [95, 98, 92, 180, 96, 94, 97],  # 180 is anomaly
        }

