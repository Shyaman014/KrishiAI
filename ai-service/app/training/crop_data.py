"""
Crop recommendation training data and reference notes.

The classifier is trained on the public crop recommendation table
(Crop_recommendation.csv): 2,200 labeled rows, 22 crops, features
N, P, K, temperature, humidity, ph, rainfall.

Source mirror used in this repo:
https://github.com/Gladiator07/Harvestify/blob/master/Data-processed/crop_recommendation.csv

CROP_DETAILS below are published-guideline summaries for display
(duration, water, season, soil). They are not soil measurements and
are not model features. Temperature and rainfall ranges shown to
farmers are computed from this file at training time.
"""

from __future__ import annotations

import csv
from pathlib import Path

import numpy as np

FEATURE_NAMES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
LABEL_COLUMN = "label"
DATASET_SOURCE = (
    "Public crop recommendation dataset (2,200 labeled rows, 22 crops) "
    "mirrored from Harvestify Data-processed/crop_recommendation.csv"
)

# Kept so season alignment can be checked against the same crop names as the CSV.
CROP_PARAMS = {
    "rice": {
        "N": (60, 120), "P": (20, 60), "K": (20, 60),
        "temperature": (20, 35), "humidity": (60, 95),
        "ph": (5.0, 7.0), "rainfall": (100, 250),
    },
    "maize": {
        "N": (60, 120), "P": (25, 70), "K": (20, 60),
        "temperature": (18, 35), "humidity": (50, 85),
        "ph": (5.5, 7.5), "rainfall": (50, 180),
    },
    "chickpea": {
        "N": (10, 40), "P": (40, 90), "K": (20, 60),
        "temperature": (15, 30), "humidity": (30, 70),
        "ph": (6.0, 8.0), "rainfall": (30, 100),
    },
    "kidneybeans": {
        "N": (10, 40), "P": (50, 100), "K": (15, 55),
        "temperature": (15, 30), "humidity": (40, 80),
        "ph": (5.5, 7.5), "rainfall": (60, 160),
    },
    "pigeonpeas": {
        "N": (10, 40), "P": (40, 90), "K": (10, 50),
        "temperature": (18, 35), "humidity": (40, 80),
        "ph": (5.5, 8.0), "rainfall": (40, 160),
    },
    "mothbeans": {
        "N": (10, 30), "P": (30, 70), "K": (10, 50),
        "temperature": (25, 40), "humidity": (30, 60),
        "ph": (6.0, 8.5), "rainfall": (20, 80),
    },
    "mungbean": {
        "N": (10, 40), "P": (30, 80), "K": (15, 55),
        "temperature": (25, 38), "humidity": (40, 80),
        "ph": (5.5, 7.5), "rainfall": (40, 130),
    },
    "blackgram": {
        "N": (10, 40), "P": (30, 80), "K": (15, 55),
        "temperature": (20, 35), "humidity": (40, 80),
        "ph": (5.5, 7.5), "rainfall": (50, 150),
    },
    "lentil": {
        "N": (10, 30), "P": (40, 90), "K": (15, 55),
        "temperature": (10, 25), "humidity": (30, 65),
        "ph": (6.0, 8.0), "rainfall": (25, 90),
    },
    "pomegranate": {
        "N": (20, 60), "P": (30, 80), "K": (20, 70),
        "temperature": (18, 38), "humidity": (30, 70),
        "ph": (5.5, 7.5), "rainfall": (30, 120),
    },
    "banana": {
        "N": (80, 120), "P": (20, 60), "K": (50, 120),
        "temperature": (22, 35), "humidity": (70, 95),
        "ph": (5.5, 7.0), "rainfall": (100, 250),
    },
    "mango": {
        "N": (20, 80), "P": (20, 60), "K": (20, 70),
        "temperature": (20, 38), "humidity": (45, 85),
        "ph": (5.5, 7.5), "rainfall": (50, 200),
    },
    "grapes": {
        "N": (10, 50), "P": (40, 100), "K": (30, 90),
        "temperature": (15, 35), "humidity": (40, 80),
        "ph": (5.5, 7.5), "rainfall": (30, 150),
    },
    "watermelon": {
        "N": (60, 120), "P": (20, 60), "K": (30, 80),
        "temperature": (25, 38), "humidity": (50, 85),
        "ph": (6.0, 7.5), "rainfall": (40, 130),
    },
    "muskmelon": {
        "N": (60, 110), "P": (20, 60), "K": (30, 80),
        "temperature": (25, 38), "humidity": (45, 85),
        "ph": (6.0, 7.5), "rainfall": (35, 120),
    },
    "apple": {
        "N": (20, 60), "P": (30, 80), "K": (20, 70),
        "temperature": (8, 22), "humidity": (40, 80),
        "ph": (5.5, 7.0), "rainfall": (50, 180),
    },
    "orange": {
        "N": (20, 70), "P": (20, 60), "K": (20, 70),
        "temperature": (15, 32), "humidity": (50, 85),
        "ph": (5.5, 7.5), "rainfall": (60, 180),
    },
    "papaya": {
        "N": (60, 110), "P": (25, 75), "K": (30, 90),
        "temperature": (20, 38), "humidity": (60, 90),
        "ph": (5.5, 7.5), "rainfall": (80, 220),
    },
    "coconut": {
        "N": (60, 100), "P": (25, 65), "K": (60, 130),
        "temperature": (22, 35), "humidity": (60, 95),
        "ph": (5.5, 8.0), "rainfall": (100, 250),
    },
    "cotton": {
        "N": (60, 120), "P": (20, 70), "K": (20, 70),
        "temperature": (20, 38), "humidity": (50, 85),
        "ph": (5.5, 8.0), "rainfall": (50, 180),
    },
    "jute": {
        "N": (60, 110), "P": (20, 60), "K": (20, 60),
        "temperature": (22, 36), "humidity": (70, 95),
        "ph": (6.0, 7.5), "rainfall": (100, 250),
    },
    "coffee": {
        "N": (60, 110), "P": (20, 60), "K": (30, 80),
        "temperature": (15, 28), "humidity": (60, 95),
        "ph": (5.0, 6.5), "rainfall": (100, 250),
    },
}

