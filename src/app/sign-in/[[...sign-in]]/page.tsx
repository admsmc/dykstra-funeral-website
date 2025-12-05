import { SignIn } from '@clerk/nextjs';

/**
 * Sign In Page
 * Clerk handles the complete authentication flow
 */
export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[--cream]">
      <div className="w-full max-width-md">
        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-lg',
            },
          }}
          fallbackRedirectUrl="/staff/dashboard"
          signUpFallbackRedirectUrl="/staff/dashboard"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  );
}
