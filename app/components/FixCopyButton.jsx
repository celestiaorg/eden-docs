'use client'

import { useEffect } from 'react'

export default function FixCopyButton() {
  useEffect(() => {
    const fixButton = () => {
      // Find the first button in the copy page component
      const button = document.querySelector(
        'article > div[class*="border"][class*="inline-flex"] button:first-child'
      )

      if (button && !button.dataset.fixed) {
        button.dataset.fixed = 'true'

        // Clone the button to remove existing event listeners
        const newButton = button.cloneNode(true)
        button.parentNode.replaceChild(newButton, button)

        // Add new click handler for ChatGPT
        newButton.addEventListener('click', e => {
          e.preventDefault()
          e.stopPropagation()
          const query = `Read from ${location.href} so I can ask questions about it.`
          window.open(
            `https://chatgpt.com/?hints=search&prompt=${encodeURIComponent(query)}`,
            '_blank'
          )
        })

        // Remove the copy icon
        const existingSvg = newButton.querySelector('svg')
        if (existingSvg) {
          existingSvg.style.display = 'none'
        }

        // Update the button text
        const textNodes = newButton.childNodes
        textNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('Copy page')) {
            node.textContent = '🤖 Open in ChatGPT'
          }
          // Also check for "Copied" text (after clicking)
          if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('Copied')) {
            node.textContent = '🤖 Open in ChatGPT'
          }
        })
      }
    }

    // Run immediately
    fixButton()

    // Also run on DOM changes (for client-side navigation)
    const observer = new MutationObserver(fixButton)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  return null
}
