import httpx
from abc import ABC, abstractmethod
from typing import Optional
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
        self.provider_name = settings.LLM_PROVIDER.lower()
        logger.info(f"Initializing LLM Service with provider: {self.provider_name}")
        
        if self.provider_name == "gemini":
            self.provider = GeminiProvider()
        elif self.provider_name == "ollama":
            self.provider = OllamaProvider()
        else:
            logger.warning(f"Unknown provider '{self.provider_name}', defaulting to Gemini")
            self.provider = GeminiProvider()

    async def generate_completion(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        return await self.provider.generate(prompt, system_instruction=system_instruction)

llm_service = LLMService()
