# 🏗️ Reinforced Concrete Beam Designer — EN 1992-1-1

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.9%2B-blue.svg)
![React](https://img.shields.io/badge/react-18.x-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-green.svg)
![Eurocode 2](https://img.shields.io/badge/standard-EN%201992--1--1-orange.svg)

A full-stack, professional-grade web application for designing singly-reinforced concrete beams in accordance with Eurocode 2 (EN 1992-1-1). This tool performs rigorous checks for bending, shear, deflection, and crack width, complete with automated PDF calculation sheet exports for structural engineering documentation.

## ✨ Key Features

- **Standard-Compliant Engine**: Implements strict EN 1992-1-1 checks in pure Python, meticulously validated against textbook worked examples to ensure engineering accuracy.
- **Comprehensive Checks**:
  - **Bending (§6.1)**: Calculates required tension steel ($A_s$).
  - **Shear (§6.2)**: Determines shear resistance without reinforcement and identifies if minimum links or designed vertical links are required.
  - **Deflection (§7.4)**: Span-to-effective-depth ratio check against simplified Eurocode limits.
  - **Crack Width (§7.3)**: Checks maximum bar spacing for exposure classes against simplified tables.
- **Modern User Interface**: Built with React and TailwindCSS, offering a responsive layout, live feedback, and an intuitive user experience.
- **Robust Backend**: Powered by FastAPI, decoupled into an API layer and a pure calculation engine for maximum modularity and performance.
- **Automated Reporting**: Integrates ReportLab to automatically generate and export standard structural calculation sheets in PDF format.
- **Containerized Environment**: Fully containerized using Docker and Docker-Compose for seamless local development, testing, and deployment.

## 🛠️ Technologies & Stack

- **Frontend**: React, TailwindCSS, Vite
- **Backend**: Python, FastAPI, Pytest, ReportLab (PDF Generation)
- **Deployment**: Docker, Docker-Compose

## 🚀 Getting Started

You can run the application either using Docker (recommended) or via a manual setup.

### 🐳 Using Docker

1. Ensure [Docker](https://docs.docker.com/get-docker/) and [Docker-Compose](https://docs.docker.com/compose/install/) are installed on your machine.
2. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/Escgot/Reinforced-Concrete-BEAM-designer.git
   cd Reinforced-Concrete-BEAM-designer
   ```
3. Build and start the containers:
   ```bash
   docker-compose up --build
   ```
4. Access the application:
   - **Frontend**: `http://localhost`
   - **Backend API (Swagger UI)**: `http://localhost:8000/docs`

### 💻 Manual Setup

If you prefer to run the components independently without Docker:

#### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the test suite to verify the calculation engine:
   ```bash
   pytest tests/
   ```
5. Start the FastAPI server:
   ```bash
   python run.py
   ```

#### Frontend Setup
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## 🏗️ Project Architecture

The project is structured with a clean separation of concerns:

- `/backend/engine`: The core Python calculation engine, free of web framework dependencies, ensuring high testability and reusability.
- `/backend/api`: FastAPI routes connecting the calculation engine to the web.
- `/backend/tests`: Pytest suite validating the engine against known engineering problems.
- `/frontend`: React SPA with TailwindCSS providing a clean, reactive interface for data entry and result visualization.
- `/docker-compose.yml`: Orchestrates the seamless connection between the backend and frontend containers.

## 📝 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
