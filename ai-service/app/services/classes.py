"""PlantVillage Dataset Class Definitions and Agricultural Metadata.

Source: PlantVillage Dataset (Hughes & Salathé, 2015; Penn State University)
License: Public Domain (CC0 1.0 Universal)
"""

from typing import TypedDict


class ClassMetadata(TypedDict):
    id: int
    raw_class: str
    crop: str
    disease: str
    is_healthy: bool
    severity_category: str  # 'healthy' | 'moderate' | 'high'
    description: str


PLANT_VILLAGE_CLASSES: list[ClassMetadata] = [
    # Tomato (10 classes)
    {
        "id": 0,
        "raw_class": "Tomato___Bacterial_spot",
        "crop": "Tomato",
        "disease": "Bacterial Spot (Xanthomonas spp.)",
        "is_healthy": False,
        "severity_category": "moderate",
        "description": "Small, water-soaked circular lesions on foliage turning dark brown with yellow halos.",
    },
    {
        "id": 1,
        "raw_class": "Tomato___Early_blight",
        "crop": "Tomato",
        "disease": "Early Blight (Alternaria solani)",
        "is_healthy": False,
        "severity_category": "high",
        "description": "Target-like concentric brown rings on older leaves progressing upward along the stem.",
    },
    {
        "id": 2,
        "raw_class": "Tomato___Late_blight",
        "crop": "Tomato",
        "disease": "Late Blight (Phytophthora infestans)",
        "is_healthy": False,
        "severity_category": "high",
        "description": "Irregular pale to dark green water-soaked spots rapidly expanding into brown necrotic lesions.",
    },
    {
        "id": 3,
        "raw_class": "Tomato___Leaf_Mold",
        "crop": "Tomato",
        "disease": "Leaf Mold (Passalora fulva)",
        "is_healthy": False,
        "severity_category": "moderate",
        "description": "Pale greenish-yellow spots on upper leaf surfaces with olive-green velvety fungal growth beneath.",
    },
    {
        "id": 4,
        "raw_class": "Tomato___Septoria_leaf_spot",
        "crop": "Tomato",
        "disease": "Septoria Leaf Spot (Septoria lycopersici)",
        "is_healthy": False,
        "severity_category": "moderate",
        "description": "Numerous small circular spots with dark brown margins and gray or tan centers containing pycnidia.",
    },
    {
        "id": 5,
        "raw_class": "Tomato___Spider_mites_Two-spotted_spider_mite",
        "crop": "Tomato",
        "disease": "Two-Spotted Spider Mite Infestation",
        "is_healthy": False,
        "severity_category": "moderate",
        "description": "Fine yellow stippling on leaf surfaces accompanied by delicate webbing under canopy.",
    },
    {
        "id": 6,
        "raw_class": "Tomato___Target_Spot",
        "crop": "Tomato",
        "disease": "Target Spot (Corynespora cassiicola)",
        "is_healthy": False,
        "severity_category": "high",
        "description": "Pinpoint brown lesions enlarging into circular spots with light brown centers and dark borders.",
    },
    {
        "id": 7,
        "raw_class": "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
        "crop": "Tomato",
        "disease": "Yellow Leaf Curl Virus (TYLCV)",
        "is_healthy": False,
        "severity_category": "high",
        "description": "Severe upward leaf curling, yellowing of leaf margins, and stunted inter-nodal growth.",
    },
    {
        "id": 8,
        "raw_class": "Tomato___Tomato_mosaic_virus",
        "crop": "Tomato",
        "disease": "Tomato Mosaic Virus (ToMV)",
        "is_healthy": False,
        "severity_category": "high",
        "description": "Mottled light and dark green mosaic patterns on foliage with distorted or blistered leaves.",
    },
    {
        "id": 9,
        "raw_class": "Tomato___healthy",
        "crop": "Tomato",
        "disease": "Optimal / Healthy Foliage",
        "is_healthy": True,
        "severity_category": "healthy",
        "description": "Uniform dark green foliage with intact stomatal structure and zero pathogenic necrosis.",
    },
    # Potato (3 classes)
    {
        "id": 10,
        "raw_class": "Potato___Early_blight",
        "crop": "Potato",
        "disease": "Early Blight (Alternaria solani)",
        "is_healthy": False,
        "severity_category": "high",
        "description": "Concentric dark brown rings appearing primarily on mature lower foliage.",
    },
    {
        "id": 11,
        "raw_class": "Potato___Late_blight",
        "crop": "Potato",
        "disease": "Late Blight (Phytophthora infestans)",
        "is_healthy": False,
        "severity_category": "high",
        "description": "Dark necrotic lesions on foliage and petioles accompanied by white fungal mold during humid mornings.",
    },
    {
        "id": 12,
        "raw_class": "Potato___healthy",
        "crop": "Potato",
        "disease": "Optimal / Healthy Foliage",
        "is_healthy": True,
        "severity_category": "healthy",
        "description": "Vigorous healthy foliage with robust leaf lamina and no fungal or bacterial spotting.",
    },
    # Pepper / Bell Pepper (2 classes)
    {
        "id": 13,
        "raw_class": "Pepper__bell___Bacterial_spot",
        "crop": "Pepper",
        "disease": "Bacterial Spot (Xanthomonas campestris)",
        "is_healthy": False,
        "severity_category": "moderate",
        "description": "Small, raised, scab-like circular spots on foliage often leading to premature leaf drop.",
    },
    {
        "id": 14,
        "raw_class": "Pepper__bell___healthy",
        "crop": "Pepper",
        "disease": "Optimal / Healthy Foliage",
        "is_healthy": True,
        "severity_category": "healthy",
        "description": "Uniform leaf structure with vibrant pigmentation and active photosynthetic capacity.",
    },
    # Corn / Maize (4 classes)
    {
        "id": 15,
        "raw_class": "Corn_(maize)___Cercospora_leaf_spot_Gray_leaf_spot",
        "crop": "Corn (Maize)",
        "disease": "Gray Leaf Spot (Cercospora zeae-maydis)",
        "is_healthy": False,
        "severity_category": "high",
        "description": "Rectangular, brown to gray lesions running parallel with leaf veins.",
    },
    {
        "id": 16,
        "raw_class": "Corn_(maize)___Common_rust_",
        "crop": "Corn (Maize)",
        "disease": "Common Rust (Puccinia sorghi)",
        "is_healthy": False,
        "severity_category": "moderate",
        "description": "Golden to cinnamon-brown powdery pustules scattered across both leaf surfaces.",
    },
    {
        "id": 17,
        "raw_class": "Corn_(maize)___Northern_Leaf_Blight",
        "crop": "Corn (Maize)",
        "disease": "Northern Leaf Blight (Exserohilum turcicum)",
        "is_healthy": False,
        "severity_category": "high",
        "description": "Large, elongated elliptical grayish-green or tan lesions on lower to upper canopy.",
    },
    {
        "id": 18,
        "raw_class": "Corn_(maize)___healthy",
        "crop": "Corn (Maize)",
        "disease": "Optimal / Healthy Foliage",
        "is_healthy": True,
        "severity_category": "healthy",
        "description": "Unblemished green leaf blades with uniform vascular venation and optimal vigor.",
    },
]

CLASS_NAMES: list[str] = [cls["raw_class"] for cls in PLANT_VILLAGE_CLASSES]
CLASS_MAP: dict[int, ClassMetadata] = {cls["id"]: cls for cls in PLANT_VILLAGE_CLASSES}
RAW_TO_METADATA: dict[str, ClassMetadata] = {cls["raw_class"]: cls for cls in PLANT_VILLAGE_CLASSES}
NUM_CLASSES: int = len(PLANT_VILLAGE_CLASSES)