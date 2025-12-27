# Testing Strategy for UI Features

## Overview

This project follows a pragmatic testing approach that balances automation with manual validation:

- **Unit Tests**: Automated via Jest (lib/, services, repositories)
- **Integration Tests**: Automated via Jest with real database (tests/integration/)
- **UI/UX Validation**: **Manual testing by agent** using MCP Chrome DevTools
- **Accessibility (RGAA)**: **Built-in during development** + manual validation by agent

## Why No E2E/A11Y Test Files?

We do NOT create separate test files for:
- E2E tests (tests/e2e/)
- Accessibility tests (tests/a11y/)

**Rationale**:
1. **RGAA compliance is proactive**: Accessibility is integrated during development, not tested after
2. **Manual testing is more thorough**: Agent validates UX with real browser interactions
3. **Maintenance burden**: Automated UI tests are brittle and require constant updates
4. **Better coverage**: Manual testing catches edge cases automated tests miss

## Development Workflow

### 1. Implementation Phase

When developing UI components, **always** implement with RGAA AA compliance:

**Semantic HTML**:
```tsx
// ✅ GOOD
<form onSubmit={handleSubmit}>
  <label htmlFor="email">Email</label>
  <input id="email" type="email" required />
</form>

// ❌ BAD
<div onClick={handleSubmit}>
  <span>Email</span>
  <div contentEditable />
</div>
```

**ARIA Attributes**:
```tsx
// ✅ GOOD
<input
  id="password"
  type="password"
  aria-label="Mot de passe"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? "password-error" : undefined}
/>
{hasError && (
  <span id="password-error" role="alert">
    Le mot de passe doit contenir au moins 8 caractères
  </span>
)}

// ❌ BAD
<input type="password" />
{hasError && <div>Error</div>}
```

**Keyboard Navigation**:
```tsx
// ✅ GOOD
<button type="submit">S'inscrire</button>
<button type="button" onClick={handleCancel}>Annuler</button>

// ❌ BAD
<div onClick={handleSubmit}>Submit</div>
```

**Focus Management**:
```tsx
// ✅ GOOD - Focus first error
useEffect(() => {
  if (errors.email) {
    emailInputRef.current?.focus()
  }
}, [errors])

// ❌ BAD - No focus management
```

### 2. Manual Testing Phase

After implementation, agent MUST test using MCP Chrome DevTools:

**Test Checklist**:

1. **Functional Tests**:
   - Navigate to feature URL
   - Fill all form fields
   - Submit with valid data → verify success
   - Submit with invalid data → verify errors
   - Test edge cases (duplicates, rate limits, etc.)

2. **Keyboard Navigation**:
   - Tab through all interactive elements
   - Verify logical focus order
   - Test Shift+Tab (reverse navigation)
   - Press Enter on buttons/links
   - Press Space on checkboxes/buttons
   - Press Escape on modals

3. **Accessibility Validation**:
   - Take snapshot to inspect ARIA attributes
   - Verify all inputs have labels
   - Verify error messages have role="alert"
   - Verify focus indicators are visible
   - Check color contrast (visual inspection)
   - Verify mobile responsiveness (resize viewport)

4. **Visual Validation**:
   - Take screenshots of key states
   - Verify layout on desktop (1920x1080)
   - Verify layout on mobile (375x667)
   - Check loading states
   - Check error states

**Example MCP Chrome Testing Session**:

```typescript
// 1. Navigate and take snapshot
await mcp_io_github_chr_navigate_page({ 
  type: 'url', 
  url: 'http://localhost:3000/auth/signup' 
})
const snapshot = await mcp_io_github_chr_take_snapshot({})

// 2. Fill form and submit
await mcp_io_github_chr_fill({ uid: 'email-input', value: 'test@example.com' })
await mcp_io_github_chr_fill({ uid: 'password-input', value: 'ValidPass123!' })
await mcp_io_github_chr_click({ uid: 'submit-button' })

// 3. Verify success message
await mcp_io_github_chr_wait_for({ text: 'Compte créé' })

// 4. Test keyboard navigation
await mcp_io_github_chr_press_key({ key: 'Tab' })
await mcp_io_github_chr_press_key({ key: 'Tab' })
// Verify focus order via snapshot

// 5. Test error states
await mcp_io_github_chr_fill({ uid: 'email-input', value: 'invalid-email' })
await mcp_io_github_chr_click({ uid: 'submit-button' })
// Verify error message appears with role="alert"

// 6. Take screenshots
await mcp_io_github_chr_take_screenshot({ filePath: 'signup-success.png' })
```

## Task Format in tasks.md

Manual validation tasks should be formatted as:

```markdown
**Manual Validation (US1)**:
- [ ] T043 [US1] Agent validates signup flow with MCP Chrome DevTools (valid data, duplicates, password strength)
- [ ] T044 [US1] Agent validates email verification flow with MCP Chrome DevTools
- [ ] T045 [US1] Agent validates RGAA compliance with MCP Chrome DevTools (keyboard nav, ARIA, contrast, screen reader)
```

**NOT** like this:
```markdown
**E2E Tests (US1)**:
- [ ] T043 Write E2E test in tests/e2e/auth/signup.spec.ts
```

## Reporting Validation Results

After manual testing, agent should:

1. **Mark task as complete** in tasks.md: `- [X] T043`
2. **Report findings** in a brief summary:
   - ✅ What works correctly
   - ❌ Any issues found
   - 📸 Screenshots saved (if any)
   - 🔧 Fixes applied (if issues found)

Example report:
```
✅ T043 Complete: Signup flow validated
- ✅ Form submission works with valid data
- ✅ Validation errors display correctly
- ✅ Duplicate email is rejected
- ✅ Keyboard navigation: Tab order is logical
- ✅ ARIA: All inputs have proper labels and aria-required
- ✅ Focus management: Focus moves to first error on validation
- ✅ Mobile: Form is responsive at 375px width
- ❌ Found issue: Password visibility toggle not keyboard accessible
- 🔧 Fixed: Added onKeyDown handler for Space/Enter keys
```

## Remember

- ✅ **DO**: Implement RGAA compliance during development
- ✅ **DO**: Test manually with MCP Chrome DevTools after implementation
- ✅ **DO**: Report validation results briefly
- ❌ **DON'T**: Create E2E test files in tests/e2e/
- ❌ **DON'T**: Create A11Y test files in tests/a11y/
- ❌ **DON'T**: Install E2E testing frameworks (Playwright, Cypress, etc.)
- ❌ **DON'T**: Install A11Y testing libraries (axe-core, jest-axe, etc.)

The goal is **shipping accessible, functional features** - not accumulating test files.
