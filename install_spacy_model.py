import spacy

try:
    spacy.load("ru_core_news_sm")
except OSError:
    print("Downloading ru_core_news_sm...")
    from spacy.cli import download
    download("ru_core_news_sm")
    print("Model downloaded!")
