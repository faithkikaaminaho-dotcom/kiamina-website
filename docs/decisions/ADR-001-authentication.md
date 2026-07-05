# ADR-001: Authentication

## Status

Accepted

## Decision

Kiamina Platform uses Supabase Authentication for user login, session management, and identity foundation.

## Reason

Supabase provides:

- Email/password authentication
- Secure session handling
- Integration with PostgreSQL
- Row Level Security support
- Fast development with future scalability

## Current Roles

- Super Admin
- Administrator
- Staff
- Client

## Future Direction

The platform will evolve from role-based access toward a permission-based model where roles group permissions, but individual permissions can be configured as needed.