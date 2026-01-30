---
name: code_auditor
description: Automatically scans and audits the project for syntax errors, build failures, and common issues in React/Next.js/TypeScript projects.
---

# Code Auditor Skill

This skill allows you to quickly audit the codebase for errors.

## Instructions

1.  **Check for Syntax Errors**:
    - Use `grep_search` to find common mistake patterns like `>>>>>>>` (git conflicts) or untranspiled characters.
    - Check for missing braces or unclosed tags in recently modified files.

2.  **Verify Layouts**:
    - Ensure `app/layout.tsx` has `<html>` and `<body>` tags.
    - Ensure `use client` directives are at the very top of client components.

3.  **Dependency Check**:
    - Check `package.json` for compatible versions if strange type errors occur.

4.  **Auto-Fix Strategy**:
    - If a file is persistently broken, use `view_file` to read it fully, then use `write_to_file` to overwrite it completely with a clean version. Do NOT use `replace_file_content` on broken files as it might fail to match corrupted context.

## Common Fixes

- **"Unexpected token"**: Usually a missing `}` or `)` in the previous modification.
- **"Return statement not allowed"**: Code written outside a function body.
- **"Hydration failed"**: HTML invalid nesting (e.g., `div` inside `p`).

## Usage

When the user says "audit" or "fix build", activate this skill and systematically check the core files:
- `app/layout.tsx`
- `app/page.tsx`
- `components/MainLayout.tsx`
- `constants.tsx`
- And the file reported in the error log.
