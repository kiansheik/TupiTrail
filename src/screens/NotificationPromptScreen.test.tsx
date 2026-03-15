import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { NotificationPromptScreen } from '@/screens/NotificationPromptScreen'
import { useAppStore } from '@/store/useAppStore'

const resetAppProfile = () => {
  useAppStore.setState((state) => ({
    profile: {
      ...state.profile,
      notificationsRequested: false,
      notificationsGranted: false,
    },
  }))
}

describe('NotificationPromptScreen', () => {
  beforeEach(() => {
    resetAppProfile()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('activates notifications and persists granted preference', async () => {
    const requestPermission = vi.fn().mockResolvedValue('granted')

    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: {
        requestPermission,
      },
    })

    render(
      <MemoryRouter>
        <NotificationPromptScreen />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /Ativar lembretes/i }))

    await waitFor(() => {
      expect(requestPermission).toHaveBeenCalledTimes(1)
      expect(screen.getByText(/Notificações ativadas\. Avançando/i)).toBeInTheDocument()
    })

    const profile = useAppStore.getState().profile
    expect(profile.notificationsRequested).toBe(true)
    expect(profile.notificationsGranted).toBe(true)
  })
})
