describe('authentication and profile flow', () => {
  it('registers, creates and edits a profile, then logs in again', () => {
    const email = `alya-${Date.now()}@example.com`
    const password = 'password-aman'

    cy.visit('/register')
    cy.get('input[aria-label="Nama lengkap"]').clear().type('Alya Putri')
    cy.get('input[aria-label="Alamat email"]').clear().type(email)
    cy.get('input[aria-label="Kata sandi"]').clear().type(password)
    cy.get('input[aria-label="Konfirmasi kata sandi"]')
      .clear()
      .type(password)
    cy.get('.terms-option input').check({ force: true })
    cy.contains('button', 'Buat akun').click()

    cy.url().should('include', '/profile/setup')
    cy.get('input[aria-label="Nama lengkap"]').should(
      'have.value',
      'Alya Putri',
    )
    cy.contains('button', 'Simpan & lihat rekomendasi').click()

    cy.url().should('include', '/app/home')
    cy.visit('/app/profile')
    cy.contains('h2', 'Alya Putri').should('be.visible')
    cy.contains(email).should('be.visible')

    cy.contains('button', 'Edit').click()
    cy.get('input[aria-label="Nama lengkap"]').clear().type('Alya P.')
    cy.get('input[aria-label="Berat badan"]').clear().type('55.5')
    cy.contains('button', 'Simpan perubahan').click()

    cy.url().should('include', '/app/profile')
    cy.contains('h2', 'Alya P.').should('be.visible')
    cy.contains('.body-metrics', '55.5').should('be.visible')

    cy.clearLocalStorage()
    cy.visit('/login')
    cy.get('input[aria-label="Alamat email"]').clear().type(email)
    cy.get('input[aria-label="Kata sandi"]').clear().type(password)
    cy.contains('button', 'Masuk').click()

    cy.url().should('include', '/app/home')
    cy.visit('/app/profile')
    cy.contains('h2', 'Alya P.').should('be.visible')
  })
})
