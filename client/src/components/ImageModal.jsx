import React from 'react';
import { X, ExternalLink, Download } from 'lucide-react';

export default function ImageModal({ imageUrl, onClose }) {
  if (!imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/90 text-white z-10 border-b border-slate-800">
          <span className="text-xs text-slate-400 font-medium truncate">ទិដ្ឋភាពរូបភាពច្បាស់ (Full View)</span>
          <div className="flex items-center space-x-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="បើកក្នុង Tab ថ្មី"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Content */}
        <div className="p-2 overflow-auto flex items-center justify-center max-h-[80vh]">
          <img 
            src={imageUrl} 
            alt="Product Zoom" 
            className="max-h-[75vh] max-w-full object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
