
import os
import requests

from dotenv import load_dotenv
from google import genai
from groq import Groq


# ==================================================
# 1. Load environment variables
# ==================================================

load_dotenv()


# ==================================================
# 2. API Keys
# ==================================================

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")


# ==================================================
# 3. Model Configuration
# ==================================================

OPENROUTER_MODEL = os.getenv(
    "OPENROUTER_MODEL",
    "openai/gpt-oss-20b"
)

GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.6-flash"
)

GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "llama-3.3-70b-versatile"
)


# ==================================================
# 4. Create API Clients
# ==================================================

gemini_client = None
groq_client = None

if GEMINI_API_KEY:
    gemini_client = genai.Client(
        api_key=GEMINI_API_KEY
    )

if GROQ_API_KEY:
    groq_client = Groq(
        api_key=GROQ_API_KEY
    )


# ==================================================
# 5. OpenRouter - PRIMARY PROVIDER
# ==================================================

def generate_with_openrouter(prompt):
    """
    Generate an answer using OpenRouter.

    Priority: FIRST
    Attempts: ONE
    """

    if not OPENROUTER_API_KEY:
        raise RuntimeError(
            "OPENROUTER_API_KEY is not configured."
        )

    print("\n🔵 Trying OpenRouter (primary)...")
    print(f"Model: {OPENROUTER_MODEL}")

    url = "https://openrouter.ai/api/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "LDRP-ITR AI Assistant",
    }

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {
                "role": "user",
                "content": prompt,
            }
        ],
        "temperature": 0.2,
        "max_tokens": 2048,
    }

    # Exactly one HTTP request; no retry loop.
    response = requests.post(
        url,
        headers=headers,
        json=payload,
        timeout=60,
    )

    response.raise_for_status()

    data = response.json()

    answer = (
        data.get("choices", [{}])[0]
        .get("message", {})
        .get("content")
    )

    if not isinstance(answer, str) or not answer.strip():
        raise RuntimeError(
            "OpenRouter returned an empty response."
        )

    print("✅ OpenRouter response received")

    return answer.strip()


# ==================================================
# 6. Gemini - FIRST FALLBACK
# ==================================================

def generate_with_gemini(prompt):
    """
    Generate an answer using Gemini.

    Priority: SECOND
    Attempts: ONE
    """

    if not gemini_client:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured."
        )

    print("\n🟣 Trying Gemini (fallback)...")
    print(f"Model: {GEMINI_MODEL}")

    # Exactly one API call; no retry loop.
    response = gemini_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
    )

    answer = response.text

    if not isinstance(answer, str) or not answer.strip():
        raise RuntimeError(
            "Gemini returned an empty response."
        )

    print("✅ Gemini response received")

    return answer.strip()


# ==================================================
# 7. Groq - FINAL FALLBACK
# ==================================================

def generate_with_groq(prompt):
    """
    Generate an answer using Groq.

    Priority: THIRD
    Attempts: ONE
    """

    if not groq_client:
        raise RuntimeError(
            "GROQ_API_KEY is not configured."
        )

    print("\n🟢 Trying Groq (final fallback)...")
    print(f"Model: {GROQ_MODEL}")

    # Exactly one API call; no retry loop.
    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        temperature=0.2,
        max_tokens=2048,
    )

    answer = response.choices[0].message.content

    if not isinstance(answer, str) or not answer.strip():
        raise RuntimeError(
            "Groq returned an empty response."
        )

    print("✅ Groq response received")

    return answer.strip()


# ==================================================
# 8. Main LLM Fallback System
# ==================================================

def generate_answer(prompt):
    """
    Generate an answer using the configured providers.

    Provider priority:
        1. OpenRouter - one attempt
        2. Gemini     - one attempt
        3. Groq       - one attempt

    No provider is retried by this function.
    A provider failure immediately moves to the next one.

    This function preserves the generate_answer(prompt)
    interface used by the RAG application.
    """

    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError(
            "Prompt must be a non-empty string."
        )

    print("\n" + "=" * 60)
    print("🤖 LDRP RAG LLM FALLBACK SYSTEM")
    print("=" * 60)

    providers = [
        (
            "OPENROUTER",
            OPENROUTER_API_KEY,
            generate_with_openrouter,
        ),
        (
            "GEMINI",
            GEMINI_API_KEY,
            generate_with_gemini,
        ),
        (
            "GROQ",
            GROQ_API_KEY,
            generate_with_groq,
        ),
    ]

    errors = []

    for provider_name, api_key, generate_function in providers:

        # Skip providers without configured API keys.
        if not api_key:
            message = (
                f"{provider_name}_API_KEY is not configured."
            )

            print(f"\n⚠️ Skipping {provider_name}: {message}")
            errors.append(f"{provider_name}: {message}")
            continue

        try:
            print(f"\n➡️ Provider: {provider_name}")

            answer = generate_function(prompt)

            print("\n" + "=" * 60)
            print(f"✅ PROVIDER USED: {provider_name}")
            print("=" * 60)

            return answer

        except Exception as error:
            error_message = (
                f"{type(error).__name__}: {error}"
            )

            print(f"\n❌ {provider_name} failed.")
            print(f"Reason: {error_message}")
            print("➡️ Moving to the next provider...")

            errors.append(
                f"{provider_name}: {error_message}"
            )

            # No retry. Continue to the next provider.

    # ==================================================
    # All Providers Failed
    # ==================================================

    print("\n" + "=" * 60)
    print("❌ ALL LLM PROVIDERS FAILED")
    print("=" * 60)

    details = "\n".join(errors)

    raise RuntimeError(
        "All configured LLM providers failed.\n"
        "Check your API keys, model names, quotas, "
        "network connection, and provider availability.\n\n"
        f"Provider errors:\n{details}"
    )


# ==================================================
# 9. Local Test
# ==================================================

if __name__ == "__main__":

    test_prompt = """
    You are an academic assistant.

    Explain Retrieval-Augmented Generation (RAG)
    in simple words in 3 sentences.
    """

    try:
        answer = generate_answer(test_prompt)

        print("\n")
        print("=" * 60)
        print("FINAL RESPONSE")
        print("=" * 60)
        print(answer)
        print("=" * 60)

    except Exception as error:
        print("\n")
        print("=" * 60)
        print("❌ ALL PROVIDERS FAILED")
        print("=" * 60)
        print(error)
        print("=" * 60)
