'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createRecipe(
  productId: string,
  batchSize: number
): Promise<{ id?: string; error?: string }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('recipes')
      .insert({ product_id: productId, batch_size: batchSize })
      .select('id')
      .single()

    if (error) return { error: error.message }

    revalidatePath('/admin/recipes')
    return { id: data.id }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function updateRecipe(
  recipeId: string,
  batchSize: number
): Promise<{ error?: string }> {
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('recipes')
      .update({ batch_size: batchSize })
      .eq('id', recipeId)

    if (error) return { error: error.message }

    revalidatePath('/admin/recipes')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function createIngredient(
  recipeId: string,
  name: string,
  quantity: number,
  unit: string
): Promise<{ id?: string; error?: string }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('recipe_ingredients')
      .insert({ recipe_id: recipeId, name, quantity, unit })
      .select('id')
      .single()

    if (error) return { error: error.message }

    revalidatePath('/admin/recipes')
    return { id: data.id }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function updateIngredient(
  ingredientId: string,
  name: string,
  quantity: number,
  unit: string
): Promise<{ error?: string }> {
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('recipe_ingredients')
      .update({ name, quantity, unit })
      .eq('id', ingredientId)

    if (error) return { error: error.message }

    revalidatePath('/admin/recipes')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function deleteIngredient(
  ingredientId: string
): Promise<{ error?: string }> {
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('recipe_ingredients')
      .delete()
      .eq('id', ingredientId)

    if (error) return { error: error.message }

    revalidatePath('/admin/recipes')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
