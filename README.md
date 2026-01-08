# GenAI Stack - No-Code Workflow Builder

A visual drag-and-drop workflow builder that enables users to create intelligent workflows using LLM, Knowledge Base, and Web Search components.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌──────────────┐ ┌──────────────────┐ ┌─────────────────┐      │
│  │  Component   │ │  React Flow      │ │  Config Panel   │      │
│  │  Library     │ │  Canvas          │ │                 │      │
│  └──────────────┘ └──────────────────┘ └─────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              │ API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Backend (FastAPI)                          │
│  ┌──────────────┐ ┌──────────────────┐ ┌─────────────────┐      │
│  │  Documents   │ │  Workflow        │ │  Chat/Execute   │      │
│  │  Router      │ │  Router          │ │  Router         │      │
│  └──────────────┘ └──────────────────┘ └─────────────────┘      │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Services                               │   │
│  │  Text Extractor │ Embeddings │ Vector Store │ LLM │ Search│   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
  ┌──────────┐          ┌──────────┐          ┌──────────┐
  │PostgreSQL│          │ChromaDB  │          │Gemini API│
  └──────────┘          └──────────┘          └──────────┘
```

## Tech Stack

- **Frontend**: React + Vite + React Flow
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL (Neon)
- **Vector Store**: ChromaDB
- **LLM**: Google Gemini
- **Web Search**: SerpAPI / Brave

## Setup Instructions

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL database (or Neon account)
- Gemini API key

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# - DATABASE_URL: Your Neon PostgreSQL URL
# - GEMINI_API_KEY: Your Gemini API key

# Run the server
python main.py
```

Backend runs at: http://localhost:8000

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend runs at: http://localhost:5173

## Usage

1. **Drag Components** - Drag components from the left panel onto the canvas
2. **Connect Nodes** - Draw connections between components
3. **Configure** - Click a node to configure its settings
4. **Build Stack** - Click "Build Stack" to validate the workflow
5. **Chat** - Click "Chat with Stack" to interact with your workflow

## Core Components

| Component | Description |
|-----------|-------------|
| **User Query** | Entry point for user questions |
| **Knowledge Base** | Upload documents, generates embeddings, retrieves context |
| **LLM Engine** | Processes queries with Gemini, optional web search |
| **Output** | Displays the final response |

## API Endpoints

### Documents
- `POST /api/documents/upload` - Upload and process document
- `GET /api/documents` - List documents
- `DELETE /api/documents/{id}` - Delete document

### Workflows
- `POST /api/workflows` - Create workflow
- `GET /api/workflows` - List workflows
- `PUT /api/workflows/{id}` - Update workflow
- `DELETE /api/workflows/{id}` - Delete workflow

### Chat
- `POST /api/chat/execute` - Execute workflow with query
- `GET /api/chat/history/{workflow_id}` - Get chat history

## Environment Variables

```env
DATABASE_URL=postgresql://...
GEMINI_API_KEY=your_key
SERP_API_KEY=optional
BRAVE_API_KEY=optional
```

## License

MIT
