// features/memorials/components/RichTextEditor.tsx
// Simple rich text editor for biography field

'use client'

import { useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  maxLength = 10000
}: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  // Format text commands
  const formatText = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  // Handle paste to strip formatting
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }, [])

  // Handle content change
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      if (content.length <= maxLength) {
        onChange(content)
      }
    }
  }, [onChange, maxLength])

  return (
    <div className={cn(
      "border rounded-lg overflow-hidden transition-all",
      isFocused ? "border-marian-blue-500 ring-2 ring-marian-blue-500" : "border-gray-300"
    )}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => formatText('bold')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          aria-label="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => formatText('italic')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          aria-label="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => formatText('underline')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          aria-label="Underline"
        >
          <u>U</u>
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => formatText('insertUnorderedList')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          aria-label="Bullet list"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => formatText('insertOrderedList')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          aria-label="Numbered list"
        >
          1. List
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[200px] p-4 outline-none"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onInput={handleInput}
        onPaste={handlePaste}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      {/* Character count */}
      <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
        {value.length} / {maxLength} characters
      </div>
    </div>
  )
}