import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FavoriteRestaurantForm } from '@/components/FavoriteRestaurantForm';
import { FavoriteRestaurantList } from '@/components/FavoriteRestaurantList';

type FavoriteRestaurantsPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(
  props: FavoriteRestaurantsPageProps
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'FavoriteRestaurantsPage',
  });

  return {
    title: t('meta_title'),
  };
}

export default async function FavoriteRestaurantsPage(
  props: FavoriteRestaurantsPageProps
) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <div className="py-5 [&_p]:my-6">
      <FavoriteRestaurantForm />
      <FavoriteRestaurantList />
    </div>
  );
}
