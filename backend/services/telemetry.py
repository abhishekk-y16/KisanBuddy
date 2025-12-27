"""
Telemetry and Data Retention for Continuous Improvement
Tracks inference metadata, quality flags, and performance metrics.
"""
import os
import sqlite3
import hashlib
import time
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(__file__)
TELEMETRY_DB_PATH = os.path.join(BASE_DIR, "telemetry.db")


def init_telemetry_db():
    """Initialize telemetry database with schema."""
    conn = sqlite3.connect(TELEMETRY_DB_PATH, check_same_thread=False)
    cur = conn.cursor()
    
    # Inference telemetry table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS inference_telemetry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp REAL NOT NULL,
            image_hash TEXT,
            device_hint TEXT,
            endpoint TEXT,
            
            -- Quality checks
            image_quality_score REAL,
            quality_check_passed INTEGER,
            quality_rejection_reason TEXT,
            
            -- Pipeline info
            pipeline_used TEXT,
            fallback_occurred INTEGER,
            fallback_reason TEXT,
            
            -- Confidence metrics
            raw_confidence REAL,
            calibrated_confidence REAL,
            confidence_band TEXT,
            
            -- Performance
            latency_ms REAL,
            upstream_provider TEXT,
            upstream_latency_ms REAL,
            
            -- Model info
            model_u2net_loaded INTEGER,
            model_vit_loaded INTEGER,
            
            -- Additional metadata
            crop TEXT,
            diagnosis TEXT,
            severity TEXT,
            poi REAL,
            
            -- Consent flags
            user_consent_analytics INTEGER DEFAULT 0,
            user_consent_improvement INTEGER DEFAULT 0
        )
    """)
    
    # Daily aggregates table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS daily_aggregates (
            date TEXT PRIMARY KEY,
            total_requests INTEGER DEFAULT 0,
            quality_rejections INTEGER DEFAULT 0,
            fallback_count INTEGER DEFAULT 0,
            avg_latency_ms REAL,
            avg_confidence REAL,
            error_count INTEGER DEFAULT 0,
            pipeline_heuristic INTEGER DEFAULT 0,
            pipeline_u2net INTEGER DEFAULT 0,
            pipeline_vit INTEGER DEFAULT 0,
            upstream_groq_errors INTEGER DEFAULT 0,
            upstream_gemini_errors INTEGER DEFAULT 0,
            upstream_weather_errors INTEGER DEFAULT 0,
            updated_at REAL
        )
    """)
    
    # Create indexes
    cur.execute("CREATE INDEX IF NOT EXISTS idx_timestamp ON inference_telemetry(timestamp)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_pipeline ON inference_telemetry(pipeline_used)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_quality ON inference_telemetry(quality_check_passed)")
    
    conn.commit()
    conn.close()


def hash_image(image_data: bytes) -> str:
    """Generate hash of image data for tracking."""
    return hashlib.sha256(image_data).hexdigest()[:16]


