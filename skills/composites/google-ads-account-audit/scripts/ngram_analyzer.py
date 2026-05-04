"""
N-gram analyzer for Google Ads search terms reports.

Takes a list of search terms with cost / click / conversion data and produces
aggregated 1/2/3-word n-gram tables with cost, conversions, CPA, and ROAS.

Used by:
- google-ads-account-audit (Phase 4)
- google-ads-search-terms-miner (Phase 3)

Standard library only — no external dependencies.
"""

from collections import defaultdict
from typing import Iterable, Literal, TypedDict


NGramSize = Literal[1, 2, 3]


class SearchTermRow(TypedDict, total=False):
    search_term: str
    cost: float
    clicks: int
    conversions: float
    conv_value: float


class NGramMetrics(TypedDict):
    cost: float
    clicks: int
    conversions: float
    conv_value: float
    cpa: float | None
    roas: float | None
    sample_terms: list[str]


def tokenize(text: str) -> list[str]:
    """Lowercase + whitespace-split. No stemming, no punctuation stripping
    beyond what the Google Ads API already returns."""
    return [t.lower() for t in text.split() if t.strip()]


def ngrams(tokens: list[str], n: int) -> list[str]:
    """Sliding window of size n over tokens, joined with spaces."""
    if n <= 0 or n > len(tokens):
        return []
    return [" ".join(tokens[i : i + n]) for i in range(len(tokens) - n + 1)]


def aggregate(
    rows: Iterable[SearchTermRow],
    sizes: Iterable[NGramSize] = (1, 2, 3),
    sample_term_cap: int = 5,
) -> dict[int, dict[str, NGramMetrics]]:
    """
    Aggregate search-term rows into n-gram metrics.

    rows: iterable of dicts with keys (search_term, cost, clicks, conversions, conv_value)
    sizes: which n-gram sizes to compute (default 1, 2, 3)
    sample_term_cap: max sample search terms to keep per n-gram (default 5)

    Returns: {n: {ngram: NGramMetrics}}
    """
    accumulators: dict[int, dict[str, dict]] = {
        n: defaultdict(
            lambda: {
                "cost": 0.0,
                "clicks": 0,
                "conversions": 0.0,
                "conv_value": 0.0,
                "_terms": set(),
            }
        )
        for n in sizes
    }

    for row in rows:
        term = row.get("search_term", "")
        if not term:
            continue
        tokens = tokenize(term)
        for n in sizes:
            for ng in ngrams(tokens, n):
                bucket = accumulators[n][ng]
                bucket["cost"] += float(row.get("cost", 0))
                bucket["clicks"] += int(row.get("clicks", 0))
                bucket["conversions"] += float(row.get("conversions", 0))
                bucket["conv_value"] += float(row.get("conv_value", 0))
                bucket["_terms"].add(term)

    result: dict[int, dict[str, NGramMetrics]] = {}
    for n, ngram_dict in accumulators.items():
        result[n] = {}
        for ng, m in ngram_dict.items():
            conv = m["conversions"]
            cost = m["cost"]
            value = m["conv_value"]
            result[n][ng] = {
                "cost": round(cost, 2),
                "clicks": m["clicks"],
                "conversions": round(conv, 2),
                "conv_value": round(value, 2),
                "cpa": round(cost / conv, 2) if conv > 0 else None,
                "roas": round(value / cost, 3) if cost > 0 else None,
                "sample_terms": sorted(m["_terms"])[:sample_term_cap],
            }
    return result


def rank(
    aggregates: dict[str, NGramMetrics],
    by: Literal["cost", "roas", "waste"],
    min_spend: float = 5.0,
    min_clicks: int = 0,
    limit: int = 30,
) -> list[tuple[str, NGramMetrics]]:
    """
    Rank n-grams by cost / roas / waste.

    by="cost": top spenders, sorted by cost desc
    by="roas": top performers, sorted by roas desc, requires roas not None
    by="waste": high cost + zero conversions, sorted by cost desc
    """
    items = [
        (ng, m)
        for ng, m in aggregates.items()
        if m["cost"] >= min_spend and m["clicks"] >= min_clicks
    ]
    if by == "cost":
        items.sort(key=lambda x: x[1]["cost"], reverse=True)
    elif by == "roas":
        items = [x for x in items if x[1]["roas"] is not None]
        items.sort(key=lambda x: x[1]["roas"], reverse=True)
    elif by == "waste":
        items = [x for x in items if x[1]["conversions"] == 0]
        items.sort(key=lambda x: x[1]["cost"], reverse=True)
    return items[:limit]


def find_anomalies(
    aggregates: dict[str, NGramMetrics],
    seasonal_terms: Iterable[str] = (
        "halloween",
        "christmas",
        "thanksgiving",
        "easter",
        "valentine",
        "new year",
        "black friday",
        "cyber monday",
    ),
    intent_mismatch_terms: Iterable[str] = (
        "free download",
        "salary",
        "jobs",
        "careers",
        "tutorial",
        "course",
        "review",
        "wikipedia",
        "reddit",
        "quora",
    ),
    min_spend: float = 10.0,
) -> dict[str, list[tuple[str, NGramMetrics]]]:
    """
    Surface n-grams matching anomaly patterns at material spend.

    Returns: {category: [(ngram, metrics)]} for "seasonal" and "intent_mismatch".
    Caller is responsible for date-aware seasonal filtering — this function
    just flags presence at spend threshold.
    """
    seasonal_set = {t.lower() for t in seasonal_terms}
    mismatch_set = {t.lower() for t in intent_mismatch_terms}

    out = {"seasonal": [], "intent_mismatch": []}
    for ng, m in aggregates.items():
        if m["cost"] < min_spend:
            continue
        ng_lower = ng.lower()
        if any(s in ng_lower for s in seasonal_set):
            out["seasonal"].append((ng, m))
        if any(s in ng_lower for s in mismatch_set):
            out["intent_mismatch"].append((ng, m))

    out["seasonal"].sort(key=lambda x: x[1]["cost"], reverse=True)
    out["intent_mismatch"].sort(key=lambda x: x[1]["cost"], reverse=True)
    return out
