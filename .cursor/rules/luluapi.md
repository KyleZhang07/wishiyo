Getting Started

The Lulu Print API allows you to use Lulu as your production and fulfillment network. The API provides access to the same functionality that Lulu uses internally to normalize files and send Print-Jobs to our production partners around the world.

The Lulu Print API is a RESTful API that communicates with JSON encoded messages. Communication is secured with OpenID Connect and transport layer security (HTTPS).

Working with the API requires intermediate level programming skills and a general understanding of web APIs. Check out Lulu's printing and fulfillment options without having to do technical work upfront.
Registration

You have to create an account to start using the Lulu Print API. Your account will automatically receive a client-key and a client-secret.
Sandbox Environment

The API is available in a production and a sandbox environment. The sandbox can be used for development and testing purposes. Print-Jobs created on the sandbox will never be forwarded to a real production and can be paid for with test credit cards.

To access the sandbox, you have to create a separate account at https://developers.sandbox.lulu.com/.

The sandbox API endpoint URL is https://api.sandbox.lulu.com/.
Authorization

The Lulu API uses OpenID Connect, an authentication layer built on top of OAuth 2.0. Instead of exchanging username and password, the API uses JSON Web Token (JWT) to authorize client requests.

To interact with the API you need a client-key and a client-secret. Open the Client Keys & Secret (Sandbox) page to generate them.


Generate a Token

To interact with the API you first have to generate an OAuth token. This requires the following parameters:

client_key
client_secret
grant-type must be set to client_credentials
You have to send a POST request to the token endpoint a special Authorization header. For your convenience, you can copy the authorization string directly from your API Keys page:

curl -X POST https://api.lulu.com/auth/realms/glasstree/protocol/openid-connect/token \
  -d 'grant_type=client_credentials' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'Authorization: Basic ZjJjNDdmMTctOWMxZi00ZWZlLWIzYzEtMDI4YTNlZTRjM2M3OjMzOTViZGU4LTBkMjQtNGQ0Ny1hYTRjLWM4NGM3NjI0OGRiYw=='
The request will return a JSON response that contains an access_token key:

{
    "access_token":"eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkI...",
    "expires_in":3600,
    "refresh_expires_in":604800,
    "refresh_token":"eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6...",
    "token_type":"bearer",
    "not-before-policy":0,
    "session_state":"a856fb91-eafc-460e-8f6a-f09325062c88"
}
Store this access_token and use it to authorize all further requests. The token will expire after a few minutes, but you can always request a fresh token from the server as outlined above. We recommend to use an OAuth capable client lib in your favorite programming language to simplify working with client credentials and tokens. Some might even automatically refresh your token after it expired.
Make authenticated requests

To authenticate subsequent API requests, you must provide a valid access token in the HTTP header of the request: Authorization: Bearer {access_token}:

curl -X GET https://api.lulu.com/{some_api_endpoint}/ \
  -H 'Authorization: Bearer {access_token}' \
  -H 'Content-Type: application/json'
Select a Product

Lulu's Print API offers a wide range of products. Each product is represented by a 27 character code call pod_package_id:

Trim Size + Color + Print Quality + Bind + Paper + PPI + Finish + Linen + Foil = pod_package_id
Here are a few examples:

pod_package_id	Description
0850X1100BWSTDLW060UW444MNG	0850X1100: trim size 8.5” x 11”
BW: black-and-white
STD: standard quality
LW: linen wrap binding
060UW444: 60# uncoated white paper with a bulk of 444 pages per inch
M: matte cover coating
N: navy colored linen
G: golden foil stamping
0600X0900FCSTDPB080CW444GXX	0600X0900: trim size 6” x 9”
FC: full color
STD: standard quality
PB: perfect binding
080CW444: 80# coated white paper with a bulk of 444 ppi
G: gloss cover coating
X: no linen
X: no foil
0700X1000FCPRECO060UC444MXX	7" x 10" black-and-white premium coil-bound book printed on 60# cream paper with a matte cover
0600X0900BWSTDPB060UW444MXX	6" x 9" black-and-white standard quality paperback book printed on 60# white paper with a matte cover
Use the Pricing Calculator to input your product specifications and generate a SKU for your product. Once a price is calculated, the SKU will be available in the Your Selection area.

For a full listing of Lulu SKUs and product specification, download the Product Specification Sheet. Also, please download and review our Production Templates for additional guidance with formatting and file preparation. If you have general questions about which Lulu products are right for your business, please contact one of our experts through our Technical Support form.
Validate files

Validate interior file

Print API allows you to validate your interior file without creating a Print-Job. Interior validation requires publicly exposed URL to download and validate a file. File validation is being done asynchronously, it may take a while, so to retrieve validation result, use GET endpoint.

File validation result may return different statuses:

NULL - file validation is not started yet
VALIDATING - file validation is still running
VALIDATED - file validation finished without any errors
ERROR - file is invalid, list of errors is included in the response
Example reasons of ERROR status:

invalid PDF file
not enough pages - at least 2 pages are required
different sizes of pages
fonts not embedded
corrupted images
Applicable reasons should be included in errors field in the file validation response.

You can find the detailed endpoints documentation in interior validation section.

Calculate cover dimensions

You can also calculate required cover dimensions basing on interior data by using cover dimensions endpoint. This endpoint returns cover width and height in requested unit (print points by default).

