"""
Health Trend Analyzer
Analyzes patient health data trends over time
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any

class HealthAnalyzer:
    """Analyze health trends from patient EHR data"""
    
    def __init__(self):
        self.metrics = ['bloodPressure', 'heartRate', 'temperature', 'weight', 'bmi', 'glucose', 'hb']
    
    def analyze(self, patient_id: str, metrics: List[str], days: int = 30) -> Dict[str, Any]:
        """
        Analyze health trends for specified metrics
        
        Args:
            patient_id: Patient identifier
            metrics: List of metrics to analyze
            days: Number of days to analyze
            
        Returns:
            Dictionary with trend analysis results
        """
        # TODO: Fetch actual patient data from database
        # This is a placeholder implementation
        
        results = {}
        
        for metric in metrics:
            if metric not in self.metrics:
                continue
                
            # Generate sample trend data (replace with actual DB query)
            trend_data = self._generate_sample_trend(metric, days)
            
            # Calculate statistics
            values = [d['value'] for d in trend_data]
            
            results[metric] = {
                'trend': trend_data,
                'current': values[-1] if values else None,
                'average': np.mean(values) if values else None,
                'min': np.min(values) if values else None,
                'max': np.max(values) if values else None,
                'change': self._calculate_change(values),
                'status': self._determine_status(metric, values[-1] if values else None),
            }
        
        return {
            'patientId': patient_id,
            'period': f'{days} days',
            'metrics': results,
            'summary': self._generate_summary(results),
        }
    
    def _generate_sample_trend(self, metric: str, days: int) -> List[Dict]:
        """Generate sample trend data (placeholder)"""
        trend = []
        base_date = datetime.now() - timedelta(days=days)
        
        # Base values for different metrics
        base_values = {
            'bloodPressure': {'systolic': 120, 'diastolic': 80},
            'heartRate': 72,
            'temperature': 98.6,
            'weight': 70,
            'bmi': 22,
            'glucose': 100,
            'hb': 14,
        }
        
        for i in range(days):
            date = base_date + timedelta(days=i)
            if metric == 'bloodPressure':
                value = {
                    'systolic': base_values[metric]['systolic'] + np.random.normal(0, 5),
                    'diastolic': base_values[metric]['diastolic'] + np.random.normal(0, 3),
                }
            else:
                value = base_values.get(metric, 0) + np.random.normal(0, 2)
            
            trend.append({
                'date': date.isoformat(),
                'value': value,
            })
        
        return trend
    
    def _calculate_change(self, values: List[float]) -> Dict[str, float]:
        """Calculate percentage change"""
        if len(values) < 2:
            return {'percentage': 0, 'direction': 'stable'}
        
        first_half = np.mean(values[:len(values)//2])
        second_half = np.mean(values[len(values)//2:])
        
        if first_half == 0:
            return {'percentage': 0, 'direction': 'stable'}
        
        change = ((second_half - first_half) / first_half) * 100
        
        return {
            'percentage': round(change, 2),
            'direction': 'increasing' if change > 0 else 'decreasing' if change < 0 else 'stable',
        }
    
    def _determine_status(self, metric: str, value: Any) -> str:
        """Determine health status for metric"""
        # Normal ranges (simplified)
        ranges = {
            'bloodPressure': {'normal': (90, 140), 'high': (140, 180)},
            'heartRate': {'normal': (60, 100), 'high': (100, 150)},
            'temperature': {'normal': (97, 99), 'high': (99, 103)},
            'bmi': {'normal': (18.5, 25), 'high': (25, 30)},
            'glucose': {'normal': (70, 100), 'high': (100, 125)},
            'hb': {'normal': (12, 16), 'low': (8, 12)},
        }
        
        if metric not in ranges:
            return 'normal'
        
        if metric == 'bloodPressure':
            if isinstance(value, dict):
                sys = value.get('systolic', 0)
                if sys > 140:
                    return 'high'
                elif sys < 90:
                    return 'low'
                return 'normal'
        
        range_def = ranges[metric]
        if isinstance(value, (int, float)):
            if 'normal' in range_def:
                min_val, max_val = range_def['normal']
                if value < min_val:
                    return 'low'
                elif value > max_val:
                    return 'high'
                return 'normal'
        
        return 'normal'
    
    def _generate_summary(self, results: Dict) -> str:
        """Generate human-readable summary"""
        if not results:
            return 'No data available for analysis'
        
        summary_parts = []
        for metric, data in results.items():
            status = data.get('status', 'normal')
            if status != 'normal':
                summary_parts.append(f"{metric} is {status}")
        
        if not summary_parts:
            return 'All metrics are within normal ranges'
        
        return '; '.join(summary_parts)

