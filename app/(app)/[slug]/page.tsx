import { redirect } from 'next/navigation';

export default function LegacyRestaurantRoute({ params }: { params: { slug: string } }) {
  redirect(`/r/${params.slug}`);
}
