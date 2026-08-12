import httpx
from abc import ABC, abstractmethod
from typing import Optional, Dict
from app.config import settings
from app.core.logging import logger
from app.core.exceptions import LLMProviderException

class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        pass

class GeminiProvider(BaseLLMProvider):
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY is not set.")
        try:
            import google.generativeai as genai
            if settings.GEMINI_API_KEY:
                genai.configure(api_key=settings.GEMINI_API_KEY.strip())
            self.model_name = settings.GEMINI_MODEL
            self.genai = genai
        except ImportError:
            raise LLMProviderException("google-generativeai package is not installed.")

    async def generate(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        if not settings.GEMINI_API_KEY:
            raise LLMProviderException("GEMINI_API_KEY missing in environment settings.")
        try:
            model = self.genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_instruction
            )
            response = await model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini API Exception: {str(e)}")
            raise LLMProviderException(f"Gemini call failed: {str(e)}")

class GroqProvider(BaseLLMProvider):
    def __init__(self):
        if not settings.GROQ_API_KEY:
            logger.warning("GROQ_API_KEY is not set.")
        try:
            from groq import AsyncGroq
            self.client = AsyncGroq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None
            self.model_name = settings.GROQ_MODEL
        except ImportError:
            raise LLMProviderException("groq package is not installed.")

    async def generate(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        if not self.client:
            raise LLMProviderException("GROQ_API_KEY missing in environment settings.")
        
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})
        
        try:
            response = await self.client.chat.completions.create(
                messages=messages,
                model=self.model_name,
                temperature=0.7,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Groq API Exception: {str(e)}")
            raise LLMProviderException(f"Groq call failed: {str(e)}")

class OllamaProvider(BaseLLMProvider):
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip('/')
        self.model = settings.OLLAMA_MODEL

    async def generate(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        url = f"{self.base_url}/api/generate"
        full_prompt = f"{system_instruction}\n\n{prompt}" if system_instruction else prompt
        payload = {
            "model": self.model,
            "prompt": full_prompt,
            "stream": False
        }
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code != 200:
                    raise LLMProviderException(f"Ollama returned status {res.status_code}")
                data = res.json()
                return data.get("response", "")
        except Exception as e:
            logger.error(f"Ollama API Exception: {str(e)}")
            raise LLMProviderException(f"Ollama call failed: {str(e)}")

class LLMService:
    def __init__(self):
        # Merge LLM_PROVIDER into AI_PROVIDER logic
        provider_setting = settings.AI_PROVIDER.lower()
        if provider_setting == "auto" and settings.LLM_PROVIDER and settings.LLM_PROVIDER.lower() != "gemini":
            # Backward compatibility if LLM_PROVIDER was changed
            provider_setting = settings.LLM_PROVIDER.lower()
            
        self.mode = provider_setting
        self.provider_order = [p.strip() for p in settings.AI_PROVIDER_ORDER.lower().split(',')]
        
        self.providers: Dict[str, BaseLLMProvider] = {}
        logger.info(f"Initializing LLM Service with mode: {self.mode}")
        
    def _get_provider(self, name: str) -> BaseLLMProvider:
        if name not in self.providers:
            if name == "gemini":
                self.providers[name] = GeminiProvider()
            elif name == "groq":
                self.providers[name] = GroqProvider()
            elif name == "ollama":
                self.providers[name] = OllamaProvider()
            else:
                logger.warning(f"Unknown provider '{name}', defaulting to Gemini")
                self.providers[name] = GeminiProvider()
        return self.providers[name]

    async def generate_completion(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        if self.mode == "auto":
            providers_to_try = self.provider_order
        else:
            providers_to_try = [self.mode]
            
        last_error = None
        
        for provider_name in providers_to_try:
            try:
                provider = self._get_provider(provider_name)
                logger.info(f"[AI] Trying provider: {provider_name}")
                result = await provider.generate(prompt, system_instruction=system_instruction)
                logger.info(f"[AI] Provider used: {provider_name}")
                return result
            except LLMProviderException as e:
                error_msg = str(e)
                last_error = error_msg
                
                # Check if it's a provider availability/quota error
                is_provider_failure = False
                error_lower = error_msg.lower()
                for keyword in ['429', '500', '502', '503', '504', 'quota', 'rate limit', 'exhausted', 'unavailable', 'overloaded']:
                    if keyword in error_lower:
                        is_provider_failure = True
                        break
                
                if is_provider_failure:
                    logger.warning(f"[AI] {provider_name.capitalize()} provider failure ({error_msg}). Falling back to next provider if available.")
                    continue
                else:
                    logger.error(f"[AI] {provider_name.capitalize()} application error: {error_msg}. Not falling back.")
                    raise LLMProviderException(f"AI application error: {error_msg}")
            except Exception as e:
                # Unexpected errors
                logger.error(f"[AI] Unexpected error with {provider_name}: {str(e)}")
                raise LLMProviderException(f"AI service error: {str(e)}")
                
        logger.error(f"[AI] All available providers failed. Last error: {last_error}")
        raise LLMProviderException("AI service temporarily unavailable")

llm_service = LLMService()
