# 1. Authenticated POST to /v1/fragments
POST http://localhost:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1
{ "service": "DynamoDB" }

# 2. Confirm that the server returns a 201
HTTP/1.1 201
[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.fragment.id"

# 3. GET the newly created fragment info
GET {{fragment1_url}}/info
[BasicAuth]
user1@email.com:password1

# Confirm that the server returns expected response
HTTP/1.1 200
Content-Type: application/json; charset=utf-8
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == {{fragment1_id}}
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.created" matches /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.updated" matches /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
jsonpath "$.fragment.type" == "application/json"
jsonpath "$.fragment.size" == 25

# 4. POST a second Markdown fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/markdown
[BasicAuth]
user1@email.com:password1
`DynamoDB is **great**.`

# 5. Confirm that the server returns a 201
HTTP/1.1 201
[Captures]
fragment2_url: header "Location"
fragment2_id: jsonpath "$.fragment.id"

# 6. GET the newly created fragment info
GET {{fragment2_url}}/info
[BasicAuth]
user1@email.com:password1

# Confirm that the server returns expected response
HTTP/1.1 200
Content-Type: application/json; charset=utf-8
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == {{fragment2_id}}
jsonpath "$.fragment.ownerId" matches "^[0-9a-fA-F]+$"
jsonpath "$.fragment.created" isString
jsonpath "$.fragment.created" matches /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
jsonpath "$.fragment.updated" isString
jsonpath "$.fragment.updated" matches /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
jsonpath "$.fragment.type" == "text/markdown"
jsonpath "$.fragment.size" == 22

# 7. GET all of the fragments for the same authorized user (no expanding)
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

# Confirm that the server returns expected response
HTTP/1.1 200
Content-Type: application/json; charset=utf-8
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments" includes {{fragment1_id}}
jsonpath "$.fragments" includes {{fragment2_id}}

# 8. DELETE the first fragment (json)
DELETE {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

# 9. Confirm that the server returns a 200
HTTP/1.1 200

# 10. Try to GET the first fragment (json), it should fail
GET {{fragment1_url}}
[BasicAuth]
user1@email.com:password1

# 11. Confirm that the server returns a 404
HTTP/1.1 404

# 12. GET all of the fragments for the same authorized user (no expanding)
GET http://localhost:8080/v1/fragments
[BasicAuth]
user1@email.com:password1

# Confirm that the first ID is NOT included, but that the second ID is
HTTP/1.1 200
Content-Type: application/json; charset=utf-8
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragments" not includes {{fragment1_id}}
jsonpath "$.fragments" includes {{fragment2_id}}
