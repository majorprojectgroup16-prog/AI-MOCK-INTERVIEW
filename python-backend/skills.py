import re
from skills_dict import TECH_SKILLS

def extract_hard_skills(text: str):
    text_lower = text.lower()
    found = set()

    for skill in TECH_SKILLS:
        pattern = r"\b" + re.escape(skill.lower()) + r"\b"
        if re.search(pattern, text_lower):
            found.add(skill)

    return list(found)
