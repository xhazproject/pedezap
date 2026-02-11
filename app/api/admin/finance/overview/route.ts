import { NextResponse } from "next/server";
import { readStore } from "@/lib/store";

function lastSixMonths() {
  const result: { key: string; label: string; value: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleString("pt-BR", { month: "short" });
    result.push({ key, label: label.charAt(0).toUpperCase() + label.slice(1), value: 0 });
  }
  return result;
}

export async function GET() {
  const store = await readStore();
  const now = new Date();
  const allPlans = store.plans;
  const planById = new Map(allPlans.map((plan) => [plan.id, plan]));
  const planByName = new Map(allPlans.map((plan) => [plan.name, plan]));

  const resolvePlan = (restaurant: (typeof store.restaurants)[number]) =>
    (restaurant.subscribedPlanId ? planById.get(restaurant.subscribedPlanId) : null) ??
    planByName.get(restaurant.plan) ??
    null;

  const activeRestaurants = store.restaurants.filter((item) => item.active);

  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const paidInvoicesThisMonth = store.invoices.filter((invoice) => {
    if (invoice.status !== "Pago") return false;
    const dueDate = new Date(invoice.dueDate);
    return dueDate >= currentMonthStart && dueDate < nextMonthStart;
  });

  const mrr = paidInvoicesThisMonth.reduce((sum, invoice) => sum + invoice.value, 0);
  const paidRestaurantsThisMonth = new Set(
    paidInvoicesThisMonth.map((invoice) => invoice.restaurantSlug)
  ).size;
  const arpu = paidRestaurantsThisMonth ? mrr / paidRestaurantsThisMonth : 0;

  const churnWindowStart = new Date(now);
  churnWindowStart.setDate(churnWindowStart.getDate() - 30);
  const churned = store.restaurants.filter(
    (item) => item.canceledAt && new Date(item.canceledAt) >= churnWindowStart
  ).length;
  const churnBase = activeRestaurants.length + churned;
  const churnRate = churnBase ? (churned / churnBase) * 100 : 0;

  const delinquentInvoices = store.invoices.filter((invoice) => {
    if (invoice.status === "Pago" || invoice.status === "Estornado") return false;
    return new Date(invoice.dueDate) < now;
  });
  const delinquencyValue = delinquentInvoices.reduce((sum, invoice) => sum + invoice.value, 0);

  const months = lastSixMonths();
  store.invoices.forEach((invoice) => {
    if (invoice.status !== "Pago") return;
    const key = `${invoice.dueDate.slice(0, 7)}`;
    const month = months.find((item) => item.key === key);
    if (month) month.value += invoice.value;
  });

  const planDistribution = allPlans
    .map((plan) => ({
      name: plan.name,
      value: activeRestaurants.filter((item) => resolvePlan(item)?.id === plan.id).length,
      color: plan.color
    }))
    .filter((item) => item.value > 0 || allPlans.find((plan) => plan.name === item.name)?.active);

  const activeWithoutPlan = activeRestaurants.filter((item) => !resolvePlan(item)).length;
  if (activeWithoutPlan > 0) {
    planDistribution.push({
      name: "Sem plano",
      value: activeWithoutPlan,
      color: "#94a3b8"
    });
  }

  return NextResponse.json({
    success: true,
    kpis: {
      mrr,
      churnRate,
      arpu,
      delinquencyValue,
      delinquencyCount: delinquentInvoices.length
    },
    mrrData: months.map((item) => ({ name: item.label, value: item.value })),
    planDistribution
  });
}
