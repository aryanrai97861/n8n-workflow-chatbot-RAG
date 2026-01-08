from typing import Dict, Any, List, Optional
from services.local_embedding import LocalEmbeddingService
from services.vector_store import VectorStoreService
from services.llm import LLMService
from services.web_search import WebSearchService


class WorkflowExecutor:
    """Executes a workflow based on node connections"""
    
    def __init__(self):
        self.embedding_service = LocalEmbeddingService()
        self.vector_store = VectorStoreService()
        self.llm_service = LLMService()
        self.web_search_service = WebSearchService()
    
    def execute(self, workflow_definition: Dict[str, Any], user_query: str, config: Dict[str, Any]) -> str:
        """
        Execute a workflow and return the final response
        
        Args:
            workflow_definition: The workflow containing nodes and edges
            user_query: The user's input query
            config: Configuration including API keys and other settings
        
        Returns:
            The final response string
        """
        nodes = workflow_definition.get("nodes", [])
        edges = workflow_definition.get("edges", [])
        
        # Build node map and adjacency list
        node_map = {node["id"]: node for node in nodes}
        adjacency = self._build_adjacency_list(edges)
        
        # Find the execution order
        execution_order = self._get_execution_order(nodes, edges)
        
        # Execute nodes in order
        context = {
            "query": user_query,
            "kb_context": None,
            "web_context": None,
            "response": None
        }
        
        for node_id in execution_order:
            node = node_map.get(node_id)
            if not node:
                continue
            
            node_type = node.get("type")
            node_data = node.get("data", {})
            
            if node_type == "userQuery":
                # User query is the entry point - query already in context
                pass
            
            elif node_type == "knowledgeBase":
                context["kb_context"] = self._execute_knowledge_base(
                    node_data, 
                    context["query"],
                    config
                )
            
            elif node_type == "llmEngine":
                context["response"] = self._execute_llm_engine(
                    node_data,
                    context,
                    config
                )
            
            elif node_type == "output":
                # Output node - just return the response
                pass
        
        return context.get("response", "No response generated")
    
    def _build_adjacency_list(self, edges: List[Dict]) -> Dict[str, List[str]]:
        """Build adjacency list from edges"""
        adjacency = {}
        for edge in edges:
            source = edge.get("source")
            target = edge.get("target")
            if source not in adjacency:
                adjacency[source] = []
            adjacency[source].append(target)
        return adjacency
    
    def _get_execution_order(self, nodes: List[Dict], edges: List[Dict]) -> List[str]:
        """Determine execution order using topological sort"""
        # Build in-degree map
        in_degree = {node["id"]: 0 for node in nodes}
        adjacency = {}
        
        for edge in edges:
            source = edge.get("source")
            target = edge.get("target")
            in_degree[target] = in_degree.get(target, 0) + 1
            if source not in adjacency:
                adjacency[source] = []
            adjacency[source].append(target)
        
        # Start with nodes that have no incoming edges
        queue = [node_id for node_id, degree in in_degree.items() if degree == 0]
        execution_order = []
        
        while queue:
            current = queue.pop(0)
            execution_order.append(current)
            
            for neighbor in adjacency.get(current, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
        
        return execution_order
    
    def _execute_knowledge_base(
        self, 
        node_data: Dict[str, Any], 
        query: str,
        config: Dict[str, Any]
    ) -> Optional[str]:
        """Execute knowledge base retrieval"""
        collection_name = node_data.get("collectionName")
        api_key = node_data.get("apiKey") or config.get("geminiApiKey")
        
        if not collection_name:
            return None
        
        try:
            # Configure embedding service
            self.embedding_service.configure(api_key)
            
            # Generate query embedding
            query_embedding = self.embedding_service.generate_query_embedding(query)
            
            # Query vector store
            results = self.vector_store.query(
                collection_name=collection_name,
                query_embedding=query_embedding,
                n_results=5
            )
            
            # Format context from results
            documents = results.get("documents", [[]])[0]
            if documents:
                return "\n\n---\n\n".join(documents)
            
            return None
        except Exception as e:
            print(f"Knowledge base error: {str(e)}")
            return None
    
    def _execute_llm_engine(
        self,
        node_data: Dict[str, Any],
        context: Dict[str, Any],
        config: Dict[str, Any]
    ) -> str:
        """Execute LLM generation"""
        api_key = node_data.get("apiKey") or config.get("geminiApiKey")
        model = node_data.get("model", "gemini-2.0-flash")
        prompt_template = node_data.get("prompt", "")
        temperature = float(node_data.get("temperature", 0.7))
        enable_web_search = node_data.get("enableWebSearch", False)
        serp_api_key = node_data.get("serpApiKey") or config.get("serpApiKey")
        
        # Configure LLM service
        self.llm_service.configure(api_key, model)
        
        # Prepare context
        combined_context = ""
        
        # Add knowledge base context if available
        if context.get("kb_context"):
            combined_context += context["kb_context"]
        
        # Web search if enabled
        web_results = ""
        if enable_web_search and serp_api_key:
            try:
                self.web_search_service.configure(serp_api_key=serp_api_key)
                web_results = self.web_search_service.search(context["query"])
            except Exception as e:
                print(f"Web search error: {str(e)}")
        
        # Build system prompt
        system_prompt = prompt_template if prompt_template else None
        
        # Generate response
        try:
            if web_results:
                response = self.llm_service.generate_with_web_context(
                    query=context["query"],
                    web_results=web_results,
                    context=combined_context if combined_context else None,
                    system_prompt=system_prompt,
                    temperature=temperature
                )
            else:
                response = self.llm_service.generate_response(
                    query=context["query"],
                    context=combined_context if combined_context else None,
                    system_prompt=system_prompt,
                    temperature=temperature
                )
            
            return response
        except Exception as e:
            return f"Error generating response: {str(e)}"
