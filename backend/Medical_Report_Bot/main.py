from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from contextlib import asynccontextmanager
from PIL import Image
import io
import os
import uuid
import base64
import tempfile
from typing import Dict, Any, List, Optional
import uvicorn
from datetime import datetime
import logging
from pathlib import Path

# Document processing imports
from unstructured.partition.pdf import partition_pdf
from unstructured.partition.docx import partition_docx
from unstructured.partition.html import partition_html
from unstructured.partition.text import partition_text

# RAG and AI imports
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Try new imports first, fallback to legacy if needed
try:
    from langchain_community.vectorstores import Chroma
    from langchain_community.storage import InMemoryStore
    from langchain_community.retrievers.multi_vector import MultiVectorRetriever
except ImportError:
    from langchain.vectorstores import Chroma
    from langchain.storage import InMemoryStore
    from langchain.retrievers.multi_vector import MultiVectorRetriever

try:
    from langchain_core.documents import Document
except ImportError:
    from langchain.schema.document import Document

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.messages import HumanMessage

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables
llm = None
embeddings = None
vectorstore = None
retriever = None

# Configuration
SUPPORTED_FORMATS = ['.pdf', '.docx', '.txt', '.html']
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
UPLOAD_DIR = "uploads"
CHROMA_DB_DIR = "chroma_db"

# Ensure directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(CHROMA_DB_DIR, exist_ok=True)

def initialize_ai_components():
    """Initialize AI components for document analysis"""
    global llm, embeddings, vectorstore, retriever
    
    try:
        # Initialize LLM
        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            groq_api_key=os.getenv("GROQ_API_KEY"),
        )
        
        # Initialize embeddings
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True}
        )
        
        # Initialize vectorstore
        vectorstore = Chroma(
            collection_name="medical_documents",
            embedding_function=embeddings,
            persist_directory=CHROMA_DB_DIR
        )
        
        # Initialize retriever
        store = InMemoryStore()
        retriever = MultiVectorRetriever(
            vectorstore=vectorstore,
            docstore=store,
            id_key="doc_id",
        )
        
        logger.info("✓ AI components initialized successfully")
        
    except Exception as e:
        logger.error(f"Error initializing AI components: {e}")
        # Set to None to indicate failure
        llm = embeddings = vectorstore = retriever = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup
    logger.info("Starting Medical Document Analysis API...")
    initialize_ai_components()
    yield
    # Shutdown
    logger.info("Shutting down Medical Document Analysis API...")

