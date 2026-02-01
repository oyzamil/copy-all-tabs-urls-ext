import { StarIcon } from '@/icons';
import { Tooltip } from 'antd';

type FieldSetProps = {
  label: string | React.ReactNode;
  children: React.ReactNode;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
  premium?: boolean;
  labelClassName?: string;
  iconClassName?: string;
  childrenClassName?: string;
};

export function FieldSet({
  label,
  children,
  orientation = 'horizontal',
  className,
  premium,
  labelClassName,
  iconClassName,
  childrenClassName,
}: FieldSetProps) {
  return (
    <Tooltip title={premium && i18n.t('premiumFeature')}>
      <fieldset
        className={cn(
          'grid',
          orientation === 'vertical' ? 'grid-cols-1 gap-1' : 'grid-cols-2 items-center px-2 py-2',
          premium ? 'cursor-not-allowed' : 'cursor-default',
          className
        )}
      >
        <div className={cn('flex items-center gap-1 text-[14px] font-semibold', labelClassName)}>
          <span className={cn('whitespace-nowrap')}>{label}</span>
          {premium && (
            <span>
              <StarIcon className={cn('lock-theme size-[12px]', iconClassName)} />
            </span>
          )}
        </div>
        <div className={cn('flex w-full justify-end', childrenClassName)}>{children}</div>
      </fieldset>
    </Tooltip>
  );
}
