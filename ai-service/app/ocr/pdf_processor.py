import os
import re
from pypdf import PdfReader
from app.core.logging import logger
from app.core.exceptions import AIServiceException

class PDFProcessor:
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        if not os.path.exists(file_path):
            raise AIServiceException(f"PDF file not found at path: {file_path}")

        try:
            logger.info(f"Extracting text from PDF: {file_path}")
            reader = PdfReader(file_path)
            extracted_text = []

            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_text.append(page_text)

            full_text = "\n".join(extracted_text)
            
            # Clean up whitespace and character breaks
            cleaned_text = re.sub(r'([a-z])([A-Z])', r'\1 \2', full_text)
            cleaned_text = re.sub(r'(\w)([\.\!\?])', r'\1\2 ', cleaned_text)
            cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()

            logger.info(f"Successfully extracted {len(cleaned_text)} characters from {file_path}")
            return cleaned_text
        except Exception as e:
            logger.error(f"Failed to process PDF {file_path}: {str(e)}")
            raise AIServiceException(f"PDF parsing error: {str(e)}")

pdf_processor = PDFProcessor()
