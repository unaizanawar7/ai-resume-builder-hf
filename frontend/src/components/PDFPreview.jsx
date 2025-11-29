/**
 * PDFPreview Component
 * Displays PDF preview with refresh functionality
 */

import React from 'react';
import { Loader, RefreshCw } from 'lucide-react';

function PDFPreview({ pdfUrl, generating, onRefresh }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">PDF Preview</h3>
        <button
          onClick={onRefresh}
          disabled={generating}
          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      <div className="border rounded-lg overflow-hidden bg-gray-50 min-h-[800px]">
        {generating ? (
          <div className="flex items-center justify-center h-full min-h-[800px]">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600">Generating preview...</p>
            </div>
          </div>
        ) : pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-full min-h-[800px]"
            title="Resume Preview"
          />
        ) : (
          <div className="flex items-center justify-center h-full min-h-[800px] text-gray-500">
            <div className="text-center">
              <p className="mb-2">Preview will appear here</p>
              <p className="text-sm text-gray-400">Make changes to see the preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PDFPreview;



