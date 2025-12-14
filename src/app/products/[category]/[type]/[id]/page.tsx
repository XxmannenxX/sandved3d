import { redirect } from 'next/navigation'

export const runtime = 'edge'

export default async function NestedProductRedirectPage({
  params,
}: {
  params: Promise<{ category: string; type: string; id: string }>
}) {
  const { id } = await params
  redirect(`/products/item/${encodeURIComponent(id)}`)
}


