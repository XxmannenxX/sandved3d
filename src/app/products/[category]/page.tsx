import { redirect } from 'next/navigation'

export default async function CategoryRedirectPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  redirect(`/products?category=${encodeURIComponent(category)}`)
}



