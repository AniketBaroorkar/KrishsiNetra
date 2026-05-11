from pathlib import Path

from predict import predict_crop


def classify_crop(image_path):
    image_path = Path(image_path)
    result = predict_crop(image_path)
    return {
        "predicted_crop": result["predicted_crop"],
        "confidence": result["confidence"],
    }
