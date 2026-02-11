import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Check, Star } from 'lucide-react';

export const Plans: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="text-center">
         <h2 className="text-3xl font-bold text-gray-900">Escolha o plano ideal para você</h2>
         <p className="mt-4 text-lg text-gray-500">Evolua seu negócio com as ferramentas certas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Basic Plan */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col">
          <h3 className="text-xl font-semibold text-gray-900">Plano Local</h3>
          <div className="mt-4 flex items-baseline">
            <span className="text-4xl font-extrabold tracking-tight text-gray-900">R$49</span>
            <span className="ml-1 text-xl font-semibold text-gray-500">/mês</span>
          </div>
          <p className="mt-4 text-gray-500">Essencial para organizar seu atendimento local.</p>
          
          <ul className="mt-6 space-y-4 flex-1">
            {['Cardápio Digital', 'Gestão de Pedidos Manual', 'Painel Administrativo', 'Suporte por Email'].map((feature) => (
              <li key={feature} className="flex">
                <Check className="flex-shrink-0 w-6 h-6 text-green-500" />
                <span className="ml-3 text-gray-500">{feature}</span>
              </li>
            ))}
          </ul>
          
          <div className="mt-8">
             <Button variant="secondary" fullWidth size="lg">Seu plano atual</Button>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-brand-500 p-8 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-brand-500 text-white px-4 py-1 rounded-bl-lg font-bold text-sm">
            MAIS POPULAR
          </div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            Plano Local + Online
            <Star size={20} className="text-yellow-400 fill-current" />
          </h3>
          <div className="mt-4 flex items-baseline">
            <span className="text-4xl font-extrabold tracking-tight text-gray-900">R$99</span>
            <span className="ml-1 text-xl font-semibold text-gray-500">/mês</span>
          </div>
          <p className="mt-4 text-gray-500">Automatize e receba pagamentos online.</p>
          
          <ul className="mt-6 space-y-4 flex-1">
            {[
              'Tudo do Plano Local',
              'Pagamentos Online (PIX Auto)',
              'Impressão de Pedidos',
              'Integração WhatsApp API',
              'Cupons de Desconto',
              'Suporte Prioritário'
            ].map((feature) => (
              <li key={feature} className="flex">
                <Check className="flex-shrink-0 w-6 h-6 text-brand-500" />
                <span className="ml-3 text-gray-700 font-medium">{feature}</span>
              </li>
            ))}
          </ul>
          
          <div className="mt-8">
             <Button variant="primary" fullWidth size="lg">Fazer Upgrade</Button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center">
         <h4 className="font-semibold text-blue-900">Precisa de algo personalizado?</h4>
         <p className="text-blue-700 mt-2">Entre em contato para franquias e múltiplas lojas.</p>
      </div>
    </div>
  );
};