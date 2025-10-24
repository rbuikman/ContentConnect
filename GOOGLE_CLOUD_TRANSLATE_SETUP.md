# Google Cloud Translate Setup

1. Install the PHP client:

    composer require google/cloud-translate

2. Create a Google Cloud project and enable the Cloud Translation API.

3. Create a service account and download the JSON key file.

4. Set the environment variable in your shell or web server:

    export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account.json"

5. Optionally, set your Google Cloud project ID in your .env file:

    GOOGLE_CLOUD_PROJECT=your-project-id

6. The Laravel controller will use these environment variables for authentication.
