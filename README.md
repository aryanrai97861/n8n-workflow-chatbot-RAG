# GenAI Stack - No-Code/Low-Code Workflow Builder

A visual drag-and-drop workflow builder that enables users to create intelligent AI workflows. Build flows with LLM, Knowledge Base (RAG), and Web Search components, then interact with them through a chat interface.

> **Assignment**: Full-Stack Engineering – No-Code/Low-Code Web Application with Intelligent Workflows

---

## 📐 Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                    FRONTEND (React + Vite)                                │
│  ┌─────────────────────┐  ┌──────────────────────────┐  ┌──────────────────────────────┐ │
│  │  Component Library  │  │     React Flow Canvas    │  │     Configuration Panel      │ │
│  │  ● User Query       │  │  ┌─────┐    ┌─────────┐  │  │  ● API Key Settings          │ │
│  │  ● Knowledge Base   │  │  │Query├───►│Knowledge│  │  │  ● Model Selection          │ │
│  │  ● LLM Engine       │  │  │     │    │  Base   │  │  │  ● System Prompts           │ │
│  │  ● Output           │  │  └─────┘    └────┬────┘  │  │  ● Web Search Toggle        │ │
│  └─────────────────────┘  │              ┌───▼───┐   │  └──────────────────────────────┘ │
│                           │              │  LLM  │   │                                   │
│  ┌─────────────────────┐  │              │Engine │   │  ┌──────────────────────────────┐ │
│  │   Dashboard         │  │              └───┬───┘   │  │       Chat Modal             │ │
│  │  ● Saved Workflows  │  │              ┌───▼───┐   │  │  ● Query Input               │ │
│  │  ● Create/Delete    │  │              │Output │   │  │  ● Response Display          │ │
│  └─────────────────────┘  │              └───────┘   │  │  ● Execution Logs            │ │
│                           └──────────────────────────┘  └──────────────────────────────┘ │
└───────────────────────────────────────────┬──────────────────────────────────────────────┘
                                            │ REST APIs (HTTP/JSON)
                                            ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                   BACKEND (FastAPI)                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                    Routers                                          │ │
│  │   /api/auth     │   /api/documents   │   /api/workflows   │   /api/chat             │ │
│  │   ● register    │   ● upload         │   ● CRUD           │   ● execute             │ │
│  │   ● login       │   ● list/delete    │   ● save/load      │   ● history             │ │
│  └─────────────────────────────────────────────────────────────────────────────────────┘ │
│                                            │                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                   Services                                           │ │
│  │  ┌───────────────┐ ┌────────────────┐ ┌───────────────┐ ┌─────────────────────────┐ │ │
│  │  │ Text Extractor│ │Local Embedding │ │ Vector Store  │ │     LLM Service         │ │ │
│  │  │  (PyMuPDF)    │ │  (Sentence-    │ │  (ChromaDB)   │ │   (Gemini API)          │ │ │
│  │  │               │ │  Transformers) │ │               │ │                         │ │ │
│  │  └───────────────┘ └────────────────┘ └───────────────┘ └─────────────────────────┘ │ │
│  │  ┌───────────────┐ ┌────────────────┐ ┌───────────────┐                             │ │
│  │  │ Web Search    │ │ Auth Service   │ │Execution Logger│                            │ │
│  │  │ (SerpAPI/     │ │ (JWT/bcrypt)   │ │  (Structured) │                             │ │
│  │  │  Brave)       │ │               │ │               │                             │ │
│  │  └───────────────┘ └────────────────┘ └───────────────┘                             │ │
│  └─────────────────────────────────────────────────────────────────────────────────────┘ │
│                                            │                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                             Workflow Executor Engine                                 │ │
│  │           Orchestrates: User Query → Knowledge Base → LLM → Output                  │ │
│  └─────────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────┬────────────────────────────┬────────────────────────────┬──────────────┘
                  │                            │                            │
                  ▼                            ▼                            ▼
         ┌──────────────┐            ┌──────────────────┐         ┌──────────────────┐
         │  PostgreSQL  │            │     ChromaDB     │         │   External APIs  │
         │  ● Users     │            │  ● Embeddings    │         │  ● Gemini LLM    │
         │  ● Workflows │            │  ● Vector Search │         │  ● SerpAPI       │
         │  ● Chat Logs │            │                  │         │  ● Brave Search  │
         │  ● Exec Logs │            │                  │         │                  │
         └──────────────┘            └──────────────────┘         └──────────────────┘
