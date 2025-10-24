import React, { useEffect, useState } from 'react';
import ApplicationLogo from './ApplicationLogo';

export default function AboutBox() {
  const [buildInfo, setBuildInfo] = useState<{ buildVersion: string, buildDate: string } | null>(null);

  useEffect(() => {
    fetch('/build-version.json')
      .then(res => res.json())
      .then(data => setBuildInfo(data))
      .catch(() => setBuildInfo(null));
  }, []);

  return (
    <div className="max-w-sm mx-auto bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-2xl p-8 mt-8 border border-indigo-100">
      <div className="flex items-center justify-center mb-6">
        <ApplicationLogo className="text-3xl mb-2" />
      </div>
      <div className="mb-6 text-gray-700 text-center">
        <div className="mb-1"><span className="font-semibold text-indigo-600">Version:</span> <span className="bg-indigo-50 rounded px-2 py-1 text-indigo-800">1.0.{buildInfo?.buildVersion || 'N/A'}</span></div>
        <div className="mt-4 text-sm text-gray-600 italic">A modern InDesign document management system for secure, collaborative, and efficient workflow in your organization.</div>
      </div>
      <div className="text-xs text-gray-400 text-center mt-4">&copy; {new Date().getFullYear()} Valke.net</div>
    </div>
  );
}
