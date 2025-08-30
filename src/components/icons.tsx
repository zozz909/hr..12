import { Briefcase } from 'lucide-react';

export function Logo({ isCollapsed }: { isCollapsed?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-2 text-xl font-bold text-primary">
      <Briefcase className="h-6 w-6" />
      {!isCollapsed && <span className="font-headline">مساعد الموارد البشرية</span>}
    </div>
  );
}
