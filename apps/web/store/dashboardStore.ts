import { create } from 'zustand'

interface DashboardStore {
  // Selected channel
  selectedChannelId: string | null
  setSelectedChannelId: (id: string | null) => void

  // Selected post (drives right panel open/closed)
  selectedPostId: string | null
  setSelectedPostId: (id: string | null) => void
  clearSelectedPost: () => void

  // Composer
  isComposerExpanded: boolean
  setComposerExpanded: (expanded: boolean) => void

  // Mobile left drawer
  isLeftDrawerOpen: boolean
  setLeftDrawerOpen: (open: boolean) => void

  // Schedule dialog
  isScheduleDialogOpen: boolean
  setScheduleDialogOpen: (open: boolean) => void
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  // null → no real channel selected yet; LeftPanel auto-selects the first one.
  selectedChannelId: null,
  setSelectedChannelId: (id) => set({ selectedChannelId: id }),

  selectedPostId: null,
  setSelectedPostId: (id) => set({ selectedPostId: id }),
  clearSelectedPost: () => set({ selectedPostId: null }),

  isComposerExpanded: false,
  setComposerExpanded: (expanded) => set({ isComposerExpanded: expanded }),

  isLeftDrawerOpen: false,
  setLeftDrawerOpen: (open) => set({ isLeftDrawerOpen: open }),

  isScheduleDialogOpen: false,
  setScheduleDialogOpen: (open) => set({ isScheduleDialogOpen: open }),
}))
