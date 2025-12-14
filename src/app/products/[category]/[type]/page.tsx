import { redirect } from 'next/navigation'

export default async function TypeRedirectPage({
  params,
}: {
  params: Promise<{ category: string; type: string }>
}) {
  const { category } = await params
  redirect(`/products?category=${encodeURIComponent(category)}`)
}



