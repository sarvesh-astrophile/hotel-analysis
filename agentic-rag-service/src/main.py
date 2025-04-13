from fastapi import FastAPI, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from src.agent_rag import execute_query
from src.database import write_to_db
from src.utils import create_db_engine
from pydantic import BaseModel
import logging
import pandas as pd
from typing import List, Dict, Any, AsyncGenerator
from src.analytics import run_all_analytics
import json
import asyncio


# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
origins = [
    "http://localhost:3000",  # Allow your frontend origin
    # You might want to add other origins for production, staging, etc.
    # "https://your-production-frontend.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

router = APIRouter()
conn = create_db_engine()

class QueryRequest(BaseModel):
    query: str

class DataFrameInput(BaseModel):
    data: List[Dict[Any, Any]]
    table_name: str = 'hotel_bookings'

class AnalyticsRequest(BaseModel):
    analysis_type: str

@router.post("/ask")
async def execute_sql_query(query_request: QueryRequest):
    """
    Receives a SQL query, executes it using the agent,
    and streams back thoughts and the final result as Server-Sent Events (SSE).
    """
    query = query_request.query
    logger.info(f"Processing streaming query: {query}")

    async def stream_generator() -> AsyncGenerator[str, None]:
        try:
            async for item in execute_query(query):
                # Format as Server-Sent Event (SSE)
                # Ensure data is json-encoded string
                yield f"data: {json.dumps(item)}\n\n"
                await asyncio.sleep(0.02) # Small delay between messages
        except Exception as e:
            logger.error(f"Error during streaming query execution: {str(e)}")
            # Yield a final error message in SSE format
            error_message = {"type": "error", "content": f"Failed to process query: {str(e)}"}
            yield f"data: {json.dumps(error_message)}\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")

# Add a GET endpoint for easier browser testing with EventSource
@router.get("/ask")
async def execute_sql_query_get(query: str): # Query comes from URL parameter
    """
    (GET endpoint for testing) Receives a SQL query via URL parameter,
    executes it using the agent, and streams back thoughts and the final result as SSE.
    """
    logger.info(f"Processing streaming query (GET): {query}")

    async def stream_generator() -> AsyncGenerator[str, None]:
        try:
            async for item in execute_query(query):
                yield f"data: {json.dumps(item)}\n\n"
                await asyncio.sleep(0.02)
        except Exception as e:
            logger.error(f"Error during streaming query execution (GET): {str(e)}")
            error_message = {"type": "error", "content": f"Failed to process query: {str(e)}"}
            yield f"data: {json.dumps(error_message)}\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")

@router.get("/analytics")
async def get_analytics():
    try:
        # Call the appropriate analysis function
        things =  run_all_analytics()
        
        # Return the analysis results
        return things
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error in analytics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Analytics error: {str(e)}"
        )

@router.get("/health")
async def health_check():
    try:
        # You could add more comprehensive health checks here
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Service unavailable"
        )

@router.get("/")
async def root():
    return {"message": "Welcome to the Hotel Booking Management System"}

@router.post("/update")
async def update_database(df_input: DataFrameInput):
    try:
        # Convert input JSON to pandas DataFrame
        df = pd.DataFrame(df_input.data)
        
        # Log the update attempt
        logger.info(f"Attempting to update table {df_input.table_name} with {len(df)} records")
        
        # Write to database using the imported function
        write_to_db(df, df_input.table_name, conn)

        return {
            "status": "success",
            "message": f"Successfully updated table {df_input.table_name} with {len(df)} records"
        }
        
    except Exception as e:
        logger.error(f"Error updating database: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update database: {str(e)}"
        )

app.include_router(router)