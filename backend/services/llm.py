import google.generativeai as genai
from typing import Optional
from config import settings


class LLMService:
    """Service for interacting with Gemini LLM"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = None
        if self.api_key:
            self._configure()
    
    def _configure(self):
        """Configure the Gemini client"""
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    def configure(self, api_key: str, model_name: str = 'gemini-2.5-flash'):
        """Configure the service with a new API key and model"""
        self.api_key = api_key
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)
    
    def generate_response(
        self,
        query: str,
        context: Optional[str] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        chat_history: Optional[list] = None
    ) -> str:
        """Generate a response using Gemini"""
        if not self.api_key or not self.model:
            raise ValueError("Gemini API key not configured")
        
        # Build the prompt
        prompt_parts = []
        
        if system_prompt:
            prompt_parts.append(system_prompt)
        
        if context:
            prompt_parts.append(f"Context from Knowledge Base:\n{context}\n")
        
        # Add chat history for conversation memory
        if chat_history:
            prompt_parts.append("Previous conversation:")
            for msg in chat_history:
                role = "User" if msg.get("role") == "user" else "Assistant"
                prompt_parts.append(f"{role}: {msg.get('content', '')}")
            prompt_parts.append("")  # Empty line before current query
        
        prompt_parts.append(f"User Query: {query}")
        
        full_prompt = "\n\n".join(prompt_parts)
        
        try:
            generation_config = genai.GenerationConfig(
                temperature=temperature,
                max_output_tokens=2048
            )
            
            response = self.model.generate_content(
                full_prompt,
                generation_config=generation_config
            )
            
            return response.text
        except Exception as e:
            raise Exception(f"Error generating response: {str(e)}")
    
    def generate_with_web_context(
        self,
        query: str,
        web_results: str,
        context: Optional[str] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        chat_history: Optional[list] = None
    ) -> str:
        """Generate a response with web search results included"""
        enhanced_context = ""
        
        if web_results:
            enhanced_context += f"Web Search Results:\n{web_results}\n\n"
        
        if context:
            enhanced_context += f"Document Context:\n{context}"
        
        return self.generate_response(
            query=query,
            context=enhanced_context if enhanced_context else None,
            system_prompt=system_prompt,
            temperature=temperature,
            chat_history=chat_history
        )