CROP_NAMES = list(CROP_PARAMS.keys())


def dataset_csv_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data" / "Crop_recommendation.csv"


def load_crop_dataset(
    path: Path | None = None,
) -> tuple[list[list[float]], list[str]]:
    """Load the labeled CSV. Raises if the file, columns, or values are unusable."""
    csv_path = path or dataset_csv_path()
    if not csv_path.is_file():
        raise FileNotFoundError(
            f"Crop recommendation dataset not found at '{csv_path}'. "
            "Place Crop_recommendation.csv in ai-service/data/."
        )

    features: list[list[float]] = []
    labels: list[str] = []
    with csv_path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        header = reader.fieldnames or []
        missing = [name for name in [*FEATURE_NAMES, LABEL_COLUMN] if name not in header]
        if missing:
            raise ValueError(f"Dataset is missing columns: {missing}")

        for line_no, row in enumerate(reader, start=2):
            label = (row.get(LABEL_COLUMN) or "").strip().lower()
            if not label:
                raise ValueError(f"Missing crop label on line {line_no}")
            parsed: list[float] = []
            for name in FEATURE_NAMES:
                raw = (row.get(name) or "").strip()
                try:
                    value = float(raw)
                except ValueError as exc:
                    raise ValueError(f"Non-numeric {name} on line {line_no}") from exc
                if not np.isfinite(value):
                    raise ValueError(f"Non-finite {name} on line {line_no}")
                parsed.append(value)
            features.append(parsed)
            labels.append(label)

    if len(features) < 100:
        raise ValueError(f"Dataset has only {len(features)} rows; expected the full labeled table.")
    return features, labels


def summarize_dataset(
    features: list[list[float]], labels: list[str]
) -> tuple[dict, dict]:
    """Per-crop percentiles and global min/max. These describe the file, not field trials."""
    grouped: dict[str, list[list[float]]] = {}
    for row, label in zip(features, labels):
        grouped.setdefault(label, []).append(row)

    profiles: dict[str, dict] = {}
    for label, rows in grouped.items():
        matrix = np.asarray(rows, dtype=np.float64)
        feature_stats: dict[str, dict[str, float]] = {}
        for index, name in enumerate(FEATURE_NAMES):
            column = matrix[:, index]
            feature_stats[name] = {
                "min": float(np.min(column)),
                "max": float(np.max(column)),
                "p05": float(np.percentile(column, 5)),
                "p95": float(np.percentile(column, 95)),
            }
        profiles[label] = {"n_samples": int(len(rows)), "features": feature_stats}

    matrix_all = np.asarray(features, dtype=np.float64)
    bounds: dict[str, dict[str, float]] = {}
    for index, name in enumerate(FEATURE_NAMES):
        column = matrix_all[:, index]
        bounds[name] = {"min": float(np.min(column)), "max": float(np.max(column))}
    return profiles, bounds


def format_dataset_range(stats: dict[str, float] | None, unit: str) -> str:
    if not stats:
        return "Not available in the training file."
    unit_suffix = f" {unit}" if unit else ""
    return (
        f"{stats['p05']:.1f}–{stats['p95']:.1f}{unit_suffix} "
        "(5th–95th percentile of rows with this label in the training file)"
    )


