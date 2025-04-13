from smolagents import CodeAgent
from src.utils import load_api_keys, create_db_engine
from smolagents import tool, LiteLLMModel
from sqlalchemy import text
import asyncio
from typing import AsyncGenerator, Dict, Any, List, Tuple


engine = create_db_engine()


@tool
def sql_engine(query: str) -> str:
    """
    Allows you to perform SQL queries on the table. Returns a string representation of the result.
    The table is named 'hotel_bookings'. Its description is as follows:
        Columns:
        - index: INTEGER
        - hotel: TEXT
        - is_canceled: INTEGER
        - lead_time: INTEGER
        - arrival_date_year: INTEGER
        - arrival_date_month: TEXT
        - arrival_date_week_number: INTEGER
        - arrival_date_day_of_month: INTEGER
        - stays_in_weekend_nights: INTEGER
        - stays_in_week_nights: INTEGER
        - adults: INTEGER
        - children: REAL
        - babies: INTEGER
        - meal: TEXT
        - country: TEXT
        - market_segment: TEXT
        - distribution_channel: TEXT
        - is_repeated_guest: INTEGER
        - previous_cancellations: INTEGER
        - previous_bookings_not_canceled: INTEGER
        - reserved_room_type: TEXT
        - assigned_room_type: TEXT
        - booking_changes: INTEGER
        - deposit_type: TEXT
        - agent: REAL
        - company: REAL
        - days_in_waiting_list: INTEGER
        - customer_type: TEXT
        - adr: REAL
        - required_car_parking_spaces: INTEGER
        - total_of_special_requests: INTEGER
        - reservation_status: TEXT
        - reservation_status_date: TEXT

    Args:
        query: The query to perform. This should be correct SQL.
    """
    output = ""
    with engine.connect() as con:
        rows = con.execute(text(query))
        for row in rows:
            output += "\n" + str(row)
    return output

    
def create_llm_model():
    """Create and return a LiteLLM model instance."""
    api_keys = load_api_keys()
    return LiteLLMModel(
        model_id="gemini/gemini-2.0-flash-exp", # "gemini-2.0-flash-exp",  # Specify the Gemini model ID
        api_key=api_keys['gemini'],  # Use your API key from environment variables
        project_id="lambda4110"
    )



def create_agent():
    """Create and return a CodeAgent instance with SQL tools."""
    return CodeAgent(
        tools=[sql_engine],
        model=model
    )

engine = create_db_engine()
model = create_llm_model()
agent = create_agent()

