from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from services.fingerprint_processor import FingerprintProcessor
from services.matcher import FingerprintMatcher
from utils.digitalpersona import DigitalPersonaInterface

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=['http://localhost:3000', 'http://localhost:8000'])

# Initialize services
fingerprint_processor = FingerprintProcessor()
fingerprint_matcher = FingerprintMatcher()
dp_interface = DigitalPersonaInterface()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'Fingerprint processing service is running',
        'scanner_connected': dp_interface.is_scanner_connected()
    })

@app.route('/capture', methods=['POST'])
def capture_fingerprint():
    """Capture fingerprint from DigitalPersona scanner"""
    try:
        # Check if scanner is connected
        if not dp_interface.is_scanner_connected():
            return jsonify({
                'success': False,
                'error': 'DigitalPersona scanner not connected. Please ensure the scanner is plugged in and drivers are installed.'
            }), 400

        # Capture fingerprint
        result = dp_interface.capture_fingerprint()
        
        if result['success']:
            # Process the captured fingerprint
            processed = fingerprint_processor.process_fingerprint(result['image'])
            
            if processed['success']:
                return jsonify({
                    'success': True,
                    'template': processed['template'],
                    'image': result['image'],
                    'quality': processed.get('quality', 0)
                })
            else:
                return jsonify({
                    'success': False,
                    'error': f"Failed to process fingerprint: {processed.get('error', 'Unknown error')}"
                }), 400
        else:
            return jsonify({
                'success': False,
                'error': f"Failed to capture fingerprint: {result.get('error', 'Unknown error')}"
            }), 400

    except Exception as e:
        logger.error(f"Fingerprint capture error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error during fingerprint capture'
        }), 500

@app.route('/match', methods=['POST'])
def match_fingerprint():
    """Match fingerprint template against a list of templates"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400

        input_template = data.get('inputTemplate')
        templates = data.get('templates', [])

        if not input_template:
            return jsonify({
                'success': False,
                'error': 'Input template is required'
            }), 400

        if not templates:
            return jsonify({
                'success': False,
                'error': 'Template list is required'
            }), 400

        # Perform matching
        match_result = fingerprint_matcher.match_fingerprint(input_template, templates)
        
        return jsonify({
            'success': True,
            'match': match_result if match_result else None
        })

    except Exception as e:
        logger.error(f"Fingerprint matching error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error during fingerprint matching'
        }), 500

@app.route('/verify-quality', methods=['POST'])
def verify_quality():
    """Verify the quality of a fingerprint template"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400

        template = data.get('template')
        
        if not template:
            return jsonify({
                'success': False,
                'error': 'Template is required'
            }), 400

        # Verify quality
        quality_result = fingerprint_processor.verify_quality(template)
        
        return jsonify({
            'success': quality_result['is_valid'],
            'quality': quality_result.get('quality', 0),
            'error': quality_result.get('error')
        })

    except Exception as e:
        logger.error(f"Quality verification error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error during quality verification'
        }), 500

@app.route('/extract-features', methods=['POST'])
def extract_features():
    """Extract features from a fingerprint template"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400

        template = data.get('template')
        
        if not template:
            return jsonify({
                'success': False,
                'error': 'Template is required'
            }), 400

        # Extract features
        features_result = fingerprint_processor.extract_features(template)
        
        return jsonify({
            'success': features_result['success'],
            'features': features_result.get('features'),
            'error': features_result.get('error')
        })

    except Exception as e:
        logger.error(f"Feature extraction error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error during feature extraction'
        }), 500

@app.route('/scanner/status', methods=['GET'])
def scanner_status():
    """Get scanner connection status"""
    try:
        status = dp_interface.get_scanner_status()
        return jsonify({
            'success': True,
            'status': status
        })

    except Exception as e:
        logger.error(f"Scanner status error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get scanner status'
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f"Starting fingerprint processing service on port {port}")
    logger.info(f"Debug mode: {debug}")
    
    # Initialize DigitalPersona interface
    if dp_interface.initialize():
        logger.info("DigitalPersona interface initialized successfully")
    else:
        logger.warning("Failed to initialize DigitalPersona interface - scanner may not be available")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
