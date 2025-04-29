def knn_search_opensearch(os_endpoint, index_name, query_vector, k=5, os_user=None, os_pass=None):
    """
    Performs a KNN search on AWS OpenSearch for a given query vector.
    
    :param os_endpoint: e.g. https://my-opensearch-domain.us-east-1.es.amazonaws.com
    :param index_name: Name of the index
    :param query_vector: The embedding vector for the query
    :param k: Number of nearest neighbors to return
    :param os_user: Optional user for BasicAuth
    :param os_pass: Optional pass for BasicAuth
    :return: List of search hits from OpenSearch
    """
    url = f"{os_endpoint}/{index_name}/_search"
    headers = {"Content-Type": "application/json"}
    
    body = {
      "size": k,
      "query": {
        "knn": {
          "embedding": {
            "vector": query_vector,
            "k": k
          }
        }
      }
    }
    
    if os_user and os_pass:
        response = requests.post(url, headers=headers, json=body, auth=HTTPBasicAuth(os_user, os_pass))
    else:
        response = requests.post(url, headers=headers, json=body)
    
    response.raise_for_status()
    return response.json()

def lambda_handler_similarity(event, context):
    """
    AWS Lambda handler (example):
    1. Receives a user query.
    2. Gets query embedding from Bedrock.
    3. Searches OpenSearch for top-K results.
    4. Returns top-K similar chunks.
    """
    query = event.get("query", "")
    k = event.get("k", 5)
    
    # 1. Get query embedding
    bedrock_client = boto3.client('bedrock-runtime', region_name='us-east-1')
    query_vector = get_bedrock_embeddings(bedrock_client, [query])[0]  # from above embedding function
    
    # 2. Perform KNN search in OpenSearch
    os_endpoint = "https://my-opensearch-domain.us-east-1.es.amazonaws.com"
    index_name = "my-index"
    
    results = knn_search_opensearch(os_endpoint, index_name, query_vector, k=k)
    
    return {
        "statusCode": 200,
        "body": results
    }
