import fitz  # PyMuPDF
from typing import List
import os


class TextExtractor:
    """Service for extracting text from documents"""
    
    SUPPORTED_EXTENSIONS = ['.pdf', '.txt', '.md']
    
    def extract_from_pdf(self, file_path: str) -> str:
        """Extract text from a PDF file"""
        text_content = []
        
        try:
            doc = fitz.open(file_path)
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text_content.append(page.get_text())
            doc.close()
        except Exception as e:
            raise Exception(f"Error extracting text from PDF: {str(e)}")
        
        return "\n".join(text_content)
    
    def extract_from_txt(self, file_path: str) -> str:
        """Extract text from a text file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            raise Exception(f"Error reading text file: {str(e)}")
    
    def extract(self, file_path: str) -> str:
        """Extract text from a file based on its extension"""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        _, ext = os.path.splitext(file_path)
        ext = ext.lower()
        
        if ext == '.pdf':
            return self.extract_from_pdf(file_path)
        elif ext in ['.txt', '.md']:
            return self.extract_from_txt(file_path)
        else:
            raise ValueError(f"Unsupported file type: {ext}")
    
    def chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Split text into overlapping chunks for embedding"""
        if not text:
            return []
        
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = start + chunk_size
            chunk = text[start:end]
            
            # Try to break at sentence boundary
            if end < text_length:
                last_period = chunk.rfind('.')
                last_newline = chunk.rfind('\n')
                break_point = max(last_period, last_newline)
                
                if break_point > chunk_size // 2:
                    chunk = text[start:start + break_point + 1]
                    end = start + break_point + 1
            
            chunks.append(chunk.strip())
            start = end - overlap
        
        return [c for c in chunks if c]  # Remove empty chunks
