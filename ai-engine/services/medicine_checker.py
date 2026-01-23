"""
Medicine Conflict Checker
Checks for drug interactions and conflicts
"""

from typing import List, Dict, Any

class MedicineChecker:
    """Check for medicine conflicts and interactions"""
    
    def __init__(self):
        # Known drug interactions (simplified)
        self.interactions = {
            'warfarin': ['aspirin', 'ibuprofen', 'naproxen'],
            'aspirin': ['warfarin', 'ibuprofen'],
            'metformin': ['alcohol'],
            'ace_inhibitor': ['potassium_supplements'],
        }
    
    def check(self, medicines: List[str]) -> Dict[str, Any]:
        """
        Check for medicine conflicts
        
        Args:
            medicines: List of medicine names
            
        Returns:
            Conflict analysis results
        """
        conflicts = []
        warnings = []
        
        # Normalize medicine names
        meds_lower = [m.lower().replace(' ', '_') for m in medicines]
        
        # Check for interactions
        for i, med1 in enumerate(meds_lower):
            for med2 in meds_lower[i+1:]:
                # Check direct interaction
                if med1 in self.interactions and med2 in self.interactions[med1]:
                    conflicts.append({
                        'medicine1': med1,
                        'medicine2': med2,
                        'severity': 'high',
                        'message': f'{med1} and {med2} may interact. Consult your doctor.',
                    })
                elif med2 in self.interactions and med1 in self.interactions[med2]:
                    conflicts.append({
                        'medicine1': med2,
                        'medicine2': med1,
                        'severity': 'high',
                        'message': f'{med2} and {med1} may interact. Consult your doctor.',
                    })
        
        # Check for duplicate active ingredients
        if len(meds_lower) != len(set(meds_lower)):
            warnings.append({
                'type': 'duplicate',
                'message': 'Possible duplicate medications detected',
            })
        
        return {
            'medicines': medicines,
            'conflicts': conflicts,
            'warnings': warnings,
            'safe': len(conflicts) == 0,
            'recommendation': 'Consult your healthcare provider before taking multiple medications' if conflicts else 'No known conflicts detected',
        }

