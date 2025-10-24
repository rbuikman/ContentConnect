<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use Google\Cloud\Translate\V3\Client\TranslationServiceClient;
use Google\Cloud\Translate\V3\TranslateTextRequest;

class TranslateController extends Controller
{
    public function translate(Request $request)
    {
        $data = $request->validate([
            'text' => 'required|string',
            'language' => 'required|string',
        ]);

        // Google Cloud Translate V3 integration
        $projectId = env('GOOGLE_CLOUD_PROJECT');
        $location = 'global';
        $client = new TranslationServiceClient();
        $parent = $client->locationName($projectId, $location);

        try {
            $request = new TranslateTextRequest([
                'parent' => $parent,
                'contents' => [$data['text']],
                'mime_type' => 'text/plain',
                'target_language_code' => $data['language'],
            ]);
            $response = $client->translateText($request);
            $translations = $response->getTranslations();
            $translatedText = count($translations) > 0 ? $translations[0]->getTranslatedText() : null;
            $detectedSource = count($translations) > 0 ? $translations[0]->getDetectedLanguageCode() : null;
            return response()->json([
                'translated' => $translatedText,
                'detectedSource' => $detectedSource,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Translation failed: ' . $e->getMessage(),
                'details' => $e->getMessage(),
            ], 500);
        }
    }
}
