"""
Health Chatbot
AI-powered health assistant chatbot
"""

from typing import Dict, Any, List

class HealthChatbot:
    """Health assistant chatbot"""
    
    def __init__(self):
        self.responses = {
            'greeting': "Hello! I'm your health assistant. How can I help you today?",
            'symptoms': "I can help you understand symptoms, but please consult a healthcare provider for accurate diagnosis.",
            'medication': "I can provide general information about medications, but always follow your doctor's prescription.",
            'general': "I'm here to help with your health questions. What would you like to know?",
        }
    
    def chat(self, message: str, patient_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process chat message
        
        Args:
            message: User message
            patient_id: Patient identifier
            context: Conversation context
            
        Returns:
            Chat response
        """
        message_lower = message.lower()
        
        # Simple keyword matching (replace with actual NLP model)
        if any(word in message_lower for word in ['hello', 'hi', 'hey']):
            response = self.responses['greeting']
        elif any(word in message_lower for word in ['symptom', 'pain', 'ache', 'hurt']):
            response = self.responses['symptoms']
        elif any(word in message_lower for word in ['medicine', 'medication', 'drug', 'pill']):
            response = self.responses['medication']
        else:
            response = self.responses['general']
        
        return {
            'patientId': patient_id,
            'message': message,
            'response': response,
            'timestamp': self._get_timestamp(),
            'suggestions': self._get_suggestions(message_lower),
        }
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def _get_suggestions(self, message: str) -> List[str]:
        """Get suggested follow-up questions"""
        suggestions = [
            "What are the symptoms of flu?",
            "How to manage diabetes?",
            "When to see a doctor?",
        ]
        return suggestions[:3]

