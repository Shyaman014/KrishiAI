"""Agricultural Knowledge Base for Plant Pathology & Crop Disease Management.

Curated from trusted institutional extension sources:
- ICAR (Indian Council of Agricultural Research)
- TNAU Agritech Portal (Tamil Nadu Agricultural University)
- PlantVillage (Penn State University / FAO)
- Penn State College of Agricultural Sciences Extension
"""

from typing import TypedDict


class TreatmentGuidance(TypedDict):
    general_approaches: list[str]
    chemical_guidance: list[str]
    organic_treatments: list[str]
    when_to_seek_help: str


class DiseaseKnowledge(TypedDict):
    scientific_name: str
    crop: str
    disease: str
    is_healthy: bool
    overview: str
    symptoms: list[str]
    causes: list[str]
    environmental_conditions: list[str]
    impact_on_growth: str
    early_warning_signs: list[str]
    severity_explanation: str
    prevention: list[str]
    sanitation: list[str]
    treatment: TreatmentGuidance
    reference_sources: list[str]
    last_reviewed: str


# English Ground Truth Base
KNOWLEDGE_BASE_EN: dict[str, DiseaseKnowledge] = {
    # ---------------- Tomato (10 classes) ----------------
    "Tomato___Bacterial_spot": {
        "scientific_name": "Xanthomonas campestris pv. vesicatoria",
        "crop": "Tomato",
        "disease": "Bacterial Spot",
        "is_healthy": False,
        "overview": (
            "Bacterial spot is a destructive foliar and fruit disease of tomatoes common in warm, "
            "humid production regions. It causes leaf defoliation, blossom abortion, and fruit blemishes."
        ),
        "symptoms": [
            "Small, dark brown to black circular lesions on leaves, often surrounded by yellow halos",
            "Lesions appearing water-soaked during initial stages on lower canopy foliage",
            "Raised, scab-like rough brown pustules on developing green fruits",
            "Severe blight and premature leaf drop leading to sunscald on unprotected fruit",
        ],
        "causes": [
            "Infection by Xanthomonas bacterial pathogen transmitted through infected seeds or transplants",
            "Secondary spread via wind-driven rain splash, sprinkler irrigation, and contaminated tools",
        ],
        "environmental_conditions": [
            "Warm temperatures between 24°C and 30°C (75°F–86°F)",
            "Prolonged leaf wetness exceeding 4 to 6 hours",
            "High relative humidity above 85% and frequent rainfall or overhead irrigation",
        ],
        "impact_on_growth": (
            "Extensive defoliation reduces photosynthetic canopy area, stunts vegetative vigor, "
            "triggers blossom drop, and exposes fruit to sunscald and secondary fruit rot."
        ),
        "early_warning_signs": [
            "Tiny pinprick water-soaked specks on the undersides of the lowest, oldest leaves",
            "Yellow halo formation around pinpoint spots following periods of rainfall",
        ],
        "severity_explanation": "Moderate to high severity depending on growth stage; highly damaging during flowering and early fruit set.",
        "prevention": [
            "Plant only certified disease-free, hot-water-treated seed or certified clean nursery stock",
            "Practice a minimum 2 to 3-year crop rotation away from solanaceous crops (tomatoes, peppers, potatoes)",
            "Adopt drip irrigation or furrow irrigation instead of overhead sprinklers to keep foliage dry",
            "Maintain optimal plant spacing to promote rapid canopy drying through air circulation",
        ],
        "sanitation": [
            "Disinfect pruning shears, stakes, and crates with 10% bleach or 70% ethanol between plants",
            "Rogue out and destroy infected plant debris at first notice; do not compost diseased vines",
            "Deep plow crop residues immediately following the final harvest to accelerate decomposition",
        ],
        "treatment": {
            "general_approaches": [
                "Implement integrated pest management combining copper-based bactericides with resistant cultivars",
                "Mulch beds with clean straw or plastic mulch to prevent soil-to-leaf splash dispersal",
            ],
            "chemical_guidance": [
                "Fixed copper bactericides (e.g., copper hydroxide or copper oxychloride) applied preventively at early onset according to state extension label rates",
                "Copper combined with mancozeb for improved synergistic bacterial suppression in high-pressure regions",
            ],
            "organic_treatments": [
                "Preventive sprays of OMRI-listed Bacillus subtilis or Bacillus amyloliquefaciens bio-fungicides",
                "Certified copper octanoate (copper soap) sprays at recommended minimum dilution rates",
            ],
            "when_to_seek_help": (
                "Consult local Krishi Vigyan Kendra (KVK) or district agricultural extension officer if lesions "
                "spread across more than 20% of canopy during flowering despite preventive copper applications."
            ),
        },
        "reference_sources": [
            "ICAR - Indian Institute of Vegetable Research (IIVR) Tomato Advisory",
            "TNAU Agritech Portal - Crop Protection: Vegetables (Tomato Bacterial Spot)",
            "Penn State Extension - Tomato Bacterial Diseases Management Guide",
        ],
        "last_reviewed": "2026-10-15",
    },
    "Tomato___Early_blight": {
        "scientific_name": "Alternaria solani",
        "crop": "Tomato",
        "disease": "Early Blight",
        "is_healthy": False,
        "overview": (
            "Early blight is an airborne fungal disease characterized by concentric target-board lesions "
            "on leaves, collar rot on seedling stems, and sunken leathery rot on mature fruits."
        ),
        "symptoms": [
            "Concentric dark brown rings resembling an archery target on mature lower leaves",
            "Surrounding leaf tissue turning chlorotic (yellow) as lesions enlarge",
            "Collar rot lesions girdling lower stems of young tomato plants",
            "Sunken, dark, leathery lesions at the stem end of mature green or ripe fruits",
        ],
        "causes": [
            "Soil-borne fungal conidia of Alternaria solani surviving on solanaceous crop debris",
            "Conidia splashed onto lower leaves by rain drops and warm winds",
        ],
        "environmental_conditions": [
            "Moderate to warm temperatures between 24°C and 29°C (75°F–84°F)",
            "Frequent heavy dew, rainfall, or high relative humidity alternating with dry sunny periods",
        ],
        "impact_on_growth": (
            "Premature defoliation starts at bottom leaves and moves upward, starving fruit of sugars "
            "and exposing tomatoes to intense sunscald."
        ),
        "early_warning_signs": [
            "Small brown specks with faint concentric rings appearing on oldest bottom leaves near ground",
        ],
        "severity_explanation": "High severity if left unmanaged; can cause 30–50% yield reduction under continuous warm, humid conditions.",
        "prevention": [
            "Implement a strict 3-year crop rotation excluding tomatoes, potatoes, eggplants, and peppers",
            "Select early-blight tolerant or resistant tomato hybrids where available",
            "Stake and prune indeterminate vines to maintain open canopy and avoid soil contact",
            "Apply reflective or black plastic mulch to form a physical barrier over soil conidia",
        ],
        "sanitation": [
            "Strip and safely dispose of bottom 30 cm of leaves once plants are established",
            "Clear all infected leaves from the field floor; burn or deeply bury crop residues after harvest",
        ],
        "treatment": {
            "general_approaches": [
                "Scout fields weekly; initiate preventive fungicide applications at first sighting of lower leaf spots",
                "Ensure balanced plant nutrition avoiding nitrogen deficiency which predisposes foliage to blight",
            ],
            "chemical_guidance": [
                "Preventive protectant fungicides such as Mancozeb 75% WP or Chlorothalonil 75% WP per approved local extension guidelines",
                "Systemic fungicides (e.g., Azoxystrobin or Difenoconazole) reserved for severe disease pressure",
            ],
            "organic_treatments": [
                "Bio-control foliar sprays using Trichoderma viride or Pseudomonas fluorescens @ 5g/L",
                "Certified copper sulfate or copper hydroxide formulations applied every 7-10 days in humid weather",
            ],
            "when_to_seek_help": (
                "Seek guidance from agricultural extension officer if lesions rapidly advance up the middle "
                "third of the vine within one week of detection."
            ),
        },
        "reference_sources": [
            "ICAR - National Research Centre for Integrated Pest Management (NCIPM)",
            "TNAU Agritech Portal - Diseases of Tomato: Alternaria Early Blight",
            "FAO Crop Protection Compendium - Alternaria solani",
        ],
        "last_reviewed": "2026-10-18",
    },
    "Tomato___Late_blight": {
        "scientific_name": "Phytophthora infestans",
        "crop": "Tomato",
        "disease": "Late Blight",
        "is_healthy": False,
        "overview": (
            "Late blight is a catastrophic oomycete disease capable of completely destroying entire fields "
            "within days under cool, wet weather. It affects leaves, stems, and fruits."
        ),
        "symptoms": [
            "Large, irregular water-soaked pale green to dark brown lesions expanding rapidly across foliage",
            "Delicate white cottony fungal-like downy growth visible on lesion undersides during moist mornings",
            "Dark brown to black necrotic lesions girdling petioles and main stems",
            "Firm, greasy, golden-brown to dark sunken rot on green and ripe fruits",
        ],
        "causes": [
            "Windborne sporangia of the oomycete Phytophthora infestans blown from infected potato cull piles or greenhouses",
        ],
        "environmental_conditions": [
            "Cool to moderate temperatures between 15°C and 22°C (60°F–72°F)",
            "Relative humidity consistently exceeding 90%",
            "Prolonged overcast, rainy, misty, or fog conditions",
        ],
        "impact_on_growth": (
            "Rapid whole-plant death within 7 to 10 days of initial infection if conditions remain cool and wet."
        ),
        "early_warning_signs": [
            "Pale water-soaked blotches on upper leaf tips accompanied by white mold beneath during morning hours",
        ],
        "severity_explanation": "Extremely high severity. Late blight is considered an agricultural emergency requiring immediate community response.",
        "prevention": [
            "Eliminate all volunteer tomato and potato plants and potato cull piles near fields",
            "Plant late blight-resistant cultivars (e.g., Mountain Magic, Defiant, Plum Regal)",
            "Monitor regional late blight forecasting warnings and disease alerts closely",
            "Ensure wide row spacing and good air circulation to accelerate leaf drying",
        ],
        "sanitation": [
            "Immediately remove and bag severely infected plants in plastic before removing from field to prevent spore release",
            "Do not discard infected vine residues on field borders; bury deeply under at least 50 cm of soil",
        ],
        "treatment": {
            "general_approaches": [
                "Late blight cannot be cured once systemic; management focuses on preventive protection of uninfected tissue",
                "Coordinate regional spray schedules with neighboring farms to prevent airborne spore movement",
            ],
            "chemical_guidance": [
                "Preventive applications of Cymoxanil + Mancozeb or Metalaxyl-M + Mancozeb as recommended by local university extension",
                "Mandipropamid or Dimethomorph applied preventively during high-risk cool rainy forecasts",
            ],
            "organic_treatments": [
                "Frequent preventive copper hydroxide or copper octanoate sprays prior to forecasted rain events",
                "Bio-fungicides offer limited control against late blight and should not be relied on under severe pressure",
            ],
            "when_to_seek_help": (
                "Notify district agricultural officer or local Krishi Vigyan Kendra immediately upon confirmation "
                "to trigger community advisory."
            ),
        },
        "reference_sources": [
            "ICAR - Central Potato Research Institute (CPRI) / IIVR Late Blight Protocols",
            "TNAU Agritech Portal - Tomato Late Blight Management",
            "USABlight / Cornell University Late Blight Decision Support System",
        ],
        "last_reviewed": "2026-10-20",
    },
    "Tomato___Leaf_Mold": {
        "scientific_name": "Passalora fulva (syn. Cladosporium fulvum)",
        "crop": "Tomato",
        "disease": "Leaf Mold",
        "is_healthy": False,
        "overview": (
            "Leaf mold is a foliar fungal disease prevalent in high tunnels, polyhouses, and sheltered fields "
            "with dense canopies and poor air circulation."
        ),
        "symptoms": [
            "Pale yellowish-green blotches on upper leaf surfaces with indistinct borders",
            "Dense, velvety olive-green to grayish-brown fungal sporulation on the underside of corresponding leaf lesions",
            "Infected leaves curl, wither, and prematurely drop, beginning with the lower canopy",
        ],
        "causes": [
            "Fungal pathogen surviving as conidia or sclerotia on crop residues and greenhouse structures",
        ],
        "environmental_conditions": [
            "Warm temperatures between 21°C and 24°C (70°F–75°F)",
            "High relative humidity (> 85%) inside dense plant canopy or greenhouse",
        ],
        "impact_on_growth": (
            "Extensive foliage loss reduces photosynthetic yield, leading to undersized fruit and reduced harvest intervals."
        ),
        "early_warning_signs": [
            "Faint chlorotic spots on upper surfaces of oldest leaves with velvety olive fuzz underneath",
        ],
        "severity_explanation": "Moderate severity; destructive primarily in protected cultivation and crowded humid open fields.",
        "prevention": [
            "Select tomato varieties possessing Cf resistance genes",
            "Maximize ventilation in polyhouses using side roll-up curtains and exhaust fans",
            "Prune sucker growth and lower foliage to promote continuous airflow",
        ],
        "sanitation": [
            "Disinfect greenhouse structural poles, strings, and ground covers between crop cycles",
            "Remove and compost or destroy all lower leaves showing initial olive mold growth",
        ],
        "treatment": {
            "general_approaches": [
                "Reduce relative humidity below 80% through pruning, ventilation, and drip irrigation",
            ],
            "chemical_guidance": [
                "Chlorothalonil or copper formulations applied preventively when humidity remains elevated",
            ],
            "organic_treatments": [
                "Foliar sprays of potassium bicarbonate (e.g., MilStop) or neem oil formulations",
                "Bacillus subtilis biological sprays applied weekly",
            ],
            "when_to_seek_help": "Consult extension agent if leaf mold persists across more than 30% of polyhouse foliage.",
        },
        "reference_sources": [
            "TNAU Agritech Portal - Tomato Diseases",
            "Penn State Extension - Tomato Leaf Mold in High Tunnels",
        ],
        "last_reviewed": "2026-10-10",
    },
    "Tomato___Septoria_leaf_spot": {
        "scientific_name": "Septoria lycopersici",
        "crop": "Tomato",
        "disease": "Septoria Leaf Spot",
        "is_healthy": False,
        "overview": (
            "Septoria leaf spot is one of the most common foliar diseases of tomatoes in humid regions. "
            "Unlike early blight, it produces smaller, more numerous circular spots with dark borders and gray centers."
        ),
        "symptoms": [
            "Numerous small (2–5 mm) circular spots with dark brown margins and sunken ash-gray centers",
            "Tiny black pinpoint specks (pycnidia fruiting bodies) visible in the center of mature lesions under magnification",
            "Progressive yellowing and browning of affected leaves leading to early canopy defoliation",
        ],
        "causes": ["Septoria fungus overwintering on infested solanaceous weed hosts and crop residues."],
        "environmental_conditions": [
            "Temperatures between 20°C and 26°C (68°F–78°F)",
            "Wet conditions caused by frequent rain, morning dew, or sprinkler irrigation",
        ],
        "impact_on_growth": (
            "Causes severe lower leaf loss which weakens the plant and exposes developing fruits to sunscald."
        ),
        "early_warning_signs": [
            "Dozens of small circular spots with distinct gray centers on the lowest mature leaves.",
        ],
        "severity_explanation": "Moderate to high severity; causes heavy defoliation but rarely infects fruit directly.",
        "prevention": [
            "Rotate crops with non-solanaceous crops for at least 2 years",
            "Control solanaceous weeds (such as black nightshade and horsenettle) around field perimeters",
            "Use drip irrigation and maintain organic or plastic mulch",
        ],
        "sanitation": [
            "Remove and destroy infected bottom leaves during routine suckering",
            "Plow under or clear all vine residues after harvest",
        ],
        "treatment": {
            "general_approaches": ["Keep foliage dry and prune lower branches to 45 cm above ground level."],
            "chemical_guidance": [
                "Mancozeb 75% WP or Chlorothalonil protectant sprays at 7 to 10-day intervals in rainy weather",
            ],
            "organic_treatments": [
                "Copper octanoate or fixed copper bactericide/fungicide formulations",
                "Neem extract (Azadirachtin 1500 ppm) foliar spray",
            ],
            "when_to_seek_help": "Seek local extension advice if defoliation reaches middle canopy before fruit ripening.",
        },
        "reference_sources": [
            "ICAR - IIVR Vegetable Pathology Reports",
            "TNAU Agritech Portal - Tomato Septoria Leaf Spot",
            "University of Minnesota Extension - Septoria Leaf Spot of Tomato",
        ],
        "last_reviewed": "2026-10-12",
    },
    "Tomato___Spider_mites_Two-spotted_spider_mite": {
        "scientific_name": "Tetranychus urticae",
        "crop": "Tomato",
        "disease": "Two-Spotted Spider Mite Infestation",
        "is_healthy": False,
        "overview": (
            "Two-spotted spider mites are tiny arachnid pests that pierce plant cells on leaf undersides, "
            "causing yellow stippling and producing delicate silk webbing."
        ),
        "symptoms": [
            "Fine yellow or white stippling (speckling) on the upper surface of foliage",
            "Silken webbing draped over leaves, growing tips, and flower clusters",
            "Leaves turning bronze, drying out, and taking on a burnt appearance",
            "Clusters of microscopic moving mites (yellow-green with two dark spots) on leaf undersides",
        ],
        "causes": ["Rapid population buildup of Tetranychus urticae under dry, hot, dusty weather conditions."],
        "environmental_conditions": [
            "Hot, dry weather exceeding 30°C (86°F)",
            "Drought-stressed plants and dusty road margins",
        ],
        "impact_on_growth": (
            "Depletes chlorophyll, stunts vine vigor, triggers flower drop, and can kill entire plants under severe infestation."
        ),
        "early_warning_signs": [
            "Yellow speckling on individual leaves near dusty plot edges; fine webbing under leaf petioles.",
        ],
        "severity_explanation": "Moderate to severe; populations explode exponentially within days in dry heat.",
        "prevention": [
            "Maintain adequate crop irrigation to avoid moisture stress",
            "Wet unpaved roadways around fields to suppress dust drift",
            "Conserve natural predators such as predatory mites (Phytoseiulus persimilis) and ladybird beetles",
        ],
        "sanitation": [
            "Remove and bag heavily webbed plant clusters immediately to prevent migration",
            "Clear broadleaf weed borders that serve as overwintering reservoirs",
        ],
        "treatment": {
            "general_approaches": [
                "Wash foliage undersides with high-pressure water spray where practical to dislodge mites and disrupt webs",
            ],
            "chemical_guidance": [
                "Specific acaricides/miticides (e.g., Spiromesifen 22.9% SC or Fenazaquin 10% EC) per official agricultural recommendations, rotating modes of action to prevent resistance",
            ],
            "organic_treatments": [
                "Horticultural soap or 1% neem oil foliar spray ensuring thorough underside coverage",
                "Release of commercial predatory mites (Neoseiulus californicus or Phytoseiulus persimilis)",
            ],
            "when_to_seek_help": "Seek specialist advice if webbing encloses more than 15% of vine tips.",
        },
        "reference_sources": [
            "ICAR - National Bureau of Agricultural Insect Resources (NBAIR)",
            "TNAU Agritech Portal - Pest Management: Tomato Spider Mites",
            "UC IPM - Two-spotted Spider Mite Pest Management Guidelines",
        ],
        "last_reviewed": "2026-10-14",
    },
    "Tomato___Target_Spot": {
        "scientific_name": "Corynespora cassiicola",
        "crop": "Tomato",
        "disease": "Target Spot",
        "is_healthy": False,
        "overview": (
            "Target spot is a fungal disease causing pinpoint brown lesions that expand into circular brown spots "
            "with light brown centers and concentric rings on leaves, stems, and fruits."
        ),
        "symptoms": [
            "Pinpoint brown lesions enlarging into circular spots with light brown centers and dark brown borders",
            "Target-like pattern on foliage resembling early blight, but spots are smaller and distributed throughout canopy",
            "Sunken, circular dark pits with concentric rings on green and ripening tomato fruits",
        ],
        "causes": ["Fungal pathogen surviving on solanaceous crop residues and broadleaf weed hosts."],
        "environmental_conditions": [
            "Warm temperatures between 25°C and 32°C (77°F–90°F)",
            "High relative humidity (> 80%) and extended free moisture on leaves",
        ],
        "impact_on_growth": (
            "Extensive foliar blight and direct fruit spotting reducing marketable yield."
        ),
        "early_warning_signs": ["Small dark brown flecks with pale centers scattered across upper and lower canopy leaves."],
        "severity_explanation": "Moderate to high in warm humid climates.",
        "prevention": [
            "Rotate out of solanaceous crops for 2 to 3 years",
            "Ensure proper plant spacing and eliminate volunteer weeds",
        ],
        "sanitation": [
            "Prune infected foliage and bury crop residue post-harvest",
        ],
        "treatment": {
            "general_approaches": ["Avoid overhead irrigation and maintain open vine architecture."],
            "chemical_guidance": [
                "Fungicides labeled for target spot (e.g., Azoxystrobin + Difenoconazole or Chlorothalonil) per state extension recommendations",
            ],
            "organic_treatments": ["Preventive copper hydroxide applications and Bacillus-based bio-fungicides."],
            "when_to_seek_help": "Consult local KVK if fruit lesions appear on more than 10% of harvestable fruit.",
        },
        "reference_sources": [
            "TNAU Agritech Portal - Tomato Target Spot",
            "UF/IFAS Extension - Target Spot of Tomato",
        ],
        "last_reviewed": "2026-10-08",
    },
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
        "scientific_name": "Tomato yellow leaf curl virus (TYLCV, Begomovirus)",
        "crop": "Tomato",
        "disease": "Yellow Leaf Curl Virus",
        "is_healthy": False,
        "overview": (
            "Tomato Yellow Leaf Curl Virus (TYLCV) is an incurable viral disease transmitted by the sweetpotato whitefly. "
            "It causes severe plant stunting, cupped chlorotic leaves, and total loss of fruit production when infected early."
        ),
        "symptoms": [
            "Upward curling and cupping of leaf margins with puckered texture",
            "Interveinal chlorosis (yellowing) of leaves, particularly on younger growth",
            "Marked stunting of the plant with short internodes, creating a bushy, dwarfed appearance",
            "Heavy flower abortion; plants infected prior to flowering produce zero marketable fruit",
        ],
        "causes": [
            "Transmission exclusively by whitefly vectors (Bemisia tabaci) feeding on plant sap; not seedborne.",
        ],
        "environmental_conditions": [
            "Warm, dry periods favoring massive whitefly vector reproduction (28°C–35°C)",
        ],
        "impact_on_growth": (
            "Incurable once infected. Early-stage infection causes near 100% loss of commercial fruit yield."
        ),
        "early_warning_signs": [
            "Pale yellowing and distinct upward spoon-like curling of the youngest terminal leaves.",
        ],
        "severity_explanation": "Severe. One of the single most damaging tomato viruses worldwide.",
        "prevention": [
            "Plant TYLCV-resistant or tolerant hybrids (e.g., varieties possessing Ty-1, Ty-3 genes)",
            "Use 40 to 50-mesh insect-proof netting in nurseries to protect seedlings from whiteflies",
            "Install yellow sticky traps (15–20 per acre) for early whitefly population monitoring",
            "Apply silver reflective mulches to deter landing whiteflies during early vegetative growth",
        ],
        "sanitation": [
            "Immediately rogue out and destroy virus-symptomatic plants to eliminate vector feeding reservoirs",
            "Eradicate weed hosts such as Datura, Malva, and Parthenium along field borders",
        ],
        "treatment": {
            "general_approaches": [
                "Direct anti-viral cure does not exist; management focuses entirely on suppressing whitefly vectors",
            ],
            "chemical_guidance": [
                "Systemic insecticides (e.g., Imidacloprid 17.8% SL or Thiamethoxam 25% WG) applied per label instructions for whitefly vector control in nursery and transplanting stages",
            ],
            "organic_treatments": [
                "Foliar sprays of 1% neem seed kernel extract (NSKE 5%) or 1500 ppm neem oil to deter whiteflies",
                "Entomopathogenic fungi (Beauveria bassiana or Lecanicillium lecanii) for biological whitefly suppression",
            ],
            "when_to_seek_help": "Contact agricultural department if more than 10% of field exhibits cupped yellow growth.",
        },
        "reference_sources": [
            "ICAR - Indian Institute of Horticultural Research (IIHR) TYLCV Bulletins",
            "TNAU Agritech Portal - Tomato Yellow Leaf Curl Virus Management",
            "FAO Vegetable Pest & Vector Guidelines",
        ],
        "last_reviewed": "2026-10-22",
    },
    "Tomato___Tomato_mosaic_virus": {
        "scientific_name": "Tomato mosaic virus (ToMV, Tobamovirus)",
        "crop": "Tomato",
        "disease": "Tomato Mosaic Virus",
        "is_healthy": False,
        "overview": (
            "Tomato Mosaic Virus is an extremely stable and contagious plant virus that spreads mechanically "
            "through workers' hands, pruning tools, and infected seeds."
        ),
        "symptoms": [
            "Mottling of leaves with alternating light green and dark green mosaic patterns",
            "Blistering, distortion, and 'shoestring' narrowing of leaflets",
            "Internal brown necrotic browning (internal necrosis) of tomato fruits",
            "Stunted plant growth and delayed fruit ripening",
        ],
        "causes": [
            "Tobamovirus transmitted mechanically via workers' hands, tools, clothes, and infected seed coats.",
        ],
        "environmental_conditions": [
            "Persists year-round; virus survives in dried plant debris, seed coats, and unwashed tools for years.",
        ],
        "impact_on_growth": (
            "Reduces plant vigor, causes blossom drop, and severely degrades fruit quality and marketability."
        ),
        "early_warning_signs": ["Mottled light/dark green patchy color on tender top growth leaflets."],
        "severity_explanation": "High severity due to extreme mechanical stability and lack of chemical cure.",
        "prevention": [
            "Use certified virus-free seeds and plant resistant cultivars (with Tm-2 or Tm-2^2 resistance)",
            "Disinfect seed in 10% trisodium phosphate (TSP) or hot water before planting",
            "Wash hands thoroughly with soap or 20% non-fat milk solution before handling tomato vines",
            "Enforce strict no-smoking policies around crops (tobacco products can harbor tobamoviruses)",
        ],
        "sanitation": [
            "Rogue out and destroy infected vines immediately upon confirmation",
            "Dip pruning shears in 20% skim milk or disinfectant between cutting individual plants",
        ],
        "treatment": {
            "general_approaches": [
                "No chemical or biological cure exists for infected plants; prevention and hygiene are paramount.",
            ],
            "chemical_guidance": [
                "No chemical treatment effective against viral particles within plant tissue.",
            ],
            "organic_treatments": [
                "Milk sprays (20% nonfat dry milk in water) during pruning can help deactivate virus on tool surfaces.",
            ],
            "when_to_seek_help": "Report suspected mosaic virus to local extension officer for diagnostic validation.",
        },
        "reference_sources": [
            "TNAU Agritech Portal - Tomato Mosaic Virus (ToMV)",
            "University of California IPM - Tomato Mosaic Virus",
        ],
        "last_reviewed": "2026-10-11",
    },
    "Tomato___healthy": {
        "scientific_name": "Solanum lycopersicum",
        "crop": "Tomato",
        "disease": "Healthy Foliage",
        "is_healthy": True,
        "overview": (
            "The tomato foliage shows vibrant green coloration, intact lamina, and no visible symptoms of "
            "bacterial, fungal, or viral infection. Continue standard agronomic management."
        ),
        "symptoms": [
            "Uniform dark green foliage without spots, chlorosis, or necrotic margins",
            "Smooth, well-developed leaflets with intact vascular venation",
            "Vigorous stem and leaf petiole structure without lesions or girdling",
        ],
        "causes": ["Optimal soil health, balanced fertilization, clean nursery stock, and appropriate climate."],
        "environmental_conditions": [
            "Ideal daytime temperatures of 21°C–29°C with moderate relative humidity and adequate irrigation.",
        ],
        "impact_on_growth": "Optimal photosynthetic capacity supporting vigorous flowering and high-yield fruit development.",
        "early_warning_signs": ["Routine weekly scouting of lower canopy leaves for any initial water-soaking or spots."],
        "severity_explanation": "Healthy crop foliage. No disease detected.",
        "prevention": [
            "Maintain scheduled balanced NPK fertilization avoiding excessive vegetative nitrogen",
            "Maintain consistent drip irrigation to avoid blossom-end rot",
            "Keep baseline preventative monitoring schedule active",
        ],
        "sanitation": [
            "Continue standard suckering and sanitize pruning tools between rows",
            "Keep field borders free from weeds that host common vectors",
        ],
        "treatment": {
            "general_approaches": ["No curative interventions needed. Continue balanced agronomic care."],
            "chemical_guidance": ["No chemical fungicides or bactericides required at this stage."],
            "organic_treatments": ["Apply preventive compost tea or beneficial soil microbes to sustain root health."],
            "when_to_seek_help": "Re-scan leaf samples if novel spotting, wilting, or yellowing appears.",
        },
        "reference_sources": [
            "ICAR - IIVR Good Agricultural Practices (GAP) for Tomato",
            "TNAU Agritech Portal - Production Technologies of Tomato",
        ],
        "last_reviewed": "2026-10-24",
    },

    # ---------------- Potato (3 classes) ----------------
    "Potato___Early_blight": {
        "scientific_name": "Alternaria solani",
        "crop": "Potato",
        "disease": "Early Blight",
        "is_healthy": False,
        "overview": (
            "Early blight of potato is a common fungal disease causing concentric ring spots on older foliage, "
            "leading to premature vine death and dark, sunken dry rot lesions on tubers."
        ),
        "symptoms": [
            "Dark brown circular or angular lesions with distinct concentric target-like rings on lower leaves",
            "Yellow halo surrounding enlarging spots leading to leaf senescence",
            "Dark, sunken, irregular circular lesions on potato tubers with underlying dry, corky rot",
        ],
        "causes": ["Alternaria solani fungus surviving in infected crop debris, volunteer potatoes, or seed tubers."],
        "environmental_conditions": [
            "Warm temperatures (24°C–30°C) alternating with wet and dry periods",
            "Extended canopy wetness from dew, rain, or sprinkler irrigation",
        ],
        "impact_on_growth": (
            "Causes early foliage dieback, shortening the tuber bulking period and reducing overall harvest tonnage."
        ),
        "early_warning_signs": ["Small brown spots on the oldest lower leaves appearing 45–60 days after emergence."],
        "severity_explanation": "Moderate to high severity depending on crop maturity; most damaging during tuber bulking.",
        "prevention": [
            "Use certified disease-free seed tubers",
            "Rotate with non-solanaceous crops (cereals, legumes) for at least 3 years",
            "Maintain balanced nitrogen and potassium fertility to avoid premature vine senescence",
        ],
        "sanitation": [
            "Kill potato vines (haulm destruction) 10–14 days before harvest to allow skins to mature and avoid tuber infection",
            "Destroy cull piles and bury crop residues after harvest",
        ],
        "treatment": {
            "general_approaches": ["Scout lower canopy weekly; apply preventive fungicides at canopy closure."],
            "chemical_guidance": [
                "Protectant fungicides such as Mancozeb 75% WP @ 2-2.5 kg/ha or Chlorothalonil per state agricultural recommendations",
            ],
            "organic_treatments": [
                "Trichoderma harzianum or Bacillus subtilis foliar sprays",
                "Copper hydroxide preventive applications prior to rainy periods",
            ],
            "when_to_seek_help": "Seek extension help if blight expands past 25% of canopy during bulking stage.",
        },
        "reference_sources": [
            "ICAR - Central Potato Research Institute (CPRI) Disease Bulletins",
            "TNAU Agritech Portal - Potato Early Blight Management",
        ],
        "last_reviewed": "2026-10-15",
    },
    "Potato___Late_blight": {
        "scientific_name": "Phytophthora infestans",
        "crop": "Potato",
        "disease": "Late Blight",
        "is_healthy": False,
        "overview": (
            "Late blight of potato is the historic pathogen responsible for the Irish Potato Famine. "
            "It is an aggressive oomycete that destroys leaves, stems, and causes reddish-brown dry rot in tubers."
        ),
        "symptoms": [
            "Large, water-soaked, dark brown to purplish-black lesions on leaves and stems",
            "White fungal-like sporulation visible on the underside of leaf lesions in humid morning hours",
            "Rapid collapse and browning of entire vine canopy emitting a characteristic pungent odor",
            "Sub-surface granular reddish-brown dry rot extending into harvested tubers",
        ],
        "causes": ["Phytophthora infestans sporangia dispersed over miles by wind and splashed by rain."],
        "environmental_conditions": [
            "Cool to moderate temperatures (12°C–20°C)",
            "High humidity (> 90%) and frequent rainfall, drizzle, or heavy morning fog",
        ],
        "impact_on_growth": (
            "Can completely destroy vigorous potato canopies in 5 to 7 days, halting tuber formation and rotting stored crop."
        ),
        "early_warning_signs": ["Dark water-soaked blotches on leaf tips and leaf margins with white downy mold underneath."],
        "severity_explanation": "Extremely high severity. High-priority regional disease requiring prompt intervention.",
        "prevention": [
            "Plant only certified disease-free seed tubers with documented late blight resistance",
            "Destroy all potato cull piles and volunteer potato sprouts before the season begins",
            "Ensure proper ridging/hilling with ample soil cover over tubers to prevent washed-down sporangia from reaching tubers",
        ],
        "sanitation": [
            "Destroy haulms (vines) completely with chemical defoliants or sickle 10-14 days before harvest if late blight is active",
            "Never store tubers harvested from fields with active late blight without thorough drying and curing",
        ],
        "treatment": {
            "general_approaches": ["Follow regional late blight forecasting warnings and maintain proactive preventive coverage."],
            "chemical_guidance": [
                "Preventive Mancozeb 75% WP @ 2.5 kg/ha applied before weather favorable for blight sets in",
                "Curative/translaminar combinations (e.g., Metalaxyl + Mancozeb or Cymoxanil + Mancozeb) applied upon initial disease detection per official extension advisory",
            ],
            "organic_treatments": [
                "Bordeaux mixture (1%) or Copper Oxychloride 50% WP applied preventively",
            ],
            "when_to_seek_help": "Report late blight sightings to nearest KVK or district potato specialist immediately.",
        },
        "reference_sources": [
            "ICAR - CPRI Shimla Late Blight Forecasting and Management Guide",
            "TNAU Agritech Portal - Potato Late Blight",
            "International Potato Center (CIP) Late Blight Manual",
        ],
        "last_reviewed": "2026-10-21",
    },
    "Potato___healthy": {
        "scientific_name": "Solanum tuberosum",
        "crop": "Potato",
        "disease": "Healthy Foliage",
        "is_healthy": True,
        "overview": (
            "The potato plant demonstrates healthy vegetative growth with intact leaflets and no visible signs "
            "of early blight, late blight, or viral mosaics."
        ),
        "symptoms": [
            "Lush, deep green composite leaves without spotting, necrosis, or curling",
            "Sturdy erect stems with healthy branching and normal leaf angle",
            "Active photosynthesis supporting continuous tuber bulking below ground",
        ],
        "causes": ["Certified clean seed tubers, disease-free soil, balanced crop nutrition, and adequate soil moisture."],
        "environmental_conditions": [
            "Cool nights (15°C–18°C) and moderate sunny days ideal for potato tuberization.",
        ],
        "impact_on_growth": "Optimum foliage health translates into maximum dry matter accumulation in developing tubers.",
        "early_warning_signs": ["Scout fields twice weekly during overcast, humid periods for leaf-tip water-soaking."],
        "severity_explanation": "Healthy crop. No disease detected.",
        "prevention": [
            "Maintain timely earthing-up (hilling) to shield developing tubers from sunlight and airborne pathogens",
            "Schedule balanced irrigation, keeping soil consistently moist but never waterlogged",
            "Monitor regional weather alerts for sudden late blight warnings",
        ],
        "sanitation": [
            "Keep field borders clear of volunteer solanaceous weeds",
            "Ensure tractors and cultivators do not introduce soil from infected fields",
        ],
        "treatment": {
            "general_approaches": ["Continue standard potato crop management without curative fungicides."],
            "chemical_guidance": ["No chemical treatment required."],
            "organic_treatments": ["Apply preventive Trichoderma bio-agent drench to sustain soil rhizome health."],
            "when_to_seek_help": "Submit new scan if leaf spotting or sudden vine wilting occurs.",
        },
        "reference_sources": [
            "ICAR - Central Potato Research Institute (CPRI) Good Practices",
            "TNAU Agritech Portal - Potato Agronomy",
        ],
        "last_reviewed": "2026-10-24",
    },

    # ---------------- Pepper / Bell Pepper (2 classes) ----------------
    "Pepper__bell___Bacterial_spot": {
        "scientific_name": "Xanthomonas euvesicatoria / Xanthomonas campestris pv. vesicatoria",
        "crop": "Bell Pepper",
        "disease": "Bacterial Spot",
        "is_healthy": False,
        "overview": (
            "Bacterial spot is the most significant disease of bell peppers in warm, wet climates. "
            "It causes severe leaf spotting, premature defoliation, and rough scab-like lesions on fruits."
        ),
        "symptoms": [
            "Small, circular to irregular water-soaked spots on foliage turning dark brown with pale centers",
            "Raised, scab-like, blistered wart-like lesions on maturing pepper pods",
            "Severe leaf drop leaving developing bell peppers exposed to solar heat injury (sunscald)",
        ],
        "causes": ["Seedborne Xanthomonas bacteria spread through wind-blown rain and mechanical handling."],
        "environmental_conditions": [
            "Warm temperatures between 24°C and 30°C",
            "High relative humidity (> 85%) and frequent rainfall or overhead irrigation",
        ],
        "impact_on_growth": (
            "Causes heavy defoliation, flower drop, and unmarketable blemished fruit."
        ),
        "early_warning_signs": ["Small water-soaked blisters on leaf undersides following heavy rain or overhead sprinkling."],
        "severity_explanation": "Moderate to high severity; can lead to total crop loss during hot, rainy spells.",
        "prevention": [
            "Plant only certified disease-free seed or resistant bell pepper cultivars (races 1–5 resistant)",
            "Adopt drip irrigation; avoid touching wet foliage",
            "Practice a 2 to 3-year crop rotation with non-solanaceous crops",
        ],
        "sanitation": [
            "Disinfect stakes, trays, and harvest buckets regularly",
            "Bury or clear crop residues immediately after harvest",
        ],
        "treatment": {
            "general_approaches": ["Keep foliage dry; manage plant density to foster rapid canopy drying."],
            "chemical_guidance": [
                "Copper-based bactericides (e.g., Copper Hydroxide) combined with Mancozeb applied preventively per university extension rates",
            ],
            "organic_treatments": [
                "Preventive Bacillus subtilis or Bacillus amyloliquefaciens microbial sprays",
                "Copper octanoate (copper soap) sprays at first sign of disease",
            ],
            "when_to_seek_help": "Seek extension help if bacterial spots appear on more than 15% of pepper fruits.",
        },
        "reference_sources": [
            "ICAR - IIHR Bell Pepper Pathology Guidelines",
            "TNAU Agritech Portal - Diseases of Chilli and Bell Pepper",
            "University of Florida IFAS - Bacterial Spot of Pepper",
        ],
        "last_reviewed": "2026-10-16",
    },
    "Pepper__bell___healthy": {
        "scientific_name": "Capsicum annuum",
        "crop": "Bell Pepper",
        "disease": "Healthy Foliage",
        "is_healthy": True,
        "overview": (
            "The bell pepper plant exhibits vibrant green foliage, strong canopy structure, "
            "and absence of bacterial spotting, viral mosaics, or anthracnose."
        ),
        "symptoms": [
            "Uniform glossy green leaves with smooth margins and no chlorosis or necrosis",
            "Erect, sturdy branching with intact flower buds and healthy fruit set",
        ],
        "causes": ["Good seed source, balanced fertilization, optimal soil pH, and controlled moisture."],
        "environmental_conditions": [
            "Temperatures between 20°C and 28°C with moderate humidity and full sunlight.",
        ],
        "impact_on_growth": "Vigorous vegetative and reproductive growth producing firm, thick-walled, marketable peppers.",
        "early_warning_signs": ["Inspect leaf undersides weekly for tiny water-soaked specks after rain."],
        "severity_explanation": "Healthy crop. No disease detected.",
        "prevention": [
            "Maintain drip irrigation and apply organic mulch to maintain uniform soil moisture",
            "Provide balanced nitrogen and calcium to prevent blossom-end rot",
        ],
        "sanitation": ["Sanitize harvesting tools and keep field perimeter clear of solanaceous weeds."],
        "treatment": {
            "general_approaches": ["Continue standard agronomic practices; no pesticide application required."],
            "chemical_guidance": ["No chemical treatment needed."],
            "organic_treatments": ["Apply preventive seaweed extract or micronutrient foliar spray."],
            "when_to_seek_help": "Re-scan if spotting or premature leaf drop develops.",
        },
        "reference_sources": [
            "TNAU Agritech Portal - Bell Pepper Production Guide",
            "ICAR - Good Agricultural Practices for Capsicum",
        ],
        "last_reviewed": "2026-10-24",
    },

    # ---------------- Corn / Maize (4 classes) ----------------
    "Corn_(maize)___Cercospora_leaf_spot_Gray_leaf_spot": {
        "scientific_name": "Cercospora zeae-maydis",
        "crop": "Corn (Maize)",
        "disease": "Gray Leaf Spot",
        "is_healthy": False,
        "overview": (
            "Gray leaf spot is a prevalent fungal disease of maize that creates distinct rectangular lesions "
            "bounded by the leaf veins, causing extensive loss of photosynthetic leaf area."
        ),
        "symptoms": [
            "Rectangular, blocky, tan to gray lesions with distinct parallel edges defined by leaf veins",
            "Lesions measuring 2 to 7 cm in length, coalescing to blighted broad sections of the leaf",
            "Premature drying and death of the upper canopy leaves including the critical ear leaf",
        ],
        "causes": ["Cercospora zeae-maydis fungus overwintering on surface maize residue under reduced tillage."],
        "environmental_conditions": [
            "Warm, humid conditions (25°C–32°C)",
            "Extended dew periods (> 11 hours) or persistent cloud cover and humidity > 90%",
        ],
        "impact_on_growth": (
            "Severe loss of ear leaf area reduces grain fill, causing premature stalk lodging and yield drops of up to 40%."
        ),
        "early_warning_signs": ["Small tan rectangular spots with yellow halos on lower leaves prior to tasseling."],
        "severity_explanation": "High severity when disease reaches the ear leaf prior to soft dough stage.",
        "prevention": [
            "Plant maize hybrids with proven genetic resistance or tolerance to gray leaf spot",
            "Rotate out of corn for at least 1–2 years to allow surface crop debris to decompose",
            "Perform clean tillage where soil conservation practices permit to bury infected residue",
        ],
        "sanitation": ["Shred and incorporate maize stalks into soil post-harvest to accelerate fungal decay."],
        "treatment": {
            "general_approaches": ["Scout lower leaves before tasseling; assess hybrid susceptibility."],
            "chemical_guidance": [
                "Strobilurin and triazole fungicides (e.g., Azoxystrobin, Pyraclostrobin, or Propiconazole) applied between tasseling (VT) and silking (R1) according to university extension guidelines",
            ],
            "organic_treatments": [
                "Bio-fungicides offer limited efficacy on large-scale field corn; focus on crop rotation and resistant genetics.",
            ],
            "when_to_seek_help": "Consult agricultural extension specialist if lesions reach the leaf below the ear before pollination.",
        },
        "reference_sources": [
            "ICAR - Indian Institute of Maize Research (IIMR) Disease Bulletins",
            "TNAU Agritech Portal - Maize Diseases: Gray Leaf Spot",
            "Purdue Extension - Gray Leaf Spot of Corn",
        ],
        "last_reviewed": "2026-10-18",
    },
    "Corn_(maize)___Common_rust_": {
        "scientific_name": "Puccinia sorghi",
        "crop": "Corn (Maize)",
        "disease": "Common Rust",
        "is_healthy": False,
        "overview": (
            "Common rust is a widespread fungal disease of sweet and field corn characterized by prominent "
            "cinnamon-brown powdery pustules on both upper and lower leaf surfaces."
        ),
        "symptoms": [
            "Oval to elongate cinnamon-brown to golden pustules (uredinia) scattered across both leaf surfaces",
            "Pustules rupture the leaf epidermis, releasing powdery reddish-brown spores that smudge on fingers",
            "Pustules turning dark brownish-black late in the season as resting spores (teliospores) form",
        ],
        "causes": ["Airborne urediniospores of Puccinia sorghi blown northward by seasonal winds from southern regions."],
        "environmental_conditions": [
            "Cool to moderate temperatures (16°C–25°C)",
            "High relative humidity (> 95%) and extended evening dew (> 6 hours)",
        ],
        "impact_on_growth": (
            "Ruptures leaf epidermis, increasing plant water loss, reducing photosynthesis, and reducing ear size in severe cases."
        ),
        "early_warning_signs": ["Isolated golden-brown powdery dots scattered randomly on whorl leaves in early summer."],
        "severity_explanation": "Moderate severity on field corn; potentially severe on susceptible sweet corn or late-planted fields.",
        "prevention": [
            "Plant corn hybrids possessing single-gene (Rp) or general polygenic resistance to common rust",
            "Plant early in the season to avoid late-summer spore arrival during sensitive grain-fill stages",
        ],
        "sanitation": ["Spores do not overwinter locally on crop residue; sanitation of stalks has minimal effect."],
        "treatment": {
            "general_approaches": ["Monitor sweet corn closely from 6-leaf stage; field corn rarely requires spraying unless susceptible."],
            "chemical_guidance": [
                "Triazole or strobilurin fungicides (e.g., Propiconazole 25% EC or Azoxystrobin) if pustules cover > 5% of leaf area before silking on susceptible hybrids",
            ],
            "organic_treatments": [
                "Wettable sulfur formulations applied at early onset according to label rates",
            ],
            "when_to_seek_help": "Seek extension advice if pustules become dense across upper canopy prior to ear silking.",
        },
        "reference_sources": [
            "ICAR - IIMR Maize Rust Advisory",
            "TNAU Agritech Portal - Common Rust of Maize",
            "Iowa State University Extension - Common Rust of Corn",
        ],
        "last_reviewed": "2026-10-12",
    },
    "Corn_(maize)___Northern_Leaf_Blight": {
        "scientific_name": "Exserohilum turcicum (syn. Helminthosporium turcicum)",
        "crop": "Corn (Maize)",
        "disease": "Northern Leaf Blight",
        "is_healthy": False,
        "overview": (
            "Northern corn leaf blight is an economically severe foliar disease producing large, cigar-shaped "
            "grayish-green or tan lesions that can cause dramatic yield reductions when infecting before silking."
        ),
        "symptoms": [
            "Large, elongated, elliptical or cigar-shaped lesions (2.5–15 cm long) with rounded ends",
            "Lesions initially grayish-green, turning tan to brown as leaf tissue dies",
            "Dark, olive-gray fuzzy fungal spores developing across lesions in damp, humid weather",
            "Coalescing lesions causing complete blighting and parched appearance of entire leaves",
        ],
        "causes": ["Exserohilum turcicum fungus overwintering on corn residue and spreading by wind and rain splash."],
        "environmental_conditions": [
            "Moderate temperatures (18°C–27°C)",
            "Extended periods of leaf wetness (6–18 hours) from frequent rains or heavy dews",
        ],
        "impact_on_growth": (
            "Extensive canopy destruction prematurely dries out plants, severely curtails ear fill, and predisposes stalks to rot."
        ),
        "early_warning_signs": ["Long grayish-green elliptical water-soaked streaks on lower foliage before flowering."],
        "severity_explanation": "High severity. Yield losses can exceed 30–50% if disease reaches the ear leaf prior to silking.",
        "prevention": [
            "Select resistant hybrids containing Ht resistance genes (Ht1, Ht2, Ht3, or HtN)",
            "Rotate crops for at least 1 to 2 years with soybeans, wheat, or legumes",
            "Incorporate crop residue into the soil to accelerate decomposition",
        ],
        "sanitation": ["Plow under crop stubble after harvest to eliminate fungal overwintering structures."],
        "treatment": {
            "general_approaches": ["Scout fields around tasseling; evaluate hybrid resistance ratings."],
            "chemical_guidance": [
                "Fungicides (e.g., Mancozeb 75% WP @ 2 kg/ha or Azoxystrobin + Difenoconazole) applied at first sign of disease between VT and R1 stages",
            ],
            "organic_treatments": [
                "Trichoderma viride foliar treatments have demonstrated partial preventive efficacy in academic field trials.",
            ],
            "when_to_seek_help": "Consult local extension specialist if lesions appear on or above the ear leaf before pollination.",
        },
        "reference_sources": [
            "ICAR - IIMR Northern Corn Leaf Blight Recommendations",
            "TNAU Agritech Portal - Maize Northern Leaf Blight",
            "Ohio State Extension - Northern Corn Leaf Blight Management",
        ],
        "last_reviewed": "2026-10-19",
    },
    "Corn_(maize)___healthy": {
        "scientific_name": "Zea mays",
        "crop": "Corn (Maize)",
        "disease": "Healthy Foliage",
        "is_healthy": True,
        "overview": (
            "The corn foliage is unblemished, showcasing broad deep-green leaf blades with robust vascular structure "
            "and no evidence of leaf spots, rust pustules, or blights."
        ),
        "symptoms": [
            "Uniform deep green arching leaves without chlorotic striping, pustules, or necrotic lesions",
            "Strong, thick central stalk with well-developed brace roots",
            "Normal tassel and silk emergence supporting comprehensive pollination",
        ],
        "causes": ["Healthy seed genetics, proper plant spacing, balanced soil nitrogen/potassium, and adequate rainfall."],
        "environmental_conditions": [
            "Warm sunny weather (24°C–32°C) with regular moisture during critical vegetative and silking stages.",
        ],
        "impact_on_growth": "Maximal photosynthetic efficiency ensuring optimal ear size, kernel count, and test weight.",
        "early_warning_signs": ["Examine lower leaves twice a week during damp, overcast weather for initial spots."],
        "severity_explanation": "Healthy crop. No disease detected.",
        "prevention": [
            "Maintain split nitrogen fertilizer applications aligned with crop uptake stages",
            "Ensure weed-free conditions during early critical growth period (V3–V8)",
        ],
        "sanitation": ["Keep farm machinery clean when moving between different agricultural plots."],
        "treatment": {
            "general_approaches": ["No curative sprays needed; maintain normal cultural and fertility management."],
            "chemical_guidance": ["No chemical treatment required."],
            "organic_treatments": ["Apply zinc or seaweed foliar sprays if micronutrient boost is desired."],
            "when_to_seek_help": "Re-scan if abnormal leaf streaks, pustules, or wilting appear.",
        },
        "reference_sources": [
            "ICAR - IIMR Good Agronomic Practices for Maize",
            "TNAU Agritech Portal - Maize Production Technology",
        ],
        "last_reviewed": "2026-10-24",
    },
}

