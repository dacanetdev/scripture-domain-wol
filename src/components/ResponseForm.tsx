import React from 'react';
import { Scripture } from '../types';

interface ResponseFormProps {
  value: string;
  onChange: (response: string) => void;
  onSubmit: () => void;
  selectedScripture: Scripture | undefined;
}

const ResponseForm: React.FC<ResponseFormProps> = ({ value, onChange, onSubmit, selectedScripture }) => {
  const maxLength = 100;
  const remainingChars = maxLength - value.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div className="space-y-4">
      {/* Selected Scripture Summary */}
      <div className="bg-light-gold/20 p-3 rounded-lg border border-light-gold">
        <div className="text-sm font-semibold text-dark-purple mb-1">
          Escritura Seleccionada: {selectedScripture?.reference}
        </div>
        <div className="text-xs text-gray-600">
          "{selectedScripture?.text.substring(0, 80)}..."
        </div>
      </div>

      {/* Response Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tu Respuesta de Batalla (Máx {maxLength} caracteres)
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribe una respuesta rápida y poderosa explicando cómo esta escritura ayuda con el escenario..."
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-light-gold focus:border-transparent resize-none ${
            isOverLimit ? 'border-red-500' : 'border-gray-300'
          }`}
          rows={4}
          maxLength={maxLength}
        />
        
        {/* Character Counter */}
        <div className="flex justify-between items-center mt-2">
          <div className={`text-sm ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
            {remainingChars} caracteres restantes
          </div>
          <div className="text-xs text-gray-400">
            ¡Las respuestas rápidas obtienen bonos de velocidad! ⚡
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        disabled={!value.trim() || isOverLimit || !selectedScripture}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ⚔️ Enviar Respuesta de Batalla
      </button>

      {/* Tips */}
      <div className="bg-blue-50 p-3 rounded-lg">
        <div className="text-sm font-semibold text-blue-800 mb-1">💡 Consejos de Batalla:</div>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Sé específico sobre cómo se aplica la escritura</li>
          <li>• Manténlo conciso y poderoso</li>
          <li>• Enfócate en el principio espiritual</li>
          <li>• ¡Envía rápidamente para bonos de velocidad!</li>
        </ul>
      </div>
    </div>
  );
};

export default ResponseForm; 