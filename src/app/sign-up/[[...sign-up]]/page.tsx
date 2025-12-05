import { SignUp } from '@clerk/nextjs';

/**
 * Sign Up Page
 * Clerk handles the complete registration flow
 */
export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[--cream]">
      <div className="w-full max-width-md">
        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-lg',
            },
          }}
          fallbackRedirectUrl="/staff/dashboard"
          signInFallbackRedirectUrl="/staff/dashboard"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}
