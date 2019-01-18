ENDPOINT=https://ekirmip83c.execute-api.us-west-2.amazonaws.com/prod/HelloLambda

curl \
	-XPOST \
	-H "Content-Type: application/json" \
	-d "{\"name\": \"User\"}" \
	"${ENDPOINT}?key1=KEY1&key2=KEY2&key3=KEY3"

#curl \
#	-XPOST \
#	-H "Content-Type: application/json" \
#	--data-binary '{"searchString":"fango","includeGroups":true}' \
#	"${ENDPOINT}?key1=KEY1&key2=KEY2&key3=KEY3"
#
#
#