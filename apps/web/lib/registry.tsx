'use client'

import React from 'react'
import { ServerStyleSheet, StyleSheetManager } from 'styled-components'

export default function StyledComponentsRegistry({
  children,
}: {
  children: React.ReactNode
}) {
  const [styledComponentsStyleSheet] = React.useState(() => new ServerStyleSheet())

  React.useLayoutEffect(() => {
    return () => styledComponentsStyleSheet.seal()
  }, [styledComponentsStyleSheet])

  if (typeof window !== 'undefined') return <>{children}</>

  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
      {children}
    </StyleSheetManager>
  )
}
