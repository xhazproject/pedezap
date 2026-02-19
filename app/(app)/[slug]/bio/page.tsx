import { redirect } from 'next/navigation';

export default function LegacyRestaurantBioRoute({ params }: { params: { slug: string } }) {
  redirect(`/r/${params.slug}/bio`);
}
