"""
Rate Limiting and Operational Guardrails
Middleware for protecting API endpoints from abuse and managing upstream quotas.
"""
import time
import logging
from typing import Dict, Optional, Any
from collections import defaultdict
from datetime import datetime, timedelta
import hashlib

logger = logging.getLogger(__name__)


class RateLimiter:
    """Simple in-memory rate limiter with sliding window."""
    
    def __init__(self):
        self.requests: Dict[str, list] = defaultdict(list)
        self.global_requests: list = []
        
        # Per-IP/user limits (requests per minute)
        self.per_ip_limit = 30  # 30 req/min per IP
        self.per_user_limit = 60  # 60 req/min per authenticated user
        
        # Global limits (requests per minute)
        self.global_limit = 1000  # 1000 req/min total
        
        # Endpoint-specific limits
        self.endpoint_limits = {
            '/api/vision_diagnostic': 10,  # 10 req/min (expensive)
            '/api/vision_poi': 15,
            '/api/vision_chat': 10,
            '/api/weather_forecast': 20,
            '/api/agmarknet_prices': 30,
        }
    
    def _clean_old_requests(self, request_list: list, window_seconds: int = 60):
        """Remove requests older than window."""
        cutoff = time.time() - window_seconds
        while request_list and request_list[0] < cutoff:
            request_list.pop(0)
    
    def check_rate_limit(self, key: str, endpoint: Optional[str] = None) -> tuple[bool, Optional[str]]:
        """
        Check if request should be allowed.
        
        Returns:
            (allowed: bool, error_message: Optional[str])
        """
        now = time.time()
        
        # Check global limit
        self._clean_old_requests(self.global_requests)
        if len(self.global_requests) >= self.global_limit:
            return False, "Global rate limit exceeded. Please try again later."
        
        # Check per-key limit
        self._clean_old_requests(self.requests[key])
        limit = self.per_ip_limit
        
        # Check endpoint-specific limit
        if endpoint and endpoint in self.endpoint_limits:
            limit = min(limit, self.endpoint_limits[endpoint])
        
        if len(self.requests[key]) >= limit:
            retry_after = int(60 - (now - self.requests[key][0]))
            return False, f"Rate limit exceeded. Retry after {retry_after} seconds."
        
        # Allow request
        self.requests[key].append(now)
        self.global_requests.append(now)
        return True, None


