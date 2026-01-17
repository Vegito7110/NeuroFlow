import os
import uvicorn
import requests
from bs4 import BeautifulSoup
from typing import TypedDict, Literal, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv  # FIX: Correct import

# LangGraph & LangChain Imports
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

# --- CONFIGURATION & API KEYS ---

# 1. Load variables from .env file (if it exists)
load_dotenv()

# 2. Verify API Key is present
if not os.getenv("GROQ_API_KEY"):
    print("⚠️ WARNING: GROQ_API_KEY is missing from environment variables!")

# 3. Define the Model
LLM_MODEL = "llama3-8b-8192"

# --- PART 1: LANGGRAPH AGENT SETUP ---

class AgentState(TypedDict):
    url: str
    task_type: Literal["clutter_free", "summarize"]
    clean_content: Optional[str]
    final_output: Optional[str]
    error: Optional[str]

def scraper_node(state: AgentState):
    """Node 1: Scrapes and cleans the website."""
    url = state["url"]
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove junk
        for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'aside', 'form', 'iframe']):
            tag.decompose()
            
        text_content = soup.get_text(separator="\n\n", strip=True)
        
        # Truncate if too long (approx 25k chars) to save tokens
        if len(text_content) > 25000:
            text_content = text_content[:25000] + "\n...[Content Truncated]"

        return {"clean_content": text_content}

    except Exception as e:
        return {"error": str(e), "clean_content": None}

def summarizer_node(state: AgentState):
    """Node 2: Summarizes the content using Groq."""
    content = state.get("clean_content")
    if not content or state.get("error"):
        return {"final_output": "Error: Could not retrieve content."}

    # FIX: Initialize LLM with the API key automatically loaded from env
    try:
        llm = ChatGroq(temperature=0, model_name=LLM_MODEL)
    except Exception as e:
        return {"final_output": f"LLM Error: {str(e)}"}

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful assistant."),
        ("user", "Summarize this text in 3-5 concise bullet points:\n\n{text}")
    ])
    chain = prompt | llm
    response = chain.invoke({"text": content})
    return {"final_output": response.content}

def route_next_step(state: AgentState):
    if state.get("error"): return "end_process"
    if state["task_type"] == "clutter_free": return "end_process"
    return "summarize"

# Build the Graph
workflow = StateGraph(AgentState)
workflow.add_node("scraper", scraper_node)
workflow.add_node("summarizer", summarizer_node)
workflow.set_entry_point("scraper")
workflow.add_conditional_edges(
    "scraper",
    route_next_step,
    {"end_process": END, "summarize": "summarizer"}
)
workflow.add_edge("summarizer", END)
agent_app = workflow.compile()


# --- PART 2: FASTAPI SERVER ---

app = FastAPI(title="AI Web Agent")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the Input Model
class RequestBody(BaseModel):
    url: str
    task_type: Literal["clutter_free", "summarize"]

@app.post("/process")
async def process_url(request: RequestBody):
    """
    The main endpoint. 
    Accepts: { "url": "...", "task_type": "..." }
    """
    results = agent_app.invoke({
        "url": request.url, 
        "task_type": request.task_type
    })
    
    if results.get("error"):
        raise HTTPException(status_code=400, detail=results["error"])

    response_data = {
        "status": "success",
        "task": request.task_type,
    }

    if request.task_type == "clutter_free":
        response_data["data"] = results["clean_content"]
    else:
        response_data["data"] = results["final_output"]

    return response_data

# Entry point for deployment
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)