"""EfficientNet-B0 Deep Learning Model Architecture for Crop Disease Classification."""

import torch
import torch.nn as nn
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights
import logging

logger = logging.getLogger(__name__)


class PlantDiseaseClassifier(nn.Module):
    """Modular EfficientNet-B0 transfer learning architecture for plant disease classification.

    The model reuses the pretrained convolutional feature extractor of EfficientNet-B0
    and replaces the final 1000-class classifier with a customized regularized
    multi-layer perceptron head tailored to agricultural plant pathology.
    """

    def __init__(
        self,
        num_classes: int = 19,
        pretrained: bool = True,
        dropout_rate: float = 0.3,
    ) -> None:
        super().__init__()
        self.num_classes = num_classes

        # Load EfficientNet-B0 backbone
        if pretrained:
            weights = EfficientNet_B0_Weights.DEFAULT
            self.backbone = efficientnet_b0(weights=weights)
            logger.info("Initialized EfficientNet-B0 with ImageNet pretrained weights.")
        else:
            self.backbone = efficientnet_b0(weights=None)
            logger.info("Initialized EfficientNet-B0 without pretrained weights.")

        # Extract input feature dimension from default classifier
        in_features = self.backbone.classifier[1].in_features

        # Replace top classification head
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(p=dropout_rate, inplace=True),
            nn.Linear(in_features, 512),
            nn.SiLU(inplace=True),
            nn.Dropout(p=0.2, inplace=True),
            nn.Linear(512, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass generating unnormalized class logits.

        Args:
            x: Input tensor of shape (batch_size, 3, 224, 224)

        Returns:
            Logits tensor of shape (batch_size, num_classes)
        """
        return self.backbone(x)

    def freeze_backbone(self) -> None:
        """Freezes feature extractor layers during initial fine-tuning stage."""
        for param in self.backbone.features.parameters():
            param.requires_grad = False
        logger.info("EfficientNet-B0 feature extractor backbone frozen.")

    def unfreeze_backbone(self) -> None:
        """Unfreezes all layers for full end-to-end network fine-tuning."""
        for param in self.backbone.features.parameters():
            param.requires_grad = True
        logger.info("EfficientNet-B0 feature extractor backbone unfrozen.")


def create_model(
    num_classes: int = 19,
    weights_path: str | None = None,
    device: torch.device | None = None,
) -> PlantDiseaseClassifier:
    """Factory function to build and optionally restore trained model weights."""
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    model = PlantDiseaseClassifier(num_classes=num_classes, pretrained=weights_path is None)

    if weights_path:
        logger.info("Loading fine-tuned checkpoint from %s", weights_path)
        checkpoint = torch.load(weights_path, map_location=device)
        if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
            model.load_state_dict(checkpoint["state_dict"])
        elif isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
            model.load_state_dict(checkpoint["model_state_dict"])
        else:
            model.load_state_dict(checkpoint)

    model.to(device)
    model.eval()
    return model

