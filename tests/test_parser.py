import json
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.services.vision import _parse_groq_response, _parse_gemini_response


def test_groq_parser_happy_path():
    """Test parsing a well-formed Groq response."""
    response = {
        "choices": [
            {
                "message": {
                    "content": json.dumps({
                        "diagnosis": "Early Blight",
                        "diagnosisHindi": "प्रारंभिक झुलसा",
                        "crop": "Tomato",
                        "confidence": 0.85,
                        "severity": "medium",
                        "isHealthy": False,
                        "symptoms": ["brown spots", "yellowing"],
                        "treatment": {
                            "immediateActions": ["remove infected leaves"],
                            "organicRemedies": ["neem spray"],
                            "futurePrevention": ["crop rotation"]
                        },
                        "warnings": ["monitor closely"]
                    })
                }
            }
        ]
    }
    result = _parse_groq_response(response)
    assert result["diagnosis"] == "Early Blight"
    assert result["crop"] == "Tomato"
    assert result["confidence"] == 0.85
    assert result["severity"] == "medium"
    assert result["isHealthy"] is False
    assert len(result["symptoms"]) == 2
    assert "immediateActions" in result["treatment"]


def test_groq_parser_with_markdown_fence():
    """Test parsing when LLM returns JSON wrapped in markdown code fence."""
    json_content = {
        "diagnosis": "Leaf Rust",
        "crop": "Wheat",
        "confidence": 0.78,
        "severity": "high",
        "isHealthy": False,
        "symptoms": ["rust-colored pustules"],
        "treatment": {
            "immediateActions": ["apply fungicide"],
            "organicRemedies": [],
            "futurePrevention": ["resistant varieties"]
        },
        "warnings": []
    }
    response = {
        "choices": [
            {
                "message": {
                    "content": f"```json\n{json.dumps(json_content)}\n```"
                }
            }
        ]
    }
    result = _parse_groq_response(response)
    assert result["diagnosis"] == "Leaf Rust"
    assert result["crop"] == "Wheat"


def test_groq_parser_with_extra_text():
    """Test parsing when LLM includes commentary before/after JSON."""
    json_content = {
        "diagnosis": "Powdery Mildew",
        "crop": "Cucumber",
        "confidence": 0.92,
        "severity": "low",
        "isHealthy": False,
        "symptoms": ["white powder on leaves"],
        "treatment": {
            "immediateActions": ["increase ventilation"],
            "organicRemedies": ["sulfur spray"],
            "futurePrevention": ["avoid overhead watering"]
        },
        "warnings": ["check humidity"]
    }
    response = {
        "choices": [
            {
                "message": {
                    "content": f"Here is my analysis:\n{json.dumps(json_content)}\nPlease follow these instructions."
                }
            }
        ]
    }
    result = _parse_groq_response(response)
    assert result["diagnosis"] == "Powdery Mildew"
    assert result["crop"] == "Cucumber"
    assert result["confidence"] == 0.92


def test_groq_parser_fallback_keys():
    """Test parser handles alternative key names."""
    response = {
        "choices": [
            {
                "message": {
                    "content": json.dumps({
                        "disease": "Bacterial Spot",  # alt for 'diagnosis'
                        "crop_name": "Pepper",  # alt for 'crop'
                        "confidence": 0.67,
                        "severity": "medium",
                        "is_healthy": False,  # alt for 'isHealthy'
                        "observations": ["water-soaked lesions"],  # alt for 'symptoms'
                        "treatment": {
                            "urgent_actions": ["remove plant"],  # alt for immediateActions
                            "organic_remedies": [],
                            "prevention": ["sanitize tools"]  # alt for futurePrevention
                        },
                        "warnings": []
                    })
                }
            }
        ]
    }
    result = _parse_groq_response(response)
    assert result["diagnosis"] == "Bacterial Spot"
    assert result["crop"] == "Pepper"
    assert result["isHealthy"] is False


def test_gemini_parser_happy_path():
    """Test parsing a well-formed Gemini response."""
    response = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": json.dumps({
                                "diagnosis": "Anthracnose",
                                "diagnosisHindi": "एन्थ्रेक्नोज",
                                "crop": "Mango",
                                "confidence": 0.89,
                                "severity": "high",
                                "isHealthy": False,
                                "symptoms": ["dark sunken spots", "fruit rot"],
                                "treatment": {
                                    "immediateActions": ["prune infected branches"],
                                    "organicRemedies": ["copper spray"],
                                    "futurePrevention": ["improve drainage"]
                                },
                                "warnings": ["spreads rapidly in rain"]
                            })
                        }
                    ]
                }
            }
        ]
    }
    result = _parse_gemini_response(response)
    assert result["diagnosis"] == "Anthracnose"
    assert result["crop"] == "Mango"
    assert result["confidence"] == 0.89
    assert result["severity"] == "high"


def test_gemini_parser_with_fence():
    """Test Gemini parser with markdown fence."""
    json_content = {
        "diagnosis": "Fusarium Wilt",
        "crop": "Tomato",
        "confidence": 0.81,
        "severity": "high",
        "isHealthy": False,
        "symptoms": ["yellowing lower leaves", "wilting"],
        "treatment": {
            "immediateActions": ["destroy infected plants"],
            "organicRemedies": [],
            "futurePrevention": ["soil solarization"]
        },
        "warnings": ["soil-borne pathogen"]
    }
    response = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": f"```json\n{json.dumps(json_content)}\n```"
                        }
                    ]
                }
            }
        ]
    }
    result = _parse_gemini_response(response)
    assert result["diagnosis"] == "Fusarium Wilt"
    assert result["crop"] == "Tomato"
