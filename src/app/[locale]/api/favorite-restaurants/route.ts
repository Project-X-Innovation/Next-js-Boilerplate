import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import { db } from '@/libs/DB';
import { favoriteRestaurantSchema } from '@/models/Schema';
import {
  AddFavoriteRestaurantValidation,
  RemoveFavoriteRestaurantValidation,
} from '@/validations/FavoriteRestaurantValidation';

/**
 * Lists all favorite restaurants for the authenticated user.
 * @returns A JSON response containing the user's favorites array.
 */
export const GET = async () => {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const favorites = await db
    .select()
    .from(favoriteRestaurantSchema)
    .where(eq(favoriteRestaurantSchema.userId, userId));

  return NextResponse.json({ favorites });
};

/**
 * Adds a favorite restaurant for the authenticated user.
 * @param request - The incoming HTTP request with a JSON body containing the restaurant name.
 * @returns A JSON response containing the created favorite.
 */
export const POST = async (request: Request) => {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await request.json();
  const parse = AddFavoriteRestaurantValidation.safeParse(json);

  if (!parse.success) {
    return NextResponse.json(z.treeifyError(parse.error), { status: 422 });
  }

  const result = await db
    .insert(favoriteRestaurantSchema)
    .values({ userId, name: parse.data.name })
    .returning();

  return NextResponse.json({ favorite: result[0] });
};

/**
 * Removes a favorite restaurant for the authenticated user.
 * @param request - The incoming HTTP request with a JSON body containing the favorite id.
 * @returns A JSON response containing the deleted favorite.
 */
export const DELETE = async (request: Request) => {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await request.json();
  const parse = RemoveFavoriteRestaurantValidation.safeParse(json);

  if (!parse.success) {
    return NextResponse.json(z.treeifyError(parse.error), { status: 422 });
  }

  const result = await db
    .delete(favoriteRestaurantSchema)
    .where(
      and(
        eq(favoriteRestaurantSchema.id, parse.data.id),
        eq(favoriteRestaurantSchema.userId, userId)
      )
    )
    .returning();

  return NextResponse.json({ favorite: result[0] });
};
