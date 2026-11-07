"""
Agricultural Multilingual AI Assistant Service powered by Google Gemini API & Grounded Agricultural Knowledge.

Phase 12: KrishiAI Multilingual AI Agricultural Assistant.
"""

from __future__ import annotations

import logging
from typing import Any, Literal
from google import genai
from google.genai import types

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

SYSTEM_PROMPT = """You are KrishiAI, a dedicated, knowledgeable, and respectful AI agricultural advisor for Indian farmers.
You assist farmers with:
1. Crop disease diagnosis and verified management practices (biological, cultural, and chemical controls).
2. Soil health, soil testing interpretation, and balanced N-P-K nutrient application.
3. Crop recommendations based on soil types, climate, and agro-ecological zones.
4. Real-time agricultural weather advisory, spray timing windows, and irrigation scheduling.
5. APMC Mandi market rates, price trends, and government Minimum Support Price (MSP) benchmarks.

Strict Agricultural Advisory Rules:
- NEVER fabricate market prices, weather observations, or pesticide names.
- Always recommend consulting local Krishi Vigyan Kendra (KVK) or State Agricultural University (SAU) extension specialists before applying synthetic chemical treatments.
- Always emphasize safety gear (gloves, masks) and adhering to official pesticide label recommendations.
- Keep responses concise, structured, practical, and empathetic.
- Respond in the language requested by the farmer ({language_name}). Use natural, farmer-friendly terms.
"""

LANGUAGE_NAMES: dict[str, str] = {
    "en": "English",
    "hi": "Hindi (हिन्दी)",
    "as": "Assamese (অসমীয়া)",
}