Validate cover file

As it was possible with interior file, Print API also allows you to validate cover files. Just as interior validation, cover validation requires publicly exposed URL to download and validate a file. Other required attributes are POD package ID of your book and interior page count to correctly validate cover file. Also in this case, file validation is being done asynchronously, it may take a while, so to retrieve validation result, use GET endpoint.

File validation result may return different statuses:

NULL - file validation is not started yet
NORMALIZING - file validation is still running
NORMALIZED - file validation finished without any errors
ERROR - file is invalid, list of errors is included in the response
Example reasons of ERROR status:

invalid PDF file
invalid file size
Applicable reasons should be included in errors field in the file validation response.

You can find the detailed endpoints documentation in cover validation section.
Create a Print-Job

Now you can start to create Print-Jobs. A Print-Job request consists of at least three data fields:

line_items (required): the list of books that shall be printed
shipping_address (required): the (end) customer’s address where Lulu should send the books - including a phone number.
contact_email (required): an email address for questions regarding the Print-Job - normally, you want to use the email address of a developer or shop owner, not the end customer
shipping_level(required): Lulu offers five different quality levels for shipping:
MAIL - Slowest ship method. Depending on the destination, tracking might not be available.
PRIORITY_MAIL - priority mail shipping
GROUND - Courier based shipping using ground transportation in the US.
EXPEDITED - expedited (2nd day) delivery via air mail or equivalent
EXPRESS - overnight delivery. Fastest shipping available.
external_id (optional): a reference number to link the Print-Job to your system (e.g. your order number)
The shipping address must contain a phone number. This is required by our shipping carriers. If the shipping address does not contain a phone number, the default phone number from the account will be used. If neither the account nor the shipping address contain a phone number, the Print-Job can not be created.

You can find the detailed documentation for Creating a new Print-Job below.
Check Print-Job Status

After sending a Print-Job, you can check its status. Normally, a Print-Job goes through the following stages:


CREATED: Print-Job created
UNPAID: Print-Job can be paid
PAYMENT_IN_PROGRESS: Payment is in Progress
PRODUCTION_DELAYED: Print-Job is paid and will move to production after the mandatory production delay.
PRODUCTION_READY: Production delay has ended and the Print-Job will move to "in production" shortly.
IN_PRODUCTION: Print-Job submitted to printer
SHIPPED: Print-Job is fully shipped
There are a few more status that can occur when there is a problem with the Print-Job:

REJECTED: When there is a problem with the input data or the file, Lulu will reject a Print-Job with a detailed error message. Please contact our experts if you need help in resolving this issue.
CANCELED: You can cancel a Print-Job as long as it is “unpaid” using an API request to the status endpoint. In rare cases, Lulu might also cancel a Print-Job if a problem has surfaced in production and the order cannot be fulfilled.
Shipping Notification

Once an order has been shipped, Lulu will provide tracking information in the Print-Job and Print-Job Status endpoint. Example shipped response:

{
  "name": "SHIPPED",
  "message": "All line-items were shipped",
  "changed": "2024-04-10T09:28:34.870842Z",
  "line_item_statuses": [
    {
      "name": "SHIPPED",
      "messages": {
        "tracking_id": "3d4a53da-cc42-44c2-b47b-c3da8fa37491_1",
        "tracking_urls": [
          "https://api.sandbox.lulu.com/printer-wannabe-tracking/3d4a53da-cc42-44c2-b47b-c3da8fa37491_1"
        ],
        "carrier_name": "Carrier"
      },
      "line_item_id": 57999
    }
  ],
  "print_job_id": 42776
}
Webhooks

You can subscribe to receive webhooks on the following topics:

PRINT_JOB_STATUS_CHANGED
To subscribe to webhooks, create a webhook configuration by calling this endpoint. You have to select topics that you want to subscribe to and the URL where webhooks should be sent. You can create multiple webhooks, but the URL has to be unique for each of them.

Once you created a webhook configuration, you can retrieve a list of owned webhook or single webhook to check data:

id
topics
URL
is_active
It can be updated, for example, if you want to update the URL, list of subscribed topics or activate it after automatic deactivation.

It can be also deleted - this operation cannot be undone.

Once the webhook configuration is created, you should start receiving webhooks depending on topics that you are subscribed to. Each submission payload contains 2 fields:

topic
data - depends on the topic
Each webhook submission has calculated HMAC - a request payload signed with webhook's owner API secret. HMAC is sent in Lulu-HMAC-SHA256 header. HMAC is calculated with API secret as a key (UTF-8 encoded), payload as a message (UTF-8 encoded) and SHA-256 as hash function. To validate HMAC, it should be calculated using raw response data - parsing it to JSON can cause formatting issues.

If a webhook submission fails for any reason (connection error, HTTP error, etc.), it is retried 5 times. After 5 different failed submissions in a row, the webhook is deactivated (is_active field is set to false). It can be activated back by updating it. There is an option to test webhook submission by calling test endpoint. It sends dummy data of the selected topic to configured URL.

All webhooks submissions can be retrieved by calling this endpoint. It returns all submissions created during the last 30 days.

PRINT_JOB_STATUS_CHANGED topic

PRINT_JOB_STATUS_CHANGED webhook is sent every time owned print job status is updated. The data sent in the payload is print job data, the same as returned by print job details endpoint.