def season_alignment(crop: str, season: str | None) -> str:
    """Compare a farmer-selected season with the reference season note. Does not rescore the model."""
    if not season:
        return "not_specified"
    details = CROP_DETAILS.get(crop.lower(), {})
    text = str(details.get("suitable_season", "")).lower()
    if not text:
        return "unknown"
    selected = season.lower().strip()
    if selected == "year-round":
        return "match"
    if "year-round" in text or "year round" in text:
        return "match"
    tokens = {
        "kharif": ("kharif", "monsoon"),
        "rabi": ("rabi", "winter", "cool-season", "cool season"),
        "zaid": ("zaid", "summer"),
    }.get(selected, (selected,))
    if any(token in text for token in tokens):
        return "match"
    return "mismatch"

# --- Crop display metadata for enriching recommendations ---
CROP_DETAILS: dict[str, dict] = {
    "rice": {
        "growing_duration": "90–150 days",
        "water_requirement": "High (1200–2000 mm/season)",
        "suitable_season": "Kharif (June–November)",
        "soil_requirement": "Clay/loamy soil with good water retention, pH 5.0–7.0",
        "description": "Staple cereal crop requiring flooded or waterlogged conditions.",
        "source": "ICAR Rice Knowledge Management Portal",
    },
    "maize": {
        "growing_duration": "90–120 days",
        "water_requirement": "Medium (500–800 mm/season)",
        "suitable_season": "Kharif / Rabi",
        "soil_requirement": "Well-drained loamy soil, pH 5.5–7.5",
        "description": "Versatile cereal used for food, feed, and industrial purposes.",
        "source": "ICAR-IIMR Maize Production Guidelines",
    },
    "chickpea": {
        "growing_duration": "90–130 days",
        "water_requirement": "Low (300–500 mm/season)",
        "suitable_season": "Rabi (October–April)",
        "soil_requirement": "Well-drained sandy loam to clay loam, pH 6.0–8.0",
        "description": "Important pulse crop known for nitrogen fixation and drought tolerance.",
        "source": "ICAR-IIPR Chickpea Production Guide",
    },
    "kidneybeans": {
        "growing_duration": "80–110 days",
        "water_requirement": "Medium (350–600 mm/season)",
        "suitable_season": "Kharif / Zaid",
        "soil_requirement": "Loamy well-drained soil, pH 5.5–7.5",
        "description": "High-protein pulse crop suited to warm humid conditions.",
        "source": "ICAR-IIPR Pulse Production Guide",
    },
    "pigeonpeas": {
        "growing_duration": "120–270 days",
        "water_requirement": "Low–Medium (350–650 mm/season)",
        "suitable_season": "Kharif",
        "soil_requirement": "Sandy loam to clay loam, pH 5.5–8.0",
        "description": "Drought-tolerant perennial pulse; important in rainfed systems.",
        "source": "ICAR-IIPR Pigeonpea Guidelines",
    },
    "mothbeans": {
        "growing_duration": "60–90 days",
        "water_requirement": "Very Low (200–400 mm/season)",
        "suitable_season": "Kharif / Summer",
        "soil_requirement": "Sandy to sandy loam, pH 6.0–8.5",
        "description": "Extremely drought-resistant pulse adapted to arid regions.",
        "source": "ICAR Arid Zone Research Institute",
    },
    "mungbean": {
        "growing_duration": "60–90 days",
        "water_requirement": "Low–Medium (300–500 mm/season)",
        "suitable_season": "Kharif / Zaid",
        "soil_requirement": "Sandy loam, well-drained, pH 5.5–7.5",
        "description": "Short-duration pulse; suitable for intercropping.",
        "source": "ICAR-IIPR Mungbean Guidelines",
    },
    "blackgram": {
        "growing_duration": "60–90 days",
        "water_requirement": "Low–Medium (300–500 mm/season)",
        "suitable_season": "Kharif / Rabi",
        "soil_requirement": "Clay loam to loam, pH 5.5–7.5",
        "description": "Nutritious pulse with high lysine content.",
        "source": "ICAR-IIPR Blackgram Guidelines",
    },
    "lentil": {
        "growing_duration": "90–120 days",
        "water_requirement": "Low (250–400 mm/season)",
        "suitable_season": "Rabi",
        "soil_requirement": "Sandy loam to loam, pH 6.0–8.0",
        "description": "Cool-season pulse with high protein and iron content.",
        "source": "ICAR-IIPR Lentil Production Guide",
    },
    "pomegranate": {
        "growing_duration": "180–240 days (perennial)",
        "water_requirement": "Low–Medium (500–800 mm/year)",
        "suitable_season": "Perennial (Rabi harvest preferred)",
        "soil_requirement": "Deep well-drained loam, pH 5.5–7.5",
        "description": "High-value fruit crop tolerant to drought and salinity.",
        "source": "NHB Pomegranate Production Guidelines",
    },
    "banana": {
        "growing_duration": "270–365 days",
        "water_requirement": "High (1200–2200 mm/year)",
        "suitable_season": "Year-round (tropical)",
        "soil_requirement": "Rich loamy soil with good drainage, pH 5.5–7.0",
        "description": "Tropical fruit with high potassium requirement.",
        "source": "NHB Banana Production Guidelines",
    },
    "mango": {
        "growing_duration": "3–5 years to bearing (perennial)",
        "water_requirement": "Medium (900–1200 mm/year)",
        "suitable_season": "Summer harvest (April–June)",
        "soil_requirement": "Deep well-drained loam, pH 5.5–7.5",
        "description": "King of tropical fruits; India is world's largest producer.",
        "source": "NHB Mango Production Guide",
    },
    "grapes": {
        "growing_duration": "120–180 days per season (perennial)",
        "water_requirement": "Medium (500–800 mm/year with irrigation)",
        "suitable_season": "Winter pruning, summer harvest",
        "soil_requirement": "Sandy loam to loam, well-drained, pH 5.5–7.5",
        "description": "High-value fruit crop requiring trellising and careful pruning.",
        "source": "NHB Grape Production Guidelines",
    },
    "watermelon": {
        "growing_duration": "70–100 days",
        "water_requirement": "Medium (500–800 mm/season)",
        "suitable_season": "Zaid / Kharif",
        "soil_requirement": "Sandy loam, well-drained, pH 6.0–7.5",
        "description": "Warm-season cucurbit high in water content and lycopene.",
        "source": "ICAR Vegetable Crop Production Guide",
    },
    "muskmelon": {
        "growing_duration": "70–100 days",
        "water_requirement": "Medium (400–700 mm/season)",
        "suitable_season": "Zaid / Kharif",
        "soil_requirement": "Sandy loam, well-drained, pH 6.0–7.5",
        "description": "Sweet aromatic cucurbit suited to warm dry conditions.",
        "source": "ICAR Vegetable Crop Production Guide",
    },
    "apple": {
        "growing_duration": "140–180 days (perennial, 5–8 years to full bearing)",
        "water_requirement": "Medium (900–1200 mm/year)",
        "suitable_season": "Temperate – harvest July–October",
        "soil_requirement": "Deep well-drained loam, pH 5.5–7.0",
        "description": "Temperate fruit requiring chilling hours; grown in J&K, HP, Uttarakhand.",
        "source": "ICAR-CITH Apple Production Guidelines",
    },
    "orange": {
        "growing_duration": "Perennial; harvest varies by region",
        "water_requirement": "Medium (900–1200 mm/year)",
        "suitable_season": "Winter harvest (November–March)",
        "soil_requirement": "Sandy loam to loam, pH 5.5–7.5",
        "description": "Important citrus crop; major growing areas in Vidarbha, Coorg, NE India.",
        "source": "NHB Citrus Production Guidelines",
    },
    "papaya": {
        "growing_duration": "270–365 days",
        "water_requirement": "Medium–High (1000–1500 mm/year)",
        "suitable_season": "Year-round (tropical/subtropical)",
        "soil_requirement": "Sandy loam to loam, well-drained, pH 5.5–7.5",
        "description": "Fast-bearing tropical fruit rich in papain enzyme.",
        "source": "NHB Papaya Production Guide",
    },
    "coconut": {
        "growing_duration": "Perennial; bearing starts at 5–7 years",
        "water_requirement": "High (1200–2000 mm/year)",
        "suitable_season": "Tropical year-round",
        "soil_requirement": "Sandy loam to laterite, pH 5.5–8.0",
        "description": "Multipurpose tropical palm; major crop of coastal India.",
        "source": "ICAR-CPCRI Coconut Production Guide",
    },
    "cotton": {
        "growing_duration": "150–180 days",
        "water_requirement": "Medium (500–800 mm/season)",
        "suitable_season": "Kharif",
        "soil_requirement": "Deep black cotton soil (Vertisol) or alluvial, pH 5.5–8.0",
        "description": "Important commercial fibre crop; India is world's largest producer.",
        "source": "ICAR-CICR Cotton Production Guide",
    },
    "jute": {
        "growing_duration": "100–120 days",
        "water_requirement": "High (1000–1800 mm/season)",
        "suitable_season": "Kharif",
        "soil_requirement": "Alluvial loam, pH 6.0–7.5",
        "description": "Natural bast fibre crop; largely grown in West Bengal and Assam.",
        "source": "ICAR-NIRJAFT Jute Production Guidelines",
    },
    "coffee": {
        "growing_duration": "Perennial; bearing from 3–4 years",
        "water_requirement": "High (1000–2000 mm/year)",
        "suitable_season": "Year-round (shade-grown)",
        "soil_requirement": "Deep laterite loam, pH 5.0–6.5",
        "description": "High-value beverage crop grown under shade in Western Ghats.",
        "source": "Coffee Board of India Production Guidelines",
    },
}

