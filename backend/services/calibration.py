"""
Confidence Calibration Module
Applies learned calibration to fuse multi-source confidence signals and provide
calibrated overall confidence with risk bands (high/medium/low).
"""
import os
import json
import logging
from typing import Dict, Any, Optional, List
import numpy as np

logger = logging.getLogger(__name__)

class ConfidenceCalibrator:
    """
    Calibrates confidence scores using temperature scaling or logistic regression.
    
    Features used:
    - image_quality_score: float [0-1]
    - POI: float [0-100]
    - POI_confidence: float [0-1] 
    - crop_confidence: float [0-1]
    - llm_confidence: float [0-1]
    - model_pipeline: categorical (heuristic=0, u2net_only=0.5, u2net+vit=1)
    """
    
    def __init__(self, calibration_file: Optional[str] = None):
        """Initialize calibrator with optional pre-fitted parameters."""
        self.calibration_file = calibration_file or "models/calibration_params.json"
        self.temperature = 1.5  # Default temperature (higher = more conservative)
        self.logistic_weights = None
        self.logistic_bias = 0.0
        self.load_calibration()
    
    def load_calibration(self):
        """Load calibration parameters if available."""
        if os.path.exists(self.calibration_file):
            try:
                with open(self.calibration_file, 'r') as f:
                    params = json.load(f)
                self.temperature = params.get('temperature', 1.5)
                self.logistic_weights = params.get('logistic_weights')
                self.logistic_bias = params.get('logistic_bias', 0.0)
                logger.info("Loaded calibration parameters from %s", self.calibration_file)
            except Exception as e:
                logger.warning("Failed to load calibration params: %s", e)
    
    def extract_features(self, inference_data: Dict[str, Any]) -> np.ndarray:
        """
        Extract feature vector from inference data.
        
        Returns: numpy array of shape (6,)
        """
        # Image quality (0-1)
        img_quality = inference_data.get('image_quality_score', 0.8)
        
        # POI normalized (0-1)
        poi = min(inference_data.get('POI', 0.0) / 100.0, 1.0)
        
        # POI confidence (0-1)
        poi_conf = inference_data.get('POI_confidence', 0.0)
        
        # Crop confidence (0-1)
        crop_conf = inference_data.get('crop_confidence', inference_data.get('confidence', 0.5))
        
        # LLM/diagnosis confidence (0-1)
        llm_conf = inference_data.get('confidence', 0.5)
        
        # Pipeline encoding: heuristic=0, u2net_only=0.5, u2net+vit=1
        pipeline = inference_data.get('pipeline', 'heuristic')
        if pipeline == 'u2net+vit':
            pipeline_val = 1.0
        elif 'u2net' in pipeline:
            pipeline_val = 0.5
        else:
            pipeline_val = 0.0
        
        return np.array([img_quality, poi, poi_conf, crop_conf, llm_conf, pipeline_val])
    
    def apply_temperature_scaling(self, raw_confidence: float) -> float:
        """Apply temperature scaling to raw confidence."""
        # Convert to logit, scale, convert back
        eps = 1e-7
        raw_confidence = np.clip(raw_confidence, eps, 1 - eps)
        logit = np.log(raw_confidence / (1 - raw_confidence))
        scaled_logit = logit / self.temperature
        calibrated = 1.0 / (1.0 + np.exp(-scaled_logit))
        return float(calibrated)
    
    def apply_logistic_calibration(self, features: np.ndarray) -> float:
        """Apply logistic regression calibration if weights available."""
        if self.logistic_weights is None:
            return None
        
        weights = np.array(self.logistic_weights)
        logit = np.dot(features, weights) + self.logistic_bias
        calibrated = 1.0 / (1.0 + np.exp(-logit))
        return float(calibrated)
    
    def calibrate(self, inference_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calibrate confidence and return overall confidence with risk band.
        
        Args:
            inference_data: Dictionary containing inference outputs and metadata
            
        Returns:
            Dictionary with:
            - confidence_overall: calibrated confidence [0-1]
            - confidence_band: 'high' | 'medium' | 'low'
            - calibration_method: which method was used
            - features: extracted feature vector for logging
        """
        features = self.extract_features(inference_data)
        raw_confidence = inference_data.get('confidence', 0.5)
        
        # Try logistic calibration first if available
        calibrated = self.apply_logistic_calibration(features)
        method = 'logistic'
        
        if calibrated is None:
            # Fall back to temperature scaling
            calibrated = self.apply_temperature_scaling(raw_confidence)
            method = 'temperature'
        
        # Determine risk band
        if calibrated >= 0.75:
            band = 'high'
        elif calibrated >= 0.50:
            band = 'medium'
        else:
            band = 'low'
        
        return {
            'confidence_overall': round(calibrated, 3),
            'confidence_band': band,
            'calibration_method': method,
            'features': features.tolist(),
            'raw_confidence': raw_confidence
        }
    
    def should_gate_action(self, confidence_band: str, action_type: str) -> tuple[bool, Optional[str]]:
        """
        Determine if an action should be gated based on confidence.
        
        Args:
            confidence_band: 'high' | 'medium' | 'low'
            action_type: 'chemical_rec' | 'strong_diagnosis' | 'forecast' | 'general'
        
        Returns:
            (allow: bool, warning_message: Optional[str])
        """
        if action_type == 'chemical_rec':
            if confidence_band == 'low':
                return False, "Confidence too low for chemical recommendations. Showing organic alternatives only."
            elif confidence_band == 'medium':
                return True, "Moderate confidence: Consult local agricultural expert before applying chemicals."
        
        elif action_type == 'strong_diagnosis':
            if confidence_band == 'low':
                return False, "Low confidence diagnosis. Please retake photo with better lighting and focus, or consult an expert."
        
        return True, None


# Global calibrator instance
_calibrator_instance = None

def get_calibrator() -> ConfidenceCalibrator:
    """Get singleton calibrator instance."""
    global _calibrator_instance
    if _calibrator_instance is None:
        _calibrator_instance = ConfidenceCalibrator()
    return _calibrator_instance


def calibrate_inference(inference_data: Dict[str, Any]) -> Dict[str, Any]:
    """Convenience function to calibrate inference data."""
    calibrator = get_calibrator()
    return calibrator.calibrate(inference_data)


def gate_action(confidence_band: str, action_type: str) -> tuple[bool, Optional[str]]:
    """Convenience function to gate actions based on confidence."""
    calibrator = get_calibrator()
    return calibrator.should_gate_action(confidence_band, action_type)
