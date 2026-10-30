export type Direction = 'up' | 'down' | 'left' | 'right'

const directionsByKey: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

export const getDirection = ({ key }: { key: string }) => directionsByKey[key]

export const isVertical = ({ direction }: { direction: Direction }) =>
  direction === 'up' || direction === 'down'

export const isForward = ({ direction }: { direction: Direction }) =>
  direction === 'down' || direction === 'right'