app = FastAPI(
    title="Medical Document Analysis API",
    description="AI-powered medical document analysis with table, image, and text extraction",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def validate_file(file: UploadFile) -> bool:
    """Validate uploaded file"""
    try:
        # Check file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in SUPPORTED_FORMATS:
            return False
        
        # Check file size (this is approximate, actual size check happens during read)
        return True
    except Exception as e:
        logger.error(f"File validation error: {e}")
        return False

def save_uploaded_file(file_content: bytes, filename: str) -> str:
    """Save uploaded file temporarily"""
    try:
        file_id = str(uuid.uuid4())
        file_ext = Path(filename).suffix.lower()
        temp_filename = f"{file_id}{file_ext}"
        temp_path = os.path.join(UPLOAD_DIR, temp_filename)
        
        with open(temp_path, 'wb') as f:
            f.write(file_content)
        
        return temp_path
    except Exception as e:
        logger.error(f"Error saving file: {e}")
        raise HTTPException(status_code=500, detail="Failed to save uploaded file")

def extract_document_elements(file_path: str) -> Dict[str, Any]:
    """Extract elements from document using unstructured"""
    try:
        file_ext = Path(file_path).suffix.lower()
        
        # Choose appropriate partition function based on file type
        if file_ext == '.pdf':
            chunks = partition_pdf(
                filename=file_path,
                infer_table_structure=True,
                strategy="hi_res",
                extract_image_block_types=["Image"],
                extract_image_block_to_payload=True,
                chunking_strategy="by_title",
                max_characters=10000,
                combine_text_under_n_chars=2000,
                new_after_n_chars=6000,
                languages=["eng"]
            )
        elif file_ext == '.docx':
            chunks = partition_docx(
                filename=file_path,
                infer_table_structure=True,
                chunking_strategy="by_title",
                max_characters=10000,
                combine_text_under_n_chars=2000,
                new_after_n_chars=6000,
            )
        elif file_ext == '.html':
            chunks = partition_html(
                filename=file_path,
                chunking_strategy="by_title",
                max_characters=10000,
                combine_text_under_n_chars=2000,
                new_after_n_chars=6000,
            )
        elif file_ext == '.txt':
            chunks = partition_text(
                filename=file_path,
                chunking_strategy="by_title",
                max_characters=10000,
                combine_text_under_n_chars=2000,
                new_after_n_chars=6000,
            )
        else:
            raise ValueError(f"Unsupported file format: {file_ext}")
        
        # Separate elements by type
        tables = []
        texts = []
        images = []
        
        for chunk in chunks:
            if "Table" in str(type(chunk)):
                tables.append(chunk)
            elif "CompositeElement" in str(type(chunk)):
                texts.append(chunk)
        
        # Extract images from composite elements
        for chunk in chunks:
            if "CompositeElement" in str(type(chunk)):
                chunk_els = chunk.metadata.orig_elements
                for el in chunk_els:
                    if "Image" in str(type(el)):
                        if hasattr(el.metadata, 'image_base64') and el.metadata.image_base64:
                            images.append(el.metadata.image_base64)
        
        return {
            "tables": tables,
            "texts": texts,
            "images": images,
            "total_chunks": len(chunks)
        }
        
    except Exception as e:
        logger.error(f"Error extracting document elements: {e}")
        raise HTTPException(status_code=500, detail=f"Document extraction failed: {str(e)}")

def generate_summaries(elements: Dict[str, Any]) -> Dict[str, Any]:
    """Generate AI summaries for extracted elements"""
    try:
        if llm is None:
            logger.warning("LLM not available, skipping summary generation")
            return {
                "text_summaries": [],
                "table_summaries": [],
                "image_summaries": [],
                "error": "AI components not available"
            }
        
        # Text summarization prompt
        text_prompt = ChatPromptTemplate.from_template("""
        You are a medical document analyst. Summarize the following text content from a medical document.
        Focus on key medical information, diagnoses, treatments, and important findings.
        
        Text content: {element}
        
        Provide a concise but comprehensive summary:
        """)
        
        text_chain = {"element": lambda x: x} | text_prompt | llm | StrOutputParser()
        
        # Generate text summaries
        text_summaries = []
        if elements["texts"]:
            for text in elements["texts"]:
                try:
                    summary = text_chain.invoke(text.text)
                    text_summaries.append({
                        "original": str(text.text),
                        "summary": summary,
                        "metadata": convert_metadata_to_json(text.metadata if hasattr(text, 'metadata') else {})
                    })
                except Exception as e:
                    logger.error(f"Error summarizing text: {e}")
                    text_summaries.append({
                        "original": str(text.text),
                        "summary": "Summary generation failed",
                        "error": str(e)
                    })
        
        # Generate table summaries
        table_summaries = []
        if elements["tables"]:
            for table in elements["tables"]:
                try:
                    table_html = table.metadata.text_as_html if hasattr(table.metadata, 'text_as_html') else str(table)
                    summary = text_chain.invoke(table_html)
                    table_summaries.append({
                        "original": str(table_html),
                        "summary": summary,
                        "metadata": convert_metadata_to_json(table.metadata if hasattr(table, 'metadata') else {})
                    })
                except Exception as e:
                    logger.error(f"Error summarizing table: {e}")
                    table_summaries.append({
                        "original": str(table),
                        "summary": "Table summary generation failed",
                        "error": str(e)
                    })
        
        # Generate image summaries (if vision model is available)
        image_summaries = []
        for i, image_base64 in enumerate(elements["images"]):
            try:
                # For now, just provide metadata about images
                image_summaries.append({
                    "image_id": i + 1,
                    "base64": image_base64,
                    "summary": "Medical image extracted from document",
                    "format": "base64_encoded"
                })
            except Exception as e:
                logger.error(f"Error processing image {i}: {e}")
                image_summaries.append({
                    "image_id": i + 1,
                    "summary": "Image processing failed",
                    "error": str(e)
                })
        
        return {
            "text_summaries": text_summaries,
            "table_summaries": table_summaries,
            "image_summaries": image_summaries
        }
        
    except Exception as e:
        logger.error(f"Error generating summaries: {e}")
        return {
            "text_summaries": [],
            "table_summaries": [],
            "image_summaries": [],
            "error": str(e)
        }

def generate_comprehensive_report(elements: Dict[str, Any], summaries: Dict[str, Any], filename: str) -> Dict[str, Any]:
    """Generate a comprehensive medical document report"""
    try:
        # Document statistics
        stats = {
            "filename": filename,
            "total_elements": elements["total_chunks"],
            "text_sections": len(elements["texts"]),
            "tables_found": len(elements["tables"]),
            "images_found": len(elements["images"]),
            "processing_date": datetime.now().isoformat()
        }
        
        # Key findings extraction
        key_findings = []
        for text_summary in summaries.get("text_summaries", []):
            if "diagnosis" in text_summary.get("summary", "").lower() or \
               "finding" in text_summary.get("summary", "").lower() or \
               "result" in text_summary.get("summary", "").lower():
                key_findings.append(text_summary["summary"])
        
        # Medical terms extraction (simple keyword-based)
        medical_keywords = [
            "diagnosis", "treatment", "medication", "prescription", "symptom",
            "condition", "disease", "therapy", "surgery", "procedure",
            "test", "lab", "blood", "urine", "x-ray", "ct", "mri",
            "patient", "doctor", "physician", "hospital", "clinic"
        ]
        
        extracted_terms = set()
        for text in elements["texts"]:
            text_lower = text.text.lower()
            for keyword in medical_keywords:
                if keyword in text_lower:
                    extracted_terms.add(keyword)
        
        # Generate executive summary
        executive_summary = f"""
        Medical Document Analysis Report for {filename}
        
        Document Overview:
        - Total sections analyzed: {stats['text_sections']}
        - Tables extracted: {stats['tables_found']}
        - Images found: {stats['images_found']}
        - Medical terms identified: {len(extracted_terms)}
        
        Key Medical Topics Detected: {', '.join(sorted(extracted_terms)) if extracted_terms else 'None identified'}
        
        Processing completed on {datetime.now().strftime('%Y-%m-%d at %H:%M:%S')}
        """
        
        return {
            "executive_summary": executive_summary.strip(),
            "document_statistics": stats,
            "key_findings": key_findings[:5],  # Top 5 findings
            "medical_terms_detected": sorted(list(extracted_terms)),
            "detailed_analysis": {
                "text_analysis": summaries.get("text_summaries", []),
                "table_analysis": summaries.get("table_summaries", []),
                "image_analysis": summaries.get("image_summaries", [])
            },
            "recommendations": [
                "Review key findings section for important medical information",
                "Check table analysis for structured medical data",
                "Examine extracted images for visual medical information",
                "Consult with healthcare professionals for medical interpretation"
            ]
        }
        
    except Exception as e:
        logger.error(f"Error generating comprehensive report: {e}")
        return {
            "executive_summary": f"Error generating report for {filename}",
            "error": str(e),
            "document_statistics": {"filename": filename, "error": "Processing failed"}
        }

def cleanup_temp_file(file_path: str):
    """Clean up temporary file"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Cleaned up temporary file: {file_path}")
    except Exception as e:
        logger.error(f"Error cleaning up file {file_path}: {e}")

def convert_metadata_to_json(metadata):
    """Convert metadata to JSON-serializable format"""
    try:
        if hasattr(metadata, '__dict__'):
            metadata_dict = metadata.__dict__
        elif isinstance(metadata, dict):
            metadata_dict = metadata
        else:
            return {"raw": str(metadata)}
        
        # Convert non-serializable objects to strings
        json_safe_dict = {}
        for key, value in metadata_dict.items():
            if isinstance(value, (str, int, float, bool, type(None))):
                json_safe_dict[key] = value
            elif isinstance(value, (list, tuple)):
                json_safe_dict[key] = [str(item) for item in value]
            elif isinstance(value, dict):
                json_safe_dict[key] = convert_metadata_to_json(value)
            else:
                json_safe_dict[key] = str(value)
        
        return json_safe_dict
    except Exception as e:
        logger.error(f"Error converting metadata to JSON: {e}")
        return {"error": "metadata_conversion_failed", "raw": str(metadata)}

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Medical Document Analysis API",
        "description": "Upload medical documents to extract tables, images, and text with AI-powered analysis",
        "supported_formats": SUPPORTED_FORMATS,
        "max_file_size_mb": MAX_FILE_SIZE // (1024 * 1024),
        "endpoints": {
            "/analyze": "POST - Upload and analyze medical document",
            "/health": "GET - API health check",
            "/capabilities": "GET - API capabilities and status"
        },
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    ai_status = "available" if all([llm, embeddings, vectorstore, retriever]) else "limited"
    
    return {
        "status": "healthy",
        "ai_components": ai_status,
        "supported_formats": SUPPORTED_FORMATS,
        "max_file_size_mb": MAX_FILE_SIZE // (1024 * 1024),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/capabilities")
async def get_capabilities():
    """Get API capabilities and component status"""
    return {
        "document_processing": {
            "supported_formats": SUPPORTED_FORMATS,
            "max_file_size_mb": MAX_FILE_SIZE // (1024 * 1024),
            "extraction_features": [
                "Text extraction and chunking",
                "Table structure recognition",
                "Image extraction (PDF only)",
                "Metadata preservation"
            ]
        },
        "ai_analysis": {
            "llm_available": llm is not None,
            "embeddings_available": embeddings is not None,
            "vectorstore_available": vectorstore is not None,
            "features": [
                "Text summarization",
                "Table analysis",
                "Key findings extraction",
                "Medical term identification",
                "Comprehensive reporting"
            ]
        },
        "api_features": [
            "Real-time document processing",
            "Structured JSON responses",
            "Error handling and logging",
            "Temporary file management"
        ]
    }

@app.post("/analyze")
async def analyze_document(file: UploadFile = File(...)):
    """
    Analyze uploaded medical document and generate comprehensive report
    
    Returns:
        JSON response with extracted content, summaries, and analysis report
    """
    temp_file_path = None
    
    try:
        # Validate file
        if not validate_file(file):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file. Supported formats: {SUPPORTED_FORMATS}"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Check file size
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024 * 1024)}MB"
            )
        
        # Save file temporarily
        temp_file_path = save_uploaded_file(file_content, file.filename)
        
        logger.info(f"Processing document: {file.filename}")
        
        # Extract document elements
        elements = extract_document_elements(temp_file_path)
        
        # Generate summaries
        summaries = generate_summaries(elements)
        
        # Generate comprehensive report
        report = generate_comprehensive_report(elements, summaries, file.filename)
        
        # Prepare response with JSON-safe data
        response_data = {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "document_info": {
                "filename": file.filename,
                "size_bytes": len(file_content),
                "format": Path(file.filename).suffix.lower()
            },
            "extraction_results": {
                "total_chunks": elements["total_chunks"],
                "text_sections": len(elements["texts"]),
                "tables_found": len(elements["tables"]),
                "images_found": len(elements["images"])
            },
            "analysis_report": report,
            "raw_data": {
                "text_content": [
                    {
                        "text": str(text.text), 
                        "metadata": convert_metadata_to_json(text.metadata if hasattr(text, 'metadata') else {})
                    } for text in elements["texts"]
                ],
                "tables": [
                    {
                        "content": str(table), 
                        "metadata": convert_metadata_to_json(table.metadata if hasattr(table, 'metadata') else {})
                    } for table in elements["tables"]
                ],
                "images": [
                    {
                        "image_id": i+1, 
                        "base64": str(img) if img else None,
                        "size": len(str(img)) if img else 0
                    } for i, img in enumerate(elements["images"])
                ]
            } if elements["total_chunks"] > 0 else None
        }
        
        logger.info(f"Document analysis completed: {file.filename} - "
                   f"{elements['total_chunks']} chunks, {len(elements['texts'])} texts, "
                   f"{len(elements['tables'])} tables, {len(elements['images'])} images")
        
        return JSONResponse(content=response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during document analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Document analysis failed: {str(e)}")
    finally:
        # Clean up temporary file
        if temp_file_path:
            cleanup_temp_file(temp_file_path)

@app.post("/quick-extract")
async def quick_extract(file: UploadFile = File(...)):
    """
    Quick extraction without AI analysis - faster processing
    """
    temp_file_path = None
    
    try:
        # Validate and save file
        if not validate_file(file):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file. Supported formats: {SUPPORTED_FORMATS}"
            )
        
        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024 * 1024)}MB"
            )
        
        temp_file_path = save_uploaded_file(file_content, file.filename)
        
        # Extract elements only
        elements = extract_document_elements(temp_file_path)
        
        response_data = {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "document_info": {
                "filename": file.filename,
                "size_bytes": len(file_content),
                "format": Path(file.filename).suffix.lower()
            },
            "extraction_summary": {
                "total_chunks": elements["total_chunks"],
                "text_sections": len(elements["texts"]),
                "tables_found": len(elements["tables"]),
                "images_found": len(elements["images"])
            },
            "extracted_content": {
                "texts": [str(text.text) for text in elements["texts"]],
                "tables": [str(table) for table in elements["tables"]],
                "image_count": len(elements["images"]),
                "images_info": [
                    {
                        "image_id": i+1, 
                        "size": len(str(img)) if img else 0
                    } for i, img in enumerate(elements["images"])
                ]
            }
        }
        
        return JSONResponse(content=response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during quick extraction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Quick extraction failed: {str(e)}")
    finally:
        if temp_file_path:
            cleanup_temp_file(temp_file_path)

if __name__ == "__main__":
    print("Starting Medical Document Analysis API server...")
    print("Available endpoints:")
    print("  - http://localhost:8000/docs (API documentation)")
    print("  - http://localhost:8000/health (health check)")
    print("  - http://localhost:8000/analyze (full document analysis)")
    print("  - http://localhost:8000/quick-extract (quick extraction)")
    
    uvicorn.run(
        "main:app",
        host="localhost",
        port=8005,
        reload=True,
        log_level="info"
    )
