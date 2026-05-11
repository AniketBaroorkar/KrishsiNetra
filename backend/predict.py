import argparse
import json
from pathlib import Path

import torch
from PIL import Image
from torch import nn
from torchvision import models, transforms


DEFAULT_CLASS_NAMES = ["wheat", "rice", "sugarcane", "cotton", "soybean", "jowar"]
IMAGE_SIZE = 224
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def build_transforms():
    return transforms.Compose(
        [
            transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ]
    )


def build_model(num_classes):
    model = models.resnet18(weights=None)
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)
    return model


def load_checkpoint(model_path, device):
    checkpoint = torch.load(model_path, map_location=device)
    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        class_names = checkpoint.get("class_names", DEFAULT_CLASS_NAMES)
        state_dict = checkpoint["model_state_dict"]
    else:
        class_names = DEFAULT_CLASS_NAMES
        state_dict = checkpoint

    model = build_model(num_classes=len(class_names))
    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()
    return model, class_names


def predict_crop(image_path, model_path=None):
    base_dir = Path(__file__).resolve().parent
    image_path = Path(image_path)
    model_path = Path(model_path) if model_path else base_dir / "crop_model.pth"

    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")
    if not image_path.exists():
        raise FileNotFoundError(f"Image file not found: {image_path}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model, class_names = load_checkpoint(model_path, device)

    image = Image.open(image_path).convert("RGB")
    image_tensor = build_transforms()(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(image_tensor)
        probabilities = torch.softmax(outputs, dim=1)
        confidence, predicted_index = torch.max(probabilities, dim=1)

    return {
        "predicted_crop": class_names[predicted_index.item()],
        "confidence": round(confidence.item() * 100, 2),
    }


def parse_args():
    base_dir = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Predict crop class for one image.")
    parser.add_argument("image_path")
    parser.add_argument("--model-path", default=str(base_dir / "crop_model.pth"))
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    result = predict_crop(args.image_path, args.model_path)
    print(json.dumps(result))
