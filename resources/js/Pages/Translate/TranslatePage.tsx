import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'nl', name: 'Dutch' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  // Add more as needed
];

export default function TranslatePage() {
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTranslate = async () => {
    setLoading(true);
    setError('');
    setTargetText('');
    try {
      const response = await axios.post('/translate', {
        text: sourceText,
        language,
      });
      setTargetText(response.data.translated);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Translation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthenticatedLayout header="Translate Text">
      <div className="mx-5 mt-8">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4 w-full max-w-4xl">
            <div className="flex-1">
              <label className="block mb-1 text-sm font-medium text-gray-700">Source Text</label>
              <textarea
                className="w-full h-40 p-3 border rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                value={sourceText}
                onChange={e => setSourceText(e.target.value)}
                placeholder="Enter text to translate..."
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <label className="block mb-1 text-sm font-medium text-gray-700">Language</label>
              <select
                className="mb-2 px-3 py-2 border rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={language}
                onChange={e => setLanguage(e.target.value)}
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
              <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded shadow disabled:opacity-50"
                onClick={handleTranslate}
                disabled={loading || !sourceText.trim()}
              >
                {loading ? 'Translating...' : 'Translate'}
              </button>
            </div>
            <div className="flex-1">
              <label className="block mb-1 text-sm font-medium text-gray-700">Translated Text</label>
              <textarea
                className="w-full h-40 p-3 border rounded shadow-sm bg-gray-100 resize-none"
                value={targetText}
                readOnly
                placeholder="Translation will appear here..."
              />
            </div>
          </div>
          {error && <div className="text-red-500 font-medium">{error}</div>}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
