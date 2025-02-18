
from rembg import remove
import io
import base64
from PIL import Image

def handle_cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

def main(event, context):
    # Handle CORS preflight requests
    if event['method'] == 'OPTIONS':
        return {
            'statusCode': 204,
            'headers': handle_cors(),
            'body': ''
        }

    try:
        # Get the base64 image from the request body
        body = event.get('body', {})
        if not isinstance(body, dict):
            body = {}
        
        image_data = body.get('image')
        if not image_data:
            return {
                'statusCode': 400,
                'headers': handle_cors(),
                'body': {'error': 'No image data provided'}
            }

        # Remove base64 prefix if present
        if 'base64,' in image_data:
            image_data = image_data.split('base64,')[1]

        # Convert base64 to bytes
        image_bytes = base64.b64decode(image_data)
        input_image = Image.open(io.BytesIO(image_bytes))

        # Remove background
        output_image = remove(input_image)

        # Convert back to base64
        buffered = io.BytesIO()
        output_image.save(buffered, format="PNG")
        output_base64 = base64.b64encode(buffered.getvalue()).decode()

        return {
            'statusCode': 200,
            'headers': handle_cors(),
            'body': {
                'image': f'data:image/png;base64,{output_base64}'
            }
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': handle_cors(),
            'body': {'error': str(e)}
        }
