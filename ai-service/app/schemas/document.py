from pydantic import BaseModel, Field
from typing import Optional

class DocumentProcessRequest(BaseModel):
    note_id: str = Field(..., description="MongoDB Note ID")
    title: str = Field(..., description="Document title")
    text_content: Optional[str] = Field(None, description="Pasted text or extracted PDF content")
    file_path: Optional[str] = Field(None, description="Path to uploaded PDF file on disk")

class DocumentProcessResponse(BaseModel):
    task_id: str
    status: str
    message: str