```

### Workflow Execution Flow

```
┌──────────┐      ┌───────────────────────┐      ┌───────────────┐      ┌────────────┐
│  User    │      │    Knowledge Base     │      │  LLM Engine   │      │   Output   │
│  Query   ├─────►│  (Optional RAG)       ├─────►│  + Web Search ├─────►│  Response  │
│          │      │  Retrieve Context     │      │  Generate     │      │            │
└──────────┘      └───────────────────────┘      └───────────────┘      └────────────┘
     │                      │                            │
     │         ┌────────────┴────────────┐               │
     │         ▼                         ▼               ▼
     │   ┌──────────┐            ┌─────────────┐  ┌─────────────┐
     │   │ ChromaDB │            │System Prompt│  │ Web Search  │
     │   │ Vectors  │            │+ Temperature│  │ Results     │
     │   └──────────┘            └─────────────┘  └─────────────┘
     │
     └────► Chat History (Conversation Memory)
```

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19 + Vite | UI Framework |
| **Drag & Drop** | @xyflow/react (React Flow) | Visual Workflow Builder |
| **Routing** | React Router DOM | Multi-page navigation |
| **Backend** | FastAPI (Python) | REST API Server |
| **Database** | PostgreSQL | Metadata, workflows, logs |
| **Vector Store** | ChromaDB | Document embeddings storage |
| **Embeddings** | sentence-transformers (all-MiniLM-L6-v2) | Local embedding generation |
| **LLM** | Google Gemini (gemini-2.5-flash) | Response generation |
| **Text Extraction** | PyMuPDF | PDF document parsing |
| **Web Search** | SerpAPI / Brave Search | Real-time web results |
| **Auth** | JWT + bcrypt | User authentication |
| **Containerization** | Docker + Docker Compose | Deployment |

---

## ✅ Features Implemented

### Core Requirements (All Implemented ✓)

| Feature | Status | Description |
|---------|--------|-------------|
| **User Query Component** | ✅ | Entry point for user questions, sends query to connected components |
| **Knowledge Base Component** | ✅ | PDF upload, text extraction (PyMuPDF), embeddings (sentence-transformers), ChromaDB storage, RAG retrieval |
| **LLM Engine Component** | ✅ | Gemini integration, custom prompts, temperature control, web search option, context from KB |
| **Output Component** | ✅ | Displays responses in chat interface, supports follow-up questions |
| **Workflow Builder Canvas** | ✅ | React Flow with drag-drop, connections, zoom/pan |
| **Component Library Panel** | ✅ | Lists all 4 components, draggable to canvas |
| **Configuration Panel** | ✅ | Dynamic config per component (model, prompts, API keys, toggles) |
| **Build Stack** | ✅ | Validates workflow before execution |
| **Chat with Stack** | ✅ | Chat modal for query interaction |
| **Docker Containerization** | ✅ | Dockerfiles + docker-compose for all services |

### Optional Features Implemented ✓

| Feature | Status | Description |
|---------|--------|-------------|
| **User Authentication** | ✅ | JWT-based login/register with bcrypt password hashing |
| **Workflow Saving/Loading** | ✅ | Persist and retrieve workflows from PostgreSQL |
| **Chat History Persistence** | ✅ | Store conversation history per workflow in database |
| **Execution Logs** | ✅ | Structured logging of each workflow step with timing |
| **Dashboard** | ✅ | View, create, delete, and manage saved workflows |
| **Multi-user Support** | ✅ | Each user has isolated workflows and chat history |

### Not Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Kubernetes Deployment | ❌ | Optional in assignment |
| Prometheus/Grafana Monitoring | ❌ | Optional in assignment |
| ELK Stack Logging | ❌ | Optional in assignment |
| OpenAI GPT Integration | ❌ | Using Gemini instead (assignment allowed either) |
| Real-time Progress Indicators | ❌ | Logs available post-execution |

---

## 🚀 Setup & Run Instructions

### Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.10+ (for backend)
- **Docker** & **Docker Compose** (for containerized setup)
- **PostgreSQL** database (or use Docker)
- **API Keys**: Gemini API key (required), SerpAPI/Brave (optional)

---

### Option 1: Docker (Recommended)

The easiest way to run the complete stack with all dependencies.

#### 1. Clone and Configure

```bash
cd "Full stack"


#### 2. Build and Run All Services

```bash
docker-compose up --build
```

This starts:
- **PostgreSQL** on port `5432`
- **Backend (FastAPI)** on port `8000`  
- **Frontend (Nginx)** on port `80`

#### 3. Access the Application

- **Frontend**: http://localhost
- **Backend API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

#### 4. Stop Services

```bash
docker-compose down

# To remove all data volumes:
docker-compose down -v
```

---

### Option 2: Terminal (Local Development)

Run each service separately for development with hot reload.

#### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add:
#   DATABASE_URL=postgresql://user:password@localhost:5432/workflow_db
#   GEMINI_API_KEY=your_key_here
#   SERP_API_KEY=optional
#   BRAVE_API_KEY=optional

# Run the server (with hot reload)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: **http://localhost:8000**

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend runs at: **http://localhost:5173**

#### Database Setup (Local PostgreSQL)

If not using Docker, ensure PostgreSQL is running:

