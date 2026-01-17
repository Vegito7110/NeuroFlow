import os
import uvicorn
import requests
from bs4 import BeautifulSoup
from typing import TypedDict, Literal, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# LangGraph & LangChain Imports
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

# --- CONFIGURATION & API KEYS ---

# 1. Load variables from .env file
load_dotenv()

# 2. Verify API Key is present
if not os.getenv("GROQ_API_KEY"):
    print("⚠️ CRITICAL WARNING: GROQ_API_KEY is missing from environment variables!")

# 3. Define the Model (Fast & Efficient)
LLM_MODEL = "llama-3.1-8b-instant"

# --- PART 1: LANGGRAPH AGENT SETUP ---

class AgentState(TypedDict):
    url: Optional[str]               # Optional because 'breakdown' doesn't need it
    user_input: Optional[str]        # Optional because 'summarize' doesn't need it
    task_type: Literal["summarize", "breakdown", "smart_extract", "simplify"] 
    clean_content: Optional[str]
    final_output: Optional[str]
    error: Optional[str]

def scraper_node(state: AgentState):
    """
    Node 1: Scrapes and cleans the website OR passes manual input.
    """
    # PATH A: MANUAL INPUT (Task Breakdown)
    if state["task_type"] == "breakdown":
        if not state.get("user_input"):
             return {"error": "User input is required for breakdown tasks."}
        return {"clean_content": state["user_input"]}

    # PATH B: WEB SCRAPING (Summarize, Simplify, Extract)
    url = state.get("url")
    if not url:
        return {"error": "URL is required for web processing tasks."}

    try:
        # Use a generic user agent to avoid basic blocking
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove junk elements
        for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'aside', 'form', 'iframe', 'ads']):
            tag.decompose()
            
        text_content = soup.get_text(separator="\n\n", strip=True)
        
        # Truncate to stay within safe token limits (approx 3,750 tokens)
        if len(text_content) > 15000:
            text_content = text_content[:15000] + "\n...[Content Truncated]"

        return {"clean_content": text_content}

    except Exception as e:
        return {"error": str(e), "clean_content": None}

def processor_node(state: AgentState):
    """
    Node 2: The LLM Brain. 
    Handles Summarization, Breakdown, Smart Extraction, and Simplification.
    """
    content = state.get("clean_content")
    task = state.get("task_type")
    
    # Fail fast if previous step failed
    if not content or state.get("error"):
        return {"final_output": "Error: Could not retrieve content to process."}

    try:
        llm = ChatGroq(
            temperature=0.2, 
            model=LLM_MODEL,
            api_key=os.getenv("GROQ_API_KEY")
        )
        
        # --- DYNAMIC PROMPT SELECTION ---
        if task == "breakdown":
            system_msg = "You are a productivity expert. Break down complex tasks into small, actionable steps."
            user_msg = "Break down the following task into 3-5 clear, bite-sized sub-steps. Return ONLY a bulleted list (e.g. - Step 1):\n\nTASK: {text}"
            
        elif task == "smart_extract":
            system_msg = "You are an expert content extractor."
            user_msg = "Convert the following chaotic web text into clean, formatted Markdown. Remove ads, navigation, and promotional fluff. Keep the original meaning intact.\n\nTEXT:\n{text}"
            
        elif task == "simplify":
            system_msg = "You are a cognitive accessibility assistant."
            user_msg = "Rewrite the following text to be easier to read (Grade 8 level). Use short paragraphs. **Bold** the most important key phrase in every paragraph.\n\nTEXT:\n{text}"
            
        else: # Default: Summarize
            system_msg = "You are a helpful assistant that summarizes web content."
            user_msg = "Analyze the following text and provide a summary in 3-5 concise bullet points. Focus on the main insights.\n\nTEXT:\n{text}"

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_msg),
            ("user", user_msg)
        ])
        
        chain = prompt | llm
        response = chain.invoke({"text": content})
        
        return {"final_output": response.content}

    except Exception as e:
        return {"final_output": f"LLM Processing Error: {str(e)}"}


# --- BUILD THE GRAPH ---
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("scraper", scraper_node)
workflow.add_node("processor", processor_node)

# Set Flow
workflow.set_entry_point("scraper")
workflow.add_edge("scraper", "processor")
workflow.add_edge("processor", END)

agent_app = workflow.compile()


# --- PART 2: FASTAPI SERVER ---

app = FastAPI(title="NeuroFlow Web Agent")

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
    url: Optional[str] = None        # Optional (defaults to None)
    user_input: Optional[str] = None # Optional (defaults to None)
    task_type: Literal["summarize", "breakdown", "smart_extract", "simplify"]

@app.post("/process")
async def process_request(request: RequestBody):
    """
    Unified Endpoint.
    """
    try:
        results = agent_app.invoke({
            "url": request.url, 
            "user_input": request.user_input,
            "task_type": request.task_type
        })
        
        # Check for scraping errors
        if results.get("error"):
            # We return 200 with error field so frontend handles it gracefully
            return {
                "status": "error",
                "message": results["error"],
                "data": None
            }

        return {
            "status": "success",
            "task": request.task_type,
            "data": results["final_output"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Entry point for deployment
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting server on port {port} using model {LLM_MODEL}...")
    uvicorn.run(app, host="0.0.0.0", port=port)