def log_inference(
    endpoint: str,
    image_data: Optional[bytes] = None,
    device_hint: Optional[str] = None,
    quality_metrics: Optional[Dict] = None,
    pipeline_info: Optional[Dict] = None,
    confidence_metrics: Optional[Dict] = None,
    performance_metrics: Optional[Dict] = None,
    result_data: Optional[Dict] = None,
    user_consent: Optional[Dict] = None
) -> int:
    """
    Log inference telemetry.
    
    Returns:
        telemetry_id: int
    """
    try:
        init_telemetry_db()
        conn = sqlite3.connect(TELEMETRY_DB_PATH, check_same_thread=False)
        cur = conn.cursor()
        
        # Extract data with defaults
        quality_metrics = quality_metrics or {}
        pipeline_info = pipeline_info or {}
        confidence_metrics = confidence_metrics or {}
        performance_metrics = performance_metrics or {}
        result_data = result_data or {}
        user_consent = user_consent or {}
        
        # Prepare values
        image_hash = None
        if image_data:
            image_hash = hash_image(image_data)
        
        cur.execute("""
            INSERT INTO inference_telemetry (
                timestamp, image_hash, device_hint, endpoint,
                image_quality_score, quality_check_passed, quality_rejection_reason,
                pipeline_used, fallback_occurred, fallback_reason,
                raw_confidence, calibrated_confidence, confidence_band,
                latency_ms, upstream_provider, upstream_latency_ms,
                model_u2net_loaded, model_vit_loaded,
                crop, diagnosis, severity, poi,
                user_consent_analytics, user_consent_improvement
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            time.time(),
            image_hash,
            device_hint,
            endpoint,
            quality_metrics.get('score'),
            1 if quality_metrics.get('passed', True) else 0,
            quality_metrics.get('rejection_reason'),
            pipeline_info.get('pipeline'),
            1 if pipeline_info.get('fallback_occurred', False) else 0,
            pipeline_info.get('fallback_reason'),
            confidence_metrics.get('raw_confidence'),
            confidence_metrics.get('calibrated_confidence'),
            confidence_metrics.get('confidence_band'),
            performance_metrics.get('latency_ms'),
            performance_metrics.get('upstream_provider'),
            performance_metrics.get('upstream_latency_ms'),
            1 if pipeline_info.get('u2net_loaded', False) else 0,
            1 if pipeline_info.get('vit_loaded', False) else 0,
            result_data.get('crop'),
            result_data.get('diagnosis'),
            result_data.get('severity'),
            result_data.get('POI'),
            1 if user_consent.get('analytics', False) else 0,
            1 if user_consent.get('improvement', False) else 0
        ))
        
        telemetry_id = cur.lastrowid
        conn.commit()
        conn.close()
        
        # Update daily aggregates
        update_daily_aggregates()
        
        return telemetry_id
        
    except Exception as e:
        logger.error("Failed to log telemetry: %s", e)
        return -1


def update_daily_aggregates():
    """Update daily aggregate statistics."""
    try:
        conn = sqlite3.connect(TELEMETRY_DB_PATH, check_same_thread=False)
        cur = conn.cursor()
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Aggregate today's data
        cur.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN quality_check_passed = 0 THEN 1 ELSE 0 END) as rejections,
                SUM(fallback_occurred) as fallbacks,
                AVG(latency_ms) as avg_latency,
                AVG(calibrated_confidence) as avg_conf,
                SUM(CASE WHEN pipeline_used = 'heuristic' THEN 1 ELSE 0 END) as heuristic,
                SUM(CASE WHEN pipeline_used LIKE '%u2net%' THEN 1 ELSE 0 END) as u2net,
                SUM(CASE WHEN pipeline_used LIKE '%vit%' THEN 1 ELSE 0 END) as vit
            FROM inference_telemetry
            WHERE date(timestamp, 'unixepoch') = date('now')
        """)
        
        row = cur.fetchone()
        
        if row:
            cur.execute("""
                INSERT OR REPLACE INTO daily_aggregates (
                    date, total_requests, quality_rejections, fallback_count,
                    avg_latency_ms, avg_confidence,
                    pipeline_heuristic, pipeline_u2net, pipeline_vit,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                today,
                row[0] or 0,
                row[1] or 0,
                row[2] or 0,
                row[3] or 0.0,
                row[4] or 0.0,
                row[5] or 0,
                row[6] or 0,
                row[7] or 0,
                time.time()
            ))
        
        conn.commit()
        conn.close()
        
    except Exception as e:
        logger.error("Failed to update daily aggregates: %s", e)


def get_daily_summary(date: Optional[str] = None) -> Optional[Dict]:
    """Get daily aggregate summary."""
    try:
        init_telemetry_db()
        conn = sqlite3.connect(TELEMETRY_DB_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        
        if date is None:
            date = datetime.now().strftime("%Y-%m-%d")
        
        cur.execute("SELECT * FROM daily_aggregates WHERE date = ?", (date,))
        row = cur.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
        
    except Exception as e:
        logger.error("Failed to get daily summary: %s", e)
        return None


def get_rejection_analysis(days: int = 7) -> Dict:
    """Analyze quality rejection reasons over last N days."""
    try:
        init_telemetry_db()
        conn = sqlite3.connect(TELEMETRY_DB_PATH, check_same_thread=False)
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                quality_rejection_reason,
                COUNT(*) as count
            FROM inference_telemetry
            WHERE quality_check_passed = 0
                AND timestamp > ?
            GROUP BY quality_rejection_reason
            ORDER BY count DESC
        """, (time.time() - days * 86400,))
        
        reasons = {}
        for row in cur.fetchall():
            if row[0]:
                reasons[row[0]] = row[1]
        
        conn.close()
        return reasons
        
    except Exception as e:
        logger.error("Failed to analyze rejections: %s", e)
        return {}


def get_fallback_analysis(days: int = 7) -> Dict:
    """Analyze fallback reasons over last N days."""
    try:
        init_telemetry_db()
        conn = sqlite3.connect(TELEMETRY_DB_PATH, check_same_thread=False)
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                fallback_reason,
                COUNT(*) as count
            FROM inference_telemetry
            WHERE fallback_occurred = 1
                AND timestamp > ?
            GROUP BY fallback_reason
            ORDER BY count DESC
        """, (time.time() - days * 86400,))
        
        reasons = {}
        for row in cur.fetchall():
            if row[0]:
                reasons[row[0]] = row[1]
        
        conn.close()
        return reasons
        
    except Exception as e:
        logger.error("Failed to analyze fallbacks: %s", e)
        return {}


def get_pipeline_distribution(days: int = 7) -> Dict:
    """Get distribution of pipeline usage over last N days."""
    try:
        init_telemetry_db()
        conn = sqlite3.connect(TELEMETRY_DB_PATH, check_same_thread=False)
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                pipeline_used,
                COUNT(*) as count,
                AVG(calibrated_confidence) as avg_confidence
            FROM inference_telemetry
            WHERE timestamp > ?
            GROUP BY pipeline_used
            ORDER BY count DESC
        """, (time.time() - days * 86400,))
        
        distribution = {}
        for row in cur.fetchall():
            if row[0]:
                distribution[row[0]] = {
                    'count': row[1],
                    'avg_confidence': round(row[2], 3) if row[2] else None
                }
        
        conn.close()
        return distribution
        
    except Exception as e:
        logger.error("Failed to get pipeline distribution: %s", e)
        return {}


# Initialize DB on module import
init_telemetry_db()
