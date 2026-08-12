import os
from typing import Dict
from app.core.logging import logger
from app.core.exceptions import AIServiceException

_prompt_cache: Dict[str, str] = {}

def get_prompt(template_name: str, **kwargs) -> str:
    """
    Dynamically loads and caches prompt templates from app/prompts/ directory.
    Substitutes formatted key-value arguments.
    """
    if template_name not in _prompt_cache:
        prompts_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts")
        file_path = os.path.join(prompts_dir, f"{template_name}.txt")

        if not os.path.exists(file_path):
            logger.error(f"Prompt template file missing: {file_path}")
            raise AIServiceException(f"Prompt template '{template_name}' not found.")

        with open(file_path, "r", encoding="utf-8") as f:
            _prompt_cache[template_name] = f.read()

    template_str = _prompt_cache[template_name]
    for k, v in kwargs.items():
        template_str = template_str.replace(f"{{{k}}}", str(v))
    return template_str
