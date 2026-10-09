import re
import numpy as np
from typing import List, Dict, Tuple, Any
from app.schemas.models import ReviewItem, FeatureAttribution


class ReviewFeatureExtractor:
    """
    Extracts explainable linguistic and statistical features from product reviews.
    Normalizes a subset into [0, pi] for quantum ZZFeatureMap encoding.
    """

    NEGATIVE_KEYWORDS = {"terrible", "horrible", "scam", "worst", "broke", "garbage", "trash", "waste", "useless", "fake", "bad"}
    POSITIVE_KEYWORDS = {"amazing", "best", "love", "awesome", "perfect", "great", "excellent", "super", "flawless", "buy", "recommend"}

    @classmethod
    def extract_single(cls, review: ReviewItem) -> Dict[str, float]:
        text = review.review_text.strip()
        rating = float(review.rating)
        char_len = max(len(text), 1)
        words = re.findall(r"\b\w+\b", text.lower())
        word_count = max(len(words), 1)

        # 1. Uppercase ratio (ALL CAPS detection)
        upper_chars = sum(1 for c in text if c.isupper())
        uppercase_ratio = upper_chars / char_len

        # 2. Exclamation & punctuation marks
        exclamation_count = text.count("!")
        question_count = text.count("?")
        punct_intensity = (exclamation_count * 2 + question_count) / max(word_count, 1)

        # 3. Rating extremity (distance from balanced rating 3.0: 1 or 5 -> 1.0, 3 -> 0.0)
        rating_extremity = abs(rating - 3.0) / 2.0

        # 4. Word repetition & lexical diversity
        unique_words = len(set(words))
        lexical_diversity = unique_words / word_count
        repetition_score = 1.0 - lexical_diversity  # 0.0 = completely unique, 1.0 = highly repetitive

        # 5. Consecutive repeated words or phrases (e.g., "buy buy buy", "so good so good")
        repeated_phrase_bonus = 0.0
        for i in range(len(words) - 1):
            if words[i] == words[i + 1]:
                repeated_phrase_bonus += 0.2
        repetition_score = min(repetition_score + repeated_phrase_bonus, 1.0)

        # 6. Sentiment keyword counts
        neg_count = sum(1 for w in words if w in cls.NEGATIVE_KEYWORDS)
        pos_count = sum(1 for w in words if w in cls.POSITIVE_KEYWORDS)

        # Polarity conflict: high rating with negative words or low rating with positive praise
        polarity_conflict = 0.0
        if rating >= 4.0 and neg_count > 1:
            polarity_conflict = 0.8
        elif rating <= 2.0 and pos_count > 2:
            polarity_conflict = 0.8

        # 7. Unnatural brevity with extreme rating
        brevity_anomaly = 1.0 if (word_count < 10 and (rating == 1.0 or rating == 5.0)) else 0.0

        return {
            "char_len": float(char_len),
            "word_count": float(word_count),
            "uppercase_ratio": float(uppercase_ratio),
            "exclamation_count": float(exclamation_count),
            "punct_intensity": float(punct_intensity),
            "rating_extremity": float(rating_extremity),
            "lexical_diversity": float(lexical_diversity),
            "repetition_score": float(repetition_score),
            "polarity_conflict": float(polarity_conflict),
            "brevity_anomaly": float(brevity_anomaly),
            "rating": rating,
        }

    @classmethod
    def get_quantum_vector(
        cls, raw_features: Dict[str, float], n_qubits: int = 4
    ) -> Tuple[np.ndarray, List[FeatureAttribution], List[str]]:
        """
        Normalizes high-signal features into [0, pi] suitable for ZZFeatureMap angle encoding.
        Returns the vector, feature attributions, and human-readable flag reasons.
        """
        # Feature 0: Normalized Text Density (0 = moderate/detailed, high = very short or unnaturally dense)
        # Typical normal review has 20-100 words. Suspicious spam is either <10 words or repeated bursts.
        word_count = raw_features["word_count"]
        if word_count < 10:
            f0_norm = 0.85
        elif word_count > 120:
            f0_norm = 0.3
        else:
            f0_norm = 0.15

        # Feature 1: Emotional & Punctuation Intensity (Caps + Exclamations)
        # Raw caps ratio usually 0.02 - 0.10. High caps (>0.25) or high exclamation (>0.3) is suspicious.
        caps = raw_features["uppercase_ratio"]
        punct = raw_features["punct_intensity"]
        f1_norm = min((caps * 2.5 + punct * 1.5), 1.0)

        # Feature 2: Rating Extremity
        # 1.0 or 5.0 gives 1.0; 3.0 gives 0.0
        f2_norm = raw_features["rating_extremity"]

        # Feature 3: Repetition & Formulaic Pattern
        # Repetition score ranges 0.0 to 1.0
        f3_norm = raw_features["repetition_score"]

        # Base 4-dimensional normalized vector in [0.0, 1.0]
        base_features = [f0_norm, f1_norm, f2_norm, f3_norm]

        if n_qubits == 2:
            selected_features = [base_features[1], base_features[3]]  # Punctuation & Repetition
        elif n_qubits == 3:
            selected_features = [base_features[1], base_features[2], base_features[3]]
        else:
            selected_features = base_features[:n_qubits]

        # Scale to [0, pi] for Qiskit angle encoding
        scaled_q_vector = np.array(selected_features, dtype=float) * np.pi

        # Build feature attributions
        attributions = [
            FeatureAttribution(
                feature_name="Text Density & Brevity",
                raw_value=float(raw_features["word_count"]),
                normalized_value=float(f0_norm),
                description=f"{int(raw_features['word_count'])} words; extreme shortness or atypical density",
                suspicion_contribution=float(f0_norm * 25.0),
            ),
            FeatureAttribution(
                feature_name="Punctuation & Caps Intensity",
                raw_value=float(raw_features["punct_intensity"]),
                normalized_value=float(f1_norm),
                description=f"{int(raw_features['exclamation_count'])} exclamations, {raw_features['uppercase_ratio'] * 100:.1f}% uppercase",
                suspicion_contribution=float(f1_norm * 35.0),
            ),
            FeatureAttribution(
                feature_name="Rating Extremity",
                raw_value=float(raw_features["rating"]),
                normalized_value=float(f2_norm),
                description=f"Rating {raw_features['rating']:.1f}/5.0 (deviation from neutral)",
                suspicion_contribution=float(f2_norm * 15.0),
            ),
            FeatureAttribution(
                feature_name="Repetition & Copy-Paste Index",
                raw_value=float(raw_features["repetition_score"]),
                normalized_value=float(f3_norm),
                description=f"Repetition score {raw_features['repetition_score']:.2f} (lexical redundancy)",
                suspicion_contribution=float(f3_norm * 25.0),
            ),
        ]

        # Generate reasons
        reasons = []
        if raw_features["uppercase_ratio"] > 0.25:
            reasons.append("Excessive uppercase lettering / shouting detected")
        if raw_features["exclamation_count"] >= 3:
            reasons.append(f"Atypical punctuation burst ({int(raw_features['exclamation_count'])} exclamations)")
        if raw_features["repetition_score"] > 0.45:
            reasons.append(f"High repetition rate / formulaic phrasing ({raw_features['repetition_score'] * 100:.0f}%)")
        if raw_features["polarity_conflict"] > 0.5:
            reasons.append("Severe sentiment-rating polarity conflict")
        if raw_features["brevity_anomaly"] > 0.5:
            reasons.append("Superficial brevity combined with polar rating")
        if not reasons:
            reasons.append("Linguistic patterns match organic user behavior")

        return scaled_q_vector, attributions, reasons
