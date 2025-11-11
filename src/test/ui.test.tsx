/**
 * Component tests for UI components
 * Tests React components with Testing Library
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should handle click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={handleClick}>Click me</Button>)

    await user.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>)
    expect(screen.getByText('Disabled Button')).toBeDisabled()
  })

  it('should apply variant classes correctly', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>)
    const button = container.firstChild as HTMLElement
    expect(button.classList.contains('bg-destructive')).toBe(true)
  })

  it('should apply size classes correctly', () => {
    const { container } = render(<Button size="lg">Large Button</Button>)
    const button = container.firstChild as HTMLElement
    expect(button.classList.contains('h-11')).toBe(true)
  })

  it('should render as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )
    expect(screen.getByRole('link')).toBeInTheDocument()
    expect(screen.getByText('Link Button')).toBeInTheDocument()
  })

  it('should support different button variants', () => {
    const { rerender, container } = render(<Button variant="default">Default</Button>)
    expect(container.firstChild).toBeTruthy()

    rerender(<Button variant="secondary">Secondary</Button>)
    expect(container.firstChild).toBeTruthy()

    rerender(<Button variant="outline">Outline</Button>)
    expect(container.firstChild).toBeTruthy()

    rerender(<Button variant="ghost">Ghost</Button>)
    expect(container.firstChild).toBeTruthy()
  })

  it('should support different button sizes', () => {
    const { rerender, container } = render(<Button size="default">Default Size</Button>)
    expect(container.firstChild).toBeTruthy()

    rerender(<Button size="sm">Small Size</Button>)
    expect(container.firstChild).toBeTruthy()

    rerender(<Button size="lg">Large Size</Button>)
    expect(container.firstChild).toBeTruthy()

    rerender(<Button size="icon">Icon</Button>)
    expect(container.firstChild).toBeTruthy()
  })

  it('should merge custom className with default classes', () => {
    const { container } = render(<Button className="custom-class">Custom</Button>)
    const button = container.firstChild as HTMLElement
    expect(button.classList.contains('custom-class')).toBe(true)
  })

  it('should pass through standard button props', () => {
    render(<Button type="submit" name="submitBtn">Submit</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'submit')
    expect(button).toHaveAttribute('name', 'submitBtn')
  })
})
