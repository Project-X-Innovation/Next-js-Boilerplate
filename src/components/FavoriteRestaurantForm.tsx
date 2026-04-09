'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { useRouter } from '@/libs/I18nNavigation';
import { AddFavoriteRestaurantValidation } from '@/validations/FavoriteRestaurantValidation';

/**
 * Renders a form to add a restaurant to the user's favorites list.
 * @returns The add restaurant form element.
 */
export const FavoriteRestaurantForm = () => {
  const t = useTranslations('FavoriteRestaurantForm');
  const form = useForm({
    resolver: zodResolver(AddFavoriteRestaurantValidation),
    defaultValues: {
      name: '',
    },
  });
  const router = useRouter();

  const handleAdd = form.handleSubmit(async (formData) => {
    const response = await fetch('/api/favorite-restaurants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    await response.json();

    form.reset();
    router.refresh();
  });

  return (
    <form onSubmit={handleAdd}>
      <p>{t('presentation')}</p>
      <div>
        <label className="text-sm font-bold text-gray-700" htmlFor="name">
          {t('label_name')}
          <input
            id="name"
            type="text"
            className="ml-2 w-64 appearance-none rounded-sm border border-gray-200 px-2 py-1 text-sm/tight text-gray-700 focus:ring-3 focus:ring-blue-300/50 focus:outline-hidden"
            {...form.register('name')}
          />
        </label>

        {form.formState.errors.name && (
          <div className="my-2 text-xs text-red-500 italic">
            {t('error_name_required')}
          </div>
        )}
      </div>

      <div className="mt-2">
        <button
          className="rounded-sm bg-blue-500 px-5 py-1 font-bold text-white hover:bg-blue-600 focus:ring-3 focus:ring-blue-300/50 focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
          type="submit"
          disabled={form.formState.isSubmitting}
        >
          {t('button_add')}
        </button>
      </div>
    </form>
  );
};
