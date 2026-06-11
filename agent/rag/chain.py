from .prompt import get_rag_prompt
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq

output_parser = StrOutputParser()
model = ChatGroq(model="llama-3.3-70b-versatile")

def build_rag_chain():
    return get_rag_prompt() | model | output_parser

