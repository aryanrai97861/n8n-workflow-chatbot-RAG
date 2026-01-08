import requests
from typing import Optional, List, Dict
from config import settings


class WebSearchService:
    """Service for web search using SerpAPI or Brave Search"""
    
    def __init__(self, serp_api_key: str = None, brave_api_key: str = None):
        self.serp_api_key = serp_api_key or settings.SERP_API_KEY
        self.brave_api_key = brave_api_key or settings.BRAVE_API_KEY
    
    def configure(self, serp_api_key: str = None, brave_api_key: str = None):
        """Configure API keys"""
        if serp_api_key:
            self.serp_api_key = serp_api_key
        if brave_api_key:
            self.brave_api_key = brave_api_key
    
    def search_serpapi(self, query: str, num_results: int = 5) -> List[Dict]:
        """Search using SerpAPI"""
        if not self.serp_api_key:
            raise ValueError("SerpAPI key not configured")
        
        try:
            url = "https://serpapi.com/search"
            params = {
                "q": query,
                "api_key": self.serp_api_key,
                "num": num_results
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            results = []
            organic_results = data.get("organic_results", [])
            
            for result in organic_results[:num_results]:
                results.append({
                    "title": result.get("title", ""),
                    "link": result.get("link", ""),
                    "snippet": result.get("snippet", "")
                })
            
            return results
        except Exception as e:
            raise Exception(f"SerpAPI search error: {str(e)}")
    
    def search_brave(self, query: str, num_results: int = 5) -> List[Dict]:
        """Search using Brave Search API"""
        if not self.brave_api_key:
            raise ValueError("Brave API key not configured")
        
        try:
            url = "https://api.search.brave.com/res/v1/web/search"
            headers = {
                "Accept": "application/json",
                "Accept-Encoding": "gzip",
                "X-Subscription-Token": self.brave_api_key
            }
            params = {
                "q": query,
                "count": num_results
            }
            
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            results = []
            web_results = data.get("web", {}).get("results", [])
            
            for result in web_results[:num_results]:
                results.append({
                    "title": result.get("title", ""),
                    "link": result.get("url", ""),
                    "snippet": result.get("description", "")
                })
            
            return results
        except Exception as e:
            raise Exception(f"Brave search error: {str(e)}")
    
    def search(self, query: str, num_results: int = 5) -> str:
        """Search and return formatted results"""
        results = []
        
        # Try SerpAPI first, then Brave
        try:
            if self.serp_api_key:
                results = self.search_serpapi(query, num_results)
            elif self.brave_api_key:
                results = self.search_brave(query, num_results)
            else:
                return ""
        except Exception:
            # If one fails, try the other
            try:
                if self.brave_api_key:
                    results = self.search_brave(query, num_results)
            except Exception:
                return ""
        
        if not results:
            return ""
        
        # Format results as text
        formatted = []
        for i, r in enumerate(results, 1):
            formatted.append(f"{i}. {r['title']}\n   {r['snippet']}\n   Source: {r['link']}")
        
        return "\n\n".join(formatted)
