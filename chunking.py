import spacy
import tiktoken


"""
Install dependencies in your Lambda layer; 
package these libraries in a Lambda layer or use a container-based approach.

spaCy (for sentence splitting)
tiktoken or a similar library to count tokens (OpenAI’s tiktoken is used for GPT-based token counting)

pip install spacy tiktoken
python -m spacy download en_core_web_sm
"""

# Initialize spaCy for sentence detection
nlp = spacy.load("en_core_web_sm")

# Initialize a GPT-style tokenizer (example using 'cl100k_base' for gpt-3.5-ish tokenization)
# If you have a different model in mind, adjust accordingly.
tokenizer = tiktoken.get_encoding("cl100k_base")

def sentence_token_chunker(text: str, max_tokens: int = 500, overlap_tokens: int = 50) -> list:
    """
    Splits text into sentences using spaCy, then groups sentences into chunks 
    where each chunk has up to `max_tokens` tokens (as counted by tiktoken). 
    Overlaps consecutive chunks by `overlap_tokens`.
    
    :param text: The full text to be chunked.
    :param max_tokens: Approx. maximum tokens per chunk.
    :param overlap_tokens: Number of tokens that overlap between consecutive chunks.
    :return: List of text chunks.
    """
    doc = nlp(text)
    sentences = [sent.text.strip() for sent in doc.sents if sent.text.strip()]
    
    chunks = []
    current_chunk = []
    current_count = 0

    for sentence in sentences:
        # Tokenize the sentence
        token_count = len(tokenizer.encode(sentence))
        
        # If adding this sentence exceeds max_tokens, close off the current chunk
        if current_count + token_count > max_tokens and current_chunk:
            # Finalize the current chunk
            chunk_text = " ".join(current_chunk)
            chunks.append(chunk_text)
            
            # Start a new chunk, but first handle overlap
            if overlap_tokens > 0:
                # Overlap the last `overlap_tokens` from previous chunk
                overlap_chunk = handle_overlap(chunk_text, overlap_tokens)
                current_chunk = [overlap_chunk] if overlap_chunk else []
                current_count = len(tokenizer.encode(overlap_chunk)) if overlap_chunk else 0
            else:
                current_chunk = []
                current_count = 0
        
        # Add the sentence to the current chunk
        current_chunk.append(sentence)
        current_count += token_count
    
    # Add the final chunk if anything remains
    if current_chunk:
        chunks.append(" ".join(current_chunk))
    
    return chunks

def handle_overlap(full_chunk_text: str, overlap_tokens: int) -> str:
    """
    Takes the full chunk text, re-tokenizes it, and returns the last `overlap_tokens` 
    portion as text, to be appended to the next chunk for continuity.
    """
    encoded = tokenizer.encode(full_chunk_text)
    if len(encoded) <= overlap_tokens:
        # If the entire chunk is fewer than overlap_tokens, just return it all
        return full_chunk_text
    else:
        # Extract the last `overlap_tokens` tokens and decode
        overlap_slice = encoded[-overlap_tokens:]
        return tokenizer.decode(overlap_slice)

def lambda_handler_chunking(event, context):
    """
    AWS Lambda handler (example):
    1. Receives 'text' from the event payload.
    2. Chunks the text by sentences/tokens.
    3. Returns the list of chunks.
    """
    text = event.get("text", "")
    max_tokens = event.get("max_tokens", 500)
    overlap_tokens = event.get("overlap_tokens", 50)
    
    chunks = sentence_token_chunker(text, max_tokens, overlap_tokens)
    
    return {
        "statusCode": 200,
        "body": {
            "chunks": chunks
        }
    }
