# Authenticated POST to /v1/fragments
POST http://localhost:8080/v1/fragments
# Sending a plain text fragment
Content-Type: text/plain; charset=utf-8
# Include HTTP Basic Auth credentials
[BasicAuth]
user1@email.com:password1
# Body of the request goes in ```...``` when it's a string
```Hello S3!```

# We expect to get back an HTTP 201
HTTP/1.1 201
[Captures]
url: header "Location"

# Try to GET the fragment we just posted by its URL
GET {{url}}
[BasicAuth]
user1@email.com:password1

# Confirm that the server returns expected result
HTTP/1.1 200
Content-Type: text/plain; charset=utf-8
Content-Length: 9
```Hello S3!```

# Try to DELETE just posted fragment using the same URL
DELETE {{url}}
[BasicAuth]
user1@email.com:password1

# Confirm that the server returns 200
HTTP/1.1 200

# Try to GET the fragment again
GET {{url}}
[BasicAuth]
user1@email.com:password1

# Confirm that the server returns 404
HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
jsonpath "$.error.message" == "Unknown Fragment"
