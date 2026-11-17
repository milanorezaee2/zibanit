'use client';

import { useActionState } from 'react';
import { signInAction } from '@/app/admin/login/actions';
import { Field, Input } from '@/components/ui/field';
import type { FormState } from '@/lib/validation/specimen';

const INITIAL: FormState = { status: 'idle' };

/**
 * The sign-in form.
 *
 * A client component only because `useActionState` is how a Server Action reports
 * a field error back into a form; the credential check itself never leaves the
 * server. The button disables while the action is pending, so a double click cannot
 * open two sessions.
 */
export function LoginForm({ destination }: { destination: string }) {
  const [state, formAction, pending] = useActionState(signInAction, INITIAL);

  return (
    <form action={formAction} className="mt-7" noValidate>
      <input type="hidden" name="next" value={destination} />

      <Field id="email" label="ایمیل" required>
        <Input
          id="email"
          name="email"
          type="email"
          dir="ltr"
          autoComplete="username"
          required
          defaultValue={state.values?.email ?? ''}
          aria-invalid={state.status === 'error' ? true : undefined}
          className="text-start"
        />
      </Field>

      <Field id="password" label="گذرواژه" required>
        <Input
          id="password"
          name="password"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          required
          aria-invalid={state.status === 'error' ? true : undefined}
          className="text-start"
        />
      </Field>

      {state.status === 'error' && state.message && (
        <p role="alert" className="mb-5 rounded-lg border border-red-400/25 bg-red-500/10 px-3.5 py-2.5 text-[12.5px] text-red-200">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-vitrine bg-gold-500 px-6 text-small font-medium text-obsidian-950 transition-colors hover:bg-gold-400 disabled:opacity-50"
      >
        {pending ? 'در حال ورود…' : 'ورود'}
      </button>
    </form>
  );
}
