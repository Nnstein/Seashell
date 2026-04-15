import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CloseMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (message: string) => void;
    isSubmitting: boolean;
}

const CloseMenuModal: React.FC<CloseMenuModalProps> = ({ isOpen, onClose, onConfirm, isSubmitting }) => {
    const [message, setMessage] = useState('Due to high volume of orders, we can no longer accept any new orders. Please try again in 1 hour.');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (message.trim()) {
            onConfirm(message.trim());
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl mx-4 animate-in zoom-in-95 duration-200">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4 flex justify-between items-center">
                        <h2 className="text-white font-serif text-2xl font-bold">Close Menu - Custom Message</h2>
                        <button 
                            onClick={onClose}
                            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <p className="text-slate-600 mb-4">
                            Enter a custom message (in English) that will be displayed to guests. The heading and thank you message will appear in the guest's selected language.
                        </p>

                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Enter your custom close message here..."
                            className="w-full h-40 p-4 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:ring-0 outline-none resize-none text-slate-800 font-sans"
                            maxLength={500}
                        />

                        <div className="mt-2 text-right text-sm text-slate-400">
                            {message.length} / 500 characters
                        </div>

                        {/* Preview */}
                        <div className="mt-6 p-4 bg-slate-50 border-2 border-slate-200 rounded-xl">
                            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-2">Preview:</p>
                            <p className="text-slate-700 leading-relaxed">
                                {message || <span className="italic text-slate-400">Your message will appear here...</span>}
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 px-6 py-4 flex gap-3 justify-end border-t border-slate-200">
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 border-2 border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-100 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!message.trim() || isSubmitting}
                            className="px-8 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-bold shadow-lg hover:shadow-xl hover:from-red-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Publishing...' : 'Publish & Close Menu'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CloseMenuModal;
