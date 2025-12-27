"""
Validator Agent (The Safety Net)
Cross-checks recommendations against comprehensive chemical whitelist with safety metadata.
Ensures regional safety compliance under the Insecticides Act, 1968.
Includes weather-aware guards for rain-sensitive chemicals.
"""
from typing import Dict, Any, List, Optional
import logging

try:
    from services.chemical_whitelist import (
        CHEMICAL_WHITELIST, check_chemical_whitelist, 
        get_organic_alternatives, ORGANIC_ALTERNATIVES
    )
except ImportError:
    from backend.services.chemical_whitelist import (
        CHEMICAL_WHITELIST, check_chemical_whitelist,
        get_organic_alternatives, ORGANIC_ALTERNATIVES
    )

logger = logging.getLogger(__name__)

# Legacy registry kept for backwards compatibility
CIBRC_REGISTRY = {
    "Mancozeb": {
        "crops": ["Tomato", "Potato", "Wheat", "Rice", "Grapes"],
        "regions": ["All India"],
        "rain_safe": False,
        "waiting_period_days": 7,
    },
    "Chlorpyrifos": {
        "crops": ["Cotton", "Rice", "Sugarcane"],
        "regions": ["All India"],
        "rain_safe": False,
        "waiting_period_days": 14,
    },
    "Imidacloprid": {
        "crops": ["Cotton", "Rice", "Vegetables"],
        "regions": ["All India"],
        "rain_safe": True,
        "waiting_period_days": 3,
    },
    "Copper Oxychloride": {
        "crops": ["Potato", "Tomato", "Citrus", "Grapes"],
        "regions": ["All India"],
        "rain_safe": False,
        "waiting_period_days": 7,
    },
    "Neem Oil": {
        "crops": ["All"],
        "regions": ["All India"],
        "rain_safe": True,
        "waiting_period_days": 0,
    },
}


def validate_recommendations(
    crop: str,
    recommendations: List[Dict[str, Any]],
    context: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Validate pesticide/treatment recommendations against comprehensive chemical whitelist.
    
    Safety checks:
    - Whitelist verification (CIB&RC approved chemicals only)
    - Crop-label compatibility
    - Rain forecast warnings for non-rain-safe chemicals
    - PHI (Pre-Harvest Interval) compliance
    - PPE requirements
    - Application restrictions
    
    Falls back to organic alternatives when:
    - Chemical not in whitelist
    - Crop mismatch
    - Rain forecast + non-rain-safe
    - Low confidence diagnosis
    """
    validated = []
    warnings: List[str] = []
    rejected_chemicals = []

    rain_forecast = context.get("rain_forecast", False)
    rain_hours = context.get("rain_hours_ahead", 48)  # Hours until rain
    region = context.get("region", "All India")
    confidence = context.get("confidence", 0.5)
    confidence_band = context.get("confidence_band", "medium")

    # If confidence is low, prefer organic options
    if confidence_band == "low":
        warnings.append(
            "⚠️ Low confidence diagnosis detected. Recommending organic alternatives as safer option."
        )
        # Add organic alternatives
        disease_type = context.get("diagnosis", "fungal_disease").lower()
        organics = get_organic_alternatives(disease_type)
        for org in organics:
            validated.append({
                "treatment": org['name'],
                "application": org['application'],
                "type": "organic",
                "cibrc_status": "organic_approved",
                "safety_rating": "high"
            })
        return {"validated": validated, "warnings": warnings}

    for rec in recommendations:
        chemical_name = rec.get("pesticide") or rec.get("active_ingredient") or rec.get("name", "")
        
        if not chemical_name:
            continue

        # Check whitelist
        approved, chem_data, warning_msg = check_chemical_whitelist(chemical_name, crop)
        
        rec_validated = rec.copy()
        rec_validated["cibrc_status"] = "unknown"

        if not approved or chem_data is None:
            warnings.append(warning_msg or f"⚠️ '{chemical_name}' not in approved whitelist.")
            rejected_chemicals.append(chemical_name)
            rec_validated["cibrc_status"] = "rejected"
            # Don't include in validated list
            continue
        
        # Chemical is in whitelist
        rec_validated["cibrc_status"] = "approved"
        rec_validated["active_ingredient"] = chem_data.get("active_ingredient")
        rec_validated["phi_days"] = chem_data.get("phi_days", 0)
        rec_validated["ppe_required"] = chem_data.get("ppe_required", [])
        rec_validated["restrictions"] = chem_data.get("restrictions", [])
        
        # Weather-aware guard: rain forecast check
        if rain_forecast:
            rainfastness_hours = chem_data.get("rainfastness_hours", 24)
            rain_safe = chem_data.get("rain_safe", False)
            
            if not rain_safe and rain_hours <= rainfastness_hours:
                warnings.append(
                    f"🌧️ Rain forecast in {rain_hours}h. '{chemical_name}' requires {rainfastness_hours}h drying time. "
                    f"Defer application or use rain-safe alternative."
                )
                rec_validated["rain_warning"] = "defer"
                rec_validated["defer_reason"] = f"Rain expected within {rain_hours} hours"
                # Downgrade this recommendation
                rec_validated["priority"] = "low"
            elif not rain_safe:
                rec_validated["rain_warning"] = "caution"
                warnings.append(
                    f"🌧️ '{chemical_name}' is not rain-safe. Ensure {rainfastness_hours}h dry period after application."
                )
        
        # Add restriction warnings
        for restriction in chem_data.get("restrictions", []):
            warnings.append(f"⚠️ {chemical_name}: {restriction}")
        
        validated.append(rec_validated)

    # If all chemicals rejected, add organic alternatives
    if len(validated) == 0 and len(rejected_chemicals) > 0:
        warnings.append(
            "All chemical recommendations rejected. Showing organic alternatives."
        )
        disease_type = context.get("diagnosis", "fungal_disease").lower()
        organics = get_organic_alternatives(disease_type)
        for org in organics:
            validated.append({
                "treatment": org['name'],
                "application": org['application'],
                "type": "organic",
                "cibrc_status": "organic_approved",
                "safety_rating": "high"
            })

    return {
        "validated": validated,
        "warnings": warnings,
        "rejected": rejected_chemicals
    }


def lookup_pesticide(crop: str, disease: str) -> List[Dict[str, Any]]:
    """
    Lookup recommended pesticides for a given crop and disease.
    Returns CIB&RC compliant options.
    """
    # Simple mapping - in production, use vector search on CIB&RC documents
    disease_pesticide_map = {
        "Late Blight": ["Mancozeb", "Copper Oxychloride"],
        "Early Blight": ["Mancozeb", "Copper Oxychloride"],
        "Powdery Mildew": ["Neem Oil"],
        "Aphids": ["Imidacloprid", "Neem Oil"],
        "Bollworm": ["Chlorpyrifos"],
    }

    pesticides = disease_pesticide_map.get(disease, ["Neem Oil"])
    recommendations = []

    for p in pesticides:
        entry = CIBRC_REGISTRY.get(p, {})
        if "All" in entry.get("crops", []) or crop in entry.get("crops", []):
            recommendations.append({
                "pesticide": p,
                "crop": crop,
                "disease": disease,
                "cibrc_status": "approved",
                "waiting_period_days": entry.get("waiting_period_days", 0),
            })

    return recommendations