```sql
-- Create database
CREATE DATABASE workflow_db;

-- Create user (if needed)
CREATE USER myuser WITH PASSWORD 'mypassword';
GRANT ALL PRIVILEGES ON DATABASE workflow_db TO myuser;
```

The backend will auto-create tables on startup.

---

## 📁 Project Structure

```
Full stack/
├── docker-compose.yml          # Multi-container orchestration
├── README.md                   # This file
│
├── backend/                    # FastAPI Backend
│   ├── Dockerfile
│   ├── main.py                 # App entry point
│   ├── config.py               # Settings management
│   ├── database.py             # SQLAlchemy setup
│   ├── requirements.txt
│   ├── .env.example
│   │
│   ├── models/                 # SQLAlchemy Models
│   │   ├── user.py             # User model
│   │   ├── workflow.py         # Workflow model
│   │   ├── document.py         # Document model
│   │   ├── chat.py             # Chat log model
│   │   └── execution_log.py    # Execution log model
│   │
│   ├── routers/                # API Endpoints
│   │   ├── auth.py             # /api/auth/*
│   │   ├── documents.py        # /api/documents/*
│   │   ├── workflows.py        # /api/workflows/*
│   │   └── chat.py             # /api/chat/*
│   │
│   ├── services/               # Business Logic
│   │   ├── auth.py             # JWT, password hashing
│   │   ├── llm.py              # Gemini LLM integration
│   │   ├── embedding.py        # Embedding service
│   │   ├── local_embedding.py  # sentence-transformers
│   │   ├── vector_store.py     # ChromaDB operations
│   │   ├── text_extractor.py   # PyMuPDF extraction
│   │   ├── web_search.py       # SerpAPI/Brave
│   │   └── execution_logger.py # Structured logging
│   │
│   └── engine/                 # Workflow Execution
│       └── executor.py         # Workflow orchestration
│
└── frontend/                   # React Frontend
    ├── Dockerfile
    ├── nginx.conf              # Production config
    ├── package.json
    ├── vite.config.js
    │
    └── src/
        ├── App.jsx             # Main app component
        ├── main.jsx            # Entry point
        ├── index.css           # Global styles
        │
        ├── api/                # API client
        │   └── client.js
        │
        ├── context/            # React Context
        │   └── AuthContext.jsx
        │
        ├── pages/              # Route Pages
        │   ├── Dashboard.jsx   # Workflow management
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   └── WorkflowBuilder.jsx
        │
        ├── components/         # Reusable Components
        │   ├── ChatModal.jsx
        │   ├── ComponentLibrary.jsx
        │   ├── ConfigPanel.jsx
        │   ├── Header.jsx
        │   ├── WorkflowCanvas.jsx
        │   └── ProtectedRoute.jsx
        │
        └── nodes/              # Custom React Flow Nodes
            ├── UserQueryNode.jsx
            ├── KnowledgeBaseNode.jsx
            ├── LLMEngineNode.jsx
            └── OutputNode.jsx
```

---

## 🔗 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user info |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload and process PDF |
| GET | `/api/documents` | List all documents |
| DELETE | `/api/documents/{id}` | Delete a document |

### Workflows
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workflows` | Create new workflow |
| GET | `/api/workflows` | List user's workflows |
| GET | `/api/workflows/{id}` | Get workflow details |
| PUT | `/api/workflows/{id}` | Update workflow |
| DELETE | `/api/workflows/{id}` | Delete workflow |

### Chat & Execution
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/execute` | Execute workflow with query |
| GET | `/api/chat/history/{workflow_id}` | Get chat history |
| DELETE | `/api/chat/history/{workflow_id}` | Clear chat history |
| GET | `/api/chat/logs/{execution_id}` | Get execution logs |

---

## ⚙️ Environment Variables

### Backend (.env)

```env
# Required
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Storage (defaults shown)
CHROMA_PERSIST_DIR=./chroma_data
UPLOAD_DIR=./uploads
```

---

## 🎯 Usage Guide

### 1. Create Account & Login
Register a new account or login with existing credentials.

### 2. Create a Workflow
- Click **"New Workflow"** from Dashboard
- Drag components from the left panel onto the canvas:
  - **User Query** → Entry point
  - **Knowledge Base** → For RAG (optional)
  - **LLM Engine** → AI processing
  - **Output** → Display results

### 3. Connect Components
Draw connections between nodes to define the flow:
```
User Query → Knowledge Base → LLM Engine → Output
```
or without KB:
```
User Query → LLM Engine → Output
```

### 4. Configure Components
Click a node to open its configuration:
- **LLM Engine**: Set Gemini API key, model, custom prompt, temperature, enable web search
- **Knowledge Base**: Upload PDFs for RAG

### 5. Build & Chat
- Click **"Build Stack"** to validate the workflow
- Click **"Chat with Stack"** to open the chat interface
- Ask questions and get AI-powered responses!

---

## 📜 License

MIT License