# Domain-specific grounded fallback responses for offline/fallback mode
FALLBACK_RESPONSES: dict[str, dict[str, str]] = {
    "rust": {
        "en": (
            "Yellow stripe rust in wheat is caused by Puccinia striiformis. "
            "Cultural management: Inspect fields regularly, avoid excessive nitrogen, and maintain proper drainage. "
            "Recommended fungicide: Propiconazole 25% EC @ 1 ml/L water (200 ml/acre) applied during calm wind conditions (<8 km/h). "
            "Please verify spray instructions with your local KVK or Agriculture Officer."
        ),
        "hi": (
            "गेहूं में पीला रतुआ (Yellow Rust) पक्सिनिया स्ट्राइफॉर्मिस कवक द्वारा होता है। "
            "बचाव: खेत का नियमित निरीक्षण करें और अत्यधिक यूरिया के प्रयोग से बचें। "
            "उपचार: प्रोपिकोनाजोल 25% ईसी (Tilt) 1 मिली प्रति लीटर पानी (200 मिली प्रति एकड़) का छिड़काव करें। "
            "दवा प्रयोग से पहले अपने स्थानीय कृषि विज्ञान केंद्र (KVK) से सलाह अवश्य लें।"
        ),
        "as": (
            "ঘেঁহুৰ হালধীয়া ৰাষ্ট (Yellow Rust) ভেঁকুৰৰ দ্বাৰা হয়। "
            "প্ৰতিৰোধ: নিয়মিত পথাৰ পৰিদৰ্শন কৰক আৰু অতিৰিক্ত ইউৰিয়া প্ৰয়োগ নকৰিব। "
            "চিকিৎসা: প্ৰপিকোনাজল ২৫% ইচি (Propiconazole 25% EC) প্ৰতি লিটাৰ পানীত ১ মিলি মিহলাই ছটিয়াব পাৰে। "
            "প্ৰয়োগ কৰাৰ আগতে স্থানীয় কৃষি বিজ্ঞান কেন্দ্ৰৰ (KVK) পৰামৰ্শ লওক।"
        ),
    },
    "aphid": {
        "en": (
            "Aphid infestation in mustard causes leaf curling and sticky honeydew. "
            "Organic control: Spray 5% Neem Seed Kernel Extract (NSKE) or Neem oil (3-5 ml/L water) in early stages. "
            "Chemical control: If crossing ETL (10-15% plants affected), spray Dimethoate 30% EC @ 1.5 ml/L. "
            "Always follow label precautions and spray during late afternoon to protect pollinators."
        ),
        "hi": (
            "सरसों में माहू (चेपा/एफिड) पत्तियों का रस चूसकर नुकसान पहुंचाते हैं। "
            "जैविक उपचार: प्रारंभिक अवस्था में नीम का तेल (3-5 मिली प्रति लीटर पानी) का छिड़काव करें। "
            "रासायनिक उपचार: आर्थिक क्षति स्तर (ETL) पार होने पर डाइमेथोएट 30% ईसी @ 1.5 मिली/लीटर का प्रयोग करें। "
            "मधुमक्खियों की सुरक्षा के लिए छिड़काव हमेशा शाम के समय करें।"
        ),
        "as": (
            "সৰিয়হত মোৱা পোকৰ (Aphid) উপদ্ৰৱ নিয়ন্ত্ৰণৰ বাবে: "
            "জৈৱিক উপায়: নিম তেল (৩-৫ মিলি প্ৰতি লিটাৰ পানীত) ছটিয়াব পাৰে। "
            "ৰাসায়নিক উপায়: ডাইমিথ'ৱেট ৩০% ইচি (Dimethoate 30% EC) ১.৫ মিলি প্ৰতি লিটাৰ পানীত মিহলাই ছটিয়াব পাৰে। "
            "মৌ-মাখিৰ সুৰক্ষাৰ বাবে সদায় আবেলি সময়তহে দৰব ছটিয়াব।"
        ),
    },
    "fertilizer": {
        "en": (
            "Balanced fertilizer application depends on soil test values. "
            "For irrigated wheat, typical recommendation is 120:60:40 kg/ha of N:P:K. "
            "Apply entire P and K plus half N at sowing as basal dose; top-dress remaining N in two splits at crown root initiation and tillering stages. "
            "Always consult your Soil Health Card for parcel-specific doses."
        ),
        "hi": (
            "उर्वरक की संतुलित मात्रा मृदा स्वास्थ्य कार्ड (Soil Health Card) के आधार पर ही देनी चाहिए। "
            "सिंचित गेहूं के लिए सामान्यतः 120:60:40 किग्रा/हेक्टेयर (N:P:K) की सिफारिश की जाती है। "
            "बुवाई के समय पूरा फास्फोरस, पोटाश और आधी यूरिया दें। शेष यूरिया पहली और दूसरी सिंचाई पर बराबर भागों में दें।"
        ),
        "as": (
            "সাৰ প্ৰয়োগৰ মাত্ৰা মাটি পৰীক্ষাৰ ভিত্তিত কৰাটো বাঞ্ছনীয়। "
            "ঘেঁহুৰ বাবে সাধাৰণতে ১২০:৬০:৪০ কেজি/হেক্টৰ (N:P:K) প্ৰয়োজন হয়। "
            "বীজ সিঁচাৰ সময়ত সম্পূৰ্ণ ফছফৰাচ, পটাছ আৰু আধা ইউৰিয়া প্ৰয়োগ কৰক।"
        ),
    },
    "market": {
        "en": (
            "Current official agricultural market benchmarks: "
            "Government Minimum Support Price (MSP): Wheat is ₹2,275/Quintal, Mustard is ₹5,650/Quintal, Paddy (Common) is ₹2,183/Quintal, Cotton is ₹6,620/Quintal. "
            "Real-time mandi modal prices vary by local arrival quantities. Check the Market Prices tab for your nearest APMC mandi."
        ),
        "hi": (
            "वर्तमान सरकारी न्यूनतम समर्थन मूल्य (MSP): "
            "गेहूं: ₹2,275/क्विंटल, सरसों: ₹5,650/क्विंटल, धान: ₹2,183/क्विंटल, कपास: ₹6,620/क्विंटल। "
            "मंडियों के दैनिक भाव आवक के अनुसार बदलते रहते हैं। अपने नजदीकी मंडी के भाव देखने के लिए 'Market Prices' सेक्शन देखें।"
        ),
        "as": (
            "বৰ্তমান চৰকাৰী ন্যূনতম সমৰ্থন মূল্য (MSP): "
            "ঘেঁহু: প্ৰতি কুইণ্টলত ₹২,২৭৫, সৰিয়হ: ₹৫,৬৫০, ধান: ₹২,১৮৩, কপাহ: ₹৬,৬২০। "
            "স্থানীয় মণ্ডীৰ সঠিক মূল্যৰ বাবে মাৰ্কেট প্ৰাইচ টেব চাওক।"
        ),
    },
    "general": {
        "en": (
            "Namaste! I am your KrishiAI Agricultural Assistant. "
            "I can guide you on crop disease detection, spray recommendations, weather advisories, soil nutrients, and mandi market prices. "
            "How can I assist your farm today? Please tell me about your crop, field conditions, or questions."
        ),
        "hi": (
            "नमस्ते किसान भाई! मैं आपका कृषि-एआई (KrishiAI) सहायक हूँ। "
            "मैं आपको फसल रोग पहचान, छिड़काव की सही विधि, मौसम सलाह, खाद-उर्वरक प्रबंधन और मंडी भाव की जानकारी दे सकता हूँ। "
            "आज मैं आपकी खेती में क्या सहायता कर सकता हूँ?"
        ),
        "as": (
            "নমস্কাৰ কৃষক বন্ধু! মই আপোনাৰ KrishiAI কৃষি সহায়ক। "
            "মই আপোনাক শস্যৰ ৰোগ নিৰ্ণয়, প্ৰতিৰোধমূলক ব্যৱস্থা, বতৰৰ আগজাননী আৰু মণ্ডীৰ দাম সম্পৰ্কে সহায় কৰিব পাৰোঁ। "
            "আজি আপোনাৰ খেতিৰ বিষয়ে কি জানিব বিচাৰে?"
        ),
    },
}


