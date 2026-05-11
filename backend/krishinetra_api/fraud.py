def calculate_fraud_score(
    claimed_crop,
    predicted_crop,
    confidence,
    gps_distance_km,
    ndvi=None,
):
    crop_mismatch = 0.5 if claimed_crop != predicted_crop else 0.0
    high_confidence = 0.3 if float(confidence) > 0.85 else 0.0
    gps_anomaly = 0.2 if float(gps_distance_km) > 1.0 else 0.0

    risk_score = round(crop_mismatch + high_confidence + gps_anomaly, 2)
    is_fraud = risk_score > 0.4

    reasons = []
    if crop_mismatch:
        reasons.append("claimed crop does not match image prediction")
    if high_confidence:
        reasons.append("model prediction confidence is high")
    if gps_anomaly:
        reasons.append("submitted GPS location is more than 1 km from the farm")
    if ndvi is not None and float(ndvi) < 0.2:
        reasons.append("NDVI indicates low vegetation vigor")
    if not reasons:
        reasons.append("no major fraud indicators detected")

    return {
        "risk_score": risk_score,
        "is_fraud": is_fraud,
        "reason": "; ".join(reasons),
    }
