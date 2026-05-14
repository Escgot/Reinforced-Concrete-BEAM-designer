import sys
import os

# Add the project root and backend directory to sys.path
# This allows importing from the backend folder
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
sys.path.append(root_dir)
sys.path.append(os.path.join(root_dir, "backend"))

from backend.api.main import app

# This is required for Vercel to recognize the FastAPI app
# We export it as 'app' so it matches the expected name
# If your main app is named differently, change it here
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
