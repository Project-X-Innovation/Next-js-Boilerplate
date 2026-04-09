import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { RemoveFavoriteButton } from '@/components/RemoveFavoriteButton';
import { db } from '@/libs/DB';
import { favoriteRestaurantSchema } from '@/models/Schema';

/**
 * Displays the authenticated user's list of favorite restaurants.
 * @returns The favorite restaurants list element.
 */
export const FavoriteRestaurantList = async () => {
  const t = await getTranslations('FavoriteRestaurantList');
  const { userId } = await auth();

  const favorites = await db
    .select()
    .from(favoriteRestaurantSchema)
    .where(eq(favoriteRestaurantSchema.userId, userId ?? ''));

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800">{t('title')}</h2>

      {favorites.length === 0 ? (
        <p>{t('empty_state')}</p>
      ) : (
        <ul className="my-4 space-y-2">
          {favorites.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-sm border border-gray-200 px-3 py-2"
            >
              <span className="text-gray-700">{item.name}</span>
              <RemoveFavoriteButton id={item.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
