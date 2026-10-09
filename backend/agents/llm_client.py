import json
import logging
import os
import re
from typing import Dict, Any, Optional
from backend.config import settings

logger = logging.getLogger(__name__)

class LLMClient:
    """
    Unified LLM caller that prioritizes:
    1. Gemini API (google.generativeai) if GEMINI_API_KEY is configured
    2. OpenAI API if OPENAI_API_KEY is configured
    3. Intelligent Domain Engine fallback for offline/demo operation
    """

    @classmethod
    def generate_json(cls, prompt: str, system_instruction: str = "", fallback_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        # Try Gemini
        if settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                import time
                for model_name in ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash"]:
                    for attempt in range(2):
                        try:
                            model = genai.GenerativeModel(model_name)
                            full_prompt = f"{system_instruction}\n\n{prompt}\n\nPlease reply ONLY with valid JSON."
                            response = model.generate_content(full_prompt)
                            text = response.text.strip()
                            clean = re.sub(r'^```json\s*|\s*```$', '', text, flags=re.MULTILINE).strip()
                            try:
                                return json.loads(clean)
                            except Exception:
                                match = re.search(r'(\{[\s\S]*\})', text)
                                if match:
                                    return json.loads(match.group(1))
                                raise
                        except Exception as model_err:
                            err_str = str(model_err).lower()
                            if "429" in err_str or "quota" in err_str or "resourceexhausted" in err_str:
                                wait_sec = 2.5 * (attempt + 1)
                                logger.info(f"Gemini rate limit encountered for {model_name}. Pausing {wait_sec}s before retry (attempt {attempt+1}/2)...")
                                time.sleep(wait_sec)
                                continue
                            logger.debug(f"Model {model_name} attempt {attempt+1} failed: {model_err}")
                            break
            except Exception as e:
                logger.warning(f"Gemini API call failed: {e}. Falling back.")

        # Try OpenAI
        if settings.OPENAI_API_KEY:
            try:
                import urllib.request
                req_data = {
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_instruction + " Reply strictly with JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    "response_format": {"type": "json_object"}
                }
                req = urllib.request.Request(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    data=json.dumps(req_data).encode("utf-8")
                )
                with urllib.request.urlopen(req, timeout=30) as resp:
                    res_body = json.loads(resp.read().decode("utf-8"))
                    content = res_body["choices"][0]["message"]["content"]
                    return json.loads(content)
            except Exception as e:
                logger.warning(f"OpenAI API call failed: {e}. Falling back to domain engine.")

        # Default domain scientific reasoning fallback
        if fallback_data is not None:
            return fallback_data

        return {}

    @classmethod
    def generate_text(cls, prompt: str, system_instruction: str = "", fallback_text: str = "") -> str:
        """Generates natural language text using Gemini, OpenAI, or domain fallback."""
        # Try Gemini
        if settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                import time
                for model_name in ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash"]:
                    for attempt in range(2):
                        try:
                            model = genai.GenerativeModel(model_name)
                            full_prompt = f"{system_instruction}\n\n{prompt}" if system_instruction else prompt
                            response = model.generate_content(full_prompt)
                            if response and response.text:
                                return response.text.strip()
                        except Exception as model_err:
                            err_str = str(model_err).lower()
                            if "429" in err_str or "quota" in err_str or "resourceexhausted" in err_str:
                                wait_sec = 2.0 * (attempt + 1)
                                logger.info(f"Gemini rate limit encountered for {model_name}. Pausing {wait_sec}s...")
                                time.sleep(wait_sec)
                                continue
                            logger.debug(f"Model {model_name} attempt {attempt+1} failed: {model_err}")
                            break
            except Exception as e:
                logger.warning(f"Gemini text generation failed: {e}. Falling back.")

        # Try OpenAI
        if settings.OPENAI_API_KEY:
            try:
                import urllib.request
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})

                req_data = {
                    "model": "gpt-4o-mini",
                    "messages": messages,
                }
                req = urllib.request.Request(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    data=json.dumps(req_data).encode("utf-8")
                )
                with urllib.request.urlopen(req, timeout=30) as resp:
                    res_body = json.loads(resp.read().decode("utf-8"))
                    return res_body["choices"][0]["message"]["content"].strip()
            except Exception as e:
                logger.warning(f"OpenAI text generation failed: {e}. Falling back.")

        return fallback_text

