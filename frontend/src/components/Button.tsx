'use client';

export type Props = React.ComponentPropsWithoutRef<'button'> & {
  readonly?: boolean;
};

export default function Button({
  className,
  disabled,
  readonly,
  ...props
}: Props) {
  return (
    <button
      className={`select-none rounded-[4px] border-transparent flex items-center justify-center bg-action text-foreground gap-1 font-medium text-xs h-8 px-8 ${disabled || readonly ? `${disabled ? 'opacity-50 cursor-disallow ' : ''}pointer-events-none` : 'hover:bg-[#6038b5] cursor-pointer'} ${className}`}
      {...props}
    />
  );
}
