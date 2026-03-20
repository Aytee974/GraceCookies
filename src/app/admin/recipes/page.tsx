'use client'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  createRecipe,
  updateRecipe,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from '@/app/actions/recipes'
import type { Product, Recipe, RecipeIngredient } from '@/lib/types'

type ProductWithRecipe = Product & {
  recipe: (Recipe & { ingredients: RecipeIngredient[] }) | null
}

export default function RecipesPage() {
  const [products, setProducts] = useState<ProductWithRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Per-product state for new recipe batch size
  const [newBatchSizes, setNewBatchSizes] = useState<Record<string, string>>({})
  // Per-recipe state for editing batch size
  const [editingBatch, setEditingBatch] = useState<Record<string, string>>({})
  // Per-recipe state for new ingredient
  const [newIngredient, setNewIngredient] = useState<
    Record<string, { name: string; quantity: string; unit: string }>
  >({})
  // Per-ingredient inline edit
  const [editingIngredient, setEditingIngredient] = useState<
    Record<string, { name: string; quantity: string; unit: string }>
  >({})
  // Per-action errors
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({})

  async function fetchData() {
    setLoading(true)
    try {
      const supabase = createClient()

      const { data: prods, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true })

      if (prodErr) { setPageError(prodErr.message); setLoading(false); return }

      const { data: recipes, error: recipeErr } = await supabase
        .from('recipes')
        .select('*')

      if (recipeErr) { setPageError(recipeErr.message); setLoading(false); return }

      const { data: ingredients, error: ingErr } = await supabase
        .from('recipe_ingredients')
        .select('*')

      if (ingErr) { setPageError(ingErr.message); setLoading(false); return }

      const combined: ProductWithRecipe[] = (prods ?? []).map((p: Product) => {
        const recipe = (recipes ?? []).find((r: Recipe) => r.product_id === p.id) ?? null
        return {
          ...p,
          recipe: recipe
            ? {
                ...recipe,
                ingredients: (ingredients ?? []).filter(
                  (i: RecipeIngredient) => i.recipe_id === recipe.id
                ),
              }
            : null,
        }
      })

      setProducts(combined)
    } catch {
      setPageError('Could not load data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  function setError(key: string, msg: string) {
    setActionErrors((prev) => ({ ...prev, [key]: msg }))
  }

  function clearError(key: string) {
    setActionErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function handleAddRecipe(productId: string) {
    const batchSize = parseInt(newBatchSizes[productId] ?? '0')
    if (!batchSize || batchSize <= 0) {
      setError(`batch-${productId}`, 'Enter a valid batch size.')
      return
    }
    clearError(`batch-${productId}`)
    startTransition(async () => {
      const result = await createRecipe(productId, batchSize)
      if (result.error) { setError(`batch-${productId}`, result.error); return }
      setNewBatchSizes((prev) => { const n = { ...prev }; delete n[productId]; return n })
      await fetchData()
    })
  }

  function handleUpdateBatch(recipeId: string) {
    const batchSize = parseInt(editingBatch[recipeId] ?? '0')
    if (!batchSize || batchSize <= 0) {
      setError(`editbatch-${recipeId}`, 'Enter a valid batch size.')
      return
    }
    clearError(`editbatch-${recipeId}`)
    startTransition(async () => {
      const result = await updateRecipe(recipeId, batchSize)
      if (result.error) { setError(`editbatch-${recipeId}`, result.error); return }
      setEditingBatch((prev) => { const n = { ...prev }; delete n[recipeId]; return n })
      await fetchData()
    })
  }

  function handleAddIngredient(recipeId: string) {
    const ing = newIngredient[recipeId]
    if (!ing?.name?.trim() || !ing?.unit?.trim()) {
      setError(`ing-${recipeId}`, 'Name and unit are required.')
      return
    }
    const qty = parseFloat(ing.quantity ?? '0')
    if (isNaN(qty) || qty <= 0) {
      setError(`ing-${recipeId}`, 'Enter a valid quantity.')
      return
    }
    clearError(`ing-${recipeId}`)
    startTransition(async () => {
      const result = await createIngredient(recipeId, ing.name.trim(), qty, ing.unit.trim())
      if (result.error) { setError(`ing-${recipeId}`, result.error); return }
      setNewIngredient((prev) => { const n = { ...prev }; delete n[recipeId]; return n })
      await fetchData()
    })
  }

  function handleDeleteIngredient(ingredientId: string) {
    if (!confirm('Delete this ingredient?')) return
    startTransition(async () => {
      const result = await deleteIngredient(ingredientId)
      if (result.error) { setError(`deling-${ingredientId}`, result.error); return }
      await fetchData()
    })
  }

  function handleUpdateIngredient(ingredientId: string) {
    const ing = editingIngredient[ingredientId]
    if (!ing?.name?.trim() || !ing?.unit?.trim()) {
      setError(`eing-${ingredientId}`, 'Name and unit are required.')
      return
    }
    const qty = parseFloat(ing.quantity ?? '0')
    if (isNaN(qty) || qty <= 0) {
      setError(`eing-${ingredientId}`, 'Enter a valid quantity.')
      return
    }
    clearError(`eing-${ingredientId}`)
    startTransition(async () => {
      const result = await updateIngredient(ingredientId, ing.name.trim(), qty, ing.unit.trim())
      if (result.error) { setError(`eing-${ingredientId}`, result.error); return }
      setEditingIngredient((prev) => { const n = { ...prev }; delete n[ingredientId]; return n })
      await fetchData()
    })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-violet mb-6">Recipes</h1>

      {pageError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600 mb-6">
          {pageError}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-400 text-sm py-12">Loading…</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No products found. Add products first.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-900">{product.name}</span>
                  <span className="ml-2 text-xs text-gray-400">{product.category}</span>
                </div>
              </div>

              <div className="p-5">
                {!product.recipe ? (
                  /* No recipe yet */
                  <div className="flex items-end gap-3">
                    <div className="w-32">
                      <Input
                        label="Batch size"
                        type="number"
                        min="1"
                        value={newBatchSizes[product.id] ?? ''}
                        onChange={(e) =>
                          setNewBatchSizes((prev) => ({ ...prev, [product.id]: e.target.value }))
                        }
                        placeholder="12"
                      />
                    </div>
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleAddRecipe(product.id)}
                    >
                      Add Recipe
                    </Button>
                    {actionErrors[`batch-${product.id}`] && (
                      <p className="text-xs text-red-500">{actionErrors[`batch-${product.id}`]}</p>
                    )}
                  </div>
                ) : (
                  /* Has recipe */
                  <div>
                    {/* Batch size row */}
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Batch size:</span>
                      {editingBatch[product.recipe.id] !== undefined ? (
                        <>
                          <Input
                            type="number"
                            min="1"
                            value={editingBatch[product.recipe.id]}
                            onChange={(e) =>
                              setEditingBatch((prev) => ({
                                ...prev,
                                [product.recipe!.id]: e.target.value,
                              }))
                            }
                            className="w-24"
                          />
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleUpdateBatch(product.recipe!.id)}
                          >
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setEditingBatch((prev) => {
                                const n = { ...prev }
                                delete n[product.recipe!.id]
                                return n
                              })
                            }
                          >
                            Cancel
                          </Button>
                          {actionErrors[`editbatch-${product.recipe.id}`] && (
                            <p className="text-xs text-red-500">
                              {actionErrors[`editbatch-${product.recipe.id}`]}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="font-medium text-gray-900">{product.recipe.batch_size}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setEditingBatch((prev) => ({
                                ...prev,
                                [product.recipe!.id]: String(product.recipe!.batch_size),
                              }))
                            }
                          >
                            Edit
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Ingredients table */}
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Ingredients
                      </h3>
                      {product.recipe.ingredients.length === 0 ? (
                        <p className="text-xs text-gray-400 mb-3">No ingredients yet.</p>
                      ) : (
                        <table className="w-full text-sm mb-3">
                          <thead>
                            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                              <th className="pb-2 pr-4 font-medium">Name</th>
                              <th className="pb-2 pr-4 font-medium">Qty</th>
                              <th className="pb-2 pr-4 font-medium">Unit</th>
                              <th className="pb-2 font-medium" />
                            </tr>
                          </thead>
                          <tbody>
                            {product.recipe.ingredients.map((ing) => (
                              <tr key={ing.id} className="border-b border-gray-50">
                                {editingIngredient[ing.id] ? (
                                  <>
                                    <td className="py-1.5 pr-3">
                                      <input
                                        value={editingIngredient[ing.id].name}
                                        onChange={(e) =>
                                          setEditingIngredient((prev) => ({
                                            ...prev,
                                            [ing.id]: { ...prev[ing.id], name: e.target.value },
                                          }))
                                        }
                                        className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                                      />
                                    </td>
                                    <td className="py-1.5 pr-3">
                                      <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={editingIngredient[ing.id].quantity}
                                        onChange={(e) =>
                                          setEditingIngredient((prev) => ({
                                            ...prev,
                                            [ing.id]: { ...prev[ing.id], quantity: e.target.value },
                                          }))
                                        }
                                        className="w-20 border border-gray-200 rounded px-2 py-1 text-sm"
                                      />
                                    </td>
                                    <td className="py-1.5 pr-3">
                                      <input
                                        value={editingIngredient[ing.id].unit}
                                        onChange={(e) =>
                                          setEditingIngredient((prev) => ({
                                            ...prev,
                                            [ing.id]: { ...prev[ing.id], unit: e.target.value },
                                          }))
                                        }
                                        className="w-20 border border-gray-200 rounded px-2 py-1 text-sm"
                                      />
                                    </td>
                                    <td className="py-1.5">
                                      <div className="flex items-center gap-1">
                                        <Button
                                          size="sm"
                                          disabled={isPending}
                                          onClick={() => handleUpdateIngredient(ing.id)}
                                        >
                                          Save
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            setEditingIngredient((prev) => {
                                              const n = { ...prev }
                                              delete n[ing.id]
                                              return n
                                            })
                                          }
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                      {actionErrors[`eing-${ing.id}`] && (
                                        <p className="text-xs text-red-500 mt-1">
                                          {actionErrors[`eing-${ing.id}`]}
                                        </p>
                                      )}
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="py-2 pr-4 text-gray-900">{ing.name}</td>
                                    <td className="py-2 pr-4 text-gray-700">{ing.quantity}</td>
                                    <td className="py-2 pr-4 text-gray-600">{ing.unit}</td>
                                    <td className="py-2">
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            setEditingIngredient((prev) => ({
                                              ...prev,
                                              [ing.id]: {
                                                name: ing.name,
                                                quantity: String(ing.quantity),
                                                unit: ing.unit,
                                              },
                                            }))
                                          }
                                        >
                                          Edit
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                          onClick={() => handleDeleteIngredient(ing.id)}
                                          disabled={isPending}
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {/* Add ingredient row */}
                      <div className="flex items-end gap-2 flex-wrap">
                        <div className="flex-1 min-w-[120px]">
                          <Input
                            placeholder="Name"
                            value={newIngredient[product.recipe.id]?.name ?? ''}
                            onChange={(e) =>
                              setNewIngredient((prev) => ({
                                ...prev,
                                [product.recipe!.id]: {
                                  ...prev[product.recipe!.id],
                                  name: e.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="w-24">
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="Qty"
                            value={newIngredient[product.recipe.id]?.quantity ?? ''}
                            onChange={(e) =>
                              setNewIngredient((prev) => ({
                                ...prev,
                                [product.recipe!.id]: {
                                  ...prev[product.recipe!.id],
                                  quantity: e.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="w-24">
                          <Input
                            placeholder="Unit"
                            value={newIngredient[product.recipe.id]?.unit ?? ''}
                            onChange={(e) =>
                              setNewIngredient((prev) => ({
                                ...prev,
                                [product.recipe!.id]: {
                                  ...prev[product.recipe!.id],
                                  unit: e.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isPending}
                          onClick={() => handleAddIngredient(product.recipe!.id)}
                        >
                          Add
                        </Button>
                        {actionErrors[`ing-${product.recipe.id}`] && (
                          <p className="text-xs text-red-500 w-full mt-1">
                            {actionErrors[`ing-${product.recipe.id}`]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
