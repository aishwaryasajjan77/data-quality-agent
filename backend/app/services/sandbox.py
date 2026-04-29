"""
Sandboxed execution engine for AI-generated remediation scripts.
Uses multiprocessing with restricted builtins for isolation.
"""
import multiprocessing
import traceback
import time
import pandas as pd
import numpy as np
from ..config import settings


# Allowlisted builtins — no file/network/exec access
SAFE_BUILTINS = {
    "len": len, "range": range, "str": str, "int": int,
    "float": float, "list": list, "dict": dict, "set": set,
    "tuple": tuple, "bool": bool, "print": print,
    "isinstance": isinstance, "abs": abs, "min": min, "max": max,
    "sum": sum, "sorted": sorted, "enumerate": enumerate, "zip": zip,
    "map": map, "filter": filter, "any": any, "all": all,
    "round": round, "type": type, "hasattr": hasattr,
    "getattr": getattr, "setattr": setattr, "ValueError": ValueError,
    "TypeError": TypeError, "KeyError": KeyError, "IndexError": IndexError,
    "Exception": Exception, "None": None, "True": True, "False": False,
}


def _runner(code: str, df_dict: dict, col_order: list, queue: multiprocessing.Queue):
    """Runs inside a child process with restricted globals."""
    try:
        df = pd.DataFrame(df_dict)
        if col_order:
            df = df[col_order]

        safe_globals = {"__builtins__": SAFE_BUILTINS, "pd": pd, "np": np}
        local_ns = {}
        exec(code, safe_globals, local_ns)

        if "remediate" not in local_ns:
            queue.put({"status": "failed", "error": "No remediate() function defined in script."})
            return

        result = local_ns["remediate"](df)

        if not isinstance(result, pd.DataFrame):
            queue.put({"status": "failed", "error": f"remediate() returned {type(result).__name__}, expected DataFrame."})
            return

        summary = (
            f"Input: {len(df)} rows × {len(df.columns)} cols → "
            f"Output: {len(result)} rows × {len(result.columns)} cols. "
            f"Nulls before: {df.isnull().sum().sum()}, after: {result.isnull().sum().sum()}."
        )
        queue.put({"status": "success", "output": summary})

    except Exception:
        queue.put({"status": "failed", "error": traceback.format_exc()[-1000:]})


def execute_script(code: str, df: pd.DataFrame) -> dict:
    """Execute a remediation script in a sandboxed subprocess."""
    ctx = multiprocessing.get_context("spawn")
    queue = ctx.Queue()
    col_order = list(df.columns)

    start = time.time()
    proc = ctx.Process(target=_runner, args=(code, df.to_dict(orient="list"), col_order, queue))
    proc.start()
    proc.join(timeout=settings.sandbox_timeout_seconds)
    elapsed_ms = int((time.time() - start) * 1000)

    if proc.is_alive():
        proc.terminate()
        proc.join(timeout=5)
        return {"status": "failed", "error": f"Execution timed out after {settings.sandbox_timeout_seconds}s", "execution_time_ms": elapsed_ms}

    if not queue.empty():
        result = queue.get()
        result["execution_time_ms"] = elapsed_ms
        return result

    return {"status": "failed", "error": "No output produced by sandbox.", "execution_time_ms": elapsed_ms}