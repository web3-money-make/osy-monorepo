import React from 'react';

export type Props = React.ComponentPropsWithoutRef<'div'>;

export default function Card({ className, ...props }: Props) {
  return (
    <div
      className={`min-h-[56px] min-w-[56px] p-6 border border-[#ffffff29] rounded-[4px] bg-[#0e062f] overflow-hidden backdrop-blur-md ${className}`}
      {...props}
    />
  );
}
