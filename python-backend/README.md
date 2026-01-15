# Python Backend

This folder contains a small FastAPI service that exposes a skill extraction endpoint used by the Next.js app.

Quick start (local development):

1. Create a virtualenv and activate it (optional but recommended):
   - python -m venv venv
   - venv\Scripts\activate  (Windows)

2. Install requirements:
   - pip install -r requirements.txt

3. Start the server:
   - uvicorn app:app --reload --port 8000

The service exposes POST /extract which expects JSON { "text": "..." } and returns:

{
  "skills": ["python", "django"],
  "soft_skills": []
}

Note: The spaCy model is loaded from `./model/model-last`. Ensure the model files exist and are compatible with installed spaCy version.
