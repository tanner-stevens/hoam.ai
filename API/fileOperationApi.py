import requests
import base64


# API 1 test cases
# for file upload, query, download, delete
API_URL = "https://67a08egpff.execute-api.us-east-2.amazonaws.com/test/upload"
API_KEY = "N0I50xLGdz9LmOpHw32th8aN0nLnhhxW1vKLG5Q5"

headers_base = {
    'x-api-key': API_KEY
}


def upload_file(filename):
    with open(filename, "rb") as pdf_file:
        pdf_binary = pdf_file.read()

    headers = {
        **headers_base,
        'Content-Type': 'application/pdf',
        'filename': filename
    }

    response = requests.post(API_URL + "?action=upload",
                             headers=headers, data=pdf_binary)
    print("Upload Response:", response.status_code, response.text)


def list_files():

    response = requests.post(API_URL + "?action=list", headers=headers_base)
    print("List Response:", response.status_code)
    print("Files:", response.json())


def delete_file(filename):
    headers = {
        **headers_base,
        'filename': filename
    }
    response = requests.post(API_URL + "?action=delete", headers=headers)
    print("Delete Response:", response.status_code, response.text)


def download_file(filename, save_as):
    headers = {
        **headers_base,
        'filename': filename
    }
    response = requests.post(API_URL + "?action=download", headers=headers)

    if response.status_code == 200:
        response_json = response.json()
        encoded_data = response_json.get("body", "")
        with open(save_as, "wb") as f:
            f.write(base64.b64decode(encoded_data))
        print(f"Downloaded and saved as {save_as}")
    else:
        try:
            print("Download failed:", response.status_code, response.json())
        except Exception:
            print("Download failed:", response.status_code, response.text)


# upload_file("1.png")
# list_files()
# download_file("1.png", "downloaded.png")
#delete_file("1.png")

# upload_file("test.pdf")
# list_files()
# download_file("test.pdf", "downloaded.pdf")
# delete_file("test.pdf")


# API 2 test cases
# for getting user's questions and returning answers(Temporarily returns the same content as question for testing)
API_URL = "https://rgo89zwyke.execute-api.us-east-2.amazonaws.com/dev/ask"
API_KEY = "MqwABFGNhC4FF1Kqu2otv7ElRos1DbuS1FCkfuJx"

headers = {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
}

data = {
    "query": "This is my question!",
}

response = requests.post(API_URL, json=data, headers=headers)

print("Status Code:", response.status_code)
print("Response:", response.json())
