import { useEffect, useRef, useState } from 'react'

import { Textarea } from '@/components/ui/textarea'

interface AutoSaveTextareaProps
  extends Omit<
    React.ComponentProps<typeof Textarea>,
    'value' | 'onChange' | 'onBlur' | 'defaultValue'
  > {
  initialValue: string
  onSave: (value: string) => void | Promise<void>
}

export function AutoSaveTextarea({
  initialValue,
  onSave,
  ...props
}: AutoSaveTextareaProps) {
  const [value, setValue] = useState(initialValue)
  const valueRef = useRef(initialValue)
  const lastSavedRef = useRef(initialValue)
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = event.target.value
    setValue(next)
    valueRef.current = next
  }

  function flush() {
    const current = valueRef.current
    if (current !== lastSavedRef.current) {
      lastSavedRef.current = current
      void onSaveRef.current(current)
    }
  }

  useEffect(() => {
    return () => flush()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Textarea
      value={value}
      onChange={handleChange}
      onBlur={flush}
      {...props}
    />
  )
}
