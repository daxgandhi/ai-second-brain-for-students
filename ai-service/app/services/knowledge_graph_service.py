import json
import re
from app.services.llm_service import llm_service
from app.utils.prompt_loader import get_prompt
from app.schemas.knowledge_graph import (
    KnowledgeGraphRequest,
    KnowledgeGraphResponse,
    KnowledgeGraphNode,
    KnowledgeGraphEdge,
    AskGraphRequest,
    AskGraphResponse,
    GraphInsightsRequest,
    GraphInsightsResponse,
    ConceptExplanationRequest,
    ConceptExplanationResponse
)
from app.core.logging import logger


class KnowledgeGraphService:
    async def generate_graph(self, request: KnowledgeGraphRequest) -> KnowledgeGraphResponse:
        logger.info(f"Generating knowledge graph for: {request.title}")

        # Trim very long texts to avoid token limits (keep first 4000 chars)
        text_snippet = request.text[:4000] if len(request.text) > 4000 else request.text

        prompt = get_prompt("knowledge_graph", text=text_snippet)
        raw_response = await llm_service.generate_completion(prompt)

        nodes = []
        edges = []
        title = request.title

        try:
            # Strip any markdown code fences if present
            cleaned = re.sub(r"```(?:json)?", "", raw_response).strip()
            # Extract the JSON object
            json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group(0))
                title = parsed.get("title", request.title)

                for n in parsed.get("nodes", []):
                    nodes.append(KnowledgeGraphNode(
                        id=str(n.get("id", "")),
                        label=n.get("label", "Unknown"),
                        group=n.get("group", "sub"),
                        description=n.get("description", "")
                    ))

                for e in parsed.get("edges", []):
                    edges.append(KnowledgeGraphEdge(**{
                        "from": str(e.get("from", "")),
                        "to": str(e.get("to", "")),
                        "label": e.get("label", "relates to")
                    }))

        except Exception as ex:
            logger.warning(f"Failed to parse knowledge graph JSON: {str(ex)}")
            logger.warning(f"Raw LLM response: {raw_response[:500]}")
            # Return a minimal fallback graph
            nodes = [
                KnowledgeGraphNode(id="1", label=request.title, group="main", description="Core topic from your notes."),
                KnowledgeGraphNode(id="2", label="Key Concept", group="sub", description="Primary concept extracted from notes."),
            ]
            edges = [
                KnowledgeGraphEdge(**{"from": "1", "to": "2", "label": "includes"})
            ]

        return KnowledgeGraphResponse(
            title=title,
            nodes=nodes,
            edges=edges,
            node_count=len(nodes),
            edge_count=len(edges)
        )

    async def ask_graph(self, request: AskGraphRequest) -> AskGraphResponse:
        logger.info(f"Answering graph question: {request.question}")
        prompt = get_prompt("ask_graph", graph_context=request.graph_context, question=request.question)
        answer = await llm_service.generate_completion(prompt)
        return AskGraphResponse(answer=answer.strip())

    async def generate_insights(self, request: GraphInsightsRequest) -> GraphInsightsResponse:
        logger.info("Generating AI insights for knowledge graph")
        prompt = get_prompt("graph_insights", graph_context=request.graph_context)
        raw_response = await llm_service.generate_completion(prompt)
        
        insights = []
        try:
            cleaned = re.sub(r"```(?:json)?", "", raw_response).strip()
            json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group(0))
                insights = parsed.get("insights", [])
        except Exception as ex:
            logger.warning(f"Failed to parse insights JSON: {str(ex)}")
            insights = ["The graph concepts are highly interconnected.", "Consider exploring the central concepts further."]
            
        # Fallback if no insights generated
        if not insights:
            insights = ["The graph concepts are highly interconnected."]
            
        return GraphInsightsResponse(insights=insights)

    async def explain_concept(self, request: ConceptExplanationRequest) -> ConceptExplanationResponse:
        logger.info(f"Explaining concept: {request.concept}")
        
        # Trim very long texts to avoid token limits (keep first 8000 chars)
        note_snippet = request.note_content[:8000] if len(request.note_content) > 8000 else request.note_content
        
        prompt = get_prompt("concept_explanation", 
                            concept=request.concept, 
                            graph_context=request.graph_context, 
                            note_content=note_snippet)
        
        raw_response = await llm_service.generate_completion(prompt)
        
        try:
            cleaned = re.sub(r"```(?:json)?", "", raw_response).strip()
            json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group(0))
                return ConceptExplanationResponse(
                    definition=parsed.get("definition", "Definition unavailable."),
                    simple_explanation=parsed.get("simple_explanation", "Explanation unavailable."),
                    from_notes=parsed.get("from_notes", "No specific context found.")
                )
        except Exception as ex:
            logger.warning(f"Failed to parse concept explanation JSON: {str(ex)}")
            
        # Fallback
        return ConceptExplanationResponse(
            definition="Unable to generate a definition.",
            simple_explanation="An error occurred while analyzing this concept.",
            from_notes="Unable to extract note context."
        )


knowledge_graph_service = KnowledgeGraphService()
