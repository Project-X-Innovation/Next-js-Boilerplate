import * as z from 'zod';

/** Validates the body of a request to add a favorite restaurant. */
export const AddFavoriteRestaurantValidation = z.object({
  name: z.string().min(1).max(255),
});

/** Validates the body of a request to remove a favorite restaurant. */
export const RemoveFavoriteRestaurantValidation = z.object({
  id: z.number().int().positive(),
});
