'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type FormState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
};

const initialState: FormState = {
  success: false,
  message: ''
};

export function LeadForm() {
  const [state, setState] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setState(initialState);

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    const payload = {
      responsibleName: String(formData.get('responsibleName') ?? ''),
      restaurantName: String(formData.get('restaurantName') ?? ''),
      whatsapp: String(formData.get('whatsapp') ?? ''),
      cityState: String(formData.get('cityState') ?? ''),
      plan: String(formData.get('plan') ?? 'Local'),
      message: String(formData.get('message') ?? '')
    };

    const errors: Record<string, string> = {};
    if (payload.responsibleName.trim().length < 2) errors.responsibleName = 'Nome muito curto';
    if (payload.restaurantName.trim().length < 2) errors.restaurantName = 'Nome do restaurante invalido';
    if (payload.whatsapp.trim().length < 10) errors.whatsapp = 'WhatsApp invalido';
    if (payload.cityState.trim().length < 3) errors.cityState = 'Cidade/Estado invalido';

    if (Object.keys(errors).length > 0) {
      setState({
        success: false,
        message: 'Por favor, corrija os erros no formulario.',
        errors
      });
      setSubmitting(false);
      return;
    }

    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = (await response.json().catch(() => null)) as
      | { success: boolean; message?: string }
      | null;

    if (!response.ok || !result?.success) {
      setState({
        success: false,
        message: result?.message ?? 'Nao foi possivel enviar no momento. Tente novamente.'
      });
      setSubmitting(false);
      return;
    }

    setState({
      success: true,
      message: result.message
    });
    formElement.reset();
    setSubmitting(false);
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
      <h3 className="text-2xl font-bold text-slate-900 mb-2">Contrate agora</h3>
      <p className="text-slate-600 mb-6">Preencha os dados e fale com nosso time.</p>

      {state.success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 text-green-800">
          <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
          <p>{state.message}</p>
        </div>
      )}

      {state.success === false && state.message && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-800">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <p>{state.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="responsibleName" className="block text-sm font-medium text-slate-700 mb-1">
            Nome do responsavel *
          </label>
          <input
            type="text"
            name="responsibleName"
            id="responsibleName"
            required
            className={cn(
              'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all',
              state.errors?.responsibleName ? 'border-red-500' : 'border-slate-300'
            )}
            placeholder="Seu nome completo"
          />
          {state.errors?.responsibleName && (
            <p className="text-xs text-red-500 mt-1">{state.errors.responsibleName}</p>
          )}
        </div>

        <div>
          <label htmlFor="restaurantName" className="block text-sm font-medium text-slate-700 mb-1">
            Nome do restaurante *
          </label>
          <input
            type="text"
            name="restaurantName"
            id="restaurantName"
            required
            className={cn(
              'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all',
              state.errors?.restaurantName ? 'border-red-500' : 'border-slate-300'
            )}
            placeholder="Ex: Burger King"
          />
          {state.errors?.restaurantName && (
            <p className="text-xs text-red-500 mt-1">{state.errors.restaurantName}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-slate-700 mb-1">
              WhatsApp *
            </label>
            <input
              type="text"
              name="whatsapp"
              id="whatsapp"
              required
              placeholder="(11) 99999-9999"
              className={cn(
                'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all',
                state.errors?.whatsapp ? 'border-red-500' : 'border-slate-300'
              )}
            />
            {state.errors?.whatsapp && (
              <p className="text-xs text-red-500 mt-1">{state.errors.whatsapp}</p>
            )}
          </div>

          <div>
            <label htmlFor="cityState" className="block text-sm font-medium text-slate-700 mb-1">
              Cidade/Estado *
            </label>
            <input
              type="text"
              name="cityState"
              id="cityState"
              required
              placeholder="Ex: Sao Paulo/SP"
              className={cn(
                'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all',
                state.errors?.cityState ? 'border-red-500' : 'border-slate-300'
              )}
            />
            {state.errors?.cityState && (
              <p className="text-xs text-red-500 mt-1">{state.errors.cityState}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="plan" className="block text-sm font-medium text-slate-700 mb-1">
            Plano de interesse *
          </label>
          <select
            name="plan"
            id="plan"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none bg-white"
            defaultValue="Local"
          >
            <option value="Local">Plano Local</option>
            <option value="Local + Online">Plano Local + Online</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
            Mensagem (opcional)
          </label>
          <textarea
            name="message"
            id="message"
            rows={3}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all resize-none"
            placeholder="Duvidas ou observacoes..."
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar e solicitar contato'
          )}
        </button>
        <p className="text-xs text-slate-400 text-center mt-2">
          Ao enviar, voce concorda com nossos termos de uso.
        </p>
      </form>
    </div>
  );
}
