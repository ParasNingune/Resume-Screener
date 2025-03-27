import os
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from resume_parser import extract_text_from_pdf

def match_resumes_with_job(job_desc, resume_folder):

    """
        Match resumes against a job description using TF-IDF and Cosine Similarity.
    """
    
    resumes = []
    resume_files = []

    for file in os.listdir(resume_folder):
        if file.endswith(".pdf"):
            file_path = os.path.join(resume_folder, file)
            resume_text = extract_text_from_pdf(file_path)
            if resume_text:
                resumes.append(resume_text)
                resume_files.append(file)

    if not resumes:
        return []

    # Prepare data for TF-IDF
    documents = [job_desc] + resumes
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(documents)

    # Compute similarity scores
    job_vec = tfidf_matrix[0]  # Job description vector
    resume_vecs = tfidf_matrix[1:]  # Resumes vector
    scores = cosine_similarity(job_vec, resume_vecs).flatten()

    # Rank resumes based on similarity scores
    ranked_resumes = sorted(zip(resume_files, scores), key=lambda x: x[1], reverse=True)
    return ranked_resumes
