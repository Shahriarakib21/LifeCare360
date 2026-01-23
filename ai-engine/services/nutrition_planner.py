"""
Nutrition Planner
Generates personalized nutrition plans
"""

from typing import Dict, List, Any

class NutritionPlanner:
    """Generate personalized nutrition plans"""
    
    def __init__(self):
        self.diet_templates = {
            'vegetarian': {
                'breakfast': ['Oatmeal with fruits', 'Greek yogurt with nuts', 'Whole grain toast with avocado'],
                'lunch': ['Quinoa salad', 'Lentil soup', 'Vegetable stir-fry'],
                'dinner': ['Chickpea curry', 'Pasta with vegetables', 'Bean burrito'],
            },
            'vegan': {
                'breakfast': ['Smoothie bowl', 'Tofu scramble', 'Chia pudding'],
                'lunch': ['Hummus wrap', 'Buddha bowl', 'Vegan sushi'],
                'dinner': ['Lentil stew', 'Mushroom risotto', 'Vegan tacos'],
            },
            'halal': {
                'breakfast': ['Eggs with halal meat', 'Dates and milk', 'Falafel'],
                'lunch': ['Grilled chicken', 'Lamb curry', 'Kebab'],
                'dinner': ['Fish with rice', 'Chicken biryani', 'Meat stew'],
            },
            'none': {
                'breakfast': ['Scrambled eggs', 'Pancakes', 'Cereal'],
                'lunch': ['Grilled chicken salad', 'Sandwich', 'Soup'],
                'dinner': ['Salmon with vegetables', 'Pasta', 'Steak'],
            },
        }
    
    def generate(self, patient_id: str, preferences: Dict, goals: List[str]) -> Dict[str, Any]:
        """
        Generate nutrition plan
        
        Args:
            patient_id: Patient identifier
            preferences: Diet preferences
            goals: Health goals
            
        Returns:
            Nutrition plan
        """
        diet_type = preferences.get('diet', {}).get('type', 'none')
        restrictions = preferences.get('diet', {}).get('restrictions', [])
        
        template = self.diet_templates.get(diet_type, self.diet_templates['none'])
        
        plan = {
            'patientId': patient_id,
            'dietType': diet_type,
            'goals': goals,
            'restrictions': restrictions,
            'weeklyPlan': {},
        }
        
        # Generate weekly plan
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        for day in days:
            plan['weeklyPlan'][day] = {
                'breakfast': template['breakfast'][0],
                'lunch': template['lunch'][0],
                'dinner': template['dinner'][0],
                'snacks': ['Fruits', 'Nuts', 'Yogurt'],
            }
        
        plan['recommendations'] = self._generate_recommendations(goals, diet_type)
        
        return plan
    
    def _generate_recommendations(self, goals: List[str], diet_type: str) -> List[str]:
        """Generate dietary recommendations"""
        recommendations = []
        
        if 'weight_loss' in goals:
            recommendations.append('Reduce calorie intake by 500 calories per day')
            recommendations.append('Increase protein intake to maintain muscle mass')
        
        if 'muscle_gain' in goals:
            recommendations.append('Increase protein intake to 1.6-2.2g per kg body weight')
            recommendations.append('Consume complex carbohydrates post-workout')
        
        if 'heart_health' in goals:
            recommendations.append('Reduce saturated fats')
            recommendations.append('Increase omega-3 fatty acids')
        
        return recommendations

