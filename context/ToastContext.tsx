"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Permanent_Marker } from "next/font/google";

const marker = Permanent_Marker({ weight: "400", subsets: ["latin"] });

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

interface ToastItem {
    id: number;
    message: string;
    type: ToastType;
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* TOAST CONTAINER */}
            <div className="fixed top-4 left-0 right-0 z-[99999] flex flex-col items-center gap-2 pointer-events-none px-4">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        onClick={() => removeToast(toast.id)}
                        className={`
                            pointer-events-auto cursor-pointer
                            min-w-[280px] max-w-sm
                            p-4 rounded-xl
                            border-2 shadow-[0_10px_30px_rgba(0,0,0,0.8)]
                            backdrop-blur-xl
                            transform transition-all duration-300 animate-in slide-in-from-top-4 fade-in
                            flex items-center gap-3
                            ${marker.className}
                            ${toast.type === 'success' ? 'bg-black/90 border-green-600 text-green-400' : ''}
                            ${toast.type === 'error' ? 'bg-black/90 border-red-600 text-red-500' : ''}
                            ${toast.type === 'info' ? 'bg-black/90 border-blue-600 text-blue-400' : ''}
                            ${toast.type === 'warning' ? 'bg-black/90 border-yellow-500 text-yellow-500' : ''}
                        `}
                    >
                        {/* ICON */}
                        <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold border
                            ${toast.type === 'success' ? 'bg-green-900/50 border-green-500' : ''}
                            ${toast.type === 'error' ? 'bg-red-900/50 border-red-500' : ''}
                            ${toast.type === 'info' ? 'bg-blue-900/50 border-blue-500' : ''}
                            ${toast.type === 'warning' ? 'bg-yellow-900/50 border-yellow-500' : ''}
                        `}>
                            {toast.type === 'success' && '✓'}
                            {toast.type === 'error' && '!'}
                            {toast.type === 'info' && 'i'}
                            {toast.type === 'warning' && '⚠'}
                        </div>

                        {/* MESSAGE */}
                        <div className="flex-1">
                            <p className="text-sm uppercase tracking-widest leading-tight drop-shadow-md">
                                {toast.message}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
