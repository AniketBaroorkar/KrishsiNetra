import argparse
import copy
from pathlib import Path

import torch
from torch import nn, optim
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, models, transforms
from torchvision.models import ResNet18_Weights


CLASS_NAMES = ["wheat", "rice", "sugarcane", "cotton", "soybean", "jowar"]
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


def validate_data_dir(data_dir):
    missing = [class_name for class_name in CLASS_NAMES if not (data_dir / class_name).is_dir()]
    if missing:
        raise FileNotFoundError(
            "Missing crop image folders: "
            + ", ".join(str(data_dir / class_name) for class_name in missing)
        )


def build_model(num_classes):
    weights = ResNet18_Weights.DEFAULT
    model = models.resnet18(weights=weights)
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)
    return model


def calculate_accuracy(outputs, labels):
    _, predictions = torch.max(outputs, dim=1)
    correct = torch.sum(predictions == labels).item()
    return correct


def run_epoch(model, dataloader, criterion, optimizer, device, training):
    if training:
        model.train()
    else:
        model.eval()

    running_loss = 0.0
    running_correct = 0
    total_samples = 0

    for images, labels in dataloader:
        images = images.to(device)
        labels = labels.to(device)

        optimizer.zero_grad()

        with torch.set_grad_enabled(training):
            outputs = model(images)
            loss = criterion(outputs, labels)

            if training:
                loss.backward()
                optimizer.step()

        batch_size = images.size(0)
        running_loss += loss.item() * batch_size
        running_correct += calculate_accuracy(outputs, labels)
        total_samples += batch_size

    epoch_loss = running_loss / total_samples
    epoch_accuracy = running_correct / total_samples
    return epoch_loss, epoch_accuracy


def train(data_dir, model_path, epochs, batch_size, learning_rate):
    data_dir = Path(data_dir)
    model_path = Path(model_path)
    validate_data_dir(data_dir)

    dataset = datasets.ImageFolder(root=data_dir, transform=build_transforms())
    if len(dataset) < 2:
        raise ValueError("At least two training images are required.")

    if sorted(dataset.classes) != sorted(CLASS_NAMES):
        raise ValueError(
            f"Expected exactly these classes: {CLASS_NAMES}. Found: {dataset.classes}"
        )

    train_size = max(1, int(0.8 * len(dataset)))
    val_size = len(dataset) - train_size
    if val_size == 0:
        train_dataset = dataset
        val_dataset = dataset
    else:
        generator = torch.Generator().manual_seed(42)
        train_dataset, val_dataset = random_split(
            dataset, [train_size, val_size], generator=generator
        )

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=0,
        pin_memory=torch.cuda.is_available(),
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=0,
        pin_memory=torch.cuda.is_available(),
    )

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = build_model(num_classes=len(dataset.classes)).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=learning_rate)

    best_accuracy = 0.0
    best_state = copy.deepcopy(model.state_dict())

    for epoch in range(1, epochs + 1):
        train_loss, train_accuracy = run_epoch(
            model, train_loader, criterion, optimizer, device, training=True
        )
        val_loss, val_accuracy = run_epoch(
            model, val_loader, criterion, optimizer, device, training=False
        )

        print(
            f"Epoch {epoch}/{epochs} - "
            f"train_loss: {train_loss:.4f} - "
            f"train_acc: {train_accuracy * 100:.2f}% - "
            f"val_loss: {val_loss:.4f} - "
            f"val_acc: {val_accuracy * 100:.2f}%"
        )

        if val_accuracy >= best_accuracy:
            best_accuracy = val_accuracy
            best_state = copy.deepcopy(model.state_dict())
            torch.save(
                {
                    "model_state_dict": best_state,
                    "class_names": dataset.classes,
                    "best_accuracy": best_accuracy,
                    "image_size": IMAGE_SIZE,
                    "imagenet_mean": IMAGENET_MEAN,
                    "imagenet_std": IMAGENET_STD,
                },
                model_path,
            )

    print(f"Best model saved to {model_path} with accuracy {best_accuracy * 100:.2f}%")


def parse_args():
    base_dir = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description="Train KrishiNetra crop classifier.")
    parser.add_argument("--data-dir", default=str(base_dir / "data"))
    parser.add_argument("--model-path", default=str(base_dir / "crop_model.pth"))
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--learning-rate", type=float, default=1e-4)
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    train(
        data_dir=args.data_dir,
        model_path=args.model_path,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
    )
