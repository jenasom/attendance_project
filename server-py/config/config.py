import os
from typing import Dict, Any

class Config:
    """Configuration class for the fingerprint processing service"""
    
    # Flask Configuration
    FLASK_ENV = os.environ.get('FLASK_ENV', 'development')
    DEBUG = FLASK_ENV == 'development'
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
    
    # Server Configuration
    HOST = os.environ.get('HOST', '0.0.0.0')
    PORT = int(os.environ.get('PORT', 5000))
    
    # CORS Configuration
    CORS_ORIGINS = [
        'http://localhost:3000',
        'http://localhost:5000',
        'http://localhost:8000',
        os.environ.get('CORS_ORIGIN', 'http://localhost:3000')
    ]
    
    # Fingerprint Processing Configuration
    MIN_QUALITY_THRESHOLD = float(os.environ.get('MIN_QUALITY_THRESHOLD', 0.6))
    MAX_DISTANCE_THRESHOLD = int(os.environ.get('MAX_DISTANCE_THRESHOLD', 50))
    ORIENTATION_TOLERANCE = float(os.environ.get('ORIENTATION_TOLERANCE', 0.5))
    MATCH_THRESHOLD = float(os.environ.get('MATCH_THRESHOLD', 0.7))
    
    # Scanner Configuration
    CAPTURE_TIMEOUT = int(os.environ.get('CAPTURE_TIMEOUT', 30))
    MAX_RETRIES = int(os.environ.get('MAX_RETRIES', 3))
    SCANNER_POLL_INTERVAL = float(os.environ.get('SCANNER_POLL_INTERVAL', 0.1))
    
    # Image Processing Configuration
    IMAGE_MAX_SIZE = (512, 512)  # Maximum image dimensions
    IMAGE_QUALITY = 85  # JPEG quality for compressed images
    SUPPORTED_FORMATS = ['PNG', 'JPEG', 'BMP', 'TIFF']
    
    # Template Configuration
    TEMPLATE_VERSION = '1.0'
    MAX_MINUTIAE_POINTS = 50
    MIN_MINUTIAE_POINTS = 10
    
    # Logging Configuration
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_DATE_FORMAT = '%Y-%m-%d %H:%M:%S'
    
    # Performance Configuration
    ENABLE_PERFORMANCE_LOGGING = os.environ.get('ENABLE_PERFORMANCE_LOGGING', 'true').lower() == 'true'
    CACHE_ENABLED = os.environ.get('CACHE_ENABLED', 'false').lower() == 'true'
    CACHE_TTL = int(os.environ.get('CACHE_TTL', 300))  # 5 minutes
    
    # Security Configuration
    RATE_LIMIT_ENABLED = os.environ.get('RATE_LIMIT_ENABLED', 'true').lower() == 'true'
    RATE_LIMIT_REQUESTS = int(os.environ.get('RATE_LIMIT_REQUESTS', 100))
    RATE_LIMIT_WINDOW = int(os.environ.get('RATE_LIMIT_WINDOW', 3600))  # 1 hour
    
    # DigitalPersona SDK Configuration
    DIGITALPERSONA_SDK_PATHS = [
        "C:\\Program Files\\DigitalPersona\\Bin",
        "C:\\Program Files (x86)\\DigitalPersona\\Bin",
        "C:\\Windows\\System32",
        os.environ.get('DIGITALPERSONA_SDK_PATH', '')
    ]
    
    # Database Configuration (if needed for caching)
    DATABASE_URL = os.environ.get('DATABASE_URL', '')
    
    # External API Configuration
    CORE_SERVER_URL = os.environ.get('CORE_SERVER_URL', 'http://localhost:8000')
    API_TIMEOUT = int(os.environ.get('API_TIMEOUT', 30))
    
    @classmethod
    def get_config(cls) -> Dict[str, Any]:
        """Get configuration as dictionary"""
        return {
            'flask_env': cls.FLASK_ENV,
            'debug': cls.DEBUG,
            'host': cls.HOST,
            'port': cls.PORT,
            'cors_origins': cls.CORS_ORIGINS,
            'min_quality_threshold': cls.MIN_QUALITY_THRESHOLD,
            'max_distance_threshold': cls.MAX_DISTANCE_THRESHOLD,
            'orientation_tolerance': cls.ORIENTATION_TOLERANCE,
            'match_threshold': cls.MATCH_THRESHOLD,
            'capture_timeout': cls.CAPTURE_TIMEOUT,
            'max_retries': cls.MAX_RETRIES,
            'scanner_poll_interval': cls.SCANNER_POLL_INTERVAL,
            'image_max_size': cls.IMAGE_MAX_SIZE,
            'image_quality': cls.IMAGE_QUALITY,
            'supported_formats': cls.SUPPORTED_FORMATS,
            'template_version': cls.TEMPLATE_VERSION,
            'max_minutiae_points': cls.MAX_MINUTIAE_POINTS,
            'min_minutiae_points': cls.MIN_MINUTIAE_POINTS,
            'log_level': cls.LOG_LEVEL,
            'enable_performance_logging': cls.ENABLE_PERFORMANCE_LOGGING,
            'cache_enabled': cls.CACHE_ENABLED,
            'cache_ttl': cls.CACHE_TTL,
            'rate_limit_enabled': cls.RATE_LIMIT_ENABLED,
            'rate_limit_requests': cls.RATE_LIMIT_REQUESTS,
            'rate_limit_window': cls.RATE_LIMIT_WINDOW,
            'digitalpersona_sdk_paths': cls.DIGITALPERSONA_SDK_PATHS,
            'core_server_url': cls.CORE_SERVER_URL,
            'api_timeout': cls.API_TIMEOUT,
        }
    
    @classmethod
    def validate_config(cls) -> bool:
        """Validate configuration settings"""
        errors = []
        
        # Validate thresholds
        if not 0 <= cls.MIN_QUALITY_THRESHOLD <= 1:
            errors.append("MIN_QUALITY_THRESHOLD must be between 0 and 1")
        
        if not 0 <= cls.MATCH_THRESHOLD <= 1:
            errors.append("MATCH_THRESHOLD must be between 0 and 1")
        
        if cls.MAX_DISTANCE_THRESHOLD <= 0:
            errors.append("MAX_DISTANCE_THRESHOLD must be positive")
        
        if not 0 <= cls.ORIENTATION_TOLERANCE <= 3.14159:
            errors.append("ORIENTATION_TOLERANCE must be between 0 and π")
        
        # Validate timeouts
        if cls.CAPTURE_TIMEOUT <= 0:
            errors.append("CAPTURE_TIMEOUT must be positive")
        
        if cls.API_TIMEOUT <= 0:
            errors.append("API_TIMEOUT must be positive")
        
        # Validate minutiae limits
        if cls.MIN_MINUTIAE_POINTS <= 0:
            errors.append("MIN_MINUTIAE_POINTS must be positive")
        
        if cls.MAX_MINUTIAE_POINTS <= cls.MIN_MINUTIAE_POINTS:
            errors.append("MAX_MINUTIAE_POINTS must be greater than MIN_MINUTIAE_POINTS")
        
        # Validate image settings
        if not all(dim > 0 for dim in cls.IMAGE_MAX_SIZE):
            errors.append("IMAGE_MAX_SIZE dimensions must be positive")
        
        if not 1 <= cls.IMAGE_QUALITY <= 100:
            errors.append("IMAGE_QUALITY must be between 1 and 100")
        
        # Validate rate limiting
        if cls.RATE_LIMIT_REQUESTS <= 0:
            errors.append("RATE_LIMIT_REQUESTS must be positive")
        
        if cls.RATE_LIMIT_WINDOW <= 0:
            errors.append("RATE_LIMIT_WINDOW must be positive")
        
        if errors:
            for error in errors:
                print(f"Configuration Error: {error}")
            return False
        
        return True

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    LOG_LEVEL = 'DEBUG'
    ENABLE_PERFORMANCE_LOGGING = True

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    LOG_LEVEL = 'INFO'
    ENABLE_PERFORMANCE_LOGGING = False
    RATE_LIMIT_ENABLED = True

class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    LOG_LEVEL = 'DEBUG'
    MIN_QUALITY_THRESHOLD = 0.3  # Lower threshold for testing
    MATCH_THRESHOLD = 0.5  # Lower threshold for testing
    CAPTURE_TIMEOUT = 10  # Shorter timeout for tests
    RATE_LIMIT_ENABLED = False

# Configuration mapping
config_map = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config(env: str = None) -> Config:
    """Get configuration based on environment"""
    if env is None:
        env = os.environ.get('FLASK_ENV', 'development')
    
    config_class = config_map.get(env, config_map['default'])
    
    # Validate configuration
    if not config_class.validate_config():
        raise ValueError(f"Invalid configuration for environment: {env}")
    
    return config_class

# Export current configuration
current_config = get_config()
