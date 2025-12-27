"""
Chemical Recommendation Safety Whitelist
Curated database of approved pesticides with safety metadata.
"""
from typing import Dict, Any, List, Optional

# Comprehensive chemical whitelist with safety metadata
CHEMICAL_WHITELIST = {
    # Fungicides
    "Mancozeb": {
        "type": "fungicide",
        "active_ingredient": "Mancozeb",
        "label_crops": ["Tomato", "Potato", "Wheat", "Rice", "Grapes", "Apple", "Mango"],
        "phi_days": 7,  # Pre-harvest interval
        "rainfastness_hours": 2,  # Hours to dry before rain
        "rain_safe": False,
        "ppe_required": ["Gloves", "Mask", "Long sleeves"],
        "application_method": ["Foliar spray"],
        "max_applications_season": 3,
        "restrictions": ["Do not apply if rain expected within 24 hours"],
        "cibrc_approved": True
    },
    "Copper Oxychloride": {
        "type": "fungicide",
        "active_ingredient": "Copper Oxychloride",
        "label_crops": ["Potato", "Tomato", "Citrus", "Grapes", "Rice", "Wheat"],
        "phi_days": 7,
        "rainfastness_hours": 4,
        "rain_safe": False,
        "ppe_required": ["Gloves", "Mask"],
        "application_method": ["Foliar spray"],
        "max_applications_season": 4,
        "restrictions": ["Avoid during flowering"],
        "cibrc_approved": True
    },
    "Carbendazim": {
        "type": "fungicide",
        "active_ingredient": "Carbendazim",
        "label_crops": ["Rice", "Wheat", "Cotton", "Vegetables", "Fruits"],
        "phi_days": 14,
        "rainfastness_hours": 3,
        "rain_safe": False,
        "ppe_required": ["Gloves", "Mask", "Eye protection"],
        "application_method": ["Foliar spray", "Seed treatment"],
        "max_applications_season": 2,
        "restrictions": ["High toxicity - use only when necessary"],
        "cibrc_approved": True
    },
    "Propiconazole": {
        "type": "fungicide",
        "active_ingredient": "Propiconazole",
        "label_crops": ["Wheat", "Rice", "Groundnut", "Soybean"],
        "phi_days": 30,
        "rainfastness_hours": 6,
        "rain_safe": True,
        "ppe_required": ["Gloves", "Mask"],
        "application_method": ["Foliar spray"],
        "max_applications_season": 2,
        "restrictions": [],
        "cibrc_approved": True
    },
    
    # Insecticides
    "Chlorpyrifos": {
        "type": "insecticide",
        "active_ingredient": "Chlorpyrifos",
        "label_crops": ["Cotton", "Rice", "Sugarcane", "Vegetables"],
        "phi_days": 14,
        "rainfastness_hours": 4,
        "rain_safe": False,
        "ppe_required": ["Gloves", "Mask", "Full protective clothing"],
        "application_method": ["Foliar spray", "Soil application"],
        "max_applications_season": 2,
        "restrictions": ["Banned in some states - check local regulations", "Do not use on fruits"],
        "cibrc_approved": True
    },
    "Imidacloprid": {
        "type": "insecticide",
        "active_ingredient": "Imidacloprid",
        "label_crops": ["Cotton", "Rice", "Vegetables", "Sugarcane", "Wheat"],
        "phi_days": 3,
        "rainfastness_hours": 1,
        "rain_safe": True,
        "ppe_required": ["Gloves", "Mask"],
        "application_method": ["Foliar spray", "Seed treatment", "Soil drench"],
        "max_applications_season": 3,
        "restrictions": ["Toxic to bees - do not spray during flowering"],
        "cibrc_approved": True
    },
    "Cypermethrin": {
        "type": "insecticide",
        "active_ingredient": "Cypermethrin",
        "label_crops": ["Cotton", "Vegetables", "Pulses", "Oilseeds"],
        "phi_days": 7,
        "rainfastness_hours": 3,
        "rain_safe": False,
        "ppe_required": ["Gloves", "Mask", "Eye protection"],
        "application_method": ["Foliar spray"],
        "max_applications_season": 3,
        "restrictions": ["Avoid during hot weather (>35°C)"],
        "cibrc_approved": True
    },
    "Neem Oil": {
        "type": "bio-insecticide",
        "active_ingredient": "Azadirachtin",
        "label_crops": ["All crops"],
        "phi_days": 0,
        "rainfastness_hours": 1,
        "rain_safe": True,
        "ppe_required": ["Gloves"],
        "application_method": ["Foliar spray"],
        "max_applications_season": 10,
        "restrictions": [],
        "cibrc_approved": True,
        "organic_approved": True
    },
    
    # Herbicides
    "2,4-D": {
        "type": "herbicide",
        "active_ingredient": "2,4-Dichlorophenoxyacetic acid",
        "label_crops": ["Wheat", "Rice", "Sugarcane", "Maize"],
        "phi_days": 60,
        "rainfastness_hours": 4,
        "rain_safe": False,
        "ppe_required": ["Gloves", "Mask", "Full protective clothing"],
        "application_method": ["Foliar spray"],
        "max_applications_season": 1,
        "restrictions": ["Highly drift-prone - avoid windy conditions", "Do not use near sensitive crops"],
        "cibrc_approved": True
    },
    "Glyphosate": {
        "type": "herbicide",
        "active_ingredient": "Glyphosate",
        "label_crops": ["Non-selective - use in fallow, plantation crops"],
        "phi_days": 30,
        "rainfastness_hours": 6,
        "rain_safe": False,
        "ppe_required": ["Gloves", "Mask", "Eye protection"],
        "application_method": ["Directed spray"],
        "max_applications_season": 2,
        "restrictions": ["Non-selective - will kill all plants", "Avoid drift to crops"],
        "cibrc_approved": True
    },
    
    # Bio-pesticides
    "Bacillus thuringiensis": {
        "type": "bio-insecticide",
        "active_ingredient": "Bt toxin",
        "label_crops": ["All crops"],
        "phi_days": 0,
        "rainfastness_hours": 1,
        "rain_safe": True,
        "ppe_required": ["Gloves"],
        "application_method": ["Foliar spray"],
        "max_applications_season": 8,
        "restrictions": ["Apply in evening (UV sensitive)"],
        "cibrc_approved": True,
        "organic_approved": True
    },
    "Trichoderma": {
        "type": "bio-fungicide",
        "active_ingredient": "Trichoderma viride/harzianum",
        "label_crops": ["All crops"],
        "phi_days": 0,
        "rainfastness_hours": 0,
        "rain_safe": True,
        "ppe_required": [],
        "application_method": ["Soil application", "Seed treatment"],
        "max_applications_season": 4,
        "restrictions": ["Do not mix with chemical fungicides"],
        "cibrc_approved": True,
        "organic_approved": True
    },
    "Pseudomonas fluorescens": {
        "type": "bio-fungicide",
        "active_ingredient": "Pseudomonas fluorescens",
        "label_crops": ["All crops"],
        "phi_days": 0,
        "rainfastness_hours": 0,
        "rain_safe": True,
        "ppe_required": [],
        "application_method": ["Seed treatment", "Soil drench"],
        "max_applications_season": 4,
        "restrictions": [],
        "cibrc_approved": True,
        "organic_approved": True
    }
}


