'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { Product } from '@/lib/types'

export type ProductFormData = {
  name: string
  slug: string
  description: string
  price: number
  category: string
  available: boolean
  image_url?: string | null
}

export async function createProduct(data: ProductFormData): Promise<{ error?: string }> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('products').insert({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      price: data.price,
      category: data.category,
      available: data.available,
      image_url: data.image_url ?? null,
    })

    if (error) return { error: error.message }

    revalidatePath('/admin/products')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function updateProduct(
  id: string,
  data: Partial<ProductFormData>
): Promise<{ error?: string }> {
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('products')
      .update(data)
      .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/products')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function deleteProduct(id: string): Promise<{ error?: string }> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('products').delete().eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/products')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function toggleAvailability(
  id: string,
  available: boolean
): Promise<{ error?: string }> {
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('products')
      .update({ available })
      .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/products')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function uploadProductImage(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  try {
    const file = formData.get('file') as File | null
    if (!file) return { error: 'No file provided' }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { error: 'Only JPEG, PNG, and WEBP images are allowed.' }
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return { error: 'Image must be smaller than 5MB.' }
    }

    const admin = createAdminClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const fileName = `${crypto.randomUUID()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await admin.storage
      .from('product-images')
      .upload(fileName, buffer, { contentType: file.type, upsert: false })

    if (uploadError) return { error: uploadError.message }

    const { data } = admin.storage.from('product-images').getPublicUrl(fileName)
    return { url: data.publicUrl }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Upload failed' }
  }
}
