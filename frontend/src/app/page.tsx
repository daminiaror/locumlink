import { redirect } from 'next/navigation';

// Root "/" just forwards to the landing page.
// The middleware only guards /host/* and /locum/*, so this is always public.
export default function Root() {
  redirect('/home');
}