# Alternative organic options for different disease types
ORGANIC_ALTERNATIVES = {
    "fungal_disease": [
        {"name": "Neem Oil", "application": "5ml per liter water, spray weekly"},
        {"name": "Trichoderma", "application": "Soil application 5g per kg soil"},
        {"name": "Copper-based organic fungicide", "application": "2g per liter water"},
        {"name": "Baking soda spray", "application": "1 tablespoon per gallon, preventive"}
    ],
    "bacterial_disease": [
        {"name": "Pseudomonas fluorescens", "application": "Seed treatment and foliar spray"},
        {"name": "Copper oxychloride", "application": "2g per liter water"},
        {"name": "Bordeaux mixture", "application": "1% solution, spray at disease onset"}
    ],
    "insect_pest": [
        {"name": "Neem Oil", "application": "5ml per liter water, spray every 7-10 days"},
        {"name": "Bacillus thuringiensis", "application": "1g per liter water, evening application"},
        {"name": "Garlic-chili spray", "application": "Homemade organic spray"},
        {"name": "Soap solution", "application": "1 teaspoon soap per liter water for soft-bodied insects"}
    ],
    "virus": [
        {"name": "Vector control with Neem Oil", "application": "Control aphids/whiteflies"},
        {"name": "Remove infected plants", "application": "Prevent spread"},
        {"name": "Reflective mulch", "application": "Repel insect vectors"}
    ]
}


def check_chemical_whitelist(chemical_name: str, crop: str) -> tuple[bool, Optional[Dict], Optional[str]]:
    """
    Check if chemical is in whitelist and approved for crop.
    
    Returns:
        (approved: bool, chemical_data: Optional[Dict], warning: Optional[str])
    """
    # Normalize chemical name
    chemical_name_norm = chemical_name.strip().title()
    
    # Check exact match
    if chemical_name_norm in CHEMICAL_WHITELIST:
        chem_data = CHEMICAL_WHITELIST[chemical_name_norm]
        label_crops = chem_data.get('label_crops', [])
        
        # Check crop compatibility
        if "All crops" in label_crops or "All" in label_crops:
            return True, chem_data, None
        
        # Normalize crop name for matching
        crop_norm = crop.strip().title()
        if any(crop_norm in lc or lc in crop_norm for lc in label_crops):
            return True, chem_data, None
        else:
            warning = f"{chemical_name} is not approved for {crop}. Approved for: {', '.join(label_crops[:3])}"
            return False, chem_data, warning
    
    # Check partial matches
    for wl_name, chem_data in CHEMICAL_WHITELIST.items():
        if chemical_name_norm.lower() in wl_name.lower() or wl_name.lower() in chemical_name_norm.lower():
            label_crops = chem_data.get('label_crops', [])
            crop_norm = crop.strip().title()
            
            if "All crops" in label_crops or any(crop_norm in lc or lc in crop_norm for lc in label_crops):
                return True, chem_data, f"Partial match: {wl_name}"
    
    # Not in whitelist
    return False, None, f"{chemical_name} is not in approved whitelist. Consider organic alternatives."


def get_organic_alternatives(disease_type: str) -> List[Dict[str, str]]:
    """Get organic alternatives for disease type."""
    disease_type = disease_type.lower()
    
    for key, alternatives in ORGANIC_ALTERNATIVES.items():
        if key in disease_type or disease_type in key:
            return alternatives
    
    # Default to general organic options
    return ORGANIC_ALTERNATIVES.get('fungal_disease', [])
