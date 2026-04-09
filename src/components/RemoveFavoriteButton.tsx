'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/libs/I18nNavigation';

/**
 * Renders a button to remove a favorite restaurant by id.
 * @param props - The component props.
 * @param props.id - The id of the favorite restaurant to remove.
 * @returns The remove button element.
 */
export const RemoveFavoriteButton = (props: { id: number }) => {
  const t = useTranslations('RemoveFavoriteButton');
  const router = useRouter();

  const handleRemove = async () => {
    await fetch('/api/favorite-restaurants', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: props.id }),
    });

    router.refresh();
  };

  return (
    <button
      className="text-sm text-red-500 hover:text-red-700"
      type="button"
      onClick={handleRemove}
    >
      {t('button_remove')}
    </button>
  );
};
