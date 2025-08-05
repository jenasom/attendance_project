import logging
import sys
import os
from datetime import datetime
from typing import Optional, Dict, Any
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler

class ColoredFormatter(logging.Formatter):
    """Custom formatter to add colors to log levels"""
    
    # ANSI color codes
    COLORS = {
        'DEBUG': '\033[36m',      # Cyan
        'INFO': '\033[32m',       # Green
        'WARNING': '\033[33m',    # Yellow
        'ERROR': '\033[31m',      # Red
        'CRITICAL': '\033[35m',   # Magenta
        'RESET': '\033[0m'        # Reset
    }
    
    def format(self, record):
        # Add color to levelname
        if record.levelname in self.COLORS:
            record.levelname = f"{self.COLORS[record.levelname]}{record.levelname}{self.COLORS['RESET']}"
        
        return super().format(record)

class PerformanceLogger:
    """Logger for performance metrics"""
    
    def __init__(self, logger: logging.Logger):
        self.logger = logger
        self._start_times: Dict[str, float] = {}
    
    def start_timer(self, operation: str) -> None:
        """Start timing an operation"""
        import time
        self._start_times[operation] = time.time()
    
    def end_timer(self, operation: str, **kwargs) -> float:
        """End timing an operation and log the duration"""
        import time
        start_time = self._start_times.pop(operation, None)
        if start_time is None:
            self.logger.warning(f"No start time found for operation: {operation}")
            return 0.0
        
        duration = time.time() - start_time
        self.logger.info(f"Performance: {operation} completed in {duration:.3f}s", extra=kwargs)
        return duration

