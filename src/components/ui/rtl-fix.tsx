'use client';

import { useEffect } from 'react';

/**
 * RTL Fix Component
 * يصلح مشاكل التصميم الشائعة في البيئة العربية
 */
export function RTLFix() {
  useEffect(() => {
    // إصلاح اتجاه الأيقونات
    const fixIcons = () => {
      const icons = document.querySelectorAll('[data-lucide]');
      icons.forEach((icon) => {
        const iconName = icon.getAttribute('data-lucide');
        if (iconName && ['chevron-left', 'chevron-right', 'arrow-left', 'arrow-right'].includes(iconName)) {
          icon.classList.add('rtl-flip');
        }
      });
    };

    // إصلاح تخطيط الجداول
    const fixTables = () => {
      const tables = document.querySelectorAll('table');
      tables.forEach((table) => {
        table.style.direction = 'rtl';
      });
    };

    // إصلاح النماذج
    const fixForms = () => {
      const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea');
      inputs.forEach((input) => {
        (input as HTMLElement).style.textAlign = 'right';
      });
    };

    // إصلاح القوائم المنسدلة
    const fixDropdowns = () => {
      const dropdowns = document.querySelectorAll('[role="menu"], [role="listbox"]');
      dropdowns.forEach((dropdown) => {
        (dropdown as HTMLElement).style.textAlign = 'right';
      });
    };

    // تطبيق الإصلاحات
    fixIcons();
    fixTables();
    fixForms();
    fixDropdowns();

    // مراقبة التغييرات في DOM
    const observer = new MutationObserver(() => {
      fixIcons();
      fixTables();
      fixForms();
      fixDropdowns();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}

/**
 * Arabic Text Component
 * مكون لعرض النصوص العربية بشكل صحيح
 */
interface ArabicTextProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function ArabicText({ children, className = '', as: Component = 'span' }: ArabicTextProps) {
  return (
    <Component 
      className={`font-arabic text-right ${className}`}
      dir="rtl"
    >
      {children}
    </Component>
  );
}

/**
 * Arabic Number Component
 * مكون لعرض الأرقام العربية بشكل صحيح
 */
interface ArabicNumberProps {
  value: number | string;
  className?: string;
  format?: 'arabic' | 'english';
}

export function ArabicNumber({ value, className = '', format = 'english' }: ArabicNumberProps) {
  const formatNumber = (num: number | string) => {
    const numStr = num.toString();
    
    if (format === 'arabic') {
      // تحويل الأرقام الإنجليزية إلى عربية
      const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      return numStr.replace(/[0-9]/g, (digit) => arabicNumbers[parseInt(digit)]);
    }
    
    // تنسيق الأرقام الإنجليزية مع فواصل
    if (typeof num === 'number') {
      return num.toLocaleString('en-US');
    }
    
    return numStr;
  };

  return (
    <span className={`arabic-numbers ${className}`} dir="ltr">
      {formatNumber(value)}
    </span>
  );
}

/**
 * RTL Container Component
 * حاوي لضمان الاتجاه الصحيح للمحتوى
 */
interface RTLContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function RTLContainer({ children, className = '' }: RTLContainerProps) {
  return (
    <div className={`rtl-container ${className}`} dir="rtl">
      {children}
    </div>
  );
}

/**
 * Responsive Arabic Grid
 * شبكة متجاوبة محسنة للنصوص العربية
 */
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ResponsiveGrid({ 
  children, 
  cols = 1, 
  gap = 'md', 
  className = '' 
}: ResponsiveGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    12: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6',
  };

  const gapSizes = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  return (
    <div 
      className={`grid ${gridCols[cols]} ${gapSizes[gap]} ${className}`}
      dir="rtl"
    >
      {children}
    </div>
  );
}

/**
 * Arabic Card Component
 * بطاقة محسنة للمحتوى العربي
 */
interface ArabicCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
}

export function ArabicCard({ title, children, className = '', headerActions }: ArabicCardProps) {
  return (
    <div className={`bg-card text-card-foreground rounded-lg border shadow-sm ${className}`} dir="rtl">
      {title && (
        <div className="flex items-center justify-between p-6 pb-2">
          <h3 className="text-lg font-semibold font-arabic">{title}</h3>
          {headerActions}
        </div>
      )}
      <div className="p-6 pt-0">
        {children}
      </div>
    </div>
  );
}

/**
 * Loading Spinner with Arabic Text
 * مؤشر التحميل مع نص عربي
 */
interface ArabicLoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ArabicLoading({ text = 'جاري التحميل...', size = 'md' }: ArabicLoadingProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex items-center justify-center gap-2" dir="rtl">
      <div className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${sizes[size]}`} />
      <span className="text-sm text-muted-foreground font-arabic">{text}</span>
    </div>
  );
}
