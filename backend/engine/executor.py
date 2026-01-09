from typing import Dict, Any, List, Optional
from services.local_embedding import LocalEmbeddingService
from services.vector_store import VectorStoreService
from services.llm import LLMService
from services.web_search import WebSearchService
from services.execution_logger import ExecutionLogger


class WorkflowExecutor:
    """Executes a workflow based on node connections"""
    
    def __init__(self):
        self.embedding_service = LocalEmbeddingService()
        self.vector_store = VectorStoreService()
        self.llm_service = LLMService()
        self.web_search_service = WebSearchService()
    
    def execute(
        self, 
        workflow_definition: Dict[str, Any], 
        user_query: str, 
        config: Dict[str, Any], 
        chat_history: Optional[List[Dict]] = None,
        execution_id: Optional[str] = None,
        workflow_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Execute a workflow and return the final response with logs
        
        Args:
            workflow_definition: The workflow containing nodes and edges
            user_query: The user's input query
            config: Configuration including API keys and other settings
            chat_history: Previous conversation messages for context
            execution_id: UUID for grouping execution logs
            workflow_id: ID of the workflow being executed
        
        Returns:
            Dict containing 'response' and 'logs'
        """
        # Initialize logger
        logger = ExecutionLogger(execution_id or "unknown", workflow_id)
        
        nodes = workflow_definition.get("nodes", [])
        edges = workflow_definition.get("edges", [])
        
        logger.start_step("Workflow", f"Starting workflow execution with query: {user_query[:50]}...")
        
        # Build node map and adjacency list
        node_map = {node["id"]: node for node in nodes}
        adjacency = self._build_adjacency_list(edges)
        
        # Find the execution order
        execution_order = self._get_execution_order(nodes, edges)
        logger.info("Workflow", f"Execution order determined: {len(execution_order)} nodes", 
                   {"node_count": len(execution_order)})
        
        # Execute nodes in order
        context = {
            "query": user_query,
            "kb_contexts": [],
            "web_context": None,
            "response": None,
            "chat_history": chat_history or []
        }
        
        for node_id in execution_order:
            node = node_map.get(node_id)
            if not node:
                continue
            
            node_type = node.get("type")
            node_data = node.get("data", {})
            
            if node_type == "userQuery":
                logger.start_step("User Query", "Processing user input")
                query_template = node_data.get("queryTemplate", "")
                if query_template:
                    context["query_template"] = query_template
                    logger.info("User Query", "Query template applied", {"template_length": len(query_template)})
                logger.complete_step("User Query", f"Query received: {user_query[:50]}...")
            
            elif node_type == "knowledgeBase":
                kb_name = node_data.get("filename", "Unknown")
                logger.start_step("Knowledge Base", f"Querying: {kb_name}")
                
                kb_context = self._execute_knowledge_base(
                    node_data, 
                    context["query"],
                    config,
                    logger
                )
                if kb_context:
                    context["kb_contexts"].append({
                        "filename": kb_name,
                        "content": kb_context
                    })
                    logger.complete_step("Knowledge Base", f"Retrieved context from {kb_name}", 
                                        {"context_length": len(kb_context)})
                else:
                    logger.error_step("Knowledge Base", f"No context retrieved from {kb_name}")
            
            elif node_type == "llmEngine":
                model = node_data.get("model", "gemini-2.5-flash")
                logger.start_step("LLM Engine", f"Generating response using {model}")
                
                context["response"] = self._execute_llm_engine(
                    node_data,
                    context,
                    config,
                    logger
                )
                
                if context["response"] and not context["response"].startswith("Error"):
                    logger.complete_step("LLM Engine", "Response generated successfully",
                                        {"response_length": len(context["response"]), "model": model})
                else:
                    logger.error_step("LLM Engine", context["response"] or "Failed to generate response")
            
            elif node_type == "output":
                logger.start_step("Output", "Preparing final response")
                logger.complete_step("Output", "Response ready for display")
        
        logger.complete_step("Workflow", "Workflow execution completed")
        
        return {
            "response": context.get("response", "No response generated"),
            "logs": logger.get_logs()
        }
    
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
        in_degree = {node["id"]: 0 for node in nodes}
        adjacency = {}
        
        for edge in edges:
            source = edge.get("source")
            target = edge.get("target")
            in_degree[target] = in_degree.get(target, 0) + 1
            if source not in adjacency:
                adjacency[source] = []
            adjacency[source].append(target)
        
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
        config: Dict[str, Any],
        logger: ExecutionLogger
    ) -> Optional[str]:
        """Execute knowledge base retrieval"""
        collection_name = node_data.get("collectionName")
        
        if not collection_name:
            logger.error_step("Knowledge Base", "No collection name configured")
            return None
        
        try:
            logger.info("Knowledge Base", f"Generating embedding for query")
            query_embedding = self.embedding_service.generate_query_embedding(query)
            logger.info("Knowledge Base", f"Embedding generated", {"embedding_dim": len(query_embedding)})
            
            logger.info("Knowledge Base", f"Querying ChromaDB collection: {collection_name}")
            results = self.vector_store.query(
                collection_name=collection_name,
                query_embedding=query_embedding,
                n_results=5
            )
            
            documents = results.get("documents", [[]])[0]
            logger.info("Knowledge Base", f"Retrieved {len(documents)} chunks", {"chunk_count": len(documents)})
            
            if documents:
                context = "\n\n---\n\n".join(documents)
                return context
            
            return None
        except Exception as e:
            logger.error_step("Knowledge Base", f"Retrieval error: {str(e)}")
            return None
    
    def _execute_llm_engine(
        self,
        node_data: Dict[str, Any],
        context: Dict[str, Any],
        config: Dict[str, Any],
        logger: ExecutionLogger
    ) -> str:
        """Execute LLM generation"""
        api_key = node_data.get("apiKey") or config.get("geminiApiKey")
        model = node_data.get("model", "gemini-2.5-flash")
        prompt_template = node_data.get("prompt", "")
        temperature = float(node_data.get("temperature", 0.7))
        enable_web_search = node_data.get("enableWebSearch", False)
        serp_api_key = node_data.get("serpApiKey") or config.get("serpApiKey")
        
        self.llm_service.configure(api_key, model)
        
        # Prepare context - combine ALL knowledge base contexts
        combined_context = ""
        
        kb_contexts = context.get("kb_contexts", [])
        if kb_contexts:
            combined_context += "=== KNOWLEDGE BASE CONTEXTS ===\n\n"
            for i, kb in enumerate(kb_contexts, 1):
                combined_context += f"--- Document {i}: {kb['filename']} ---\n"
                combined_context += kb['content']
                combined_context += "\n\n"
            logger.info("LLM Engine", f"Using context from {len(kb_contexts)} knowledge base(s)",
                       {"kb_count": len(kb_contexts), "context_length": len(combined_context)})
        
        # Web search if enabled
        web_results = ""
        if enable_web_search and serp_api_key:
            try:
                logger.info("LLM Engine", "Performing web search")
                self.web_search_service.configure(serp_api_key=serp_api_key)
                web_results = self.web_search_service.search(context["query"])
                logger.info("LLM Engine", "Web search completed", {"results_length": len(web_results)})
            except Exception as e:
                logger.error_step("LLM Engine", f"Web search failed: {str(e)}")
        
        system_prompt = prompt_template if prompt_template else None
        chat_history = context.get("chat_history", [])
        query_template = context.get("query_template", "")
        
        final_query = context["query"]
        if query_template:
            combined_context = f"=== USER QUERY TEMPLATE ===\n{query_template}\n\n{combined_context}"
        
        logger.info("LLM Engine", f"Sending request to {model}", 
                   {"has_context": bool(combined_context), 
                    "has_web_results": bool(web_results),
                    "chat_history_length": len(chat_history)})
        
        try:
            if web_results:
                response = self.llm_service.generate_with_web_context(
                    query=context["query"],
                    web_results=web_results,
                    context=combined_context if combined_context else None,
                    system_prompt=system_prompt,
                    temperature=temperature,
                    chat_history=chat_history
                )
            else:
                response = self.llm_service.generate_response(
                    query=context["query"],
                    context=combined_context if combined_context else None,
                    system_prompt=system_prompt,
                    temperature=temperature,
                    chat_history=chat_history
                )
            
            return response
        except Exception as e:
            return f"Error generating response: {str(e)}"
