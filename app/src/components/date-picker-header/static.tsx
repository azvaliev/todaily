import { CalendarIcon } from '@radix-ui/react-icons';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';
import { formatDateYYYYMMDD } from '@/lib/date';
import { DatePickerHeaderProps } from './types';

type StaticDatePickerHeaderProps = DatePickerHeaderProps & ButtonProps;

/**
 * Static date picker header that can be immediately loaded with low bundle size cost
 * Seperated from the full date picker so that can be lazily loaded in
 * */
const StaticDatePickerHeader = forwardRef<HTMLButtonElement, StaticDatePickerHeaderProps>(({
  date,
  setDate: _setDate,
  // Because this is the child for <PopoverTrigger asChild/> in the full date picker,
  // it will pass additional props. Need to make sure those make it to the <Button />
  ...props
}, ref) => (
  <Button
    variant="outline"
    className={cn(
      'w-[240px] justify-start text-left font-normal text-xl py-6',
      !date && 'text-muted-foreground',
    )}
    ref={ref}
    {...props}
  >
    <CalendarIcon className="mr-2 h-5 w-5" />
    <h1>{formatDateYYYYMMDD(date)}</h1>
  </Button>
));

export { StaticDatePickerHeader };
