import React, { useState } from 'react';
import { Ticket, TicketStatus, TicketPriority } from '../types';
import { MessageSquare, Clock, CheckCircle, AlertOctagon, MoreHorizontal } from 'lucide-react';

const MOCK_TICKETS: Ticket[] = [
    { id: '101', restaurantId: '1', restaurantName: 'Sushi Bar Top', subject: 'Problema no cardápio online', status: TicketStatus.OPEN, priority: TicketPriority.HIGH, category: 'Bug', createdAt: '2023-10-25 10:00', lastUpdate: '2023-10-25 10:30' },
    { id: '102', restaurantId: '2', restaurantName: 'Lanche Feliz', subject: 'Como mudar a forma de pagamento?', status: TicketStatus.IN_PROGRESS, priority: TicketPriority.MEDIUM, category: 'Dúvida', createdAt: '2023-10-24 14:00', lastUpdate: '2023-10-25 09:00' },
    { id: '103', restaurantId: '3', restaurantName: 'Pizza 10', subject: 'Erro na cobrança da assinatura', status: TicketStatus.OPEN, priority: TicketPriority.URGENT, category: 'Financeiro', createdAt: '2023-10-25 11:00', lastUpdate: '2023-10-25 11:05' },
    { id: '104', restaurantId: '4', restaurantName: 'Açaí Bom', subject: 'Sugestão de nova feature', status: TicketStatus.RESOLVED, priority: TicketPriority.LOW, category: 'Sugestão', createdAt: '2023-10-20 09:00', lastUpdate: '2023-10-22 15:00' },
];

export const Support: React.FC = () => {
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const filteredTickets = filterStatus === 'all' 
        ? MOCK_TICKETS 
        : MOCK_TICKETS.filter(t => t.status === filterStatus);

    const getPriorityColor = (p: TicketPriority) => {
        switch(p) {
            case TicketPriority.URGENT: return 'bg-red-100 text-red-800 border-red-200';
            case TicketPriority.HIGH: return 'bg-orange-100 text-orange-800 border-orange-200';
            case TicketPriority.MEDIUM: return 'bg-blue-100 text-blue-800 border-blue-200';
            case TicketPriority.LOW: return 'bg-slate-100 text-slate-800 border-slate-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (s: TicketStatus) => {
        switch(s) {
            case TicketStatus.OPEN: return <AlertOctagon size={16} className="text-red-500"/>;
            case TicketStatus.IN_PROGRESS: return <Clock size={16} className="text-blue-500"/>;
            case TicketStatus.RESOLVED: return <CheckCircle size={16} className="text-green-500"/>;
            default: return <CheckCircle size={16} className="text-slate-400"/>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Suporte & Helpdesk</h1>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                    Novo Ticket Interno
                </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
                {['all', TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border
                            ${filterStatus === status 
                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        {status === 'all' ? 'Todos' : status}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Assunto / Restaurante</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Prioridade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Categoria</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Última Atu.</th>
                            <th className="px-6 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                        {filteredTickets.map((ticket) => (
                            <tr key={ticket.id} className="hover:bg-slate-50 cursor-pointer transition-colors">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-slate-900">{ticket.subject}</div>
                                    <div className="text-xs text-slate-500">{ticket.restaurantName} (ID: {ticket.restaurantId})</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(ticket.status)}
                                        <span className="text-sm text-slate-700">{ticket.status}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                                        {ticket.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{ticket.category}</span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                    {ticket.lastUpdate.split(' ')[1]}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-slate-400 hover:text-indigo-600">
                                        <MoreHorizontal size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
