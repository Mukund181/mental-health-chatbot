from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
import os
from dotenv import load_dotenv
load_dotenv()


embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vectorstore = Chroma(persist_directory="vectorstore", embedding_function=embeddings)
retriever = vectorstore.as_retriever()

def get_related_docs(query):
    return vectorstore.similarity_search(query,k=3)

if __name__ == "__main__":
    test_query = "How to deal with anxiety?"
    results = get_related_docs(test_query)
    for doc in results:
        print(doc)

