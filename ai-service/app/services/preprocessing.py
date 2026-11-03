"""Image Preprocessing and Transformation Pipeline for Plant Foliage Analysis."""

import io
from PIL import Image, UnidentifiedImageError
import torch
from torchvision import transforms
import logging

logger = logging.getLogger(__name__)

# ImageNet normalization statistics expected by EfficientNet-B0
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
IMAGE_SIZE = 224


def get_inference_transforms() -> transforms.Compose:
    """Returns deterministic preprocessing transforms for model inference and validation."""
    return transforms.Compose(
        [
            transforms.Resize((IMAGE_SIZE, IMAGE_SIZE), interpolation=transforms.InterpolationMode.BILINEAR),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ]
    )


def get_training_transforms() -> transforms.Compose:
    """Returns data augmentation pipeline for model training and fine-tuning."""
    return transforms.Compose(
        [
            transforms.RandomResizedCrop(IMAGE_SIZE, scale=(0.8, 1.0)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomVerticalFlip(p=0.2),
            transforms.RandomRotation(degrees=15),
            transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ]
    )


def decode_and_preprocess_image(image_bytes: bytes) -> torch.Tensor:
    """Decodes raw image bytes into a normalized tensor ready for inference.

    Args:
        image_bytes: Raw binary bytes of uploaded image.

    Returns:
        torch.Tensor of shape (1, 3, 224, 224)

    Raises:
        ValueError: If image is empty, corrupted, or unsupported.
    """
    if not image_bytes or len(image_bytes) < 12:
        raise ValueError("Provided image data is empty or corrupted.")

    try:
        image = Image.open(io.BytesIO(image_bytes))

        # Check dimensions
        if image.width < 32 or image.height < 32:
            raise ValueError(f"Image resolution ({image.width}x{image.height}px) is too small for disease detection.")

        # Ensure standard 3-channel RGB representation
        if image.mode != "RGB":
            image = image.convert("RGB")

    except (UnidentifiedImageError, OSError, ValueError) as err:
        logger.warning("Image decoding failed: %s", err)
        raise ValueError("Invalid or corrupted image format. Please supply a valid JPEG, PNG, or WebP photo.") from err

    # Apply inference transformation
    transform = get_inference_transforms()
    tensor: torch.Tensor = transform(image)

    # Add batch dimension: (1, 3, 224, 224)
    return tensor.unsqueeze(0)

