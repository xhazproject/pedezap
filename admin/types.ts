export enum Role {
  MASTER = 'Admin Master',
  FINANCIAL = 'Financeiro',
  SUPPORT = 'Suporte',
  OPERATION = 'Operação'
}

export enum RestaurantStatus {
  ACTIVE = 'Ativo',
  INACTIVE = 'Inativo',
  BLOCKED = 'Bloqueado',
  PENDING = 'Pendente'
}

export enum PlanType {
  LOCAL = 'Plano Local',
  LOCAL_ONLINE = 'Plano Local + Online'
}

export enum TicketStatus {
  OPEN = 'Aberto',
  IN_PROGRESS = 'Em Andamento',
  RESOLVED = 'Resolvido',
  CLOSED = 'Fechado'
}

export enum TicketPriority {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta',
  URGENT = 'Urgente'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  whatsapp: string;
  city: string;
  state: string;
  plan: PlanType;
  status: RestaurantStatus;
  createdAt: string;
  ordersCount: number;
  lastOrderDate?: string;
  revenue?: number;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: 'Novo' | 'Em Contato' | 'Fechado' | 'Perdido';
  createdAt: string;
}

export interface Ticket {
  id: string;
  restaurantId: string;
  restaurantName: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  createdAt: string;
  lastUpdate: string;
}

export interface Transaction {
  id: string;
  restaurantName: string;
  amount: number;
  date: string;
  status: 'Pago' | 'Pendente' | 'Atrasado';
  plan: PlanType;
}
