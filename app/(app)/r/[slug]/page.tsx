import { RestaurantClient } from '@/components/customer/restaurant-client';

export default function RestaurantPage({ params }: { params: { slug: string } }) {
  return <RestaurantClient slug={params.slug} />;
}
