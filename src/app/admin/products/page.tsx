'use client'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  createProduct,
  updateProduct,
  deleteProduct,
  toggleAvailability,
  uploadProductImage,
} from '@/app/actions/products'
import type { Product } from '@/lib/types'

const CATEGORIES = ['cookies', 'brownies', 'cakes', 'other']

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

interface ProductFormState {
  name: string
  slug: string
  description: string
  price: string
  category: string
  available: boolean
  weekly_quantity: string
  imageFile: File | null
  imageUrl: string | null
}

const emptyForm: ProductFormState = {
  name: '',
  slug: '',
  description: '',
  price: '',
  category: 'cookies',
  available: true,
  weekly_quantity: '0',
  imageFile: null,
  imageUrl: null,
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function fetchProducts() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      if (err) setError(err.message)
      else setProducts(data ?? [])
    } catch {
      setError('Could not load products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: editingId ? f.slug : slugify(name) }))
  }

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
    setShowForm(true)
  }

  function openEdit(product: Product) {
    setEditingId(product.id)
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description ?? '',
      price: String(product.price),
      category: product.category,
      available: product.available,
      weekly_quantity: String(product.weekly_quantity ?? 0),
      imageFile: null,
      imageUrl: product.image_url,
    })
    setFormError(null)
    setShowForm(true)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setForm((f) => ({ ...f, imageFile: file }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!form.name.trim()) { setFormError('Name is required.'); return }
    if (!form.slug.trim()) { setFormError('Slug is required.'); return }
    const price = parseFloat(form.price)
    if (isNaN(price) || price < 0) { setFormError('Price must be a valid number.'); return }

    startTransition(async () => {
      let imageUrl = form.imageUrl ?? null

      // Upload image if a new file was selected
      if (form.imageFile) {
        const fd = new FormData()
        fd.set('file', form.imageFile)
        const uploadResult = await uploadProductImage(fd)
        if (uploadResult.error) {
          setFormError(uploadResult.error)
          return
        }
        imageUrl = uploadResult.url ?? null
      }

      const weekly_quantity = parseInt(form.weekly_quantity) || 0

      const data = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        price,
        category: form.category,
        available: form.available,
        weekly_quantity,
        image_url: imageUrl,
      }

      const result = editingId
        ? await updateProduct(editingId, data)
        : await createProduct(data)

      if (result.error) {
        setFormError(result.error)
        return
      }

      setShowForm(false)
      await fetchProducts()
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this product? This cannot be undone.')) return
    startTransition(async () => {
      const result = await deleteProduct(id)
      if (result.error) {
        setError(result.error)
        return
      }
      await fetchProducts()
    })
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleAvailability(id, !current)
      if (result.error) {
        setError(result.error)
        return
      }
      await fetchProducts()
    })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-violet">Products</h1>
        <Button onClick={openAdd} size="sm">Add Product</Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600 mb-6">
          {error}
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Product' : 'Add Product'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Input
                label="Name"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Input
                label="Slug"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                required
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <Input
                label="Price ($)"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
            </div>
            <div>
              <Input
                label="Weekly quantity (0 = unlimited)"
                type="number"
                min="0"
                value={form.weekly_quantity}
                onChange={(e) => setForm((f) => ({ ...f, weekly_quantity: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded-lg border border-blush-dark px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-blush focus:ring-2 focus:ring-blush/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Image (JPEG/PNG/WEBP, max 5MB)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="text-sm text-gray-600"
              />
              {form.imageUrl && !form.imageFile && (
                <p className="text-xs text-gray-400 mt-1">Current image saved</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="available"
                checked={form.available}
                onChange={(e) => setForm((f) => ({ ...f, available: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="available" className="text-sm font-medium text-gray-700">Available</label>
            </div>

            {formError && (
              <div className="col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {formError}
              </div>
            )}

            <div className="col-span-2 flex gap-3 justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? 'Saving…' : editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
          Loading…
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No products yet. Click &ldquo;Add Product&rdquo; to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Price</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Weekly Qty</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Available</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={p.category} />
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">${Number(p.price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-gray-500 text-sm">
                    {p.weekly_quantity > 0 ? p.weekly_quantity : '∞'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(p.id, p.available)}
                      disabled={isPending}
                      className={`w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
                        p.available ? 'bg-violet' : 'bg-gray-300'
                      }`}
                      aria-label={p.available ? 'Disable product' : 'Enable product'}
                    >
                      <span
                        className={`block w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 mx-0.5 ${
                          p.available ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(p)}
                        disabled={isPending}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(p.id)}
                        disabled={isPending}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
