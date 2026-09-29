/** Blank placeholder while the session is restored or a guard is redirecting — avoids flashing a page the user can't use. */
export default function PageSkeleton() {
  return <div className="flex-1 bg-zinc-50 dark:bg-black" />;
}
