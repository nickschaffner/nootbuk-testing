// ─────────────────────────────────────────────────────────────────────────
// Liner Notes UI Kit — barrel export.
// Standalone, presentational components. No app logic, no data layer.
// Import in the app as:  import { Button, IdeaCard } from '@/components/kit'
// ─────────────────────────────────────────────────────────────────────────

export { cn } from './cn'
export * from './options'

export { Button } from './Button'
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button'

export { IconButton } from './IconButton'
export type { IconButtonProps, IconButtonShape, IconButtonVariant, IconButtonSize } from './IconButton'

export { RecordButton } from './RecordButton'
export type { RecordButtonProps, RecordButtonSize } from './RecordButton'

export { PlayButton } from './PlayButton'
export type { PlayButtonProps } from './PlayButton'

export { SegmentedControl } from './SegmentedControl'
export type { SegmentedControlProps } from './SegmentedControl'

export { TabSwitcher } from './TabSwitcher'
export type { TabSwitcherProps } from './TabSwitcher'

export { Toggle } from './Toggle'
export type { ToggleProps } from './Toggle'

export { Chip, Badge, Length } from './Chip'
export type { ChipProps, ChipTone, BadgeProps, LengthProps } from './Chip'

export { Pick } from './Pick'
export type { PickProps } from './Pick'

export { MonoLabel, Input, Textarea, Field, Checkbox, Radio } from './Field'
export type { FieldProps } from './Field'

export { SearchBar } from './SearchBar'
export type { SearchBarProps } from './SearchBar'

export { Panel, Recess, Window, RedBar, EmptyState } from './Surfaces'
export type { PanelRaised } from './Surfaces'

export { RuleHeader } from './RuleHeader'
export type { RuleHeaderProps } from './RuleHeader'

export { PageHeader } from './PageHeader'
export type { PageHeaderProps } from './PageHeader'

export { Noise } from './Noise'
export type { NoiseProps, NoiseVariant } from './Noise'

export { StudioBar } from './StudioBar'
export type { StudioBarProps } from './StudioBar'

export { CaptureStudioStack } from './CaptureStudioStack'
export type { CaptureStudioStackProps } from './CaptureStudioStack'

export { CaptureModeTabs } from './CaptureModeTabs'
export type { CaptureModeTabsProps } from './CaptureModeTabs'

export { OnScreenKeyboard } from './OnScreenKeyboard'
export type { OnScreenKeyboardProps } from './OnScreenKeyboard'

export { BeatLane } from './BeatLane'
export type { BeatLaneProps, BeatBlock } from './BeatLane'

export { StatusStepper } from './StatusStepper'
export type { StatusStepperProps } from './StatusStepper'

export { TodoRow } from './TodoRow'
export type { TodoRowProps } from './TodoRow'

export { AudioVersionRow } from './AudioVersionRow'
export type { AudioVersionRowProps } from './AudioVersionRow'

export { IdeaCard, QUICK_PLAY_SOURCES } from './IdeaCard'
export type { IdeaCardProps, MediaKind } from './IdeaCard'

export { IdeaRow } from './IdeaRow'
export type { IdeaRowProps } from './IdeaRow'

export { SongRow } from './SongRow'
export type { SongRowProps } from './SongRow'

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableActions,
} from './Table'
export type { TableProps, TableHeadProps, TableSort, TableSortDirection } from './Table'

export { Menu } from './Menu'
export type { MenuProps, MenuOption, MenuItem } from './Menu'

export { SongCard } from './SongCard'
export type { SongCardProps } from './SongCard'

export { AlbumCard, EmptyLibraryCard } from './LibraryCards'
export type {
  AlbumCardProps,
  EmptyLibraryCardProps,
} from './LibraryCards'
