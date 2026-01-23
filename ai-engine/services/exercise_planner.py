"""
Exercise Planner
Generates personalized exercise plans
"""

from typing import List, Dict, Any

class ExercisePlanner:
    """Generate personalized exercise plans"""
    
    def __init__(self):
        self.fitness_levels = {
            'beginner': {
                'duration': 20,
                'intensity': 'low',
                'frequency': 3,
            },
            'intermediate': {
                'duration': 30,
                'intensity': 'medium',
                'frequency': 4,
            },
            'advanced': {
                'duration': 45,
                'intensity': 'high',
                'frequency': 5,
            },
        }
    
    def generate(self, patient_id: str, fitness_level: str, goals: List[str], restrictions: List[str]) -> Dict[str, Any]:
        """
        Generate exercise plan
        
        Args:
            patient_id: Patient identifier
            fitness_level: Current fitness level
            goals: Fitness goals
            restrictions: Physical restrictions
            
        Returns:
            Exercise plan
        """
        level_config = self.fitness_levels.get(fitness_level, self.fitness_levels['beginner'])
        
        plan = {
            'patientId': patient_id,
            'fitnessLevel': fitness_level,
            'goals': goals,
            'restrictions': restrictions,
            'weeklyPlan': {},
            'recommendations': [],
        }
        
        # Generate weekly plan
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        exercises = {
            'cardio': ['Running', 'Cycling', 'Swimming', 'Rowing'],
            'strength': ['Weight training', 'Bodyweight exercises', 'Resistance bands'],
            'flexibility': ['Yoga', 'Stretching', 'Pilates'],
        }
        
        for day in days:
            day_exercises = []
            
            if 'weight_loss' in goals:
                day_exercises.append({
                    'type': 'cardio',
                    'name': exercises['cardio'][0],
                    'duration': level_config['duration'],
                })
            
            if 'muscle_gain' in goals:
                day_exercises.append({
                    'type': 'strength',
                    'name': exercises['strength'][0],
                    'duration': level_config['duration'],
                })
            
            day_exercises.append({
                'type': 'flexibility',
                'name': exercises['flexibility'][0],
                'duration': 10,
            })
            
            plan['weeklyPlan'][day] = {
                'exercises': day_exercises,
                'totalDuration': sum(e['duration'] for e in day_exercises),
            }
        
        plan['recommendations'] = [
            f'Exercise {level_config["frequency"]} times per week',
            'Stay hydrated during workouts',
            'Warm up before and cool down after exercise',
        ]
        
        return plan

