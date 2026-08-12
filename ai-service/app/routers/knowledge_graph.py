from fastapi import APIRouter
from app.schemas.knowledge_graph import (
    KnowledgeGraphRequest, KnowledgeGraphResponse,
    AskGraphRequest, AskGraphResponse,
    GraphInsightsRequest, GraphInsightsResponse,
    ConceptExplanationRequest, ConceptExplanationResponse
)
from app.services.knowledge_graph_service import knowledge_graph_service

router = APIRouter(prefix="/api/ai/knowledge-graph", tags=["Knowledge Graph"])

@router.post("/generate", response_model=KnowledgeGraphResponse)
async def generate_knowledge_graph(request: KnowledgeGraphRequest):
    """
    Generate an AI knowledge graph (nodes + edges) from study note text.
    Used by the frontend mindmap/knowledge graph visualizer.
    """
    return await knowledge_graph_service.generate_graph(request)

@router.post("/ask", response_model=AskGraphResponse)
async def ask_knowledge_graph(request: AskGraphRequest):
    """
    Answer a question based on the provided knowledge graph context.
    """
    return await knowledge_graph_service.ask_graph(request)

@router.post("/insights", response_model=GraphInsightsResponse)
async def generate_graph_insights(request: GraphInsightsRequest):
    """
    Generate insights for a given knowledge graph.
    """
    return await knowledge_graph_service.generate_insights(request)

@router.post("/concept/explain", response_model=ConceptExplanationResponse)
async def explain_concept(request: ConceptExplanationRequest):
    """
    Generate a detailed explanation of a specific concept based on the note context and knowledge graph.
    """
    return await knowledge_graph_service.explain_concept(request)
