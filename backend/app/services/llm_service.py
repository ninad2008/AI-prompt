"""
LLM Integration Layer

Provides an extensible, modular LLM client architecture.
Uses the official Google Gen AI SDK (`google-genai`) for Gemini models.
Easily extensible to other LLM providers (e.g. OpenAI, Anthropic) via BaseLLMProvider.
"""

import os
import time
import asyncio
from abc import ABC, abstractmethod
from typing import Optional, Dict
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class MissingApiKeyError(Exception):
    """Raised when the LLM API key has not been configured."""
    pass

class LLMExecutionError(Exception):
    """Raised when an error occurs during LLM execution."""
    pass

class LLMResult(BaseModel):
    response_text: str
    execution_time: float
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    model_name: str
    provider: str

class BaseLLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @abstractmethod
    async def generate(self, prompt: str, model_name: str, temperature: float = 0.7) -> LLMResult:
        """Executes a single prompt and returns the result."""
        pass

    @abstractmethod
    def validate_configuration(self) -> bool:
        """Checks if the provider is configured and ready."""
        pass

class GeminiLLMProvider(BaseLLMProvider):
    """
    Official Google GenAI SDK integration for Gemini models.
    """

    def __init__(self, api_key: Optional[str] = None):
        self._api_key = api_key or os.getenv("GEMINI_API_KEY", "").strip()

    def set_api_key(self, api_key: str):
        self._api_key = api_key.strip()

    def get_api_key(self) -> str:
        return self._api_key

    def validate_configuration(self) -> bool:
        return bool(self._api_key and len(self._api_key) > 5)

    async def generate(self, prompt: str, model_name: str, temperature: float = 0.7) -> LLMResult:
        if not self.validate_configuration():
            raise MissingApiKeyError(
                "Gemini API key is not configured. Please obtain an API key from Google AI Studio "
                "(https://aistudio.google.com/app/apikey) and enter it in Settings or set GEMINI_API_KEY in your .env file."
            )

        from google import genai
        from google.genai import types

        start_time = time.perf_counter()
        try:
            client = genai.Client(api_key=self._api_key)

            config = types.GenerateContentConfig(
                temperature=temperature,
            )

            # Async call via official client.aio
            response = await client.aio.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config
            )

            execution_time = round(time.perf_counter() - start_time, 3)

            # Extract response text
            response_text = ""
            if response.text:
                response_text = response.text
            elif response.candidates and len(response.candidates) > 0:
                parts = response.candidates[0].content.parts
                response_text = "".join([p.text for p in parts if hasattr(p, "text") and p.text])

            # Extract usage metadata if available
            input_tokens = None
            output_tokens = None
            if hasattr(response, "usage_metadata") and response.usage_metadata:
                input_tokens = getattr(response.usage_metadata, "prompt_token_count", None)
                output_tokens = getattr(response.usage_metadata, "candidates_token_count", None)

            return LLMResult(
                response_text=response_text.strip(),
                execution_time=execution_time,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                model_name=model_name,
                provider="gemini"
            )

        except MissingApiKeyError:
            raise
        except Exception as e:
            execution_time = round(time.perf_counter() - start_time, 3)
            error_msg = str(e)
            if "API_KEY_INVALID" in error_msg or "400" in error_msg and "key" in error_msg.lower():
                raise LLMExecutionError(f"Invalid Gemini API key provided: {error_msg}")
            elif "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                raise LLMExecutionError(f"Gemini API rate limit or quota exceeded: {error_msg}")
            else:
                raise LLMExecutionError(f"Gemini API execution error ({model_name}): {error_msg}")

class LLMService:
    """Service to coordinate LLM calls across all prompt versions."""

    def __init__(self, provider: Optional[BaseLLMProvider] = None):
        self.provider = provider or GeminiLLMProvider()

    def update_api_key(self, api_key: str):
        if isinstance(self.provider, GeminiLLMProvider):
            self.provider.set_api_key(api_key)

    def is_configured(self) -> bool:
        return self.provider.validate_configuration()

    async def execute_prompt(self, prompt: str, model_name: str) -> LLMResult:
        return await self.provider.generate(prompt, model_name)

    async def execute_comparison(
        self,
        prompts: Dict[str, str],
        model_name: str
    ) -> Dict[str, LLMResult]:
        """
        Executes all three prompting techniques independently and concurrently
        using the EXACT same model and provider.
        """
        keys = list(prompts.keys())
        tasks = [
            self.provider.generate(prompt=prompts[k], model_name=model_name)
            for k in keys
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        output: Dict[str, LLMResult] = {}
        for key, res in zip(keys, results):
            if isinstance(res, Exception):
                raise res
            output[key] = res

        return output

# Global singleton service instance
llm_service = LLMService()

