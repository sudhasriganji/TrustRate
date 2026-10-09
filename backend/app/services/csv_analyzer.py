import io
import csv
import pandas as pd
from typing import List, Tuple, Dict, Any
from app.schemas.models import ReviewItem, ReviewAnalysisResult


class CSVAnalyzer:
    """
    Validates, parses, and processes CSV files containing product reviews.
    Generates downloadable enriched audit reports.
    """

    MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit
    MAX_ROWS = 500  # Hackathon reasonable quantum batch limit

    @classmethod
    def parse_csv_bytes(cls, content: bytes) -> Tuple[List[ReviewItem], List[str]]:
        """
        Parses raw CSV bytes into validated ReviewItem models.
        Returns (reviews, warnings). Raises ValueError for invalid structure.
        """
        if len(content) > cls.MAX_FILE_SIZE_BYTES:
            raise ValueError(f"File size exceeds maximum permitted limit ({cls.MAX_FILE_SIZE_BYTES / (1024 * 1024):.1f} MB).")

        try:
            # Detect encoding and parse with pandas
            df = pd.read_csv(io.BytesIO(content))
        except Exception as e:
            raise ValueError(f"Unable to parse CSV file: {str(e)}")

        if df.empty:
            raise ValueError("Uploaded CSV file is empty.")

        # Normalize column names (strip whitespace, lowercase)
        df.columns = [str(c).strip().lower() for c in df.columns]

        # Check required columns
        text_col = None
        for candidate in ["review_text", "text", "review", "content", "body"]:
            if candidate in df.columns:
                text_col = candidate
                break

        if not text_col:
            raise ValueError("CSV missing required review text column (expected 'review_text', 'review', or 'text').")

        rating_col = None
        for candidate in ["rating", "score", "stars", "star_rating"]:
            if candidate in df.columns:
                rating_col = candidate
                break

        if not rating_col:
            raise ValueError("CSV missing required rating column (expected 'rating' or 'score').")

        # Optional columns
        id_col = next((c for c in ["review_id", "id", "review_number"] if c in df.columns), None)
        prod_col = next((c for c in ["product_id", "product", "item_id", "asin"] if c in df.columns), None)
        user_col = next((c for c in ["reviewer_id", "user_id", "author", "user"] if c in df.columns), None)
        time_col = next((c for c in ["timestamp", "date", "created_at", "time"] if c in df.columns), None)
        ground_truth_col = next((c for c in ["ground_truth_label", "label", "is_fake", "ground_truth"] if c in df.columns), None)

        reviews: List[ReviewItem] = []
        warnings: List[str] = []

        total_rows = len(df)
        if total_rows > cls.MAX_ROWS:
            warnings.append(f"CSV contains {total_rows} rows. Truncating to first {cls.MAX_ROWS} rows for quantum kernel stability.")
            df = df.iloc[:cls.MAX_ROWS]

        for idx, row in df.iterrows():
            raw_text = str(row[text_col]).strip() if pd.notna(row[text_col]) else ""
            if not raw_text or raw_text.lower() == "nan":
                warnings.append(f"Row {idx + 1} skipped due to empty review text.")
                continue

            try:
                raw_rating = float(row[rating_col])
                if not (1.0 <= raw_rating <= 5.0):
                    raw_rating = max(1.0, min(5.0, raw_rating))
                    warnings.append(f"Row {idx + 1} rating clamped to range [1.0, 5.0].")
            except Exception:
                raw_rating = 3.0
                warnings.append(f"Row {idx + 1} rating invalid; defaulted to 3.0.")

            rev_id = str(row[id_col]).strip() if (id_col and pd.notna(row[id_col])) else f"CSV-REV-{idx + 1:04d}"
            prod_id = str(row[prod_col]).strip() if (prod_col and pd.notna(row[prod_col])) else "PROD-GENERIC"
            user_id = str(row[user_col]).strip() if (user_col and pd.notna(row[user_col])) else None
            timestamp = str(row[time_col]).strip() if (time_col and pd.notna(row[time_col])) else None
            gt_label = str(row[ground_truth_col]).strip().lower() if (ground_truth_col and pd.notna(row[ground_truth_col])) else None

            reviews.append(
                ReviewItem(
                    review_id=rev_id,
                    product_id=prod_id,
                    reviewer_id=user_id,
                    rating=raw_rating,
                    review_text=raw_text,
                    timestamp=timestamp,
                    ground_truth_label=gt_label,
                )
            )

        if not reviews:
            raise ValueError("No valid review rows found in uploaded CSV.")

        return reviews, warnings

    @classmethod
    def export_results_csv(cls, results: List[ReviewAnalysisResult]) -> str:
        """
        Generates a formatted CSV string with comprehensive quantum-classical audit findings.
        """
        output = io.StringIO()
        fieldnames = [
            "review_id",
            "product_id",
            "rating",
            "classical_label",
            "classical_risk_score",
            "quantum_label",
            "quantum_risk_score",
            "combined_risk_score",
            "consensus",
            "reasons",
            "execution_mode",
            "review_text_excerpt",
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()

        for res in results:
            text_excerpt = (res.review_text[:120] + "...") if len(res.review_text) > 120 else res.review_text
            writer.writerow({
                "review_id": res.review_id,
                "product_id": res.product_id,
                "rating": res.rating,
                "classical_label": res.classical_label,
                "classical_risk_score": res.classical_risk_score,
                "quantum_label": res.quantum_label or "N/A",
                "quantum_risk_score": res.quantum_risk_score or "N/A",
                "combined_risk_score": res.combined_risk_score,
                "consensus": res.consensus,
                "reasons": " | ".join(res.reasons),
                "execution_mode": res.execution_mode,
                "review_text_excerpt": text_excerpt,
            })

        return output.getvalue()
