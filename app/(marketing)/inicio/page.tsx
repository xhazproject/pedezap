
import { LeadForm } from "@/components/lead-form";
import React from "react";
import { 
  Smartphone, 
  MessageCircle, 
  Store, 
  Check, 
  ChevronRight,
  Menu,
  ShoppingBag,
  CreditCard,
  LayoutDashboard,
  Zap
} from "lucide-react";

// Mock Link for preview environment
const Link = ({ href, children, className }: { href: string; children?: React.ReactNode; className?: string }) => (
  <a href={href} className={className}>{children}</a>
);

export default function LandingPage() {
  return (
    <>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32">
        <div className="container-custom relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-sm font-medium border border-brand-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              Novidade para restaurantes
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">
              Pedidos por link <br className="hidden lg:block"/>
              <span className="text-brand-600">+ WhatsApp</span> para seu restaurante
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0">
              Automatize o atendimento. O cliente escolhe os itens no cardápio digital, informa o endereço e o pedido chega formatado diretamente no seu WhatsApp.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link 
                href="#contato" 
                className="bg-brand-600 text-white hover:bg-brand-700 px-8 py-3.5 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-brand-500/25 flex items-center justify-center gap-2"
              >
                Quero contratar <ChevronRight className="h-5 w-5" />
              </Link>
              <Link 
                href="#como-funciona" 
                className="bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 px-8 py-3.5 rounded-xl font-semibold text-lg transition-all flex items-center justify-center"
              >
                Como funciona
              </Link>
            </div>
          </div>
          
          <div className="relative mx-auto lg:mr-0 max-w-md lg:max-w-full">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-100 to-indigo-50 rounded-full blur-3xl opacity-60 transform translate-x-10 translate-y-10"></div>
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 relative z-10">
              {/* Fake UI Preview */}
              <div className="flex items-center gap-3 mb-4 border-b pb-4">
                <div className="h-10 w-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center shadow-sm">
                   <Zap className="h-6 w-6 text-white fill-white/20" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Burger King Fake</div>
                  <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    Aberto agora
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                  <div className="flex gap-3">
                    <div className="h-12 w-12 bg-slate-200 rounded-md shrink-0"></div>
                    <div>
                      <div className="h-4 w-24 bg-slate-200 rounded mb-1"></div>
                      <div className="h-3 w-12 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                  <div className="h-6 w-6 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 text-xs font-bold">+</div>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                   <div className="flex gap-3">
                    <div className="h-12 w-12 bg-slate-200 rounded-md shrink-0"></div>
                    <div>
                      <div className="h-4 w-32 bg-slate-200 rounded mb-1"></div>
                      <div className="h-3 w-16 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                  <div className="h-6 w-6 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 text-xs font-bold">+</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
                <span className="text-slate-500">Total: <span className="text-slate-900 font-bold">R$ 42,00</span></span>
                <span className="bg-green-500 hover:bg-green-600 transition-colors text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-green-500/20">
                  <MessageCircle className="h-3.5 w-3.5" /> Enviar Pedido
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="py-24 bg-white border-y border-slate-100">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Simplifique suas vendas</h2>
            <p className="text-slate-600 text-lg">Em três passos simples, você moderniza o delivery do seu restaurante sem pagar comissões abusivas.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 relative group hover:border-brand-200 transition-all">
              <div className="h-12 w-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-brand-600 mb-6 group-hover:scale-110 transition-transform">
                <Menu className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">1. Crie seu cardápio</h3>
              <p className="text-slate-600">Cadastre seus produtos, fotos e preços. Gere seu link exclusivo (ex: app.pedezap.ai/sualoja).</p>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 relative group hover:border-brand-200 transition-all">
               <div className="h-12 w-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-brand-600 mb-6 group-hover:scale-110 transition-transform">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">2. Cliente faz o pedido</h3>
              <p className="text-slate-600">Seu cliente acessa o link, monta a sacola e preenche os dados de entrega sem precisar baixar app.</p>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 relative group hover:border-brand-200 transition-all">
               <div className="h-12 w-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-green-600 mb-6 group-hover:scale-110 transition-transform">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">3. Receba no WhatsApp</h3>
              <p className="text-slate-600">O pedido chega formatado no seu WhatsApp. Você confirma, combina o pagamento e envia.</p>
            </div>
          </div>
        </div>
      </section>

      {/* RESOURCES */}
      <section className="py-24 bg-slate-50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
             <div>
               <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">Tudo o que você precisa para vender mais</h2>
               <div className="space-y-6">
                 <div className="flex gap-4">
                   <div className="bg-white p-2 h-fit rounded-lg shadow-sm border border-slate-200">
                     <Store className="h-6 w-6 text-brand-600" />
                   </div>
                   <div>
                     <h4 className="font-bold text-slate-900">Link personalizado</h4>
                     <p className="text-slate-600 text-sm mt-1">Seu restaurante com endereço próprio na web: app.pedezap.ai/seunome.</p>
                   </div>
                 </div>
                 <div className="flex gap-4">
                   <div className="bg-white p-2 h-fit rounded-lg shadow-sm border border-slate-200">
                     <LayoutDashboard className="h-6 w-6 text-brand-600" />
                   </div>
                   <div>
                     <h4 className="font-bold text-slate-900">Painel Administrativo</h4>
                     <p className="text-slate-600 text-sm mt-1">Gerencie produtos, categorias e preços de forma fácil e rápida pelo painel Master.</p>
                   </div>
                 </div>
                 <div className="flex gap-4">
                   <div className="bg-white p-2 h-fit rounded-lg shadow-sm border border-slate-200">
                     <MessageCircle className="h-6 w-6 text-brand-600" />
                   </div>
                   <div>
                     <h4 className="font-bold text-slate-900">Pedidos no WhatsApp</h4>
                     <p className="text-slate-600 text-sm mt-1">Mensagem automática com todos os detalhes: itens, observações, endereço e total.</p>
                   </div>
                 </div>
                 <div className="flex gap-4">
                   <div className="bg-white p-2 h-fit rounded-lg shadow-sm border border-slate-200">
                     <CreditCard className="h-6 w-6 text-brand-600" />
                   </div>
                   <div>
                     <h4 className="font-bold text-slate-900">Taxas transparentes</h4>
                     <p className="text-slate-600 text-sm mt-1">Escolha o plano ideal para o seu momento, sem surpresas no final do mês.</p>
                   </div>
                 </div>
               </div>
             </div>
             <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 rotate-1">
               <div className="space-y-4 font-mono text-sm">
                 <div className="bg-green-100 text-green-800 p-3 rounded-lg rounded-tl-none self-start max-w-[90%]">
                   <p className="font-bold mb-1">🤖 Novo Pedido #1234</p>
                   <p>Nome: João Silva</p>
                   <p>----------------</p>
                   <p>1x X-Bacon (R$ 25,00)</p>
                   <p className="text-xs ml-2">- Sem cebola</p>
                   <p>1x Coca-Cola Lata (R$ 6,00)</p>
                   <p>----------------</p>
                   <p>Taxa entrega: R$ 5,00</p>
                   <p className="font-bold">Total: R$ 36,00</p>
                   <p className="mt-2 text-xs">Endereço: Rua das Flores, 123 - Centro</p>
                   <p className="text-xs">Pagamento: Cartão (Maquininha)</p>
                 </div>
                 <div className="bg-slate-100 text-slate-800 p-3 rounded-lg rounded-tr-none self-end ml-auto w-fit">
                   <p>Pedido confirmado! Já estamos preparando.</p>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section id="planos" className="py-24 bg-white border-y border-slate-100">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Escolha seu plano</h2>
            <p className="text-slate-600">Comece hoje mesmo a organizar seu delivery.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* PLAN 1 */}
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-brand-300 transition-colors">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Plano Local</h3>
              <p className="text-slate-500 mb-6 text-sm">Ideal para operações locais e pagamento na entrega.</p>
              <div className="space-y-4 mb-8">
                 <div className="flex items-center gap-3">
                   <Check className="h-5 w-5 text-brand-600" />
                   <span className="text-slate-700">Pagamento presencial (Maquininha/Dinheiro)</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <Check className="h-5 w-5 text-brand-600" />
                   <span className="text-slate-700">Pedido enviado via WhatsApp</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <Check className="h-5 w-5 text-brand-600" />
                   <span className="text-slate-700">Gestão completa de cardápio</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <Check className="h-5 w-5 text-brand-600" />
                   <span className="text-slate-700">Link exclusivo</span>
                 </div>
              </div>
              <Link href="#contato" className="block w-full text-center py-3 rounded-lg border border-brand-600 text-brand-600 font-bold hover:bg-brand-50 transition-colors">
                Escolher Plano Local
              </Link>
            </div>

            {/* PLAN 2 */}
            <div className="bg-slate-900 text-white p-8 rounded-2xl border border-slate-800 relative shadow-xl">
              <div className="absolute top-0 right-0 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                RECOMENDADO
              </div>
              <h3 className="text-2xl font-bold mb-2">Local + Online</h3>
              <p className="text-slate-400 mb-6 text-sm">Para quem quer automação total e receber online.</p>
              <div className="space-y-4 mb-8">
                 <div className="flex items-center gap-3">
                   <div className="bg-brand-500 rounded-full p-0.5"><Check className="h-3 w-3 text-white" /></div>
                   <span className="text-slate-200">Tudo do plano Local</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="bg-brand-500 rounded-full p-0.5"><Check className="h-3 w-3 text-white" /></div>
                   <span className="text-slate-200">Pagamento Online (Em breve)</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="bg-brand-500 rounded-full p-0.5"><Check className="h-3 w-3 text-white" /></div>
                   <span className="text-slate-200">Confirmação automática de pedidos</span>
                 </div>
              </div>
              <Link href="#contato" className="block w-full text-center py-3 rounded-lg bg-brand-600 text-white font-bold hover:bg-brand-500 transition-colors">
                Escolher Local + Online
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-slate-50">
        <div className="container-custom max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Perguntas Frequentes</h2>
          </div>
          
          <div className="space-y-4">
            <details className="bg-white p-6 rounded-xl border border-slate-200 cursor-pointer group">
              <summary className="font-bold text-slate-900 list-none flex justify-between items-center">
                Preciso baixar algum aplicativo?
                <span className="text-brand-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-slate-600">Não! O PedeZap é 100% web. Tanto você quanto seu cliente acessam através de um link no navegador, sem ocupar memória do celular.</p>
            </details>

            <details className="bg-white p-6 rounded-xl border border-slate-200 cursor-pointer group">
              <summary className="font-bold text-slate-900 list-none flex justify-between items-center">
                Funciona no WhatsApp normal ou Business?
                <span className="text-brand-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-slate-600">Funciona em ambos! O sistema apenas gera uma mensagem formatada que o cliente envia para o seu número cadastrado.</p>
            </details>

            <details className="bg-white p-6 rounded-xl border border-slate-200 cursor-pointer group">
              <summary className="font-bold text-slate-900 list-none flex justify-between items-center">
                Como o cliente faz o pedido?
                <span className="text-brand-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-slate-600">Ele entra no seu link (app.pedezap.ai/seu-restaurante), adiciona os produtos na sacola, preenche o endereço e clica em "Enviar Pedido". O WhatsApp dele abre automaticamente com a mensagem pronta.</p>
            </details>

             <details className="bg-white p-6 rounded-xl border border-slate-200 cursor-pointer group">
              <summary className="font-bold text-slate-900 list-none flex justify-between items-center">
                Posso editar o cardápio depois?
                <span className="text-brand-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-slate-600">Sim! Você terá acesso ao Painel Master para alterar preços, fotos, descrições e pausar produtos sempre que quiser, em tempo real.</p>
            </details>

            <details className="bg-white p-6 rounded-xl border border-slate-200 cursor-pointer group">
              <summary className="font-bold text-slate-900 list-none flex justify-between items-center">
                Tem fidelidade ou contrato?
                <span className="text-brand-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-slate-600">Não exigimos fidelidade de longo prazo. Você pode cancelar quando quiser, respeitando apenas o período do mês já pago.</p>
            </details>

            <details className="bg-white p-6 rounded-xl border border-slate-200 cursor-pointer group">
              <summary className="font-bold text-slate-900 list-none flex justify-between items-center">
                Como funcionará o pagamento online no futuro?
                <span className="text-brand-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-slate-600">Estamos integrando gateways de pagamento (Pix automático e Cartão). Quando ativado, o cliente paga no próprio site e o pedido já chega com status "Pago" no seu WhatsApp.</p>
            </details>
          </div>
        </div>
      </section>

      {/* CONTACT FORM */}
      <section id="contato" className="py-24 bg-brand-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-white">
              <h2 className="text-4xl font-bold mb-6">Pronto para transformar seu delivery?</h2>
              <p className="text-brand-100 text-lg mb-8">
                Preencha o formulário ao lado e entraremos em contato para configurar seu cardápio digital. É rápido, fácil e moderno.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-brand-800 p-3 rounded-lg">
                    <Smartphone className="h-6 w-6 text-brand-300" />
                  </div>
                  <div>
                    <h5 className="font-bold">Suporte via WhatsApp</h5>
                    <p className="text-brand-200 text-sm">Ajuda humanizada para configurar sua loja.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-brand-800 p-3 rounded-lg">
                    <Check className="h-6 w-6 text-brand-300" />
                  </div>
                  <div>
                    <h5 className="font-bold">Setup Rápido</h5>
                    <p className="text-brand-200 text-sm">Seu cardápio no ar em até 24h úteis.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FORM COMPONENT */}
            <LeadForm />
          </div>
        </div>
      </section>
    </>
  );
}