async def execute_query(query: str, agent_instance=None) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Execute a SQL query using the provided agent and stream thoughts and results.

    Args:
        query: SQL query string to execute
        agent_instance: CodeAgent instance (defaults to global agent)

    Yields:
        Dict[str, Any]: A dictionary representing either a 'thought' or the final 'result' or an 'error'.
            Example: {"type": "thought", "content": "Executing SQL..."}
                     {"type": "result", "content": "The average lead time is..."}
                     {"type": "error", "content": "Error details..."}
    """
    try:
        global agent
        agent_to_use = agent_instance if agent_instance is not None else agent
        agent_to_use.memory.reset() # Reset memory before each query

        # Need to run the agent's execution potentially in a separate thread
        # if the underlying agent.run is blocking, to allow streaming thoughts.
        # However, assuming agent.run itself might be complex or have internal async/blocking parts,
        # we first extract thoughts *after* the main run completes.
        # A more advanced implementation might involve hooking into the agent's steps *during* execution.

        # Execute the main query task (assuming agent.run is blocking for now)
        # We will run this in a thread to avoid blocking the event loop entirely,
        # but thoughts are extracted *after* completion in this version.
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, agent_to_use.run, f"Execute this SQL query: {query}")


        # --- Extract and yield thoughts ---
        thoughts = []
        for step in agent_to_use.memory.steps:
            step_info = f"Step {getattr(step, 'step_number', '?')}: {step.__class__.__name__}"
            thought_content = []
            if hasattr(step, 'plan') and step.plan:
                 thought_content.append(f"Plan:\n{step.plan}")
            if hasattr(step, 'model_output_message') and step.model_output_message and step.model_output_message.content:
                 thought_content.append(f"LLM Output:\n{step.model_output_message.content}")
            if hasattr(step, 'tool_calls') and step.tool_calls:
                for tc in step.tool_calls:
                    thought_content.append(f"Tool Call: {tc.name}({tc.arguments})")
            if hasattr(step, 'observations') and step.observations:
                 thought_content.append(f"Observation:\n{step.observations}")
            if hasattr(step, 'action_output'):
                 is_last_step = step == agent_to_use.memory.steps[-1]
                 output_str = str(step.action_output)
                 if not (is_last_step and result and output_str in result):
                      thought_content.append(f"Action Output: {output_str}")

            if hasattr(step, 'error') and step.error:
                thought_content.append(f"Error: {step.error}")

            if thought_content:
                 full_thought = f"{step_info} - {' | '.join(thought_content)}"
                 yield {"type": "thought", "content": full_thought}
                 await asyncio.sleep(0.01) # Small sleep to allow messages to be sent

        # --- Generate and yield natural language response ---
        # Run natural_response generation in a thread as well if it involves LLM calls
        natural_lang_response = await loop.run_in_executor(None, natural_response, query, result, agent_to_use)
        yield {"type": "result", "content": natural_lang_response}

    except Exception as e:
        yield {"type": "error", "content": f"Error executing query: {str(e)}"}


def natural_response(query: str, result: str, agent: CodeAgent) -> str:
    """
    Convert SQL query results into natural language response using LLM.
    (Note: This function remains synchronous as it's called via run_in_executor)

    Args:
        query: The original SQL query
        result: The raw query result string
        agent: CodeAgent instance

    Returns:
        str: Natural language interpretation of the results
    """
    try:
        # Prepare prompt for LLM
        prompt = f"""
        Given this SQL query: {query}
        And these results: {result}
        
        Please provide a natural language summary of these results. 
        Focus on:
        1. What was queried (the main objective)
        2. Key findings from the results
        3. Any notable patterns or insights
        
        Format the response in a clear, concise & conversational way that a non-technical person would understand.
        """
        
        # Get LLM response
        # NOTE: Calling agent.run() here might add more steps to the *same* agent's memory
        # if not handled carefully. Consider using a separate LLM call if needed.
        llm_response = agent.run(prompt) # This might still be blocking

        # If LLM fails, fall back to basic formatting
        if not llm_response or "error" in llm_response.lower():
            # Extract key information from query
            query_lower = query.lower()
            
            # Initialize response components
            action = "retrieved"
            if "count" in query_lower:
                action = "counted"
            elif "avg" in query_lower or "average" in query_lower:
                action = "calculated the average of"
            elif "sum" in query_lower:
                action = "calculated the total of"
                
            # Build basic response
            if not result.strip():
                return "No results found for this query."
                
            response = f"I have {action} the following information:\n"
            
            # Format results
            results_list = result.strip().split("\n")
            for row in results_list:
                cleaned_row = row.strip("()").replace("'", "")
                response += f"• {cleaned_row}\n"
                
            return response
        # print("---llm_response start---")
        # print(llm_response)
        # print("---llm_response end---")
        # It's better to return the actual summary, not the raw LLM response which might include agent chatter
        # Let's assume the last message content from the agent run is the summary
        if agent.memory.steps and hasattr(agent.memory.steps[-1], 'model_output_message'):
             final_summary = agent.memory.steps[-1].model_output_message.content
             # Clean up potential XML tags if the agent uses them
             final_summary = final_summary.split("<final_answer>")[-1].split("</final_answer>")[0].strip()
             return final_summary
        else:
             return llm_response # Fallback to raw response if structure isn't as expected

    except Exception as e:
        # Log the error internally maybe?
        print(f"Error in natural_response: {str(e)}") # Add logging
        return f"I found the following raw results:\n{result}\n\n(Could not generate a natural language summary due to an internal error: {str(e)})"
