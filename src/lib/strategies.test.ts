import { describe, expect, test } from 'vitest'
import type { Rect } from './geometry.js'
import { grid, spatial, type Candidate } from './strategies.js'

const rect = ({
  x,
  y,
  width = 100,
  height = 40,
}: {
  x: number
  y: number
  width?: number
  height?: number
}): Rect => ({ left: x, top: y, right: x + width, bottom: y + height })

const candidate = ({
  name,
  ...position
}: { name: string } & Parameters<typeof rect>[0]) =>
  ({
    element: { name } as unknown as HTMLElement,
    rect: rect(position),
  }) satisfies Candidate

const names = (items: Candidate[]) =>
  items.map(({ element }) => (element as unknown as { name: string }).name)

const origin = rect({ x: 0, y: 0 })

describe('spatial', () => {
  test('right stays in the row even if elements are not exactly aligned', () => {
    const ranked = spatial({
      origin,
      direction: 'right',
      candidates: [
        candidate({ name: 'row above', x: 110, y: -45 }),
        candidate({ name: 'same row', x: 120, y: 10 }),
      ],
    })
    expect(names(ranked)).toEqual(['same row', 'row above'])
    expect(ranked.every(({ withinReach }) => withinReach)).toBe(true)
  })

  test('down prefers the element below over one that is offset to the side', () => {
    const ranked = spatial({
      origin,
      direction: 'down',
      candidates: [
        candidate({ name: 'offset', x: 150, y: 80 }),
        candidate({ name: 'below', x: 0, y: 100 }),
      ],
    })
    expect(names(ranked)).toEqual(['below', 'offset'])
  })

  test('down picks a closer row even if it is offset to the side', () => {
    const ranked = spatial({
      origin,
      direction: 'down',
      candidates: [
        candidate({ name: 'far below', x: 0, y: 200 }),
        candidate({ name: 'next row', x: 150, y: 60 }),
      ],
    })
    expect(names(ranked)[0]).toBe('next row')
  })

  test('elements in the opposite direction are not within reach', () => {
    const ranked = spatial({
      origin,
      direction: 'left',
      candidates: [candidate({ name: 'right', x: 200, y: 0 })],
    })
    expect(ranked).toMatchObject([{ withinReach: false }])
  })

  test('wide elements below are reachable from a narrow element', () => {
    const ranked = spatial({
      origin: rect({ x: 300, y: 0, width: 50 }),
      direction: 'down',
      candidates: [candidate({ name: 'wide', x: 0, y: 60, width: 600 })],
    })
    expect(ranked).toMatchObject([{ withinReach: true }])
  })
})

describe('grid', () => {
  test('right stays in the row even if elements are not exactly aligned', () => {
    const ranked = grid({
      origin,
      direction: 'right',
      candidates: [
        candidate({ name: 'row above', x: 110, y: -45 }),
        candidate({ name: 'same row', x: 120, y: 10 }),
      ],
    })
    expect(ranked.filter(({ withinReach }) => withinReach)).toHaveLength(1)
    expect(names(ranked)[0]).toBe('same row')
  })

  test('down jumps to the nearest row, then the nearest column', () => {
    const ranked = grid({
      origin,
      direction: 'down',
      candidates: [
        candidate({ name: 'row 2 far', x: 400, y: 60 }),
        candidate({ name: 'row 3', x: 0, y: 120 }),
        candidate({ name: 'row 2 near', x: 150, y: 60 }),
      ],
    })
    expect(names(ranked)).toEqual(['row 2 near', 'row 2 far', 'row 3'])
  })
})
