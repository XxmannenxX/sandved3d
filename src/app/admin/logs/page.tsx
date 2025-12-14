import { createClient } from "@/lib/supabase/server"
import LogsClient from "./LogsClient"

export default async function AdminLogsPage() {
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from("admin_audit_logs")
    .select("id,created_at,admin_user_id,action,table_name,record_id,metadata")
    .order("created_at", { ascending: false })
    .limit(500)

  return <LogsClient initialLogs={logs || []} />
}


