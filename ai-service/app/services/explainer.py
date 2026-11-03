"""AI Disease Analysis and Explanation Service powered by Google Gemini API & Grounded Agricultural Knowledge Base."""

import json
import logging
from datetime import datetime, timezone
from google import genai
from google.genai import types

from app.core.config import get_settings
from app.models.explanation import (
    ExplanationData,
    ExplanationRequest,
    TreatmentGuidanceSchema,
)
from app.services.knowledge_base import (
    get_disease_knowledge,
    KNOWLEDGE_BASE_EN,
    TRANSLATIONS,
    DiseaseKnowledge,
)

logger = logging.getLogger(__name__)
settings = get_settings()


class DiseaseExplainerService:
    """Intelligent disease explanation engine integrating Google Gemini with grounded agronomic knowledge."""

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self.api_key = api_key if api_key is not None else settings.gemini_api_key
        self.model = model if model is not None else settings.gemini_model
        self.client: genai.Client | None = None

        if self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
                logger.info("Gemini Client initialized with model: %s", self.model)
            except Exception as exc:
                logger.warning("Failed to initialize Google GenAI Client: %s", exc)
                self.client = None
        else:
            logger.info("GEMINI_API_KEY not configured. Explainer operating in grounded knowledge-base fallback mode.")

    def explain(self, req: ExplanationRequest) -> ExplanationData:
        """Generates comprehensive disease explanation using Gemini or verified knowledge base fallback."""
        now_iso = datetime.now(timezone.utc).isoformat()
        language = req.language.lower() if req.language in ("en", "hi", "as") else "en"

        # 1. Handle Inconclusive / Low Confidence Predictions Safely
        if req.status == "inconclusive" or req.confidence < 50.0:
            return self._build_inconclusive_explanation(req, language, now_iso)

        # 2. Retrieve Ground Truth Knowledge from verified base
        ground_truth: DiseaseKnowledge | None = get_disease_knowledge(req.disease)
        if not ground_truth:
            # Fallback search by crop name
            ground_truth = get_disease_knowledge(f"{req.crop}___{req.disease}")

        # 3. If Gemini is available, attempt grounded generation
        if self.client and self.api_key:
            try:
                explanation = self._call_gemini_explainer(req, ground_truth, language, now_iso)
                if explanation:
                    return explanation
            except Exception as exc:
                logger.warning(
                    "Gemini API explanation generation failed: %s. Falling back to verified knowledge base.",
                    exc,
                )

        # 4. Reliable Offline / Grounded Fallback
        return self._build_knowledge_base_explanation(req, ground_truth, language, now_iso)

    def _call_gemini_explainer(
        self,
        req: ExplanationRequest,
        ground_truth: DiseaseKnowledge | None,
        language: str,
        now_iso: str,
    ) -> ExplanationData | None:
        """Calls Google GenAI Gemini API with low temperature and structured JSON output."""
        lang_name = "English"
        if language == "hi":
            lang_name = "Hindi (हिन्दी)"
        elif language == "as":
            lang_name = "Assamese (অসমীয়া)"

        system_instruction = (
            "You are KrishiAI Senior Agronomist and Plant Pathologist. "
            "Your mission is to provide accurate, responsible, and farmer-friendly disease explanations. "
            "CRITICAL RULES:\n"
            "1. You MUST accept the provided predicted crop and disease as verified. Do NOT change, override, or alter the classification.\n"
            "2. Ground your response firmly in the provided verified agricultural data. Do not hallucinate symptoms, causes, or pathogens.\n"
            "3. NEVER invent pesticide names, commercial brand formulations, or hazardous chemical dosages.\n"
            "4. Distinguish clearly between general cultural practices, organic biological options, and standard extension chemical principles.\n"
            f"5. Write the explanation entirely in {lang_name}. Keep scientific/botanical Latin names in parentheses.\n"
            "6. You must return valid JSON matching the requested schema."
        )

        user_prompt = f"""
Input Crop Diagnostic Findings:
- Predicted Crop: {req.crop}
- Diagnosed Condition: {req.disease}
- Model Confidence: {req.confidence:.1f}%
- Foliage Status: {'Healthy / Optimal' if req.is_healthy else 'Infected / Symptomatic'}
- Target Language: {lang_name}

Verified Extension Ground Truth Reference:
{json.dumps(ground_truth or {}, indent=2)}

Generate a structured advisory JSON with these exact keys:
{{
  "scientific_name": "Latin binomial name",
  "overview": "2-3 sentences explaining what this condition is in simple farmer terms",
  "symptoms": ["list of 3-4 visible foliar/stem/fruit symptoms"],
  "causes": ["list of 2-3 primary biological or pathogen causes"],
  "environmental_conditions": ["list of 2-3 environmental triggers (temperature, moisture, humidity)"],
  "impact_on_growth": "How this affects crop yield and vine vigor",
  "early_warning_signs": ["1-2 early indicator signs for field scouting"],
  "severity_explanation": "Clear explanation of risk severity based on growth stage",
  "prevention": ["3-4 cultural prevention and crop rotation recommendations"],
  "sanitation": ["2-3 field sanitation, tool hygiene, and residue management actions"],
  "treatment": {{
    "general_approaches": ["2-3 general agronomic management strategies"],
    "chemical_guidance": ["1-2 officially approved chemical principles without fabricated dosages"],
    "organic_treatments": ["1-2 organic, biological, or OMRI/ICAR approved bio-control practices"],
    "when_to_seek_help": "When to consult a local Krishi Vigyan Kendra (KVK) or extension officer"
  }},
  "reference_sources": ["List of authoritative institutions like ICAR, TNAU, or State Agricultural Universities"]
}}
"""

        assert self.client is not None
        response = self.client.models.generate_content(
            model=self.model,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
                max_output_tokens=2048,
                response_mime_type="application/json",
            ),
        )

        if not response or not response.text:
            return None

        data = json.loads(response.text)

        treatment_dict = data.get("treatment", {})
        treatment_schema = TreatmentGuidanceSchema(
            general_approaches=treatment_dict.get("general_approaches", []),
            chemical_guidance=treatment_dict.get("chemical_guidance", []),
            organic_treatments=treatment_dict.get("organic_treatments", []),
            when_to_seek_help=treatment_dict.get("when_to_seek_help", ""),
        )

        return ExplanationData(
            scientific_name=data.get("scientific_name", ground_truth["scientific_name"] if ground_truth else ""),
            overview=data.get("overview", ""),
            symptoms=data.get("symptoms", []),
            causes=data.get("causes", []),
            environmental_conditions=data.get("environmental_conditions", []),
            impact_on_growth=data.get("impact_on_growth", ""),
            early_warning_signs=data.get("early_warning_signs", []),
            severity_explanation=data.get("severity_explanation", ""),
            prevention=data.get("prevention", []),
            sanitation=data.get("sanitation", []),
            treatment=treatment_schema,
            reference_sources=data.get("reference_sources", ground_truth["reference_sources"] if ground_truth else ["ICAR Extension", "TNAU Agritech Portal"]),
            disclaimer=TRANSLATIONS.get(language, {}).get("disclaimer", (
                "Notice: This automated report is for informational agricultural screening only. "
                "Consult your local agricultural extension service or certified agronomist before applying chemical treatments."
            )),
            language=language,
            model_identifier=f"gemini-{self.model}",
            generated_at=now_iso,
        )

    def _build_knowledge_base_explanation(
        self,
        req: ExplanationRequest,
        ground_truth: DiseaseKnowledge | None,
        language: str,
        now_iso: str,
    ) -> ExplanationData:
        """Constructs an explanation directly from the verified institutional knowledge base."""
        if not ground_truth:
            # Fallback for unknown classes
            return ExplanationData(
                scientific_name="",
                overview=f"Diagnostic report for {req.crop} ({req.disease}).",
                symptoms=["Monitor foliage for atypical discoloration or lesions."],
                causes=["Biotic or abiotic agricultural stress."],
                environmental_conditions=["Weather conditions conducive to plant stress."],
                impact_on_growth="May affect vegetative growth and harvest yield if unmonitored.",
                early_warning_signs=["Regular weekly field scouting."],
                severity_explanation="Moderate. Maintain routine monitoring.",
                prevention=["Practice crop rotation and use clean seed."],
                sanitation=["Clear diseased crop residue from field borders."],
                treatment=TreatmentGuidanceSchema(
                    general_approaches=["Maintain balanced irrigation and balanced fertilization."],
                    chemical_guidance=["Consult agricultural extension for registered chemicals."],
                    organic_treatments=["Neem-based formulations or beneficial bio-agents."],
                    when_to_seek_help="Contact local agricultural extension officer for field confirmation.",
                ),
                reference_sources=["ICAR Extension", "State Agricultural University Advisory"],
                disclaimer=TRANSLATIONS.get(language, {}).get("disclaimer", "Notice: For agricultural advisory screening only."),
                language=language,
                model_identifier="krishi-knowledge-base-v1",
                generated_at=now_iso,
            )

        # Build treatment schema from verified data
        gt_treatment = ground_truth["treatment"]
        treatment_schema = TreatmentGuidanceSchema(
            general_approaches=gt_treatment["general_approaches"],
            chemical_guidance=gt_treatment["chemical_guidance"],
            organic_treatments=gt_treatment["organic_treatments"],
            when_to_seek_help=gt_treatment["when_to_seek_help"],
        )

        return ExplanationData(
            scientific_name=ground_truth["scientific_name"],
            overview=ground_truth["overview"],
            symptoms=ground_truth["symptoms"],
            causes=ground_truth["causes"],
            environmental_conditions=ground_truth["environmental_conditions"],
            impact_on_growth=ground_truth["impact_on_growth"],
            early_warning_signs=ground_truth["early_warning_signs"],
            severity_explanation=ground_truth["severity_explanation"],
            prevention=ground_truth["prevention"],
            sanitation=ground_truth["sanitation"],
            treatment=treatment_schema,
            reference_sources=ground_truth["reference_sources"],
            disclaimer=TRANSLATIONS.get(language, {}).get("disclaimer", (
                "Notice: This automated report is for informational agricultural screening only. "
                "Consult your local agricultural extension service or certified agronomist before applying chemical treatments."
            )),
            language=language,
            model_identifier="krishi-knowledge-base-v1",
            generated_at=now_iso,
        )

    def _build_inconclusive_explanation(
        self,
        req: ExplanationRequest,
        language: str,
        now_iso: str,
    ) -> ExplanationData:
        """Safely explains an inconclusive result without generating speculative treatments."""
        disclaimer = TRANSLATIONS.get(language, {}).get("disclaimer", (
            "Notice: Diagnostic screening is inconclusive. Chemical interventions must NOT be applied without a confirmed diagnosis."
        ))

        return ExplanationData(
            scientific_name="Inconclusive Screening",
            overview=(
                f"Diagnostic screening is inconclusive: the AI model evaluated the image with low confidence ({req.confidence:.1f}%). "
                "Because leaf symptoms could not be definitively recognized, generating a specific chemical treatment "
                "is unsafe and not recommended."
            ),
            symptoms=[
                "Symptoms in the photograph could not be distinguished with high confidence.",
                "Possible interference from lighting, camera angle, blur, or complex multi-stress symptoms.",
            ],
            causes=["Uncertain foliar pattern, optical glare, shadow, or out-of-distribution symptom."],
            environmental_conditions=["Varies depending on actual field situation."],
            impact_on_growth="Unknown until an accurate diagnosis is confirmed.",
            early_warning_signs=["Carefully examine neighboring crop leaves in full natural daylight."],
            severity_explanation="Inconclusive. Avoid applying unconfirmed chemical sprays.",
            prevention=[
                "Take a new, clear close-up photograph of symptomatic leaves in natural morning daylight.",
                "Ensure the camera is focused directly on lesion margins without camera shake.",
            ],
            sanitation=[
                "Do not apply broad-spectrum fungicides without confirmed disease identification.",
            ],
            treatment=TreatmentGuidanceSchema(
                general_approaches=[
                    "Re-scan the crop with a clearer, steady photograph in natural daylight.",
                    "Inspect both the upper and lower leaf surfaces for fungal spores, webbing, or bacterial oozing.",
                ],
                chemical_guidance=[
                    "No chemical sprays should be applied without a confirmed diagnosis from an agricultural specialist.",
                ],
                organic_treatments=[
                    "Maintain standard cultural practices; avoid chemical interventions on unverified diagnoses.",
                ],
                when_to_seek_help=(
                    "Bring a physical leaf sample inside a sealed plastic bag to your local Krishi Vigyan Kendra (KVK) "
                    "or block agricultural development officer for visual diagnostic confirmation."
                ),
            ),
            reference_sources=[
                "ICAR - Agricultural Extension Guidelines",
                "Plant Pathology Diagnostic Protocols",
            ],
            disclaimer=disclaimer,
            language=language,
            model_identifier="krishi-safeguard-v1",
            generated_at=now_iso,
        )
