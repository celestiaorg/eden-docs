'use client'

import { useState, useEffect } from 'react'
import { useCopy } from 'nextra/hooks'
import { Button, Select } from 'nextra/components'
import { ArrowRightIcon, ChatGPTIcon, ClaudeIcon, CopyIcon, LinkArrowIcon } from 'nextra/icons'
import cn from 'clsx'

const Item = ({ icon: Icon, title, description, isExternal }) => (
  <div className="x:flex x:gap-3 x:items-center">
    <Icon width="16" />
    <div className="x:flex x:flex-col">
      <span className="x:font-medium x:flex x:gap-1">
        {title}
        {isExternal && <LinkArrowIcon height="1em" />}
      </span>
      <span className="x:text-xs">{description}</span>
    </div>
  </div>
)

const CopyPage = () => {
  const { copy, isCopied } = useCopy()
  const [pageContent, setPageContent] = useState('')

  useEffect(() => {
    // Get the current page content from the main element
    const getPageContent = () => {
      const mainElement = document.querySelector('main[data-pagefind-body]')
      if (mainElement) {
        // Convert HTML to markdown-like text
        const content = mainElement.textContent || ''
        return content.trim()
      }
      return ''
    }

    setPageContent(getPageContent())
  }, [])

  const handleCopy = () => {
    copy(pageContent)
  }

  const options = [
    {
      id: 'copy',
      name: <Item icon={CopyIcon} title="Copy page" description="Copy page as Markdown for LLMs" />
    },
    {
      id: 'chatgpt',
      name: <Item icon={ChatGPTIcon} title="Open in ChatGPT" description="Ask questions about this page" isExternal />
    },
    {
      id: 'claude',
      name: <Item icon={ClaudeIcon} title="Open in Claude" description="Ask questions about this page" isExternal />
    }
  ]

  const handleSelectChange = (value) => {
    if (value === 'copy') {
      handleCopy()
      return
    }
    const url = value === 'chatgpt' ? 'chatgpt.com/?hints=search&prompt' : 'claude.ai/new?q'
    const query = `Read from ${location.href} so I can ask questions about it.`
    window.open(`https://${url}=${encodeURIComponent(query)}`, '_blank')
  }

  return (
    <div className="x:border x:inline-flex x:rounded-md x:items-stretch nextra-border x:float-end x:overflow-hidden">
      <Button
        className={cn(
          'x:ps-2 x:pe-1 x:flex x:gap-2 x:text-sm x:font-medium x:items-center',
          isCopied && 'x:opacity-70'
        )}
        onClick={handleCopy}
      >
        <CopyIcon width="16" />
        {isCopied ? 'Copied' : 'Copy page'}
      </Button>
      <Select
        anchor={{ to: 'bottom end', gap: 10 }}
        className="x:rounded-none"
        options={options}
        value=""
        selectedOption={<ArrowRightIcon width="12" className="x:rotate-90" />}
        onChange={handleSelectChange}
      />
    </div>
  )
}

export default CopyPage