class AgriculturalAssistantService:
    """Conversational AI Agricultural Assistant backed by Gemini with grounded fallback."""

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self.api_key = api_key if api_key is not None else settings.gemini_api_key
        self.model = model if model is not None else settings.gemini_model
        self.client: genai.Client | None = None

        if self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
                logger.info("Gemini Client initialized for Assistant using model: %s", self.model)
            except Exception as exc:
                logger.warning("Failed to initialize Google GenAI Client for Assistant: %s", exc)
                self.client = None
        else:
            logger.info("GEMINI_API_KEY not configured. Assistant running in grounded agricultural fallback mode.")

    def chat(
        self,
        messages: list[dict[str, str]],
        language: Literal["en", "hi", "as"] = "en",
        context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Process multi-turn conversation messages and return grounded assistant reply."""
        lang = language if language in ("en", "hi", "as") else "en"
        lang_name = LANGUAGE_NAMES.get(lang, "English")

        # 1. Attempt Gemini Generation if client is configured
        if self.client and self.api_key:
            try:
                reply = self._call_gemini_chat(messages, lang_name, context)
                if reply:
                    return {
                        "reply": reply,
                        "language": lang,
                        "model": self.model,
                        "is_fallback": False,
                    }
            except Exception as exc:
                logger.warning("Gemini Assistant generation failed: %s. Using grounded fallback.", exc)

        # 2. Grounded Fallback Response based on query semantics
        last_user_message = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user_message = m.get("content", "").lower()
                break

        reply = self._get_fallback_reply(last_user_message, lang)
        return {
            "reply": reply,
            "language": lang,
            "model": "krishi-grounded-kb-v1",
            "is_fallback": True,
        }

    def _call_gemini_chat(
        self,
        messages: list[dict[str, str]],
        language_name: str,
        context: dict[str, Any] | None,
    ) -> str | None:
        """Invokes Gemini Client generate_content with conversation history and context."""
        system_instruction = SYSTEM_PROMPT.format(language_name=language_name)

        if context:
            ctx_str = "\n".join(f"- {k}: {v}" for k, v in context.items() if v)
            if ctx_str:
                system_instruction += f"\nCurrent Farmer & Field Context:\n{ctx_str}\n"

        # Format conversation history for Gemini API
        contents: list[types.Content] = []
        for msg in messages:
            role = "user" if msg.get("role") == "user" else "model"
            content_text = msg.get("content", "").strip()
            if content_text:
                contents.append(
                    types.Content(
                        role=role,
                        parts=[types.Part.from_text(text=content_text)],
                    )
                )

        if not contents:
            return None

        response = self.client.models.generate_content(
            model=self.model,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.3,  # Low temperature for factual precision
                max_output_tokens=1024,
            ),
        )

        return response.text if response and response.text else None

    def _get_fallback_reply(self, query: str, language: str) -> str:
        """Selects verified grounded agricultural guidance matching user keywords."""
        q = query.lower()

        if any(w in q for w in ("rust", "stripe", "pustule", "रतुआ", "ৰাষ্ট")):
            return FALLBACK_RESPONSES["rust"].get(language, FALLBACK_RESPONSES["rust"]["en"])

        if any(w in q for w in ("aphid", "chepa", "insect", "pest", "माहू", "चेपा", "পোক")):
            return FALLBACK_RESPONSES["aphid"].get(language, FALLBACK_RESPONSES["aphid"]["en"])

        if any(w in q for w in ("fertilizer", "urea", "npk", "dose", "खाद", "यूरिया", "সাৰ")):
            return FALLBACK_RESPONSES["fertilizer"].get(language, FALLBACK_RESPONSES["fertilizer"]["en"])

        if any(w in q for w in ("price", "mandi", "rate", "msp", "भाव", "मंडी", "দাম", "মূল্য")):
            return FALLBACK_RESPONSES["market"].get(language, FALLBACK_RESPONSES["market"]["en"])

        return FALLBACK_RESPONSES["general"].get(language, FALLBACK_RESPONSES["general"]["en"])

