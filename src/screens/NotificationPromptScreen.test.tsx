import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

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

const renderNotificationFlow = () =>
  render(
    <MemoryRouter initialEntries={['/onboarding/notifications']}>
      <Routes>
        <Route path="/onboarding/notifications" element={<NotificationPromptScreen />} />
        <Route path="/onboarding/benefits" element={<div>BENEFITS_SCREEN</div>} />
      </Routes>
    </MemoryRouter>,
  )

describe('NotificationPromptScreen', () => {
  beforeEach(() => {
    resetAppProfile()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('activates notifications and persists granted preference', async () => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    })

    const requestPermission = vi.fn().mockResolvedValue('granted')

    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: {
        requestPermission,
      },
    })

    renderNotificationFlow()

    fireEvent.click(screen.getByRole('button', { name: /Ativar lembretes/i }))

    await waitFor(() => {
      expect(requestPermission).toHaveBeenCalledTimes(1)
      expect(screen.getByText(/Notificações ativadas\. Avançando/i)).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('BENEFITS_SCREEN')).toBeInTheDocument()
    })

    const profile = useAppStore.getState().profile
    expect(profile.notificationsRequested).toBe(true)
    expect(profile.notificationsGranted).toBe(true)
  })

  it('continues flow with warning when API is unavailable', async () => {
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: undefined,
    })

    renderNotificationFlow()

    fireEvent.click(screen.getByRole('button', { name: /Ativar lembretes/i }))

    await waitFor(() => {
      expect(screen.getByText(/não suporta notificações/i)).toBeInTheDocument()
    })
    await waitFor(
      () => {
        expect(screen.getByText('BENEFITS_SCREEN')).toBeInTheDocument()
      },
      { timeout: 1500 },
    )

    const profile = useAppStore.getState().profile
    expect(profile.notificationsRequested).toBe(true)
    expect(profile.notificationsGranted).toBe(false)
  })

  it('continues flow with warning when permission request throws', async () => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    })

    const requestPermission = vi.fn().mockRejectedValue(new Error('request failed'))

    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: {
        permission: 'default',
        requestPermission,
      },
    })

    renderNotificationFlow()

    fireEvent.click(screen.getByRole('button', { name: /Ativar lembretes/i }))

    await waitFor(() => {
      expect(requestPermission).toHaveBeenCalledTimes(1)
      expect(screen.getByText(/não foi possível ativar notificações/i)).toBeInTheDocument()
    })
    await waitFor(
      () => {
        expect(screen.getByText('BENEFITS_SCREEN')).toBeInTheDocument()
      },
      { timeout: 1500 },
    )

    const profile = useAppStore.getState().profile
    expect(profile.notificationsRequested).toBe(true)
    expect(profile.notificationsGranted).toBe(false)
  })
})
