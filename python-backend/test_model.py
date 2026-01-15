import spacy

print("Loading model...")
nlp = spacy.load("./model/model-last")

# ----- TEST TEXT -----
text = """
Developed an AI-powered chatbot using Python and NLP.
Mentored junior developers and conducted webinars.
Collaborated with cross-functional teams to deliver software.
Excellent communication and team management skills.
"""

doc = nlp(text)

# ---- HARD SKILL (from SpanCat) ----
hard_skill_spans = []
if "sc" in doc.spans:
    for span in doc.spans["sc"]:
        hard_skill_spans.append(span.text.lower())

# Deduplicate
hard_skill_spans = list(set(hard_skill_spans))


# ---- TECH SKILL KEYWORDS ----
TECH_SKILLS = [
    "python", "java", "c", "c++", "c#", "javascript", "typescript", "go", "rust", "php", "r",

    # Frameworks
    "react", "angular", "vue", "django", "flask", "spring", "node", "express",
    "tensorflow", "keras", "pytorch", "scikit-learn", "numpy", "pandas", "matplotlib",

    # Databases
    "mysql", "postgresql", "sqlite", "mongodb", "redis", "oracle", "sql server",

    # Cloud & DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "terraform", "git",

    # AI/ML
    "machine learning", "deep learning", "nlp", "computer vision", "llm",

    # Tools
    "linux", "jira", "postman", "figma", "power bi", "tableau"
]

def extract_tech(text):
    result = []
    lower = text.lower()
    for skill in TECH_SKILLS:
        if skill in lower:
            result.append(skill.upper())
    return list(set(result))


# ---- SOFT SKILLS ----
SOFT_SKILLS = [
    "communication", "leadership", "team", "teamwork",
    "collaboration", "collaborate", "research", "mentoring",
    "analytical", "organized", "initiative", "motivated"
]

def extract_soft(text):
    result = []
    lower = text.lower()
    for skill in SOFT_SKILLS:
        if skill in lower:
            result.append(skill.upper())
    return list(set(result))


# ---- FINAL EXTRACTION ----
model_soft = extract_soft(text)
tech = extract_tech(text)

# Combine model hard + tech hard skills
combined_hard_skills = list(set(hard_skill_spans + tech))

print("\n=== MODEL OUTPUT ===")
print("Hard Skills:", combined_hard_skills)
print("Soft Skills:", model_soft)

final_output = {
    "skills": combined_hard_skills,
    "soft_skills": model_soft
}

print("\n=== FINAL OUTPUT ===")
print(final_output)