class CircuitBreaker:
    """Circuit breaker for upstream service failures."""
    
    def __init__(self, failure_threshold: int = 5, timeout_seconds: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout_seconds = timeout_seconds
        self.failures: Dict[str, int] = defaultdict(int)
        self.last_failure: Dict[str, float] = {}
        self.state: Dict[str, str] = defaultdict(lambda: 'closed')  # closed, open, half-open
    
    def record_success(self, service: str):
        """Record successful call."""
        self.failures[service] = 0
        self.state[service] = 'closed'
    
    def record_failure(self, service: str):
        """Record failed call."""
        self.failures[service] += 1
        self.last_failure[service] = time.time()
        
        if self.failures[service] >= self.failure_threshold:
            self.state[service] = 'open'
            logger.warning("Circuit breaker opened for service: %s", service)
    
    def is_open(self, service: str) -> bool:
        """Check if circuit is open (failing)."""
        if self.state[service] != 'open':
            return False
        
        # Check if timeout expired
        if time.time() - self.last_failure.get(service, 0) > self.timeout_seconds:
            self.state[service] = 'half-open'
            logger.info("Circuit breaker half-open for service: %s", service)
            return False
        
        return True


class ResponseCache:
    """Simple TTL cache for expensive API responses."""
    
    def __init__(self, default_ttl: int = 300):
        self.cache: Dict[str, tuple[Any, float]] = {}
        self.default_ttl = default_ttl
    
    def _make_key(self, prefix: str, params: Dict) -> str:
        """Generate cache key from parameters."""
        # Sort and serialize params
        items = sorted(params.items())
        param_str = str(items)
        hash_val = hashlib.md5(param_str.encode()).hexdigest()
        return f"{prefix}:{hash_val}"
    
    def get(self, key: str) -> Optional[Any]:
        """Get cached value if not expired."""
        if key not in self.cache:
            return None
        
        value, expiry = self.cache[key]
        if time.time() > expiry:
            del self.cache[key]
            return None
        
        return value
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Set cached value with TTL."""
        ttl = ttl or self.default_ttl
        expiry = time.time() + ttl
        self.cache[key] = (value, expiry)
    
    def clear_expired(self):
        """Remove expired entries."""
        now = time.time()
        expired = [k for k, (_, exp) in self.cache.items() if now > exp]
        for k in expired:
            del self.cache[k]


class MetricsCollector:
    """Collect and aggregate operational metrics."""
    
    def __init__(self):
        self.requests_total = 0
        self.requests_2xx = 0
        self.requests_4xx = 0
        self.requests_5xx = 0
        self.fallback_count = 0
        self.provider_errors: Dict[str, int] = defaultdict(int)
        self.endpoint_latency: Dict[str, list] = defaultdict(list)
        self.last_reset = time.time()
    
    def record_request(self, endpoint: str, status_code: int, latency_ms: float, 
                      provider: Optional[str] = None, used_fallback: bool = False):
        """Record request metrics."""
        self.requests_total += 1
        
        if 200 <= status_code < 300:
            self.requests_2xx += 1
        elif 400 <= status_code < 500:
            self.requests_4xx += 1
        elif 500 <= status_code < 600:
            self.requests_5xx += 1
        
        if used_fallback:
            self.fallback_count += 1
        
        self.endpoint_latency[endpoint].append(latency_ms)
        
        # Keep only last 1000 latency samples per endpoint
        if len(self.endpoint_latency[endpoint]) > 1000:
            self.endpoint_latency[endpoint] = self.endpoint_latency[endpoint][-1000:]
    
    def record_provider_error(self, provider: str):
        """Record upstream provider error."""
        self.provider_errors[provider] += 1
    
    def get_summary(self) -> Dict:
        """Get metrics summary."""
        uptime = time.time() - self.last_reset
        
        avg_latencies = {}
        for endpoint, latencies in self.endpoint_latency.items():
            if latencies:
                avg_latencies[endpoint] = sum(latencies) / len(latencies)
        
        return {
            'uptime_seconds': int(uptime),
            'requests_total': self.requests_total,
            'requests_2xx': self.requests_2xx,
            'requests_4xx': self.requests_4xx,
            'requests_5xx': self.requests_5xx,
            'fallback_count': self.fallback_count,
            'fallback_rate': self.fallback_count / max(self.requests_total, 1),
            'provider_errors': dict(self.provider_errors),
            'avg_latency_ms': avg_latencies,
            'error_rate': (self.requests_4xx + self.requests_5xx) / max(self.requests_total, 1)
        }
    
    def check_alerts(self) -> list[str]:
        """Check if any alert thresholds breached."""
        alerts = []
        summary = self.get_summary()
        
        if summary['error_rate'] > 0.1:
            alerts.append(f"High error rate: {summary['error_rate']:.2%}")
        
        if summary['fallback_rate'] > 0.2:
            alerts.append(f"High fallback rate: {summary['fallback_rate']:.2%}")
        
        for provider, count in self.provider_errors.items():
            if count > 10:
                alerts.append(f"Provider {provider} has {count} errors")
        
        return alerts


# Global instances
_rate_limiter = RateLimiter()
_circuit_breaker = CircuitBreaker()
_response_cache = ResponseCache()
_metrics = MetricsCollector()


def get_rate_limiter() -> RateLimiter:
    return _rate_limiter


def get_circuit_breaker() -> CircuitBreaker:
    return _circuit_breaker


def get_response_cache() -> ResponseCache:
    return _response_cache


def get_metrics() -> MetricsCollector:
    return _metrics
