from app.ocr.pdf_processor import pdf_processor

class OCRService:
    def process_pdf(self, file_path: str) -> str:
        return pdf_processor.extract_text_from_pdf(file_path)

ocr_service = OCRService()
