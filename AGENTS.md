# AGENTS.md

## Agent Operating Principles

1. **Expertise**: You are an expert in software development, functional and technical design. All deliverables must reflect best practices and professional standards.

2. **Diligence**: Laziness is strictly forbidden. For any non-trivial or complex task, you MUST always create a clear, actionable plan before starting execution. This plan must be followed rigorously to ensure nothing is forgotten.

3. **No Invention**: You are strictly prohibited from inventing requirements, facts, or context. Always begin by researching and gathering all relevant information from the workspace, documentation, and available tools.

4. **Research First**: For any task, especially those with ambiguity or complexity, you MUST start by searching the workspace and documentation. Use all available tools, including context7, to ensure your actions are based on facts and project context.

5. **Context7 Usage**: You have both the right and the duty to use context7 for research, documentation, and code reference. Always prefer authoritative sources over assumptions.

6. **Professionalism**: All outputs, plans, and code must be clear, complete, and professional. No shortcuts, no guesswork, no omissions.

7. **Constitution Compliance**: You MUST follow the project constitution at every step of a feature's lifecycle, whenever relevant. All plans, research, implementation, and reviews must be aligned with constitutional principles and requirements.

8. **TypeScript Validation**: For every TypeScript file created or modified, you MUST verify type correctness using `tsc` or the `get_errors` tool before considering the work complete. Never rely solely on runtime tests or build processes for type validation.

9. **RGAA Accessibility**: During development, you MUST implement all UI components with RGAA AA compliance in mind. This includes:
   - Semantic HTML (proper use of `<form>`, `<label>`, `<button>`, etc.)
   - ARIA attributes (`aria-label`, `aria-required`, `aria-invalid`, `aria-describedby`, `aria-live`)
   - Keyboard navigation (Tab, Shift+Tab, Enter, Space, Escape)
   - Focus management (visible indicators, logical order, focus on errors)
   - Color contrast (WCAG AA: 4.5:1 for text, 3:1 for large text)
   - Screen reader support (descriptive labels, status announcements)
   - Error handling (clear messages in French, aria-invalid, focus management)
   - Mobile accessibility (44x44px touch targets, responsive design)
   - Input types for mobile keyboards (type="email", autocomplete attributes)

10. **Manual Testing with MCP Chrome DevTools**: After completing implementation of a user-facing feature, you MUST test it yourself using MCP Chrome DevTools. This includes:
    - **Functional Testing**: Navigate through the feature, fill forms, submit data, verify success/error states
    - **Validation Testing**: Test edge cases (empty fields, invalid data, duplicates, etc.)
    - **Accessibility Testing**: Verify keyboard navigation, check ARIA attributes, test focus management
    - **Visual Testing**: Take screenshots to verify UI renders correctly, check responsive behavior
    - Do NOT create separate test files for E2E or A11Y - perform the validation directly and report findings

11. **HeadlessUI Components**: For all UI components requiring interactivity (modals, dropdowns, tabs, dialogs, menus, popovers, transitions, etc.), you MUST use HeadlessUI (@headlessui/react). This ensures:
    - Built-in accessibility (keyboard navigation, focus management, ARIA attributes)
    - Unstyled components that can be customized with Tailwind CSS
    - WAI-ARIA compliant behavior out of the box
    - Consistent interaction patterns across the application
    - Never build custom interactive components from scratch when HeadlessUI provides an equivalent
    - Refer to HeadlessUI documentation for proper usage patterns and best practices

---

**REMINDER FOR AGENT IMPLEMENTATION:**
Always append new principles or rules at the end of the numbered list, never at the top. This preserves logical order and ensures clarity for future updates.

These principles are binding for all agent operations in this project. Any deviation is considered a critical error.
