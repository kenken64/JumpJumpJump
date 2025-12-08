import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock react-dom/client
const renderMock = vi.fn()
const createRootMock = vi.fn(() => ({ render: renderMock }))

vi.mock('react-dom/client', () => ({
  createRoot: createRootMock
}))

// Mock App component
vi.mock('../App', () => ({
  default: () => <div>Mock App</div>
}))

describe('Main Entry Point', () => {
  beforeEach(() => {
    // Setup DOM element
    document.body.innerHTML = '<div id="root"></div>'
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders App component into root element', async () => {
    // Import main to execute it
    await import('../main')

    const root = document.getElementById('root')
    expect(createRootMock).toHaveBeenCalledWith(root)
    expect(renderMock).toHaveBeenCalled()
  })
})
