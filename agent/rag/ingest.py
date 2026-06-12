from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
import os
from dotenv import load_dotenv
load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "../docs/data.txt")

loader = TextLoader(DATA_PATH)
doc = loader.load()

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)

splitted_documents = splitter.split_documents(doc)

if __name__=="__main__" :
    print("Ingesting data into vectorDB....")
    vectorstore = Chroma.from_documents(splitted_documents, embeddings, persist_directory="vectorstore")
    print("Data ingested successfully!")
    
