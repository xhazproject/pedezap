import { LeadForm } from '@/components/lead-form';
import React from 'react';
import { readStore } from '@/lib/store';
import {
  Check,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Menu,
  MessageCircle,
  ShoppingBag,
  Smartphone,
  Store,
  Zap
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const Link = ({ href, children, className }: { href: string; children?: React.ReactNode; className?: string }) => (
  <a href={href} className={className}>
    {children}
  </a>
);

function StepCard({
  icon: Icon,
  title,
  description
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 md:rounded-3xl md:p-7">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-900 md:mb-5 md:h-11 md:w-11">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-2xl font-bold text-slate-950 md:text-3xl">{title}</h3>
      <p className="mt-2 text-base leading-7 text-slate-600 md:mt-3 md:text-lg md:leading-8">{description}</p>
    </article>
  );
}

export default async function LandingPage() {
  const store = await readStore().catch(() => null);
  const allPlans = store?.plans ?? [];
  const preferredPlans = allPlans.filter((plan) => plan.active);
  const activePlans = (preferredPlans.length ? preferredPlans : allPlans).slice(0, 2);
  const planCards =
    activePlans.length > 0
      ? activePlans
      : [
          {
            id: 'starter_fallback',
            name: 'Starter',
            description: 'Essencial para quem esta comecando.',
            features: ['Pagamento na entrega', 'Pedidos ilimitados', 'Link exclusivo', 'Suporte por email']
          },
          {
            id: 'pro_fallback',
            name: 'Pro',
            description: 'Gestao e controle total.',
            features: ['Tudo do plano Starter', 'Relatorios de Vendas', 'Impressao automatica', 'Gestor de pedidos']
          }
        ];
  const leadPlanOptions = (preferredPlans.length ? preferredPlans : allPlans).map((plan) => ({
    id: plan.id,
    name: plan.name
  }));

  return (
    <>
      <section className="border-b border-slate-200 bg-white py-12 md:py-16 lg:py-24">
        <div className="container-custom grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 md:px-4 md:text-sm">
              <span className="h-2 w-2 rounded-full bg-black"></span> O futuro do delivery e simples
            </div>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.06] tracking-tight text-slate-950 sm:text-5xl md:mt-8 md:text-6xl lg:text-7xl">
              Venda mais.
              <br />
              <span className="text-slate-400">Sem apps.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9 md:mt-8 md:text-2xl md:leading-10">
              Transforme seu WhatsApp em uma maquina de vendas. Cardapio digital minimalista, pedidos formatados e zero taxas abusivas.
            </p>
            <div className="mt-7 md:mt-10">
              <Link
                href="#contato"
                className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-base font-semibold text-white shadow-lg shadow-black/15 transition hover:bg-slate-900 sm:gap-3 sm:px-8 sm:py-4 sm:text-lg md:text-xl"
              >
                Criar Cardapio <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[420px] sm:max-w-[470px]">
            <div className="rounded-[28px] border-[5px] border-slate-900 bg-white p-3 shadow-2xl shadow-slate-300 md:rounded-[36px] md:border-[6px] md:p-4">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-3 md:rounded-[28px] md:p-4">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black text-white md:h-12 md:w-12">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-950 md:text-2xl">Burger Minimal</p>
                    <p className="text-xs text-slate-500 md:text-sm">Aberto - Entrega 30-40 min</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {[1, 2].map((item) => (
                    <div key={item} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3 md:px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-slate-200 md:h-14 md:w-14"></div>
                        <div>
                          <div className="h-4 w-24 rounded-full bg-slate-900"></div>
                          <div className="mt-2 h-3 w-14 rounded-full bg-slate-300"></div>
                        </div>
                      </div>
                      <button className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-700">+</button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span className="text-base font-semibold text-slate-950">R$ 42,00</span>
                  </div>
                  <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-3 text-base font-semibold text-white hover:bg-slate-900">
                    Enviar Pedido <MessageCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="border-b border-slate-200 bg-white py-12 md:py-16 lg:py-20">
        <div className="container-custom">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-slate-950 sm:text-4xl md:text-5xl">Essencia do simples.</h2>
            <p className="mt-4 text-lg text-slate-500 sm:text-xl md:mt-5 md:text-2xl">
              Removemos a complexidade. Apenas 3 passos separam seu cliente do pedido finalizado.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:mt-14 md:grid-cols-3 md:gap-6">
            <StepCard icon={Menu} title="1. Cardapio" description="Voce cadastra seus produtos em nossa plataforma intuitiva." />
            <StepCard icon={ShoppingBag} title="2. Escolha" description="Seu cliente monta a sacola atraves de um link limpo e rapido." />
            <StepCard icon={MessageCircle} title="3. Envio" description="O pedido chega pronto no seu WhatsApp. Sem intermediarios." />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 py-12 md:py-16 lg:py-20">
        <div className="container-custom grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl md:text-6xl">
              Design invisivel.
              <br />
              Resultados visiveis.
            </h2>
            <div className="mt-7 space-y-5 md:mt-10 md:space-y-7">
              {[
                { icon: Store, title: 'Identidade Propria', desc: 'Link exclusivo (app.pedezap.ai/voce).' },
                { icon: LayoutDashboard, title: 'Controle Total', desc: 'Painel administrativo simples e direto.' },
                { icon: MessageCircle, title: 'Automacao', desc: 'Mensagens formatadas automaticamente.' },
                { icon: CreditCard, title: 'Pagamento Local', desc: 'Receba na entrega (Dinheiro ou Maquina).' }
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900 md:h-12 md:w-12">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-slate-950 md:text-3xl">{item.title}</p>
                    <p className="mt-1 text-base text-slate-500 md:text-xl">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[420px] md:max-w-[460px]">
            <div className="absolute -top-4 left-6 right-6 h-20 rounded-md bg-slate-200"></div>
            <div className="absolute -top-2 left-3 right-3 h-20 rounded-md bg-slate-100"></div>
            <article className="relative rounded-sm border border-slate-200 bg-white p-6 shadow-xl md:p-8">
              <div className="text-center text-slate-900">
                <Zap className="mx-auto h-7 w-7" />
              </div>
              <div className="mt-6 flex items-center justify-between text-sm text-slate-500 md:mt-7">
                <span className="font-semibold">PEDIDO #1029</span>
                <span>19:42</span>
              </div>
              <div className="mt-5 space-y-3 text-sm text-slate-700">
                <div className="flex justify-between"><span>1x Smash Burger</span><span>R$ 28,00</span></div>
                <div className="flex justify-between"><span>1x Fritas Rusticas</span><span>R$ 14,00</span></div>
                <div className="flex justify-between"><span>1x Coke Zero</span><span>R$ 6,00</span></div>
              </div>
              <hr className="my-5 border-dashed border-slate-300" />
              <div className="flex items-end justify-between">
                <span className="text-sm text-slate-400">Total a pagar</span>
                <span className="text-3xl font-extrabold text-slate-950 sm:text-4xl md:text-5xl">R$ 48,00</span>
              </div>
              <div className="mt-7 border-t border-slate-200 pt-5 text-center text-xs tracking-widest text-slate-400">
                PAGAR NA ENTREGA
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="planos" className="border-b border-slate-200 bg-white py-12 md:py-16 lg:py-20">
        <div className="container-custom">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-slate-950 sm:text-4xl md:text-5xl">Investimento Simples</h2>
            <p className="mt-4 text-lg text-slate-500 sm:text-xl md:mt-5 md:text-2xl">Sem pegadinhas. Escolha como quer crescer.</p>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:mt-14 md:grid-cols-2 md:gap-6">
            {planCards.map((plan, index) => {
              const highlighted = index === 1;
              return (
                <article
                  key={plan.id}
                  className={
                    highlighted
                      ? 'relative rounded-3xl border border-slate-900 bg-black p-6 text-white shadow-lg shadow-black/25 md:p-8'
                      : 'rounded-3xl border border-slate-200 bg-white p-6 md:p-8'
                  }
                >
                  {highlighted && (
                    <div className="absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-[10px] font-bold tracking-wide text-slate-900 md:right-6 md:top-6 md:px-4 md:text-xs">
                      MAIS POPULAR
                    </div>
                  )}
                  <h3 className={`text-3xl font-bold md:text-4xl ${highlighted ? 'text-white' : 'text-slate-950'}`}>{plan.name}</h3>
                  <p className={`mt-2 text-lg md:text-xl ${highlighted ? 'text-slate-300' : 'text-slate-500'}`}>{plan.description}</p>
                  <ul className={`mt-7 space-y-4 text-lg md:mt-8 md:text-xl ${highlighted ? 'text-slate-100' : 'text-slate-700'}`}>
                    {plan.features.slice(0, 5).map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <Check className={`h-5 w-5 ${highlighted ? 'text-white' : 'text-slate-900'}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="#contato"
                    className={
                      highlighted
                        ? 'mt-8 flex w-full items-center justify-center rounded-full bg-white py-3 text-lg font-semibold text-slate-900 transition hover:bg-slate-100 md:mt-10 md:py-4 md:text-xl'
                        : 'mt-8 flex w-full items-center justify-center rounded-full border border-slate-900 py-3 text-lg font-semibold text-slate-900 transition hover:bg-slate-50 md:mt-10 md:py-4 md:text-xl'
                    }
                  >
                    Selecionar {plan.name}
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-12 md:py-16 lg:py-20">
        <div className="container-custom max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-slate-950 sm:text-4xl md:text-5xl">Duvidas?</h2>
          <div className="mt-8 space-y-4 md:mt-12">
            {[
              {
                q: 'Preciso baixar algum aplicativo?',
                a: 'Nao. Tudo roda no navegador, leve e rapido.',
                open: true
              },
              {
                q: 'Funciona no WhatsApp Business?',
                a: 'Sim, funciona no WhatsApp normal e no Business.',
                open: false
              },
              {
                q: 'Tem taxa sobre vendas?',
                a: 'Nao cobramos comissao por pedido.',
                open: false
              },
              {
                q: 'Consigo alterar o cardapio?',
                a: 'Sim, voce edita produtos e precos pelo painel quando quiser.',
                open: false
              }
            ].map((item) => (
              <details key={item.q} className="group rounded-2xl border border-slate-200 bg-white p-5 md:p-6" open={item.open}>
                <summary className="flex list-none cursor-pointer items-center justify-between text-lg font-semibold text-slate-950 sm:text-xl md:text-2xl">
                  {item.q}
                  <span className="text-slate-400 transition group-open:rotate-180">v</span>
                </summary>
                <p className="mt-3 text-base text-slate-500 sm:text-lg md:mt-4 md:text-xl">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="contato" className="bg-black py-12 md:py-16 lg:py-20">
        <div className="container-custom grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="pt-2 text-white md:pt-6">
            <h2 className="text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
              Vamos escalar
              <br />
              sua operacao.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300 sm:text-xl sm:leading-9 md:mt-8 md:text-2xl md:leading-10">
              Deixe seus dados. Nossa equipe entrara em contato para um setup personalizado da sua loja. Sem compromisso.
            </p>

            <div className="mt-8 space-y-6 md:mt-10 md:space-y-7">
              <div className="flex items-start gap-4">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white md:h-12 md:w-12">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold md:text-3xl">Suporte Humanizado</p>
                  <p className="text-base text-slate-400 md:text-lg">Resolvemos seus problemas de verdade.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white md:h-12 md:w-12">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold md:text-3xl">Setup em 24h</p>
                  <p className="text-base text-slate-400 md:text-lg">Seu cardapio no ar amanha.</p>
                </div>
              </div>
            </div>
          </div>

          <LeadForm plans={leadPlanOptions} />
        </div>
      </section>
    </>
  );
}
