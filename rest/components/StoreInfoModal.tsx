import React, { useMemo, useState } from 'react';
import { Clock3, MapPin, Send, Star, X } from 'lucide-react';
import { RESTAURANT_DATA } from '../constants';

interface StoreInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ReviewItem = {
  id: string;
  name: string;
  rating: number;
  message: string;
};

const initialReviews: ReviewItem[] = [
  { id: 'r1', name: 'Ana', rating: 5, message: 'Pedido chegou rapido e bem embalado.' },
  { id: 'r2', name: 'Carlos', rating: 4, message: 'Lanche muito bom e atendimento atencioso.' },
  { id: 'r3', name: 'Julia', rating: 5, message: 'Excelente experiencia, recomendo.' }
];

function formatTaxId(value?: string | null) {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 14) return value;
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function formatWhatsapp(value: string) {
  const digits = (value || '').replace(/\D/g, '');
  if (digits.length === 13 && digits.startsWith('55')) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return value;
}

export const StoreInfoModal: React.FC<StoreInfoModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'about' | 'reviews'>('about');
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [newName, setNewName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newRating, setNewRating] = useState(5);
  const { name, logoUrl, address, openingHours, isOpen: storeIsOpen, city, state, taxId, whatsappNumber } = RESTAURANT_DATA;

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
  }, [reviews]);

  if (!isOpen) return null;

  const handleSubmitReview = () => {
    if (!newName.trim() || !newMessage.trim()) return;
    const review: ReviewItem = {
      id: `r${Date.now()}`,
      name: newName.trim(),
      rating: newRating,
      message: newMessage.trim()
    };
    setReviews((prev) => [review, ...prev]);
    setNewName('');
    setNewMessage('');
    setNewRating(5);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-2xl font-bold text-slate-900">Informacoes da Loja</h3>
          <button onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 border-b border-slate-100 text-sm font-semibold">
          <button
            onClick={() => setTab('about')}
            className={`py-3 ${tab === 'about' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-slate-500'}`}
          >
            Sobre
          </button>
          <button
            onClick={() => setTab('reviews')}
            className={`py-3 ${tab === 'reviews' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-slate-500'}`}
          >
            Avaliacoes ({reviews.length})
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
          {tab === 'about' && (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                <img src={logoUrl} alt={name} className="mx-auto h-20 w-20 rounded-full border-4 border-emerald-100 object-cover" />
                <p className="mt-3 text-xl font-bold text-slate-900">{name}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 text-emerald-600" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Endereco</p>
                    <p className="text-sm text-slate-600">{address}</p>
                    <p className="text-sm text-slate-500">{city} / {state}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-3">
                  <Clock3 className="text-emerald-600" size={18} />
                  <p className="text-sm font-semibold text-slate-900">Horario de Funcionamento</p>
                </div>
                <div className="space-y-1.5 text-sm text-slate-700">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="font-medium">{openingHours}</p>
                  </div>
                  <div className="pt-1 text-right text-xs font-bold text-emerald-600">
                    {storeIsOpen ? 'Aberto agora' : 'Fechado'}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Contato</p>
                <p className="mt-1 text-sm text-slate-600">{formatWhatsapp(whatsappNumber)}</p>
                {taxId && (
                  <>
                    <p className="mt-3 text-sm font-semibold text-slate-900">CNPJ</p>
                    <p className="mt-1 text-sm text-slate-600">{formatTaxId(taxId)}</p>
                  </>
                )}
              </div>
            </>
          )}

          {tab === 'reviews' && (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                <p className="text-4xl font-black text-slate-900">{averageRating.toFixed(1)}</p>
                <div className="mt-2 flex items-center justify-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      size={22}
                      className={index < Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm text-slate-500">Baseado em {reviews.length} avaliacoes</p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-white p-4">
                <p className="font-semibold text-slate-900">Nova Avaliacao</p>
                <div className="my-3 flex items-center justify-center gap-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <button key={index} onClick={() => setNewRating(index + 1)}>
                      <Star
                        size={32}
                        className={index < newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                      />
                    </button>
                  ))}
                </div>
                <input
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="Seu nome"
                  className="mb-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                />
                <textarea
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  placeholder="Conte como foi sua experiencia..."
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                />
                <button
                  onClick={handleSubmitReview}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700"
                >
                  <Send size={16} />
                  Enviar Avaliacao
                </button>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-slate-100 bg-white p-4">
          <button onClick={onClose} className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-700">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
