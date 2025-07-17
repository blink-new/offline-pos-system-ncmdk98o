import { Loader2 } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="mb-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Initializing POS System
        </h2>
        <p className="text-slate-600">
          Setting up your offline point of sale system...
        </p>
      </div>
    </div>
  );
}