def setup_logger(
    name: str,
    level: str = 'INFO',
    log_format: str = None,
    log_to_file: bool = True,
    log_dir: str = 'logs',
    max_file_size: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 5,
    enable_colors: bool = True
) -> logging.Logger:
    """
    Set up a logger with file and console handlers
    
    Args:
        name: Logger name
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_format: Custom log format string
        log_to_file: Whether to log to file
        log_dir: Directory for log files
        max_file_size: Maximum size of log file before rotation
        backup_count: Number of backup files to keep
        enable_colors: Whether to enable colored console output
    
    Returns:
        Configured logger instance
    """
    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    
    # Clear existing handlers
    logger.handlers.clear()
    
    # Default format
    if log_format is None:
        log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, level.upper(), logging.INFO))
    
    if enable_colors and hasattr(sys.stdout, 'isatty') and sys.stdout.isatty():
        console_formatter = ColoredFormatter(log_format)
    else:
        console_formatter = logging.Formatter(log_format)
    
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)
    
    # File handler
    if log_to_file:
        # Create log directory if it doesn't exist
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
        
        # Main log file
        log_file = os.path.join(log_dir, f'{name}.log')
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=max_file_size,
            backupCount=backup_count
        )
        file_handler.setLevel(getattr(logging, level.upper(), logging.INFO))
        file_formatter = logging.Formatter(log_format)
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)
        
        # Error log file (only errors and above)
        error_log_file = os.path.join(log_dir, f'{name}_error.log')
        error_handler = RotatingFileHandler(
            error_log_file,
            maxBytes=max_file_size,
            backupCount=backup_count
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(file_formatter)
        logger.addHandler(error_handler)
    
    return logger

def log_function_call(logger: logging.Logger):
    """Decorator to log function calls"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            func_name = func.__name__
            logger.debug(f"Calling function: {func_name}")
            
            try:
                result = func(*args, **kwargs)
                logger.debug(f"Function {func_name} completed successfully")
                return result
            except Exception as e:
                logger.error(f"Function {func_name} failed with error: {str(e)}")
                raise
        
        return wrapper
    return decorator

def log_performance(logger: logging.Logger):
    """Decorator to log function performance"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            import time
            func_name = func.__name__
            start_time = time.time()
            
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                logger.info(f"Performance: {func_name} completed in {duration:.3f}s")
                return result
            except Exception as e:
                duration = time.time() - start_time
                logger.error(f"Performance: {func_name} failed after {duration:.3f}s with error: {str(e)}")
                raise
        
        return wrapper
    return decorator

class StructuredLogger:
    """Logger that outputs structured log data"""
    
    def __init__(self, logger: logging.Logger):
        self.logger = logger
    
    def log_event(self, event: str, level: str = 'INFO', **kwargs):
        """Log a structured event"""
        log_data = {
            'event': event,
            'timestamp': datetime.utcnow().isoformat(),
            **kwargs
        }
        
        message = f"Event: {event}"
        if kwargs:
            details = ', '.join(f"{k}={v}" for k, v in kwargs.items())
            message += f" | {details}"
        
        getattr(self.logger, level.lower())(message, extra=log_data)
    
    def log_fingerprint_operation(self, operation: str, success: bool, **kwargs):
        """Log fingerprint-specific operations"""
        kwargs.update({
            'operation_type': 'fingerprint',
            'operation': operation,
            'success': success
        })
        
        level = 'INFO' if success else 'WARNING'
        self.log_event(f"fingerprint_{operation}", level, **kwargs)
    
    def log_scanner_event(self, event: str, scanner_id: str = None, **kwargs):
        """Log scanner-specific events"""
        kwargs.update({
            'event_type': 'scanner',
            'scanner_id': scanner_id or 'default'
        })
        
        self.log_event(f"scanner_{event}", **kwargs)
    
    def log_api_request(self, method: str, endpoint: str, status_code: int, duration: float, **kwargs):
        """Log API request details"""
        kwargs.update({
            'request_type': 'api',
            'method': method,
            'endpoint': endpoint,
            'status_code': status_code,
            'duration_ms': round(duration * 1000, 2)
        })
        
        level = 'INFO' if 200 <= status_code < 400 else 'WARNING'
        self.log_event('api_request', level, **kwargs)

# Global logger instances
main_logger = None
performance_logger = None
structured_logger = None

def initialize_logging(
    app_name: str = 'fingerprint_service',
    log_level: str = 'INFO',
    log_dir: str = 'logs',
    enable_performance_logging: bool = True
):
    """Initialize global logging configuration"""
    global main_logger, performance_logger, structured_logger
    
    # Main application logger
    main_logger = setup_logger(
        name=app_name,
        level=log_level,
        log_dir=log_dir
    )
    
    # Performance logger
    if enable_performance_logging:
        perf_logger = setup_logger(
            name=f'{app_name}_performance',
            level=log_level,
            log_dir=log_dir
        )
        performance_logger = PerformanceLogger(perf_logger)
    
    # Structured logger
    structured_logger = StructuredLogger(main_logger)
    
    main_logger.info(f"Logging initialized for {app_name} with level {log_level}")
    
    return main_logger

def get_logger(name: str = None) -> logging.Logger:
    """Get a logger instance"""
    if name is None:
        return main_logger or logging.getLogger()
    return logging.getLogger(name)

def get_performance_logger() -> Optional[PerformanceLogger]:
    """Get the performance logger instance"""
    return performance_logger

def get_structured_logger() -> Optional[StructuredLogger]:
    """Get the structured logger instance"""
    return structured_logger

# Utility functions for common logging patterns
def log_error(logger: logging.Logger, error: Exception, context: str = None):
    """Log an error with context"""
    error_msg = f"Error: {str(error)}"
    if context:
        error_msg = f"[{context}] {error_msg}"
    
    logger.error(error_msg, exc_info=True)

def log_warning(logger: logging.Logger, message: str, **kwargs):
    """Log a warning with optional structured data"""
    if kwargs:
        details = ', '.join(f"{k}={v}" for k, v in kwargs.items())
        message += f" | {details}"
    
    logger.warning(message)

def log_info(logger: logging.Logger, message: str, **kwargs):
    """Log info with optional structured data"""
    if kwargs:
        details = ', '.join(f"{k}={v}" for k, v in kwargs.items())
        message += f" | {details}"
    
    logger.info(message)

def log_debug(logger: logging.Logger, message: str, **kwargs):
    """Log debug info with optional structured data"""
    if kwargs:
        details = ', '.join(f"{k}={v}" for k, v in kwargs.items())
        message += f" | {details}"
    
    logger.debug(message)
