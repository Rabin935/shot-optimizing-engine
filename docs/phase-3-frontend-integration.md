# Phase 3 Frontend Integration

The sandbox now connects the Next.js frontend to the FastAPI prediction backend.

## Data Flow

1. The frontend keeps calculating court mechanics locally.
2. The sandbox builds a shot prediction request from shooter and defender positions.
3. The request is debounced before calling the backend.
4. FastAPI returns make probability, EPPS, shot quality, recommendation, and confidence.
5. The stats panel displays backend prediction values.

## Environment Variable

The frontend reads the backend URL from:

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Use `frontend/.env.local` for local development. The tracked `frontend/.env.example` file documents the required variable.

## Offline Fallback

If the backend is not running, the sandbox does not crash. It shows:

```text
Backend offline — using local estimate
```

The frontend then keeps using the Phase 2 local rule-based estimate until the backend is available again.
