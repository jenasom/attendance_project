import numpy as np
import json
import base64
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class FingerprintMatcher:
    """
    Handles fingerprint template matching and verification
    """
    
    def __init__(self):
        self.match_threshold = 0.7
        self.max_distance_threshold = 50  # Maximum distance between minutiae points
        self.orientation_tolerance = 0.5  # Tolerance for orientation matching (radians)
        
    def match_fingerprint(self, input_template: str, templates: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Match input fingerprint template against a list of stored templates
        
        Args:
            input_template: Base64 encoded fingerprint template to match
            templates: List of dictionaries containing studentId and template
            
        Returns:
            Dictionary with studentId and confidence if match found, None otherwise
        """
        try:
            # Decode input template
            input_data = self._decode_template(input_template)
            if not input_data:
                logger.error("Failed to decode input template")
                return None
                
            input_minutiae = input_data.get('minutiae', [])
            if not input_minutiae:
                logger.error("No minutiae found in input template")
                return None
            
            best_match = None
            best_confidence = 0.0
            
            # Compare against each stored template
            for template_info in templates:
                student_id = template_info.get('studentId')
                stored_template = template_info.get('template')
                
                if not student_id or not stored_template:
                    continue
                
                # Decode stored template
                stored_data = self._decode_template(stored_template)
                if not stored_data:
                    continue
                    
                stored_minutiae = stored_data.get('minutiae', [])
                if not stored_minutiae:
                    continue
                
                # Calculate match confidence
                confidence = self._calculate_match_confidence(input_minutiae, stored_minutiae)
                
                logger.info(f"Match confidence for student {student_id}: {confidence:.3f}")
                
                # Update best match if this one is better
                if confidence > best_confidence and confidence >= self.match_threshold:
                    best_confidence = confidence
                    best_match = {
                        'studentId': student_id,
                        'confidence': confidence
                    }
            
            if best_match:
                logger.info(f"Best match found: Student {best_match['studentId']} with confidence {best_match['confidence']:.3f}")
            else:
                logger.info(f"No match found above threshold {self.match_threshold}")
            
            return best_match
            
        except Exception as e:
            logger.error(f"Error during fingerprint matching: {str(e)}")
            return None
    
    def _calculate_match_confidence(self, minutiae1: List[Dict], minutiae2: List[Dict]) -> float:
        """
        Calculate confidence score between two sets of minutiae
        
        Uses a simplified matching algorithm based on:
        1. Spatial proximity of minutiae points
        2. Orientation similarity
        3. Overall distribution patterns
        """
        try:
            if not minutiae1 or not minutiae2:
                return 0.0
            
            # Convert minutiae to numpy arrays for easier computation
            points1 = np.array([[m['x'], m['y']] for m in minutiae1])
            points2 = np.array([[m['x'], m['y']] for m in minutiae2])
            orientations1 = np.array([m.get('orientation', 0) for m in minutiae1])
            orientations2 = np.array([m.get('orientation', 0) for m in minutiae2])
            
            # Find correspondences between minutiae points
            matches = self._find_minutiae_correspondences(
                points1, points2, orientations1, orientations2
            )
            
            if len(matches) == 0:
                return 0.0
            
            # Calculate confidence based on:
            # 1. Number of matched minutiae
            # 2. Quality of matches (distance and orientation similarity)
            # 3. Relative coverage of fingerprint area
            
            match_count = len(matches)
            total_minutiae = max(len(minutiae1), len(minutiae2))
            
            # Match ratio score
            match_ratio = match_count / total_minutiae
            
            # Average match quality score
            total_distance_score = 0.0
            total_orientation_score = 0.0
            
            for match in matches:
                i, j, distance, orientation_diff = match
                
                # Distance score (closer is better)
                distance_score = max(0, 1 - (distance / self.max_distance_threshold))
                
                # Orientation score (similar orientation is better)
                orientation_score = max(0, 1 - (abs(orientation_diff) / self.orientation_tolerance))
                
                total_distance_score += distance_score
                total_orientation_score += orientation_score
            
            avg_distance_score = total_distance_score / match_count
            avg_orientation_score = total_orientation_score / match_count
            
            # Calculate overall confidence
            # Weighted combination of different factors
            confidence = (
                0.4 * match_ratio +
                0.3 * avg_distance_score +
                0.3 * avg_orientation_score
            )
            
            # Apply bonus for higher match counts
            if match_count >= 15:
                confidence += 0.1
            elif match_count >= 10:
                confidence += 0.05
            
            return min(confidence, 1.0)  # Cap at 1.0
            
        except Exception as e:
            logger.error(f"Error calculating match confidence: {str(e)}")
            return 0.0
    
    def _find_minutiae_correspondences(self, points1: np.ndarray, points2: np.ndarray, 
                                     orientations1: np.ndarray, orientations2: np.ndarray) -> List[tuple]:
        """
        Find corresponding minutiae points between two fingerprint templates
        
        Returns list of tuples: (index1, index2, distance, orientation_difference)
        """
        matches = []
        used_indices2 = set()
        
        for i, (point1, orientation1) in enumerate(zip(points1, orientations1)):
            best_match = None
            best_score = float('inf')
            
            for j, (point2, orientation2) in enumerate(zip(points2, orientations2)):
                if j in used_indices2:
                    continue
                
                # Calculate Euclidean distance
                distance = np.linalg.norm(point1 - point2)
                
                # Skip if distance is too large
                if distance > self.max_distance_threshold:
                    continue
                
                # Calculate orientation difference
                orientation_diff = abs(self._normalize_angle(orientation1 - orientation2))
                
                # Skip if orientation difference is too large
                if orientation_diff > self.orientation_tolerance:
                    continue
                
                # Calculate combined score (lower is better)
                combined_score = distance + (orientation_diff * 20)  # Weight orientation difference
                
                if combined_score < best_score:
                    best_score = combined_score
                    best_match = (i, j, distance, orientation_diff)
            
            if best_match:
                matches.append(best_match)
                used_indices2.add(best_match[1])
        
        return matches
    
    def _normalize_angle(self, angle: float) -> float:
        """
        Normalize angle to [-π, π] range
        """
        while angle > np.pi:
            angle -= 2 * np.pi
        while angle < -np.pi:
            angle += 2 * np.pi
        return angle
    
    def _decode_template(self, template: str) -> Optional[Dict[str, Any]]:
        """
        Decode a fingerprint template from base64 encoded JSON
        """
        try:
            template_json = base64.b64decode(template).decode()
            template_data = json.loads(template_json)
            return template_data
        except Exception as e:
            logger.error(f"Error decoding template: {str(e)}")
            return None
    
    def verify_match(self, template1: str, template2: str) -> Dict[str, Any]:
        """
        Verify if two fingerprint templates match
        
        Args:
            template1: First fingerprint template
            template2: Second fingerprint template
            
        Returns:
            Dictionary containing match result and confidence
        """
        try:
            # Decode both templates
            data1 = self._decode_template(template1)
            data2 = self._decode_template(template2)
            
            if not data1 or not data2:
                return {
                    'success': False,
                    'match': False,
                    'confidence': 0.0,
                    'error': 'Failed to decode templates'
                }
            
            minutiae1 = data1.get('minutiae', [])
            minutiae2 = data2.get('minutiae', [])
            
            if not minutiae1 or not minutiae2:
                return {
                    'success': False,
                    'match': False,
                    'confidence': 0.0,
                    'error': 'No minutiae found in templates'
                }
            
            # Calculate match confidence
            confidence = self._calculate_match_confidence(minutiae1, minutiae2)
            is_match = confidence >= self.match_threshold
            
            return {
                'success': True,
                'match': is_match,
                'confidence': confidence,
                'threshold': self.match_threshold
            }
            
        except Exception as e:
            logger.error(f"Error verifying match: {str(e)}")
            return {
                'success': False,
                'match': False,
                'confidence': 0.0,
                'error': f'Verification failed: {str(e)}'
            }
    
    def get_similarity_score(self, template1: str, template2: str) -> float:
        """
        Get similarity score between two templates (0.0 to 1.0)
        """
        try:
            result = self.verify_match(template1, template2)
            return result.get('confidence', 0.0)
        except Exception as e:
            logger.error(f"Error getting similarity score: {str(e)}")
            return 0.0
