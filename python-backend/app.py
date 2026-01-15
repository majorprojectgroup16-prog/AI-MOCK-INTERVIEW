from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import uvicorn
import spacy
from skills import extract_hard_skills

app = FastAPI()

# Load spaCy model once
try:
    nlp = spacy.load("./model/model-last")
except Exception as e:
    print("Warning: could not load spaCy model: ", e)
    nlp = None

class ExtractRequest(BaseModel):
    text: str

class ExtractResponse(BaseModel):
    skills: List[str]
    soft_skills: List[str] = []


@app.get("/", response_model=dict)
async def health():
    """Simple health endpoint to verify the service is running."""
    return {"status": "ok"}


@app.post("/extract", response_model=ExtractResponse)
async def extract(req: ExtractRequest):
    text = req.text or ""
    print("POST /extract called; text length:", len(text))
    result_skills = []
    soft_skills = []

    # 1) Use span categorizer if model is loaded and has 'sc' spans
    if nlp is not None:
        try:
            doc = nlp(text)
            hard_skill_spans = []
            if "sc" in doc.spans:
                for span in doc.spans["sc"]:
                    hard_skill_spans.append(span.text)
            print("spaCy hard spans:", hard_skill_spans)
            result_skills.extend(hard_skill_spans)
        except Exception as e:
            print("spaCy extraction error:", e)

    # 2) Use keyword-based fallback (skills.py)
    try:
        fallback = extract_hard_skills(text)
        print("Fallback skills:", fallback)
        result_skills.extend(fallback)
    except Exception as e:
        print("Fallback extraction error:", e)

    # Deduplicate and normalize
    normalized = list({s.strip().lower() for s in result_skills if s and isinstance(s, str)})

    print("Returning normalized skills:", normalized)

    # Return skills
    return ExtractResponse(skills=[s for s in normalized], soft_skills=soft_skills)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
