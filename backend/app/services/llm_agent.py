"""
Uses Google Gemini to generate Python remediation scripts for detected anomalies.
"""
import json
import google.generativeai as genai
from ..config import settings

genai.configure(api_key=settings.gemini_api_key)

SYSTEM_PROMPT = """You are an expert data remediation agent. Given a data anomaly description and the current DataFrame schema, write a safe, idempotent Python function to fix the issue.

RULES:
1. Define exactly one function: def remediate(df: pd.DataFrame) -> pd.DataFrame
2. Only use pandas (pd) and numpy (np) — both are pre-imported.
3. NO file I/O, NO network calls, NO subprocess, NO os, NO sys, NO exec/eval.
4. The function MUST return a DataFrame.
5. Handle edge cases (empty DataFrame, column already fixed, etc.).
6. Be conservative — prefer filling/coercing over dropping data.

RESPONSE FORMAT — respond with ONLY a JSON object, no markdown fences:
{"code": "def remediate(df):\\n    ...", "explanation": "One paragraph explaining what the script does and why."}
"""


def generate_remediation(anomaly: dict, schema: dict) -> dict:
    """Call Gemini to generate a remediation script."""
    model = genai.GenerativeModel("gemini-2.0-flash")

    prompt = f"""{SYSTEM_PROMPT}

ANOMALY:
{json.dumps(anomaly, indent=2)}

CURRENT SCHEMA:
{json.dumps(schema, indent=2)}

Respond with ONLY a JSON object."""

    try:
        resp = model.generate_content(prompt)
        text = resp.text.strip()

        # Strip markdown fences if present
        if text.startswith("```"):
            lines = text.split("\n")
            lines = [l for l in lines if not l.strip().startswith("```")]
            text = "\n".join(lines).strip()

        parsed = json.loads(text)
        if "code" not in parsed:
            raise ValueError("Missing 'code' key in LLM response")
        return parsed

    except (json.JSONDecodeError, ValueError, Exception) as e:
        # Fallback: return a no-op script
        return {
            "code": "def remediate(df):\n    # Auto-generated fallback (LLM parse failed)\n    return df",
            "explanation": f"LLM generation failed: {str(e)[:200]}. Fallback no-op script was created.",
        }