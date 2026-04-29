"""
Fetches data from registered sources and builds schema profiles.
"""
import pandas as pd
import httpx
from io import StringIO


async def fetch_dataframe(source_type: str, connection_info: dict) -> pd.DataFrame:
    """Fetch a DataFrame from the given source."""
    if source_type == "csv_url":
        url = connection_info["url"]
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return pd.read_csv(StringIO(resp.text))

    elif source_type == "json_url":
        url = connection_info["url"]
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return pd.json_normalize(resp.json())

    raise ValueError(f"Unsupported source_type: {source_type}")


def profile_dataframe(df: pd.DataFrame) -> dict:
    """Build a schema profile from a DataFrame."""
    profile = {
        "columns": {},
        "row_count": len(df),
        "column_count": len(df.columns),
    }
    for col in df.columns:
        series = df[col]
        col_profile = {
            "dtype": str(series.dtype),
            "null_count": int(series.isnull().sum()),
            "null_pct": round(float(series.isnull().mean()), 4),
            "unique_count": int(series.nunique()),
            "sample_values": series.dropna().head(3).astype(str).tolist(),
        }
        # Add numeric stats
        if pd.api.types.is_numeric_dtype(series):
            col_profile["mean"] = round(float(series.mean()), 2) if not series.empty else None
            col_profile["std"] = round(float(series.std()), 2) if not series.empty else None
            col_profile["min"] = float(series.min()) if not series.empty else None
            col_profile["max"] = float(series.max()) if not series.empty else None

        profile["columns"][col] = col_profile

    return profile