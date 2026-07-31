import re
from typing import List

class TextChunker:
    @staticmethod
    def chunk_text(text: str, size: int = 1000, overlap: int = 100) -> List[str]:
        if not text:
            return []

        text = re.sub(r'\s+', ' ', text).strip()
        if len(text) <= size:
            return [text]

        chunks = []
        i = 0
        while i < len(text):
            end_index = i + size
            if end_index >= len(text):
                chunks.append(text[i:])
                break

            cut_index = text.rfind('. ', i, end_index)
            if cut_index <= i:
                cut_index = text.rfind('\n', i, end_index)
            if cut_index <= i:
                cut_index = text.rfind(' ', i, end_index)

            if cut_index <= i:
                cut_index = end_index
            else:
                cut_index += 1

            chunk = text[i:cut_index].strip()
            if chunk:
                chunks.append(chunk)

            i = cut_index - overlap
            if i <= 0 or i <= (cut_index - size):
                i = cut_index

        return [c for c in chunks if len(c) > 0]

text_chunker = TextChunker()
