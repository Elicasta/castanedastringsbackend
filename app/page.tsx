import { redirect } from 'next/navigation';

/**
 * Stand-in for the real marketing site, which is explicitly deferred.
 * Anyone landing on the bare domain goes straight to the inquiry form
 * instead of hitting a 404. When the actual homepage gets built, this
 * file is what gets replaced — the redirect is the whole implementation
 * on purpose, nothing to maintain here in the meantime.
 */
export default function RootPage() {
  redirect('/inquire');
}
