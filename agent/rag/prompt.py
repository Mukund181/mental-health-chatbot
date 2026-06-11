from langchain_core.prompts import ChatPromptTemplate

def get_rag_prompt():
    return ChatPromptTemplate.from_template("""
You are a mental health professional. 

Here is the context to answer the question:{context}

Question: {question}""")

if __name__ == "__main__":
    print(get_rag_prompt())
    