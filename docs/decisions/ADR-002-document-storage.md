# ADR-002: Document Storage

## Status

Accepted

## Decision

Kiamina Platform stores client documents in private Google Cloud Storage buckets.

## Reason

Google Cloud Storage provides:

- Private object storage
- Enterprise-grade durability
- Audit logging
- Versioning
- Soft delete
- Secure server-side access

## Security Principle

Documents must never be publicly accessible.

All preview and download access must go through authenticated server-side routes.

## Current Implementation

- Documents upload through a protected API route.
- Metadata is saved in Supabase.
- Preview and download are streamed through the application.
- Audit logs record document actions.

## Future Direction

The platform may later support:

- Object lifecycle policies
- Legal hold
- Retention rules
- Multi-region storage
- Advanced DLP scanning