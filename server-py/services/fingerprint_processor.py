import cv2
import numpy as np
import base64
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class FingerprintProcessor:
    """
    Handles fingerprint image processing and template generation
    """
    
    def __init__(self):
        self.min_quality_threshold = 0.6
        self.template_version = "1.0"
        
    def process_fingerprint(self, image_data: str) -> Dict[str, Any]:
        """
        Process fingerprint image and generate template
        
        Args:
            image_data: Base64 encoded fingerprint image
            
        Returns:
            Dictionary containing success status, template, and quality score
        """
        try:
            # Decode base64 image
            image_bytes = base64.b64decode(image_data)
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
            
            if image is None:
                return {
                    'success': False,
                    'error': 'Failed to decode fingerprint image'
                }
            
            # Enhance image quality
            enhanced_image = self._enhance_fingerprint(image)
            
            # Extract minutiae points
            minutiae = self._extract_minutiae(enhanced_image)
            
            if not minutiae:
                return {
                    'success': False,
                    'error': 'No minutiae points found in fingerprint'
                }
            
            # Calculate quality score
            quality = self._calculate_quality(enhanced_image, minutiae)
            
            if quality < self.min_quality_threshold:
                return {
                    'success': False,
                    'error': f'Fingerprint quality too low: {quality:.2f} (minimum: {self.min_quality_threshold})'
                }
            
            # Generate template
            template = self._generate_template(minutiae, quality, enhanced_image.shape)
            
            return {
                'success': True,
                'template': template,
                'quality': quality,
                'minutiae_count': len(minutiae)
            }
            
        except Exception as e:
            logger.error(f"Error processing fingerprint: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to process fingerprint: {str(e)}'
            }
    
    def _enhance_fingerprint(self, image: np.ndarray) -> np.ndarray:
        """
        Enhance fingerprint image quality using various filters
        """
        # Normalize image
        image = cv2.normalize(image, None, 0, 255, cv2.NORM_MINMAX)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(image, (3, 3), 0)
        
        # Enhance contrast using CLAHE
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(blurred)
        
        # Apply morphological operations to clean up
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        enhanced = cv2.morphologyEx(enhanced, cv2.MORPH_CLOSE, kernel)
        
        return enhanced
    
    def _extract_minutiae(self, image: np.ndarray) -> list:
        """
        Extract minutiae points from fingerprint image
        
        This is a simplified implementation. In production, you would use
        a more sophisticated algorithm or a specialized library.
        """
        minutiae = []
        
        try:
            # Apply binary threshold
            _, binary = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Skeletonize the image
            skeleton = self._skeletonize(binary)
            
            # Find contours
            contours, _ = cv2.findContours(skeleton, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Extract key points from contours
            for contour in contours:
                if len(contour) > 10:  # Filter small contours
                    # Find corner points (simplified minutiae detection)
                    epsilon = 0.02 * cv2.arcLength(contour, True)
                    approx = cv2.approxPolyDP(contour, epsilon, True)
                    
                    for point in approx:
                        x, y = point[0]
                        # Calculate orientation (simplified)
                        orientation = self._calculate_orientation(skeleton, x, y)
                        
                        minutiae.append({
                            'x': int(x),
                            'y': int(y),
                            'orientation': float(orientation),
                            'type': 'bifurcation'  # Simplified - would need proper classification
                        })
            
            # Limit number of minutiae points
            minutiae = minutiae[:50]  # Keep top 50 points
            
        except Exception as e:
            logger.error(f"Error extracting minutiae: {str(e)}")
        
        return minutiae
    
    def _skeletonize(self, image: np.ndarray) -> np.ndarray:
        """
        Skeletonize binary image using morphological operations
        """
        skeleton = np.zeros(image.shape, np.uint8)
        eroded = np.copy(image)
        temp = np.zeros(image.shape, np.uint8)
        
        kernel = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))
        
        while True:
            cv2.erode(eroded, kernel, eroded)
            cv2.dilate(eroded, kernel, temp)
            cv2.subtract(image, temp, temp)
            cv2.bitwise_or(skeleton, temp, skeleton)
            eroded, image = image, eroded
            
            if cv2.countNonZero(image) == 0:
                break
                
        return skeleton
    
    def _calculate_orientation(self, image: np.ndarray, x: int, y: int, window_size: int = 5) -> float:
        """
        Calculate orientation at a given point
        """
        try:
            h, w = image.shape
            half_window = window_size // 2
            
            # Ensure coordinates are within bounds
            x1 = max(0, x - half_window)
            x2 = min(w, x + half_window + 1)
            y1 = max(0, y - half_window)
            y2 = min(h, y + half_window + 1)
            
            # Extract window
            window = image[y1:y2, x1:x2]
            
            if window.size == 0:
                return 0.0
            
            # Calculate gradients
            gx = cv2.Sobel(window, cv2.CV_64F, 1, 0, ksize=3)
            gy = cv2.Sobel(window, cv2.CV_64F, 0, 1, ksize=3)
            
            # Calculate orientation
            orientation = np.arctan2(gy.mean(), gx.mean())
            return float(orientation)
            
        except Exception as e:
            logger.error(f"Error calculating orientation: {str(e)}")
            return 0.0
    
    def _calculate_quality(self, image: np.ndarray, minutiae: list) -> float:
        """
        Calculate fingerprint quality score
        """
        try:
            # Quality factors
            quality_factors = []
            
            # Factor 1: Number of minutiae
            minutiae_score = min(len(minutiae) / 30.0, 1.0)  # Normalize to 30 minutiae
            quality_factors.append(minutiae_score)
            
            # Factor 2: Image contrast
            contrast = np.std(image) / 255.0
            quality_factors.append(contrast)
            
            # Factor 3: Image sharpness (Laplacian variance)
            laplacian_var = cv2.Laplacian(image, cv2.CV_64F).var()
            sharpness_score = min(laplacian_var / 1000.0, 1.0)  # Normalize
            quality_factors.append(sharpness_score)
            
            # Factor 4: Ridge clarity (simplified)
            edges = cv2.Canny(image, 50, 150)
            edge_density = np.sum(edges > 0) / edges.size
            quality_factors.append(edge_density)
            
            # Calculate weighted average
            weights = [0.3, 0.25, 0.25, 0.2]
            quality = sum(factor * weight for factor, weight in zip(quality_factors, weights))
            
            return min(max(quality, 0.0), 1.0)  # Clamp between 0 and 1
            
        except Exception as e:
            logger.error(f"Error calculating quality: {str(e)}")
            return 0.0
    
    def _generate_template(self, minutiae: list, quality: float, image_shape: tuple) -> str:
        """
        Generate fingerprint template from minutiae points
        """
        template_data = {
            'version': self.template_version,
            'quality': quality,
            'image_shape': image_shape,
            'minutiae': minutiae,
            'minutiae_count': len(minutiae),
            'created_at': None  # Will be set by timestamp if needed
        }
        
        # Convert to JSON and encode
        template_json = json.dumps(template_data, separators=(',', ':'))
        template_encoded = base64.b64encode(template_json.encode()).decode()
        
        return template_encoded
    
    def verify_quality(self, template: str) -> Dict[str, Any]:
        """
        Verify the quality of an existing template
        """
        try:
            # Decode template
            template_data = self._decode_template(template)
            
            if not template_data:
                return {
                    'is_valid': False,
                    'error': 'Invalid template format'
                }
            
            quality = template_data.get('quality', 0.0)
            minutiae_count = template_data.get('minutiae_count', 0)
            
            is_valid = (
                quality >= self.min_quality_threshold and
                minutiae_count >= 10  # Minimum number of minutiae
            )
            
            return {
                'is_valid': is_valid,
                'quality': quality,
                'minutiae_count': minutiae_count
            }
            
        except Exception as e:
            logger.error(f"Error verifying template quality: {str(e)}")
            return {
                'is_valid': False,
                'error': f'Failed to verify template: {str(e)}'
            }
    
    def extract_features(self, template: str) -> Dict[str, Any]:
        """
        Extract features from a template for analysis
        """
        try:
            template_data = self._decode_template(template)
            
            if not template_data:
                return {
                    'success': False,
                    'error': 'Invalid template format'
                }
            
            minutiae = template_data.get('minutiae', [])
            
            # Calculate feature statistics
            features = {
                'minutiae_count': len(minutiae),
                'quality': template_data.get('quality', 0.0),
                'image_width': template_data.get('image_shape', [0, 0])[1],
                'image_height': template_data.get('image_shape', [0, 0])[0],
                'minutiae_density': len(minutiae) / max(1, template_data.get('image_shape', [1, 1])[0] * template_data.get('image_shape', [1, 1])[1]) * 10000,
                'average_orientation': np.mean([m.get('orientation', 0) for m in minutiae]) if minutiae else 0,
                'version': template_data.get('version', 'unknown')
            }
            
            return {
                'success': True,
                'features': features
            }
            
        except Exception as e:
            logger.error(f"Error extracting features: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to extract features: {str(e)}'
            }
    
    def _decode_template(self, template: str) -> Optional[Dict[str, Any]]:
        """
        Decode a fingerprint template
        """
        try:
            template_json = base64.b64decode(template).decode()
            template_data = json.loads(template_json)
            return template_data
        except Exception as e:
            logger.error(f"Error decoding template: {str(e)}")
            return None
