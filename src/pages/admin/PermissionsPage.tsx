import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { useDmsStore } from '@/store/dms-store'
import { useState } from 'react'
import type { Permission } from '@/types'

export default function PermissionsPage() {
  const roles = useDmsStore((s) => s.roles)
  const updateRolePermissions = useDmsStore((s) => s.updateRolePermissions)
  const { toast } = useToast()
  const [roleId, setRoleId] = useState(roles[0]?.id ?? '')
  const role = roles.find((r) => r.id === roleId)

  const toggle = (module: Permission['module'], key: keyof Permission) => {
    if (!role) return
    const next = role.permissions.map((p) =>
      p.module === module ? { ...p, [key]: !p[key] } : p,
    )
    updateRolePermissions(role.id, next)
    toast({ title: 'Permissions updated', variant: 'success' })
  }

  return (
    <div>
      <PageHeader title="Permissions" description="Toggle module access for each role. Changes apply immediately." />
      <div className="mb-4 max-w-xs">
        <Select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </Select>
      </div>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface text-left text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-3 py-2">Module</th>
              <th className="px-3 py-2">View</th>
              <th className="px-3 py-2">Create</th>
              <th className="px-3 py-2">Edit</th>
              <th className="px-3 py-2">Delete</th>
            </tr>
          </thead>
          <tbody>
            {role?.permissions.map((p) => (
              <tr key={p.module} className="border-t border-border">
                <td className="px-3 py-2 font-medium">{p.module}</td>
                {(['view', 'create', 'edit', 'delete'] as const).map((k) => (
                  <td key={k} className="px-3 py-2">
                    <Button type="button" size="sm" variant={p[k] ? 'primary' : 'outline'} onClick={() => toggle(p.module, k)}>
                      {p[k] ? 'On' : 'Off'}
                    </Button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
