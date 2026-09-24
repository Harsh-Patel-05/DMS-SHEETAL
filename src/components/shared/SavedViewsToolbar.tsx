import { Bookmark, BookmarkPlus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { SavedView, SavedViewSnapshot } from '@/types/saved-view'
import { useSavedViewsStore } from '@/store/saved-views-store'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@/components/ui/dropdown'
import { cn } from '@/utils/cn'

export interface SavedViewsToolbarProps {
  tableId: string
  captureSnapshot: () => SavedViewSnapshot
  applySnapshot: (snapshot: SavedViewSnapshot) => void
  /** Optional reset when choosing Default view */
  resetToDefault?: () => void
  className?: string
}

export function SavedViewsToolbar({
  tableId,
  captureSnapshot,
  applySnapshot,
  resetToDefault,
  className,
}: SavedViewsToolbarProps) {
  const listForTable = useSavedViewsStore((s) => s.listForTable)
  const getActiveId = useSavedViewsStore((s) => s.getActiveId)
  const setActiveId = useSavedViewsStore((s) => s.setActiveId)
  const saveUserView = useSavedViewsStore((s) => s.saveUserView)
  const updateUserView = useSavedViewsStore((s) => s.updateUserView)
  const deleteUserView = useSavedViewsStore((s) => s.deleteUserView)

  const views = useMemo(() => listForTable(tableId), [listForTable, tableId])
  const activeId = getActiveId(tableId)
  const activeView = views.find((v) => v.id === activeId) ?? null

  const [saveOpen, setSaveOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [overwriteId, setOverwriteId] = useState('')

  const applyView = (view: SavedView) => {
    applySnapshot(view.snapshot)
    setActiveId(tableId, view.id)
  }

  const clearView = () => {
    setActiveId(tableId, null)
    resetToDefault?.()
  }

  const openSave = () => {
    setSaveName(activeView && !activeView.isPreset ? activeView.name : '')
    setOverwriteId(activeView && !activeView.isPreset ? activeView.id : '')
    setSaveOpen(true)
  }

  const handleSave = () => {
    const snapshot = captureSnapshot()
    if (overwriteId) {
      updateUserView(overwriteId, snapshot, saveName)
      setActiveId(tableId, overwriteId)
    } else if (saveName.trim()) {
      saveUserView(tableId, saveName, snapshot)
    } else {
      return
    }
    setSaveOpen(false)
    setSaveName('')
    setOverwriteId('')
  }

  const userViews = views.filter((v) => !v.isPreset)

  return (
    <>
      <div className={cn('flex flex-nowrap items-center gap-1.5', className)}>
        <Select
          value={activeId ?? ''}
          aria-label="Saved views"
          containerClassName="w-auto shrink-0"
          className="h-[var(--size-control-sm)] min-w-[9.5rem] py-0 text-xs sm:min-w-[11rem]"
          onChange={(e) => {
            const id = e.target.value
            if (!id) {
              clearView()
              return
            }
            const match = views.find((v) => v.id === id)
            if (match) applyView(match)
          }}
        >
          <option value="">Default view</option>
          {views.map((v) => (
            <option key={v.id} value={v.id}>
              {v.isPreset ? `${v.name} (example)` : v.name}
            </option>
          ))}
        </Select>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={openSave}
          title="Save view"
        >
          <BookmarkPlus className="h-4 w-4" />
          <span className="hidden lg:inline">Save view</span>
        </Button>

        {activeView && !activeView.isPreset ? (
          <Dropdown>
            <DropdownTrigger>
              <Bookmark className="h-4 w-4" />
              Manage
            </DropdownTrigger>
            <DropdownMenu className="min-w-[12rem] p-1" align="end">
              <DropdownItem
                destructive
                onSelect={() => deleteUserView(activeView.id)}
                className="gap-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete “{activeView.name}”
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : null}
      </div>

      <Modal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title="Save table view"
        description="Stores filters, sort, columns, and page size on this device."
        size="md"
      >
        <div className="space-y-4">
          {userViews.length > 0 ? (
            <FormField label="Update existing (optional)">
              <Select
                value={overwriteId}
                onChange={(e) => {
                  const id = e.target.value
                  setOverwriteId(id)
                  const match = userViews.find((v) => v.id === id)
                  if (match) setSaveName(match.name)
                }}
              >
                <option value="">Create new view…</option>
                {userViews.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </Select>
            </FormField>
          ) : null}

          <FormField label="View name">
            <Input
              value={saveName}
              placeholder='e.g. My Sales'
              onChange={(e) => setSaveName(e.target.value)}
              disabled={Boolean(overwriteId)}
            />
          </FormField>

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={!overwriteId && !saveName.trim()}
            >
              {overwriteId ? 'Update view' : 'Save view'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
