# Project-Specific SuperClaude Configuration

This file enables automatic loading of project-specific development guidelines.

## Auto-Load Files

@PRINCIPLES.md
@RULES.md
@CURRENT_PHASE.md
@ORCHESTRATOR.md
@DEVELOPMENT_CHECKLIST.md

## Project Context

- **Project**: ownership_ai (1인 컨설턴트용 정부지원사업 AI 매칭 플랫폼)
- **Tech Stack**: Next.js 15, Supabase, Prisma, TypeScript, TailwindCSS, shadcn/ui
- **Current Phase**: Phase 2 - 고객 관리 기능 (CRUD API + UI 컴포넌트)

## Important Reminders

- ALWAYS follow TypeScript Strict Type Principles (NO `any` type)
- MANDATORY: Update CURRENT_PHASE.md after completing each ISSUE
- MUST notify user when Phase is completed
- Use standard API response format for all endpoints
- Apply Zod validation to all API inputs
