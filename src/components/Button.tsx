import type { ButtonProps } from 'antd';
import { Button as AntdButton, Tooltip } from 'antd';
import type { TooltipProps } from 'antd/es/tooltip';
import React from 'react';

type TooltipContent = React.ReactNode;
type TooltipConfig = Omit<TooltipProps, 'children'>;

interface ButtonWithTooltipProps extends ButtonProps {
  tooltip?: TooltipContent | TooltipConfig;
  rainbowBorder?: boolean;
  lightBorder?: string;
  darkBorder?: string;
}

const Button: React.FC<ButtonWithTooltipProps> = ({
  rainbowBorder = false,
  lightBorder = '#000',
  darkBorder = '#fff',
  tooltip,
  ...buttonProps
}) => {
  const { className, rootClassName, block, ...rest } = buttonProps;

  const baseButton = (
    <AntdButton
      className={cn('flex w-auto items-center', block && 'w-full', className)}
      {...rest}
    />
  );

  const wrappedButton = rainbowBorder ? (
    <RainbowBorder
      className={cn(rootClassName, block && 'w-full')}
      lightBorder={lightBorder}
      darkBorder={darkBorder}
    >
      <AntdButton className={cn('flex h-7 items-center border-none pb-1', className)} {...rest} />
    </RainbowBorder>
  ) : (
    baseButton
  );

  if (!tooltip) return wrappedButton;

  return typeof tooltip === 'object' && !React.isValidElement(tooltip) ? (
    <Tooltip {...tooltip}>{wrappedButton}</Tooltip>
  ) : (
    <Tooltip title={tooltip}>{wrappedButton}</Tooltip>
  );
};

export default Button;

/* -------------------------------------------------------------------------- */

interface RainbowBorderProps {
  children: React.ReactNode;
  className?: string;
  lightBorder?: string;
  darkBorder?: string;
}

export const RainbowBorder: React.FC<RainbowBorderProps> = ({
  children,
  className,
  lightBorder = '#000',
  darkBorder = '#fff',
}) => {
  const style = {
    '--light-bg': lightBorder,
    '--dark-bg': darkBorder,
  } as React.CSSProperties;

  return (
    <div className={cn('rainbow-border', className)} style={style}>
      <div className="rainbow-border-glow" />
      {children}
    </div>
  );
};
