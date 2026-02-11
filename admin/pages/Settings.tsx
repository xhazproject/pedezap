import React from 'react';
import { Save, Globe, MessageSquare, Shield, Tag } from 'lucide-react';

export const Settings: React.FC = () => {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
             <h1 className="text-2xl font-bold text-slate-900">Configurações Globais</h1>
             
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 space-y-8">
                    
                    {/* General Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                <Globe size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900">Geral do Sistema</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Produto</label>
                                <input type="text" defaultValue="PedeZap" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">URL de Suporte</label>
                                <input type="text" defaultValue="https://ajuda.pedezap.ai" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Banner Global (Manutenção/Aviso)</label>
                                <input type="text" placeholder="Ex: Estamos em manutenção programada..." className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                                <p className="text-xs text-slate-500 mt-1">Se preenchido, aparecerá para todos os restaurantes e clientes.</p>
                            </div>
                        </div>
                    </section>
                    
                    <hr className="border-slate-100" />

                    {/* Messages Section */}
                    <section>
                         <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                <MessageSquare size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900">Templates de Mensagens</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem de Boas-vindas (Novo Restaurante)</label>
                                <textarea rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-600" defaultValue="Olá {nome}, bem-vindo ao PedeZap! Seu acesso está liberado." />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem Padrão de Pedido (WhatsApp)</label>
                                <textarea rows={4} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-600" defaultValue="*Novo Pedido #{id}* 🍔%0ACliente: {cliente_nome}%0AItens: {itens}%0ATotal: {total}" />
                                <p className="text-xs text-slate-500 mt-1">Variáveis disponíveis: {'{id}, {cliente_nome}, {itens}, {total}'}</p>
                            </div>
                        </div>
                    </section>

                    <hr className="border-slate-100" />

                    {/* Security */}
                     <section>
                         <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                <Shield size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900">Segurança</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" defaultChecked />
                                <span className="text-sm text-slate-700">Exigir senha forte para admins</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" defaultChecked />
                                <span className="text-sm text-slate-700">Log de auditoria ativo</span>
                            </label>
                        </div>
                    </section>

                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    <button className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm">
                        <Save size={16} />
                        Salvar Alterações
                    </button>
                </div>
             </div>
        </div>
    );
};