# Multilingual Translations for Section Headers & Key Agricultural Terms
TRANSLATIONS: dict[str, dict[str, str]] = {
    "hi": {
        "healthy_foliage": "स्वस्थ पत्तियां (कोई रोग नहीं)",
        "disease_overview": "रोग का संक्षिप्त विवरण",
        "common_symptoms": "प्रमुख लक्षण",
        "possible_causes": "संभावित कारण",
        "environmental_conditions": "अनुकूल पर्यावरणीय परिस्थितियां",
        "impact_on_growth": "फसल वृद्धि और उपज पर प्रभाव",
        "early_warning_signs": "प्रारंभिक चेतावनी संकेत",
        "severity_explanation": "रोग की गंभीरता का विश्लेषण",
        "prevention_practices": "निवारक उपाय",
        "sanitation_practices": "स्वच्छता और कृषि प्रबंधन",
        "treatment_guidance": "उपचार और प्रबंधन मार्गदर्शन",
        "general_approaches": "सामान्य कृषि दृष्टिकोण",
        "chemical_guidance": "रासायनिक मार्गदर्शन (अनुशंसित मानक)",
        "organic_treatments": "जैविक और प्राकृतिक उपचार",
        "when_to_seek_help": "कृषि विशेषज्ञ से कब संपर्क करें",
        "reference_sources": "सत्यापित संदर्भ स्रोत",
        "disclaimer": "सूचनात्मक अस्वीकरण: यह रिपोर्ट केवल कृषि मार्गदर्शन के लिए है। किसी भी रासायनिक छिड़काव से पहले अपने नजदीकी कृषि विज्ञान केंद्र (KVK) या विशेषज्ञ से सलाह लें।",
    },
    "as": {
        "healthy_foliage": "স্বাস্থ্যকৰ পাত (কোনো ৰোগ নাই)",
        "disease_overview": "ৰোগৰ চমু বিৱৰণ",
        "common_symptoms": "প্ৰধান লক্ষণসমূহ",
        "possible_causes": "সম্ভাৱ্য কাৰণসমূহ",
        "environmental_conditions": "অনুকূল পৰিৱেশীয় অৱস্থা",
        "impact_on_growth": "শস্যৰ বিকাশ আৰু উৎপাদনৰ ওপৰত প্ৰভাৱ",
        "early_warning_signs": "প্ৰাৰম্ভিক সতৰ্কতাৰ লক্ষণ",
        "severity_explanation": "ৰোগৰ জটিলতাৰ বিশ্লেষণ",
        "prevention_practices": "প্ৰতিৰোধমূলক ব্যৱস্থা",
        "sanitation_practices": "পৰিষ্কাৰ-পৰিচ্ছন্নতা আৰু পথাৰ পৰিচালনা",
        "treatment_guidance": "উপচাৰ আৰু পৰিচালনা নিৰ্দেশনা",
        "general_approaches": "সাধাৰণ কৃষি দৃষ্টিভংগী",
        "chemical_guidance": "ৰাসায়নিক নিৰ্দেশনা (অনুমোদিত মান)",
        "organic_treatments": "জৈৱিক আৰু প্ৰাকৃতিক উপচাৰ",
        "when_to_seek_help": "কৃষি বিশেষজ্ঞৰ সৈতে কেতিয়া যোগাযোগ কৰিব",
        "reference_sources": "প্ৰমাণিত তথ্যসূত্ৰ",
        "disclaimer": "তথ্যমূলক সতৰ্কবাণী: এই প্ৰতিবেদন কেৱল কৃষি পৰামৰ্শৰ বাবে। কোনো ৰাসায়নিক স্প্ৰে' কৰাৰ আগতে ওচৰৰ কৃষি বিজ্ঞান কেন্দ্ৰ (KVK) বা বিশেষজ্ঞৰ পৰামৰ্শ লওক।",
    },
}


def get_disease_knowledge(raw_or_disease_name: str) -> DiseaseKnowledge | None:
    """Finds the verified knowledge base entry by raw class name or standard disease name."""
    # Direct raw class lookup
    if raw_or_disease_name in KNOWLEDGE_BASE_EN:
        return KNOWLEDGE_BASE_EN[raw_or_disease_name]

    # Normalized matching
    clean_target = raw_or_disease_name.lower().replace("_", " ").replace("-", " ")
    for key, data in KNOWLEDGE_BASE_EN.items():
        clean_key = key.lower().replace("_", " ").replace("-", " ")
        clean_disease = data["disease"].lower().replace("-", " ")
        clean_crop = data["crop"].lower()
        if clean_target in clean_key or clean_target in clean_disease or (clean_crop in clean_target and clean_disease in clean_target):
            return data

    return None

