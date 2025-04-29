import requests
from requests.auth import HTTPBasicAuth
import uuid

def index_chunk(os_endpoint, index_name, text_chunk, vector, os_user=None, os_pass=None):
    """
    Indexes a single chunk and its embedding into OpenSearch.
    
    :param os_endpoint: e.g. https://my-opensearch-domain.us-east-1.es.amazonaws.com
    :param index_name: Name of the index (e.g. 'my-index')
    :param text_chunk: The chunk of text
    :param vector: The embedding (list of floats)
    :param os_user: Optional user for BasicAuth
    :param os_pass: Optional pass for BasicAuth
    :return: Response from OpenSearch
    """
    url = f"{os_endpoint}/{index_name}/_doc"
    headers = {"Content-Type": "application/json"}
    
    doc_id = str(uuid.uuid4())
    body = {
        "chunk_id": doc_id,
        "text": text_chunk,
        "embedding": vector
    }
    
    if os_user and os_pass:
        response = requests.post(url, headers=headers, json=body, auth=HTTPBasicAuth(os_user, os_pass))
    else:
        response = requests.post(url, headers=headers, json=body)
    
    response.raise_for_status()
    return response.json()
