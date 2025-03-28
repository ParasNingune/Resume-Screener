import os
import numpy as np
import pandas as pd
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from resume_parser import extract_text_from_pdf

# Load spaCy NLP model for Named Entity Recognition (NER)
nlp = spacy.load("en_core_web_sm")

def extract_key_terms(text):
    """
    Extract key terms (skills, education, experience) from a text using spaCy NER.
    """
    doc = nlp(text)
    key_terms = []

    for ent in doc.ents:
        if ent.label_ in ["ORG", "GPE", "PERSON"]:
            continue  # Ignore names and locations
        key_terms.append(ent.text.lower())

    return " ".join(key_terms)

def match_resumes_with_job(job_desc, resume_folder):
    """
    Match resumes against a job description using TF-IDF, Cosine Similarity, and Entity Recognition.
    """

    resumes = []
    resume_files = []
    extracted_terms = []  # Stores extracted key terms for weighting

    for file in os.listdir(resume_folder):
        if file.endswith(".pdf"):
            file_path = os.path.join(resume_folder, file)
            resume_text = extract_text_from_pdf(file_path)
            if resume_text:
                resumes.append(resume_text)
                resume_files.append(file)
                extracted_terms.append(extract_key_terms(resume_text))  # Extract key terms

    if not resumes:
        return []

    # Combine original resumes with extracted key terms for better scoring
    documents = [job_desc] + resumes + extracted_terms
    vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))  # Consider bigrams
    tfidf_matrix = vectorizer.fit_transform(documents)

    # Compute similarity scores
    job_vec = tfidf_matrix[0]  # Job description vector
    resume_vecs = tfidf_matrix[1 : len(resumes) + 1]  # Resumes vector
    term_vecs = tfidf_matrix[len(resumes) + 1 :]  # Extracted key terms vector

    # Compute similarity using a weighted hybrid approach
    scores = cosine_similarity(job_vec, resume_vecs).flatten()
    term_scores = cosine_similarity(job_vec, term_vecs).flatten()

    # Adjust weights: 80% content similarity, 20% key term matching
    final_scores = (0.8 * scores) + (0.2 * term_scores)

    # Boost based on explicit experience mentions (if "X years experience" is found)
    for i, resume_text in enumerate(resumes):
        if "years experience" in resume_text or "years of experience" in resume_text:
            final_scores[i] += 5  # Small experience boost

    # Convert to percentage and rank
    final_scores = final_scores * 100
    ranked_resumes = sorted(zip(resume_files, final_scores), key=lambda x: x[1], reverse=True)

    return ranked_resumes
